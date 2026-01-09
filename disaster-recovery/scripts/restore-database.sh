#!/bin/bash
#
# Database Restore Script
# Restores PostgreSQL databases from encrypted backups
#

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/medi-aide}"
S3_BUCKET="${S3_BUCKET:-medi-aide-backups-ca-central-1}"
ENCRYPTION_KEY="${ENCRYPTION_KEY_FILE:-/etc/medi-aide/backup-key}"
RESTORE_DIR="${RESTORE_DIR:-/tmp/medi-aide-restore}"

# Database connection
DB_HOST="${DB_HOST:-stage3-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-restore_user}"

# Restore options
TIMESTAMP="${1:-}"
DATABASE="${2:-all}"
DRY_RUN="${DRY_RUN:-false}"
SKIP_CONFIRMATION="${SKIP_CONFIRMATION:-false}"

# Logging
LOG_FILE="/tmp/restore_$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

usage() {
    cat <<EOF
Usage: $0 <timestamp> [database]

Arguments:
  timestamp   Backup timestamp to restore (e.g., 20240115_103000)
  database    Specific database to restore, or 'all' (default: all)

Options:
  DRY_RUN=true              Show what would be done without executing
  SKIP_CONFIRMATION=true    Skip confirmation prompt

Examples:
  $0 20240115_103000                    # Restore all databases
  $0 20240115_103000 agency_db          # Restore specific database
  DRY_RUN=true $0 20240115_103000       # Preview restore
  
Available backups:
  ./scripts/list-backups.sh
EOF
    exit 1
}

list_available_backups() {
    log "Available backups in S3:"
    aws s3 ls "s3://${S3_BUCKET}/database/" --recursive | tail -20
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v psql >/dev/null 2>&1 || error_exit "psql not found"
    command -v aws >/dev/null 2>&1 || error_exit "AWS CLI not found"
    command -v gpg >/dev/null 2>&1 || error_exit "gpg not found"
    
    [ -f "$ENCRYPTION_KEY" ] || error_exit "Encryption key not found"
    
    mkdir -p "$RESTORE_DIR"
}

download_backup() {
    local timestamp=$1
    
    log "Downloading backup from S3: $timestamp"
    
    aws s3 sync "s3://${S3_BUCKET}/database/${timestamp}/" "${RESTORE_DIR}/${timestamp}/" \
        --only-show-errors
    
    if [ ! -d "${RESTORE_DIR}/${timestamp}" ] || [ -z "$(ls -A ${RESTORE_DIR}/${timestamp})" ]; then
        error_exit "Backup not found or empty: $timestamp"
    fi
    
    log "Download completed"
}

decrypt_backup() {
    local backup_file=$1
    local output_file="${backup_file%.gpg}"
    
    log "Decrypting: $(basename $backup_file)"
    
    gpg --decrypt --batch --passphrase-file "$ENCRYPTION_KEY" "$backup_file" > "$output_file"
    
    if [ $? -eq 0 ]; then
        rm "$backup_file"  # Remove encrypted version after decryption
        log "  ✓ Decrypted successfully"
    else
        error_exit "Decryption failed for $(basename $backup_file)"
    fi
}

restore_database() {
    local backup_file=$1
    local db_name=$(basename "$backup_file" | sed 's/_[0-9]\{8\}_[0-9]\{6\}\.sql\.gz$//')
    
    log "Restoring database: $db_name"
    
    if [ "$DRY_RUN" = "true" ]; then
        log "  [DRY RUN] Would restore $db_name from $backup_file"
        return 0
    fi
    
    # Drop existing connections
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db_name' AND pid <> pg_backend_pid();" \
        2>/dev/null || true
    
    # Drop and recreate database
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
        "DROP DATABASE IF EXISTS ${db_name};" 2>>"$LOG_FILE"
    
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
        "CREATE DATABASE ${db_name};" 2>>"$LOG_FILE"
    
    # Restore data
    gunzip -c "$backup_file" | \
        PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" \
        2>>"$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log "  ✓ Database restored successfully"
    else
        log "  ✗ Restore failed for $db_name (check $LOG_FILE)"
        return 1
    fi
}

verify_restore() {
    local db_name=$1
    
    log "Verifying restore for: $db_name"
    
    # Check table count
    local table_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    
    log "  Tables restored: $table_count"
    
    # Check for critical tables (basic sanity check)
    local critical_tables=("users" "agencies" "caregivers" "patients")
    for table in "${critical_tables[@]}"; do
        local exists=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c \
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table');")
        
        if [[ "$exists" == *"t"* ]]; then
            log "  ✓ Table exists: $table"
        fi
    done
}

confirm_restore() {
    if [ "$SKIP_CONFIRMATION" = "true" ]; then
        return 0
    fi
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    ⚠️  WARNING ⚠️                              ║"
    echo "║                                                              ║"
    echo "║  You are about to restore database(s) from backup.          ║"
    echo "║  This will OVERWRITE existing data!                         ║"
    echo "║                                                              ║"
    echo "║  Timestamp: ${TIMESTAMP}                                    ║"
    echo "║  Database:  ${DATABASE}                                     ║"
    echo "║  Target:    ${DB_HOST}:${DB_PORT}                          ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    read -p "Type 'RESTORE' to confirm: " confirmation
    
    if [ "$confirmation" != "RESTORE" ]; then
        log "Restore cancelled by user"
        exit 0
    fi
}

cleanup() {
    log "Cleaning up temporary files..."
    rm -rf "$RESTORE_DIR"
}

# Main execution
main() {
    if [ -z "$TIMESTAMP" ]; then
        usage
    fi
    
    log "=========================================="
    log "Starting Medi-Aide Database Restore"
    log "=========================================="
    log "Timestamp: $TIMESTAMP"
    log "Database:  $DATABASE"
    log "Dry Run:   $DRY_RUN"
    log "=========================================="
    
    check_prerequisites
    confirm_restore
    download_backup "$TIMESTAMP"
    
    # Decrypt all backup files
    for gpg_file in "${RESTORE_DIR}/${TIMESTAMP}"/*.gpg; do
        if [ -f "$gpg_file" ]; then
            decrypt_backup "$gpg_file"
        fi
    done
    
    # Restore databases
    local failed=0
    for backup_file in "${RESTORE_DIR}/${TIMESTAMP}"/*.sql.gz; do
        if [ -f "$backup_file" ]; then
            local db_name=$(basename "$backup_file" | sed 's/_[0-9]\{8\}_[0-9]\{6\}\.sql\.gz$//')
            
            if [ "$DATABASE" = "all" ] || [ "$DATABASE" = "$db_name" ]; then
                if ! restore_database "$backup_file"; then
                    ((failed++))
                else
                    verify_restore "$db_name"
                fi
            fi
        fi
    done
    
    cleanup
    
    if [ $failed -gt 0 ]; then
        error_exit "$failed database(s) failed to restore"
    fi
    
    log "=========================================="
    log "Restore completed successfully!"
    log "=========================================="
    
    if [ "$DRY_RUN" = "true" ]; then
        log "NOTE: This was a dry run. No changes were made."
    fi
}

trap cleanup EXIT

main "$@"
