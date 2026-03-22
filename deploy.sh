#!/bin/bash
# Deploy school dashboard

set -e

cd /Users/openclaw/.openclaw/workspace/school-dashboard

# Create data directory if it doesn't exist (for SQLite)
mkdir -p data

# Install SQLite dependency if not present
if ! npm list better-sqlite3 >/dev/null 2>&1; then
  echo "Installing better-sqlite3..."
  npm install better-sqlite3
fi

# Commit and push to GitHub
git add .
git commit -m "Update: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || echo "No changes to commit"
git push origin main

echo "Done! Deployed to GitHub: https://github.com/tongslee/school.tongslee.com"
