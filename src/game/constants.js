export const CRAFT = {
  oumuamua: {
    id: 'oumuamua',
    shortName: "'Oumuamua",
    designation: '1I/2017 U1',
    hudLabel: "1I / 'OUMUAMUA",
    actLabel: 'ACT I · RECON',
    trailColor: '196,154,118',
    coreColor: '#8a6848',
    glowColor: '#c4a07a',
    nucleusLight: '#c4a07a',
  },
  atlas: {
    id: 'atlas',
    shortName: '3I/ATLAS',
    designation: '3I/ATLAS',
    hudLabel: '3I / ATLAS',
    actLabel: 'ACT II · INFILTRATION',
    trailColor: '232,210,176',
    coreColor: '#6e6054',
    glowColor: '#c8b8a0',
    nucleusLight: '#c8c0b4',
    ionColor: '155,195,245',
    dustColor: '232,210,176',
  },
};

export function getCraft(level) {
  return CRAFT[level?.craft] || CRAFT.atlas;
}

export { CAMPAIGN_STAGES as LEVELS } from './campaign/stages.js';

export function isHandoffLevel(levelId) {
  return LEVELS[levelId]?.craft === 'oumuamua' && LEVELS[levelId + 1]?.craft === 'atlas';
}

// The full solar system layout used by the Solar Run mode
// Planets ordered outer → inner (comet flies left to right or right to left depending on layout)
export const SOLAR_SYSTEM_PLANETS = [
  {
    name: 'Neptune',
    color: '#2a4fc8',
    radius: 32,
    type: 'stormy',
    ringCount: 1,
    threatDensity: 2, // how many threats cluster near this planet
  },
  {
    name: 'Uranus',
    color: '#4db3c8',
    radius: 28,
    type: 'icy',
    ringCount: 2,
    threatDensity: 2,
  },
  {
    name: 'Saturn',
    color: '#c8b97a',
    radius: 36,
    type: 'ringed',
    ringCount: 4,
    threatDensity: 3,
  },
  {
    name: 'Jupiter',
    color: '#c8a97a',
    radius: 44,
    type: 'bands',
    ringCount: 1,
    threatDensity: 3,
  },
  {
    name: 'Mars',
    color: '#c1440e',
    radius: 18,
    type: 'dusty',
    ringCount: 0,
    threatDensity: 3,
  },
  {
    name: 'Earth',
    color: '#2a7fc1',
    radius: 20,
    type: 'earth',
    ringCount: 0,
    threatDensity: 4,
  },
  {
    name: 'Venus',
    color: '#e8c97a',
    radius: 19,
    type: 'cloudy',
    ringCount: 0,
    threatDensity: 3,
  },
  {
    name: 'Mercury',
    color: '#8a7a6a',
    radius: 12,
    type: 'scorched',
    ringCount: 0,
    threatDensity: 2,
  },
  {
    name: 'Sun',
    color: '#ffcc00',
    radius: 55,
    type: 'sun',
    ringCount: 0,
    threatDensity: 0,
    isSun: true, // reaching the Sun = win condition
  },
];

export const GASES = {
  methane: {
    id: 'methane',
    name: 'Methane',
    symbol: 'CH₄',
    color: '#44ffaa',
    effect: 'visual_cloak',
    description: 'Optical cloak — blocks visual detection',
    maxDuration: 6,
    cooldown: 12,
    maxCharges: 3,
    icon: '🌿',
  },
  ammonia: {
    id: 'ammonia',
    name: 'Ammonia',
    symbol: 'NH₃',
    color: '#ffcc44',
    effect: 'radar_jam',
    description: 'Jams radar — blinds probe networks',
    maxDuration: 5,
    cooldown: 15,
    maxCharges: 3,
    icon: '📡',
  },
  xenon: {
    id: 'xenon',
    name: 'Xenon',
    symbol: 'Xe',
    color: '#cc66ff',
    effect: 'heat_mask',
    description: 'Thermal mask — hides infrared signature',
    maxDuration: 8,
    cooldown: 10,
    maxCharges: 3,
    icon: '🌡',
  },
};

export const EYES = {
  night: { id: 'night', name: 'Night Vision', color: '#00ff44', description: 'Reveals hidden threats', key: '1' },
  heat: { id: 'heat', name: 'Heat Scan', color: '#ff4400', description: 'See thermal signatures', key: '2' },
  myth: { id: 'myth', name: 'Myth Mode', color: '#aa44ff', description: 'Slow time — hold the sky', key: '3' },
};

