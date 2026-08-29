import { motion } from 'framer-motion';

/**
 * 3i-Atlas title logo (Andrew's original art, shipped in /public).
 */
export default function CometLogo({ size = 200, className = '' }) {
  return (
    <motion.div
      className={`relative mx-auto overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <img
        src="/logo.webp"
        alt="3i-Atlas The Game"
        className="w-full h-full object-cover"
        style={{
          mixBlendMode: 'screen',
          filter: 'drop-shadow(0 0 30px rgba(140,80,255,0.7)) drop-shadow(0 0 60px rgba(140,80,255,0.3))',
          transform: 'scale(1.15)',
        }}
      />
    </motion.div>
  );
}
