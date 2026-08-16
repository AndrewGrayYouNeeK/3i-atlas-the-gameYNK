import { motion } from 'framer-motion';

/**
 * Animated comet logo — no external image hosting required.
 */
export default function CometLogo({ size = 200, className = '' }) {
  const core = size * 0.22;
  const glow = size * 0.55;

  return (
    <motion.div
      className={`relative mx-auto ${className}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(140,80,255,0.35) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: glow,
          height: glow,
          background: 'radial-gradient(circle, rgba(180,140,255,0.25) 0%, transparent 65%)',
        }}
      />
      {/* Trail */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          left: size * 0.08,
          width: size * 0.42,
          height: size * 0.12,
          background: 'linear-gradient(90deg, transparent, rgba(160,200,255,0.15), rgba(140,80,255,0.45))',
          borderRadius: '50%',
          filter: 'blur(2px)',
          transform: 'translateY(-50%) rotate(-8deg)',
        }}
      />
      {/* Nucleus */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: core,
          height: core,
          background: 'radial-gradient(circle at 35% 35%, #eef6ff, #b8c8e8 40%, #6a5a8a 100%)',
          boxShadow: '0 0 24px rgba(140,80,255,0.8), 0 0 48px rgba(100,60,200,0.4), inset -2px -2px 6px rgba(0,0,0,0.3)',
        }}
      />
      {/* Tail particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + i * 2,
            height: 4 + i * 2,
            left: size * (0.12 + i * 0.06),
            top: size * (0.42 + i * 0.08),
            background: `rgba(${180 - i * 20},${200 - i * 10},255,${0.5 - i * 0.1})`,
          }}
          animate={{ opacity: [0.3, 0.8, 0.3], x: [-2, 4, -2] }}
          transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
      <div
        className="absolute font-orbitron font-bold text-white/90 tracking-wider"
        style={{
          bottom: -size * 0.02,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: size * 0.11,
          textShadow: '0 0 20px rgba(140,80,255,0.8)',
        }}
      >
        3i-ATLAS
      </div>
    </motion.div>
  );
}
