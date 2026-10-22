import { getStage } from './stages.js';

export function difficultyMods(id) {
  switch (id) {
    case 'easy':
      return { gain: 0.58, decay: 1.55, band: 0.08, anomaly: 0.68, drift: 0.7, time: 0.78 };
    case 'hard':
      return { gain: 1.3, decay: 0.7, band: -0.035, anomaly: 1.2, drift: 1.25, time: 1.22 };
    case 'medium':
      return { gain: 1, decay: 1, band: 0, anomaly: 1, drift: 1, time: 1 };
    default: {
      const unknown = id;
      throw new Error(`Unknown difficulty: ${unknown}`);
    }
  }
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function bandOf(base, pad) {
  if (!base) return [0, 1];
  const lo = clamp(base[0] - pad, 0, 0.95);
  const hi = clamp(base[1] + pad, lo + 0.05, 1);
  return [lo, hi];
}

function outside(value, lo, hi) {
  if (value < lo) return (lo - value) / Math.max(0.08, hi - lo);
  if (value > hi) return (value - hi) / Math.max(0.08, hi - lo);
  return 0;
}

function punish(run, amount, dt) {
  const capped = Math.min(amount, 34);
  run.suspicion = clamp(run.suspicion + capped * run.gain * dt, 0, 100);
}

function relieve(run, amount, dt) {
  run.suspicion = clamp(run.suspicion - amount * run.diff.decay * dt, 0, 100);
}

function hypot(x, y) {
  return Math.hypot(x, y);
}

export function createRun(stageId, difficultyId = 'medium', options = {}) {
  const stage = getStage(stageId);
  const diff = difficultyMods(difficultyId);
  let gain = diff.gain;
  if (options.scanMult && options.scanMult < 1) gain *= 1.16;
  if (options.threatBonus) gain *= 1 + options.threatBonus * 0.1;
  const drift = diff.drift * (1 + (options.gasPenalty || 0) * 0.35);

  const observers = stage.observers.map((o, i) => ({
    ...o,
    angle: o.angle ?? -0.4,
    drawAngle: o.angle ?? 0,
    lit: false,
    phase: i,
  }));

  return {
    stage,
    diff: { ...diff, drift },
    gain,
    t: 0,
    x: stage.start.x,
    y: stage.start.y,
    vx: stage.start.vx,
    vy: stage.start.vy,
    coma: stage.coma0,
    tail: 0.78,
    anomaly: 0.04,
    suspicion: 0,
    co2: stage.mechanic === 'observatory' ? 0.4 : 0.62,
    h2o: stage.mechanic === 'observatory' ? 0.4 : 0.22,
    dust: stage.mechanic === 'observatory' ? 0.2 : 0.16,
    catalog: 0,
    catalogNeed: (stage.catalogSeconds || 5) * diff.time,
    locks: stage.observers.map(() => false),
    lockT: 0,
    activeObs: 0,
    lockNeed: (stage.lockSeconds || 4) * diff.time,
    ephemeris: 0.04,
    a1: 0.6,
    curveMatch: 0,
    curveNeed: (stage.curveNeed || 12) * diff.time,
    targetBrightness: stage.coma0,
    outburstUsed: false,
    outburstPulse: 0,
    coherence: 0.15,
    radio: 0,
    progress: 0,
    flyby: 0,
    prevAng: null,
    corridor: 1,
    occulted: false,
    surveyed: false,
    objectiveText: stage.objective,
    alert: '',
    watchedBy: [],
    status: 'play',
    loseReason: null,
    score: 0,
    nearGate: false,
    holdFlow: false,
    observers,
    comaBandLive: bandOf(stage.comaBand, diff.band),
    a1BandLive: bandOf(stage.a1Band || [0.5, 0.73], diff.band * 0.6),
    winReady: false,
  };
}

function nudgeSpectrum(run, key, amt) {
  run[key] = clamp(run[key] + amt, 0.03, 0.94);
  const keys = ['co2', 'h2o', 'dust'];
  const others = keys.filter((k) => k !== key);
  const rest = 1 - run[key];
  const sum = others.reduce((s, k) => s + run[k], 0) || 1;
  for (const k of others) run[k] = (rest * run[k]) / sum;
}

function inCone(run, obs) {
  const dx = run.x - obs.x;
  const dy = run.y - obs.y;
  const dist = hypot(dx, dy);
  if (dist > obs.radius) return false;
  if (obs.tracking) return true;
  const ang = Math.atan2(dy, dx);
  let diff = ang - obs.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) < (obs.arc || 1) / 2;
}

