#!/usr/bin/env bash

# Script to run Cypress E2E tests in OpenShift CI against a real cluster
# This script expects:
# - KUBECONFIG environment variable to be set
# - Console route to be accessible
#
# Usage:
#   run-e2e-tests.sh [--spec <spec-list>]
#
# Options:
#   --spec <spec-list>    Comma-separated list of spec files to run
#                         Example: --spec "cypress/integration-tests/overview_page.cy.ts,cypress/integration-tests/topology_view.cy.ts"

# Set PROVISION_HTPASSWD=true environment variable to provision htpasswd IDP.
set -euo pipefail

# Parse command line arguments
SPEC_FILES=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --spec)
            SPEC_FILES="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--spec <spec-list>]"
            exit 1
            ;;
    esac
done

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="${SCRIPT_DIR}/../web"
RESULTS_DIR="${WEB_DIR}/cypress/results"
SCREENSHOTS_DIR="${WEB_DIR}/gui_test_screenshots"

echo "========================================="
echo "OpenShift Cypress E2E Test Runner"
echo "========================================="

# Validate required environment variables
if [ -z "${KUBECONFIG:-}" ]; then
    echo "ERROR: KUBECONFIG environment variable must be set"
    exit 1
fi

# Get console URL from the cluster
echo "Fetching console URL from cluster..."
CONSOLE_URL=$(oc get route console -n openshift-console -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
if [ -z "$CONSOLE_URL" ]; then
    echo "ERROR: Failed to get console URL from cluster"
    exit 1
fi

export CYPRESS_BASE_URL="https://${CONSOLE_URL}"
echo "Console URL: ${CYPRESS_BASE_URL}"

# Function to provision htpasswd users for testing
provision_htpasswd_users() {
    echo "========================================="
    echo "Provisioning htpasswd users for testing"
    echo "========================================="

    # Determine where to store htpasswd file and credentials
    local STORAGE_DIR="${ARTIFACT_DIR:-$(pwd)}"
    local HTPASSWD_FILE="${STORAGE_DIR}/htpasswd-test-users"
    local CREDENTIALS_FILE="${STORAGE_DIR}/test-users-credentials.txt"
    local USER_COUNT="${TEST_USER_COUNT:-3}"
    local USER_PREFIX="${TEST_USER_PREFIX:-testuser}"
    local PASSWORD="${TEST_USER_PASSWORD:-testpass123}"

    echo "Creating ${USER_COUNT} test users with prefix '${USER_PREFIX}'"
    echo "Storage directory: ${STORAGE_DIR}"

    # Create storage directory if it doesn't exist
    mkdir -p "${STORAGE_DIR}"

    # Create htpasswd file
    rm -f "${HTPASSWD_FILE}" "${CREDENTIALS_FILE}"

    # Write credentials header
    echo "# Network Observability E2E Test Users" > "${CREDENTIALS_FILE}"
    echo "# Generated on: $(date)" >> "${CREDENTIALS_FILE}"
    echo "# IDP: htpasswd-provider" >> "${CREDENTIALS_FILE}"
    echo "" >> "${CREDENTIALS_FILE}"

    for i in $(seq 1 ${USER_COUNT}); do
        local USERNAME="${USER_PREFIX}${i}"

        # Add to htpasswd file
        htpasswd -cBb "${HTPASSWD_FILE}" "${USERNAME}" "${PASSWORD}" 2>/dev/null || {
            echo "ERROR: htpasswd command failed. Installing required package..."
            if command -v brew &>/dev/null; then
                # macOS with Homebrew
                echo "Installing httpd via Homebrew..."
                brew install httpd
            elif command -v yum &>/dev/null; then
                # RHEL/CentOS/Fedora
                echo "Installing httpd-tools via yum..."
                yum install -y httpd-tools
            elif command -v apt-get &>/dev/null; then
                # Debian/Ubuntu
                echo "Installing apache2-utils via apt..."
                apt-get update && apt-get install -y apache2-utils
            else
                echo "ERROR: Cannot install htpasswd tool. Please install manually:"
                echo "  - macOS: brew install httpd"
                echo "  - RHEL/CentOS: yum install httpd-tools"
                echo "  - Debian/Ubuntu: apt-get install apache2-utils"
                return 1
            fi
            htpasswd -Bb "${HTPASSWD_FILE}" "${USERNAME}" "${PASSWORD}"
        }

        # Add to credentials file
        echo "Username: ${USERNAME}" >> "${CREDENTIALS_FILE}"
        echo "Password: ${PASSWORD}" >> "${CREDENTIALS_FILE}"
        echo "" >> "${CREDENTIALS_FILE}"
    done

    # Create or update htpasswd secret
    echo "Creating htpasswd secret..."
    oc create secret generic htpasswd-secret \
        --from-file=htpasswd="${HTPASSWD_FILE}" \
        -n openshift-config \
        --dry-run=client -o yaml | oc apply -f -

    # Create or update OAuth configuration
    echo "Configuring OAuth for htpasswd..."
    oc get oauth cluster -o json | jq '
        .spec.identityProviders |=
        if map(select(.name == "htpasswd-provider")) | length > 0 then
            map(if .name == "htpasswd-provider" then
                .htpasswd.fileData.name = "htpasswd-secret"
            else . end)
        else
            . + [{
                "name": "htpasswd-provider",
                "type": "HTPasswd",
                "mappingMethod": "claim",
                "htpasswd": {
                    "fileData": {
                        "name": "htpasswd-secret"
                    }
                }
            }]
        end
    ' | oc apply -f -

    # Wait for OAuth pods to restart
    echo "Waiting for OAuth pods to restart..."
    sleep 10
    oc rollout status deployment/oauth-openshift -n openshift-authentication --timeout=120s || true
    sleep 15  # Additional wait for OAuth to be fully ready

    # Build CSV of users for Cypress
    local USERS_CSV=""
    for i in $(seq 1 ${USER_COUNT}); do
        if [ -n "${USERS_CSV}" ]; then
            USERS_CSV="${USERS_CSV},"
        fi
        USERS_CSV="${USERS_CSV}${USER_PREFIX}${i}:${PASSWORD}"
    done

    export CYPRESS_LOGIN_USERS="${USERS_CSV}"
    export CYPRESS_LOGIN_IDP="htpasswd-provider"

    echo ""
    echo "Provisioned users: ${USER_COUNT}"
    echo "htpasswd file: ${HTPASSWD_FILE}"
    echo "Credentials file: ${CREDENTIALS_FILE}"
    echo "CSV format: ${USERS_CSV}"
    echo ""
    echo "Credentials have been saved to: ${CREDENTIALS_FILE}"
    echo "htpasswd provisioning complete"
    echo "========================================="
}

# Set up test credentials
echo "Setting up test credentials..."

# Check if we should provision htpasswd users
PROVISION_HTPASSWD="${PROVISION_HTPASSWD:-false}"
if [ "${OPENSHIFT_CI:-false}" = "true" ]; then
    echo "Running in OpenShift CI - htpasswd provisioning will be enabled"
    PROVISION_HTPASSWD="true"
fi

if [ "${PROVISION_HTPASSWD}" = "true" ]; then
    provision_htpasswd_users
elif [ -n "${CYPRESS_LOGIN_USERS:-}" ]; then
    echo "Using provided CYPRESS_LOGIN_USERS from environment"
    export CYPRESS_LOGIN_IDP="${CYPRESS_LOGIN_IDP:-htpasswd-provider}"
else
    echo "ERROR: No credentials provided."
    echo "Please set one of the following:"
    echo "  - CYPRESS_LOGIN_USERS (e.g., 'kubeadmin:password' or 'user1:pass1,user2:pass2')"
    echo "  - PROVISION_HTPASSWD=true (to automatically provision test users)"
    exit 1
fi

echo "Login IDP: ${CYPRESS_LOGIN_IDP}"
echo "Test user: $(echo ${CYPRESS_LOGIN_USERS} | cut -d',' -f1 | cut -d':' -f1)"

# Set kubeconfig path for tests
export CYPRESS_KUBECONFIG_PATH="${KUBECONFIG}"

# Create results directories
mkdir -p "${RESULTS_DIR}/junit" "${SCREENSHOTS_DIR}/cypress/screenshots" "${SCREENSHOTS_DIR}/cypress/videos"

# Change to web directory
cd "${WEB_DIR}"

# Run Cypress tests
echo "========================================="
echo "Running Cypress tests..."
echo "========================================="
echo "Test filter: ${CYPRESS_GREP_TAGS:-Network_Observability}"
echo "Browser: ${CYPRESS_BROWSER:-chrome}"
if [ -n "${SPEC_FILES}" ]; then
    echo "Spec files: ${SPEC_FILES}"
fi
echo "========================================="

# Set default test tag if not provided
GREP_TAGS="${CYPRESS_GREP_TAGS:-@Network_Observability}"
BROWSER="${CYPRESS_BROWSER:-chrome}"

# Build cypress run command arguments
CYPRESS_ARGS=(
    --env "grepTags=${GREP_TAGS}"
    --browser "${BROWSER}"
    --headless
    --reporter cypress-multi-reporters
    --reporter-options configFile=reporter-config.json
)

# Add --spec option if spec files are provided
if [ -n "${SPEC_FILES}" ]; then
    CYPRESS_ARGS+=(--spec "${SPEC_FILES}")
fi

# Run tests and capture exit code
set +e
npx cypress run "${CYPRESS_ARGS[@]}"

CYPRESS_EXIT_CODE=$?
set -e

# Summary
echo "========================================="
echo "Test Execution Complete"
echo "========================================="
echo "Exit Code: ${CYPRESS_EXIT_CODE}"
echo "Results: ${RESULTS_DIR}"
echo "Screenshots: ${SCREENSHOTS_DIR}"
echo "========================================="

# Copy results to artifacts directory if it exists (OpenShift CI convention)
if [ -n "${ARTIFACT_DIR:-}" ]; then
    echo "Copying results to artifact directory: ${ARTIFACT_DIR}"
    mkdir -p "${ARTIFACT_DIR}"
    cp -r "${RESULTS_DIR}"/* "${ARTIFACT_DIR}/" 2>/dev/null || true
    cp -r "${SCREENSHOTS_DIR}"/* "${ARTIFACT_DIR}/" 2>/dev/null || true
    echo "Artifacts copied successfully"
fi

exit ${CYPRESS_EXIT_CODE}
