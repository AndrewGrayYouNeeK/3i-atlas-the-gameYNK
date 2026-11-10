import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 overflow-y-auto font-exo" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(60,10,120,0.4) 0%, rgba(1,1,12,1) 60%)' }}>
      <div className="max-w-2xl mx-auto px-5 py-10" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)' }}>

        <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-8 text-white/50 hover:text-white/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-orbitron text-xs tracking-wider">BACK</span>
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="font-orbitron text-[11px] tracking-[0.35em] text-violet-400/70 mb-3">LEGAL</div>

          <h1 className="font-orbitron text-3xl sm:text-4xl font-black text-white mb-2" style={{ textShadow: '0 0 30px rgba(140,80,255,0.7)' }}>
            Privacy Policy
          </h1>

          <div className="w-16 h-0.5 mb-8" style={{ background: 'linear-gradient(90deg, #7c3aed, transparent)' }} />

          <p className="text-white/40 text-xs mb-8">Last updated: 10 November 2026 · Applies to 3I/ATLAS on the web and native apps</p>

          <div className="space-y-6 text-white/55 text-sm leading-relaxed">
            <section>
              <h2 className="font-orbitron text-xs tracking-widest text-white/80 mb-2">WHO WE ARE</h2>
              <p>
                3I/ATLAS (“the Game”) is an independent game by Andrew Gray / YouNeeK.
                Contact: <a className="text-violet-300 hover:text-violet-200" href="mailto:hello@3iatlas.com">hello@3iatlas.com</a>.
                Website: <a className="text-violet-300 hover:text-violet-200" href="https://3iatlasgame.xyz">https://3iatlasgame.xyz</a>.
              </p>
            </section>

            <section>
              <h2 className="font-orbitron text-xs tracking-widest text-white/80 mb-2">WHAT THE GAME NEEDS</h2>
              <p>
                The core single-player campaign runs entirely on your device. Game assets are bundled with the app
                (or served as a static website). You do not need an account to play.
              </p>
            </section>

            <section>
              <h2 className="font-orbitron text-xs tracking-widest text-white/80 mb-2">OPTIONAL ACCOUNT &amp; ONLINE FEATURES</h2>
              <p className="mb-2">
                If you create an account (email/password or a supported sign-in provider), we store the information
                needed to run optional online features via Supabase:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-white/50">
                <li>Email address and display name</li>
                <li>Gameplay scores, achievements, and profile progress</li>
                <li>Purchased cosmetic skins (if you use the store)</li>
              </ul>
              <p className="mt-2">
                These features are optional. If Supabase is unavailable or you stay signed out, the Game still works offline.
              </p>
            </section>

            <section>
              <h2 className="font-orbitron text-xs tracking-widest text-white/80 mb-2">PAYMENTS</h2>
              <p>
                Optional in-app purchases (cosmetic skins) are processed by Stripe. We do not store full payment card
                numbers on our servers. Stripe’s privacy policy applies to payment processing.
              </p>
            </section>

            <section>
              <h2 className="font-orbitron text-xs tracking-widest text-white/80 mb-2">DEVICE STORAGE</h2>
              <p>
                The Game may use on-device storage (for example localStorage or equivalent) to remember session state,
                UI preferences, and similar settings. This data stays on your device unless you sync an optional account.
              </p>
            </section>

            <section>
              <h2 className="font-orbitron text-xs tracking-widest text-white/80 mb-2">TRACKING &amp; ADS</h2>
              <p>
                We do not use third-party advertising SDKs, do not sell personal data, and do not track you across other
                companies’ apps or websites for advertising.
              </p>
            </section>

            <section>
              <h2 className="font-orbitron text-xs tracking-widest text-white/80 mb-2">CHILDREN</h2>
              <p>
                The Game is a science-fiction stealth title with no mature content targeting children. We do not knowingly
                collect personal information from children under 13. If you believe a child has provided account data,
                contact us and we will delete it.
              </p>
            </section>

            <section>
              <h2 className="font-orbitron text-xs tracking-widest text-white/80 mb-2">YOUR CHOICES</h2>
              <p>
                You can play without an account. To delete an account or request deletion of associated scores/profile
                data, email <a className="text-violet-300 hover:text-violet-200" href="mailto:hello@3iatlas.com">hello@3iatlas.com</a>.
              </p>
            </section>

            <section>
              <h2 className="font-orbitron text-xs tracking-widest text-white/80 mb-2">CHANGES</h2>
              <p>
                We may update this policy when features change. The “Last updated” date above will change when we do.
                Continued use of the Game after an update means you accept the revised policy.
              </p>
            </section>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