function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const abx = bx - ax;
  const aby = by - ay;
  const acx = cx - ax;
  const acy = cy - ay;
  const ab2 = abx * abx + aby * aby || 1;
  let t = (acx * abx + acy * aby) / ab2;
  t = clamp(t, 0, 1);
  const dx = ax + abx * t - cx;
  const dy = ay + aby * t - cy;
  return dx * dx + dy * dy <= r * r;
}

function sunOccultsEarth(run) {
  const sun = run.stage.sun;
  const earth = run.stage.bodies?.find((b) => b.type === 'earth') || { x: 40, y: 800 };
  if (!sun) return false;
  const past = (run.x - earth.x) * (sun.x - earth.x) + (run.y - earth.y) * (sun.y - earth.y) > 0
    && run.x > sun.x - sun.r;
  return past && segmentHitsCircle(earth.x, earth.y, run.x, run.y, sun.x, sun.y, sun.r * 1.25);
}

function heatNow(run) {
  const s = run.stage;
  if (s.mechanic === 'perihelion' && s.lane) {
    const p = clamp((run.x - s.lane.x0) / (s.lane.x1 - s.lane.x0), 0, 1);
    return 0.5 + 0.48 * p;
  }
  if (s.mechanic === 'conjunction') {
    const sun = s.sun;
    const d = hypot(run.x - sun.x, run.y - sun.y);
    return 0.22 + 0.55 * clamp(1 - d / 700, 0, 1);
  }
  return s.heat;
}

function insideGate(run) {
  const gate = run.stage.gate;
  if (!gate) return false;
  return hypot(run.x - gate.x, run.y - gate.y) < gate.r;
}

