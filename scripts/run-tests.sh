#!/bin/bash
#
# Test Runner Script
# Phase 7: Integration Testing
#
# Usage:
#   ./scripts/run-tests.sh [type] [options]
#   ./scripts/run-tests.sh unit           # Run unit tests
#   ./scripts/run-tests.sh e2e            # Run E2E tests
#   ./scripts/run-tests.sh integration    # Run integration tests
#   ./scripts/run-tests.sh all            # Run all tests
#   ./scripts/run-tests.sh coverage       # Run with coverage
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

TEST_TYPE="${1:-unit}"
EXTRA_ARGS="${@:2}"

# Check if test containers are running
check_test_db() {
  if ! docker ps | grep -q "medi-aide-test-postgres"; then
    log_warning "Test database not running. Starting test containers..."
    docker-compose -f docker-compose.test.yml up -d
    log_info "Waiting for database to be ready..."
    sleep 5
  fi
}

# Run unit tests
run_unit_tests() {
  log_info "Running unit tests..."
  pnpm run -r test $EXTRA_ARGS
}

# Run E2E tests
run_e2e_tests() {
  log_info "Running E2E tests..."
  check_test_db
  
  export TEST_DB_HOST=localhost
  export TEST_DB_PORT=5433
  export TEST_DB_USER=postgres
  export TEST_DB_PASSWORD=postgres
  
  pnpm run -r test:e2e $EXTRA_ARGS
}

# Run integration tests
run_integration_tests() {
  log_info "Running integration tests..."
  check_test_db
  
  export TEST_DB_HOST=localhost
  export TEST_DB_PORT=5433
  export TEST_DB_USER=postgres
  export TEST_DB_PASSWORD=postgres
  
  pnpm run test:integration $EXTRA_ARGS
}

# Run all tests
run_all_tests() {
  log_info "Running all tests..."
  run_unit_tests
  run_e2e_tests
  run_integration_tests
}

# Run with coverage
run_coverage() {
  log_info "Running tests with coverage..."
  pnpm run -r test -- --coverage $EXTRA_ARGS
}

# Main execution
main() {
  log_info "=== Medi-Aide Test Runner ==="
  log_info "Test Type: $TEST_TYPE"
  echo ""

  case $TEST_TYPE in
    unit)
      run_unit_tests
      ;;
    e2e)
      run_e2e_tests
      ;;
    integration)
      run_integration_tests
      ;;
    all)
      run_all_tests
      ;;
    coverage)
      run_coverage
      ;;
    *)
      log_error "Unknown test type: $TEST_TYPE"
      echo ""
      echo "Usage: ./scripts/run-tests.sh [unit|e2e|integration|all|coverage]"
      exit 1
      ;;
  esac

  log_success "=== Tests Complete ==="
}

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "Medi-Aide Test Runner"
  echo ""
  echo "Usage: ./scripts/run-tests.sh [type] [options]"
  echo ""
  echo "Test Types:"
  echo "  unit          Run unit tests"
  echo "  e2e           Run E2E tests (requires test database)"
  echo "  integration   Run integration tests"
  echo "  all           Run all tests"
  echo "  coverage      Run tests with coverage report"
  echo ""
  echo "Options:"
  echo "  --watch       Run in watch mode"
  echo "  --verbose     Verbose output"
  echo ""
  echo "Examples:"
  echo "  ./scripts/run-tests.sh unit"
  echo "  ./scripts/run-tests.sh e2e --verbose"
  echo "  ./scripts/run-tests.sh coverage"
  exit 0
fi

main
