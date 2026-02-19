import Database from 'better-sqlite3';

const db = new Database('kinetic.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    key_hash TEXT UNIQUE NOT NULL,
    credits REAL DEFAULT 160.0,
    status TEXT DEFAULT 'EPHEMERAL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_refill DATETIME DEFAULT CURRENT_TIMESTAMP,
    first_login_at DATETIME,
    refill_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS action_logs (
    id TEXT PRIMARY KEY,
    api_key_id TEXT,
    agent_id TEXT,
    command_sequence TEXT NOT NULL,
    results TEXT,
    proof TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(api_key_id) REFERENCES api_keys(id)
  );

  CREATE TABLE IF NOT EXISTS admin_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// MIGRATIONS
try {
  db.exec("ALTER TABLE api_keys ADD COLUMN refill_count INTEGER DEFAULT 0;");
} catch (e) { }

export default db;
