import { motion } from 'framer-motion';

function bandLeft(band) {
  return `${Math.max(0, (band?.[0] || 0) * 100)}%`;
}
function bandWidth(band) {
  const a = band?.[0] || 0;
  const b = band?.[1] || 1;
  return `${Math.max(4, (b - a) * 100)}%`;
}

function Bar({ label, value, color, goodBand, cap, hint, fluid = false }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const hot = cap != null && value > cap;
  return (
    <div className={fluid ? 'min-w-0' : 'min-w-[120px] flex-1 basis-[120px] max-w-[180px]'}>
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

/**
 * Flex-column HUD: top meters + bottom objective.
 * Parent must be a column flex child with flex-1 so the objective
 * sits flush against CampaignControls below (no absolute bottom overlap).
 *
 * Desktop (mouse + keyboard): one full-width strip of touching panels across
 * the top, and a matching footer with the objective beside the key-hinted
 * action buttons (`controls`). The middle of the screen stays open for play.
 */
export default function CampaignHUD({ hud, stage, desktop = false, wide = false, controls = null }) {
  if (!hud || !stage) return null;
  const suspicion = hud.suspicion || 0;
  const danger = suspicion >= 70;
  const caution = suspicion >= 35;
  const color = danger ? '#f87171' : caution ? '#fbbf24' : '#34d399';
  const meters = new Set(hud.meters || []);

  const meterItems = (fluid) => (
    <>
      {meters.has('coma') && (
        <Bar fluid={fluid} label="COMA" value={hud.coma} color="#fde68a" goodBand={hud.comaBand} hint="band" />
      )}
      {meters.has('a1') && (
        <Bar fluid={fluid} label="A1 JET" value={Math.min(1, hud.a1)} color="#fb7185" goodBand={hud.a1Band} hint="non-grav" />
      )}
      {meters.has('tail') && (
        <Bar fluid={fluid} label="TAIL" value={hud.tail} color="#7dd3fc" hint="antisun" />
      )}
      {meters.has('anomaly') && (
        <Bar fluid={fluid} label="ANOMALY" value={hud.anomaly} color="#c4b5fd" cap={hud.anomalyCap} hint="trajectory" />
      )}
      {meters.has('catalog') && (
        <Bar fluid={fluid} label="CATALOG" value={hud.catalog} color="#f5c16c" hint="survey" />
      )}
      {meters.has('ephemeris') && (
        <Bar fluid={fluid} label="EPHEMERIS" value={hud.ephemeris} color="#fde68a" cap={hud.ephemerisCap} />
      )}
      {meters.has('coherence') && (
        <Bar fluid={fluid} label="ION STRAIGHT" value={hud.coherence} color="#67e8f9" cap={0.5} />
      )}
      {meters.has('radio') && (
        <Bar fluid={fluid} label="RADIO" value={hud.radio} color="#f87171" cap={0.2} />
      )}
      {meters.has('corridor') && (
        <Bar fluid={fluid} label="CORRIDOR" value={hud.corridor} color="#fdba74" />
      )}
      {meters.has('curve') && (
        <Bar fluid={fluid} label="FADE MATCH" value={hud.curve} color="#f9a8d4" hint={`target ${Math.round((hud.targetBrightness || 0) * 100)}`} />
      )}
      {meters.has('spectrum') && (
        <div className={fluid ? 'min-w-0' : 'min-w-[120px] flex-1 basis-[140px] max-w-[200px]'}>
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
        <div className="flex flex-wrap gap-1">
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
    </>
  );

  const watchTags = (
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
  );

  if (desktop) {
    const panelBg = { background: 'rgba(5,6,16,0.74)' };
    return (
      <div className="flex-1 min-h-0 flex flex-col pointer-events-none z-10 w-full px-4 lg:px-6">
        <div className="shrink-0 w-full max-w-[1600px] mx-auto flex flex-col gap-2">
          <div
            className={`rounded-2xl overflow-hidden backdrop-blur-md border border-white/10 ${wide ? 'grid grid-cols-[minmax(240px,300px)_minmax(0,1fr)] divide-x divide-white/10' : 'flex flex-col divide-y divide-white/10'}`}
            style={panelBg}
            data-hud-layout={wide ? 'desktop-wide' : 'desktop'}
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-orbitron text-[10px] tracking-[0.22em] text-white/45">SUSPICION</span>
                <span className="font-orbitron text-[12px] font-bold" style={{ color }}>{suspicion.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${Math.min(100, suspicion)}%` }}
                  transition={{ duration: 0.12 }}
                  style={{ background: `linear-gradient(90deg, #34d399, ${color})` }}
                />
              </div>
              {watchTags}
            </div>
            <div className="px-4 py-3 grid gap-x-5 gap-y-2 content-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              {meterItems(true)}
            </div>
          </div>
          {hud.alert && (
            <div className="self-center px-4 py-1.5 rounded-xl font-orbitron text-[11px] tracking-wide text-amber-100" style={{ background: 'rgba(120, 53, 15, 0.72)', border: '1px solid rgba(251,191,36,0.35)' }}>
              {hud.alert}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0" aria-hidden />

        <div
          className={`shrink-0 w-full max-w-[1600px] mx-auto rounded-2xl overflow-hidden backdrop-blur-md border border-white/10 ${wide ? 'flex items-stretch divide-x divide-white/10' : 'flex flex-col divide-y divide-white/10'}`}
          style={{ background: 'rgba(5,6,16,0.8)' }}
        >
          <div className="flex-1 min-w-0 px-4 py-2.5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-orbitron text-[9px] tracking-[0.18em] text-white/40">OBJECTIVE</span>
              <span className="font-orbitron text-[9px] text-white/35">{Math.round((hud.progress || 0) * 100)}%</span>
            </div>
            <div className="text-[13px] text-white/80 leading-snug">{hud.objective}</div>
            <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (hud.progress || 0) * 100)}%`, background: stage.accent || '#a78bfa' }} />
            </div>
          </div>
          {controls && <div className="shrink-0 px-3 py-2 flex items-center">{controls}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col pointer-events-none z-10 w-full">
      <div
        className="shrink-0 flex flex-col gap-2 overflow-y-auto max-h-[42%]"
        style={{
          paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
        }}
      >
        <div className="flex flex-wrap items-start gap-2">
          <div
            className="px-3 py-2.5 rounded-2xl backdrop-blur-md min-w-[160px] flex-1 max-w-sm"
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
            className="px-3 py-2 rounded-2xl backdrop-blur-md flex flex-wrap gap-x-3 gap-y-1.5 flex-1"
            style={{ background: 'rgba(5,6,16,0.66)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {meterItems(false)}
          </div>
        </div>

        {hud.alert && (
          <div className="self-start px-3 py-1.5 rounded-xl font-orbitron text-[10px] tracking-wide text-amber-100" style={{ background: 'rgba(120, 53, 15, 0.72)', border: '1px solid rgba(251,191,36,0.35)' }}>
            {hud.alert}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0" aria-hidden />

      <div
        className="shrink-0 w-full px-3 py-2 rounded-t-2xl backdrop-blur-md md:pr-52"
        style={{
          background: 'rgba(5,6,16,0.78)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
        }}
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