function integrate(run, input, dt, steer, burn) {
  const s = run.stage;
  const parked = insideGate(run);
  if (!parked && s.flow) {
    run.vx += s.flow.x * dt;
    run.vy += s.flow.y * dt;
  }
  if (parked) {
    run.vx *= 1 - Math.min(1, dt * 3.2);
    run.vy *= 1 - Math.min(1, dt * 3.2);
  }
  if (s.gate && run.x > s.gate.x + s.gate.r * 0.25) {
    run.vx -= 90 * dt;
    run.vy += (s.gate.y - run.y) * 1.6 * dt;
  }
  if (s.wander) {
    run.vy += Math.sin(run.t * 0.42) * s.wander * dt;
  }

  if (s.mechanic === 'mars' && s.mars) {
    const m = s.mars;
    const dx = run.x - m.x;
    const dy = run.y - m.y;
    const d = hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    const tx = -Math.sin(ang);
    const ty = Math.cos(ang);
    const peel = run.flyby > (s.flybyNeed || 2) * 0.82;
    run.vx += tx * (peel ? 16 : 28) * dt;
    run.vy += ty * (peel ? 16 : 28) * dt;
    if (!peel) {
      const err = d - m.desired;
      const gust = Math.sin(run.t * 0.55) * 22;
      run.vx += -(dx / d) * err * 0.85 * dt;
      run.vy += -(dy / d) * err * 0.85 * dt;
      run.vx += (dx / d) * gust * dt;
      run.vy += (dy / d) * gust * dt;
    } else if (s.gate) {
      const gx = s.gate.x - run.x;
      const gy = s.gate.y - run.y;
      const gl = hypot(gx, gy) || 1;
      run.vx += (gx / gl) * 64 * dt;
      run.vy += (gy / gl) * 64 * dt;
    }
    if (run.prevAng == null) run.prevAng = ang;
    let delta = ang - run.prevAng;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    run.prevAng = ang;
    run.flyby += delta;
  }

  if (s.mechanic === 'jupiter' && s.jupiter) {
    const m = s.jupiter;
    const dx = run.x - m.x;
    const dy = run.y - m.y;
    const d = hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    const tx = -Math.sin(ang);
    const ty = Math.cos(ang);
    const peel = run.x > m.x + 80;
    run.vx += tx * (peel ? 18 : 34) * dt;
    run.vy += ty * (peel ? 18 : 34) * dt;
    if (!peel) {
      const err = d - m.desired;
      run.vx += -(dx / d) * err * 3.1 * dt;
      run.vy += -(dy / d) * err * 3.1 * dt;
    } else if (s.gate) {
      const gx = s.gate.x - run.x;
      const gy = s.gate.y - run.y;
      const gl = hypot(gx, gy) || 1;
      run.vx += (gx / gl) * 42 * dt;
      run.vy += (gy / gl) * 42 * dt;
    }
  }

  for (const b of s.bodies || []) {
    if (!b.gravity) continue;
    const dx = b.x - run.x;
    const dy = b.y - run.y;
    const d = hypot(dx, dy);
    if (d < b.radius + 6) {
      run.status = 'lose';
      run.loseReason = 'collision';
      return;
    }
    if (d < (b.influence || b.radius * 5)) {
      const force = b.mass / (d * d);
      run.vx += (dx / d) * force * dt;
      run.vy += (dy / d) * force * dt;
    }
  }

  const sp = hypot(run.vx, run.vy);
  const cruise = s.cruise || 80;
  if (sp > cruise) {
    const k = cruise / sp;
    run.vx = run.vx * (1 - (1 - k) * Math.min(1, dt * 1.6));
    run.vy = run.vy * (1 - (1 - k) * Math.min(1, dt * 1.6));
  }

  run.x += run.vx * dt;
  run.y += run.vy * dt;

  const worldH = s.worldH || 1600;
  if (run.y < 120) { run.y = 120; run.vy *= -0.2; }
  if (run.y > worldH - 120) { run.y = worldH - 120; run.vy *= -0.2; }
  if (run.x < 60) { run.x = 60; run.vx = Math.abs(run.vx) * 0.3; }

  const anomalyGain = (burn ? 0.55 : 0.15) * run.diff.anomaly;
  run.anomaly = clamp(run.anomaly + steer * anomalyGain * dt + burn * 0.55 * run.diff.anomaly * dt, 0, 1);
  const coasting = steer < 0.12 && !burn;
  run.anomaly = clamp(run.anomaly - (coasting ? 0.28 : 0.05) * dt, 0, 1);
  run.radio = clamp(run.radio + (burn ? 1.15 : 0) * dt - 0.28 * dt, 0, 1);
}

function applyComa(run, input, dt, steer, burn) {
  const s = run.stage;
  const heat = heatNow(run);
  run.coma += (heat - run.coma) * (s.heatPull ?? 0.16) * run.diff.drift * dt;
  const dir = (input.comaUp ? 1 : 0) - (input.comaDown ? 1 : 0);
  run.coma += dir * 0.42 * dt;
  if (input.vent && s.mechanic !== 'jupiter') run.coma += 0.05 * dt;
  if (run.outburstPulse > 0) {
    run.coma += 0.55 * dt;
    run.outburstPulse = Math.max(0, run.outburstPulse - dt);
  }
  run.coma = clamp(run.coma, 0, 1);

  if (s.tailDrag != null) run.tail += (s.tailDrag - run.tail) * 0.4 * dt;
  else run.tail += (1 - run.tail) * 0.2 * dt;
  if (input.vent) run.tail += 0.7 * dt;
  run.tail -= burn * 0.85 * dt;
  run.tail -= steer * 0.16 * dt;
  run.tail = clamp(run.tail, 0, 1);

  run.coherence = clamp(run.coherence + 0.16 * run.diff.drift * dt - (input.vent ? 0.62 : 0) * dt, 0, 1);

  const a1 = clamp(run.coma * 0.82 + run.anomaly * 0.28 + (burn ? 0.18 : 0), 0, 1.25);
  run.a1 = a1;
  run.comaBandLive = bandOf(s.comaBand, run.diff.band);
  run.a1BandLive = bandOf(s.a1Band || [0.5, 0.73], run.diff.band * 0.5);
}

