import db from './db.js';

try {
    const tableInfo = db.prepare("PRAGMA table_info(api_keys)").all();
    console.log("api_keys columns:", tableInfo.map((c: any) => c.name));

    const adminConfig = db.prepare("SELECT * FROM admin_config").all();
    console.log("admin_config entries:", adminConfig.length);

    const stats = db.prepare('SELECT COUNT(*) as count FROM api_keys').get() as any;
    console.log("api_keys count:", stats.count);

    const refills = db.prepare('SELECT SUM(refill_count) as count FROM api_keys').get() as any;
    console.log("total refills:", refills.count);

} catch (e: any) {
    console.error("DB check failed:", e.message);
}
