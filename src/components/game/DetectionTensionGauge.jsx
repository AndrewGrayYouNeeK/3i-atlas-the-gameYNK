import { motion } from 'framer-motion';

export default function DetectionTensionGauge({ detection }) {
  const pct = Math.max(0, Math.min(100, detection || 0));
  const rating = pct < 5 ? 'INVISIBLE' : pct < 20 ? 'HIDDEN' : pct < 50 ? 'EXPOSED' : pct < 80 ? 'TRACKED' : 'LOCKED';
  const color = pct < 5 ? '#34d399' : pct < 20 ? '#22c55e' : pct < 50 ? '#fbbf24' : pct < 80 ? '#f97316' : '#f87171';

  return (
    <div
      className="absolute top-20 left-3 z-10 w-36 rounded-2xl px-3 py-2 backdrop-blur-md"
      style={{ background: 'rgba(5,5,18,0.78)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-orbitron text-[8px] tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>STEALTH</span>
        <span className="font-orbitron text-[8px]" style={{ color }}>{rating}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.15 }}
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
      <div className="mt-1 text-right font-orbitron text-sm" style={{ color }}>{pct.toFixed(1)}%</div>
    </div>
  );
}