function moveOrbiters(run, dt) {
  for (const obs of run.observers) {
    if (!obs.orbiter) continue;
    obs.orbitA = (obs.orbitA || 0) + dt * 0.45;
    const host = run.stage.mars || run.stage.jupiter;
    if (!host) continue;
    obs.x = host.x + Math.cos(obs.orbitA) * obs.orbitR;
    obs.y = host.y + Math.sin(obs.orbitA) * obs.orbitR;
  }
}

function markObservers(run) {
  for (const obs of run.observers) {
    const aim = Math.atan2(run.y - obs.y, run.x - obs.x);
    obs.drawAngle = obs.tracking ? aim : obs.angle;
  }
}

function loseIfBurned(run) {
  if (run.suspicion >= 100 && run.status === 'play') {
    run.status = 'lose';
    run.loseReason = 'detected';
  }
}

function gateHold(run, ready) {
  const gate = run.stage.gate;
  if (!gate) return;
  const d = hypot(run.x - gate.x, run.y - gate.y);
  run.nearGate = d < gate.r * 1.45;
  if (d >= gate.r) return;
  if (ready && run.status === 'play') {
    run.status = 'win';
    run.winReady = true;
    return;
  }
  run.holdFlow = true;
  run.vx *= 0.82;
  run.vy *= 0.82;
  const dx = gate.x - run.x;
  const dy = gate.y - run.y;
  run.x -= dx * 0.04;
  run.y -= dy * 0.04;
  if (!run.alert) run.alert = gate.block;
}

function stepSurvey(run, dt, seeing) {
  const [lo, hi] = run.comaBandLive;
  const comaErr = outside(run.coma, lo, hi);
  const anomBad = Math.max(0, run.anomaly - (run.stage.anomalyCap + run.diff.band));
  const tailBad = Math.max(0, 0.45 - run.tail);
  if (seeing) {
    run.watchedBy = ['ATLAS-CHL'];
    if (comaErr < 0.04 && anomBad <= 0.02) {
      run.catalog = Math.min(1, run.catalog + dt / run.catalogNeed);
      relieve(run, 7, dt);
      if (tailBad > 0.2) punish(run, 6, dt);
    } else {
      punish(run, 8 + comaErr * 18 + anomBad * 26, dt);
    }
  } else {
    relieve(run, 6, dt);
  }
  run.progress = run.catalog;
  run.objectiveText = run.catalog < 1
    ? `Be catalogued as a comet  ·  ${Math.round(run.catalog * 100)}%`
    : 'Catalogued. Clear the outbound gate.';
  gateHold(run, run.catalog >= 1 && anomBad < 0.25);
}

function spectrumError(run) {
  return Math.abs(run.co2 - 0.7) * 1.2 + Math.abs(run.h2o - 0.16) * 1.1;
}

