import { motion } from 'framer-motion';
import { Lock, Check, CreditCard } from 'lucide-react';
import SkinPreviewCanvas from './SkinPreviewCanvas.jsx';

export default function SkinCard({ skin, owned, selected, onBuy, onEquip, loading }) {
  const isFree = skin.unlockType === 'free';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden relative"
      style={{
        background: selected
          ? `linear-gradient(145deg, rgba(0,0,0,0.8), rgba(20,10,40,0.95))`
          : 'rgba(8,8,22,0.9)',
        border: selected
          ? `1px solid ${skin.glowColor}88`
          : owned
          ? '1px solid rgba(255,255,255,0.12)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: selected ? `0 0 24px ${skin.glowColor}44` : 'none',
      }}
    >
      {/* Top: preview + lock */}
      <div className="relative flex items-center justify-center py-5"
        style={{ background: 'rgba(0,0,0,0.4)' }}>
        <SkinPreviewCanvas skin={skin} size={90} />
        {!owned && !isFree && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Lock className="w-3.5 h-3.5 text-white/50" />
          </div>
        )}
        {owned && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)' }}>
            <Check className="w-3.5 h-3.5 text-emerald-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-3">
        <div className="font-orbitron text-xs font-bold text-white mb-1">{skin.name}</div>
        <div className="text-[10px] text-white/45 leading-relaxed mb-3">{skin.desc}</div>

        {/* Action button */}
        {isFree || owned ? (
          <button
            onClick={onEquip}
            className="w-full py-2.5 rounded-2xl font-orbitron text-[11px] font-bold transition-all"
            style={{
              background: selected
                ? `linear-gradient(135deg, ${skin.glowColor}44, ${skin.glowColor}22)`
                : 'rgba(255,255,255,0.06)',
              border: selected
                ? `1px solid ${skin.glowColor}88`
                : '1px solid rgba(255,255,255,0.1)',
              color: selected ? skin.glowColor : 'rgba(255,255,255,0.7)',
            }}
          >
            {selected ? '✓ EQUIPPED' : 'EQUIP'}
          </button>
        ) : (
          <button
            onClick={onBuy}
            disabled={loading}
            className="w-full py-2.5 rounded-2xl font-orbitron text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${skin.glowColor}cc, ${skin.glowColor}88)`,
              color: '#fff',
              boxShadow: `0 4px 16px ${skin.glowColor}44`,
            }}
          >
            {loading ? (
              <span className="animate-pulse">OPENING...</span>
            ) : (
              <>
                <CreditCard className="w-3 h-3" />
                BUY — ${skin.price.toFixed(2)}
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}