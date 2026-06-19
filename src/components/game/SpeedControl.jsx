import { motion } from 'framer-motion';
import { Zap, Minus } from 'lucide-react';

export default function SpeedControl({ speed, onBurst, onSlow }) {
  const maxSpeed = 12;
  const ratio = Math.min(speed / maxSpeed, 1);
  const isSafe = ratio < 0.25;
  const isDanger = ratio > 0.55;
  const barColor = isSafe ? '#34d399' : isDanger ? '#f87171' : '#fbbf24';
  const label = ratio < 0.1 ? 'CREEP' : ratio < 0.3 ? 'SLOW' : ratio < 0.6 ? 'CRUISE' : ratio < 0.85 ? 'FAST' : 'BURST';

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-1 pointer-events-none">
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl backdrop-blur-md pointer-events-auto"
        style={{ background: 'rgba(5,5,18,0.78)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
      >
        <motion.button
          onClick={onSlow}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          aria-label="Slow down"
        >
          <Minus className="w-3 h-3 text-white/50" />
        </motion.button>

        <div className="flex flex-col items-center gap-1" style={{ minWidth: 72 }}>
          <div className="flex items-center gap-1.5">
            <span className="font-orbitron text-xs font-bold" style={{ color: barColor }}>
              {speed.toFixed(1)}
            </span>
            <span className="font-orbitron text-[12px] tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {label}
            </span>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${ratio * 100}%` }}
              transition={{ duration: 0.1 }}
              style={{ background: barColor, boxShadow: `0 0 6px ${barColor}80` }}
            />
          </div>
        </div>

        <motion.button
          onClick={onBurst}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'rgba(124,58,237,0.35)', border: '1px solid rgba(167,139,250,0.3)' }}
          aria-label="Burst speed"
        >
          <Zap className="w-3.5 h-3.5 text-violet-300" />
        </motion.button>
      </div>

      <div className="font-orbitron text-[12px] tracking-widest" style={{ color: 'rgba(255,255,255,0.18)' }}>
        SHIFT BURST · CTRL SLOW
      </div>
    </div>
  );
}