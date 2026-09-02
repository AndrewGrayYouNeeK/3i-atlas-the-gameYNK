import { motion } from 'framer-motion';
import { Rocket, EyeOff } from 'lucide-react';

export default function DispatchScreen({ onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      style={{ backdropFilter: 'blur(16px)', background: 'radial-gradient(ellipse at 78% 62%, rgba(20,60,120,0.55) 0%, rgba(1,1,12,0.97) 58%)' }}
    >
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 1.8 + 0.4,
            height: Math.random() * 1.8 + 0.4,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: '#ffffff',
          }}
          animate={{ opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: 2.5 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      <div className="relative z-10 text-center max-w-lg mx-4 py-10">
        <motion.div
          className="mx-auto mb-6 flex items-center justify-center gap-3"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div
            className="w-16 h-6 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #5a3a28, #d4b08c, #5a3a28)',
              boxShadow: '0 0 24px rgba(224,122,69,0.55)',
              transform: 'rotate(-18deg)',
            }}
          />
          <span className="font-orbitron text-[10px] text-white/30">→</span>
          <div
            className="w-12 h-12 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #ddeeff 0%, #7733bb 50%, #1a0030 100%)',
              boxShadow: '0 0 40px rgba(150,80,255,0.7)',
            }}
          />
        </motion.div>

        <div className="font-orbitron text-[9px] tracking-[0.4em] mb-3" style={{ color: 'rgba(125,211,252,0.75)' }}>
          RECON COMPLETE
        </div>
        <h2
          className="font-orbitron text-3xl sm:text-4xl font-black text-white mb-3"
          style={{ textShadow: '0 0 40px rgba(80,160,255,0.7)' }}
        >
          Send 3I/ATLAS
        </h2>
        <p className="text-sm leading-relaxed mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.58)', fontFamily: "'Exo 2',sans-serif" }}>
          {'\'Oumuamua has left the solar system. Earth is scoped. The scout is gone — now the real hull goes in.'}
          {' Earth sits in the background, and they are watching. Stay undetected.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(224,122,69,0.08)', border: '1px solid rgba(224,122,69,0.25)' }}>
            <EyeOff className="w-5 h-5 mb-2" style={{ color: '#e07a45' }} />
            <div className="font-orbitron text-[10px] mb-1" style={{ color: '#e07a45' }}>1I / &apos;OUMUAMUA</div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Scout complete. Exit vector locked. Earth never got a clean look.
            </p>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(167,139,250,0.28)' }}>
            <Rocket className="w-5 h-5 mb-2" style={{ color: '#c4b5fd' }} />
            <div className="font-orbitron text-[10px] mb-1" style={{ color: '#c4b5fd' }}>3I / ATLAS</div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Infiltration hull. Same mind, new ice. Do not confirm the first visit.
            </p>
          </div>
        </div>

        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-orbitron text-sm text-white"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', boxShadow: '0 8px 28px rgba(80,140,255,0.4)' }}
        >
          DISPATCH 3I/ATLAS
        </motion.button>
      </div>
    </motion.div>
  );
}