export const SKINS = [
  { id: 'default', name: 'ICY ATLAS', desc: 'Dirty-ice nucleus, sunward coma, dust + ion tails', price: 0, unlockType: 'free', coreColor: '#6e6054', glowColor: '#c8b8a0', trailColor: '232,210,176', nucleusLight: '#c8c0b4' },
  { id: 'fire_comet', name: 'FIRE COMET', desc: 'Orange/red trail with ember particles', price: 0.99, priceId: 'price_skin_fire_comet', unlockType: 'stripe', coreColor: '#ff6622', glowColor: '#ff3300', trailColor: '255,100,20', nucleusLight: '#ff9955' },
  { id: 'dark_matter', name: 'DARK MATTER', desc: 'Black body, purple glow, distortion effect', price: 1.99, priceId: 'price_skin_dark_matter', unlockType: 'stripe', coreColor: '#110022', glowColor: '#9900ff', trailColor: '180,0,255', nucleusLight: '#440066' },
  { id: 'neon_ghost', name: 'NEON GHOST', desc: 'Transparent body, electric blue outline, ghost trail', price: 2.99, priceId: 'price_skin_neon_ghost', unlockType: 'stripe', coreColor: '#001133', glowColor: '#00aaff', trailColor: '0,200,255', nucleusLight: '#003366' },
  { id: 'golden_atlas', name: 'GOLDEN ATLAS', desc: 'Gold core, particle burst trail, glowing crown', price: 4.99, priceId: 'price_skin_golden_atlas', unlockType: 'stripe', coreColor: '#ffcc00', glowColor: '#ffaa00', trailColor: '255,200,0', nucleusLight: '#ffe066' },
  { id: 'void_reaper', name: 'VOID REAPER', desc: 'Black hole aesthetic, warping space trail, ultra rare', price: 9.99, priceId: 'price_skin_void_reaper', unlockType: 'stripe', coreColor: '#000005', glowColor: '#ff0066', trailColor: '120,0,80', nucleusLight: '#220011' },
];

export const POWERUPS = [
  { id: 'gravity_shield', name: 'GRAVITY SHIELD', gasCost: 2 },
  { id: 'probe_scrambler', name: 'PROBE SCRAMBLER', gasCost: 3 },
  { id: 'stealth_cloak', name: 'STEALTH CLOAK', gasCost: 3 },
];

export const PHYSICS = {
  BASE_SPEED: 1.2,
  MAX_SPEED: 3.8,
  MIN_SPEED: 0.18,
  BURST_SPEED: 2.8,
  GRAVITY_CONSTANT: 18000,
  DETECTION_BASE_RATE: 0.02,
  SPEED_DETECTION_MULTIPLIER: 0.8,
  PROXIMITY_DETECTION_MULTIPLIER: 0.7,
  MYTH_SLOW_FACTOR: 0.25,
  DETECTION_DECAY: 0.08,
  ALERT_SPREAD_RADIUS: 220,
};

export const DIFFICULTIES = {
  easy: { id: 'easy', label: 'EASY', color: '#34d399', borderColor: 'rgba(52,211,153,0.5)', bg: 'rgba(52,211,153,0.1)', glow: 'rgba(52,211,153,0.3)', speedMult: 0.55, threatSpeedMult: 0.45, detectionMult: 0.3, worldLengthMult: 0.9, description: 'Wider disguise bands. Suspicion fades quickly.' },
  medium: { id: 'medium', label: 'MEDIUM', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.5)', bg: 'rgba(251,191,36,0.1)', glow: 'rgba(251,191,36,0.3)', speedMult: 1.0, threatSpeedMult: 1.0, detectionMult: 1.0, worldLengthMult: 1.0, description: 'The intended watch. Hold the published bands.' },
  hard: { id: 'hard', label: 'HARD', color: '#f87171', borderColor: 'rgba(248,113,113,0.5)', bg: 'rgba(248,113,113,0.1)', glow: 'rgba(248,113,113,0.3)', speedMult: 1.0, threatSpeedMult: 0.72, detectionMult: 1.2, worldLengthMult: 1.9, description: 'Narrow bands. Suspicion sticks. Drift is faster.' },
};