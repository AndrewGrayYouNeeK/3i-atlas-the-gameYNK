function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function createVisuals(mobile) {
  const star = (n, depth) => Array.from({ length: n }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: depth > 1 ? 1.1 + Math.random() * 1.5 : 0.25 + Math.random() * (depth ? 0.85 : 0.45),
    p: 0.06 + depth * 0.16,
    phase: Math.random() * Math.PI * 2,
    tw: 0.35 + Math.random() * 2.4,
    spike: depth > 1 && Math.random() < 0.35,
    tint: Math.random() < 0.07 ? [255, 214, 170] : Math.random() < 0.07 ? [170, 200, 255] : [255, 255, 255],
  }));
  return {
    mobile: Boolean(mobile),
    far: star(mobile ? 70 : 140, 0),
    mid: star(mobile ? 50 : 90, 1),
    near: star(mobile ? 18 : 36, 2),
    dust: [],
    ion: [],
    glow: null,
    skin: null,
  };
}

export function syncParticles(visuals, run, dt) {
  const sun = run.stage.sun || { x: -400, y: 0 };
  const dx = run.x - sun.x;
  const dy = run.y - sun.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ax = dx / dist;
  const ay = dy / dist;
  const px = -ay;
  const py = ax;
  const coma = run.coma;
  const spread = (1.05 - run.tail) * (visuals.mobile ? 50 : 70);
  const dustCap = visuals.mobile ? 150 : 380;
  const ionCap = visuals.mobile ? 60 : 160;
  const dustN = Math.min(5, Math.round(coma * (visuals.mobile ? 16 : 34) * dt * 60));
  for (let i = 0; i < dustN && visuals.dust.length < dustCap; i++) {
    const s = 28 + Math.random() * 70 * (0.4 + coma);
    visuals.dust.push({
      x: run.x + (Math.random() - 0.5) * 10,
      y: run.y + (Math.random() - 0.5) * 10,
      vx: ax * s + px * (Math.random() - 0.5) * spread - run.vx * 0.15,
      vy: ay * s + py * (Math.random() - 0.5) * spread - run.vy * 0.15,
      life: 0.7 + Math.random() * 0.9,
      max: 1,
      r: 0.8 + Math.random() * 2.2,
    });
  }
  const ionN = Math.min(3, Math.round((0.25 + coma) * (visuals.mobile ? 8 : 16) * dt * 60));
  for (let i = 0; i < ionN && visuals.ion.length < ionCap; i++) {
    const ragged = run.coherence || (1 - run.tail);
    const s = 70 + Math.random() * 90;
    visuals.ion.push({
      x: run.x,
      y: run.y,
      vx: ax * s + px * (Math.random() - 0.5) * (16 + ragged * 80),
      vy: ay * s + py * (Math.random() - 0.5) * (16 + ragged * 80),
      life: 0.45 + Math.random() * 0.55,
      max: 1,
      r: 0.6 + Math.random() * 1.1,
    });
  }
  const age = (list) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.life -= dt * (p.max > 0.8 ? 0.55 : 0.7);
      if (p.life <= 0) list.splice(i, 1);
    }
  };
  age(visuals.dust);
  age(visuals.ion);
}

function screenOf(wx, wy, view) {
  return {
    x: (wx - view.camX) * view.scale,
    y: (wy - view.camY) * view.scale,
  };
}

