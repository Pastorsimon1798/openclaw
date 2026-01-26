---
name: overnight-testing
description: Automated testing framework for overnight builds. Every project must include test.sh. Tests run before delivery.
---

# Overnight Testing Skill

Ensure quality in overnight builds through automated testing.

## Philosophy

Every overnight project should be delivered with confidence. Tests catch issues before Simon sees them.

## Requirements

Every overnight build MUST include:
1. `test.sh` - executable test script
2. Test documentation in README
3. Manual test checklist for interactive features

## Test Script Template

Use `{baseDir}/templates/test.sh.template`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Overnight Build Test Script
# Project: [PROJECT_NAME]
# Date: [DATE]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "Running tests for [PROJECT_NAME]"
echo "========================================"

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_result() {
    if [ $? -eq 0 ]; then
        echo "✓ $1"
        ((TESTS_PASSED++))
    else
        echo "✗ $1"
        ((TESTS_FAILED++))
    fi
}

# ========================================
# 1. SYNTAX CHECKS
# ========================================
echo ""
echo "--- Syntax Checks ---"

# Shell scripts
if ls *.sh 1> /dev/null 2>&1; then
    shellcheck *.sh 2>/dev/null
    test_result "Shell script syntax (shellcheck)"
fi

# Python files
if ls *.py 1> /dev/null 2>&1; then
    python3 -m py_compile *.py 2>/dev/null
    test_result "Python syntax check"
fi

# ========================================
# 2. UNIT TESTS
# ========================================
echo ""
echo "--- Unit Tests ---"

# Add project-specific unit tests here
# Example:
# python3 -m pytest tests/ 2>/dev/null
# test_result "Python unit tests"

echo "(Add project-specific tests)"

# ========================================
# 3. INTEGRATION TESTS
# ========================================
echo ""
echo "--- Integration Tests ---"

# Add integration tests here
# Example:
# ./integration-test.sh
# test_result "Integration tests"

echo "(Add project-specific tests)"

# ========================================
# 4. MANUAL TEST CHECKLIST
# ========================================
echo ""
echo "--- Manual Test Checklist ---"
echo "[ ] Feature A works as expected"
echo "[ ] Feature B handles edge cases"
echo "[ ] UI renders correctly"
echo "(Simon should verify these manually)"

# ========================================
# SUMMARY
# ========================================
echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"

if [ $TESTS_FAILED -gt 0 ]; then
    echo ""
    echo "⚠️  Some tests failed. Review before delivery."
    exit 1
else
    echo ""
    echo "✓ All automated tests passed!"
    exit 0
fi
```

## Testing Protocol

### Before Delivery

1. Run `./test.sh` in project directory
2. All automated tests must pass
3. Include test results in morning delivery

### Test Categories

| Category | Automated? | Tools |
|----------|------------|-------|
| Syntax | Yes | shellcheck, pylint, tsc |
| Unit tests | Yes | pytest, jest, go test |
| Integration | Yes | Custom scripts |
| Manual/UI | No | Checklist |

### Delivery Report Format

Include in `morning-delivery.md`:

```markdown
## Test Results

**Automated Tests:** ✓ All passed (5/5)
**Manual Checklist:**
- [ ] Feature A
- [ ] Feature B
- [ ] Edge case handling

**Test Coverage:** 80% (if applicable)
```

## Common Test Patterns

### File Existence

```bash
[ -f "expected_file.txt" ]
test_result "Expected file exists"
```

### Command Output

```bash
OUTPUT=$(./script.sh --version 2>&1)
[[ "$OUTPUT" == *"1.0"* ]]
test_result "Version command works"
```

### API Response

```bash
RESPONSE=$(curl -s http://localhost:8080/health)
[[ "$RESPONSE" == *"ok"* ]]
test_result "Health endpoint responds"
```

### Database Check

```bash
COUNT=$(sqlite3 db.sqlite "SELECT COUNT(*) FROM users;")
[ "$COUNT" -gt 0 ]
test_result "Database has records"
```

## Troubleshooting

### Test fails but feature works
- Check test assumptions
- Verify test environment matches runtime
- Add debug output

### shellcheck not found
```bash
# Install on Ubuntu/Debian
sudo apt-get install shellcheck

# Or skip if not critical
command -v shellcheck &>/dev/null && shellcheck *.sh
```

### Test takes too long
- Add timeout: `timeout 30s ./slow_test.sh`
- Skip slow tests in CI with `[slow]` tag