function stepObservatory(run, input, dt) {
  const s = run.stage;
  nudgeSpectrum(run, 'h2o', (s.driftH2o || 0.1) * run.diff.drift * dt);
  if (input.spec === 'co2') nudgeSpectrum(run, 'co2', 0.46 * dt);
  if (input.spec === 'h2o') nudgeSpectrum(run, 'h2o', 0.46 * dt);
  if (input.spec === 'dust') nudgeSpectrum(run, 'dust', 0.46 * dt);

  const idx = run.activeObs;
  if (idx >= run.observers.length) {
    run.status = 'win';
    return;
  }
  const obs = run.observers[idx];
  obs.lit = true;
  run.watchedBy = [obs.name];
  for (let i = 0; i < run.observers.length; i++) {
    if (i !== idx) run.observers[i].lit = false;
  }

  const [lo, hi] = run.comaBandLive;
  const comaErr = outside(run.coma, lo, hi);
  const thin = Math.max(0, lo - run.coma);
  const anomBad = Math.max(0, run.anomaly - (s.anomalyCap + run.diff.band));
  let bad = comaErr * 16 + thin * 22 + anomBad * 20;
  if (obs.kind === 'spectrometer') {
    const err = spectrumError(run);
    const tol = 0.145 + Math.max(0, run.diff.band);
    if (err > tol) bad += 9 + (err - tol) * 34;
    run.alert = err > tol ? 'JWST mix is off — push CO₂' : '';
  } else if (thin > 0.02) {
    run.alert = 'Coma too thin — the hull is resolving';
  } else {
    run.alert = '';
  }

  if (bad < 2.4) {
    run.lockT += dt;
    relieve(run, 5, dt);
  } else {
    punish(run, bad, dt);
    run.lockT = Math.max(0, run.lockT - dt * 0.35);
  }

  if (run.lockT >= run.lockNeed) {
    run.locks[idx] = true;
    run.activeObs += 1;
    run.lockT = 0;
    run.score += 500;
  }

  const frac = (run.activeObs + clamp(run.lockT / run.lockNeed, 0, 1)) / run.observers.length;
  run.progress = frac;
  const names = ['Hubble dwell', 'JWST spectrum', 'Ground confirmation'];
  run.objectiveText = run.activeObs >= run.observers.length
    ? 'All three telescopes satisfied.'
    : `${names[run.activeObs] || 'Dwell'}  ·  ${Math.round(clamp(run.lockT / run.lockNeed, 0, 1) * 100)}%`;
  if (run.activeObs >= run.observers.length && run.status === 'play') run.status = 'win';
}

function stepMars(run, dt, imaging) {
  const m = run.stage.mars;
  const d = hypot(run.x - m.x, run.y - m.y);
  let corridor = 1;
  if (d < m.inner) corridor = clamp(1 - (m.inner - d) / 80, 0, 1);
  else if (d > m.outer) corridor = clamp(1 - (d - m.outer) / 90, 0, 1);
  run.corridor = corridor;
  const departingArc = run.flyby >= run.stage.flybyNeed * 0.9;
  if (!departingArc && corridor < 0.999) punish(run, (1 - corridor) * 16, dt);

  const [lo, hi] = run.comaBandLive;
  const comaErr = outside(run.coma, lo, hi);
  if (imaging) {
    run.watchedBy = ['MRO IMAGING'];
    const anomBad = Math.max(0, run.anomaly - (run.stage.anomalyCap + run.diff.band * 0.5));
    const tailBad = Math.max(0, 0.62 - run.tail);
    if (anomBad > 0 || tailBad > 0 || comaErr > 0.15) {
      punish(run, 8 + anomBad * 32 + tailBad * 34 + comaErr * 8, dt);
      run.alert = anomBad > 0 ? 'Imaging — stop steering' : 'Tail not antisunward';
    } else {
      relieve(run, 4, dt);
      run.alert = 'Imaging window — coast';
    }
  } else {
    run.watchedBy = [];
    relieve(run, 7, dt);
    run.alert = '';
  }

  run.progress = clamp(run.flyby / run.stage.flybyNeed, 0, 1);
  run.objectiveText = `Mars arc ${Math.round(run.progress * 100)}%  ·  corridor ${Math.round(corridor * 100)}%`;
  const ready = run.flyby >= run.stage.flybyNeed && run.anomaly < 0.55 && (corridor > 0.7 || departingArc);
  gateHold(run, ready);
}

