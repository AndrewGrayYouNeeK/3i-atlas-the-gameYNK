import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Github, Twitter } from 'lucide-react';

export default function Contact() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 overflow-y-auto font-exo" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(60,10,120,0.4) 0%, rgba(1,1,12,1) 60%)' }}>
      <div className="max-w-2xl mx-auto px-5 py-10" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)' }}>

        <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-8 text-white/50 hover:text-white/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-orbitron text-xs tracking-wider">BACK</span>
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="font-orbitron text-[11px] tracking-[0.35em] text-violet-400/70 mb-3">GET IN TOUCH</div>

          <h1 className="font-orbitron text-3xl sm:text-4xl font-black text-white mb-2" style={{ textShadow: '0 0 30px rgba(140,80,255,0.7)' }}>
            Contact
          </h1>

          <div className="w-16 h-0.5 mb-8" style={{ background: 'linear-gradient(90deg, #7c3aed, transparent)' }} />

          <p className="text-white/55 text-sm leading-relaxed mb-8">
            Have a bug report, feature request, or just want to say hello? Reach out through any of the channels below. We read everything.
          </p>

          <div className="space-y-4">
            <a
              href="mailto:hello@3iatlas.com"
              className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/4 hover:border-violet-500/40 hover:bg-violet-900/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)' }}>
                <Mail className="w-5 h-5 text-violet-300" />
              </div>
              <div>
                <div className="font-orbitron text-xs text-white/80 group-hover:text-white transition-colors">EMAIL</div>
                <div className="text-sm text-violet-300 mt-0.5">hello@3iatlas.com</div>
              </div>
            </a>

            <a
              href="https://github.com/AndrewGrayYouNeeK/3i-atlas-the-gameYNK"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/4 hover:border-sky-500/40 hover:bg-sky-900/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.35)' }}>
                <Github className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <div className="font-orbitron text-xs text-white/80 group-hover:text-white transition-colors">GITHUB</div>
                <div className="text-sm text-sky-300 mt-0.5">AndrewGrayYouNeeK / 3i-atlas-the-gameYNK</div>
              </div>
            </a>

            <a
              href="https://twitter.com/3iAtlas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/4 hover:border-cyan-500/40 hover:bg-cyan-900/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.35)' }}>
                <Twitter className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <div className="font-orbitron text-xs text-white/80 group-hover:text-white transition-colors">X / TWITTER</div>
                <div className="text-sm text-cyan-300 mt-0.5">@3iAtlas</div>
              </div>
            </a>
          </div>

          <div className="mt-10 pt-8 border-t border-white/8">
            <p className="text-white/30 text-xs leading-relaxed">
              3i-Atlas is an independent game project by Andrew Gray. Response times may vary — but we do our best to reply within a few days.
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
}