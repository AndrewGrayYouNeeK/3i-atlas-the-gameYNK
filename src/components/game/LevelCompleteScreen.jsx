import { motion } from 'framer-motion';
import { ChevronRight, Star, Lock } from 'lucide-react';
import { LEVELS } from '../../game/constants.js';

export default function LevelCompleteScreen({ levelId, score, detection, onNextLevel, onMainMenu }) {
  const level = LEVELS[levelId];
  const isLastLevel = levelId === LEVELS.length - 1;
  const stealthBonus = detection < 5 ? 1500 : detection < 20 ? 600 : 0;
  const totalScore = score + stealthBonus;
  const perfect = detection < 5;
  const good = detection < 20;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backdropFilter: 'blur(14px)', background: 'rgba(4,2,14,0.9)' }}
    >
      {/* Star burst particles */}
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-violet-300"
          initial={{ x: '50vw', y: '50vh', scale: 0, opacity: 1 }}
          animate={{
            x: `${20 + Math.random() * 60}vw`,
            y: `${20 + Math.random() * 60}vh`,
            scale: [0, 1, 0], opacity: [0, 1, 0],
          }}
          transition={{ duration: 1.2 + Math.random(), delay: Math.random() * 0.4 }}
        />
      ))}

      <motion.div
        initial={{ y: 44, scale: 0.93 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.1 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: 'rgba(8,4,20,0.98)', border: '1px solid rgba(167,139,250,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 50px rgba(100,60,200,0.15)' }}
      >
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7,#7c3aed)' }} />

        <div className="p-7">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(167,139,250,0.4)', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}
          >
            <Star className="w-6 h-6 fill-violet-300 text-violet-300" />
          </motion.div>

          <div className="font-orbitron text-[9px] tracking-[0.35em] text-center mb-1.5" style={{ color: 'rgba(167,139,250,0.7)' }}>
            MISSION COMPLETE
          </div>
          <h2 className="font-orbitron text-2xl font-bold text-white text-center mb-0.5">{level.name}</h2>
          <p className="text-xs text-center mb-6" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Exo 2', sans-serif" }}>
            {level.subtitle}
          </p>

          {/* Score breakdown */}
          <div className="px-4 py-3.5 rounded-2xl mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Exo 2', sans-serif" }}>Objectives</span>
                <span className="font-orbitron text-xs text-white">{score.toLocaleString()}</span>
              </div>
              {stealthBonus > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-between items-center"
                >
                  <span className="text-xs flex items-center gap-1" style={{ color: '#34d399', fontFamily: "'Exo 2', sans-serif" }}>
                    <Star className="w-3 h-3 fill-emerald-400" /> Stealth bonus
                  </span>
                  <span className="font-orbitron text-xs" style={{ color: '#34d399' }}>+{stealthBonus.toLocaleString()}</span>
                </motion.div>
              )}
              <div className="border-t pt-2 flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span className="font-orbitron text-xs text-white">Total</span>
                <span className="font-orbitron text-lg font-bold" style={{ color: '#c4b5fd' }}>{totalScore.toLocaleString()}</span>
              </div>
            </div>

            {/* Stealth rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="text-[9px] font-orbitron px-2 py-1 rounded-xl"
                style={{
                  background: perfect ? 'rgba(52,211,153,0.15)' : good ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                  border: `1px solid ${perfect ? 'rgba(52,211,153,0.3)' : good ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}`,
                  color: perfect ? '#34d399' : good ? '#fbbf24' : '#f87171',
                }}>
                {perfect ? '★ PERFECT STEALTH' : good ? '◆ NEAR UNDETECTED' : '● DETECTED'}
              </div>
              <span className="font-orbitron text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{detection.toFixed(1)}%</span>
            </div>
          </div>

          {/* Lore unlock */}
          {perfect && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="px-4 py-3 rounded-2xl mb-4"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lock className="w-3 h-3 text-violet-400" />
                <span className="font-orbitron text-[8px] text-violet-400 tracking-widest">ATLAS LORE UNLOCKED</span>
              </div>
              <p className="text-[10px] leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Exo 2', sans-serif" }}>
                &ldquo;{level.lore}&rdquo;
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <motion.button
              onClick={onMainMenu}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.07)' }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3.5 rounded-2xl border font-orbitron text-xs text-white/40 transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              MENU
            </motion.button>
            {!isLastLevel ? (
              <motion.button
                onClick={onNextLevel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-[2] py-3.5 rounded-2xl font-orbitron text-sm text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
              >
                NEXT LEVEL <ChevronRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => onNextLevel('endgame')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-[2] py-3.5 rounded-2xl font-orbitron text-sm text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', boxShadow: '0 4px 20px rgba(100,150,255,0.4)' }}
              >
                THE CHOICE <Star className="w-4 h-4 fill-white" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}