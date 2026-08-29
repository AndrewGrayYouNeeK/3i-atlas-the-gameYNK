import { PHYSICS, LEVELS, DIFFICULTIES, SOLAR_SYSTEM_PLANETS, SKINS } from './constants.js';


export class GameEngine {
  // ─── Asset image cache ──────────────────────────────────────────────────────
  static PLANET_IMGS = null;
  static THREAT_IMGS = null;
  static BG_IMGS = null;

  static preloadAssets() {
    if (GameEngine.PLANET_IMGS) return;
    const BASE = 'https://raw.githubusercontent.com/AndrewGrayYouNeeK/3i-atlas-the-game/main';
    const load = (src) => { const i = new Image(); i.crossOrigin='anonymous'; i.src=src; return i; };
    GameEngine.PLANET_IMGS = {
      0: load(BASE+'/src/assets/planets/planet_mercury.png'),
      1: load(BASE+'/src/assets/planets/planet_venus.png'),
      2: load(BASE+'/src/assets/planets/planet_earth.png'),
      3: load(BASE+'/src/assets/planets/planet_mars.png'),
      4: load(BASE+'/src/assets/planets/planet_jupiter.png'),
      5: load(BASE+'/src/assets/planets/planet_neptune.png'),
      6: load(BASE+'/src/assets/planets/planet_eris.png'),
    };
    GameEngine.THREAT_IMGS = {
      probe:      load(BASE+'/src/assets/threats/threat_probe.png'),
      satellite:  load(BASE+'/src/assets/threats/threat_satellite.png'),
      hunter:     load(BASE+'/src/assets/threats/threat_hunter.png'),
      deepSpace:  load(BASE+'/src/assets/threats/threat_dish.png'),
      relay:      load(BASE+'/src/assets/threats/threat_relay.png'),
    };
    GameEngine.BG_IMGS = {
      0: load(BASE+'/src/assets/backgrounds/bg_kuiper.png'),
      1: load(BASE+'/src/assets/backgrounds/bg_venus.png'),
      2: load(BASE+'/src/assets/backgrounds/bg_earth.png'),
      3: load(BASE+'/src/assets/backgrounds/bg_mars.png'),
      4: load(BASE+'/src/assets/backgrounds/bg_jupiter.png'),
      5: load(BASE+'/src/assets/backgrounds/bg_kuiper.png'),
      6: load(BASE+'/src/assets/backgrounds/bg_kuiper.png'),
    };
  }

  constructor(canvas, levelId, difficultyId = 'medium', skinId = 'default', options = {}) {
    this.canvas = canvas;
    GameEngine.preloadAssets();
    this.ctx = canvas.getContext('2d');
    this.levelId = levelId;
    this.level = LEVELS[levelId];
    this.difficulty = DIFFICULTIES[difficultyId] || DIFFICULTIES.medium;
    this.skin = SKINS.find(s => s.id === skinId) || SKINS[0];
    this.mode = options.mode || 'mission';
    this.threatBonus = options.threatBonus || 0;
    this.scanMult = options.scanMult || 1;
    this.running = false;
    this.animFrame = null;
    this.lastTime = 0;

    // Comet (Atlas) state — starts at LEFT edge (outer solar system), flies RIGHT toward the Sun
    this.atlas = {
      x: canvas.width * 0.04,
      y: canvas.height * 0.5,
      vx: 0.8 * this.difficulty.speedMult,
      vy: 0,
      speed: PHYSICS.BASE_SPEED * this.difficulty.speedMult,
      angle: 0,            // heading angle
      nucleusAngle: 0,     // slow tumble
      trail: [],
      dustTrail: [],
      eyeMode: null,
      mythActive: false,
    };

    // Gas supplies (limited charges)
    this.gasActive = null;
    this.gasTimer = 0;
    this.gasCooldowns = { methane: 0, ammonia: 0, xenon: 0 };
    // Gas charges by difficulty: easy=5, medium=3, hard=2
    const gasCount = this.difficulty.id === 'easy' ? 5 : this.difficulty.id === 'hard' ? 2 : 3;
    const gasPenalty = options.gasPenalty || 0;
    const effectiveGas = Math.max(1, gasCount - gasPenalty);
    this.gasCharges = { methane: effectiveGas, ammonia: effectiveGas, xenon: effectiveGas };

    // Stealth combo — rewards sustained low detection
    this.stealthCombo = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.onComboChange = null;

    // Energy orbs — bonus score + slight detection relief
    this.collectibles = this._generateCollectibles();

    // Game state
    this.detection = 0;
    this.score = 0;
    this.levelComplete = false;
    this.levelFlash = 0;
    this.ghostTrail = [];
    this.gameOver = false;
    this.survivalTime = 0;
    this.mythTimer = 0;
    this.mythCooldown = 0;
    this.alertLevel = 0;   // 0=calm, 1=suspicious, 2=alert
    this.alertTimer = 0;
    this.prevDetection = 0;
    this.screenShake = 0;
    this.solarWind = this._getSolarWind();
    this.inShadow = false;

    // World — wider than the viewport; a scrolling camera follows Atlas
    this.worldWidth = canvas.width * 3.5 * (this.difficulty.worldLengthMult || 1);
    this.worldHeight = canvas.height;
    this.camera = { x: 0, y: 0 };

    // World — gravityWells must be generated before destination
    this.stars = this._generateStars(500);
    this.nebulaDust = this._generateNebulaDust(80);
    this.asteroids = [];
    this.gravityWells = this._generateGravityWells();
    this.destination = this._generateDestination();
    this.threats = this._generateThreats();
    this.objectives = this._generateStealthObjectives();
    this.gasParticles = [];
    this.dustParticles = [];
    this.wormholeAngle = 0;
    this.destinationPulseT = 0;

    // Input
    this.keys = {};
    this.joystick = { active: false, dx: 0, dy: 0 };

    // Callbacks
    this.onDetectionChange = null;
    this.onGasChange = null;
    this.onScoreChange = null;
    this.onLevelComplete = null;
    this.onGameOver = null;
    this.onObjectiveUpdate = null;
  }

  // ─── GENERATION ────────────────────────────────────────────────────────────

  _generateStars(count) {
    const W = this.canvas.width, H = this.canvas.height;
    return Array.from({ length: count }, () => {
      const rnd = Math.random();
      // 5% large bright stars, 15% medium, rest small
      const r = rnd < 0.05 ? Math.random() * 2.2 + 1.2
              : rnd < 0.20 ? Math.random() * 1.0 + 0.5
              : Math.random() * 0.5 + 0.15;
      const colorRnd = Math.random();
      const color = colorRnd < 0.10 ? '#ffd0a0'   // warm orange
                  : colorRnd < 0.20 ? '#a8c8ff'   // cool blue
                  : colorRnd < 0.24 ? '#ffe8ff'   // faint pink
                  : '#ffffff';
      return {
        ox: Math.random() * W,
        oy: Math.random() * H,
        r,
        opacity: 0.35 + Math.random() * 0.65,
        twinkle: Math.random() * 0.028 + 0.003,
        phase: Math.random() * Math.PI * 2,
        parallax: 0.015 + Math.random() * 0.07,
        color,
      };
    });
  }

  _getSolarWind() {
    const winds = [
      { x: -1, y: -0.15 },
      { x: -0.9, y: 0.2 },
      { x: -0.75, y: -0.35 },
      { x: -1, y: 0.05 },
    ];
    return winds[this.levelId % winds.length];
  }

