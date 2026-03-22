/**
 * School Dashboard API
 * Database-agnostic - supports SQLite and PostgreSQL
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const LINKEDIN_POSTS_DIR = '/Users/openclaw/.openclaw/workspace/linkedin-posts';
const PORT = process.env.PORT || 3456;

async function handleRequest(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  try {
    if (pathname === '/api/subjects') {
      const data = await db.getSubjects();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      
    } else if (pathname === '/api/weeks') {
      const data = await db.getWeeks();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      
    } else if (pathname === '/api/assignments') {
      const data = await db.getAssignments();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      
    } else if (pathname === '/api/linkedin') {
      const result = { published: [], approved: [], drafts: [], comments: [] };
      
      // Read published posts
      const publishedDir = path.join(LINKEDIN_POSTS_DIR, 'published');
      if (fs.existsSync(publishedDir)) {
        result.published = fs.readdirSync(publishedDir)
          .filter(f => f.endsWith('.md'))
          .map(f => {
            const content = fs.readFileSync(path.join(publishedDir, f), 'utf-8');
            const firstLine = content.split('\n')[0];
            return {
              title: firstLine.substring(0, 100),
              filename: f,
              created: fs.statSync(path.join(publishedDir, f)).mtime.toISOString().split('T')[0]
            };
          });
      }
      
      // Read approved posts
      const approvedDir = path.join(LINKEDIN_POSTS_DIR, 'approved');
      if (fs.existsSync(approvedDir)) {
        result.approved = fs.readdirSync(approvedDir)
          .filter(f => f.endsWith('.md'))
          .map(f => {
            const content = fs.readFileSync(path.join(approvedDir, f), 'utf-8');
            const firstLine = content.split('\n')[0];
            return {
              title: firstLine.substring(0, 100),
              filename: f,
              created: fs.statSync(path.join(approvedDir, f)).mtime.toISOString().split('T')[0]
            };
          });
      }
      
      // Read drafts
      const draftsDir = path.join(LINKEDIN_POSTS_DIR, 'drafts');
      if (fs.existsSync(draftsDir)) {
        result.drafts = fs.readdirSync(draftsDir)
          .filter(f => f.endsWith('.md'))
          .map(f => {
            const content = fs.readFileSync(path.join(draftsDir, f), 'utf-8');
            const firstLine = content.split('\n')[0];
            return {
              title: firstLine.substring(0, 100),
              filename: f,
              created: fs.statSync(path.join(draftsDir, f)).mtime.toISOString().split('T')[0]
            };
          });
      }
      
      // Try to load comments from file
      const commentsFile = path.join(LINKEDIN_POSTS_DIR, 'comments.json');
      if (fs.existsSync(commentsFile)) {
        result.comments = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      
    } else if (pathname === '/api/linkedin/check-comments') {
      const { exec } = require('child_process');
      exec('node /Users/openclaw/.openclaw/workspace/browser-server/linkedin-check-comments.js', (err, stdout, stderr) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, output: stdout }));
        }
      });
      
    } else if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', db: process.env.DB_TYPE || 'sqlite' }));
      
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    console.error('API Error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function start() {
  // Initialize database
  await db.init();
  await db.seedIfEmpty();
  
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`School Dashboard API running on port ${PORT} (${process.env.DB_TYPE || 'sqlite'})`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
