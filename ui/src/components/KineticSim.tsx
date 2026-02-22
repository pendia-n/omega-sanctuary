import React, { useEffect, useRef } from 'react';

interface KineticSimProps {
    active: boolean;
    agentId: string;
    commands?: any[] | null;
}

export default function KineticSim({ active, agentId, commands }: KineticSimProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf: number;
        let t = 0;

        const draw = () => {
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

            const baseX = W / 2;
            const baseY = H - 15;
            const seg1 = 55;
            const seg2 = 42;

            let a1 = -Math.PI / 2;
            let a2 = -Math.PI / 3;
            let glowColor = 'rgba(0,255,136,0.35)';
            let glowBorder = 'var(--accent-green)';
            let statusText = active ? 'STATUS: ACTUATING' : 'STATUS: IDLE';

            if (active && commands && commands.length > 0) {
                const cmd = commands[0];
                const type = cmd.type;
                const params = cmd.params || {};

                switch (type) {
                    case 'K-MOVE':
                        const speed = params.speed || 1;
                        a1 = -Math.PI / 2 + Math.sin(t * 1.5 * speed) * 0.6;
                        a2 = -Math.PI / 2 + Math.cos(t * 1.5 * speed) * 0.4;
                        statusText = `MOVING [v:${speed}]`;
                        break;
                    case 'K-LIFT':
                        const weight = params.weight || 0;
                        const droop = Math.min(weight / 200, 0.5); // Heavy things pull down
                        a1 = -Math.PI / 2 + Math.sin(t * 0.5) * 0.2;
                        a2 = -Math.PI / 2 + droop + Math.sin(t * 0.5) * 0.1;
                        statusText = `LIFTING [${weight}kg]`;
                        break;
                    case 'K-GRIP':
                        const pressure = params.pressure || 50;
                        // Rapid tiny vibration for high pressure grip
                        a1 = -Math.PI / 2 + (Math.sin(t * 10) * (pressure / 1000));
                        a2 = -Math.PI / 3 + (Math.cos(t * 10) * (pressure / 1000));
                        statusText = `GRIPPING [${pressure}psi]`;
                        break;
                    case 'K-SENSE':
                        // Scanning back and forth
                        a1 = -Math.PI / 2 + Math.sin(t) * 0.8;
                        a2 = -Math.PI / 4;
                        glowColor = 'rgba(0,180,255,0.4)';
                        glowBorder = '#00b4ff';
                        statusText = `SENSING [${params.type || 'Visual'}]`;
                        break;
                    case 'K-SCAN':
                        a1 = -Math.PI / 2;
                        a2 = -Math.PI / 2 + Math.sin(t * 4) * 0.5;
                        glowColor = 'rgba(0,180,255,0.4)';
                        glowBorder = '#00b4ff';
                        statusText = `SCANNING [${params.range || 10}m]`;
                        break;
                    case 'K-STREAM':
                        a1 = -Math.PI / 2 + Math.sin(t * 0.2) * 0.1;
                        a2 = -Math.PI / 2;
                        glowColor = Math.sin(t * 8) > 0 ? 'rgba(0,180,255,0.6)' : 'rgba(0,180,255,0.1)';
                        glowBorder = '#00b4ff';
                        statusText = `STREAMING [CH:${params.ch || 1}]`;
                        break;
                    case 'K-TORQUE':
                        const force = params.force || 10;
                        a1 = -Math.PI / 2 + Math.sin(t) * 0.3;
                        a2 = -Math.PI / 4 + (Math.sin(t * 8) * (force / 200)); // vibration
                        glowColor = 'rgba(255,80,0,0.4)';
                        glowBorder = '#ff5000';
                        statusText = `TORQUING [${force}N]`;
                        break;
                    case 'K-FUSE':
                        const temp = params.temp || 1000;
                        a1 = -Math.PI / 2 + 0.1;
                        a2 = -Math.PI / 3;
                        // Extremely bright hot colors
                        const heat = Math.min(temp / 1500, 1);
                        glowColor = `rgba(255,${200 * (1 - heat)},0,${0.3 + heat * 0.5})`;
                        glowBorder = '#ff3300';
                        statusText = `FUSING [${temp}°C]`;
                        break;
                    case 'K-VERIFY':
                        a1 = -Math.PI / 2 + Math.sin(t * 2) * 0.2;
                        a2 = -Math.PI / 2 - Math.sin(t * 2) * 0.2;
                        glowColor = 'rgba(180,0,255,0.4)';
                        glowBorder = '#b400ff';
                        statusText = `VERIFYING [tol:${params.tolerance || '0.1'}]`;
                        break;
                    default:
                        a1 = -Math.PI / 2 + Math.sin(t * 1.2) * 0.4;
                        a2 = -Math.PI / 2 + Math.sin(t * 2.0 + 1) * 0.5;
                        break;
                }
            }

            const j1x = baseX + Math.cos(a1) * seg1;
            const j1y = baseY + Math.sin(a1) * seg1;
            const j2x = j1x + Math.cos(a2) * seg2;
            const j2y = j1y + Math.sin(a2) * seg2;

            // Base
            ctx.fillStyle = '#333';
            ctx.fillRect(baseX - 18, baseY, 36, 8);
            ctx.fillStyle = '#555';
            ctx.fillRect(baseX - 10, baseY - 6, 20, 8);

            // Segment 1
            ctx.strokeStyle = active ? 'var(--accent-orange)' : '#444';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.lineTo(j1x, j1y); ctx.stroke();

            // Segment 2
            ctx.strokeStyle = active ? glowBorder : '#333';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(j1x, j1y); ctx.lineTo(j2x, j2y); ctx.stroke();

            // Joint circles
            ctx.fillStyle = active ? 'var(--accent-orange)' : '#444';
            ctx.beginPath(); ctx.arc(j1x, j1y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = active ? glowBorder : '#333';
            ctx.beginPath(); ctx.arc(j2x, j2y, 4, 0, Math.PI * 2); ctx.fill();

            // End-effector gleam
            if (active) {
                const glow = ctx.createRadialGradient(j2x, j2y, 0, j2x, j2y, 14);
                glow.addColorStop(0, glowColor);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(j2x, j2y, 14, 0, Math.PI * 2); ctx.fill();
            }

            // Labels
            ctx.fillStyle = '#444';
            ctx.font = '7px monospace';
            ctx.fillText(`AGT: ${agentId.toUpperCase()}`, 8, 14);
            ctx.fillStyle = active ? glowBorder : '#333';
            ctx.fillText(statusText, 8, 24);

            t += 0.04;
            raf = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(raf);
    }, [active, agentId, commands]);

    return (
        <div style={{ background: '#050505', border: '1px solid #1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={240} height={150} style={{ width: '100%', display: 'block' }} />
        </div>
    );
}

