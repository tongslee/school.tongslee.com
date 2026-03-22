# School Dashboard

A database-agnostic school assignment dashboard for tracking Daniel's schoolwork.

## Quick Start

```bash
# Install dependency
npm install better-sqlite3

# Run API server (uses SQLite by default)
node api.js

# Open in browser
open http://localhost:3456
```

## Database Options

The dashboard works with SQLite (default) or PostgreSQL.

### SQLite (Default)
No setup needed. Data stored in `./data/school.db`.

```bash
DB_TYPE=sqlite node api.js
```

### PostgreSQL
Set environment variables:

```bash
DB_TYPE=postgresql \
PGHOST=your-db-host \
PGPORT=5432 \
PGUSER=your-user \
PGPASSWORD=your-password \
PGDATABASE=your-database \
node api.js
```

## Deploy to Railway (Recommended)

1. Create new Railway project
2. Add PostgreSQL database
3. Deploy with these environment variables:
   - `DB_TYPE=postgresql`
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (auto-filled by Railway)
4. Set `PORT=8080` (Railway uses this port)

## Deploy to Render

1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `npm install`
4. Set start command: `node api.js`
5. Add PostgreSQL database (optional)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/subjects` | List all subjects |
| `GET /api/weeks` | List all weeks |
| `GET /api/assignments` | List all assignments |
| `GET /api/linkedin` | LinkedIn posts data |
| `GET /health` | Health check |

## Frontend

The `index.html` file can be deployed to GitHub Pages or any static host. Update the API URL in `index.html` if your API is hosted elsewhere (default: `/api/*` assumes same origin).

For GitHub Pages deployment at `https://username.github.io/repo`:
```javascript
// Change fetch('/api/...') to fetch('https://your-api-domain.com/api/...')
```
