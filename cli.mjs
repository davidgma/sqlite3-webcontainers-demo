/**
 * cli.mjs - SQLite WASM CLI Runner for StackBlitz WebContainers
 *
 * Initializes SQLite via the official @sqlite.org/sqlite-wasm distribution
 * and evaluates single or multi-statement queries passed through argv.
 */

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

// 1. ARGUMENT PARSING
// Collect all trailing arguments into a single SQL string.
// If none are supplied, default to querying the SQLite engine version.
const sqlInput = process.argv.slice(2).join(' ').trim() || 'SELECT sqlite_version() AS version;';

try {
  // 2. ASYNC WASM INITIALIZATION
  // sqlite3InitModule loads the compiled WebAssembly binary into memory,
  // initializes the Emscripten runtime, and exposes the top-level API.
  // Using the official package bypasses browser fetch/shim limitations.
  const sqlite3 = await sqlite3InitModule();

  // 3. DATABASE INSTANTIATION
  // Instantiate via the oo1 (Object-Oriented v1) API:
  // - 'local.db' stores data inside the WebContainer virtual file system.
  // - ':memory:' can be passed instead for temporary in-memory structures.
  const db = new sqlite3.oo1.DB('local.db');

  let rowCount = 0;

  // 4. SQL EXECUTION & STREAMING
  // db.exec parses and evaluates SQL strings.
  db.exec({
    sql: sqlInput,
    // 'object' mode outputs results as key-value JSON records rather than arrays
    rowMode: 'object',
    // The callback fires once per returned row from any SELECT expression.
    // Printing to stdout allows multi-statement scripts to output all records cleanly.
    callback: (row) => {
      console.log(JSON.stringify(row));
      rowCount++;
    }
  });

  // 5. NON-QUERY FEEDBACK
  // Provide terminal confirmation when executing DDL/DML (CREATE, INSERT, UPDATE)
  // that produces no record rows.
  if (rowCount === 0) {
    console.log('Query executed successfully (0 rows returned).');
  }

  // 6. RESOURCE CLEANUP
  // Close the handle to flush pending writes and release WASM heap allocations.
  db.close();

} catch (err) {
  // Catch WASM loading errors and SQL syntax or constraint failures
  console.error('SQLite execution error:', err.message || err);
  process.exit(1);
}