#!/bin/bash
#
# Backup Status Checker
# Verifies backup health and reports status
#

set -euo pipefail

S3_BUCKET="${S3_BUCKET:-medi-aide-backups-ca-central-1}"
ALERT_HOURS="${ALERT_HOURS:-2}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

check_last_backup() {
    echo "Checking last backup timestamp..."
    
    local latest=$(aws s3 ls "s3://${S3_BUCKET}/database/" | sort | tail -1 | awk '{print $2}' | tr -d '/')
    
    if [ -z "$latest" ]; then
        log_error "No backups found!"
        return 1
    fi
    
    local backup_time=$(echo "$latest" | sed 's/_/ /' | sed 's/\(....\)\(..\)\(..\) \(..\)\(..\)\(..\)/\1-\2-\3 \4:\5:\6/')
    local backup_epoch=$(date -d "$backup_time" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$backup_time" +%s)
    local now_epoch=$(date +%s)
    local age_hours=$(( (now_epoch - backup_epoch) / 3600 ))
    
    echo "  Latest backup: $latest"
    echo "  Age: ${age_hours} hours"
    
    if [ $age_hours -gt $ALERT_HOURS ]; then
        log_error "Backup is older than ${ALERT_HOURS} hours!"
        return 1
    else
        log_success "Backup is recent"
    fi
}

check_backup_size() {
    echo ""
    echo "Checking backup sizes..."
    
    local latest=$(aws s3 ls "s3://${S3_BUCKET}/database/" | sort | tail -1 | awk '{print $2}')
    local total_size=$(aws s3 ls "s3://${S3_BUCKET}/database/${latest}" --summarize --recursive | grep "Total Size" | awk '{print $3}')
    
    echo "  Latest backup size: $(numfmt --to=iec-i --suffix=B $total_size)"
    
    # Check if size is reasonable (at least 1MB per database)
    if [ $total_size -lt 8388608 ]; then  # 8MB minimum for 8 databases
        log_warning "Backup size seems small"
    else
        log_success "Backup size is reasonable"
    fi
}

check_manifest() {
    echo ""
    echo "Checking backup manifest..."
    
    local latest=$(aws s3 ls "s3://${S3_BUCKET}/database/" | sort | tail -1 | awk '{print $2}')
    
    if aws s3 ls "s3://${S3_BUCKET}/database/${latest}manifest.json" &>/dev/null; then
        log_success "Manifest exists"
        
        # Download and validate manifest
        local manifest=$(aws s3 cp "s3://${S3_BUCKET}/database/${latest}manifest.json" - 2>/dev/null)
        local db_count=$(echo "$manifest" | jq '.databases | length')
        
        echo "  Databases backed up: $db_count"
    else
        log_error "Manifest not found"
        return 1
    fi
}

check_retention() {
    echo ""
    echo "Checking backup retention..."
    
    local backup_count=$(aws s3 ls "s3://${S3_BUCKET}/database/" | wc -l)
    echo "  Total backups: $backup_count"
    
    if [ $backup_count -lt 7 ]; then
        log_warning "Less than 7 days of backups available"
    else
        log_success "Retention policy met"
    fi
}

check_cross_region() {
    echo ""
    echo "Checking cross-region replication..."
    
    local secondary_bucket="${S3_BUCKET}-replica"
    
    if aws s3 ls "s3://${secondary_bucket}/" &>/dev/null 2>&1; then
        log_success "Secondary region bucket accessible"
    else
        log_warning "Could not verify secondary region (may require different credentials)"
    fi
}

generate_report() {
    echo ""
    echo "=================================="
    echo "       BACKUP STATUS REPORT       "
    echo "=================================="
    echo ""
    
    local status="HEALTHY"
    
    check_last_backup || status="CRITICAL"
    check_backup_size
    check_manifest || status="WARNING"
    check_retention
    check_cross_region
    
    echo ""
    echo "=================================="
    echo "  Overall Status: $status"
    echo "=================================="
}

# Run report
generate_report
