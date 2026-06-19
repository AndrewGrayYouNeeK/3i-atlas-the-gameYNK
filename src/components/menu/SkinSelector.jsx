import { motion } from 'framer-motion';
import SkinPreviewCanvas from '../store/SkinPreviewCanvas.jsx';
import { SKINS } from '../../game/constants.js';

export default function SkinSelector({ ownedSkins = ['default'], selectedSkin = 'default', onSelect }) {
  const available = SKINS.filter(s => ownedSkins.includes(s.id));

  if (available.length <= 1) return null;

  return (
    <div className="w-full max-w-xl mb-5">
      <div className="font-orbitron text-[11px] text-white/25 tracking-[0.3em] text-center mb-3">
        SELECT SKIN
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        {available.map((skin) => {
          const isSelected = selectedSkin === skin.id;
          return (
            <motion.button
              key={skin.id}
              onClick={() => onSelect(skin.id)}
              whileTap={{ scale: 0.93 }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all"
              style={{
                background: isSelected ? `${skin.glowColor}22` : 'rgba(255,255,255,0.04)',
                border: isSelected ? `1.5px solid ${skin.glowColor}88` : '1.5px solid rgba(255,255,255,0.08)',
                boxShadow: isSelected ? `0 0 16px ${skin.glowColor}44` : 'none',
                minWidth: 70,
              }}
            >
              <SkinPreviewCanvas skin={skin} size={56} />
              <span className="font-orbitron text-[8px] leading-tight text-center"
                style={{ color: isSelected ? skin.glowColor : 'rgba(255,255,255,0.45)' }}>
                {skin.name.split(' ')[0]}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}