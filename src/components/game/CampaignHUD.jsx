import { motion } from 'framer-motion';

function bandLeft(band) {
  return `${Math.max(0, (band?.[0] || 0) * 100)}%`;
}
function bandWidth(band) {
  const a = band?.[0] || 0;
  const b = band?.[1] || 1;
  return `${Math.max(4, (b - a) * 100)}%`;
}

function Bar({ label, value, color, goodBand, cap, hint }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const hot = cap != null && value > cap;
  return (
    <div className="min-w-[148px]">
      <div className="flex items-baseline justify-between gap-2 mb-0.5">
        <span className="font-orbitron text-[8px] tracking-[0.16em] text-white/45">{label}</span>
        {hint && <span className="font-orbitron text-[8px] text-white/35">{hint}</span>}
      </div>
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        {goodBand && (
          <div
            className="absolute top-0 bottom-0 rounded-full"
            style={{ left: bandLeft(goodBand), width: bandWidth(goodBand), background: 'rgba(52,211,153,0.28)' }}
          />
        )}
        {cap != null && (
          <div className="absolute top-0 bottom-0 w-px" style={{ left: `${cap * 100}%`, background: 'rgba(248,113,113,0.9)' }} />
        )}
        <div className="absolute top-0 bottom-0 left-0 rounded-full" style={{ width: `${pct}%`, background: hot ? '#f87171' : color }} />
      </div>
    </div>
  );
}

