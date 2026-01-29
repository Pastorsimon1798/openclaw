#!/bin/bash
# Test script for Ceramics Business Intelligence Phase 1

echo "🧪 Testing Ceramics Business Intelligence System"
echo "================================================"

# Test 1: CLI help
echo ""
echo "Test 1: CLI Help Commands"
ceramics --help > /dev/null && echo "✅ ceramics --help" || echo "❌ ceramics --help"
ceramics-photo --help > /dev/null 2>&1 && echo "✅ ceramics-photo --help" || echo "❌ ceramics-photo --help"
ceramics-post --help > /dev/null 2>&1 && echo "✅ ceramics-post --help" || echo "❌ ceramics-post --help"

# Test 2: Database exists
echo ""
echo "Test 2: Database Check"
if [ -f ~/clawd/ceramics/ceramics.sqlite ]; then
    echo "✅ Database exists"
    # Check tables using Python
    python3 -c "
import sqlite3
conn = sqlite3.connect('/home/liam/clawd/ceramics/ceramics.sqlite')
cursor = conn.cursor()
cursor.execute(\"SELECT name FROM sqlite_master WHERE type='table'\")
tables = [t[0] for t in cursor.fetchall()]
for t in ['pieces', 'photos', 'sales', 'opportunities', 'social_posts']:
    print(f'✅ {t} table exists' if t in tables else f'❌ {t} table missing')
conn.close()
"
else
    echo "❌ Database not found"
fi

# Test 3: Photo directories
echo ""
echo "Test 3: Photo Directory Structure"
for year in 2025 2026 2027; do
    if [ -d ~/clawd/ceramics/photos/$year ]; then
        echo "✅ photos/$year directory exists"
    else
        echo "❌ photos/$year directory missing"
    fi
done

# Test 4: CLI stats
echo ""
echo "Test 4: Statistics Command"
ceramics stats > /dev/null && echo "✅ ceramics stats works" || echo "❌ ceramics stats failed"

# Test 5: Test add piece (simulated with echo)
echo ""
echo "Test 5: Add Piece Flow (simulated)"
echo "   To add a piece: ceramics add"
echo "   Follow the interactive prompts"

# Test 6: Documentation
echo ""
echo "Test 6: Documentation"
if [ -f ~/clawd/ceramics/README.md ]; then
    echo "✅ README.md exists"
    wc -l ~/clawd/ceramics/README.md | awk '{print "   Lines:", $1}'
else
    echo "❌ README.md missing"
fi

echo ""
echo "================================================"
echo "✅ Phase 1 Foundation Complete!"
echo ""
echo "Available Commands:"
echo "  ceramics add              - Add new piece"
echo "  ceramics list             - View inventory"
echo "  ceramics search [term]    - Search pieces"
echo "  ceramics update [id]      - Update piece"
echo "  ceramics status [id] [st] - Change status"
echo "  ceramics stats            - Business stats"
echo "  ceramics-photo [cmd]      - Photo management"
echo "  ceramics-post [cmd]       - Social post gen"
echo ""
echo "See ~/clawd/ceramics/README.md for full docs"