function stepConjunction(run, dt, steer, burn) {
  const occulted = sunOccultsEarth(run);
  run.occulted = occulted;
  const sun = run.stage.sun;
  const dist = hypot(run.x - sun.x, run.y - sun.y);
  const inCorona = dist > sun.r + 30 && dist < sun.r + 280;

  run.ephemeris = clamp(
    run.ephemeris + steer * 0.24 * dt + burn * 0.55 * dt - ((steer < 0.08 && !burn) ? (occulted ? 0.14 : 0.035) : 0) * dt,
    0,
    1,
  );

  const [lo, hi] = run.comaBandLive;
  const comaErr = outside(run.coma, lo, hi);
  const bright = Math.max(0, run.coma - 0.4);

  if (occulted) {
    run.watchedBy = inCorona ? ['LASCO'] : [];
    relieve(run, 8, dt);
    if (inCorona && bright > 0) {
      punish(run, 10 + bright * 28, dt);
      run.alert = 'Coronagraph — dim the coma';
    } else if (run.ephemeris > 0.18) {
      run.alert = 'Earth occulted — coast to bleed ephemeris';
    }
  } else {
    run.watchedBy = ['EARTH'];
    if (comaErr > 0.05 || run.anomaly > run.stage.anomalyCap) {
      punish(run, 7 + comaErr * 14 + Math.max(0, run.anomaly - run.stage.anomalyCap) * 16, dt);
    } else {
      relieve(run, 3, dt);
    }
    if (inCorona && bright > 0) punish(run, 8 + bright * 20, dt);
  }

  const span = run.stage.gate.x - run.stage.start.x;
  run.progress = clamp((run.x - run.stage.start.x) / span, 0, 1);
  const eOk = run.ephemeris <= run.stage.ephemerisCap;
  run.objectiveText = `${occulted ? 'OCCULTED' : 'EARTH CAN SEE'}  ·  ephemeris ${Math.round(run.ephemeris * 100)}%`;
  if (!eOk) run.alert = run.alert || 'Ephemeris drifting — coast';
  gateHold(run, eOk && run.anomaly < run.stage.anomalyCap + 0.08);
}

function laneError(run) {
  const lane = run.stage.lane;
  const p = clamp((run.x - lane.x0) / (lane.x1 - lane.x0), 0, 1);
  const y = lane.y0 + (lane.y1 - lane.y0) * p;
  return { y, err: Math.abs(run.y - y), half: lane.half, p };
}

function stepPerihelion(run, dt) {
  const lane = laneError(run);
  if (lane.err > lane.half) punish(run, ((lane.err - lane.half) / lane.half) * 12, dt);
  const [lo, hi] = run.a1BandLive;
  const aErr = outside(run.a1, lo, hi);
  run.watchedBy = ['SOLAR MONITOR'];
  if (aErr > 0.02) {
    punish(run, 7 + aErr * 20, dt);
    run.alert = run.a1 < lo ? 'A1 too quiet — you look inert' : 'A1 too hot — that is an engine';
  } else {
    relieve(run, 6, dt);
    run.alert = '';
  }
  run.progress = lane.p;
  run.objectiveText = `A1 ${run.a1.toFixed(2)}  ·  window ${lo.toFixed(2)}–${hi.toFixed(2)}`;
  const ready = aErr < 0.08 && lane.err < lane.half * 1.15;
  gateHold(run, ready && run.progress > 0.82);
}

function brightnessTarget(run) {
  const s = run.stage;
  const p = clamp(run.t / (s.fadeSeconds || 48), 0, 1);
  return 0.7 + (0.24 - 0.7) * p;
}

function inWindow(run) {
  const wins = run.stage.windows || [];
  for (let i = 0; i < wins.length; i++) {
    const [a, b] = wins[i];
    if (run.t >= a && run.t <= b) return i;
  }
  return -1;
}

function stepCurve(run, input, dt) {
  run.targetBrightness = brightnessTarget(run);
  const win = inWindow(run);
  const err = Math.abs(run.coma - run.targetBrightness);
  if (win >= 0) {
    run.watchedBy = ['GROUND NET'];
    if (run.outburstPulse > 0.2) {
      run.curveMatch += dt * 0.85;
      relieve(run, 4, dt);
      run.alert = 'Outburst logged as natural — once';
    } else if (err < 0.09 + Math.max(0, run.diff.band)) {
      run.curveMatch += dt;
      relieve(run, 5, dt);
      run.alert = '';
    } else {
      punish(run, 8 + err * 22, dt);
      run.alert = 'Off the fading curve';
    }
  } else {
    run.watchedBy = [];
    relieve(run, 6, dt);
    if (!run.alert) run.alert = '';
  }
  if (input.outburst && !run.outburstUsed) {
    run.outburstUsed = true;
    run.outburstPulse = 1.6;
    run.coma = clamp(run.coma + 0.12, 0, 1);
  }
  run.progress = clamp(run.curveMatch / run.curveNeed, 0, 1);
  run.objectiveText = `Fade match ${Math.round(run.progress * 100)}%  ·  target coma ${Math.round(run.targetBrightness * 100)}`;
  gateHold(run, run.curveMatch >= run.curveNeed);
}

