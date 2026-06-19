import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <div className="fixed left-0 right-0 z-10 flex justify-center pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 56px)' }}>
      <div className="flex items-center gap-4 px-4 py-1.5 rounded-full pointer-events-auto"
        style={{ background: 'rgba(5,5,18,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
        <Link to="/about" className="font-orbitron text-[9px] tracking-widest text-white/30 hover:text-white/60 transition-colors">
          ABOUT
        </Link>
        <span className="text-white/15 text-[9px]">·</span>
        <Link to="/contact" className="font-orbitron text-[9px] tracking-widest text-white/30 hover:text-white/60 transition-colors">
          CONTACT
        </Link>
      </div>
    </div>
  );
}