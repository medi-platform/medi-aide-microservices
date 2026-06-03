#!/bin/bash
#
# Database Backup Script
# Performs full PostgreSQL backup with compression and encryption
#

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/medi-aide}"
S3_BUCKET="${S3_BUCKET:-medi-aide-backups-ca-central-1}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ENCRYPTION_KEY="${ENCRYPTION_KEY_FILE:-/etc/medi-aide/backup-key}"

# Database connection
DB_HOST="${DB_HOST:-stage3-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-backup_user}"
DB_NAMES=("agency_db" "caregiver_db" "patient_db" "scheduling_db" "residential_db" "communication_db" "feedback_db" "reports_db" "auth_db")

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    notify_failure "$1"
    exit 1
}

notify_failure() {
    # Send alert to PagerDuty/Slack
    if [ -n "${PAGERDUTY_KEY:-}" ]; then
        curl -s -X POST "https://events.pagerduty.com/v2/enqueue" \
            -H "Content-Type: application/json" \
            -d "{
                \"routing_key\": \"${PAGERDUTY_KEY}\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"Database backup failed: $1\",
                    \"severity\": \"critical\",
                    \"source\": \"backup-script\"
                }
            }"
    fi
}

notify_success() {
    log "Backup completed successfully"
    # Optional: Send success notification to monitoring
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v pg_dump >/dev/null 2>&1 || error_exit "pg_dump not found"
    command -v aws >/dev/null 2>&1 || error_exit "AWS CLI not found"
    command -v gpg >/dev/null 2>&1 || error_exit "gpg not found"
    
    [ -f "$ENCRYPTION_KEY" ] || error_exit "Encryption key not found"
    
    mkdir -p "$BACKUP_PATH"
}

backup_database() {
    local db_name=$1
    local backup_file="${BACKUP_PATH}/${db_name}_${TIMESTAMP}.sql.gz.gpg"
    
    log "Backing up database: $db_name"
    
    # Dump, compress, and encrypt in one pipeline
    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$db_name" \
        --format=plain \
        --no-owner \
        --no-privileges \
        --verbose 2>>"$LOG_FILE" \
    | gzip -9 \
    | gpg --symmetric --cipher-algo AES256 --batch --passphrase-file "$ENCRYPTION_KEY" \
    > "$backup_file"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log "  ✓ Backup completed: $backup_file ($size)"
        return 0
    else
        log "  ✗ Backup failed for $db_name"
        return 1
    fi
}

backup_all_databases() {
    log "Starting database backups..."
    local failed=0
    
    for db in "${DB_NAMES[@]}"; do
        if ! backup_database "$db"; then
            ((failed++))
        fi
    done
    
    if [ $failed -gt 0 ]; then
        error_exit "$failed database backup(s) failed"
    fi
    
    log "All database backups completed"
}

create_manifest() {
    log "Creating backup manifest..."
    
    cat > "${BACKUP_PATH}/manifest.json" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "type": "full",
    "databases": $(printf '%s\n' "${DB_NAMES[@]}" | jq -R . | jq -s .),
    "host": "${DB_HOST}",
    "files": $(ls -1 "${BACKUP_PATH}"/*.gpg 2>/dev/null | jq -R . | jq -s .),
    "checksums": $(cd "$BACKUP_PATH" && sha256sum *.gpg 2>/dev/null | jq -R . | jq -s .),
    "created_by": "$(whoami)@$(hostname)",
    "retention_days": ${RETENTION_DAYS}
}
EOF
    
    log "Manifest created"
}

upload_to_s3() {
    log "Uploading backups to S3..."
    
    aws s3 sync "$BACKUP_PATH" "s3://${S3_BUCKET}/database/${TIMESTAMP}/" \
        --storage-class STANDARD_IA \
        --sse AES256 \
        --only-show-errors
    
    if [ $? -eq 0 ]; then
        log "Upload completed: s3://${S3_BUCKET}/database/${TIMESTAMP}/"
    else
        error_exit "S3 upload failed"
    fi
}

cleanup_old_backups() {
    log "Cleaning up old local backups..."
    
    find "$BACKUP_DIR" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} + 2>/dev/null || true
    
    log "Cleanup completed"
}

verify_backup() {
    log "Verifying backup integrity..."
    
    # Test that files can be decrypted
    local test_file=$(ls "${BACKUP_PATH}"/*.gpg | head -1)
    if [ -n "$test_file" ]; then
        gpg --decrypt --batch --passphrase-file "$ENCRYPTION_KEY" "$test_file" 2>/dev/null | \
            gunzip -t 2>/dev/null
        
        if [ $? -eq 0 ]; then
            log "Backup verification: PASSED"
        else
            error_exit "Backup verification failed"
        fi
    fi
}

record_metrics() {
    # Record backup metrics for monitoring
    local total_size=$(du -sb "$BACKUP_PATH" | cut -f1)
    local duration=$SECONDS
    
    log "Backup metrics: size=${total_size} bytes, duration=${duration} seconds"
    
    # Push to Prometheus Pushgateway if available
    if [ -n "${PUSHGATEWAY_URL:-}" ]; then
        cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/backup/instance/database"
# TYPE backup_size_bytes gauge
backup_size_bytes ${total_size}
# TYPE backup_duration_seconds gauge
backup_duration_seconds ${duration}
# TYPE backup_last_success_timestamp gauge
backup_last_success_timestamp $(date +%s)
EOF
    fi
}

# Main execution
main() {
    log "=========================================="
    log "Starting Medi-Aide Database Backup"
    log "=========================================="
    
    SECONDS=0
    
    check_prerequisites
    backup_all_databases
    create_manifest
    verify_backup
    upload_to_s3
    cleanup_old_backups
    record_metrics
    notify_success
    
    log "=========================================="
    log "Backup completed in $SECONDS seconds"
    log "=========================================="
}

# Run main function
main "$@"