function stepJupiter(run, dt) {
  const m = run.stage.jupiter;
  const d = hypot(run.x - m.x, run.y - m.y);
  let corridor = 1;
  if (d < m.inner) corridor = clamp((d - 150) / (m.inner - 150), 0, 1);
  else if (d > m.outer) corridor = clamp(1 - (d - m.outer) / 120, 0, 1);
  run.corridor = corridor;
  const departing = run.x > m.x + 60;
  if (!departing && corridor < 0.999) punish(run, (1 - corridor) * 14, dt);

  const particleLook = d < 760;
  const names = [];
  if (particleLook && run.coherence > 0.48) {
    names.push('PARTICLE');
    punish(run, 8 + (run.coherence - 0.48) * 28, dt);
    run.alert = 'Ion tail too straight — tumble it';
  } else if (particleLook) {
    names.push('PARTICLE');
    relieve(run, 4, dt);
  }
  if (run.radio > 0.18) {
    names.push('RADIO');
    punish(run, 10 + run.radio * 22, dt);
    run.alert = 'Radio leak — kill the burn';
  }
  if (!names.length) relieve(run, 5, dt);
  run.watchedBy = names;
  if (!run.alert && run.coherence > 0.48) run.alert = 'Tumble the ion tail';
  else if (run.coherence <= 0.48 && run.radio <= 0.18 && corridor > 0.9) run.alert = '';

  const gate = run.stage.gate;
  run.progress = clamp((run.x - run.stage.start.x) / (gate.x - run.stage.start.x), 0, 1);
  run.objectiveText = `Flyby  ·  ion ragged ${Math.round((1 - run.coherence) * 100)}%  ·  radio ${Math.round(run.radio * 100)}`;
  const ready = run.x > m.x + 240 && d > m.inner && run.coherence < 0.62 && run.radio < 0.3;
  gateHold(run, ready);
}

function stepDeparture(run, dt) {
  const s = run.stage;
  const phase = run.t - (s.surveyDelay || 0);
  const on = phase > 0 && (phase % (s.surveyPeriod || 13)) < (s.surveyOn || 8);
  run.surveyed = on;
  const [lo, hi] = run.comaBandLive;
  const comaErr = outside(run.coma, lo, hi);
  const anomBad = Math.max(0, run.anomaly - (s.anomalyCap + run.diff.band));
  if (on) {
    run.watchedBy = ['DEEP SURVEY'];
    if (comaErr < 0.05 && anomBad <= 0) {
      relieve(run, 6, dt);
      run.alert = 'Survey is on you — do nothing';
    } else {
      punish(run, 9 + comaErr * 22 + anomBad * 30, dt);
      run.alert = comaErr > 0 ? 'Too active for a spent comet' : 'Trajectory twitch';
    }
  } else {
    run.watchedBy = [];
    relieve(run, 7, dt);
    if (phase <= 0) run.alert = 'Fade the coma before they look';
    else run.alert = 'Survey gap — trim, then coast';
  }
  const span = s.gate.x - s.start.x;
  run.progress = clamp((run.x - s.start.x) / span, 0, 1);
  run.objectiveText = on
    ? 'Final survey watching — stay faint'
    : `Departure ${Math.round(run.progress * 100)}%  ·  fade the coma`;
  const ready = comaErr < 0.12 && run.anomaly < s.anomalyCap + 0.1;
  gateHold(run, ready);
}

