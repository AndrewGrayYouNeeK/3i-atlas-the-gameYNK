import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

export default function EndgameScreen({ totalScore, onRestart }) {
  const [choice, setChoice] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      style={{ backdropFilter: 'blur(16px)', background: 'radial-gradient(ellipse at 50% 60%, rgba(50,0,90,0.92) 0%, rgba(1,1,12,0.98) 100%)' }}
    >
      {/* Ambient stars */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{
            width: Math.random() * 1.8 + 0.4, height: Math.random() * 1.8 + 0.4,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            background: '#ffffff',
          }}
          animate={{ opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: 2.5 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      <div className="relative z-10 text-center max-w-lg mx-4 py-12">
        {/* Comet */}
        <motion.div className="w-20 h-20 mx-auto mb-8" animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          <div className="w-full h-full rounded-full relative"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #ddeeff 0%, #7733bb 50%, #1a0030 100%)',
              boxShadow: '0 0 50px rgba(150,80,255,0.7), 0 0 100px rgba(150,80,255,0.3)',
            }}>
            {/* Trail */}
            <div className="absolute top-1/2 -left-16 -translate-y-1/2 pointer-events-none"
              style={{ width: 60, height: 20, background: 'linear-gradient(90deg, transparent, rgba(160,80,255,0.5))', borderRadius: '50% 0 0 50%' }} />
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="font-orbitron text-[9px] tracking-[0.4em] mb-3" style={{ color: 'rgba(167,139,250,0.7)' }}>
            THE FINAL MOMENT
          </div>
          <h2 className="font-orbitron text-4xl font-black text-white mb-2"
            style={{ textShadow: '0 0 40px rgba(160,80,255,0.8)' }}>
            Earth Orbit Achieved
          </h2>
          <p className="text-sm mb-2" style={{ color: 'rgba(200,180,255,0.7)', fontFamily: "'Exo 2',sans-serif" }}>
            Final Score: <span className="font-bold text-violet-300">{totalScore.toLocaleString()}</span>
          </p>
          <p className="text-sm leading-relaxed mb-10 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Exo 2',sans-serif" }}>
            3-Eyed Atlas has completed the mythic circuit. The sky held, the asteroids towed, humanity observed in silence.
            Now, at the edge of Earth's atmosphere, the choice presents itself.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!choice ? (
            <motion.div key="choice" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }}>
              <p className="font-orbitron text-[9px] tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                CHOOSE YOUR FATE
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  onClick={() => setChoice('reveal')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative p-5 rounded-3xl text-left overflow-hidden transition-all"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                >
                  <Eye className="w-7 h-7 mb-3" style={{ color: '#fbbf24' }} />
                  <div className="font-orbitron text-sm font-bold mb-2" style={{ color: '#fbbf24' }}>REVEAL YOURSELF</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Exo 2',sans-serif" }}>
                    Open all three eyes. Let humanity see the truth. The ancient guardian unveils.
                  </p>
                </motion.button>

                <motion.button
                  onClick={() => setChoice('vanish')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative p-5 rounded-3xl text-left overflow-hidden transition-all"
                  style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                >
                  <EyeOff className="w-7 h-7 mb-3" style={{ color: '#38bdf8' }} />
                  <div className="font-orbitron text-sm font-bold mb-2" style={{ color: '#38bdf8' }}>VANISH FOREVER</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Exo 2',sans-serif" }}>
                    Cloak all three eyes. Slip into the void. Humanity will never know.
                  </p>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="ending" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
              {choice === 'reveal' ? (
                <div className="p-5 rounded-3xl text-left mb-5"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: '#fbbf24' }} />
                    <span className="font-orbitron text-xs" style={{ color: '#fbbf24' }}>THE REVELATION</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: "'Exo 2',sans-serif" }}>
                    All three eyes open simultaneously. The icy shell dissolves into light. Humanity's satellites capture
                    something impossible — a comet with eyes, blazing in purple and gold. For 11 seconds, every telescope
                    on Earth points upward. Then you are gone, leaving only light.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-3xl text-left mb-5"
                  style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <EyeOff className="w-4 h-4" style={{ color: '#38bdf8' }} />
                    <span className="font-orbitron text-xs" style={{ color: '#38bdf8' }}>THE VANISHING</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: "'Exo 2',sans-serif" }}>
                    The comet trail dims. The eyes close, one by one. Atlas becomes the void between stars — omnipresent,
                    invisible, eternal. Humanity will search for that strange comet for centuries. And in that silence,
                    Atlas watches still.
                  </p>
                </div>
              )}
              <motion.button
                onClick={onRestart}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl font-orbitron text-sm text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 8px 28px rgba(124,58,237,0.4)' }}
              >
                PLAY AGAIN — NEW CYCLE
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}