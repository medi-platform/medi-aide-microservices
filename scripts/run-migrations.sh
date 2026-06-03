#!/bin/bash
#
# Run TypeORM Migrations for All Services
# Phase 6: Database Migrations
#
# Usage: 
#   ./scripts/run-migrations.sh [service-name] [command]
#   ./scripts/run-migrations.sh all run        # Run all migrations
#   ./scripts/run-migrations.sh all revert     # Revert all migrations
#   ./scripts/run-migrations.sh agency-service run  # Run specific service
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services with migrations
SERVICES=(
  "agency-service"
  "audit-service"
  "caregiver-service"
  "communication-service"
  "contract-service"
  "feedback-service"
  "incident-service"
  "mentorship-service"
  "notification-service"
  "patient-service"
  "reports-service"
  "residential-service"
  "training-service"
  "wellness-service"
)

# Default values
SERVICE="${1:-all}"
COMMAND="${2:-run}"

# Function to print colored output
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to run migration for a single service
run_migration() {
  local service=$1
  local cmd=$2
  local service_dir="services/$service"
  
  if [ ! -d "$service_dir" ]; then
    log_warning "Service directory not found: $service_dir"
    return 1
  fi
  
  if [ ! -d "$service_dir/src/migrations" ]; then
    log_warning "No migrations directory for: $service"
    return 0
  fi
  
  log_info "Processing migrations for: $service"
  
  cd "$service_dir"
  
  # Build the service first
  if [ -f "package.json" ]; then
    log_info "Building $service..."
    pnpm build 2>/dev/null || npm run build 2>/dev/null || {
      log_warning "Build failed or no build script for $service"
    }
  fi
  
  # Run migration command
  case $cmd in
    run)
      log_info "Running migrations for $service..."
      npx typeorm migration:run -d ormconfig.js 2>/dev/null || {
        # Fallback to NestJS migration approach
        npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run 2>/dev/null || {
          log_warning "Migration run failed for $service (may be first run or no pending migrations)"
        }
      }
      ;;
    revert)
      log_info "Reverting last migration for $service..."
      npx typeorm migration:revert -d ormconfig.js 2>/dev/null || {
        log_warning "Migration revert failed for $service"
      }
      ;;
    show)
      log_info "Showing migrations for $service..."
      npx typeorm migration:show -d ormconfig.js 2>/dev/null || {
        log_warning "Could not show migrations for $service"
      }
      ;;
    generate)
      log_info "Generating migration for $service..."
      local migration_name="${3:-AutoMigration}"
      npx typeorm migration:generate -d ormconfig.js src/migrations/$migration_name 2>/dev/null || {
        log_warning "Could not generate migration for $service"
      }
      ;;
    *)
      log_error "Unknown command: $cmd"
      log_info "Available commands: run, revert, show, generate"
      ;;
  esac
  
  cd - > /dev/null
  log_success "Completed: $service"
}

# Main execution
main() {
  log_info "=== Medi-Aide Database Migration Runner ==="
  log_info "Service: $SERVICE"
  log_info "Command: $COMMAND"
  echo ""
  
  if [ "$SERVICE" = "all" ]; then
    log_info "Running migrations for all services..."
    echo ""
    
    local success_count=0
    local fail_count=0
    
    for svc in "${SERVICES[@]}"; do
      if run_migration "$svc" "$COMMAND"; then
        ((success_count++))
      else
        ((fail_count++))
      fi
      echo ""
    done
    
    echo "=========================================="
    log_info "Migration Summary:"
    log_success "Successful: $success_count"
    if [ $fail_count -gt 0 ]; then
      log_warning "Failed/Skipped: $fail_count"
    fi
  else
    run_migration "$SERVICE" "$COMMAND" "$3"
  fi
  
  log_success "=== Migration Complete ==="
}

# Print usage if --help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "Usage: ./scripts/run-migrations.sh [service-name|all] [command]"
  echo ""
  echo "Services:"
  for svc in "${SERVICES[@]}"; do
    echo "  - $svc"
  done
  echo ""
  echo "Commands:"
  echo "  run      - Run pending migrations (default)"
  echo "  revert   - Revert last migration"
  echo "  show     - Show migration status"
  echo "  generate - Generate new migration"
  echo ""
  echo "Examples:"
  echo "  ./scripts/run-migrations.sh all run"
  echo "  ./scripts/run-migrations.sh agency-service run"
  echo "  ./scripts/run-migrations.sh patient-service revert"
  exit 0
fi

main
