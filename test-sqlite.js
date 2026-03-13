const Database = require('better-sqlite3');
try {
    const db = new Database(':memory:');
    console.log('Successfully loaded better-sqlite3');
} catch (e) {
    console.error('Failed to load better-sqlite3:', e);
}
