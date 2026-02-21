import React, { useEffect, useRef } from 'react';

interface KineticSimProps {
    active: boolean;
    agentId: string;
}

export default function KineticSim({ active, agentId }: KineticSimProps) {
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

            const a1 = active ? -Math.PI / 2 + Math.sin(t * 1.2) * 0.4 : -Math.PI / 2;
            const a2 = active ? -Math.PI / 2 + Math.sin(t * 2.0 + 1) * 0.5 : -Math.PI / 3;

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
            ctx.strokeStyle = active ? 'var(--accent-green)' : '#333';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(j1x, j1y); ctx.lineTo(j2x, j2y); ctx.stroke();

            // Joint circles
            ctx.fillStyle = active ? 'var(--accent-orange)' : '#444';
            ctx.beginPath(); ctx.arc(j1x, j1y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = active ? 'var(--accent-green)' : '#333';
            ctx.beginPath(); ctx.arc(j2x, j2y, 4, 0, Math.PI * 2); ctx.fill();

            // End-effector gleam
            if (active) {
                const glow = ctx.createRadialGradient(j2x, j2y, 0, j2x, j2y, 14);
                glow.addColorStop(0, 'rgba(0,255,136,0.35)');
                glow.addColorStop(1, 'rgba(0,255,136,0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(j2x, j2y, 14, 0, Math.PI * 2); ctx.fill();
            }

            // Labels
            ctx.fillStyle = '#444';
            ctx.font = '7px monospace';
            ctx.fillText(`AGT: ${agentId.toUpperCase()}`, 8, 14);
            ctx.fillStyle = active ? 'var(--accent-green)' : '#333';
            ctx.fillText(active ? 'STATUS: ACTUATING' : 'STATUS: IDLE', 8, 24);

            t += 0.04;
            raf = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(raf);
    }, [active, agentId]);

    return (
        <div style={{ background: '#050505', border: '1px solid #1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={240} height={150} style={{ width: '100%', display: 'block' }} />
        </div>
    );
}