function drawSky(ctx, canvas, stage) {
  const sky = stage.sky || { top: '#02030c', mid: '#070818', bottom: '#04040c' };
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, sky.top);
  g.addColorStop(0.55, sky.mid || sky.top);
  g.addColorStop(1, sky.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const neb = sky.nebula || '40, 40, 80';
  const n = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.35, 0, canvas.width * 0.7, canvas.height * 0.4, canvas.width * 0.55);
  n.addColorStop(0, `rgba(${neb}, 0.22)`);
  n.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = n;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawStars(ctx, canvas, visuals, view) {
  const layers = [visuals.far, visuals.mid, visuals.near];
  for (const layer of layers) {
    for (const s of layer) {
      const driftX = (view.camX * s.p) % canvas.width;
      const driftY = (view.camY * s.p) % canvas.height;
      let x = s.x * canvas.width - driftX;
      let y = s.y * canvas.height - driftY;
      x = ((x % canvas.width) + canvas.width) % canvas.width;
      y = ((y % canvas.height) + canvas.height) % canvas.height;
      const tw = 0.55 + 0.45 * Math.sin(view.t * s.tw + s.phase);
      const a = tw * (s.spike ? 1 : 0.92);
      ctx.fillStyle = `rgba(${s.tint[0]},${s.tint[1]},${s.tint[2]},${a})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.spike) {
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.45})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x - s.r * 4.5, y);
        ctx.lineTo(x + s.r * 4.5, y);
        ctx.moveTo(x, y - s.r * 4.5);
        ctx.lineTo(x, y + s.r * 4.5);
        ctx.stroke();
      }
    }
  }
}

function drawSun(ctx, sun, t) {
  if (!sun) return;
  const spikes = 14;
  ctx.save();
  ctx.translate(sun.x, sun.y);
  ctx.rotate(t * 0.05);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < spikes; i++) {
    ctx.rotate((Math.PI * 2) / spikes);
    const len = sun.r * (2.4 + Math.sin(t * 0.8 + i) * 0.35);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, 'rgba(255,220,140,0.35)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sun.r * 0.4, -4);
    ctx.lineTo(len, 0);
    ctx.lineTo(sun.r * 0.4, 4);
    ctx.fill();
  }
  ctx.restore();

  const halo = ctx.createRadialGradient(sun.x, sun.y, sun.r * 0.2, sun.x, sun.y, sun.r * 5.2);
  halo.addColorStop(0, 'rgba(255,244,210,0.95)');
  halo.addColorStop(0.18, 'rgba(255,186,70,0.55)');
  halo.addColorStop(0.45, 'rgba(255,90,20,0.16)');
  halo.addColorStop(1, 'rgba(255,40,0,0)');
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.r * 5.2, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(sun.x - sun.r * 0.2, sun.y - sun.r * 0.2, sun.r * 0.1, sun.x, sun.y, sun.r);
  core.addColorStop(0, '#fffef8');
  core.addColorStop(0.45, '#ffe08a');
  core.addColorStop(1, '#ff7a18');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,230,180,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sun.x - sun.r * 6, sun.y);
  ctx.lineTo(sun.x + sun.r * 6, sun.y);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

function litPoint(body, sun) {
  const sx = (sun?.x ?? -1000) - body.x;
  const sy = (sun?.y ?? -400) - body.y;
  const d = Math.hypot(sx, sy) || 1;
  return { x: body.x - (sx / d) * body.radius * 0.38, y: body.y - (sy / d) * body.radius * 0.38, lx: sx / d, ly: sy / d };
}

function drawPlanet(ctx, body, sun, t) {
  const L = litPoint(body, sun);
  ctx.save();
  ctx.beginPath();
  ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
  ctx.clip();

  if (body.type === 'mars') {
    const g = ctx.createRadialGradient(L.x, L.y, body.radius * 0.1, body.x, body.y, body.radius * 1.05);
    g.addColorStop(0, '#ffb089');
    g.addColorStop(0.45, '#c2410c');
    g.addColorStop(1, '#3f0d08');
    ctx.fillStyle = g;
    ctx.fillRect(body.x - body.radius, body.y - body.radius, body.radius * 2, body.radius * 2);
    ctx.fillStyle = 'rgba(90, 20, 10, 0.45)';
    ctx.beginPath();
    ctx.ellipse(body.x - body.radius * 0.1, body.y + body.radius * 0.15, body.radius * 0.45, body.radius * 0.22, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,230,210,0.7)';
    ctx.beginPath();
    ctx.ellipse(body.x, body.y - body.radius * 0.72, body.radius * 0.28, body.radius * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (body.type === 'jupiter') {
    const bands = ['#f3d7a1', '#e0b56a', '#f7e7c4', '#c9843a', '#f0d2a0', '#a86428', '#f6e2b8', '#d0924a'];
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i];
      const y = body.y - body.radius + (i * body.radius * 2) / bands.length;
      ctx.fillRect(body.x - body.radius, y, body.radius * 2, body.radius * 2 / bands.length + 1);
    }
    ctx.fillStyle = 'rgba(180, 50, 30, 0.85)';
    ctx.beginPath();
    ctx.ellipse(body.x + body.radius * 0.28, body.y + body.radius * 0.18, body.radius * 0.22, body.radius * 0.14, -0.4, 0, Math.PI * 2);
    ctx.fill();
    const shade = ctx.createRadialGradient(L.x, L.y, body.radius * 0.2, body.x, body.y, body.radius);
    shade.addColorStop(0, 'rgba(255,255,255,0.18)');
    shade.addColorStop(0.55, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = shade;
    ctx.fillRect(body.x - body.radius, body.y - body.radius, body.radius * 2, body.radius * 2);
  } else if (body.type === 'earth') {
    const g = ctx.createRadialGradient(L.x, L.y, body.radius * 0.1, body.x, body.y, body.radius);
    g.addColorStop(0, '#d8f3ff');
    g.addColorStop(0.35, '#2f80ed');
    g.addColorStop(1, '#062044');
    ctx.fillStyle = g;
    ctx.fillRect(body.x - body.radius, body.y - body.radius, body.radius * 2, body.radius * 2);
    ctx.fillStyle = 'rgba(46, 140, 80, 0.85)';
    ctx.beginPath();
    ctx.ellipse(body.x - body.radius * 0.15, body.y - body.radius * 0.05, body.radius * 0.38, body.radius * 0.22, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(body.x + body.radius * 0.2, body.y + body.radius * 0.25, body.radius * 0.4, body.radius * 0.12, 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (body.type !== 'sun') {
    const g = ctx.createRadialGradient(L.x, L.y, 2, body.x, body.y, body.radius);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#333');
    ctx.fillStyle = g;
    ctx.fillRect(body.x - body.radius, body.y - body.radius, body.radius * 2, body.radius * 2);
  }
  ctx.restore();

  if (body.type !== 'sun') {
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.28)';
    ctx.lineWidth = Math.max(2, body.radius * 0.08);
    ctx.beginPath();
    ctx.arc(body.x, body.y, body.radius + 3, Math.atan2(L.ly, L.lx) - 1.1, Math.atan2(L.ly, L.lx) + 1.1);
    ctx.stroke();
  }

  if (body.ring || body.type === 'jupiter') {
    ctx.save();
    ctx.translate(body.x, body.y);
    ctx.rotate(-0.4);
    ctx.scale(1, 0.28);
    ctx.strokeStyle = 'rgba(230, 210, 170, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, body.radius * 1.85, body.radius * 1.85, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawGuides(ctx, stage) {
  ctx.save();
  for (const g of stage.guides || []) {
    if (g.type === 'annulus') {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r1, 0, Math.PI * 2);
      ctx.arc(g.x, g.y, g.r0, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(g.x, g.y, (g.r0 + g.r1) / 2, 0, Math.PI * 2);
      ctx.setLineDash([8, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (g.type === 'lane') {
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.35)';
      ctx.lineWidth = g.half * 2;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.moveTo(g.x0, g.y0);
      ctx.lineTo(g.x1, g.y1);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(g.x0, g.y0);
      ctx.lineTo(g.x1, g.y1);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (g.type === 'label') {
      ctx.font = '600 18px Orbitron, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillText(g.text, g.x, g.y);
    }
  }
  if (stage.worldLabel) {
    ctx.font = '600 15px Orbitron, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillText(stage.worldLabel, 80, 70);
  }
  ctx.restore();
}

function drawCone(ctx, obs) {
  const arc = obs.arc || 0.8;
  const color = obs.color || '#fff';
  const rgb = hexToRgb(color);
  ctx.save();
  ctx.translate(obs.x, obs.y);
  ctx.rotate(obs.drawAngle || 0);
  ctx.globalCompositeOperation = 'lighter';
  const rad = obs.radius;
  const g = ctx.createRadialGradient(0, 0, 8, 0, 0, rad);
  const alpha = obs.lit ? 0.28 : 0.07;
  g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`);
  g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  if (arc >= Math.PI * 1.9) {
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
  } else {
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, rad, -arc / 2, arc / 2);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = obs.lit ? color : 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(obs.x, obs.y, obs.orbiter ? 7 : 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '600 11px Orbitron, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText(obs.name, obs.x + 10, obs.y - 8);
  ctx.restore();
}

function drawGate(ctx, gate, ready, t) {
  if (!gate) return;
  const pulse = 0.65 + Math.sin(t * 3) * 0.35;
  ctx.save();
  ctx.translate(gate.x, gate.y);
  ctx.rotate(t * 0.4);
  ctx.strokeStyle = ready ? `rgba(52, 211, 153, ${0.45 + pulse * 0.4})` : `rgba(125, 211, 252, ${0.25 + pulse * 0.25})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * gate.r;
    const y = Math.sin(a) * gate.r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  const glow = ctx.createRadialGradient(gate.x, gate.y, gate.r * 0.2, gate.x, gate.y, gate.r);
  glow.addColorStop(0, ready ? 'rgba(52,211,153,0.16)' : 'rgba(125,211,252,0.08)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(gate.x, gate.y, gate.r, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles(ctx, list, rgb, scale) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of list) {
    const a = clamp(p.life, 0, 1);
    ctx.fillStyle = `rgba(${rgb},${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawComet(ctx, run, skin, t) {
  const sun = run.stage.sun || { x: -800, y: 200 };
  const dx = run.x - sun.x;
  const dy = run.y - sun.y;
  const dist = Math.hypot(dx, dy) || 1;
  const coma = run.coma;
  const radius = 18 + coma * 52;
  const glow = skin?.glow || '#d7ecff';
  const core = skin?.core || '#9bb0c4';

  const comaGrad = ctx.createRadialGradient(run.x, run.y, 2, run.x, run.y, radius * 3.1);
  comaGrad.addColorStop(0, `rgba(255,255,255,${0.35 + coma * 0.45})`);
  comaGrad.addColorStop(0.25, hexAlpha(glow, 0.28 + coma * 0.3));
  comaGrad.addColorStop(0.6, 'rgba(120, 180, 255, 0.08)');
  comaGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = comaGrad;
  ctx.beginPath();
  ctx.arc(run.x, run.y, radius * 3.1, 0, Math.PI * 2);
  ctx.fill();

  // Sunward bright edge of the coma
  const hx = run.x - (dx / dist) * radius * 0.3;
  const hy = run.y - (dy / dist) * radius * 0.3;
  const hot = ctx.createRadialGradient(hx, hy, 1, run.x, run.y, radius * 1.4);
  hot.addColorStop(0, `rgba(255,248,230,${0.45 + coma * 0.4})`);
  hot.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = hot;
  ctx.beginPath();
  ctx.arc(run.x, run.y, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (coma < 0.2) {
    ctx.save();
    ctx.translate(run.x, run.y);
    ctx.rotate(t * 0.6);
    ctx.strokeStyle = `rgba(186, 210, 230, ${0.35 + (0.2 - coma) * 2})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-8, 7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, -7);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(run.x, run.y);
  ctx.rotate(Math.atan2(run.vy, run.vx) + t * 0.15);
  const nug = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8);
  nug.addColorStop(0, '#f7fbff');
  nug.addColorStop(0.5, core);
  nug.addColorStop(1, '#1c140f');
  ctx.fillStyle = nug;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 5.5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexAlpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function paintBloom(ctx, canvas, visuals, lights) {
  const w = Math.max(80, Math.floor(canvas.width / 4));
  const h = Math.max(48, Math.floor(canvas.height / 4));
  if (!visuals.glow || visuals.glow.width !== w || visuals.glow.height !== h) {
    visuals.glow = document.createElement('canvas');
    visuals.glow.width = w;
    visuals.glow.height = h;
  }
  const g = visuals.glow.getContext('2d');
  g.clearRect(0, 0, w, h);
  const kx = w / canvas.width;
  const ky = h / canvas.height;
  for (const L of lights) {
    const x = L.x * kx;
    const y = L.y * ky;
    const rad = L.r * kx;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, L.color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = visuals.mobile ? 'blur(8px)' : 'blur(18px)';
  ctx.drawImage(visuals.glow, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';
  ctx.restore();
}

export function renderFrame(ctx, canvas, view, run, visuals) {
  const stage = run.stage;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSky(ctx, canvas, stage);
  drawStars(ctx, canvas, visuals, view);

  const shakeX = (view.shake || 0) * Math.sin(view.t * 40) * 6;
  const shakeY = (view.shake || 0) * Math.cos(view.t * 36) * 4;
  ctx.setTransform(view.scale, 0, 0, view.scale, (-view.camX + shakeX) * view.scale, (-view.camY + shakeY) * view.scale);

  drawGuides(ctx, stage);
  if (stage.sun) drawSun(ctx, stage.sun, view.t);
  for (const body of stage.bodies || []) {
    if (body.type === 'sun') continue;
    drawPlanet(ctx, body, stage.sun, view.t);
  }
  for (const obs of run.observers) drawCone(ctx, obs);
  drawParticles(ctx, visuals.dust, '255, 186, 120', 1);
  drawParticles(ctx, visuals.ion, '120, 190, 255', 1);
  const ready = run.winReady || run.progress > 0.92;
  drawGate(ctx, stage.gate, ready, view.t);
  drawComet(ctx, run, visuals.skin, view.t);

  const lights = [];
  const cometS = screenOf(run.x, run.y, view);
  lights.push({
    x: cometS.x,
    y: cometS.y,
    r: 70 + run.coma * 120,
    color: `rgba(190, 220, 255, ${0.35 + run.coma * 0.45})`,
  });
  if (stage.sun) {
    const sunS = screenOf(stage.sun.x, stage.sun.y, view);
    if (sunS.x > -200 && sunS.x < canvas.width + 200) {
      lights.push({ x: sunS.x, y: sunS.y, r: stage.sun.r * view.scale * 2.4, color: 'rgba(255, 170, 60, 0.85)' });
    }
  }
  paintBloom(ctx, canvas, visuals, lights);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vig = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.height * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (run.suspicion > 55) {
    ctx.fillStyle = `rgba(180, 20, 20, ${clamp((run.suspicion - 55) / 120, 0, 0.28)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