  _generateNebulaDust(count) {
    const W = this.canvas.width, H = this.canvas.height;
    return Array.from({ length: count }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 80 + Math.random() * 180,
      opacity: 0.025 + Math.random() * 0.06,
      drift: 0.05 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      hueShift: (i % 3) * 18,
    }));
  }

  _generateGravityWells() {
    const W = this.worldWidth, H = this.worldHeight;

    // One main planet per level — mapped by levelId
    const levelPlanetIndex = [
      0, // Level 0: Neptune (Kuiper Belt)
      4, // Level 1: Jupiter
      3, // Level 2: Mars
      2, // Level 3: Earth
      1, // Level 4: Venus
      0, // Level 5: Neptune (Blue Dark)
      7, // Level 6: Mercury (Sunline)
      8, // Level 7: Sun Dive
    ];
    const planetIdx = levelPlanetIndex[Math.min(this.levelId, levelPlanetIndex.length - 1)];
    const def = SOLAR_SYSTEM_PLANETS[planetIdx];
    const radius = def.radius;
    const influenceRadius = radius * 5 + 60;

    // Main planet in the first third of the world
    const x = W * 0.28 + (Math.random() - 0.5) * W * 0.06;
    const y = H * 0.5 + (Math.random() - 0.5) * H * 0.25;

    const wells = [{
      x, y,
      radius,
      influenceRadius,
      strength: def.isSun ? 3.5 : (def.radius > 35 ? 1.8 : def.radius > 22 ? 1.2 : 0.9),
      color: def.color,
      name: def.name,
      def,
      ringCount: def.ringCount,
      angle: 0,
      isSun: !!def.isSun,
    }];

    // Secondary body — a small moon for a mid-journey slingshot
    const moonR = 11 + Math.random() * 4;
    wells.push({
      x: W * (this.difficulty.id === 'hard' ? 0.52 : 0.62) + (Math.random() - 0.5) * W * 0.05,
      y: H * 0.4 + (Math.random() - 0.5) * H * 0.35,
      radius: moonR,
      influenceRadius: moonR * 5 + 40,
      strength: 0.6,
      color: '#9aa3b0',
      name: 'Ice Moon',
      def: { name: 'Ice Moon', color: '#9aa3b0', radius: moonR, type: 'scorched', ringCount: 0 },
      ringCount: 0,
      angle: 0,
      isSun: false,
    });

    if (this.difficulty.id === 'hard') {
      const rockR = 14;
      wells.push({
        x: W * 0.78 + (Math.random() - 0.5) * W * 0.04,
        y: H * 0.62 + (Math.random() - 0.5) * H * 0.18,
        radius: rockR,
        influenceRadius: rockR * 5 + 36,
        strength: 0.55,
        color: '#6b5c4a',
        name: 'Dark Rock',
        def: { name: 'Dark Rock', color: '#6b5c4a', radius: rockR, type: 'scorched', ringCount: 0 },
        ringCount: 0,
        angle: 0,
        isSun: false,
      });
    }

    return wells;
  }

  _generateDestination() {
    const W = this.worldWidth, H = this.worldHeight;
    const gw = this.gravityWells[0];
    const yBase = gw && gw.y < H * 0.5 ? H * 0.72 : H * 0.28;
    const x = W * 0.95 + (Math.random() - 0.5) * W * 0.02;
    const y = yBase + (Math.random() - 0.5) * H * 0.1;
    return {
      x: Math.max(60, Math.min(W - 60, x)),
      y: Math.max(60, Math.min(H - 60, y)),
      radius: 28,
      captureRadius: 50,
      gravStrength: 0.35,
      pulseT: 0,
    };
  }

  _generateThreats() {
    const cfg = this.level.threatConfig;
    const threats = [];
    const W = this.worldWidth, H = this.worldHeight;
    let id = 0;

    // Build a pool of anchor positions: near planets + open space between them
    const anchorPool = [];
    for (const gw of this.gravityWells) {
      if (gw.isSun) continue; // no threats at the Sun
      const orbitR = gw.influenceRadius * 0.9 + gw.radius;
      for (let a = 0; a < 4; a++) {
        const angle = (a / 4) * Math.PI * 2 + Math.random() * 0.8;
        anchorPool.push({
          x: Math.max(60, Math.min(W - 60, gw.x + Math.cos(angle) * orbitR)),
          y: Math.max(60, Math.min(H - 60, gw.y + Math.sin(angle) * orbitR * 0.7)),
        });
      }
    }
    // Add open-space anchors between planets
    for (let i = 0; i < this.gravityWells.length - 1; i++) {
      const a = this.gravityWells[i], b = this.gravityWells[i + 1];
      anchorPool.push({ x: (a.x + b.x) / 2 + (Math.random() - 0.5) * 80, y: 80 + Math.random() * (H - 160) });
    }
    // Open-space anchors spread across the full journey
    const spreadCount = this.difficulty.id === 'hard' ? 11 : 6;
    for (let i = 1; i <= spreadCount; i++) {
      anchorPool.push({ x: (W * i) / (spreadCount + 1), y: 80 + Math.random() * (H - 160) });
    }
    let anchorIdx = 0;

    const add = (type, count) => {
      for (let i = 0; i < count; i++) {
        const dm = this.difficulty.threatSpeedMult;
        const configs = {
          probe: {
            speed: (1.2 + this.levelId * 0.3) * dm,
            scanRadius: 100 + this.levelId * 15,
            scanArc: Math.PI / 2.5,
            scanSpeed: 0.025 + this.levelId * 0.008,
            color: '#00ccff', size: 5,
            detects: ['visual', 'radar'],
            patrol: 'sweep',
          },
          satellite: {
            speed: 0.6 * dm,
            scanRadius: 140 + this.levelId * 20,
            scanArc: Math.PI * 0.4,
            scanSpeed: 0.018,
            color: '#ffcc00', size: 7,
            detects: ['radar', 'heat'],
            patrol: 'orbit',
          },
          hunter: {
            speed: (2.0 + this.levelId * 0.4) * dm,
            scanRadius: 90,
            scanArc: Math.PI / 3,
            scanSpeed: 0.04,
            color: '#ff3355', size: 6,
            detects: ['visual', 'radar', 'heat'],
            patrol: 'intercept',
            alerted: false,
          },
          deepSpace: {
            speed: 0.3 * dm,
            scanRadius: 200,
            scanArc: Math.PI * 1.2,
            scanSpeed: 0.008,
            color: '#44aaff', size: 9,
            detects: ['radar'],
            patrol: 'stationary',
          },
          relay: {
            speed: 0.5 * dm,
            scanRadius: 80,
            scanArc: Math.PI * 2,  // full 360
            scanSpeed: 0.03,
            color: '#ffaa44', size: 5,
            detects: ['visual', 'radar', 'heat'],
            patrol: 'sweep',
          },
        };
        const c = configs[type];
        // Use anchor pool (planet orbits / between-planet gaps), cycling through
        const anchor = anchorPool.length > 0
          ? anchorPool[anchorIdx++ % anchorPool.length]
          : { x: 120 + Math.random() * (W - 240), y: 80 + Math.random() * (H - 160) };
        const spread = this.difficulty.id === 'hard' ? 48 : 80;
        const px = Math.max(60, Math.min(W - 60, anchor.x + (Math.random() - 0.5) * spread));
        const py = Math.max(60, Math.min(H - 60, anchor.y + (Math.random() - 0.5) * spread));
        // Local patrol loops so you can read the gap and wait — not random teleports across the map
        const waypointCount = c.patrol === 'orbit' ? 1 : 3;
        const loopR = this.difficulty.id === 'hard' ? 70 + Math.random() * 40 : 90 + Math.random() * 50;
        const waypoints = Array.from({ length: waypointCount }, (_, w) => {
          const ang = (w / waypointCount) * Math.PI * 2 + Math.random() * 0.4;
          return {
            x: Math.max(60, Math.min(W - 60, px + Math.cos(ang) * loopR)),
            y: Math.max(50, Math.min(H - 50, py + Math.sin(ang) * loopR * 0.65)),
          };
        });
        // Scale scan radius with difficulty: easy=0.7x, medium=1.0x, hard=1.15x (coverage, not sniper-speed)
        const scanRadiusMult = (this.difficulty.id === 'easy' ? 0.7 : this.difficulty.id === 'hard' ? 1.15 : 1.0) * this.scanMult;
        threats.push({
          id: id++, type, ...c,
          scanRadius: c.scanRadius * scanRadiusMult,
          x: px, y: py,
          vx: (Math.random() - 0.5) * c.speed,
          vy: (Math.random() - 0.5) * c.speed,
          scanAngle: Math.random() * Math.PI * 2,
          alertTimer: 0,
          alerted: false,
          waypointIndex: 0,
          waypoints,
          orbitAngle: Math.random() * Math.PI * 2,
          orbitRadius: 80 + Math.random() * 60,
          orbitCenter: { x: px, y: py },
          memory: 0, // how long it's been tracking atlas
        });
      }
    };

    Object.entries(cfg).forEach(([type, count]) => add(type, count));
    if (this.difficulty.id === 'hard') {
      add('probe', 2 + Math.floor(this.levelId / 3));
    }
    if (this.threatBonus > 0) {
      const types = Object.keys(cfg).filter((k) => cfg[k] > 0);
      for (let i = 0; i < this.threatBonus; i++) {
        add(types[i % types.length] || 'probe', 1);
      }
    }
    return threats;
  }

  _generateCollectibles() {
    const W = this.worldWidth, H = this.worldHeight;
    const count = (4 + Math.floor(this.levelId / 2)) * (this.difficulty.id === 'hard' ? 2 : 1);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: W * (0.15 + (i + 1) / (count + 2) * 0.65) + (Math.random() - 0.5) * 60,
      y: 80 + Math.random() * (H - 160),
      radius: 14,
      pulse: Math.random() * Math.PI * 2,
      collected: false,
      value: 250 + this.levelId * 80,
    }));
  }

  _generateStealthObjectives() {
    if (this.difficulty.id !== 'hard') return [];
    const W = this.worldWidth;
    const planet = this.gravityWells[0];
    const moon = this.gravityWells[1];
    const rock = this.gravityWells[2];
    const dest = this.destination;
    const marks = [];
    if (planet) {
      marks.push({
        id: 'shadow',
        x: Math.min(W - 80, planet.x + planet.radius + 42),
        y: planet.y,
        radius: 24,
        done: false,
        pulseT: 0,
        text: 'Thread the planet’s shadow',
      });
    }
    if (moon) {
      marks.push({
        id: 'moon',
        x: moon.x,
        y: Math.max(48, moon.y - moon.radius - 38),
        radius: 22,
        done: false,
        pulseT: 0,
        text: 'Slip the moon blind side',
      });
    }
    if (rock) {
      marks.push({
        id: 'rock',
        x: rock.x - rock.radius - 36,
        y: rock.y,
        radius: 22,
        done: false,
        pulseT: 0,
        text: 'Hide behind the dark rock',
      });
    } else if (dest) {
      marks.push({
        id: 'coast',
        x: dest.x - Math.min(240, W * 0.1),
        y: dest.y,
        radius: 22,
        done: false,
        pulseT: 0,
        text: 'Coast the last lane — no burst',
      });
    }
    return marks;
  }

  _lineHitsBody(x1, y1, x2, y2) {
    for (const gw of this.gravityWells) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      if (len2 < 1) continue;
      const t = Math.max(0, Math.min(1, ((gw.x - x1) * dx + (gw.y - y1) * dy) / len2));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const hitR = gw.radius + 6;
      if ((px - gw.x) ** 2 + (py - gw.y) ** 2 < hitR * hitR) return true;
    }
    return false;
  }

  // ─── LIFECYCLE ─────────────────────────────────────────────────────────────

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.levelFlash = 1.8; // trigger level-start flash
    if (this.onObjectiveUpdate) this.onObjectiveUpdate(this.objectives);
    this._loop(this.lastTime);
  }
  stop() { this.running = false; if (this.animFrame) cancelAnimationFrame(this.animFrame); }
  pause() { this.running = false; }
  resume() { this.running = true; this.lastTime = performance.now(); this._loop(this.lastTime); }

  _loop(timestamp) {
    if (!this.running) return;
    const rawDt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    const dt = this.atlas.mythActive ? rawDt * PHYSICS.MYTH_SLOW_FACTOR : rawDt;
    this._update(dt, rawDt, timestamp);
    this._render(timestamp);
    this.animFrame = requestAnimationFrame((t) => this._loop(t));
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  _update(dt, rawDt, t) {
    this._applyGravity(dt);
    this._updateAtlas(dt);
    // Camera follows Atlas horizontally, clamped to world bounds
    const vw = this.canvas.width;
    this.camera.x = Math.max(0, Math.min(this.worldWidth - vw, this.atlas.x - vw / 2));
    this._updateThreats(dt, t);
    this._updateGas(rawDt);
    this._updateMyth(rawDt);
    this._updateDetection(dt);
    this._updateCombo(dt);
    this._updateObjectives(t);
    this._updateCollectibles(t);
    this._updateParticles(dt);
    this.screenShake = Math.max(0, this.screenShake - dt * 2.8);
    if (this.levelFlash > 0) this.levelFlash = Math.max(0, this.levelFlash - dt);
    if (!this.gameOver && !this.levelComplete) {
      this.survivalTime += rawDt;
      this.wormholeAngle += rawDt * 1.8;
      this.destinationPulseT += rawDt * 2.5;
      this.destination.pulseT = this.destinationPulseT;
    }
    this._checkWinLose();
  }

  _updateAtlas(dt) {
    const a = this.atlas;
    let ax = 0, ay = 0;

    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) ax -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) ax += 1;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) ay -= 1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) ay += 1;
    if (this.joystick.active) { ax = this.joystick.dx; ay = this.joystick.dy; }

    const burstSpeed = PHYSICS.BURST_SPEED * this.difficulty.speedMult;
    const baseSpeed = PHYSICS.BASE_SPEED * this.difficulty.speedMult;
    const minSpeed = PHYSICS.MIN_SPEED * this.difficulty.speedMult;
    if (this.keys['Shift'] || this.joystick.burst) {
      a.speed = Math.min(a.speed + 4 * dt, burstSpeed);
    } else if (this.keys['Control'] || this.joystick.slow) {
      a.speed = Math.max(a.speed - 3 * dt, minSpeed);
    } else {
      a.speed += (baseSpeed - a.speed) * dt * 1.5;
    }

    if (ax !== 0 || ay !== 0) {
      const mag = Math.sqrt(ax * ax + ay * ay);
      ax /= mag;
      ay /= mag;
      a.vx += ax * a.speed * dt * 7.5;
      a.vy += ay * a.speed * dt * 9;
      a.angle = Math.atan2(ay, ax);
    }

    const maxVelocity = PHYSICS.MAX_SPEED * this.difficulty.speedMult;
    const currentVelocity = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    if (currentVelocity > maxVelocity) {
      a.vx = (a.vx / currentVelocity) * maxVelocity;
      a.vy = (a.vy / currentVelocity) * maxVelocity;
    }

    // Lower damping so gravitational slingshot momentum carries through
    a.vx *= 0.97;
    a.vy *= 0.97;
    a.x += a.vx;
    a.y += a.vy;
    a.nucleusAngle += 0.004;

    // Keep Atlas inside the world bounds
    a.x = Math.max(20, Math.min(this.worldWidth - 20, a.x));
    a.y = Math.max(20, Math.min(this.worldHeight - 20, a.y));

    // Dust trail — emitted opposite to velocity so it streams behind the comet
    const vel = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    const dustCount = Math.floor(vel * 3 + 2);
    for (let i = 0; i < dustCount; i++) {
      this.dustParticles.push({
        x: a.x + (Math.random() - 0.5) * 6,
        y: a.y + (Math.random() - 0.5) * 6,
        vx: -a.vx * 0.55 + (Math.random() - 0.5) * 0.6,
        vy: -a.vy * 0.55 + (Math.random() - 0.5) * 0.6,
        life: 1,
        r: Math.random() * 3.5 + 1,
        type: 'dust',
      });
    }

    a.trail.push({ x: a.x, y: a.y });
    if (a.trail.length > 30) a.trail.shift();

    // Ghost trail for comet glow echoes
    this.ghostTrail.push({ x: a.x, y: a.y, t: 0 });
    if (this.ghostTrail.length > 15) this.ghostTrail.shift();
  }

  _applyGravity(dt) {
    for (const gw of this.gravityWells) {
      const dx = gw.x - this.atlas.x;
      const dy = gw.y - this.atlas.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      if (dist < gw.radius + 12) {
        if (!this.gameOver) {
          this.gameOver = true;
          if (this.onGameOver) this.onGameOver('collision');
        }
        return;
      }

      if (dist < gw.influenceRadius) {
        const force = (PHYSICS.GRAVITY_CONSTANT * gw.strength) / distSq;
        this.atlas.vx += (dx / dist) * force * dt;
        this.atlas.vy += (dy / dist) * force * dt;
      }
    }

    // Gentle pull from destination anchor
    const dest = this.destination;
    const ddx = dest.x - this.atlas.x;
    const ddy = dest.y - this.atlas.y;
    const ddist = Math.sqrt(ddx * ddx + ddy * ddy);
    if (ddist > 1) {
      const force = (PHYSICS.GRAVITY_CONSTANT * dest.gravStrength) / (ddist * ddist);
      this.atlas.vx += (ddx / ddist) * force * dt;
      this.atlas.vy += (ddy / ddist) * force * dt;
    }
  }

  _updateThreats(dt, t) {
    const atlas = this.atlas;
    let anyAlerted = false;

    for (const threat of this.threats) {
      // Movement AI
      if (threat.patrol === 'sweep' || threat.patrol === 'intercept') {
        const wp = threat.waypoints[threat.waypointIndex];
        const dx = wp.x - threat.x;
        const dy = wp.y - threat.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 15) {
          threat.waypointIndex = (threat.waypointIndex + 1) % threat.waypoints.length;
        }
        let targetDx = dx / (dist + 1);
        let targetDy = dy / (dist + 1);

        // Hunters chase atlas when alerted
        if (threat.patrol === 'intercept' && threat.alerted) {
          const adx = atlas.x - threat.x;
          const ady = atlas.y - threat.y;
          const adist = Math.sqrt(adx * adx + ady * ady);
          targetDx = adx / (adist + 1);
          targetDy = ady / (adist + 1);
        }

        threat.vx += targetDx * threat.speed * dt * 3;
        threat.vy += targetDy * threat.speed * dt * 3;
        const curSpeed = Math.sqrt(threat.vx ** 2 + threat.vy ** 2);
        if (curSpeed > threat.speed) {
          threat.vx = (threat.vx / curSpeed) * threat.speed;
          threat.vy = (threat.vy / curSpeed) * threat.speed;
        }
      } else if (threat.patrol === 'orbit') {
        threat.orbitAngle += 0.008;
        threat.x = threat.orbitCenter.x + Math.cos(threat.orbitAngle) * threat.orbitRadius;
        threat.y = threat.orbitCenter.y + Math.sin(threat.orbitAngle) * threat.orbitRadius;
        threat.vx = 0; threat.vy = 0;
      } else if (threat.patrol === 'stationary') {
        threat.vx = 0; threat.vy = 0;
      }

      if (threat.patrol !== 'orbit' && threat.patrol !== 'stationary') {
        threat.x += threat.vx;
        threat.y += threat.vy;
        // Bounce off edges
        if (threat.x < 30 || threat.x > this.worldWidth - 30) { threat.vx *= -1; threat.x = Math.max(30, Math.min(this.worldWidth - 30, threat.x)); }
        if (threat.y < 30 || threat.y > this.worldHeight - 30) { threat.vy *= -1; threat.y = Math.max(30, Math.min(this.worldHeight - 30, threat.y)); }
      }

      // Scan rotation
      threat.scanAngle += threat.scanSpeed;

      // Detection check
      const dx = atlas.x - threat.x;
      const dy = atlas.y - threat.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const memBuild = this.difficulty.id === 'easy' ? 0.75 : this.difficulty.id === 'hard' ? 2.1 : 2.5;
      const memDecay = this.difficulty.id === 'easy' ? 2.4 : this.difficulty.id === 'hard' ? 0.7 : 0.8;
      const memDecayOob = this.difficulty.id === 'easy' ? 1.8 : this.difficulty.id === 'hard' ? 0.45 : 0.5;
      const alertThresh = this.difficulty.id === 'easy' ? 3.2 : this.difficulty.id === 'hard' ? 1.35 : 1.5;

      if (dist < threat.scanRadius) {
        const angleToAtlas = Math.atan2(dy, dx);
        const angleDiff = Math.abs(((angleToAtlas - threat.scanAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        const inArc = threat.scanArc >= Math.PI * 1.9 || angleDiff < threat.scanArc / 2;

        let detected = inArc;
        if (detected && this._lineHitsBody(threat.x, threat.y, atlas.x, atlas.y)) detected = false;
        // Gas countermeasures
        if (this.gasActive === 'ammonia' && threat.detects.includes('radar')) detected = false;
        if (this.gasActive === 'methane' && threat.detects.includes('visual')) detected = false;
        if (this.gasActive === 'xenon' && threat.detects.includes('heat')) detected = false;
        if (this.atlas.mythActive) detected = false;

        // Memory buildup/decay scaled by difficulty
        if (detected) {
          threat.memory = Math.min(threat.memory + dt * memBuild, 5);
          threat.alertTimer = 1.5;
          if (threat.memory > alertThresh) {
            threat.alerted = true;
            anyAlerted = true;
          }
        } else {
          threat.memory = Math.max(0, threat.memory - dt * memDecay);
          if (threat.memory === 0) threat.alerted = false;
        }
      } else {
        threat.memory = Math.max(0, threat.memory - dt * memDecayOob);
        if (threat.memory === 0) threat.alerted = false;
      }

      if (threat.alertTimer > 0) threat.alertTimer -= dt;
    }

    // Alert spreading between nearby hunters
    if (anyAlerted) {
      for (const t1 of this.threats) {
        if (!t1.alerted) continue;
        for (const t2 of this.threats) {
          if (t2 === t1 || t2.alerted) continue;
          const dx = t1.x - t2.x;
          const dy = t1.y - t2.y;
          const spreadR = this.difficulty.id === 'easy' ? PHYSICS.ALERT_SPREAD_RADIUS * 0.3
                       : this.difficulty.id === 'hard' ? PHYSICS.ALERT_SPREAD_RADIUS * 0.95
                       : PHYSICS.ALERT_SPREAD_RADIUS;
          if (Math.sqrt(dx * dx + dy * dy) < spreadR) {
            t2.alerted = true;
            t2.alertTimer = 2;
          }
        }
      }
    }
  }

  _updateGas(dt) {
    if (this.gasTimer > 0) {
      this.gasTimer -= dt;
      if (this.gasTimer <= 0) {
        this.gasTimer = 0;
        const prev = this.gasActive;
        this.gasActive = null;
        this.gasCooldowns[prev] = { methane: 12, ammonia: 15, xenon: 10 }[prev];
        if (this.onGasChange) this.onGasChange(null, this.gasCooldowns, this.gasCharges);
      }
    }
    for (const g of Object.keys(this.gasCooldowns)) {
      if (this.gasCooldowns[g] > 0) this.gasCooldowns[g] = Math.max(0, this.gasCooldowns[g] - dt);
    }

    // Gas particles
    if (this.gasActive) {
      const col = { methane: [68, 255, 170], ammonia: [255, 204, 68], xenon: [204, 102, 255] }[this.gasActive];
      for (let i = 0; i < 4; i++) {
        const spd = Math.sqrt(this.atlas.vx ** 2 + this.atlas.vy ** 2);
        this.gasParticles.push({
          x: this.atlas.x + (Math.random() - 0.5) * 14,
          y: this.atlas.y + (Math.random() - 0.5) * 14,
          vx: -this.atlas.vx * 0.5 + (Math.random() - 0.5) * 1.2,
          vy: -this.atlas.vy * 0.5 + (Math.random() - 0.5) * 1.2,
          life: 1, r: Math.random() * 5 + 2,
          col: `rgba(${col[0]},${col[1]},${col[2]},`,
        });
      }
    }
  }

  _updateMyth(dt) {
    if (this.mythCooldown > 0) this.mythCooldown = Math.max(0, this.mythCooldown - dt);
    if (this.atlas.mythActive) {
      this.mythTimer -= dt;
      if (this.mythTimer <= 0) { this.atlas.mythActive = false; this.mythCooldown = 20; }
    }
  }

  _updateDetection(dt) {
    const before = this.detection;
    let rate = 0;
    const vel = Math.sqrt(this.atlas.vx ** 2 + this.atlas.vy ** 2);
    const speedRatio = vel / (PHYSICS.BURST_SPEED * 0.5);
    rate += speedRatio * PHYSICS.SPEED_DETECTION_MULTIPLIER;

    this.inShadow = this.threats.some((threat) => {
      const dist = Math.hypot(this.atlas.x - threat.x, this.atlas.y - threat.y);
      return dist < threat.scanRadius && this._lineHitsBody(threat.x, threat.y, this.atlas.x, this.atlas.y);
    });

    for (const threat of this.threats) {
      if (threat.alerted) {
        const dx = this.atlas.x - threat.x;
        const dy = this.atlas.y - threat.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const prox = Math.max(0, 1 - dist / (threat.scanRadius * 1.5));
        rate += prox * PHYSICS.PROXIMITY_DETECTION_MULTIPLIER * 1.8;
      } else if (threat.alertTimer > 0) {
        const dx = this.atlas.x - threat.x;
        const dy = this.atlas.y - threat.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < threat.scanRadius) {
          const prox = 1 - dist / threat.scanRadius;
          rate += prox * PHYSICS.PROXIMITY_DETECTION_MULTIPLIER;
        }
      }
    }

    if (this.gasActive === 'methane') rate *= 0.15;
    if (this.atlas.mythActive) rate = 0;
    if (this.inShadow) rate *= 0.2;

    // Level + difficulty multiplier
    const levelScale = this.difficulty.id === 'easy' ? (1 + this.levelId * 0.08)
                     : this.difficulty.id === 'hard' ? (1 + this.levelId * 0.18)
                     : (1 + this.levelId * 0.35);
    const diffMult = levelScale * this.difficulty.detectionMult;
    let decayBonus = this.difficulty.id === 'easy' ? 0.16 : this.difficulty.id === 'hard' ? 0.05 : 0.08;
    if (this.difficulty.id === 'hard') {
      if (speedRatio < 0.32) decayBonus += 0.14;
      if (speedRatio > 1.05) rate *= 1.55;
    }
    const delta = (rate * diffMult - (PHYSICS.DETECTION_DECAY + decayBonus)) * dt * 18;
    this.detection = Math.max(0, Math.min(100, this.detection + delta));
    const spike = this.detection - before;
    if (spike > 2.2) this.screenShake = Math.min(1, this.screenShake + spike / 12);
    this.prevDetection = this.detection;

    if (this.onDetectionChange) this.onDetectionChange(this.detection);
  }

  _updateCombo(dt) {
    if (this.gameOver || this.levelComplete) return;
    if (this.detection < 5) {
      this.stealthCombo += dt;
      this.comboTimer = 2.5;
      const tier = Math.min(5, Math.floor(this.stealthCombo / 4));
      this.comboMultiplier = 1 + tier * 0.25;
    } else if (this.detection > 15) {
      this.stealthCombo = 0;
      this.comboMultiplier = 1;
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.onComboChange) this.onComboChange(this.comboMultiplier, this.stealthCombo);
    }
  }

  _updateCollectibles(t) {
    for (const orb of this.collectibles) {
      if (orb.collected) continue;
      orb.pulse += 0.06;
      const dx = this.atlas.x - orb.x;
      const dy = this.atlas.y - orb.y;
      if (Math.sqrt(dx * dx + dy * dy) < orb.radius + 12) {
        orb.collected = true;
        const bonus = Math.round(orb.value * this.comboMultiplier);
        this.score += bonus;
        this.detection = Math.max(0, this.detection - 1.5);
        if (this.onScoreChange) this.onScoreChange(this.score);
        if (this.onDetectionChange) this.onDetectionChange(this.detection);
      }
    }
  }

  _updateObjectives(t) {
    for (const obj of this.objectives) {
      if (obj.done) continue;
      obj.pulseT += 0.04;
      const dx = this.atlas.x - obj.x;
      const dy = this.atlas.y - obj.y;
      if (Math.sqrt(dx * dx + dy * dy) < obj.radius + 8) {
        obj.done = true;
        this.score += 1000;
        const comboBonus = Math.round(500 * this.comboMultiplier);
        this.score += comboBonus;
        if (this.onObjectiveUpdate) this.onObjectiveUpdate(this.objectives);
        if (this.onScoreChange) this.onScoreChange(this.score);
      }
    }
  }

  _updateParticles(dt) {
    this.gasParticles = this.gasParticles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life -= dt * 0.7;
      return p.life > 0;
    });
    this.dustParticles = this.dustParticles.filter(p => {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.97; p.vy *= 0.97;
      p.life -= dt * 0.5;
      return p.life > 0;
    });
  }

  _checkWinLose() {
    if (this.detection >= 100 && !this.gameOver && !this.levelComplete) {
      this.gameOver = true;
      if (this.onGameOver) this.onGameOver('detected');
      return;
    }
    if (this.gameOver || this.levelComplete) return;

    // Win: reach the gravitational anchor destination
    const dest = this.destination;
    if (this.difficulty.id === 'hard' && this.objectives.some((o) => !o.done)) return;
    const dx = dest.x - this.atlas.x;
    const dy = dest.y - this.atlas.y;
    if (Math.sqrt(dx * dx + dy * dy) < dest.captureRadius) {
      this.levelComplete = true;
      const stealthBonus = Math.round((1 - this.detection / 100) * 5000);
      const comboBonus = Math.round(this.stealthCombo * 40 * this.comboMultiplier);
      this.score += stealthBonus + comboBonus;
      if (this.onScoreChange) this.onScoreChange(this.score);
      if (this.onLevelComplete) this.onLevelComplete(this.score, this.detection);
    }
  }

  // ─── CONTROLS ──────────────────────────────────────────────────────────────

  activateGas(gasId) {
    if (this.gasCharges[gasId] <= 0) return;
    if (this.gasCooldowns[gasId] > 0) return;
    if (this.gasActive === gasId) {
      this.gasActive = null; this.gasTimer = 0;
      if (this.onGasChange) this.onGasChange(null, this.gasCooldowns, this.gasCharges);
      return;
    }
    this.gasActive = gasId;
    this.gasCharges[gasId]--;
    const durations = { methane: 6, ammonia: 5, xenon: 8 };
    this.gasTimer = durations[gasId];
    if (this.onGasChange) this.onGasChange(gasId, this.gasCooldowns, this.gasCharges);
  }

  activateEye(eyeId) {
    this.atlas.eyeMode = this.atlas.eyeMode === eyeId ? null : eyeId;
    if (eyeId === 'myth' && !this.atlas.mythActive && this.mythCooldown <= 0) {
      this.atlas.mythActive = true; this.mythTimer = 7;
    }
  }

  setSpeed(type) {
    if (type === 'burst') { this.keys['Shift'] = true; setTimeout(() => { this.keys['Shift'] = false; }, 400); }
    else if (type === 'slow') this.atlas.speed = PHYSICS.MIN_SPEED;
  }

  setJoystick(data) { this.joystick = { ...this.joystick, ...data }; }
  handleKey(key, down) { this.keys[key] = down; }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  _render(t) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const shakeX = (Math.random() - 0.5) * 12 * this.screenShake;
    const shakeY = (Math.random() - 0.5) * 12 * this.screenShake;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.fillStyle = this.level.bgColor;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    this._drawNebula(ctx, W, H, t);
    this._drawStars(ctx, t);

    // World-space layer — camera pans horizontally across the level
    ctx.save();
    ctx.translate(-this.camera.x, 0);
    this._drawGravityWells(ctx, t);
    this._drawThreats(ctx, t);
    this._drawCollectibles(ctx, t);
    this._drawStealthObjectives(ctx, t);
    this._drawGasParticles(ctx);
    this._drawDustParticles(ctx);
    this._drawCometTail(ctx, t);
    this._drawComet(ctx, t);
    this._drawDestination(ctx, t);
    ctx.restore();

    // Screen-space vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.82);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,8,0.60)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    this._drawLensFlares(ctx, W, H, t);

    // Eye mode overlays
    if (this.atlas.eyeMode === 'night') {
      ctx.fillStyle = 'rgba(0,30,0,0.25)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.atlas.eyeMode === 'heat') {
      ctx.fillStyle = 'rgba(30,5,0,0.25)';
      ctx.fillRect(0, 0, W, H);
    }
    if (this.atlas.mythActive) {
      ctx.fillStyle = 'rgba(15,0,35,0.35)';
      ctx.fillRect(0, 0, W, H);
      const vig = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.9);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(80,0,120,0.3)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // ── SCANLINE OVERLAY ─────────────────────────────────────────────────────
    ctx.save();
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, y, W, 1);
    }
    ctx.restore();

    // ── DETECTION PULSE (red vignette above 60%) ──────────────────────────────
    if (this.detection > 60) {
      const intensity = ((this.detection - 60) / 40) * 0.45;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.015 + (this.detection * 0.1));
      ctx.save();
      const redVig = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.85);
      redVig.addColorStop(0, 'transparent');
      redVig.addColorStop(1, `rgba(220,20,20,${intensity * pulse})`);
      ctx.fillStyle = redVig;
      ctx.fillRect(0, 0, W, H);
      // Also flash the edge
      ctx.strokeStyle = `rgba(255,40,40,${intensity * 0.6})`;
      ctx.lineWidth = 6 + pulse * 4;
      ctx.strokeRect(0, 0, W, H);
      ctx.restore();
    }

    // ── LEVEL FLASH ───────────────────────────────────────────────────────────
    if (this.levelFlash > 0) {
      const frac = this.levelFlash / 1.8;
      // White burst at start, then fade to level text
      if (frac > 0.75) {
        const wAlpha = ((frac - 0.75) / 0.25);
        ctx.save();
        ctx.fillStyle = `rgba(255,255,255,${wAlpha * 0.7})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      // Level name text fades in/out
      if (frac < 0.85) {
        const tAlpha = Math.min(1, (0.85 - frac) / 0.5) * Math.min(1, frac / 0.1);
        ctx.save();
        ctx.globalAlpha = tAlpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.shadowColor = 'rgba(160,100,255,1)';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`LEVEL ${this.levelId + 1}`, W / 2, H / 2 - 18);
        ctx.font = '14px Orbitron, monospace';
        ctx.fillStyle = 'rgba(200,180,255,0.9)';
        ctx.shadowBlur = 12;
        ctx.fillText(this.level.name.toUpperCase(), W / 2, H / 2 + 20);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
  }

  _drawNebula(ctx, W, H, t) {
    // Draw AI background image if loaded
    const bgImg = GameEngine.BG_IMGS && GameEngine.BG_IMGS[Math.min(this.levelId, 6)];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.globalAlpha = 0.35;
      ctx.drawImage(bgImg, 0, 0, W, H);
      ctx.globalAlpha = 1.0;
    }
    // Original nebula dust on top
    for (const d of this.nebulaDust) {
      const nx = d.x + Math.sin(t * 0.00012 + d.phase) * d.drift * 18;
      const ny = d.y + Math.cos(t * 0.00008 + d.phase) * d.drift * 12;
      const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, d.r);
      const levelGlow = this.level.nebulaColor.replace('0.', `${Math.min(0.12, d.opacity)}`);
      g.addColorStop(0, levelGlow);
      g.addColorStop(0.45, this.level.nebulaColor);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(nx, ny, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawStars(ctx, t) {
    const W = this.canvas.width, H = this.canvas.height;
    const px = (this.atlas.x / W - 0.5);
    const py = (this.atlas.y / H - 0.5);
    const nightMode = this.atlas.eyeMode === 'night';

    for (const s of this.stars) {
      const flicker = 0.55 + 0.45 * Math.sin(t * s.twinkle * 0.001 + s.phase);
      const alpha = Math.min(0.98, s.opacity * flicker * (nightMode ? 1.8 : 1));
      const r = s.r * (nightMode ? 1.5 : 1);

      const sx = ((s.ox - px * s.parallax * W) + W * 2) % W;
      const sy = ((s.oy - py * s.parallax * H) + H * 2) % H;

      // Glow halo for bright stars
      if (r > 1.0) {
        const haloG = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 5);
        const [hr, hg, hb] = s.color === '#ffd0a0' ? [255, 208, 160]
                           : s.color === '#a8c8ff' ? [168, 200, 255]
                           : s.color === '#ffe8ff' ? [255, 232, 255]
                           : [255, 255, 255];
        haloG.addColorStop(0, `rgba(${hr},${hg},${hb},${alpha * 0.35})`);
        haloG.addColorStop(1, 'transparent');
        ctx.fillStyle = haloG;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      if (s.color === '#ffd0a0') ctx.fillStyle = `rgba(255,208,160,${alpha})`;
      else if (s.color === '#a8c8ff') ctx.fillStyle = `rgba(168,200,255,${alpha})`;
      else if (s.color === '#ffe8ff') ctx.fillStyle = `rgba(255,232,255,${alpha})`;
      else ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();

      // 4-point sparkle cross for the brightest stars
      if (r > 1.8) {
        const spikeLen = r * 7;
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.45})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(sx - spikeLen, sy); ctx.lineTo(sx + spikeLen, sy);
        ctx.moveTo(sx, sy - spikeLen); ctx.lineTo(sx, sy + spikeLen);
        ctx.stroke();
        // Diagonal spikes (dimmer)
        const dLen = spikeLen * 0.55;
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(sx - dLen, sy - dLen); ctx.lineTo(sx + dLen, sy + dLen);
        ctx.moveTo(sx + dLen, sy - dLen); ctx.lineTo(sx - dLen, sy + dLen);
        ctx.stroke();
      } else if (r > 1.0) {
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(sx - r * 4, sy); ctx.lineTo(sx + r * 4, sy);
        ctx.moveTo(sx, sy - r * 4); ctx.lineTo(sx, sy + r * 4);
        ctx.stroke();
      }
    }
  }

  _drawGravityWells(ctx, t) {
    for (const gw of this.gravityWells) {
      const def = gw.def;
      gw.angle += 0.003;
      const col = def.color;
      const R = gw.radius;

      // Is Atlas inside this well's influence?
      const dxA = gw.x - this.atlas.x, dyA = gw.y - this.atlas.y;
      const distA = Math.sqrt(dxA * dxA + dyA * dyA);
      const inInfluence = distA < gw.influenceRadius;

      ctx.save();
      ctx.translate(gw.x, gw.y);

      // Influence zone ring
      ctx.beginPath();
      ctx.arc(0, 0, gw.influenceRadius, 0, Math.PI * 2);
      ctx.strokeStyle = inInfluence ? col + '55' : col + '1a';
      ctx.lineWidth = inInfluence ? 1.5 : 1;
      ctx.setLineDash([8, 12]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Gravity pull lines when inside influence zone
      if (inInfluence && !gw.isSun) {
        const pullAlpha = Math.max(0, 1 - distA / gw.influenceRadius);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + t * 0.001;
          const x1 = Math.cos(angle) * gw.influenceRadius * 0.92;
          const y1 = Math.sin(angle) * gw.influenceRadius * 0.92;
          const x2 = Math.cos(angle) * (R + 6);
          const y2 = Math.sin(angle) * (R + 6);
          const lg = ctx.createLinearGradient(x1, y1, x2, y2);
          lg.addColorStop(0, 'transparent');
          lg.addColorStop(1, col + Math.floor(pullAlpha * 90).toString(16).padStart(2, '0'));
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.strokeStyle = lg; ctx.lineWidth = 0.9; ctx.stroke();
        }
      }

      // Atmosphere glow
      const atmR = R * 1.8;
      const atm = ctx.createRadialGradient(0, 0, R * 0.8, 0, 0, atmR);
      atm.addColorStop(0, col + '44');
      atm.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(0, 0, atmR, 0, Math.PI * 2);
      ctx.fillStyle = atm;
      ctx.fill();

      // Planet body
      const pg = ctx.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.05, 0, 0, R * 1.05);
      pg.addColorStop(0, '#ffffff99');
      pg.addColorStop(0.12, col + 'ee');
      pg.addColorStop(0.6, col + 'cc');
      pg.addColorStop(1, col + '44');
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fillStyle = pg;
      ctx.shadowColor = col;
      ctx.shadowBlur = 25;
      ctx.fill();

      // Sun: special golden glow
      if (def.type === 'sun') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.clip();
        // Coronal flares
        for (let f = 0; f < 8; f++) {
          const fa = (f / 8) * Math.PI * 2 + gw.angle * 0.5;
          const fLen = R * (0.4 + 0.3 * Math.sin(gw.angle * 2 + f));
          ctx.beginPath();
          ctx.ellipse(Math.cos(fa) * R * 0.7, Math.sin(fa) * R * 0.7, R * 0.18, fLen * 0.35, fa, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,200,50,0.25)';
          ctx.fill();
        }
        ctx.restore();
        // Extra corona pulse
        const coronaG = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 3.5);
        coronaG.addColorStop(0, 'rgba(255,220,80,0.35)');
        coronaG.addColorStop(0.4, 'rgba(255,160,20,0.12)');
        coronaG.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(0, 0, R * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = coronaG; ctx.fill();
      }

      // Jupiter: cloud bands + Great Red Spot
      if (def.type === 'bands') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.clip();
        const bandColors = ['rgba(200,170,120,0.35)', 'rgba(160,100,60,0.25)', 'rgba(210,185,140,0.3)', 'rgba(140,90,50,0.2)'];
        for (let b = 0; b < 7; b++) {
          const by = -R + (b / 6) * R * 2;
          ctx.beginPath();
          ctx.ellipse(0, by, R, R * 0.14, gw.angle * 0.15, 0, Math.PI * 2);
          ctx.fillStyle = bandColors[b % bandColors.length];
          ctx.fill();
        }
        // Great Red Spot
        ctx.beginPath();
        ctx.ellipse(R * 0.25, R * 0.2, R * 0.22, R * 0.13, gw.angle * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,60,30,0.55)';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(R * 0.25, R * 0.2, R * 0.14, R * 0.08, gw.angle * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220,100,60,0.4)';
        ctx.fill();
        ctx.restore();
      }

      // Earth: blue ocean + green landmass blobs
      if (def.type === 'earth') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.clip();
        const landBlobs = [
          { x: -R*0.2, y: -R*0.1, rx: R*0.3, ry: R*0.2, a: 0.3 },
          { x: R*0.15, y: R*0.15, rx: R*0.2, ry: R*0.25, a: 0.25 },
          { x: -R*0.1, y: R*0.2, rx: R*0.15, ry: R*0.1, a: 0.2 },
        ];
        for (const lb of landBlobs) {
          ctx.beginPath();
          ctx.ellipse(lb.x, lb.y, lb.rx, lb.ry, gw.angle * 0.05, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(60,140,60,${lb.a})`;
          ctx.fill();
        }
        // Cloud wisps
        for (let c = 0; c < 4; c++) {
          const cx = Math.cos(gw.angle * 0.2 + c * 1.5) * R * 0.5;
          const cy = Math.sin(gw.angle * 0.1 + c * 1.1) * R * 0.4;
          ctx.beginPath();
          ctx.ellipse(cx, cy, R * 0.3, R * 0.08, c * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fill();
        }
        ctx.restore();
      }

      // Mars: dust + polar cap
      if (def.type === 'dusty') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.clip();
        for (let d = 0; d < 3; d++) {
          ctx.beginPath();
          ctx.ellipse(
            Math.cos(gw.angle + d * 2.1) * R * 0.3,
            Math.sin(gw.angle * 0.7 + d * 1.8) * R * 0.3,
            R * 0.25, R * 0.1, d * 0.7, 0, Math.PI * 2
          );
          ctx.fillStyle = 'rgba(180,100,50,0.2)';
          ctx.fill();
        }
        // Polar ice cap
        ctx.beginPath();
        ctx.ellipse(0, -R * 0.78, R * 0.35, R * 0.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240,240,255,0.45)';
        ctx.fill();
        ctx.restore();
      }

      // Venus: thick swirling clouds
      if (def.type === 'cloudy') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.clip();
        for (let c = 0; c < 5; c++) {
          ctx.beginPath();
          ctx.ellipse(
            Math.cos(gw.angle * 1.2 + c * 1.25) * R * 0.2,
            (c - 2) * R * 0.28,
            R * 0.85, R * 0.12, gw.angle * 0.3 + c * 0.4, 0, Math.PI * 2
          );
          ctx.fillStyle = `rgba(230,210,140,${0.15 + c * 0.03})`;
          ctx.fill();
        }
        ctx.restore();
      }

      // Neptune/Uranus: dark storms
      if (def.type === 'stormy' || def.type === 'icy') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.clip();
        ctx.beginPath();
        ctx.ellipse(-R * 0.2, -R * 0.15, R * 0.28, R * 0.18, gw.angle * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10,20,80,0.5)';
        ctx.fill();
        ctx.restore();
      }

      // Mercury: scorched craters
      if (def.type === 'scorched') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.clip();
        const craters = [{ x: -R*0.3, y: -R*0.2, r: R*0.18 }, { x: R*0.2, y: R*0.25, r: R*0.12 }, { x: -R*0.1, y: R*0.3, r: R*0.1 }];
        for (const cr of craters) {
          ctx.beginPath();
          ctx.arc(cr.x, cr.y, cr.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cr.x - cr.r*0.2, cr.y - cr.r*0.2, cr.r*0.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,200,100,0.12)';
          ctx.fill();
        }
        ctx.restore();
      }

      // Icy surface (Uranus/Neptune icy type handled above, this is the standalone icy)
      if (def.type === 'icy_extra') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.clip();
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc((Math.random()-0.5)*R*0.8, (Math.random()-0.5)*R*0.8, R*0.15, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(200,230,255,0.2)';
          ctx.fill();
        }
        ctx.restore();
      }

      // Saturn-style rings (use def.ringCount for actual ring count)
      for (let r = 0; r < def.ringCount; r++) {
        const rr = R * (1.8 + r * 0.7);
        ctx.beginPath();
        ctx.ellipse(0, 0, rr, rr * 0.3, gw.angle * 0.25, 0, Math.PI * 2);
        ctx.strokeStyle = col + (r === 0 ? '66' : '33');
        ctx.lineWidth = 3 - r * 0.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, rr * 0.88, rr * 0.88 * 0.3, gw.angle * 0.25, 0, Math.PI * 2);
        ctx.strokeStyle = col + '22';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();

      // Planet label
      ctx.fillStyle = inInfluence ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
      ctx.font = `bold ${inInfluence ? 10 : 9}px Orbitron, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(def.name.toUpperCase(), gw.x, gw.y + R + 14);
      if (inInfluence && !gw.isSun) {
        ctx.fillStyle = 'rgba(100,210,255,0.75)';
        ctx.font = '8px Orbitron, monospace';
        ctx.fillText('GRAVITY ASSIST', gw.x, gw.y + R + 24);
      }
    }

    // Predicted trajectory dots (only near gravity wells)
    this._drawTrajectoryPreview(ctx, t);
  }

  _drawTrajectoryPreview(ctx, t) {
    let px = this.atlas.x, py = this.atlas.y;
    let pvx = this.atlas.vx, pvy = this.atlas.vy;
    const steps = 55;
    const stepDt = 0.04;
    ctx.save();
    for (let s = 0; s < steps; s++) {
      for (const gw of this.gravityWells) {
        const dx = gw.x - px, dy = gw.y - py;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        if (dist < gw.radius + 4) { s = steps; break; }
        if (dist < gw.influenceRadius) {
          const force = (PHYSICS.GRAVITY_CONSTANT * gw.strength) / distSq;
          pvx += (dx / dist) * force * stepDt;
          pvy += (dy / dist) * force * stepDt;
        }
      }
      pvx *= 0.97; pvy *= 0.97;
      px += pvx; py += pvy;

      // Only render dots when near a well
      let nearWell = false;
      for (const gw of this.gravityWells) {
        if (Math.sqrt((gw.x - px) ** 2 + (gw.y - py) ** 2) < gw.influenceRadius) { nearWell = true; break; }
      }
      if (!nearWell) continue;

      const frac = 1 - s / steps;
      const pulse = 0.4 + 0.3 * Math.sin(t * 0.01 - s * 0.18);
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,210,255,${frac * pulse * 0.65})`;
      ctx.fill();
    }
    ctx.restore();
  }

  _drawThreats(ctx, t) {
    const threatLabels = {
      probe: 'PROBE',
      satellite: 'SAT',
      hunter: 'HUNTER',
      deepSpace: 'DEEP SCAN',
      relay: 'RELAY',
    };

    for (const threat of this.threats) {
      const col = threat.color;
      const alertPulse = threat.alertTimer > 0 ? (Math.sin(t * 0.02) * 0.5 + 0.5) : 0;

      ctx.save();
      ctx.translate(threat.x, threat.y);

      // Scan cone / area
      if (threat.scanArc < Math.PI * 1.9) {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, threat.scanRadius);
        g.addColorStop(0, col + (threat.alerted ? '77' : '33'));
        g.addColorStop(0.5, col + (threat.alerted ? '33' : '14'));
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, threat.scanRadius, threat.scanAngle - threat.scanArc / 2, threat.scanAngle + threat.scanArc / 2);
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();
        // Bright beam edges
        ctx.shadowColor = col;
        ctx.shadowBlur = threat.alerted ? 28 : 12;
        ctx.strokeStyle = threat.alerted ? col + 'ee' : col + '77';
        ctx.lineWidth = threat.alerted ? 2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(threat.scanAngle - threat.scanArc / 2) * threat.scanRadius, Math.sin(threat.scanAngle - threat.scanArc / 2) * threat.scanRadius);
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(threat.scanAngle + threat.scanArc / 2) * threat.scanRadius, Math.sin(threat.scanAngle + threat.scanArc / 2) * threat.scanRadius);
        ctx.stroke();
        // Sweep line inside cone
        ctx.strokeStyle = col + (threat.alerted ? 'aa' : '44');
        ctx.lineWidth = 0.8;
        ctx.shadowBlur = threat.alerted ? 14 : 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(threat.scanAngle) * threat.scanRadius * 0.85, Math.sin(threat.scanAngle) * threat.scanRadius * 0.85);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, threat.scanRadius, 0, Math.PI * 2);
        ctx.strokeStyle = col + '44';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // Outer ring glow
        ctx.beginPath();
        ctx.arc(0, 0, threat.scanRadius, 0, Math.PI * 2);
        ctx.strokeStyle = col + '22';
        ctx.lineWidth = 5;
        ctx.shadowColor = col;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
        const sweepAngle = t * 0.012;
        ctx.shadowColor = col;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sweepAngle) * threat.scanRadius, Math.sin(sweepAngle) * threat.scanRadius);
        ctx.strokeStyle = col + 'aa';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.shadowColor = col;
      ctx.shadowBlur = threat.alerted ? 20 + alertPulse * 12 : 6;

      if (threat.type === 'probe') {
        ctx.save();
        ctx.rotate(threat.scanAngle);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = Math.cos(a) * (threat.size + 1);
          const py = Math.sin(a) * (threat.size + 1);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = threat.alerted ? '#ff4444' : '#445566';
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -(threat.size + 1));
        ctx.lineTo(0, -(threat.size + 6));
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -(threat.size + 6), 2, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        const tg = ctx.createRadialGradient(0, threat.size + 3, 0, 0, threat.size + 3, 5);
        tg.addColorStop(0, 'rgba(100,200,255,0.8)');
        tg.addColorStop(1, 'transparent');
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.arc(0, threat.size + 3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (threat.type === 'satellite') {
        ctx.save();
        ctx.rotate(threat.scanAngle);
        ctx.fillStyle = threat.alerted ? '#cc3333' : '#667788';
        ctx.fillRect(-6, -4, 12, 8);
        ctx.strokeStyle = col;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-6, -4, 12, 8);
        const panelColors = [['rgba(30,80,180,0.9)', 'rgba(20,60,140,0.7)'], ['rgba(30,80,180,0.9)', 'rgba(20,60,140,0.7)']];
        for (let s = 0; s < 2; s++) {
          const px = s === 0 ? -18 : 8;
          ctx.fillStyle = panelColors[s][0];
          ctx.fillRect(px, -5, 9, 10);
          ctx.strokeStyle = 'rgba(100,150,255,0.5)';
          ctx.lineWidth = 0.5;
          for (let g = 1; g < 3; g++) {
            ctx.beginPath();
            ctx.moveTo(px + g * 3, -5);
            ctx.lineTo(px + g * 3, 5);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(px, 0);
          ctx.lineTo(px + 9, 0);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, -7, 4, Math.PI, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(0, -11);
        ctx.stroke();
        ctx.restore();
      } else if (threat.type === 'hunter') {
        ctx.save();
        ctx.rotate(threat.scanAngle);
        ctx.beginPath();
        ctx.moveTo(threat.size + 4, 0);
        ctx.lineTo(-threat.size, threat.size * 0.65);
        ctx.lineTo(-threat.size * 0.4, 0);
        ctx.lineTo(-threat.size, -threat.size * 0.65);
        ctx.closePath();
        ctx.fillStyle = threat.alerted ? '#ff2222' : '#883322';
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.stroke();
        const eg = ctx.createRadialGradient(-threat.size - 2, 0, 0, -threat.size - 2, 0, 8);
        eg.addColorStop(0, 'rgba(255,160,60,0.9)');
        eg.addColorStop(0.5, 'rgba(255,80,20,0.4)');
        eg.addColorStop(1, 'transparent');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(-threat.size - 2, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        if (threat.alerted) {
          ctx.strokeStyle = `rgba(255,50,50,${0.5 + alertPulse * 0.5})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(0, 0, threat.size + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      } else if (threat.type === 'deepSpace') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, threat.size + 5, Math.PI, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-(threat.size + 5), 0);
        ctx.lineTo(0, threat.size + 5);
        ctx.lineTo(threat.size + 5, 0);
        ctx.strokeStyle = col + 'aa';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -(threat.size + 5), 3, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.shadowBlur = 12;
        ctx.fill();
        const pulseR = threat.size + 10 + Math.sin(t * 0.015) * 8;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = col + '33';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      } else if (threat.type === 'relay') {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const px = Math.cos(a) * (threat.size + 2);
          const py = Math.sin(a) * (threat.size + 2);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = threat.alerted ? '#552200' : '#223344';
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        const ringA = t * 0.01;
        ctx.beginPath();
        ctx.arc(0, 0, threat.size + 7, ringA, ringA + Math.PI * 1.6);
        ctx.strokeStyle = col + '88';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, threat.size, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }

      if (threat.alerted) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, threat.size + 8 + alertPulse * 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,60,60,${0.7 + alertPulse * 0.3})`;
        ctx.font = 'bold 7px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DETECTED', 0, -(threat.size + 14));
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255,255,255,0.3)`;
      ctx.font = '7px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(threatLabels[threat.type] || threat.type.toUpperCase(), 0, threat.size + 13);

      ctx.restore();
    }
  }

  _drawCollectibles(ctx, t) {
    for (const orb of this.collectibles) {
      if (orb.collected) continue;
      const pulse = 0.6 + 0.4 * Math.sin(orb.pulse + t * 0.003);
      ctx.save();
      ctx.translate(orb.x, orb.y);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, orb.radius * 2);
      grad.addColorStop(0, `rgba(180,255,220,${pulse * 0.9})`);
      grad.addColorStop(0.5, `rgba(100,200,255,${pulse * 0.4})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,255,255,${pulse})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#88ccff';
      ctx.fill();
      ctx.restore();
    }
  }

  _drawStealthObjectives(ctx, t) {
    for (const obj of this.objectives) {
      if (obj.done) continue;
      const pulse = 0.55 + 0.45 * Math.sin((obj.pulseT || 0) + t * 0.004);
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.strokeStyle = `rgba(160,120,255,${0.35 + pulse * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, obj.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, obj.radius);
      g.addColorStop(0, `rgba(180,140,255,${pulse * 0.55})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(220,200,255,${0.7 + pulse * 0.3})`;
      ctx.font = '8px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HIDE', 0, 3);
      ctx.restore();
    }
  }

  _drawGasParticles(ctx) {
    for (const p of this.gasParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.col + (p.life * 0.6).toFixed(2) + ')';
      ctx.fill();
    }
  }

  _drawDustParticles(ctx) {
    for (const p of this.dustParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      const gasDust = this.gasActive ? { methane: '200,255,200', ammonia: '255,230,150', xenon: '220,180,255' }[this.gasActive] : '220,230,255';
      ctx.fillStyle = `rgba(${gasDust},${p.life * 0.35})`;
      ctx.fill();
    }
  }

  _drawCometTail(ctx, t) {
    const a = this.atlas;
    const trail = a.trail;
    const vel = Math.sqrt(a.vx ** 2 + a.vy ** 2);
    const gasColors = { methane: '80,255,180', ammonia: '255,210,80', xenon: '200,140,255' };
    const isGas = !!this.gasActive;
    const dustColBase = isGas ? gasColors[this.gasActive] : '200,220,255';
    const spd = Math.max(vel, 0.5);
    const tailX = Math.abs(a.vx) + Math.abs(a.vy) < 0.2 ? -1 : -a.vx / spd;
    const tailY = Math.abs(a.vx) + Math.abs(a.vy) < 0.2 ? 0 : -a.vy / spd;
    const skinTrail = this.skin.trailColor;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.004);

    // ── GHOST TRAIL ───────────────────────────────────────────────────────────
    if (this.ghostTrail.length > 1) {
      ctx.save();
      for (let i = 0; i < this.ghostTrail.length; i++) {
        const g = this.ghostTrail[i];
        const frac = i / this.ghostTrail.length;
        const alpha = frac * 0.45;
        const r = frac * 20;
        const ghostG = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, r);
        ghostG.addColorStop(0, `rgba(${skinTrail},${alpha})`);
        ghostG.addColorStop(1, 'transparent');
        ctx.fillStyle = ghostG;
        ctx.beginPath();
        ctx.arc(g.x, g.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ── WIDE OUTER ION TAIL — speed-reactive length ───────────────────────────
    ctx.save();
    const ionLen = 120 + vel * 20;
    const ionParticles = 200;
    for (let i = 0; i < ionParticles; i++) {
      const frac = i / ionParticles;
      const wobble = Math.sin(frac * 14 + t * 0.008) * (frac * 3);
      const perpX2 = -tailY, perpY2 = tailX;
      const alpha = (1 - frac) * (0.9 - frac * 0.3);
      const px = a.x + tailX * ionLen * frac + perpX2 * wobble;
      const py = a.y + tailY * ionLen * frac + perpY2 * wobble;
      const r = Math.max(0.4, (1 - frac) * 3.5);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${skinTrail},${alpha})`;
      ctx.shadowColor = `rgba(${skinTrail},0.6)`;
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    // Bright glowing core streak
    const ionCoreGrad = ctx.createLinearGradient(a.x, a.y, a.x + tailX * ionLen * 0.5, a.y + tailY * ionLen * 0.5);
    ionCoreGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    ionCoreGrad.addColorStop(0.3, `rgba(${skinTrail},0.7)`);
    ionCoreGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x + tailX * ionLen * 0.5, a.y + tailY * ionLen * 0.5);
    ctx.strokeStyle = ionCoreGrad;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();

    // ── DUST TRAIL — path-following streaks ───────────────────────────────────
    if (trail.length >= 4) {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        const prog = i / trail.length;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `rgba(${dustColBase},${prog * 0.65})`;
        ctx.lineWidth = prog * 5;
        ctx.shadowColor = `rgba(${dustColBase},0.4)`;
        ctx.shadowBlur = prog * 6;
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── COMA — 3-layer halo ───────────────────────────────────────────────────
    ctx.save();
    const comaR = 38;
    // Outermost diffuse halo
    const comaOuter = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, comaR * 3);
    comaOuter.addColorStop(0, `rgba(${skinTrail},0.12)`);
    comaOuter.addColorStop(0.5, `rgba(${skinTrail},0.05)`);
    comaOuter.addColorStop(1, 'transparent');
    ctx.fillStyle = comaOuter;
    ctx.beginPath();
    ctx.arc(a.x, a.y, comaR * 3, 0, Math.PI * 2);
    ctx.fill();
    // Mid halo
    const comaMid = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, comaR * 1.6);
    comaMid.addColorStop(0, 'rgba(220,240,255,0.30)');
    comaMid.addColorStop(0.5, `rgba(${skinTrail},0.18)`);
    comaMid.addColorStop(1, 'transparent');
    ctx.fillStyle = comaMid;
    ctx.beginPath();
    ctx.arc(a.x, a.y, comaR * 1.6, 0, Math.PI * 2);
    ctx.fill();
    // Inner bright core halo
    const comaInner = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, comaR * 0.7);
    comaInner.addColorStop(0, `rgba(255,255,255,${0.55 + pulse * 0.15})`);
    comaInner.addColorStop(0.4, `rgba(${skinTrail},0.40)`);
    comaInner.addColorStop(1, 'transparent');
    ctx.fillStyle = comaInner;
    ctx.beginPath();
    ctx.arc(a.x, a.y, comaR * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawLensFlares(ctx, W, H, t) {
    const sunX = W * 0.08, sunY = H * 0.16;
    const flare = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 180);
    flare.addColorStop(0, 'rgba(255,245,220,0.40)');
    flare.addColorStop(0.15, 'rgba(255,230,180,0.22)');
    flare.addColorStop(0.5, 'rgba(255,200,120,0.08)');
    flare.addColorStop(1, 'transparent');
    ctx.fillStyle = flare;
    ctx.beginPath(); ctx.arc(sunX, sunY, 180, 0, Math.PI * 2); ctx.fill();
    const core = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 28);
    core.addColorStop(0, 'rgba(255,255,240,0.80)');
    core.addColorStop(0.4, 'rgba(255,240,180,0.45)');
    core.addColorStop(1, 'transparent');
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(sunX, sunY, 28, 0, Math.PI * 2); ctx.fill();
    for (let i = 1; i <= 6; i++) {
      const fx = sunX + (W * 0.5 - sunX) * (i / 6);
      const fy = sunY + (H * 0.5 - sunY) * (i / 6);
      ctx.beginPath();
      ctx.arc(fx, fy, 8 + i * 7 + Math.sin(t * 0.001 + i) * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,220,160,${0.08 - i * 0.01})`;
      ctx.fill();
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(255,240,200,0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const sa = (i / 8) * Math.PI * 2 + t * 0.0002;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(sa) * 10, sunY + Math.sin(sa) * 10);
      ctx.lineTo(sunX + Math.cos(sa) * (36 + Math.sin(t * 0.003 + i) * 8), sunY + Math.sin(sa) * (36 + Math.sin(t * 0.003 + i) * 8));
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawComet(ctx, t) {
    const { x, y, nucleusAngle } = this.atlas;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.004);
    const vel = Math.sqrt(this.atlas.vx ** 2 + this.atlas.vy ** 2);

    const skin = this.skin;
    // ── WIDE COMA / OUTER BLOOM ───────────────────────────────────────────────
    ctx.save();
    const comaG = ctx.createRadialGradient(x, y, 0, x, y, 72);
    comaG.addColorStop(0, `rgba(${skin.trailColor},0.38)`);
    comaG.addColorStop(0.3, `rgba(${skin.trailColor},0.18)`);
    comaG.addColorStop(0.65, `rgba(${skin.trailColor},0.07)`);
    comaG.addColorStop(1, 'transparent');
    ctx.fillStyle = comaG;
    ctx.beginPath();
    ctx.arc(x, y, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── SUBLIMATION JETS — 5 jets, speed-reactive ────────────────────────────
    ctx.save();
    ctx.translate(x, y);
    const vel2 = Math.sqrt(this.atlas.vx ** 2 + this.atlas.vy ** 2) || 0.01;
    const jetAngle = Math.atan2(-this.atlas.vy / vel2, -this.atlas.vx / vel2);
    const jetCount = 5;
    for (let j = 0; j < jetCount; j++) {
      const spread = (j - Math.floor(jetCount / 2)) * 0.28;
      const ja = jetAngle + spread;
      const jetLen = 28 + pulse * 14 + vel2 * 6;
      const jg = ctx.createLinearGradient(0, 0, Math.cos(ja) * jetLen, Math.sin(ja) * jetLen);
      jg.addColorStop(0, `rgba(255,220,100,${0.9 + pulse * 0.1})`);
      jg.addColorStop(0.25, `rgba(255,140,30,0.65)`);
      jg.addColorStop(0.6, `rgba(255,80,10,0.25)`);
      jg.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ja) * jetLen, Math.sin(ja) * jetLen);
      ctx.strokeStyle = jg;
      ctx.lineWidth = j === Math.floor(jetCount / 2) ? 3.5 : 1.8;
      ctx.shadowColor = 'rgba(255,180,50,1)';
      ctx.shadowBlur = 18;
      ctx.stroke();
    }
    ctx.restore();

    // ── NUCLEUS — rocky irregular shape ──────────────────────────────────────
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(nucleusAngle);

    const NR = 13; // bigger nucleus
    const pts = 14;
    const buildPath = () => {
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const ang = (i / pts) * Math.PI * 2;
        const lobe = 0.78 + 0.22 * Math.cos(ang * 2 + 0.5);
        const jitter = NR * lobe * (0.78 + 0.22 * Math.sin(i * 3.1 + 1.7));
        const px = Math.cos(ang) * jitter;
        const py = Math.sin(ang) * jitter * 0.70;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    buildPath();
    const nBody = ctx.createRadialGradient(-NR * 0.35, -NR * 0.35, 0, 0, 0, NR * 1.2);
    nBody.addColorStop(0, skin.nucleusLight);
    nBody.addColorStop(0.3, skin.coreColor);
    nBody.addColorStop(1, skin.id === 'dark_matter' || skin.id === 'void_reaper' ? '#000000' : skin.coreColor);
    ctx.fillStyle = nBody;
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = 28;
    ctx.fill();
    // Lit rim
    ctx.strokeStyle = skin.id === 'neon_ghost' ? '#00eeff' : `rgba(255,230,160,0.35)`;
    ctx.lineWidth = skin.id === 'neon_ghost' ? 2 : 1.2;
    ctx.shadowBlur = skin.id === 'neon_ghost' ? 16 : 6;
    ctx.stroke();

    // Surface detail: craters + highlight
    ctx.shadowBlur = 0;
    const craterDefs = [
      { cx: -3, cy: -3, r: 3.0 },
      { cx: 4,  cy: 2.5, r: 2.2 },
      { cx: -5, cy: 4,   r: 1.8 },
      { cx: 2,  cy: -5,  r: 1.4 },
    ];
    ctx.save();
    buildPath();
    ctx.clip();
    for (const cr of craterDefs) {
      ctx.beginPath();
      ctx.arc(cr.cx, cr.cy, cr.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.60)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cr.cx - cr.r * 0.3, cr.cy - cr.r * 0.3, cr.r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
    }
    // Specular highlight
    ctx.beginPath();
    ctx.arc(-NR * 0.28, -NR * 0.28, NR * 0.28, 0, Math.PI * 2);
    const spec = ctx.createRadialGradient(-NR*0.28, -NR*0.28, 0, -NR*0.28, -NR*0.28, NR*0.28);
    spec.addColorStop(0, 'rgba(255,255,255,0.32)');
    spec.addColorStop(1, 'transparent');
    ctx.fillStyle = spec;
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // ── BRIGHT INNER COMA GLOW ────────────────────────────────────────────────
    ctx.save();
    const innerComa = ctx.createRadialGradient(x, y, 0, x, y, 28);
    innerComa.addColorStop(0, `rgba(${skin.trailColor},${0.85 + pulse * 0.15})`);
    innerComa.addColorStop(0.3, `rgba(${skin.trailColor},0.45)`);
    innerComa.addColorStop(0.7, `rgba(${skin.trailColor},0.15)`);
    innerComa.addColorStop(1, 'transparent');
    ctx.fillStyle = innerComa;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── THREE EYES — glowing dots on nucleus when active ─────────────────────
    if (this.atlas.eyeMode) {
      const eyeColMap = { night: '0,255,80', heat: '255,80,0', myth: '180,80,255' };
      const eyeCol = eyeColMap[this.atlas.eyeMode] || '255,120,0';
      ctx.save();
      ctx.translate(x, y);
      const eyePositions = [
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 / 3,
        -Math.PI / 2 + Math.PI * 4 / 3,
      ];
      for (let i = 0; i < 3; i++) {
        const ex = Math.cos(eyePositions[i] + nucleusAngle) * 7;
        const ey = Math.sin(eyePositions[i] + nucleusAngle) * 5;
        const ep = 0.6 + 0.4 * Math.sin(t * 0.007 + i * 1.1);
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${eyeCol},${ep})`;
        ctx.shadowColor = `rgba(${eyeCol},1)`;
        ctx.shadowBlur = 10;
        ctx.fill();
      }
      ctx.restore();
    }

  }

  _drawDestination(ctx, t) {
    const dest = this.destination;
    const pulse = 0.5 + 0.5 * Math.sin(dest.pulseT);
    const R = dest.radius;

    ctx.save();
    ctx.translate(dest.x, dest.y);

    // Outer gravitational field rings (3 animated rings)
    for (let i = 0; i < 3; i++) {
      const ringR = R * (2.2 + i * 1.1) + Math.sin(t * 0.002 + i * 1.1) * 6;
      const alpha = (0.25 - i * 0.07) * (0.6 + pulse * 0.4);
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(80,220,255,${alpha})`;
      ctx.lineWidth = 1.2 - i * 0.3;
      ctx.setLineDash([6, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Rotating capture indicator arc
    const rotA = t * 0.004;
    ctx.beginPath();
    ctx.arc(0, 0, dest.captureRadius, rotA, rotA + Math.PI * 1.5);
    ctx.strokeStyle = `rgba(100,240,255,${0.4 + pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, dest.captureRadius, rotA + Math.PI, rotA + Math.PI * 2.5);
    ctx.strokeStyle = `rgba(180,120,255,${0.3 + pulse * 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glow halo
    const halo = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R * 2.5);
    halo.addColorStop(0, `rgba(80,210,255,${0.45 + pulse * 0.2})`);
    halo.addColorStop(0.5, `rgba(60,160,255,${0.18})`);
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, R * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core anchor body — bright crystalline sphere
    const core = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.05, 0, 0, R);
    core.addColorStop(0, 'rgba(255,255,255,0.95)');
    core.addColorStop(0.25, 'rgba(140,230,255,0.9)');
    core.addColorStop(0.7, 'rgba(60,140,255,0.7)');
    core.addColorStop(1, 'rgba(20,60,180,0.4)');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.shadowColor = 'rgba(80,200,255,1)';
    ctx.shadowBlur = 30 + pulse * 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner spinning diamond cross
    ctx.save();
    ctx.rotate(t * 0.003);
    ctx.strokeStyle = `rgba(200,240,255,${0.7 + pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(150,220,255,1)';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * R * 1.5, Math.sin(a) * R * 1.5);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();

    // Label
    ctx.fillStyle = `rgba(140,230,255,${0.7 + pulse * 0.3})`;
    ctx.font = 'bold 9px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DESTINATION', dest.x, dest.y + R + 16);
    ctx.fillStyle = `rgba(255,255,255,0.4)`;
    ctx.font = '8px Orbitron, monospace';
    ctx.fillText('SLINGSHOT IN', dest.x, dest.y + R + 26);

    // Arrow guide from Atlas toward destination
    const dx = dest.x - this.atlas.x, dy = dest.y - this.atlas.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);
    if (distToTarget > dest.captureRadius + 80) {
      const angle = Math.atan2(dy, dx);
      const arrowAlpha = 0.5 + pulse * 0.35;
      ctx.save();
      ctx.translate(this.atlas.x + Math.cos(angle) * 60, this.atlas.y + Math.sin(angle) * 60);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(80,220,255,${arrowAlpha})`;
      ctx.shadowColor = 'rgba(80,200,255,1)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-7, 6);
      ctx.lineTo(-7, -6);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.worldWidth = width * 3.5 * (this.difficulty.worldLengthMult || 1);
    this.worldHeight = height;
    this.camera.x = Math.max(0, Math.min(this.worldWidth - width, this.atlas.x - width / 2));
    this.stars = this._generateStars(500);
    this.nebulaDust = this._generateNebulaDust(80);
    this.gravityWells = this._generateGravityWells();
    this.destination = this._generateDestination();
    this.objectives = this._generateStealthObjectives();
    if (this.onObjectiveUpdate) this.onObjectiveUpdate(this.objectives);
  }
}