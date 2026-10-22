import { SKINS } from '../constants.js';
import { createRun, hudSnapshot, step } from './sim.js';
import { createVisuals, renderFrame, syncParticles } from './render.js';

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export class CampaignEngine {
  constructor(canvas, stageId, difficultyId = 'medium', skinId = 'default', options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.run = createRun(stageId, difficultyId, options);
    const mobile = canvas.width < 900 || (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches);
    this.visuals = createVisuals(mobile);
    const skin = SKINS.find((s) => s.id === skinId) || SKINS[0];
    this.visuals.skin = { core: skin.coreColor, glow: skin.glowColor, trail: skin.trailColor };
    this.keys = {};
    this.actions = {};
    this.joystick = { active: false, dx: 0, dy: 0 };
    this.running = false;
    this.raf = 0;
    this.last = 0;
    this.hold = 0;
    this.sent = false;
    this.camX = this.run.x - 480;
    this.camY = this.run.y - 360;
    this.shake = 0;
    this.prevSuspicion = 0;
    this.hudAt = 0;
    this.onDetectionChange = null;
    this.onScoreChange = null;
    this.onLevelComplete = null;
    this.onGameOver = null;
    this.onHud = null;
    this._loop = this._loop.bind(this);
  }

  start() {
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  pause() { this.stop(); }

  resume() { if (!this.running) this.start(); }

  resize() {
    this.visuals.mobile = this.canvas.width < 900;
  }

  handleKey(key, down) {
    this.keys[String(key).toLowerCase()] = down;
  }

  setJoystick(data) {
    this.joystick = { ...this.joystick, ...data };
  }

  setAction(name, down) {
    this.actions[name] = down;
  }

  _input() {
    const k = this.keys;
    const A = this.actions;
    let ax = 0;
    let ay = 0;
    if (k.arrowleft || k.a) ax -= 1;
    if (k.arrowright || k.d) ax += 1;
    if (k.arrowup || k.w) ay -= 1;
    if (k.arrowdown || k.s) ay += 1;
    if (this.joystick.active) {
      ax = this.joystick.dx;
      ay = this.joystick.dy;
    }
    let spec = null;
    if (A.specCo2 || k['1']) spec = 'co2';
    if (A.specH2o || k['2']) spec = 'h2o';
    if (A.specDust || k['3']) spec = 'dust';
    return {
      ax,
      ay,
      comaUp: Boolean(A.comaUp || k.e),
      comaDown: Boolean(A.comaDown || k.q),
      vent: Boolean(A.vent || k.r),
      burn: Boolean(A.burn || k.shift),
      outburst: Boolean(A.outburst || k.f),
      spec,
    };
  }

  _camera(dt) {
    const canvas = this.canvas;
    const viewW = 1020;
    const viewH = viewW * (canvas.height / Math.max(1, canvas.width));
    const run = this.run;
    const goalX = run.x - viewW * 0.4;
    const goalY = run.y - viewH * 0.52;
    const follow = 1 - Math.pow(0.001, dt);
    this.camX += (goalX - this.camX) * follow;
    this.camY += (goalY - this.camY) * follow;
    const maxX = (run.stage.worldW || 2800) - viewW * 0.5;
    const maxY = (run.stage.worldH || 1600) - viewH * 0.45;
    this.camX = clamp(this.camX, -200, Math.max(-200, maxX));
    this.camY = clamp(this.camY, -160, Math.max(-160, maxY));
    return { viewW, scale: canvas.width / viewW };
  }

  _emitHud(force) {
    const now = performance.now();
    if (!force && now - this.hudAt < 90) return;
    this.hudAt = now;
    const hud = hudSnapshot(this.run);
    if (this.onHud) this.onHud(hud);
    if (this.onDetectionChange) this.onDetectionChange(hud.suspicion);
    if (this.onScoreChange) this.onScoreChange(Math.round(hud.score));
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.033, (now - this.last) / 1000 || 0.016);
    this.last = now;
    const run = this.run;
    if (run.status === 'play') {
      step(run, this._input(), dt);
      syncParticles(this.visuals, run, dt);
      if (run.suspicion - this.prevSuspicion > 4) this.shake = Math.min(1, this.shake + 0.45);
      this.prevSuspicion = run.suspicion;
    } else if (!this.sent) {
      this.hold += dt;
      if (this.hold > 0.65) {
        this.sent = true;
        const score = Math.round(run.score);
        if (run.status === 'win') this.onLevelComplete?.(score, run.suspicion);
        else this.onGameOver?.(run.loseReason || 'detected');
      }
    }
    this.shake = Math.max(0, this.shake - dt * 1.6);
    const { scale } = this._camera(dt);
    renderFrame(this.ctx, this.canvas, {
      camX: this.camX,
      camY: this.camY,
      scale,
      shake: this.shake,
      t: run.t,
    }, run, this.visuals);
    this._emitHud(run.status !== 'play');
    this.raf = requestAnimationFrame(this._loop);
  }
}
