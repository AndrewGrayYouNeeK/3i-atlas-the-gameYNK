import { motion } from 'framer-motion';

export default function BriefingScreen({ stage, index, total, onEngage, onBack }) {
  if (!stage) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(40,20,10,0.55), rgba(2,2,10,0.96) 55%)' }}
    >
      <div className="max-w-3xl mx-auto px-4 py-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 28px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)' }}>
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="font-orbitron text-[10px] tracking-[0.2em] text-white/40 hover:text-white/70">MENU</button>
          <div className="font-orbitron text-[10px] tracking-[0.28em]" style={{ color: stage.accent || '#f5c16c' }}>
            STAGE {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
        </div>

        <div className="font-orbitron text-[11px] tracking-[0.35em] text-white/40 mb-2">{stage.dateLabel}</div>
        <h1 className="font-orbitron text-3xl sm:text-5xl font-black text-white leading-none mb-2" style={{ textShadow: `0 0 28px ${stage.accent || '#fff'}55` }}>
          {stage.name}
        </h1>
        <p className="text-white/55 mb-6">{stage.subtitle}</p>

        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="font-orbitron text-[9px] tracking-[0.22em] text-sky-300/80 mb-2">PUBLIC RECORD</div>
            <p className="text-sm leading-relaxed text-white/70">{stage.publicRecord}</p>
          </div>
          <div className="rounded-3xl p-4" style={{ background: 'rgba(120, 53, 15, 0.18)', border: '1px solid rgba(251, 191, 36, 0.22)' }}>
            <div className="font-orbitron text-[9px] tracking-[0.22em] text-amber-200/80 mb-2">SHIP LOG · CLASSIFIED</div>
            <p className="text-sm leading-relaxed text-amber-50/80">{stage.shipLog}</p>
          </div>
        </div>

        <div className="rounded-3xl p-4 mb-4" style={{ background: 'rgba(5,6,16,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="font-orbitron text-[9px] tracking-[0.22em] text-white/40 mb-1">OBJECTIVE</div>
          <p className="text-sm text-white/85 mb-3">{stage.objective}</p>
          <div className="font-orbitron text-[9px] tracking-[0.22em] text-white/40 mb-2">WHO IS LOOKING</div>
          <div className="flex flex-wrap gap-2">
            {stage.threats.map((threat) => (
              <span key={threat} className="text-[11px] px-2 py-1 rounded-full text-white/75" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
                {threat}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {stage.controls.map((control) => (
            <div key={control.id} className="px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="font-orbitron text-[10px] text-white/80">{control.key}</span>
              <span className="text-[11px] text-white/45 ml-2">{control.label}</span>
            </div>
          ))}
          <div className="px-2.5 py-1.5 rounded-xl text-[11px] text-white/45" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            WASD steer
          </div>
        </div>

        <button
          onClick={onEngage}
          className="w-full py-4 rounded-2xl font-orbitron text-sm tracking-[0.18em] text-white"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 28px rgba(124,58,237,0.45)' }}
        >
          ENGAGE DISGUISE
        </button>
        <p className="text-center text-[11px] text-white/30 mt-3">{stage.hint}</p>
      </div>
    </motion.div>
  );
}
