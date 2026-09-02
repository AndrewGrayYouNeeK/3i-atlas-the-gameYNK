import { motion } from 'framer-motion';
import { RefreshCw, Home } from 'lucide-react';

export default function GameOverScreen({ levelId, reason, onRetry, onMainMenu, craft }) {
  const isCollision = reason === 'collision';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(10,0,0,0.88)' }}
    >
      <motion.div
        initial={{ y: 40, scale: 0.94 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: 'rgba(12,4,4,0.98)', border: '1px solid rgba(248,113,113,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 40px rgba(200,50,50,0.12)' }}
      >
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#dc2626,#b91c1c)' }} />

        <div className="p-7 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 0.15 }}
            className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.15)', border: '2px solid rgba(248,113,113,0.4)', boxShadow: '0 0 30px rgba(220,38,38,0.3)' }}
          >
            <span className="text-2xl">{isCollision ? '💥' : '📡'}</span>
          </motion.div>

          <div className="font-orbitron text-[9px] tracking-[0.35em] mb-1.5" style={{ color: 'rgba(248,113,113,0.7)' }}>
            {isCollision ? 'IMPACT DETECTED' : 'IDENTITY COMPROMISED'}
          </div>
          <h2 className="font-orbitron text-3xl font-black mb-3" style={{ color: '#f87171', textShadow: '0 0 24px rgba(248,113,113,0.6)' }}>
            {isCollision ? 'COLLISION' : 'DETECTED'}
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Exo 2', sans-serif" }}>
            {isCollision
              ? `${craft?.shortName || 'Atlas'} collided with a planetary body. The hull shattered on impact. Mission terminated.`
              : craft?.id === 'oumuamua'
                ? "Earth's telescopes locked onto 1I/'Oumuamua. The scout is burned. 3I/ATLAS cannot launch."
                : "Earth's tracking array locked onto 3I/ATLAS. The second visitor is exposed. The mission failed."
            }
          </p>

          {/* Debrief card */}
          <div className="text-left px-4 py-3 rounded-2xl mb-6" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}>
            <div className="font-orbitron text-[8px] tracking-widest mb-1.5" style={{ color: 'rgba(248,113,113,0.6)' }}>DEBRIEF</div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Exo 2', sans-serif" }}>
              {isCollision
                ? 'Avoid planetary bodies and gravity wells. Their influence radius is wider than it appears.'
                : 'Probe networks communicate in real-time. Getting spotted alerts nearby hunters. Use gas countermeasures.'}
            </p>
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={onMainMenu}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.07)' }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3.5 rounded-2xl border font-orbitron text-xs text-white/50 flex items-center justify-center gap-2 transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Home className="w-3.5 h-3.5" /> MENU
            </motion.button>
            <motion.button
              onClick={onRetry}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-[2] py-3.5 rounded-2xl font-orbitron text-sm text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 20px rgba(220,38,38,0.4)' }}
            >
              <RefreshCw className="w-4 h-4" /> TRY AGAIN
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}