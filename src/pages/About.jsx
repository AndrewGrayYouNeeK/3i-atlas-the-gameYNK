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
              <strong className="text-white/90">3i-Atlas: The Game</strong> is a stealth-navigation campaign about two interstellar hulls and one watched planet.
              You start as <strong className="text-white/90">1I/&apos;Oumuamua</strong> — a tumbling scout sent to scope Earth. Then you leave the solar system.
              Then you send <strong className="text-white/90">3I/ATLAS</strong>, and try to stay undetected while Earth sits in the background, watching.
            </p>
            <p>
              The game blends precision movement with strategic thinking. Move like debris — slow, cold, unpowered — using planet gravity, moon shadows, and timed gas releases.
              Deploy Methane to cloak from visual scanners, Ammonia to jam radar, and Xenon to mask your heat signature. The moment you act like a ship, Earth knows.
            </p>
            <p>
              Act I is reconnaissance. Act II is infiltration. Threats grow more coordinated after the first visit: probe networks share intelligence, and hunter drones chase on sight.
              Earth remains painted behind the sky for the Atlas run — a reminder that the watchers never stopped looking after &apos;Oumuamua.
            </p>
            <p>
              <strong className="text-white/90">Who is this game for?</strong> Players who want arcade stealth with a sci-fi narrative twist. Easy is a cruise. Hard is a long shadow-and-drift infiltration.
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