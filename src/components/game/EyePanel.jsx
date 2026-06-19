import { motion, AnimatePresence } from 'framer-motion';
import { EYES } from '../../game/constants.js';

const EYE_STYLES = {
  night: { accent: '#34d399', bg: 'rgba(52,211,153,0.18)', border: 'rgba(52,211,153,0.5)' },
  heat:  { accent: '#fb7185', bg: 'rgba(251,113,133,0.18)', border: 'rgba(251,113,133,0.5)' },
  myth:  { accent: '#c084fc', bg: 'rgba(192,132,252,0.18)', border: 'rgba(192,132,252,0.5)' },
};

const EYE_ICONS = { night: '🌙', heat: '🔥', myth: '✨' };

export default function EyePanel({ activeEye, mythCooldown, onActivate }) {
  const eyeList = Object.values(EYES);

  return (
    <div className="absolute right-3 z-10 flex flex-col gap-2" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 290px)' }}>
      <div className="font-orbitron text-[12px] tracking-[0.2em] mb-0.5 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
        EYES
      </div>
      {eyeList.map((eye) => {
        const isActive = activeEye === eye.id;
        const isMyth = eye.id === 'myth';
        const onCooldown = isMyth && mythCooldown > 0;
        const s = EYE_STYLES[eye.id];

        return (
          <motion.button
            key={eye.id}
            onTouchStart={(e) => { e.preventDefault(); if (!onCooldown) onActivate(eye.id); }}
            onClick={() => !onCooldown && onActivate(eye.id)}
            whileTap={!onCooldown ? { scale: 0.92 } : {}}
            className="relative min-w-[44px] min-h-[44px] w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 pointer-events-auto outline-none select-none"
            style={{
              background: isActive ? s.bg : 'rgba(5,5,18,0.78)',
              border: `2px solid ${isActive ? s.border : 'rgba(255,255,255,0.1)'}`,
              boxShadow: isActive ? `0 0 18px ${s.accent}55, 0 4px 16px rgba(0,0,0,0.5)` : '0 2px 12px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              opacity: onCooldown ? 0.38 : 1,
              touchAction: 'manipulation',
            }}
          >
            {/* Active pulse ring */}
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

            <span className="text-lg leading-none">{EYE_ICONS[eye.id]}</span>
            <span className="font-orbitron text-[12px] leading-none" style={{ color: isActive ? s.accent : 'rgba(255,255,255,0.5)' }}>
              {eye.name.split(' ')[0].toUpperCase()}
            </span>

            {/* Cooldown overlay */}
            {isMyth && onCooldown && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                <span className="font-orbitron text-[11px] font-bold" style={{ color: s.accent }}>{Math.ceil(mythCooldown)}</span>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}