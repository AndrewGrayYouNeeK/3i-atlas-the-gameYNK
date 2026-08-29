import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye } from 'lucide-react';

export default function DetectionHUD({ detection, score, level, comboMultiplier = 1, inShadow = false }) {
  const safe = detection < 5;
  const low = detection < 20;
  const med = detection >= 20 && detection < 60;
  const danger = detection >= 60;
  const critical = detection >= 85;

  const barGrad = safe
    ? 'from-emerald-500 to-emerald-400'
    : low
    ? 'from-emerald-500 to-emerald-400'
    : med
    ? 'from-amber-400 to-yellow-400'
    : danger
    ? 'from-orange-500 to-red-500'
    : 'from-red-600 to-red-400';

  const statusText = safe ? 'SAFE' : low ? 'CAUTION' : med ? 'WARNING' : danger ? 'DANGER' : 'CRITICAL';
  const statusColor = safe ? '#34d399' : low ? '#34d399' : med ? '#fbbf24' : danger ? '#f97316' : '#f87171';

  return (
    <div className="absolute left-3 right-3 flex items-start justify-between gap-3 pointer-events-none z-10" style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}>

      {/* Detection block */}
      <div
        className="flex-1 max-w-xs px-3 py-2.5 rounded-2xl backdrop-blur-md"
        style={{ background: 'rgba(5,5,18,0.75)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3" style={{ color: statusColor }} />
            <span className="font-orbitron text-[12px] tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.4)' }}>DETECTION</span>
          </div>
          <motion.div
            key={statusText}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="font-orbitron text-[12px] font-bold tracking-widest"
            style={{ color: inShadow ? '#a78bfa' : statusColor }}
          >
            {inShadow ? 'IN SHADOW' : statusText}
          </motion.div>
        </div>

        {/* Bar */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${barGrad}`}
            animate={{ width: `${Math.min(detection, 100)}%` }}
            transition={{ duration: 0.12 }}
            style={{ position: 'relative' }}
          >
            {critical && <div className="absolute inset-0 bg-white/25 animate-pulse rounded-full" />}
          </motion.div>

          {/* 5% safe-zone marker */}
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{ left: '5%', background: 'rgba(52,211,153,0.7)' }}
          />
        </div>

        {/* Value + safe zone label */}
        <div className="flex items-center justify-between mt-1">
          <span className="font-orbitron text-[12px]" style={{ color: 'rgba(52,211,153,0.6)' }}>
            ↑ 5% safe
          </span>
          <span className="font-orbitron text-[12px] font-bold" style={{ color: statusColor }}>
            {detection.toFixed(1)}%
          </span>
        </div>

        <AnimatePresence>
          {critical && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-red-500/20 overflow-hidden"
            >
              <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse flex-shrink-0" />
              <span className="font-orbitron text-[12px] text-red-400 tracking-wider">EVADE IMMEDIATELY</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Level + Score block */}
      <div
        className="px-3 py-2.5 rounded-2xl text-right backdrop-blur-md"
        style={{ background: 'rgba(5,5,18,0.75)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', minWidth: 80 }}
      >
        <div className="font-orbitron text-[11px] tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          LVL {level + 1}
        </div>
        <div className="font-orbitron text-lg font-bold text-white tabular-nums">
          {score.toLocaleString()}
        </div>
        <div className="font-orbitron text-[11px] mt-0.5" style={{ color: 'rgba(160,120,255,0.7)' }}>
          SCORE
        </div>
        {comboMultiplier > 1 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-orbitron text-[10px] mt-1 tracking-wider"
            style={{ color: '#34d399' }}
          >
            STEALTH x{comboMultiplier.toFixed(2)}
          </motion.div>
        )}
      </div>
    </div>
  );
}