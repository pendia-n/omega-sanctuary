import Database from 'better-sqlite3';
import { createHash } from 'crypto';

const db = new Database('kinetic.db');
const hash = createHash('sha256').update('osossosohaha').digest('hex');

db.prepare('UPDATE admin_config SET value = ? WHERE key = ?').run(hash, 'admin_password');
console.log('Admin password reset to: osossosohaha');
db.close();