export function step(run, input, dt) {
  if (run.status !== 'play') return run;
  const stepDt = clamp(dt, 0, 0.05);
  run.t += stepDt;
  run.alert = '';
  run.holdFlow = false;
  run.watchedBy = [];
  run.score += stepDt * (1.15 - run.suspicion / 140) * 36;

  let ax = input.ax || 0;
  let ay = input.ay || 0;
  const mag = hypot(ax, ay) || 1;
  if (hypot(ax, ay) > 1) { ax /= mag; ay /= mag; }
  const steer = clamp(hypot(input.ax || 0, input.ay || 0), 0, 1);
  const burn = input.burn ? 1 : 0;

  const power = run.stage.steerPower || 95;
  run.vx += ax * power * (burn ? 2.1 : 1) * stepDt;
  run.vy += ay * power * (burn ? 2.1 : 1) * stepDt;

  moveOrbiters(run, stepDt);
  integrate(run, input, stepDt, steer, burn);
  if (run.status !== 'play') {
    loseIfBurned(run);
    return run;
  }
  applyComa(run, input, stepDt, steer, burn);

  for (const obs of run.observers) {
    if (!obs.tracking) obs.angle += (obs.speed || 0.3) * stepDt;
    obs.lit = false;
  }

  const mech = run.stage.mechanic;
  switch (mech) {
    case 'survey': {
      const obs = run.observers[0];
      const seeing = inCone(run, obs);
      obs.lit = seeing;
      stepSurvey(run, stepDt, seeing);
      break;
    }
    case 'observatory':
      stepObservatory(run, input, stepDt);
      break;
    case 'mars': {
const marsMod = run.t % run.stage.imagePeriod;
  const imaging = marsMod < run.stage.imageDuty;
  run.imageHot = imaging;
  run.imageLeft = imaging ? run.stage.imageDuty - marsMod : run.stage.imagePeriod - marsMod;
  for (const obs of run.observers) obs.lit = imaging;
  stepMars(run, stepDt, imaging);
      break;
    }
    case 'conjunction':
      for (const obs of run.observers) {
        if (obs.kind === 'coronagraph') {
          const d = hypot(run.x - run.stage.sun.x, run.y - run.stage.sun.y);
          obs.lit = d < (run.stage.sun.r + 280);
        } else {
          obs.lit = !sunOccultsEarth(run);
        }
      }
      stepConjunction(run, stepDt, steer, burn);
      break;
    case 'perihelion':
      run.observers[0].lit = true;
      stepPerihelion(run, stepDt);
      break;
    case 'curve': {
      const win = inWindow(run);
      run.observers[0].lit = win >= 0;
      stepCurve(run, input, stepDt);
      break;
    }
    case 'jupiter':
      for (const obs of run.observers) {
        obs.lit = obs.kind === 'radio' ? run.radio > 0.12 : hypot(run.x - run.stage.jupiter.x, run.y - run.stage.jupiter.y) < 760;
      }
      stepJupiter(run, stepDt);
      break;
    case 'departure':
      stepDeparture(run, stepDt);
      run.observers[0].lit = run.surveyed;
      break;
    default:
      throw new Error(`Unhandled mechanic: ${mech}`);
  }

  markObservers(run);
  loseIfBurned(run);

  if (run.status === 'win') {
    const stealth = Math.round((1 - run.suspicion / 100) * 4200);
    run.score += 900 + Math.max(0, stealth);
  }
  return run;
}

export function hudSnapshot(run) {
  const s = run.stage;
  return {
    suspicion: run.suspicion,
    coma: run.coma,
    comaBand: run.comaBandLive,
    tail: run.tail,
    anomaly: run.anomaly,
    anomalyCap: (s.anomalyCap ?? 0.4) + run.diff.band,
    catalog: run.catalog,
    locks: run.locks,
    lockNames: (s.observers || []).map((o) => o.name),
    activeObs: run.activeObs,
    ephemeris: run.ephemeris,
    imageHot: Boolean(run.imageHot),
    imageLeft: run.imageLeft || 0,
    ephemerisCap: s.ephemerisCap ?? 0.5,
    a1: run.a1,
    a1Band: run.a1BandLive,
    co2: run.co2,
    h2o: run.h2o,
    dust: run.dust,
    coherence: run.coherence,
    radio: run.radio,
    curve: run.progress,
    targetBrightness: run.targetBrightness,
    occulted: run.occulted,
    corridor: run.corridor,
    surveyed: run.surveyed,
    outburstUsed: run.outburstUsed,
    objective: run.objectiveText,
    alert: run.alert,
    watchedBy: run.watchedBy.slice(),
    progress: run.progress,
    meters: s.meters,
    mechanic: s.mechanic,
    nearGate: run.nearGate,
    score: run.score,
    t: run.t,
  };
}
