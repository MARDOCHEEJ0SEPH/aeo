#!/bin/bash

# ============================================================================
# Database Schema Test Runner
# ============================================================================
# Version: 1.0
# Purpose: Automated testing of AEOLOVABLE database schema
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="${SCRIPT_DIR}/DATABASE_SCHEMA.sql"
TEST_FILE="${SCRIPT_DIR}/DATABASE_SCHEMA_TEST.sql"
REPORT_FILE="${SCRIPT_DIR}/test-report-$(date +%Y%m%d-%H%M%S).log"

# Functions
print_header() {
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if psql is installed
    if command -v psql &> /dev/null; then
        print_success "psql is installed"
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        print_info "PostgreSQL version: $PSQL_VERSION"
    else
        print_error "psql is not installed"
        echo "Please install PostgreSQL client tools"
        exit 1
    fi

    # Check if files exist
    if [ -f "$SCHEMA_FILE" ]; then
        print_success "Schema file found"
    else
        print_error "Schema file not found: $SCHEMA_FILE"
        exit 1
    fi

    if [ -f "$TEST_FILE" ]; then
        print_success "Test file found"
    else
        print_error "Test file not found: $TEST_FILE"
        exit 1
    fi

    echo ""
}

# Prompt for database connection details
get_connection_details() {
    print_header "Database Connection Details"

    echo "Choose connection method:"
    echo "1) Local PostgreSQL"
    echo "2) Supabase (remote)"
    echo "3) Docker container"
    read -p "Enter choice (1-3): " choice

    case $choice in
        1)
            DB_HOST="${DB_HOST:-localhost}"
            DB_PORT="${DB_PORT:-5432}"
            DB_NAME="${DB_NAME:-aeotest}"
            DB_USER="${DB_USER:-postgres}"
            read -sp "Database password: " DB_PASSWORD
            echo ""
            ;;
        2)
            read -p "Supabase project ref: " SUPABASE_REF
            DB_HOST="db.${SUPABASE_REF}.supabase.co"
            DB_PORT="5432"
            DB_NAME="postgres"
            DB_USER="postgres"
            read -sp "Database password: " DB_PASSWORD
            echo ""
            ;;
        3)
            DB_HOST="localhost"
            DB_PORT="5432"
            DB_NAME="${DB_NAME:-aeotest}"
            DB_USER="postgres"
            DB_PASSWORD="${DB_PASSWORD:-testpassword}"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac

    export PGPASSWORD="$DB_PASSWORD"
    PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

    print_info "Connection: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
}

# Test database connection
test_connection() {
    print_header "Testing Database Connection"

    if $PSQL_CMD -c "SELECT version();" &> /dev/null; then
        print_success "Connection successful"
        DB_VERSION=$($PSQL_CMD -t -c "SELECT version();" | head -n1 | xargs)
        print_info "$DB_VERSION"
    else
        print_error "Connection failed"
        exit 1
    fi

    echo ""
}

# Apply schema
apply_schema() {
    print_header "Applying Database Schema"

    read -p "Apply schema? This will run DATABASE_SCHEMA.sql (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        print_warning "Schema not applied. Assuming schema already exists."
        echo ""
        return
    fi

    print_info "Applying schema..."
    if $PSQL_CMD -f "$SCHEMA_FILE" &> /dev/null; then
        print_success "Schema applied successfully"
    else
        print_error "Schema application failed"
        print_info "Check if schema is already applied or if there are errors"
    fi

    echo ""
}

# Run tests
run_tests() {
    print_header "Running Database Tests"

    print_info "Executing test suite..."
    echo ""

    # Run tests and capture output
    if $PSQL_CMD -f "$TEST_FILE" 2>&1 | tee "$REPORT_FILE"; then
        print_success "Tests completed"
    else
        print_error "Tests failed with errors"
        exit 1
    fi

    echo ""
}

# Analyze results
analyze_results() {
    print_header "Test Results Summary"

    # Count successes and failures
    SUCCESS_COUNT=$(grep -c "✅" "$REPORT_FILE" || true)
    WARNING_COUNT=$(grep -c "⚠️" "$REPORT_FILE" || true)
    ERROR_COUNT=$(grep -c "❌" "$REPORT_FILE" || true)

    echo "Summary:"
    print_success "Passed: $SUCCESS_COUNT"
    print_warning "Warnings: $WARNING_COUNT"
    print_error "Failed: $ERROR_COUNT"

    echo ""
    print_info "Full report saved to: $REPORT_FILE"

    if [ $ERROR_COUNT -eq 0 ]; then
        echo ""
        print_success "ALL TESTS PASSED! 🎉"
        print_info "Schema is ready for production deployment"
    else
        echo ""
        print_error "SOME TESTS FAILED"
        print_info "Review the report and fix issues before deployment"
        exit 1
    fi

    echo ""
}

# Cleanup
cleanup() {
    unset PGPASSWORD
}

# Main execution
main() {
    clear

    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         AEOLOVABLE Database Schema Test Suite            ║"
    echo "║                    Version 1.0                            ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    check_prerequisites
    get_connection_details
    test_connection
    apply_schema
    run_tests
    analyze_results
    cleanup

    echo ""
    print_header "Testing Complete"
    echo ""
}

# Run main function
main
