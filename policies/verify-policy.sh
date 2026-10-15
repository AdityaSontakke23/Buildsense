#!/usr/bin/env bash
set -e

# BuildSense Policy as Code Runner
# Executes Policy as Code checks and prints summary

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================================="
echo " Starting Policy as Code Verification for BuildSense"
echo "=========================================================="

# Check if Node.js is present
if ! command -v node >/dev/null 2>&1; then
    echo "❌ ERROR: Node.js is required to execute Policy as Code validation."
    exit 1
fi

# Optional: Run OPA if available
if command -v opa >/dev/null 2>&1; then
    echo "🔍 OPA binary detected. Running OPA unit test suite..."
    opa test "$SCRIPT_DIR" -v || {
        echo "❌ OPA unit tests failed!"
        exit 1
    }
fi

# Run the Node.js Policy as Code validator
node "$SCRIPT_DIR/verify-policy.js"
