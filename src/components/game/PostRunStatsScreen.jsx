import { motion } from 'framer-motion';

const getStealthGrade = (detection) => {
  if (detection < 5) return 'S';
  if (detection < 15) return 'A';
  if (detection < 35) return 'B';
  return 'C';
};

export default function PostRunStatsScreen({ stats, onPlayAgain, onNextLevel, onMainMenu, isLastLevel, nextLabel }) {
  const grade = getStealthGrade(stats?.detection || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(14px)', background: 'rgba(4,2,14,0.9)' }}
    >
      <motion.div
        initial={{ y: 30, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        className="w-full max-w-md rounded-3xl p-6"
        style={{ background: 'rgba(8,4,20,0.98)', border: '1px solid rgba(167,139,250,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.9)' }}
      >
        <div className="font-orbitron text-[9px] tracking-[0.35em] text-center mb-2" style={{ color: 'rgba(167,139,250,0.7)' }}>RUN REPORT</div>
        <h2 className="font-orbitron text-2xl text-center text-white mb-6">Mission Debrief</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            ['Score', stats?.score?.toLocaleString() || '0'],
            ['Detection', `${(stats?.detection || 0).toFixed(1)}%`],
            ['Stealth', grade],
            ['Gas Used', String(stats?.gasUsed || 0)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="font-orbitron text-lg text-white">{value}</div>
              <div className="font-orbitron text-[8px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}>
          <div className="font-orbitron text-[9px] mb-1" style={{ color: '#c4b5fd' }}>Stealth Rating</div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {grade === 'S' ? 'Perfect ghost run.' : grade === 'A' ? 'Excellent covert control.' : grade === 'B' ? 'Mission complete, but risky.' : 'Visible and vulnerable.'}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={onPlayAgain} className="w-full py-3 rounded-2xl font-orbitron text-sm text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>PLAY AGAIN</button>
          {!isLastLevel && <button onClick={() => onNextLevel()} className="w-full py-3 rounded-2xl font-orbitron text-sm" style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#38bdf8' }}>{nextLabel || 'NEXT LEVEL'}</button>}
          {isLastLevel && <button onClick={() => onNextLevel('endgame')} className="w-full py-3 rounded-2xl font-orbitron text-sm" style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#38bdf8' }}>GHOST EARTH</button>}
          <button onClick={onMainMenu} className="w-full py-3 rounded-2xl font-orbitron text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>MAIN MENU</button>
        </div>
      </motion.div>
    </motion.div>
  );
}