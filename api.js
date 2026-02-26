/**
 * School Dashboard API
 * Serves assignment data for the dashboard
 */

const http = require('http');
const { exec: execSync } = require('child_process');

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