export default function CampaignHUD({ hud, stage }) {
  if (!hud || !stage) return null;
  const suspicion = hud.suspicion || 0;
  const danger = suspicion >= 70;
  const caution = suspicion >= 35;
  const color = danger ? '#f87171' : caution ? '#fbbf24' : '#34d399';
  const meters = new Set(hud.meters || []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute left-3 right-3 flex flex-col gap-2" style={{ top: 'calc(env(safe-area-inset-top) + 52px)' }}>
        <div className="flex flex-wrap items-start gap-2">
          <div
            className="px-3 py-2.5 rounded-2xl backdrop-blur-md min-w-[200px] flex-1 max-w-sm"
            style={{ background: 'rgba(5,6,16,0.72)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-orbitron text-[10px] tracking-[0.22em] text-white/45">SUSPICION</span>
              <span className="font-orbitron text-[11px] font-bold" style={{ color }}>{suspicion.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${Math.min(100, suspicion)}%` }}
                transition={{ duration: 0.12 }}
                style={{ background: `linear-gradient(90deg, #34d399, ${color})` }}
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(hud.watchedBy || []).length === 0 && (
                <span className="font-orbitron text-[8px] tracking-widest text-white/30">NO ACTIVE LOCK</span>
              )}
              {(hud.watchedBy || []).map((name) => (
                <span key={name} className="font-orbitron text-[8px] tracking-wider px-1.5 py-0.5 rounded-md" style={{ color: '#fecaca', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)' }}>
                  {name}
                </span>
              ))}
              {hud.occulted && <span className="font-orbitron text-[8px] tracking-wider text-amber-200/80">EARTH BLIND</span>}
              {hud.imageHot && <span className="font-orbitron text-[8px] tracking-wider text-orange-200">IMAGING {hud.imageLeft.toFixed(1)}s</span>}
              {!hud.imageHot && stage.mechanic === 'mars' && (
                <span className="font-orbitron text-[8px] tracking-wider text-white/35">NEXT FRAME {hud.imageLeft.toFixed(0)}s</span>
              )}
            </div>
          </div>

          <div
            className="px-3 py-2 rounded-2xl backdrop-blur-md flex flex-col gap-1.5"
            style={{ background: 'rgba(5,6,16,0.66)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {meters.has('coma') && (
              <Bar label="COMA" value={hud.coma} color="#fde68a" goodBand={hud.comaBand} hint="band" />
            )}
            {meters.has('a1') && (
              <Bar label="A1 JET" value={Math.min(1, hud.a1)} color="#fb7185" goodBand={hud.a1Band} hint="non-grav" />
            )}
            {meters.has('tail') && (
              <Bar label="TAIL" value={hud.tail} color="#7dd3fc" hint="antisun" />
            )}
            {meters.has('anomaly') && (
              <Bar label="ANOMALY" value={hud.anomaly} color="#c4b5fd" cap={hud.anomalyCap} hint="trajectory" />
            )}
            {meters.has('catalog') && (
              <Bar label="CATALOG" value={hud.catalog} color="#f5c16c" hint="survey" />
            )}
            {meters.has('ephemeris') && (
              <Bar label="EPHEMERIS" value={hud.ephemeris} color="#fde68a" cap={hud.ephemerisCap} />
            )}
            {meters.has('coherence') && (
              <Bar label="ION STRAIGHT" value={hud.coherence} color="#67e8f9" cap={0.5} />
            )}
            {meters.has('radio') && (
              <Bar label="RADIO" value={hud.radio} color="#f87171" cap={0.2} />
            )}
            {meters.has('corridor') && (
              <Bar label="CORRIDOR" value={hud.corridor} color="#fdba74" />
            )}
            {meters.has('curve') && (
              <Bar label="FADE MATCH" value={hud.curve} color="#f9a8d4" hint={`target ${Math.round((hud.targetBrightness || 0) * 100)}`} />
            )}
            {meters.has('spectrum') && (
              <div className="min-w-[148px]">
                <div className="font-orbitron text-[8px] tracking-[0.16em] text-white/45 mb-1">SPECTRUM · CO₂ RICH</div>
                {[
                  ['CO₂', hud.co2, '#c4b5fd', 0.7],
                  ['H₂O', hud.h2o, '#7dd3fc', 0.16],
                  ['DUST', hud.dust, '#fcd34d', 0.14],
                ].map(([name, val, col, mark]) => (
                  <div key={name} className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-orbitron text-[7px] w-7 text-white/40">{name}</span>
                    <div className="relative flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="absolute top-0 bottom-0 w-px" style={{ left: `${mark * 100}%`, background: 'rgba(52,211,153,0.9)' }} />
                      <div className="h-full rounded-full" style={{ width: `${(val || 0) * 100}%`, background: col }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {meters.has('locks') && (
              <div className="flex gap-1">
                {(hud.lockNames || []).map((name, i) => (
                  <span
                    key={name}
                    className="font-orbitron text-[7px] tracking-wider px-1.5 py-1 rounded-md"
                    style={{
                      color: hud.locks?.[i] ? '#6ee7b7' : i === hud.activeObs ? '#fde68a' : 'rgba(255,255,255,0.35)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {hud.locks?.[i] ? 'OK' : name}
                  </span>
                ))}
              </div>
            )}
            {meters.has('outburst') && (
              <div className="font-orbitron text-[8px] tracking-wider" style={{ color: hud.outburstUsed ? 'rgba(255,255,255,0.35)' : '#f9a8d4' }}>
                {hud.outburstUsed ? 'OUTBURST SPENT' : 'ONE OUTBURST LEFT'}
              </div>
            )}
          </div>
        </div>

        {hud.alert && (
          <div className="self-start px-3 py-1.5 rounded-xl font-orbitron text-[10px] tracking-wide text-amber-100" style={{ background: 'rgba(120, 53, 15, 0.72)', border: '1px solid rgba(251,191,36,0.35)' }}>
            {hud.alert}
          </div>
        )}
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 w-[min(560px,calc(100%-1.5rem))] px-3 py-2 rounded-2xl backdrop-blur-md bottom-40 md:bottom-6"
        style={{ background: 'rgba(5,6,16,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="font-orbitron text-[8px] tracking-[0.18em] text-white/40">OBJECTIVE</span>
          <span className="font-orbitron text-[8px] text-white/35">{Math.round((hud.progress || 0) * 100)}%</span>
        </div>
        <div className="text-[12px] text-white/80 leading-snug">{hud.objective}</div>
        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (hud.progress || 0) * 100)}%`, background: stage.accent || '#a78bfa' }} />
        </div>
      </div>
    </div>
  );
}
