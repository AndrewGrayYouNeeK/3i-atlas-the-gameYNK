import { motion } from 'framer-motion';
import { Play, Home, RotateCcw } from 'lucide-react';

export default function PauseMenu({ onResume, onRestart, onMainMenu }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,10,0.82)' }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-xs mx-4 rounded-3xl overflow-hidden"
        style={{ background: 'rgba(10,6,24,0.97)', border: '1px solid rgba(140,80,255,0.22)', boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 40px rgba(100,60,200,0.12)' }}
      >
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #5b21b6)' }} />

        <div className="p-7 text-center">
          {/* Comet orb */}
          <div className="w-12 h-12 mx-auto mb-4 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 35%, #c8ddff, #7733bb, #1a0033)', boxShadow: '0 0 20px rgba(150,100,255,0.5)' }} />

          <div className="font-orbitron text-[9px] text-violet-400/60 tracking-[0.35em] mb-1">PAUSED</div>
          <h2 className="font-orbitron text-2xl font-bold text-white mb-6"
            style={{ textShadow: '0 0 20px rgba(160,80,255,0.5)' }}>
            ATLAS AT REST
          </h2>

          <div className="space-y-2">
            <motion.button
              onClick={onResume}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl font-orbitron text-sm text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
            >
              <Play className="w-4 h-4 fill-white" />
              RESUME MISSION
            </motion.button>

            <motion.button
              onClick={onRestart}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.07)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl border font-orbitron text-sm text-white/65 flex items-center justify-center gap-2 transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <RotateCcw className="w-4 h-4" />
              RESTART LEVEL
            </motion.button>

            <motion.button
              onClick={onMainMenu}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.04)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl border font-orbitron text-sm text-white/35 flex items-center justify-center gap-2 transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <Home className="w-4 h-4" />
              MAIN MENU
            </motion.button>
          </div>

          <div className="mt-6 font-orbitron text-[8px] tracking-widest" style={{ color: 'rgba(255,255,255,0.18)' }}>
            ESC TO RESUME
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}