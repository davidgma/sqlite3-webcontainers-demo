# SQLite3 WebContainers Demo

A demonstration of executing official SQLite compiled to WebAssembly (WASM) inside **StackBlitz WebContainers** via Node.js, organized in a three-way synchronized workflow between **GitHub**, **StackBlitz**, and **Google AI Studio**.

---

## 📖 Architecture & Environment Background

StackBlitz WebContainers provide a virtualized Node.js environment running directly within the browser via WebAssembly. Running SQLite in this specific sandbox introduces unique conditions:

1. **No Standalone WASI Execution in Shell:**
   WebContainer's shell (`jsh`) cannot execute standalone `.wasm` binaries directly as native commands (running `./sqlite3.wasm` produces `exec format error`). Instead, execution must be orchestrated by a JavaScript runtime (Node.js).
2. **DedicatedWorker Execution Scope:**
   Node runs inside a `DedicatedWorkerGlobalScope`. Standard browser worker globals like `navigator` and `WorkerLocation` exist natively with read-only getters. Attempting to overwrite or polyfill them manually throws `TypeError: Cannot set property... which has only a getter`.
3. **No `file://` Support in Network Shims:**
   Node 22's built-in `fetch` engine (`undici`) in WebContainer does not support `file://` URLs. Compilations targeting browser fetch mechanisms fail with `TypeError: fetch failed (cause: Error: not implemented... yet...)`.
4. **The Solution:**
   Using the official `@sqlite.org/sqlite-wasm` Node build provides pre-configured module initialization and memory management tailored for Node, avoiding network fetch shims and global namespace conflicts.

---

## 🛠️ Step-by-Step Setup Guide

This project was built to maintain a clean link across platforms without triggering StackBlitz's automatic forking.

### 1. GitHub Baseline
The upstream repository was created on GitHub:
- **Repository:** `sqlite3-webcontainers-demo`
- **Branch:** `main`
- **Ignore Rules (`.gitignore`):**
  ```text
  node_modules/
  local.db
  local.db-journal
  .DS_Store
  *.log

  2. StackBlitz WebContainers Link
Opening a GitHub repository via StackBlitz can sometimes launch an isolated in-browser fork if not authenticated or routed properly.

Persistent Access URL:

Plaintext
[https://stackblitz.com/github/](https://stackblitz.com/github/)<your-username>/sqlite3-webcontainers-demo
Dependencies:

Bash
npm init -y
npm install @sqlite.org/sqlite-wasm
Configuration: Ensure "type": "module" is configured in package.json so ES Module import syntax functions cleanly.

3. Google AI Studio Bridge
To integrate with Google AI Studio:

In Google AI Studio (aistudio.google.com), open the Build workspace.

Under the top GitHub synchronization settings, select Link to an existing repository.

Choose sqlite3-webcontainers-demo on branch main.

Any iterations or prompt scaffolding committed in AI Studio push directly to GitHub, allowing git pull inside StackBlitz, while terminal updates from StackBlitz push back upstream.

🚀 Running the Demo
1. Automated Test Script (demo-sql.sh)
The repository includes a ready-to-run shell script demonstrating table creation, inserts, and queries:

Bash
chmod +x demo-sql.sh
./demo-sql.sh

Inside demo-sql.sh:

Bash
#!/bin/sh
node cli.mjs "CREATE TABLE IF NOT EXISTS demo (id INT, item TEXT); INSERT INTO demo VALUES (1, 'StackBlitz'); SELECT * FROM demo;"
2. Direct CLI Invocation
Pass queries as inline arguments to cli.mjs:

Bash
# Query engine version
node cli.mjs "SELECT sqlite_version() AS version;"

# Complex calculations or custom expressions
node cli.mjs "SELECT 42 * 2 AS answer, datetime('now') AS generated_at;"
3. Npm Script Shortcut
Bash
npm run sql -- "SELECT 'Running via npm script' AS message;"