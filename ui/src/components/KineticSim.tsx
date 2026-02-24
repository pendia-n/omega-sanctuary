import React, { useEffect, useRef } from 'react';

interface KineticSimProps {
    active: boolean;
    agentId: string;
    commands?: any[] | null;
}

// Particle system for streaming/fuse effects
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

export default function KineticSim({ active, agentId, commands }: KineticSimProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf: number;
        let t = 0;
        particlesRef.current = [];

        const cmdType = (active && commands && commands.length > 0) ? commands[0].type : null;
        const params = (active && commands && commands.length > 0) ? (commands[0].params || {}) : {};

        const draw = () => {
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            for (let gx = 0; gx < W; gx += 20) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
            for (let gy = 0; gy < H; gy += 20) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

            const seg1 = 55;
            const seg2 = 42;
            let statusText = 'STATUS: IDLE';
            let accentColor = '#00ff88';

            if (!active || !cmdType) {
                // IDLE state
                const baseX = W / 2;
                const baseY = H - 15;
                const a1 = -Math.PI / 2;
                const a2 = -Math.PI / 3;
                const j1x = baseX + Math.cos(a1) * seg1;
                const j1y = baseY + Math.sin(a1) * seg1;
                const j2x = j1x + Math.cos(a2) * seg2;
                const j2y = j1y + Math.sin(a2) * seg2;
                drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, false, '#444', '#333');
                ctx.fillStyle = '#333';
                ctx.font = '7px monospace';
                ctx.fillText(`AGT: ${agentId.toUpperCase()}`, 8, 14);
                ctx.fillText('STATUS: IDLE', 8, 24);
                t += 0.04;
                raf = requestAnimationFrame(draw);
                return;
            }

            // ===== ACTIVE COMMAND ANIMATIONS =====
            switch (cmdType) {
                case 'K-MOVE': {
                    const speed = Math.max(params.speed || params.x || 1, 0.1);
                    const targetX = Math.min(params.x || 10, 50);
                    const targetZ = Math.min(params.z || 5, 20);
                    // Arm base translates horizontally across canvas
                    const moveRange = Math.min(targetX * 3, W * 0.35);
                    const baseX = W / 2 + Math.sin(t * speed * 0.8) * moveRange;
                    const baseY = H - 15;
                    const a1 = -Math.PI / 2 + Math.sin(t * speed * 1.2) * 0.15;
                    const a2 = -Math.PI / 3 + Math.cos(t * speed) * (targetZ / 40);
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    // Motion trail
                    ctx.globalAlpha = 0.15;
                    for (let i = 1; i <= 3; i++) {
                        const trailX = W / 2 + Math.sin((t - i * 0.08) * speed * 0.8) * moveRange;
                        ctx.strokeStyle = '#00ff88';
                        ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(trailX, baseY); ctx.lineTo(trailX + Math.cos(a1) * seg1 * 0.5, baseY + Math.sin(a1) * seg1 * 0.5); ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                    // Direction arrow on ground
                    const arrowX = baseX + Math.cos(t * speed * 0.8) * 15;
                    ctx.strokeStyle = '#00ff88';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(baseX - 30, baseY + 5); ctx.lineTo(baseX + 30, baseY + 5); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(arrowX + 8, baseY + 2); ctx.lineTo(arrowX + 15, baseY + 5); ctx.lineTo(arrowX + 8, baseY + 8); ctx.stroke();
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#00ff88');
                    drawGlow(ctx, j2x, j2y, 'rgba(0,255,136,0.3)', 12);
                    accentColor = '#00ff88';
                    statusText = `MOVING x:${params.x || 0} z:${params.z || 0} v:${speed}`;
                    break;
                }
                case 'K-LIFT': {
                    const weight = params.weight || 50;
                    const height = params.height || 1;
                    const baseX = W / 2;
                    const baseY = H - 15;
                    // Arm lifts upward; heavier = slower + more strain wobble
                    const liftSpeed = Math.max(0.3, 1.5 - weight / 300);
                    const liftPhase = (Math.sin(t * liftSpeed) + 1) / 2; // 0..1
                    const liftH = liftPhase * Math.min(height * 30, 50);
                    const strain = Math.min(weight / 100, 1) * Math.sin(t * 12) * 0.02;
                    const a1 = -Math.PI / 2 - liftPhase * 0.3 + strain;
                    const a2 = -Math.PI / 2 + 0.4 - liftPhase * 0.2;
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    // Draw payload box at effector
                    const boxSize = Math.min(6 + weight / 30, 18);
                    ctx.fillStyle = `rgba(255,136,0,${0.4 + liftPhase * 0.4})`;
                    ctx.fillRect(j2x - boxSize / 2, j2y - 2, boxSize, boxSize);
                    ctx.strokeStyle = '#ff8800';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(j2x - boxSize / 2, j2y - 2, boxSize, boxSize);
                    // Weight label on box
                    ctx.fillStyle = '#000';
                    ctx.font = '5px monospace';
                    ctx.fillText(`${weight}kg`, j2x - boxSize / 2 + 1, j2y + boxSize / 2 + 1);
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#ff8800');
                    accentColor = '#ff8800';
                    statusText = `LIFTING ${weight}kg h:${height}m`;
                    break;
                }
                case 'K-GRIP': {
                    const pressure = params.pressure || params.weight || 50;
                    const baseX = W / 2;
                    const baseY = H - 15;
                    const a1 = -Math.PI / 2 + 0.1;
                    const a2 = -Math.PI / 3 - 0.1;
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#00ff88');
                    // Draw gripper claws opening/closing based on pressure
                    const maxOpen = Math.max(3, 14 - pressure / 10);
                    const clawOpen = maxOpen * (0.5 + 0.5 * Math.sin(t * (2 + pressure / 20)));
                    const clawLen = 12;
                    // Left claw
                    ctx.strokeStyle = '#00ff88';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(j2x, j2y);
                    ctx.lineTo(j2x - clawOpen, j2y + clawLen);
                    ctx.stroke();
                    // Right claw
                    ctx.beginPath();
                    ctx.moveTo(j2x, j2y);
                    ctx.lineTo(j2x + clawOpen, j2y + clawLen);
                    ctx.stroke();
                    // Object being gripped (small circle between claws)
                    ctx.fillStyle = `rgba(0,255,136,${0.3 + (1 - clawOpen / maxOpen) * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(j2x, j2y + clawLen - 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                    // Pressure indicator bar
                    ctx.fillStyle = '#111';
                    ctx.fillRect(W - 30, 30, 6, 50);
                    const pFill = Math.min(pressure / 100, 1);
                    ctx.fillStyle = pFill > 0.7 ? '#ff3300' : '#00ff88';
                    ctx.fillRect(W - 30, 30 + 50 * (1 - pFill), 6, 50 * pFill);
                    ctx.fillStyle = '#555';
                    ctx.font = '5px monospace';
                    ctx.fillText('PSI', W - 31, 27);
                    accentColor = '#00ff88';
                    statusText = `GRIPPING ${pressure}psi`;
                    break;
                }
                case 'K-SENSE': {
                    const res = params.res || 1;
                    const senseType = params.type || 'Visual';
                    const baseX = W / 2;
                    const baseY = H - 15;
                    const sweepAngle = Math.sin(t * 0.8) * 0.6;
                    const a1 = -Math.PI / 2 + sweepAngle;
                    const a2 = -Math.PI / 3;
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#00b4ff');
                    // Expanding sensor waves from effector
                    const numWaves = Math.max(2, Math.min(res * 3, 6));
                    for (let i = 0; i < numWaves; i++) {
                        const waveR = ((t * 30 + i * 20) % 60) * (1 + res * 0.3);
                        const alpha = Math.max(0, 0.5 - waveR / 80);
                        ctx.strokeStyle = `rgba(0,180,255,${alpha})`;
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.arc(j2x, j2y, waveR, -Math.PI * 0.7, Math.PI * 0.2);
                        ctx.stroke();
                    }
                    // Sensor type label
                    ctx.fillStyle = '#00b4ff';
                    ctx.font = '6px monospace';
                    ctx.fillText(senseType.toUpperCase(), j2x + 15, j2y - 5);
                    accentColor = '#00b4ff';
                    statusText = `SENSING [${senseType}] res:${res}`;
                    break;
                }
                case 'K-SCAN': {
                    const range = params.range || 10;
                    const mode = params.mode || 'Standard';
                    const baseX = W / 2;
                    const baseY = H - 15;
                    const a1 = -Math.PI / 2;
                    const a2 = -Math.PI / 2 + 0.2;
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#00b4ff');
                    // Radar sweep from effector
                    const radarR = Math.min(range * 1.2, 55);
                    const sweepA = (t * 3) % (Math.PI * 2);
                    // Radar cone
                    ctx.fillStyle = 'rgba(0,180,255,0.12)';
                    ctx.beginPath();
                    ctx.moveTo(j2x, j2y);
                    ctx.arc(j2x, j2y, radarR, sweepA - 0.4, sweepA + 0.4);
                    ctx.closePath();
                    ctx.fill();
                    // Radar ring
                    ctx.strokeStyle = 'rgba(0,180,255,0.3)';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(j2x, j2y, radarR, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(j2x, j2y, radarR * 0.5, 0, Math.PI * 2); ctx.stroke();
                    // Sweep line
                    ctx.strokeStyle = '#00b4ff';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(j2x, j2y);
                    ctx.lineTo(j2x + Math.cos(sweepA) * radarR, j2y + Math.sin(sweepA) * radarR);
                    ctx.stroke();
                    // Blips
                    for (let i = 0; i < 3; i++) {
                        const blipA = sweepA - 0.3 - i * 0.5;
                        const blipR = radarR * (0.3 + i * 0.25);
                        ctx.fillStyle = `rgba(0,180,255,${0.6 - i * 0.15})`;
                        ctx.beginPath(); ctx.arc(j2x + Math.cos(blipA) * blipR, j2y + Math.sin(blipA) * blipR, 2, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.fillStyle = '#00b4ff';
                    ctx.font = '5px monospace';
                    ctx.fillText(mode.toUpperCase(), W - 45, 14);
                    accentColor = '#00b4ff';
                    statusText = `SCANNING ${range}m [${mode}]`;
                    break;
                }
                case 'K-STREAM': {
                    const ch = params.ch || 1;
                    const bitrate = params.bitrate || '5mbps';
                    const baseX = W / 2;
                    const baseY = H - 15;
                    const a1 = -Math.PI / 2 + Math.sin(t * 0.3) * 0.05;
                    const a2 = -Math.PI / 2 + 0.1;
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#00b4ff');
                    // Data stream particles flowing upward from effector
                    const numChannels = Math.min(ch, 6);
                    for (let c = 0; c < numChannels; c++) {
                        const offsetX = (c - numChannels / 2) * 8;
                        for (let p = 0; p < 5; p++) {
                            const py = ((t * 60 + p * 14 + c * 7) % 50);
                            const alpha = Math.max(0, 1 - py / 50);
                            ctx.fillStyle = `rgba(0,180,255,${alpha * 0.7})`;
                            const char = ((p + c) % 2 === 0) ? '1' : '0';
                            ctx.font = '6px monospace';
                            ctx.fillText(char, j2x + offsetX, j2y - py);
                        }
                    }
                    // Blinking indicator
                    if (Math.sin(t * 6) > 0) {
                        ctx.fillStyle = '#00b4ff';
                        ctx.beginPath(); ctx.arc(j2x, j2y - 3, 2, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.fillStyle = '#00b4ff';
                    ctx.font = '5px monospace';
                    ctx.fillText(`${bitrate}`, W - 40, 14);
                    accentColor = '#00b4ff';
                    statusText = `STREAMING CH:${ch} ${bitrate}`;
                    break;
                }
                case 'K-TORQUE': {
                    const force = params.force || 10;
                    const joint = params.joint || 'A1';
                    const baseX = W / 2;
                    const baseY = H - 15;
                    const vibration = Math.sin(t * (10 + force / 5)) * (force / 300);
                    const a1 = -Math.PI / 2 + 0.2 + vibration;
                    const a2 = -Math.PI / 3 - 0.1;
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#ff5000');
                    // Draw bolt being rotated at effector
                    const boltAngle = t * (2 + force / 15);
                    const boltR = 6;
                    ctx.strokeStyle = '#ff5000';
                    ctx.lineWidth = 2;
                    // Hex bolt shape
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const ba = boltAngle + (i * Math.PI * 2) / 6;
                        const bx = j2x + Math.cos(ba) * boltR;
                        const by = j2y + Math.sin(ba) * boltR;
                        if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    // Rotation arc indicator
                    ctx.strokeStyle = `rgba(255,80,0,0.4)`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(j2x, j2y, boltR + 4, boltAngle, boltAngle + Math.PI * 0.8);
                    ctx.stroke();
                    // Arrow tip on arc
                    const tipA = boltAngle + Math.PI * 0.8;
                    ctx.beginPath();
                    ctx.moveTo(j2x + Math.cos(tipA) * (boltR + 4), j2y + Math.sin(tipA) * (boltR + 4));
                    ctx.lineTo(j2x + Math.cos(tipA + 0.3) * (boltR + 7), j2y + Math.sin(tipA + 0.3) * (boltR + 7));
                    ctx.stroke();
                    // Force gauge
                    ctx.fillStyle = '#111';
                    ctx.fillRect(W - 30, 30, 6, 50);
                    const fFill = Math.min(force / 80, 1);
                    ctx.fillStyle = '#ff5000';
                    ctx.fillRect(W - 30, 30 + 50 * (1 - fFill), 6, 50 * fFill);
                    ctx.fillStyle = '#555';
                    ctx.font = '5px monospace';
                    ctx.fillText('N·m', W - 32, 27);
                    ctx.fillText(joint, j2x - 5, j2y + boltR + 12);
                    accentColor = '#ff5000';
                    statusText = `TORQUING ${joint} ${force}N`;
                    break;
                }
                case 'K-FUSE': {
                    const temp = params.temp || 1000;
                    const duration = params.duration || 1;
                    const precision = params.precision || 1;
                    const baseX = W / 2;
                    const baseY = H - 15;
                    const a1 = -Math.PI / 2 + 0.15;
                    const a2 = -Math.PI / 3 + 0.1;
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#ff3300');
                    // Welding sparks
                    const heat = Math.min(temp / 1500, 1);
                    const sparkCount = Math.floor(3 + heat * 8);
                    for (let i = 0; i < sparkCount; i++) {
                        const sparkA = Math.random() * Math.PI * 2;
                        const sparkR = Math.random() * (8 + heat * 12);
                        const sx = j2x + Math.cos(sparkA) * sparkR;
                        const sy = j2y + Math.sin(sparkA) * sparkR;
                        const g = Math.floor(200 * (1 - heat));
                        ctx.fillStyle = `rgba(255,${g},0,${0.5 + Math.random() * 0.5})`;
                        ctx.beginPath(); ctx.arc(sx, sy, 1 + Math.random(), 0, Math.PI * 2); ctx.fill();
                    }
                    // Welding point glow
                    const glowR = 8 + heat * 10;
                    const glow = ctx.createRadialGradient(j2x, j2y, 0, j2x, j2y, glowR);
                    glow.addColorStop(0, `rgba(255,${Math.floor(255 * (1 - heat))},${Math.floor(100 * (1 - heat))},${0.6 + heat * 0.3})`);
                    glow.addColorStop(1, 'rgba(255,0,0,0)');
                    ctx.fillStyle = glow;
                    ctx.beginPath(); ctx.arc(j2x, j2y, glowR, 0, Math.PI * 2); ctx.fill();
                    // Temp gauge
                    ctx.fillStyle = '#111';
                    ctx.fillRect(W - 30, 20, 6, 60);
                    ctx.fillStyle = heat > 0.8 ? '#ff0000' : heat > 0.5 ? '#ff5500' : '#ff8800';
                    ctx.fillRect(W - 30, 20 + 60 * (1 - heat), 6, 60 * heat);
                    ctx.fillStyle = '#555';
                    ctx.font = '5px monospace';
                    ctx.fillText('°C', W - 29, 17);
                    ctx.fillText(`${temp}`, W - 35, 88);
                    accentColor = '#ff3300';
                    statusText = `FUSING ${temp}°C d:${duration}s p:${precision}`;
                    break;
                }
                case 'K-VERIFY': {
                    const tolerance = params.tolerance || 0.1;
                    const baseX = W / 2;
                    const baseY = H - 15;
                    // Arm holds still, crosshair zeroes in
                    const a1 = -Math.PI / 2 + 0.05;
                    const a2 = -Math.PI / 2 + 0.3;
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#b400ff');
                    // Crosshair that converges based on tolerance
                    const convergence = Math.max(2, 20 * tolerance); // smaller tolerance = tighter crosshair
                    const wobble = convergence * Math.sin(t * 3) * 0.3;
                    const crossR = convergence + wobble;
                    ctx.strokeStyle = '#b400ff';
                    ctx.lineWidth = 1;
                    // Circle
                    ctx.beginPath(); ctx.arc(j2x, j2y + 15, crossR, 0, Math.PI * 2); ctx.stroke();
                    // Cross lines
                    ctx.beginPath(); ctx.moveTo(j2x - crossR - 4, j2y + 15); ctx.lineTo(j2x - crossR + 3, j2y + 15); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(j2x + crossR - 3, j2y + 15); ctx.lineTo(j2x + crossR + 4, j2y + 15); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(j2x, j2y + 15 - crossR - 4); ctx.lineTo(j2x, j2y + 15 - crossR + 3); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(j2x, j2y + 15 + crossR - 3); ctx.lineTo(j2x, j2y + 15 + crossR + 4); ctx.stroke();
                    // Center dot pulses when within tolerance
                    if (Math.abs(wobble) < convergence * 0.15) {
                        ctx.fillStyle = '#00ff88';
                        ctx.beginPath(); ctx.arc(j2x, j2y + 15, 2, 0, Math.PI * 2); ctx.fill();
                    }
                    // Tolerance readout
                    ctx.fillStyle = '#b400ff';
                    ctx.font = '6px monospace';
                    ctx.fillText(`TOL: ±${tolerance}mm`, j2x + crossR + 6, j2y + 17);
                    // Progress bar (pass/fail cycle)
                    const progress = (Math.sin(t * 1.5) + 1) / 2;
                    ctx.fillStyle = '#111';
                    ctx.fillRect(8, H - 10, W - 16, 4);
                    ctx.fillStyle = progress > 0.9 ? '#00ff88' : '#b400ff';
                    ctx.fillRect(8, H - 10, (W - 16) * progress, 4);
                    accentColor = '#b400ff';
                    statusText = `VERIFYING tol:±${tolerance}mm`;
                    break;
                }
                default: {
                    const baseX = W / 2;
                    const baseY = H - 15;
                    const a1 = -Math.PI / 2 + Math.sin(t * 1.2) * 0.4;
                    const a2 = -Math.PI / 2 + Math.sin(t * 2.0 + 1) * 0.5;
                    const j1x = baseX + Math.cos(a1) * seg1;
                    const j1y = baseY + Math.sin(a1) * seg1;
                    const j2x = j1x + Math.cos(a2) * seg2;
                    const j2y = j1y + Math.sin(a2) * seg2;
                    drawArm(ctx, baseX, baseY, j1x, j1y, j2x, j2y, true, '#ff8800', '#00ff88');
                    drawGlow(ctx, j2x, j2y, 'rgba(0,255,136,0.35)', 14);
                    accentColor = '#00ff88';
                    statusText = `EXECUTING ${cmdType}`;
                    break;
                }
            }

            // Labels
            ctx.fillStyle = '#444';
            ctx.font = '7px monospace';
            ctx.fillText(`AGT: ${agentId.toUpperCase()}`, 8, 14);
            ctx.fillStyle = accentColor;
            ctx.fillText(statusText, 8, 24);

            t += 0.04;
            raf = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(raf);
    }, [active, agentId, commands]);

    return (
        <div style={{ background: '#050505', border: '1px solid #1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={280} height={180} style={{ width: '100%', display: 'block' }} />
        </div>
    );
}

function drawArm(ctx: CanvasRenderingContext2D, bx: number, by: number, j1x: number, j1y: number, j2x: number, j2y: number, active: boolean, seg1Color: string, seg2Color: string) {
    // Base
    ctx.fillStyle = '#333';
    ctx.fillRect(bx - 18, by, 36, 8);
    ctx.fillStyle = '#555';
    ctx.fillRect(bx - 10, by - 6, 20, 8);
    // Segment 1
    ctx.strokeStyle = active ? seg1Color : '#444';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(j1x, j1y); ctx.stroke();
    // Segment 2
    ctx.strokeStyle = active ? seg2Color : '#333';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(j1x, j1y); ctx.lineTo(j2x, j2y); ctx.stroke();
    // Joint circles
    ctx.fillStyle = active ? seg1Color : '#444';
    ctx.beginPath(); ctx.arc(j1x, j1y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = active ? seg2Color : '#333';
    ctx.beginPath(); ctx.arc(j2x, j2y, 4, 0, Math.PI * 2); ctx.fill();
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
}
