import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-contain font-exo" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(60,10,120,0.4) 0%, rgba(1,1,12,1) 60%)' }}>
      <div className="max-w-2xl mx-auto px-5 py-10" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)' }}>

        <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-8 text-white/50 hover:text-white/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-orbitron text-xs tracking-wider">BACK</span>
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="font-orbitron text-[11px] tracking-[0.35em] text-violet-400/70 mb-3">ANCIENT INTELLIGENCE PROTOCOL</div>

          <h1 className="font-orbitron text-3xl sm:text-4xl font-black text-white mb-2" style={{ textShadow: '0 0 30px rgba(140,80,255,0.7)' }}>
            About 3i-Atlas
          </h1>

          <div className="w-16 h-0.5 mb-8" style={{ background: 'linear-gradient(90deg, #7c3aed, transparent)' }} />

          <div className="space-y-5 text-white/65 leading-relaxed text-sm sm:text-base">
            <p>
              <strong className="text-white/90">3i-Atlas: The Game</strong> puts you inside 3I/ATLAS, the interstellar object discovered on 1 July 2025.
              Publicly it is a comet on a hyperbolic orbit. In this telling the nucleus is a ship, and the coma is the disguise.
            </p>
            <p>
              You manage the disguise while real instruments look: the ATLAS survey, Hubble and JWST, Mars orbiters, solar coronagraphs, the perihelion jet window near 1.36 AU, the post-perihelion fade, the Jupiter passage, and the outbound hyperbola.
              Coma, tail alignment, brightness, and non-gravitational acceleration each have a band a comet is allowed to occupy. Leave the band while someone is watching and suspicion climbs.
            </p>
            <p>
              Each stage opens with a short public-record briefing and a classified ship log. The dates follow the published timeline. The conspiracy is the game.
            </p>
            <p>
              <strong className="text-white/90">Who is this game for?</strong> Players who want a stealth strategy pass along a real trajectory. Easy widens the disguise bands. Hard narrows them and makes suspicion stick.
            </p>
            <p>
              The game features a global leaderboard, unlockable comet skins, and lore fragments that unlock on perfect stealth runs.
            </p>
            <p>
              <strong className="text-white/90">Who builds it?</strong> 3i-Atlas is designed and built by <span className="text-violet-300">Andrew Gray</span>, an independent developer with a passion for atmospheric game design and generative space aesthetics.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={() => navigate('/')} className="px-5 py-3 rounded-2xl font-orbitron text-xs text-white tracking-wider transition-all" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
              PLAY NOW
            </button>
            <button onClick={() => navigate('/contact')} className="px-5 py-3 rounded-2xl font-orbitron text-xs text-white/60 hover:text-white tracking-wider transition-all border border-white/10 hover:border-white/20">
              CONTACT US
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}