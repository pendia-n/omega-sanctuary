import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Zap, History, Layout, Command, LogOut, ChevronRight, Copy, Check, Play, RefreshCw, Cpu, Box, Eye, Activity, FileText } from 'lucide-react';

type KineticLog = {
    id: string;
    agent_id: string;
    command_sequence: string;
    results: string;
    proof: string;
    timestamp: string;
};

const AGENT_CAPABILITIES: any = {
    'Atlas': {
        icon: <Box size={24} />,
        desc: 'Logistics & Heavy Lifting Specialist',
        longDesc: 'Optimized for high-torque vertical displacement.',
        caps: ['K-MOVE', 'K-LIFT', 'K-GRIP'],
        examples: [
            { t: 'K-MOVE', p: { x: 10, y: 0, z: 5, speed: 0.8 } },
            { t: 'K-LIFT', p: { weight: 250, height: 1.2 } },
            { t: 'K-GRIP', p: { pressure: 80, profile: "Rigid" } }
        ]
    },
    'Hermes': {
        icon: <Eye size={24} />,
        desc: 'Data Collection & Surveillance',
        longDesc: 'Equipped with thermal and visual sonic sensors.',
        caps: ['K-SENSE', 'K-SCAN', 'K-STREAM'],
        examples: [
            { t: 'K-SENSE', p: { type: "Visual", res: 1 } },
            { t: 'K-SCAN', p: { range: 50, mode: "Thermal" } },
            { t: 'K-STREAM', p: { bitrate: "10mbps", ch: 4 } }
        ]
    },
    'Apollo': {
        icon: <Activity size={24} />,
        desc: 'Precision Manufacturing',
        longDesc: 'Sub-millimeter precision for delicate assembly.',
        caps: ['K-TORQUE', 'K-FUSE', 'K-VERIFY'],
        examples: [
            { t: 'K-TORQUE', p: { joint: "A1", force: 45.5 } },
            { t: 'K-FUSE', p: { temp: 1450, duration: 0.5, precision: 0.1 } },
            { t: 'K-VERIFY', p: { tolerance: 0.001 } }
        ]
    }
};

