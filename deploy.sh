#!/bin/bash
# Deploy school dashboard to GitHub

cd /Users/openclaw/.openclaw/workspace/school-dashboard

# Commit and push to GitHub
git add .
git commit -m "Update: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || echo "No changes to commit"
git push origin main

echo "Done! Deployed to GitHub: https://github.com/tongslee/school.tongslee.com"
