#!/bin/bash
# Deploy school dashboard to GitHub and FTP server

cd /Users/openclaw/.openclaw/workspace/school-dashboard

# Commit and push to GitHub
git add .
git commit -m "Update: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || echo "No changes to commit"
git push origin main

# Upload to FTP server
echo "Uploading to FTP server..."
curl -u pete.nova.1.1.2000:'tzq.ypr!bye7EAG6ney' -T dashboard.html ftp://ftp.tongslee.com/school.tongslee.com/dashboard.html

echo "Done! Deployed to GitHub and school.tongslee.com"