export default function App() {
    const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('kinetic_key'));
    const [credits, setCredits] = useState<number | null>(null);
    const [history, setHistory] = useState<KineticLog[]>([]);
    const [igniting, setIgniting] = useState(false);
    const [tempKey, setTempKey] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);
    const [loginValue, setLoginValue] = useState('');
    const [activeTab, setActiveTab] = useState('Showcase');
    const [agentId, setAgentId] = useState('Atlas');
    const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
    const [latestIdeResult, setLatestIdeResult] = useState<any>(null);

    // Command Console State
    const [cmdType, setCmdType] = useState('K-LIFT');
    const [cmdX, setCmdX] = useState('0');
    const [cmdY, setCmdY] = useState('0');
    const [cmdZ, setCmdZ] = useState('0');
    const [executing, setExecuting] = useState(false);

    // IDE State
    const [ideContent, setIdeContent] = useState('[\n  { "type": "K-LIFT", "params": { "weight": 250, "height": 1.2 } }\n]');

    // Admin State
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminStats, setAdminStats] = useState<any>(null);
    const [adminUsers, setAdminUsers] = useState<any[]>([]);
    const [adminAudit, setAdminAudit] = useState<any[]>([]);
    const [adminPasswordUpdate, setAdminPasswordUpdate] = useState({ old: '', new: '', confirm: '' });

    // Notifications
    const [copyFeedback, setCopyFeedback] = useState(false);

    const keyExpiryTimeout = useRef<NodeJS.Timeout | null>(null);

    const fetchData = async (key: string) => {
        try {
            const creRes = await fetch('/api/user/credits', { headers: { 'X-KSpec-API-Key': key } });
            const hisRes = await fetch('/api/user/history', { headers: { 'X-KSpec-API-Key': key } });
            const creData = await creRes.json();
            const hisData = await hisRes.json();

            if (creData.error) throw new Error(creData.error);
            setCredits(creData.credits);
            setHistory(hisData.logs || []);
            setApiKey(key);
            localStorage.setItem('kinetic_key', key);
        } catch (e) {
            console.error(e);
            logout();
        }
    };

    const adminLogin = async () => {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify({ password: adminPassword })
        });
        const data = await res.json();
        if (data.status === 'AUTHORIZED') {
            setIsAdminMode(true);
            fetchAdminData();
        } else {
            alert(data.error);
        }
    };

    const fetchAdminData = async () => {
        const [s, u, a] = await Promise.all([
            fetch('/api/admin/stats').then(r => r.json()),
            fetch('/api/admin/users').then(r => r.json()),
            fetch('/api/admin/audit').then(r => r.json())
        ]);
        setAdminStats(s);
        setAdminUsers(u.users);
        setAdminAudit(a.logs);
    };

    const updateAdminPassword = async () => {
        if (adminPasswordUpdate.new !== adminPasswordUpdate.confirm) return alert("Passwords mismatch");
        const res = await fetch('/api/admin/password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword: adminPasswordUpdate.old, newPassword: adminPasswordUpdate.new })
        });
        const data = await res.json();
        if (data.status === 'PASSWORD_UPDATED') {
            alert("Security Protocol Updated");
            setAdminPasswordUpdate({ old: '', new: '', confirm: '' });
        } else {
            alert(data.error);
        }
    };

    useEffect(() => {
        if (apiKey) fetchData(apiKey);
    }, [apiKey]);

    const logout = () => {
        localStorage.removeItem('kinetic_key');
        setApiKey(null);
        setCredits(null);
        setHistory([]);
    };

    const ignite = async () => {
        const res = await fetch('/api/auth/ignite', { method: 'POST' });
        const data = await res.json();
        setTempKey(data.apiKey);
        setTimer(9);
        setIgniting(true);

        if (keyExpiryTimeout.current) clearTimeout(keyExpiryTimeout.current);
        keyExpiryTimeout.current = setTimeout(() => {
            setIgniting(false);
            setTempKey(null);
            setTimer(0);
        }, 9000);
    };

    const claimIdentity = async (key: string) => {
        const res = await fetch('/api/auth/claim', {
            method: 'POST',
            headers: { 'X-KSpec-API-Key': key }
        });
        const data = await res.json();
        if (data.status === 'ACTIVE') {
            if (keyExpiryTimeout.current) clearTimeout(keyExpiryTimeout.current);
            setIgniting(false);
            setTempKey(null);
            setTimer(0);
            setApiKey(key);
        }
    };

    const runCommand = async (agent: string, customCommands?: any[]) => {
        if (!apiKey) return;
        setExecuting(true);
        try {
            let cmds: any[];
            if (customCommands) {
                cmds = customCommands;
            } else {
                // Map Dashboard UI state to protocol parameters
                const params: any = {
                    x: Number(cmdX),
                    y: Number(cmdY),
                    z: Number(cmdZ),
                    weight: Number(cmdX), // Legacy support for K-LIFT
                    precision: Number(cmdY) // Explicit precision for K-FUSE/K-VERIFY
                };

                if (cmdType === 'K-FUSE') {
                    params.temp = Number(cmdX); // Use Intensity as Temp for FUSE
                }

                cmds = [{ type: cmdType, params }];
            }

            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'X-KSpec-API-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agentId: agent,
                    commands: cmds
                })
            });
            const data = await res.json();
            if (data.error === 'PHYSICS_COMPILER_ERROR') {
                alert(`PHYSICS CRITICAL: ${data.details}`);
            }
            setLatestIdeResult(data);
            await fetchData(apiKey);
        } catch (e) {
            console.error("Execution error:", e);
        } finally {
            setExecuting(false);
        }
    };

    const loadExampleIntoIde = (agentName: string, example: any) => {
        const cmd = [{ type: example.t, params: example.p }];
        setIdeContent(JSON.stringify(cmd, null, 2));
        runCommand(agentName, cmd);
    };

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => Math.max(0, t - 0.1)), 100);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // ADMIN MODE (OVERSIGHT)
    if (isAdminMode) {
        return (
            <div className="terminal-layout">
                <div className="sidebar">
                    <div className="logo" style={{ marginBottom: 40, fontSize: '0.9rem' }}>KINETIC // OS<br /><span style={{ fontSize: '0.6rem', color: 'var(--accent-orange)' }}>SOVEREIGN OVERSEER</span></div>
                    <nav>
                        <div className="nav-item active"><Activity size={16} /> SYSTEM METRICS</div>
                        <div className="nav-item" style={{ opacity: 0.5 }}><Shield size={16} /> HARDWARE AUDIT</div>
                    </nav>
                    <div style={{ marginTop: 'auto' }}>
                        <button className="btn btn-small" style={{ marginTop: 20, width: '100%', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }} onClick={() => setIsAdminMode(false)}>
                            <LogOut size={14} /> EXIT OVERSEER
                        </button>
                    </div>
                </div>

                <div className="main-content">
                    <header>
                        <div style={{ display: 'flex', gap: 20, width: '100%' }}>
                            <div className="panel" style={{ flex: 1, padding: '10px 20px' }}>
                                <div className="credits-val" style={{ fontSize: '1.2rem', color: 'var(--accent-green)' }}>{adminStats?.users || 0}</div>
                                <div className="panel-label" style={{ marginBottom: 0 }}>REG. IDENTITIES</div>
                            </div>
                            <div className="panel" style={{ flex: 1, padding: '10px 20px' }}>
                                <div className="credits-val" style={{ fontSize: '1.2rem' }}>{adminStats?.logs || 0}</div>
                                <div className="panel-label" style={{ marginBottom: 0 }}>PHYSICAL ACTIONS</div>
                            </div>
                            <div className="panel" style={{ flex: 1, padding: '10px 20px' }}>
                                <div className="credits-val" style={{ fontSize: '1.2rem', color: 'var(--accent-orange)' }}>{adminStats?.totalRefills || 0}</div>
                                <div className="panel-label" style={{ marginBottom: 0 }}>TOTAL REFILLS</div>
                            </div>
                        </div>
                    </header>

                    <div className="dashboard-grid">
                        <div className="panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div className="panel-label">ACTIVE SEATS (USER REGISTRY)</div>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <table style={{ width: '100%', fontSize: '0.65rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#111', color: '#555' }}>
                                        <tr>
                                            <th style={{ padding: 10 }}>IDENTITY ID</th>
                                            <th style={{ padding: 10 }}>CREDITS</th>
                                            <th style={{ padding: 10 }}>REFILLS</th>
                                            <th style={{ padding: 10 }}>CREATED</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminUsers.map(u => (
                                            <tr key={u.id} style={{ borderBottom: '1px solid #111' }}>
                                                <td style={{ padding: 10, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{u.id.substring(0, 18)}...</td>
                                                <td style={{ padding: 10 }}>{(Number(u.credits) || 0).toFixed(1)}</td>
                                                <td style={{ padding: 10 }}>{u.refill_count}</td>
                                                <td style={{ padding: 10, color: '#444' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="panel-label">SOVEREIGN AUDIT LOG</div>
                            <div style={{ flex: 1, overflowY: 'auto', textAlign: 'left' }}>
                                {adminAudit.map(log => (
                                    <div key={log.id} style={{ marginBottom: 15, padding: 10, background: '#05050a', borderLeft: '2px solid var(--accent-orange)' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#555', marginBottom: 5 }}>AGENT: {log.agent_id} // {new Date(log.timestamp).toLocaleTimeString()}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'white' }}>{log.command_sequence}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--accent-green)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>PROOF: {log.proof}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="panel" style={{ marginTop: 20, textAlign: 'left' }}>
                        <div className="panel-label">SECURITY PROTOCOL ROTATION</div>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                            <input type="password" style={{ flex: 1 }} placeholder="Current Password" value={adminPasswordUpdate.old} onChange={e => setAdminPasswordUpdate({ ...adminPasswordUpdate, old: e.target.value })} />
                            <input type="password" style={{ flex: 1 }} placeholder="New Password" value={adminPasswordUpdate.new} onChange={e => setAdminPasswordUpdate({ ...adminPasswordUpdate, new: e.target.value })} />
                            <input type="password" style={{ flex: 1 }} placeholder="Confirm New" value={adminPasswordUpdate.confirm} onChange={e => setAdminPasswordUpdate({ ...adminPasswordUpdate, confirm: e.target.value })} />
                            <button className="btn btn-small" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={updateAdminPassword}>UPDATE PROTOCOL</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // AUTH GATE
    if (!apiKey && !igniting) {
        return (
            <div className="auth-gate">
                <div className="logo" style={{ fontSize: '5rem', marginBottom: 0 }}>KINETIC</div>
                <div style={{ color: 'var(--accent-green)', letterSpacing: 8, fontSize: '0.8rem', marginBottom: 40 }}>SOVEREIGN OPERATING SYSTEM FOR ATOMS</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, width: '1000px', marginBottom: 40 }}>
                    <div className="panel" style={{ textAlign: 'center' }}><div className="credits-val" style={{ fontSize: '1.5rem', color: 'var(--accent-green)' }}>8</div><div className="panel-label">K-SPEC PRIMITIVES</div></div>
                    <div className="panel" style={{ textAlign: 'center' }}><div className="credits-val" style={{ fontSize: '1.5rem', color: 'var(--text)' }}>160</div><div className="panel-label">INITIAL CREDITS</div></div>
                    <div className="panel" style={{ textAlign: 'center' }}><div className="credits-val" style={{ fontSize: '1.5rem', color: 'var(--accent-green)' }}>1.0</div><div className="panel-label">COST PER COMMAND</div></div>
                    <div className="panel" style={{ textAlign: 'center' }}><div className="credits-val" style={{ fontSize: '1.5rem', color: 'var(--text)' }}>32</div><div className="panel-label">DAILY REFILL</div></div>
                </div>

                <div className="panel" style={{ width: 800, padding: 40, background: 'rgba(0,0,0,0.5)', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', gap: 40 }}>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Shield className="accent-green" size={24} />
                                <h2 className="logo" style={{ fontSize: '1.5rem' }}>GHOST PROTOCOL</h2>
                                <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#555' }}>ANONYMOUS AUTHENTICATION</span>
                            </div>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 30 }}>
                                Generate an ephemeral API key to access the Kinetic RaaS platform. No email. No password. Pure cryptographic identity.
                            </p>
                            <button className="btn" style={{ width: '100%', borderColor: 'var(--accent-green)', color: 'var(--accent-green)', padding: 20 }} onClick={ignite}>
                                <Zap size={18} /> GENERATE API KEY
                            </button>
                        </div>
                        <div style={{ width: 300, borderLeft: '1px solid #222', paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="panel-label">RESTORE IDENTITY</div>
                            <input
                                type="text"
                                placeholder="sk_..."
                                style={{ background: '#000', fontSize: '0.8rem' }}
                                value={loginValue}
                                onChange={e => setLoginValue(e.target.value)}
                            />
                            <button className="btn btn-small" style={{ width: '100%' }} onClick={() => claimIdentity(loginValue)}>
                                <Shield size={14} /> AUTHORIZE KEY
                            </button>
                            <div style={{ borderTop: '1px solid #222', paddingTop: 20, marginTop: 10 }}>
                                <div className="panel-label">ADMIN OVERSIGHT</div>
                                <input
                                    type="password"
                                    placeholder="Password..."
                                    style={{ background: '#111', fontSize: '0.8rem', marginTop: 10 }}
                                    value={adminPassword}
                                    onChange={e => setAdminPassword(e.target.value)}
                                />
                                <button className="btn btn-small" style={{ width: '100%', marginTop: 10, borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)' }} onClick={adminLogin}>
                                    <Eye size={14} /> OVERSIGHT PROTOCOL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // EPHEMERAL IGNITION
    if (igniting && tempKey) {
        return (
            <div className="timer-toast">
                <div className="pulse-bar" style={{ background: 'var(--accent-red)' }}></div>
                <h2 style={{ color: 'var(--accent-red)', marginBottom: 20, letterSpacing: 2 }}>EPOCH IGNITION IN PROGRESS</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: 30 }}>Your identity is being broadcast to the Kinetic Kernel. You have 9 seconds to claim your seat in reality.</p>
                <div style={{ background: '#000', padding: 25, marginBottom: 30, textAlign: 'left', border: '1px solid #444', position: 'relative' }}>
                    <span className="panel-label" style={{ color: 'var(--accent-red)' }}>Ephemeral Access Key</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                        <code style={{ fontSize: '1.2rem', color: 'white', wordBreak: 'break-all' }}>{tempKey}</code>
                        <button className="btn btn-small" onClick={() => { navigator.clipboard.writeText(tempKey); setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000); }}>
                            {copyFeedback ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>
                <button className="btn" style={{ width: '100%', padding: 25, fontSize: '1.1rem', background: 'var(--accent-red)', color: 'black', fontWeight: 900 }} onClick={() => claimIdentity(tempKey)}>
                    CLAIM IDENTITY & ENTER DASHBOARD
                </button>
                <div style={{ marginTop: 20, color: 'var(--accent-red)', fontWeight: 900, fontSize: '2rem' }}>{timer.toFixed(1)}s</div>
            </div>
        );
    }

    return (
        <div className="terminal-layout">
            <div className="sidebar">
                <div className="logo" style={{ marginBottom: 40, fontSize: '0.9rem' }}>KINETIC // OS<br /><span style={{ fontSize: '0.6rem', opacity: 0.6 }}>ORIGINAL SANCTUARY</span></div>
                <nav>
                    <div className={activeTab === 'Showcase' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('Showcase')}><Cpu size={16} /> AGENT SHOWCASE</div>
                    <div className={activeTab === 'Dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('Dashboard')}><Command size={16} /> EXECUTOR</div>
                    <div className={activeTab === 'IDE' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('IDE')}><Terminal size={16} /> K-SPEC IDE</div>
                    <div className={activeTab === 'Docs' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('Docs')}><Zap size={16} /> API ENDPOINTS</div>
                    <div className={activeTab === 'About' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('About')}><Layout size={16} /> ABOUT SERVICE</div>
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <span className="panel-label">VERIFIED IDENTITY</span>
                    <div style={{ fontSize: '0.6rem', color: 'var(--accent-orange)', wordBreak: 'break-all', background: '#000', padding: 10, border: '1px solid #222' }}>{apiKey}</div>
                    <button className="btn btn-small" style={{ marginTop: 20, width: '100%', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }} onClick={logout}>
                        <LogOut size={14} /> TERMINATE LINK
                    </button>
                </div>
            </div>

            <div className="main-content">
                <header>
                    <div style={{ display: 'flex', gap: 20, width: '100%' }}>
                        <div className="panel" style={{ flex: 1, padding: '10px 20px' }}>
                            <div className="credits-val" style={{ fontSize: '1.2rem', color: 'var(--accent-green)' }}>8</div>
                            <div className="panel-label" style={{ marginBottom: 0 }}>PRIMITIVES</div>
                        </div>
                        <div className="panel" style={{ flex: 1, padding: '10px 20px' }}>
                            <div className="credits-val" style={{ fontSize: '1.2rem' }}>{credits?.toFixed(1) || '0.0'}</div>
                            <div className="panel-label" style={{ marginBottom: 0 }}>CREDITS</div>
                        </div>
                        <div className="panel" style={{ flex: 1, padding: '10px 20px' }}>
                            <div className="credits-val" style={{ fontSize: '1.2rem', color: 'var(--accent-green)' }}>1.0</div>
                            <div className="panel-label" style={{ marginBottom: 0 }}>COST/CMD</div>
                        </div>
                        <div className="panel" style={{ flex: 1, padding: '10px 20px' }}>
                            <div className="credits-val" style={{ fontSize: '1.2rem' }}>32</div>
                            <div className="panel-label" style={{ marginBottom: 0 }}>DAILY REFILL</div>
                        </div>
                    </div>
                </header>

                {activeTab === 'Showcase' && (
                    <div className="panel" style={{ padding: 40 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 40 }}>
                            <Cpu size={24} className="accent-green" />
                            <h2 className="logo" style={{ fontSize: '1.5rem' }}>AGENT SHOWCASE</h2>
                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#555' }}>SELECT AN AGENT PROFILE</span>
                        </div>
                        <div className="showcase-grid" style={{ marginBottom: 40 }}>
                            {Object.entries(AGENT_CAPABILITIES).map(([name, data]: [string, any]) => (
                                <div key={name} className={`panel ${agentId === name ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setAgentId(name)}>
                                    <div style={{ display: 'flex', gap: 15, alignItems: 'center', marginBottom: 15 }}>
                                        <div style={{ color: agentId === name ? 'var(--accent-green)' : '#555' }}>{data.icon}</div>
                                        <div style={{ textAlign: 'left' }}>
                                            <h3 style={{ color: agentId === name ? 'var(--accent-green)' : 'white' }}>Agent {name}</h3>
                                            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{data.desc}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        {data.caps.map((c: string) => <span key={c} style={{ fontSize: '0.55rem', padding: '2px 6px', border: '1px solid #333', color: '#666' }}>{c}</span>)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="showcase-details-grid">
                            <div className="panel" style={{ background: '#000', textAlign: 'left' }}>
                                <h3 className="logo" style={{ fontSize: '1rem', marginBottom: 10 }}>Agent {agentId}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 20 }}>{agentId === 'Atlas' ? 'Optimized for high-torque vertical displacement.' : agentId === 'Hermes' ? 'Equipped with thermal and visual sonic sensors.' : 'Sub-millimeter precision for delicate assembly.'}</p>
                                <div className="panel-label">CAPABILITIES</div>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 30, flexWrap: 'wrap' }}>
                                    {AGENT_CAPABILITIES[agentId].caps.map((c: string) => (
                                        <button key={c} className="btn btn-small" style={{ borderColor: '#333', color: '#888' }}>{c}</button>
                                    ))}
                                </div>
                                <div className="panel-label">AGENT ID FOR API CALLS</div>
                                <code style={{ color: 'var(--accent-green)', background: '#111', padding: 10, display: 'block', border: '1px solid #222' }}>"{agentId}"</code>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div className="panel-label">EXAMPLE K-SPEC COMMANDS</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {AGENT_CAPABILITIES[agentId].examples.map((ex: any, i: number) => (
                                        <div key={i} className="panel" style={{ background: '#0b0b14', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
                                            <div style={{ fontSize: '0.75rem' }}>
                                                <span style={{ color: 'var(--accent-green)', fontWeight: 900 }}>{ex.t}</span>
                                                <span style={{ color: '#555', marginLeft: 10 }}>{JSON.stringify(ex.p)}</span>
                                            </div>
                                            <Play size={14} className="accent-green" style={{ cursor: 'pointer' }} onClick={() => loadExampleIntoIde(agentId, ex)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Dashboard' && (
                    <div className="dashboard-grid">
                        <div className="panel">
                            <div className="panel-label">SOVEREIGN EXECUTOR</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div><label className="panel-label">Target Agent</label><select value={agentId} onChange={e => setAgentId(e.target.value)}>{Object.keys(AGENT_CAPABILITIES).map(n => <option key={n}>{n}</option>)}</select></div>
                                <div><label className="panel-label">K-Primitive</label><select value={cmdType} onChange={e => setCmdType(e.target.value)}>{AGENT_CAPABILITIES[agentId].caps.map((c: string) => <option key={c}>{c}</option>)}</select></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div><label className="panel-label">Intensity</label><input type="number" value={cmdX} onChange={e => setCmdX(e.target.value)} /></div>
                                    <div><label className="panel-label">Precision</label><input type="number" value={cmdY} onChange={e => setCmdY(e.target.value)} /></div>
                                </div>
                                <button className="btn" style={{ width: '100%', padding: 20, borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)' }} disabled={executing} onClick={() => runCommand(agentId)}>
                                    {executing ? <RefreshCw className="animate-spin" size={20} /> : <Command size={20} />}
                                    {executing ? 'Transmitting Intent...' : 'EXECUTE ACTION'}
                                </button>
                            </div>
                        </div>

                        <div className="panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.3)' }}>
                            <div className="panel-label">TELEMETRY STREAM</div>
                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10 }}>
                                {history.length === 0 ? (
                                    <div style={{ color: '#444', fontSize: '0.8rem', textAlign: 'center', marginTop: 40 }}>Awaiting physical interaction...</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                        {history.map(log => (
                                            <div key={log.id} style={{ padding: 15, background: '#000', border: '1px solid #222', borderRadius: 4 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                                    <span style={{ color: 'var(--accent-orange)', fontSize: '0.7rem', fontWeight: 700 }}>{log.agent_id.toUpperCase()}</span>
                                                    <span style={{ color: '#444', fontSize: '0.6rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                                                    <div style={{ fontSize: '0.6rem', color: '#555', background: '#111', padding: 10, borderRadius: 3 }}>
                                                        <span style={{ color: 'var(--accent-green)' }}>COMMAND: </span>
                                                        <span style={{ color: '#aaa' }}>{log.command_sequence}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.6rem', color: '#555', background: '#05050a', padding: 10, borderRadius: 3, border: '1px solid #222' }}>
                                                        <span style={{ color: 'var(--accent-green)' }}>RAW TELEMETRY: </span>
                                                        <pre style={{ margin: '10px 0 0 0', color: 'var(--accent-green)', fontSize: '0.55rem', whiteSpace: 'pre-wrap' }}>
                                                            {JSON.stringify(JSON.parse(log.results), null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.6rem', color: '#333', fontFamily: 'var(--font-mono)' }}>PROOF: {log.proof.substring(0, 32)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {activeTab === 'IDE' && (
                    <div className="ide-grid">
                        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="panel-label" style={{ padding: '10px 20px', background: '#111', marginBottom: 0 }}>K-SPEC SCRIPT EDITOR</div>
                            <textarea
                                style={{ width: '100%', height: '500px', background: '#000', color: 'var(--accent-green)', border: 'none', padding: 20, fontFamily: 'var(--font-mono)', outline: 'none', fontSize: '0.85rem', lineHeight: 1.6 }}
                                value={ideContent}
                                onChange={e => setIdeContent(e.target.value)}
                            />
                            <div style={{ padding: 20, background: '#0a0a0f', borderTop: '1px solid #222', display: 'flex', gap: 20 }}>
                                <button className="btn" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }} onClick={() => { try { runCommand(agentId, JSON.parse(ideContent)); } catch (e) { alert('INVALID JSON'); } }}>
                                    <Play size={16} /> VALIDATE & EXECUTE SCRIPT
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="panel">
                                <span className="panel-label">COMPILER STATUS</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-green)' }}>
                                    <Shield size={16} /> <span style={{ fontWeight: 700 }}>READY</span>
                                </div>
                            </div>
                            <div className="panel" style={{ flex: 1, minHeight: 400, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                                    <span className="panel-label" style={{ marginBottom: 0 }}>LATEST EXECUTION RESULT</span>
                                    {latestIdeResult && (
                                        <button
                                            className="btn btn-small"
                                            style={{ padding: '2px 8px', fontSize: '0.6rem', borderColor: '#333', whiteSpace: 'nowrap' }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(JSON.stringify(latestIdeResult, null, 2));
                                                setCopyFeedback(true);
                                                setTimeout(() => setCopyFeedback(false), 2000);
                                            }}
                                        >
                                            {copyFeedback ? <Check size={10} /> : <Copy size={10} />} COPY JSON
                                        </button>
                                    )}
                                </div>
                                <div style={{ flex: 1, overflow: 'auto' }}>
                                    {latestIdeResult ? (
                                        <pre style={{ fontSize: '0.65rem', color: 'var(--accent-green)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', padding: 10 }}>
                                            {JSON.stringify(latestIdeResult, null, 2)}
                                        </pre>
                                    ) : (
                                        <div style={{ padding: 10, color: '#333', fontSize: '0.7rem' }}>Send a script to view real-time physics feedback.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Docs' && (
                    <div className="panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 40 }}>
                            <FileText size={24} className="accent-green" />
                            <h2 className="logo" style={{ fontSize: '1.5rem' }}>PROTOCOL v1.2</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            {[
                                {
                                    meth: 'POST',
                                    path: '/api/auth/ignite',
                                    desc: 'Generate ephemeral sk_key. 9s TTL.',
                                    samples: {
                                        curl: `curl -X POST http://localhost:4400/api/auth/ignite`,
                                        js: `fetch('/api/auth/ignite', { method: 'POST' })`,
                                        python: `import requests\nresp = requests.post('http://localhost:4400/api/auth/ignite')`
                                    }
                                },
                                {
                                    meth: 'POST',
                                    path: '/api/auth/claim',
                                    desc: 'Promote ephemeral key to ACTIVE.',
                                    samples: {
                                        curl: `curl -X POST http://localhost:4400/api/auth/claim \\ \n  -H "X-KSpec-API-Key: YOUR_KEY"`,
                                        js: `fetch('/api/auth/claim', { \n  method: 'POST', \n  headers: { 'X-KSpec-API-Key': key } \n})`,
                                        python: `requests.post('http://localhost:4400/api/auth/claim', \n  headers={'X-KSpec-API-Key': key})`
                                    }
                                },
                                {
                                    meth: 'POST',
                                    path: '/api/execute',
                                    desc: 'Send K-Spec instructions to Atoms.',
                                    samples: {
                                        curl: `curl -X POST http://localhost:4400/api/execute \\ \n  -H "X-KSpec-API-Key: YOUR_KEY" \\ \n  -d '{"agentId": "Atlas", "commands": [{"type": "K-MOVE", "params": {"x": 10}}]}'`,
                                        js: `fetch('/api/execute', { \n  method: 'POST', \n  headers: { 'X-KSpec-API-Key': key, 'Content-Type': 'application/json' }, \n  body: JSON.stringify({ agentId, commands }) \n})`,
                                        python: `requests.post('http://localhost:4400/api/execute', \n  headers={'X-KSpec-API-Key': key}, \n  json={'agentId': 'Atlas', 'commands': commands})`
                                    }
                                },
                                {
                                    meth: 'GET',
                                    path: '/api/user/credits',
                                    desc: 'Retrieve sovereign balance.',
                                    samples: {
                                        curl: `curl http://localhost:4400/api/user/credits -H "X-KSpec-API-Key: YOUR_KEY"`,
                                        js: `fetch('/api/user/credits', { headers: { 'X-KSpec-API-Key': key } })`,
                                        python: `requests.get('http://localhost:4400/api/user/credits', headers={'X-KSpec-API-Key': key})`
                                    }
                                }
                            ].map(api => (
                                <div key={api.path} className="doc-row" style={{ border: '1px solid #222', background: '#111', borderRadius: 8, overflow: 'hidden' }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '15px 30px', cursor: 'pointer', background: expandedDoc === api.path ? '#1a1a2e' : 'transparent' }}
                                        onClick={() => setExpandedDoc(expandedDoc === api.path ? null : api.path)}
                                    >
                                        <span style={{ fontSize: '0.7rem', color: api.meth === 'POST' ? 'var(--accent-green)' : 'var(--accent-orange)', width: 60, fontWeight: 900 }}>{api.meth}</span>
                                        <span style={{ fontSize: '0.85rem', color: 'white', fontFamily: 'var(--font-mono)', flex: 1 }}>{api.path}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{api.desc}</span>
                                        <ChevronRight size={16} style={{ transform: expandedDoc === api.path ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                                    </div>
                                    {expandedDoc === api.path && (
                                        <div style={{ padding: '0 30px 30px 30px', background: '#0a0a0f' }}>
                                            <div style={{ height: '1px', background: '#222', margin: '0 0 20px 0' }}></div>
                                            <div className="api-sample-grid">
                                                {Object.entries(api.samples).map(([lang, code]) => (
                                                    <div key={lang}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                            <span className="panel-label" style={{ marginBottom: 0 }}>{lang.toUpperCase()}</span>
                                                            <Copy size={12} className="text-dim" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(code); }} />
                                                        </div>
                                                        <pre>{code}</pre>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'About' && (
                    <div className="panel" style={{ maxWidth: 800, margin: '0 auto', background: 'transparent', border: 'none' }}>
                        <div style={{ textAlign: 'center', marginBottom: 60 }}>
                            <h1 className="logo" style={{ fontSize: '2.5rem', marginBottom: 20 }}>THE ORIGINAL SANCTUARY</h1>
                            <p style={{ color: 'var(--accent-orange)', letterSpacing: 4, fontSize: '0.8rem' }}>WHERE CODE ATTAINS THE WEIGHT OF REALITY</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, lineHeight: 1.8, fontSize: '0.95rem', color: '#bbb' }}>
                            <p>
                                In an era of ephemeral data and shifting simulations, <strong style={{ color: 'white' }}>Kinetic</strong> stands as a testament to the sovereign bond between the digital pulse and the physical breath. We do not just transmit commands; we broadcast intent into the material world.
                            </p>

                            <div className="panel" style={{ background: 'rgba(255,140,0,0.05)', borderStyle: 'dashed' }}>
                                <p style={{ fontStyle: 'italic' }}>
                                    "Kinetic is the bridge. It is the realization that every line of K-Spec is a physical event in waiting—a movement of atoms, a surge of power, a tangible result in the sanctuary of physical existence."
                                </p>
                            </div>

                            <p>
                                Through the <strong style={{ color: 'var(--accent-green)' }}>K-Spec Protocol</strong>, we authorize the convergence of robotics and software. Every skid, every lift, and every fuse is governed by the immutable laws of physics, verified by our kernel, and recorded on a ledger of physical truth.
                            </p>

                            <p>
                                Welcome to the Original Sanctuary. Here, your identity is cryptographic, your actions are physics-aware, and your potential is limited only by the structural integrity of the agents you command.
                            </p>

                            <div style={{ marginTop: 40, textAlign: 'center' }}>
                                <button className="btn" onClick={() => setActiveTab('Showcase')}>ENTER THE FRAY</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
