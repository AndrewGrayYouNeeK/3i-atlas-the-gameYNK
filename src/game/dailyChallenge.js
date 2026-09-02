import { LEVELS, DIFFICULTIES } from '../game/constants.js';

/**
 * Deterministic daily challenge seed from calendar date.
 */
export function getDailyChallenge() {
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  const levelId = hash % LEVELS.length;
  const diffKeys = Object.keys(DIFFICULTIES);
  // Use unsigned shifts — signed >> can go negative once the high bit is set
  const difficulty = diffKeys[(hash >>> 4) % diffKeys.length];
  const bonusRoll = (hash >>> 8) % 3;
  const bonusLabel = bonusRoll === 0 ? 'Narrow scans' : bonusRoll === 1 ? 'Extra threats' : 'Low gas';

  return {
    dateKey: key,
    levelId,
    difficulty,
    level: LEVELS[levelId],
    difficultyDef: DIFFICULTIES[difficulty],
    bonusLabel,
    threatBonus: bonusLabel === 'Extra threats' ? 2 : 0,
    scanMult: bonusLabel === 'Narrow scans' ? 0.85 : 1,
    gasPenalty: bonusLabel === 'Low gas' ? 1 : 0,
  };
}
