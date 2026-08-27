import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Crown } from 'lucide-react';
import { api } from '@/api/supabaseApi';
import { LEVELS } from '../game/constants.js';

const getStealthRating = (detection) => {
  if (detection < 5) return 'S';
  if (detection < 15) return 'A';
  if (detection < 35) return 'B';
  return 'C';
};

export default function Leaderboard({ onBack }) {
  const [scores, setScores] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const pullDistance = useRef(0);

  useEffect(() => { loadScores(); }, []);

  const loadScores = async () => {
    try {
      const all = await api.entities.ScoreEntry.list('-score', 100);
      setScores(all || []);
    } catch (err) {
      console.warn('Leaderboard load failed:', err);
      setScores([]);
    }
  };

  const handleTouchStart = (e) => {
    if ((containerRef.current?.scrollTop || 0) > 0) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if ((containerRef.current?.scrollTop || 0) > 0 || touchStartY.current === 0) return;
    pullDistance.current = e.touches[0].clientY - touchStartY.current;
  };

  const handleTouchEnd = async () => {
    if (pullDistance.current > 70 && !refreshing) {
      setRefreshing(true);
      await loadScores();
      setRefreshing(false);
    }
    touchStartY.current = 0;
    pullDistance.current = 0;
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(20,60,120,0.35) 0%, rgba(1,1,12,1) 60%)' }}>
      <div className="flex items-center gap-4 px-4 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div>
          <h1 className="font-orbitron text-lg font-bold text-white tracking-wider">GLOBAL LEADERBOARD</h1>
          <p className="text-[11px] text-white/30">Top pilots across all runs</p>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-2">
        {refreshing && <div className="py-2 text-center font-orbitron text-[10px] text-sky-300">REFRESHING...</div>}
        {scores.map((entry, index) => (
          <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-8 text-center">
              {index < 3 ? <Crown className="w-4 h-4 mx-auto" style={{ color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#cd7c2e' }} /> : <span className="font-orbitron text-xs text-white/35">#{index + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-orbitron text-xs text-white truncate">{entry.display_name || entry.user_email?.split('@')[0] || 'Pilot'}</div>
              <div className="text-[9px] text-white/35 mt-1">{LEVELS[entry.level_id]?.name || 'Unknown Sector'}</div>
            </div>
            <div className="text-right">
              <div className="font-orbitron text-sm text-white">{entry.score?.toLocaleString()}</div>
              <div className="text-[9px] text-white/40">{(entry.detection_pct || 0).toFixed(1)}% · {getStealthRating(entry.detection_pct || 0)}</div>
            </div>
          </motion.div>
        ))}
        {!scores.length && <div className="py-16 text-center"><Trophy className="w-10 h-10 mx-auto text-white/10 mb-3" /><div className="font-orbitron text-xs text-white/25">No scores yet</div></div>}
      </div>
    </div>
  );
}