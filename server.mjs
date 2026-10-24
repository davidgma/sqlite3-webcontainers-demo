import http from 'node:http';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const PORT = 3000;
const HOST = '0.0.0.0';

let sqlite3;
let db;
let sqliteVersion = 'Unknown';

async function initDb() {
  sqlite3 = await sqlite3InitModule();
  db = new sqlite3.oo1.DB('local.db');
  
  db.exec({
    sql: 'SELECT sqlite_version() AS version;',
    rowMode: 'object',
    callback: (row) => {
      sqliteVersion = row.version;
    }
  });

  console.log(`[SQLite WASM] Initialized database local.db (SQLite v${sqliteVersion})`);
}

function executeQuery(sql) {
  const startTime = Date.now();
  const rows = [];
  let columnNames = [];

  db.exec({
    sql,
    rowMode: 'object',
    columnNames: columnNames,
    callback: (row) => {
      rows.push(row);
    }
  });

  const durationMs = Date.now() - startTime;
  return {
    success: true,
    rows,
    rowCount: rows.length,
    columnNames: columnNames.length > 0 ? columnNames : (rows[0] ? Object.keys(rows[0]) : []),
    durationMs
  };
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>sqlite3-webcontainers-demo</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-hover: #0284c7;
      --success: #4ade80;
      --error: #f87171;
      --code-bg: #090d16;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px 16px;
      min-height: 100vh;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .quick-queries {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .query-chip {
      background: #334155;
      color: #e2e8f0;
      border: 1px solid #475569;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .query-chip:hover {
      background: #475569;
      border-color: var(--accent);
      color: #fff;
    }
    textarea {
      width: 100%;
      height: 120px;
      background: var(--code-bg);
      color: #e2e8f0;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9rem;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
    }
    textarea:focus {
      border-color: var(--accent);
    }
    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .btn {
      background: var(--accent);
      color: #04101f;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-size: 0.875rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .btn:hover {
      background: var(--accent-hover);
      color: #fff;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .helper-text {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .status-msg {
      margin-top: 14px;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 0.85rem;
      display: none;
    }
    .status-msg.success {
      background: rgba(74, 222, 128, 0.1);
      border: 1px solid rgba(74, 222, 128, 0.3);
      color: var(--success);
      display: block;
    }
    .status-msg.error {
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.3);
      color: var(--error);
      display: block;
    }
    .tabs {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .tab-btn.active {
      color: var(--accent);
      background: rgba(56, 189, 248, 0.1);
    }
    .table-container {
      overflow-x: auto;
      max-height: 400px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      text-align: left;
    }
    th {
      background: #090d16;
      color: var(--accent);
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      font-weight: 600;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #283548;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #cbd5e1;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    pre {
      background: var(--code-bg);
      padding: 12px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.825rem;
      color: #e2e8f0;
      overflow-x: auto;
      max-height: 350px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .cli-note {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
    code {
      background: #090d16;
      padding: 2px 6px;
      border-radius: 4px;
      color: #38bdf8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>sqlite3-webcontainers-demo</h1>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
          SQLite WASM on Node.js with persistent <code>local.db</code> database
        </p>
      </div>
      <div>
        <span class="badge" id="version-badge">SQLite WASM v3.54.1</span>
      </div>
    </header>

    <div class="card">
      <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--text-muted);">
        Sample Queries:
      </div>
      <div class="quick-queries">
        <button class="query-chip" data-sql="SELECT sqlite_version() AS version;">Version</button>
        <button class="query-chip" data-sql="CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);">Create Table</button>
        <button class="query-chip" data-sql="INSERT INTO notes (title, content) VALUES ('Welcome', 'Running SQLite WASM in AI Studio!'), ('Demo', 'Fast in-process SQL execution');">Insert Data</button>
        <button class="query-chip" data-sql="SELECT * FROM notes;">Select Notes</button>
        <button class="query-chip" data-sql="SELECT name, type, sql FROM sqlite_master WHERE type='table';">Show Tables</button>
      </div>

      <textarea id="sql-input" placeholder="Enter SQL query here (e.g. SELECT sqlite_version() AS version;)"></textarea>
      
      <div class="controls">
        <span class="helper-text">Press <kbd style="background:#334155;padding:2px 6px;border-radius:4px;color:#fff;">Ctrl</kbd> + <kbd style="background:#334155;padding:2px 6px;border-radius:4px;color:#fff;">Enter</kbd> to execute</span>
        <button id="run-btn" class="btn">Execute Query</button>
      </div>

      <div id="status-box" class="status-msg"></div>
    </div>

    <div class="card">
      <div class="tabs">
        <button class="tab-btn active" id="tab-table">Table View</button>
        <button class="tab-btn" id="tab-json">JSON (CLI Mode)</button>
      </div>

      <div id="view-table">
        <div class="table-container">
          <table id="result-table" style="display:none;">
            <thead id="result-head"></thead>
            <tbody id="result-body"></tbody>
          </table>
          <div id="empty-state" class="empty-state">Execute a query above to see results.</div>
        </div>
      </div>

      <div id="view-json" style="display:none;">
        <pre id="json-output">// JSON output matching cli.mjs</pre>
      </div>
    </div>

    <div class="card cli-note">
      <strong>CLI Compatibility:</strong> This repository's original CLI script <code>cli.mjs</code> remains available. You can run queries directly via the command line with <code>npm run sql -- "SELECT 1 + 1;"</code>.
    </div>
  </div>

  <script>
    const sqlInput = document.getElementById('sql-input');
    const runBtn = document.getElementById('run-btn');
    const statusBox = document.getElementById('status-box');
    const tabTable = document.getElementById('tab-table');
    const tabJson = document.getElementById('tab-json');
    const viewTable = document.getElementById('view-table');
    const viewJson = document.getElementById('view-json');
    const resultTable = document.getElementById('result-table');
    const resultHead = document.getElementById('result-head');
    const resultBody = document.getElementById('result-body');
    const emptyState = document.getElementById('empty-state');
    const jsonOutput = document.getElementById('json-output');

    sqlInput.value = 'SELECT sqlite_version() AS version;';

    document.querySelectorAll('.query-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sqlInput.value = chip.getAttribute('data-sql');
        runQuery();
      });
    });

    tabTable.addEventListener('click', () => {
      tabTable.classList.add('active');
      tabJson.classList.remove('active');
      viewTable.style.display = 'block';
      viewJson.style.display = 'none';
    });

    tabJson.addEventListener('click', () => {
      tabJson.classList.add('active');
      tabTable.classList.remove('active');
      viewTable.style.display = 'none';
      viewJson.style.display = 'block';
    });

    sqlInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runQuery();
      }
    });

    runBtn.addEventListener('click', runQuery);

    async function runQuery() {
      const sql = sqlInput.value.trim();
      if (!sql) return;

      runBtn.disabled = true;
      runBtn.textContent = 'Running...';
      statusBox.className = 'status-msg';
      statusBox.style.display = 'none';

      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql })
        });
        const data = await res.json();

        if (data.success) {
          statusBox.textContent = \`Query executed successfully (\${data.rowCount} rows returned in \${data.durationMs}ms)\`;
          statusBox.className = 'status-msg success';

          // JSON View (matching cli.mjs format of 1 JSON per line)
          if (data.rows.length === 0) {
            jsonOutput.textContent = 'Query executed successfully (0 rows returned).';
          } else {
            jsonOutput.textContent = data.rows.map(r => JSON.stringify(r)).join('\\n');
          }

          // Table View
          if (data.rows.length > 0) {
            const cols = data.columnNames && data.columnNames.length > 0 
              ? data.columnNames 
              : Object.keys(data.rows[0]);

            resultHead.innerHTML = '<tr>' + cols.map(c => '<th>' + escapeHtml(c) + '</th>').join('') + '</tr>';
            resultBody.innerHTML = data.rows.map(row => {
              return '<tr>' + cols.map(c => '<td>' + escapeHtml(String(row[c] !== undefined ? row[c] : '')) + '</td>').join('') + '</tr>';
            }).join('');

            resultTable.style.display = 'table';
            emptyState.style.display = 'none';
          } else {
            resultTable.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.textContent = 'Statement completed successfully. No rows returned.';
          }
        } else {
          statusBox.textContent = 'SQLite execution error: ' + (data.error || 'Unknown error');
          statusBox.className = 'status-msg error';
          jsonOutput.textContent = 'Error: ' + data.error;
          resultTable.style.display = 'none';
          emptyState.style.display = 'block';
          emptyState.textContent = 'Query resulted in an error.';
        }
      } catch (err) {
        statusBox.textContent = 'Request failed: ' + err.message;
        statusBox.className = 'status-msg error';
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = 'Execute Query';
      }
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    runQuery();
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // CORS headers for local/container dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_CONTENT);
    return;
  }

  if (url.pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      sqliteVersion,
      database: 'local.db'
    }));
    return;
  }

  if (url.pathname === '/api/query' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const sql = (payload.sql || '').trim();

        if (!sql) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'SQL query string required' }));
          return;
        }

        const result = executeQuery(sql);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: err.message || String(err)
        }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

await initDb();

server.listen(PORT, HOST, () => {
  console.log(`[sqlite3-webcontainers-demo] Server listening at http://${HOST}:${PORT}`);
});
