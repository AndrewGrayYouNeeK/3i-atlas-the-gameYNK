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
    const NR = size * 0.11;

    const drawFan = (x, y, dirX, dirY, length, halfWidth, color, alpha) => {
      const perpX = -dirY;
      const perpY = dirX;
      const tipX = x + dirX * length;
      const tipY = y + dirY * length;
      const midX = x + dirX * length * 0.42;
      const midY = y + dirY * length * 0.42;
      ctx.beginPath();
      ctx.moveTo(x + perpX * 1.2, y + perpY * 1.2);
      ctx.quadraticCurveTo(midX + perpX * halfWidth, midY + perpY * halfWidth, tipX, tipY);
      ctx.quadraticCurveTo(midX - perpX * halfWidth, midY - perpY * halfWidth, x - perpX * 1.2, y - perpY * 1.2);
      ctx.closePath();
      const g = ctx.createLinearGradient(x, y, tipX, tipY);
      g.addColorStop(0, `rgba(${color},${alpha})`);
      g.addColorStop(0.55, `rgba(${color},${alpha * 0.28})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.fill();
    };

    const draw = () => {
      t += 0.035;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, 0, size, size);

      const px = cx + Math.sin(t * 0.55) * 5;
      const py = cy + Math.cos(t * 0.4) * 3;
      const sunX = -0.82;
      const sunY = -0.42;
      const spin = t * 0.18;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      drawFan(px, py, -sunX * 0.75 + 0.25, -sunY * 0.75 + 0.12, size * 0.42, size * 0.12, skin.trailColor, 0.28);
      drawFan(px, py, -sunX, -sunY, size * 0.52, size * 0.035, '160,200,245', 0.32);
      const coma = ctx.createRadialGradient(px + sunX * 4, py + sunY * 4, 0, px, py, NR * 3.4);
      coma.addColorStop(0, `rgba(${skin.trailColor},0.22)`);
      coma.addColorStop(1, 'transparent');
      ctx.fillStyle = coma;
      ctx.beginPath();
      ctx.arc(px, py, NR * 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(spin);
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        const r = NR * (0.82 + 0.16 * Math.cos(ang * 3 + 0.4) + 0.08 * Math.sin(ang * 5));
        const nx = Math.cos(ang) * r;
        const ny = Math.sin(ang) * r * 0.86;
        i === 0 ? ctx.moveTo(nx, ny) : ctx.lineTo(nx, ny);
      }
      ctx.closePath();
      const body = ctx.createRadialGradient(-NR * 0.35, -NR * 0.3, 0, 0, 0, NR * 1.15);
      body.addColorStop(0, '#c8c0b4');
      body.addColorStop(0.28, skin.id === 'default' ? '#6e6054' : skin.coreColor);
      body.addColorStop(0.7, '#221c18');
      body.addColorStop(1, '#0a0908');
      ctx.fillStyle = body;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-NR * 0.22, -NR * 0.18, NR * 0.28, NR * 0.16, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,220,230,0.16)';
      ctx.fill();
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [skin.id, skin.coreColor, skin.trailColor, size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: '50%' }} />;
}
