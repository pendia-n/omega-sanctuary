import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Stripe setup (key is optional at startup so the API works without billing configured)
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

// Credit tiers: tier name → { credits, priceUSDCents }
const CREDIT_TIERS: Record<string, { credits: number; priceUSDCents: number }> = {
    starter:    { credits: 500,  priceUSDCents: 500  },  // $5
    pro:        { credits: 1500, priceUSDCents: 1200 },  // $12
    enterprise: { credits: 5000, priceUSDCents: 3500 },  // $35
};

const app = new Hono();

// Rate-limiter store (in-memory per-process)
const _rateStore = new Map<string, { count: number; reset: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;

app.use('*', async (c, next) => {
    // --- CORS ---
    const origin = c.req.header('Origin');
    const allowed = process.env.PRODUCTION_UI_URL || 'http://localhost:3000';
    c.header('Access-Control-Allow-Origin', origin === allowed ? origin : 'http://localhost:3000');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, X-KSpec-API-Key');
    c.header('Access-Control-Allow-Credentials', 'true');
    if (c.req.method === 'OPTIONS') return c.text('OK', 200);

    // --- RATE LIMIT EXEMPTION ---
    // Oversight endpoints (/api/admin) are exempt from all rate-limiting
    if (c.req.path.includes('/admin')) {
        await next();
        return;
    }

    // --- RATE LIMIT ---
    try {
        const id = c.req.header('X-KSpec-API-Key') ?? (c.req.header('X-Forwarded-For') || 'anon');
        const now = Date.now();
        const slot = _rateStore.get(id);
        if (!slot || now > slot.reset) {
            _rateStore.set(id, { count: 1, reset: now + RATE_WINDOW_MS });
        } else {
            slot.count++;
            if (slot.count > RATE_MAX) {
                return c.json({ error: 'Rate limit reached. Slow down.' }, 429);
            }
        }
    } catch (e) {
        // Never crash on rate-limit errors
        console.error('[RATE_LIMIT]', e);
    }

    await next();
});

// AGENT PROFILES (For Physics Compiler)
const AGENT_PROFILES: any = {
    'Atlas': { max_load: 500, precision: 0.1 },
    'Hermes': { max_load: 50, precision: 0.01 },
    'Apollo': { max_load: 10, precision: 0.001 }
};

const VALID_PRIMITIVES = ['K-MOVE', 'K-LIFT', 'K-GRIP', 'K-SENSE', 'K-SCAN', 'K-STREAM', 'K-TORQUE', 'K-FUSE', 'K-VERIFY', 'K-SONAR'];

class PhysicsCompiler {
    validate(agentId: string, commands: any[]) {
        const profile = AGENT_PROFILES[agentId];
        if (!profile) return { valid: false, error: "Illegal Agent Profile" };

        for (const cmd of commands) {
            if (!VALID_PRIMITIVES.includes(cmd.type)) {
                return { valid: false, error: `Illegal Primitive: ${cmd.type} is not a recognized K-Spec instruction.` };
            }

            // Collision/Bounds check (Mock)
            if (cmd.params?.x < 0 || cmd.params?.y < 0) return { valid: false, error: "Boundary Violation: Physical Collision Risk" };

            // Structural Integrity check
            if (cmd.type === 'K-LIFT') {
                const load = cmd.params?.weight || cmd.params?.x || 0;
                if (load > profile.max_load) {
                    return { valid: false, error: `Structural Hazard: Load ${load}kg exceeds ${agentId} capacity (${profile.max_load}kg)` };
                }
            }

            // Precision Resolution check
            if (cmd.type === 'K-FUSE') {
                if (cmd.params?.temp === undefined) return { valid: false, error: "Protocol Error: K-FUSE requires 'temp' parameter." };
                const precisionVal = cmd.params?.precision || cmd.params?.y || 1.0;
                if (precisionVal < profile.precision) {
                    return { valid: false, error: `Precision Error: ${agentId} cannot resolve below ${profile.precision}mm. Requested: ${precisionVal}mm` };
                }
            }
        }
        return { valid: true };
    }

    generateTelemetry(command: any) {
        return {
            status: "NOMINAL",
            joint_tension: (Math.random() * 20 + 5).toFixed(2) + " N",
            magnetic_flux: (Math.random() * 1.2 + 0.1).toFixed(3) + " T",
            thermal_envelope: (Math.random() * 5 + 32).toFixed(1) + " C",
            power_draw: (Math.random() * 500 + 100).toFixed(0) + " W",
            latency: (Math.random() * 50 + 10).toFixed(0) + " ms",
            structural_stability: "99.98%",
            kinetic_potential: (Math.random() * 1000 + 500).toFixed(0) + " J"
        };
    }
}

const compiler = new PhysicsCompiler();

// Seed Admin Password
const initialAdminHash = createHash('sha256').update('osossosohaha').digest('hex');
const adminConfig = db.prepare('SELECT * FROM admin_config WHERE key = ?').get('admin_password');

// Force reset if env flag is set, or seed if missing
if (process.env.RESET_ADMIN_PASSWORD === 'true' || !adminConfig) {
    console.log(`[ADMIN SEED] ${!adminConfig ? 'Missing protocol entry. Seeding default.' : 'Force reset protocol active.'}`);
    db.prepare('INSERT OR REPLACE INTO admin_config (key, value) VALUES (?, ?)').run('admin_password', initialAdminHash);
}

// Background Refill Task: Processes all identities every 24h based on created_at
function processAllRefills() {
    try {
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        const activeKeys = db.prepare("SELECT * FROM api_keys WHERE status = 'ACTIVE'").all() as any[];

        for (const key of activeKeys) {
            const createdAt = new Date(key.created_at + 'Z').getTime();
            const totalCyclesPassed = Math.floor((now - createdAt) / msPerDay);
            // We need to track how many cycles we've already CHECKED. 
            // Since we don't have a 'checked_cycles' column, we can use last_refill 
            // to infer how many cycles were already processed.
            const lastRefillDate = new Date(key.last_refill + (key.last_refill.includes('Z') ? '' : 'Z')).getTime();
            const cyclesAlreadyProcessed = Math.floor((lastRefillDate - createdAt) / msPerDay);

            const pendingCycles = totalCyclesPassed - cyclesAlreadyProcessed;

            if (pendingCycles > 0) {
                let currentCredits = key.credits;
                let newRefillCount = key.refill_count || 0;
                let actuallyRefilledAmount = 0;

                for (let i = 0; i < pendingCycles; i++) {
                    if (currentCredits <= 160) {
                        currentCredits += 32;
                        actuallyRefilledAmount += 32;
                        newRefillCount++; // Only increment if we actually refilled
                    }
                }

                // Update last_refill to reflect that we've processed up to this current 24h window
                const newLastRefillDate = new Date(createdAt + totalCyclesPassed * msPerDay).toISOString();
                db.prepare('UPDATE api_keys SET credits = ?, last_refill = ?, refill_count = ? WHERE id = ?')
                    .run(currentCredits, newLastRefillDate, newRefillCount, key.id);

                if (actuallyRefilledAmount > 0) {
                    console.log(`[BACKGROUND-REFILL] Identity ${key.id}: Refilled ${actuallyRefilledAmount} credits. New refill count: ${newRefillCount}`);
                }
            }
        }
    } catch (e) {
        console.error('[BACKGROUND-REFILL] Error:', e);
    }
}

// Start background interval (every 10 minutes to ensuse precision across reboots)
setInterval(processAllRefills, 10 * 60 * 1000);
// Initial run
setTimeout(processAllRefills, 5000);

// Middleware: Ghost Timer (Refill check removed here, now background-only)
app.use('*', async (c, next) => {
    const apiKey = c.req.header('X-KSpec-API-Key');
    if (apiKey) {
        const keyHash = createHash('sha256').update(apiKey).digest('hex');
        const keyData = db.prepare('SELECT * FROM api_keys WHERE key_hash = ?').get(keyHash) as any;

        if (keyData) {
            if (keyData.status === 'EPHEMERAL') {
                const createdAt = new Date(keyData.created_at + 'Z').getTime();
                const now = Date.now();
                if (now - createdAt > 9000) {
                    db.prepare('DELETE FROM api_keys WHERE id = ?').run(keyData.id);
                    return c.json({ error: "Focus required. Identity expired." }, 403);
                }
            }
        }
    }
    await next();
});

// GHOST PROTOCOL: Ignite
app.post('/api/auth/ignite', (c) => {
    const apiKey = `sk_${uuidv4()}`;
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const id = uuidv4();
    db.prepare('INSERT INTO api_keys (id, key_hash, credits) VALUES (?, ?, 160.0)').run(id, keyHash);
    return c.json({ apiKey, status: "IGNITED", credits: 160.0 });
});

// CLAIM IDENTITY
app.post('/api/auth/claim', (c) => {
    const apiKey = c.req.header('X-KSpec-API-Key');
    if (!apiKey) return c.json({ error: "Unauthorized" }, 401);
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const keyData = db.prepare('SELECT * FROM api_keys WHERE key_hash = ?').get(keyHash) as any;
    if (!keyData) return c.json({ error: "Invalid Key" }, 403);

    const updates: string[] = [];

    if (keyData.status === 'EPHEMERAL') {
        updates.push("status = 'ACTIVE'");
    }
    if (!keyData.first_login_at) {
        updates.push("first_login_at = CURRENT_TIMESTAMP");
        updates.push("last_refill = CURRENT_TIMESTAMP");
    }

    if (updates.length > 0) {
        db.prepare(`UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`).run(keyData.id);
    }

    return c.json({ status: "ACTIVE", credits: keyData.credits });
});

// HARDWARE REGISTRY
app.post('/api/register', async (c) => {
    const body = await c.req.json();
    return c.json({ status: "NODE_REGISTERED", node_id: `node_${uuidv4().substring(0, 8)}`, earning_rate: "0.4c/cmd" });
});

// SOVEREIGN ACTION: Execute
app.post('/api/execute', async (c) => {
    const apiKey = c.req.header('X-KSpec-API-Key');
    if (!apiKey) return c.json({ error: "Unauthorized" }, 401);

    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const keyData = db.prepare('SELECT * FROM api_keys WHERE key_hash = ?').get(keyHash) as any;
    if (!keyData) return c.json({ error: "Invalid Key" }, 403);

    // Track first activity if they use API directly without claiming via UI
    if (!keyData.first_login_at) {
        db.prepare("UPDATE api_keys SET first_login_at = CURRENT_TIMESTAMP, last_refill = CURRENT_TIMESTAMP WHERE id = ?").run(keyData.id);
        keyData.first_login_at = new Date().toISOString();
        keyData.last_refill = new Date().toISOString();
    }

    const body = await c.req.json();
    const { agentId, commands } = body;
    if (!Array.isArray(commands)) return c.json({ error: "Commands mismatch" }, 400);

    // Physics Validation
    const validation = compiler.validate(agentId, commands);
    if (!validation.valid) {
        return c.json({ error: "PHYSICS_COMPILER_ERROR", details: validation.error }, 400);
    }

    // Calculate complex costs
    let cost = 0;
    for (const cmd of commands) {
        if (cmd.type === 'K-VERIFY') {
            cost += 3.0;
        } else if (['K-SCAN', 'K-STREAM', 'K-TORQUE', 'K-FUSE', 'K-SENSE', 'K-SCAN'].includes(cmd.type)) {
            cost += 1.5;
        } else {
            cost += 1.0;
        }
    }

    if (keyData.credits < cost) return c.json({ error: "Insufficient Credits" }, 402);

    const timestamp = new Date().toISOString();
    const results = commands.map(cmd => ({
        type: cmd.type,
        status: "SUCCESS",
        telemetry: compiler.generateTelemetry(cmd)
    }));

    const proof = createHash('sha256').update(JSON.stringify({ agentId, results, timestamp })).digest('hex');

    db.prepare('INSERT INTO action_logs (id, api_key_id, agent_id, command_sequence, results, proof, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), keyData.id, agentId, JSON.stringify(commands), JSON.stringify(results), proof, timestamp);

    db.prepare('UPDATE api_keys SET credits = credits - ? WHERE id = ?').run(cost, keyData.id);

    return c.json({ agentId, executionProof: proof, results, remainingCredits: keyData.credits - cost, timestamp });
});

app.get('/api/user/credits', (c) => {
    const apiKey = c.req.header('X-KSpec-API-Key');
    if (!apiKey) return c.json({ error: "Unauthorized" }, 401);
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const keyData = db.prepare('SELECT credits, status FROM api_keys WHERE key_hash = ?').get(keyHash) as any;
    if (!keyData) return c.json({ error: "Invalid Key" }, 403);
    return c.json({ credits: keyData.credits, status: keyData.status });
});

app.get('/api/user/history', (c) => {
    const apiKey = c.req.header('X-KSpec-API-Key');
    if (!apiKey) return c.json({ error: "Unauthorized" }, 401);
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const keyData = db.prepare('SELECT id FROM api_keys WHERE key_hash = ?').get(keyHash) as any;
    if (!keyData) return c.json({ error: "Invalid Key" }, 403);
    const logs = db.prepare('SELECT * FROM action_logs WHERE api_key_id = ? ORDER BY timestamp DESC LIMIT 50').all(keyData.id);
    return c.json({ logs });
});

// ADMIN OVERSIGHT
app.post('/api/admin/login', async (c) => {
    try {
        const body = await c.req.json();
        const { password } = body;
        if (!password) return c.json({ error: "No password provided" }, 400);

        const hash = createHash('sha256').update(password).digest('hex');
        const stored = db.prepare('SELECT value FROM admin_config WHERE key = ?').get('admin_password') as any;

        if (!stored) {
            console.error("[ADMIN LOGIN] Critical Failure: No admin password stored in database.");
            return c.json({ error: "Oversight Protocol Not Seeded" }, 500);
        }

        if (hash === stored.value) {
            return c.json({ status: "AUTHORIZED" });
        }

        console.warn(`[ADMIN LOGIN] Unauthorized Access Attempt with password: ${password}`);
        return c.json({ error: "Invalid Oversight Protocol" }, 403);
    } catch (err) {
        console.error("[ADMIN LOGIN] Internal Error:", err);
        return c.json({ error: "Internal Protocol Failure" }, 500);
    }
});

app.get('/api/admin/stats', (c) => {
    const users = db.prepare('SELECT COUNT(*) as count FROM api_keys').get() as any;
    const logs = db.prepare('SELECT COUNT(*) as count FROM action_logs').get() as any;
    const refills = db.prepare('SELECT SUM(refill_count) as count FROM api_keys').get() as any;
    return c.json({ users: users.count, logs: logs.count, totalRefills: refills.count || 0 });
});

app.get('/api/admin/users', (c) => {
    const users = db.prepare('SELECT id, credits, status, created_at, refill_count, first_login_at FROM api_keys ORDER BY created_at DESC').all();
    return c.json({ users });
});

app.delete('/api/admin/users/:id', (c) => {
    const id = c.req.param('id');
    try {
        const deleteLogs = db.prepare('DELETE FROM action_logs WHERE api_key_id = ?');
        const deleteKey = db.prepare('DELETE FROM api_keys WHERE id = ?');

        const transaction = db.transaction(() => {
            deleteLogs.run(id);
            deleteKey.run(id);
        });

        transaction();
        return c.json({ status: "DELETED" });
    } catch (e) {
        console.error('[ADMIN DELETE] Error:', e);
        return c.json({ error: "Internal Protocol Failure" }, 500);
    }
});

app.get('/api/admin/audit', (c) => {
    const page = Number(c.req.query('page')) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const type = c.req.query('type');
    const after = c.req.query('after');
    const before = c.req.query('before');

    let query = 'SELECT * FROM action_logs WHERE 1=1';
    const params: any[] = [];

    if (type) {
        query += ' AND command_sequence LIKE ?';
        params.push(`%${type}%`);
    }
    if (after) {
        query += ' AND timestamp >= ?';
        params.push(after);
    }
    if (before) {
        query += ' AND timestamp <= ?';
        params.push(before);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params);

    // Also get total count for pagination info
    let countQuery = 'SELECT COUNT(*) as count FROM action_logs WHERE 1=1';
    const countParams: any[] = [];
    if (type) {
        countQuery += ' AND command_sequence LIKE ?';
        countParams.push(`%${type}%`);
    }
    if (after) {
        countQuery += ' AND timestamp >= ?';
        countParams.push(after);
    }
    if (before) {
        countQuery += ' AND timestamp <= ?';
        countParams.push(before);
    }
    const total = (db.prepare(countQuery).get(...countParams) as any).count;

    return c.json({
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

app.post('/api/admin/password', async (c) => {
    const { oldPassword, newPassword } = await c.req.json();
    const oldHash = createHash('sha256').update(oldPassword).digest('hex');
    const stored = db.prepare('SELECT value FROM admin_config WHERE key = ?').get('admin_password') as any;

    if (oldHash !== stored.value) return c.json({ error: "Current password mismatch" }, 403);

    const newHash = createHash('sha256').update(newPassword).digest('hex');
    db.prepare('UPDATE admin_config SET value = ? WHERE key = ?').run(newHash, 'admin_password');
    return c.json({ status: "PASSWORD_UPDATED" });
});

// ─── OPENAPI SPEC ────────────────────────────────────────────────────────────
app.get('/api/openapi.json', (c) => {
    try {
        const specPath = join(__dirname, '..', 'openapi.json');
        const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
        return c.json(spec);
    } catch (e) {
        return c.json({ error: 'Spec not found' }, 404);
    }
});

// ─── BILLING: CHECKOUT ───────────────────────────────────────────────────────
app.post('/api/billing/checkout', async (c) => {
    if (!stripe) return c.json({ error: 'Billing not configured. Set STRIPE_SECRET_KEY.' }, 503);

    const apiKey = c.req.header('X-KSpec-API-Key');
    if (!apiKey) return c.json({ error: 'Unauthorized' }, 401);
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const keyData = db.prepare('SELECT id FROM api_keys WHERE key_hash = ?').get(keyHash) as any;
    if (!keyData) return c.json({ error: 'Invalid Key' }, 403);

    const body = await c.req.json();
    const { tier } = body;
    const tierConfig = CREDIT_TIERS[tier];
    if (!tierConfig) return c.json({ error: `Invalid tier. Valid: ${Object.keys(CREDIT_TIERS).join(', ')}` }, 400);

    const successUrl = (process.env.PRODUCTION_UI_URL || 'http://localhost:3000') + '/?billing=success';
    const cancelUrl  = (process.env.PRODUCTION_UI_URL || 'http://localhost:3000') + '/?billing=cancelled';

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Orega Sanctuary Credits — ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`,
                    description: `${tierConfig.credits} execution credits added to your sanctuary identity.`,
                },
                unit_amount: tierConfig.priceUSDCents,
            },
            quantity: 1,
        }],
        metadata: {
            apiKeyId: keyData.id,
            creditAmount: String(tierConfig.credits),
            tier,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
    });

    return c.json({ checkoutUrl: session.url, sessionId: session.id });
});

// ─── BILLING: STRIPE WEBHOOK ─────────────────────────────────────────────────
app.post('/api/billing/webhook', async (c) => {
    if (!stripe) return c.json({ error: 'Billing not configured.' }, 503);

    const sig = c.req.header('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !webhookSecret) return c.json({ error: 'Missing signature or secret' }, 400);

    const rawBody = await c.req.text();
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
        console.error('[STRIPE WEBHOOK] Signature verification failed:', err.message);
        return c.json({ error: 'Webhook signature invalid' }, 400);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const apiKeyId    = session.metadata?.apiKeyId;
        const creditAmount = Number(session.metadata?.creditAmount ?? 0);

        if (!apiKeyId || creditAmount <= 0) {
            console.error('[STRIPE WEBHOOK] Missing metadata on session:', session.id);
            return c.json({ error: 'Bad metadata' }, 400);
        }

        db.prepare('UPDATE api_keys SET credits = credits + ? WHERE id = ?').run(creditAmount, apiKeyId);
        console.log(`[STRIPE WEBHOOK] Credited ${creditAmount}c to identity ${apiKeyId} (session ${session.id})`);
    }

    return c.json({ received: true });
});

// ─────────────────────────────────────────────────────────────────────────────
const port = 4400;
console.log(`Orega Sanctuary Kernel Active on Port ${port} (Physics-Aware Mode)`);
serve({ fetch: app.fetch, port });
