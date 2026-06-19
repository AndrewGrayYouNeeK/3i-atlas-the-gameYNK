import { useEffect, useRef } from 'react';

export default function SkinPreviewCanvas({ skin, size = 100 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    let t = 0;

    const cx = size / 2;
    const cy = size / 2;
    const NR = size * 0.13;
    const trail = [];

    const draw = () => {
      t += 0.04;
      ctx.clearRect(0, 0, size, size);

      // Dark background
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, 0, size, size);

      // Nebula glow bg
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.6);
      bg.addColorStop(0, skin.glowColor + '22');
      bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Animated ghost trail
      trail.push({ x: cx + Math.sin(t * 0.8) * 8, y: cy + Math.cos(t * 0.5) * 5 });
      if (trail.length > 18) trail.shift();
      for (let i = 1; i < trail.length; i++) {
        const prog = i / trail.length;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `rgba(${skin.trailColor},${prog * 0.55})`;
        ctx.lineWidth = prog * (size * 0.06);
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      const px = cx + Math.sin(t * 0.8) * 8;
      const py = cy + Math.cos(t * 0.5) * 5;

      // Outer coma glow
      const coma = ctx.createRadialGradient(px, py, 0, px, py, NR * 3.5);
      coma.addColorStop(0, skin.glowColor + '55');
      coma.addColorStop(1, 'transparent');
      ctx.fillStyle = coma;
      ctx.beginPath();
      ctx.arc(px, py, NR * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Special effects per skin
      if (skin.id === 'void_reaper') {
        // warping space rings
        for (let r = 0; r < 3; r++) {
          const rr = NR * (1.8 + r * 0.7) + Math.sin(t + r) * 3;
          ctx.beginPath();
          ctx.arc(px, py, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,0,102,${0.3 - r * 0.08})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      if (skin.id === 'neon_ghost') {
        // electric outline pulse
        ctx.beginPath();
        ctx.arc(px, py, NR * 1.6 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,200,255,${0.4 + 0.3 * Math.sin(t * 3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (skin.id === 'golden_atlas') {
        // crown particle burst
        for (let p = 0; p < 6; p++) {
          const pa = (p / 6) * Math.PI * 2 + t;
          const pd = NR * 2.2 + Math.sin(t * 2 + p) * 3;
          ctx.beginPath();
          ctx.arc(px + Math.cos(pa) * pd, py + Math.sin(pa) * pd, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,220,0,${0.5 + 0.4 * Math.sin(t + p)})`;
          ctx.fill();
        }
      }
      if (skin.id === 'fire_comet') {
        // ember particles
        for (let e = 0; e < 5; e++) {
          const ea = Math.PI + (e / 5) * 0.8 - 0.4 + Math.sin(t * 2 + e) * 0.3;
          const ed = NR * (1.5 + Math.random() * 0.5);
          ctx.beginPath();
          ctx.arc(px + Math.cos(ea) * ed, py + Math.sin(ea) * ed, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,${100 + Math.floor(Math.random() * 80)},0,0.7)`;
          ctx.fill();
        }
      }

      // Nucleus body
      const bodyG = ctx.createRadialGradient(px - NR * 0.3, py - NR * 0.3, 0, px, py, NR * 1.1);
      bodyG.addColorStop(0, skin.nucleusLight);
      bodyG.addColorStop(0.4, skin.coreColor);
      bodyG.addColorStop(1, skin.id === 'dark_matter' || skin.id === 'void_reaper' ? '#000000' : skin.coreColor + '44');
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, NR, 0, Math.PI * 2);
      ctx.shadowColor = skin.glowColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = bodyG;
      ctx.fill();
      if (skin.id === 'neon_ghost') {
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // Three eyes
      const eyeCol = skin.id === 'fire_comet' ? '255,120,0'
        : skin.id === 'dark_matter' ? '180,0,255'
        : skin.id === 'neon_ghost' ? '0,200,255'
        : skin.id === 'golden_atlas' ? '255,210,0'
        : skin.id === 'void_reaper' ? '255,0,100'
        : '100,200,255';
      for (let i = 0; i < 3; i++) {
        const ea = (i / 3) * Math.PI * 2 + t * 0.3;
        const ex = px + Math.cos(ea) * NR * 0.58;
        const ey = py + Math.sin(ea) * NR * 0.58;
        ctx.beginPath();
        ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${eyeCol},${0.7 + 0.3 * Math.sin(t * 2 + i)})`;
        ctx.shadowColor = `rgba(${eyeCol},1)`;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [skin.id]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: '50%' }} />;
}