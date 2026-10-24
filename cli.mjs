import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const sqlInput = process.argv.slice(2).join(' ').trim() || 'SELECT sqlite_version() AS version;';

try {
  const sqlite3 = await sqlite3InitModule();
  const db = new sqlite3.oo1.DB('local.db');

  let rowCount = 0;

  db.exec({
    sql: sqlInput,
    rowMode: 'object',
    callback: (row) => {
      console.log(JSON.stringify(row));
      rowCount++;
    }
  });

  if (rowCount === 0) {
    console.log('Query executed successfully (0 rows returned).');
  }

  db.close();
} catch (err) {
  console.error('SQLite execution error:', err.message || err);
  process.exit(1);
}