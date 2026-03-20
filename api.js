/**
 * School Dashboard API
 * Serves assignment data for the dashboard
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec: execSync } = require('child_process');

const LINKEDIN_POSTS_DIR = '/Users/openclaw/.openclaw/workspace/linkedin-posts';

function exec(cmd) {
  return new Promise((resolve, reject) => {
    execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}

async function getSubjects() {
  const sql = `SELECT id, name, display_name, color FROM school_subjects ORDER BY name;`;
  return exec(`export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -t -c "${sql.replace(/"/g, '\\"')}"`);
}

async function getWeeks() {
  const sql = `SELECT id, week_start, week_end, term, is_current FROM school_weeks ORDER BY week_start;`;
  return exec(`export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -t -c "${sql.replace(/"/g, '\\"')}"`);
}

async function getAssignments() {
  const sql = `SELECT 
    a.id, a.title, a.assignment_type, a.due_date, a.status,
    s.id as subject_id, s.name as subject_name, s.color,
    w.id as week_id, w.week_start, w.week_end
  FROM school_assignments a
  JOIN school_subjects s ON a.subject_id = s.id
  JOIN school_weeks w ON a.week_id = w.id
  ORDER BY w.week_start, s.name;`;
  return exec(`export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -t -c "${sql.replace(/"/g, '\\"')}"`);
}

function parsePSQLOutput(output) {
  if (!output) return [];
  
  const lines = output.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const parts = line.split('|').map(p => p.trim());
    return parts;
  });
}

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
  const path = url.pathname;
  
  if (path === '/api/subjects') {
    try {
      const output = await getSubjects();
      const data = parsePSQLOutput(output);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (path === '/api/weeks') {
    try {
      const output = await getWeeks();
      const data = parsePSQLOutput(output);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (path === '/api/assignments') {
    try {
      const output = await getAssignments();
      const data = parsePSQLOutput(output);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (path === '/api/linkedin') {
    try {
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
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (path === '/api/linkedin/check-comments') {
    // Trigger comment check via browser
    try {
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
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

const PORT = process.env.PORT || 3456;
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`School Dashboard API running on port ${PORT}`);
});

module.exports = { server };
