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
              <strong className="text-white/90">3i-Atlas: The Game</strong> is a stealth-navigation game where you pilot an ancient alien vessel — known as Atlas — disguised as a comet, slipping through humanity's surveillance network across the solar system. Atlas is not a comet. It never was. It is a 4.2-billion-year-old ship masquerading as ice and rock to pass undetected.
            </p>
            <p>
              The game blends precision movement with strategic thinking. You must move like debris — slow, cold, unpowered — using planet gravity, moon shadows, and timed gas releases to stay invisible. Deploy Methane to cloak from visual scanners, Ammonia to jam radar, and Xenon to mask your heat signature. The moment you act like a ship, they know.
            </p>
            <p>
              Each of the seven levels takes place in a distinct region of the solar system, from the frigid Kuiper Belt to the scorching Mercury Sunline. Threats grow more coordinated and aggressive as you progress, with probe networks that share intelligence and hunter drones that chase you on sight.
            </p>
            <p>
              <strong className="text-white/90">Who is this game for?</strong> 3i-Atlas is designed for players who enjoy arcade-style skill challenges with a sci-fi narrative twist. Whether you prefer a relaxed cruise on Easy difficulty or a punishing, hair-trigger experience on Hard, the game scales to meet you.
            </p>
            <p>
              The game features a global leaderboard, unlockable comet skins, and a rich lore system that rewards perfect stealth runs with fragments of Atlas's ancient backstory.
            </p>
            <p>
              <strong className="text-white/90">Who builds it?</strong> 3i-Atlas is designed and built by <span className="text-violet-300">Andrew Gray</span>, an independent developer with a passion for atmospheric game design and generative space aesthetics. The project is a continuous labor of craft — from the hand-tuned physics to the AI-generated planet backgrounds.
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