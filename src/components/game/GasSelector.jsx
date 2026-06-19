import { motion, AnimatePresence } from 'framer-motion';
import { GASES } from '../../game/constants.js';

const GAS_STYLES = {
  methane: { accent: '#34d399', bg: 'rgba(52,211,153,0.18)', border: 'rgba(52,211,153,0.5)', glow: 'rgba(52,211,153,0.4)' },
  ammonia: { accent: '#fbbf24', bg: 'rgba(251,191,36,0.18)', border: 'rgba(251,191,36,0.5)', glow: 'rgba(251,191,36,0.4)' },
  xenon:   { accent: '#c084fc', bg: 'rgba(192,132,252,0.18)', border: 'rgba(192,132,252,0.5)', glow: 'rgba(192,132,252,0.4)' },
};

export default function GasSelector({ activeGas, cooldowns, charges, onActivate }) {
  const gasList = Object.values(GASES);

  return (
    <div className="absolute left-3 z-10 flex flex-col gap-2" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 290px)' }}>
      <div className="font-orbitron text-[12px] tracking-[0.2em] mb-0.5 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
        GAS
      </div>
      {gasList.map((gas) => {
        const isActive = activeGas === gas.id;
        const cd = cooldowns?.[gas.id] || 0;
        const remaining = charges?.[gas.id] ?? 3;
        const depleted = remaining <= 0;
        const onCooldown = cd > 0;
        const unavailable = depleted || (onCooldown && !isActive);
        const s = GAS_STYLES[gas.id];

        return (
          <motion.button
            key={gas.id}
            onTouchStart={(e) => { e.preventDefault(); if (!depleted) onActivate(gas.id); }}
            onClick={() => !depleted && onActivate(gas.id)}
            whileTap={!unavailable ? { scale: 0.92 } : {}}
            className="relative min-w-[44px] min-h-[44px] w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 pointer-events-auto outline-none select-none"
            style={{
              background: isActive ? s.bg : 'rgba(5,5,18,0.78)',
              border: `2px solid ${isActive ? s.border : 'rgba(255,255,255,0.1)'}`,
              boxShadow: isActive ? `0 0 18px ${s.glow}, 0 4px 16px rgba(0,0,0,0.5)` : '0 2px 12px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              opacity: unavailable ? 0.35 : 1,
              touchAction: 'manipulation',
            }}
          >
            {/* Active pulse */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ border: `2px solid ${s.accent}` }}
                />
              )}
            </AnimatePresence>

            {/* Symbol */}
            <span className="font-orbitron text-[11px] font-bold leading-none" style={{ color: isActive ? s.accent : 'rgba(255,255,255,0.8)' }}>
              {gas.symbol}
            </span>

            {/* Charge pips — max pips = starting charges (2/3/5 by difficulty) */}
            <div className="flex gap-0.5">
              {Array.from({ length: Math.max(remaining, charges?.[gas.id] ?? 3) }).map((_, ci) => (
                <div key={ci} className="w-1.5 h-1 rounded-full"
                  style={{ background: ci < remaining ? s.accent : 'rgba(255,255,255,0.12)' }}
                />
              ))}
            </div>

            {/* Cooldown overlay */}
            {onCooldown && !isActive && !depleted && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.45)' }}>
                <span className="font-orbitron text-[10px] font-bold" style={{ color: s.accent }}>{Math.ceil(cd)}</span>
              </div>
            )}
            {depleted && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.45)' }}>
                <span className="font-orbitron text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>OUT</span>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}