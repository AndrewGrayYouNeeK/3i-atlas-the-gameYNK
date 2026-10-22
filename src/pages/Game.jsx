import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CampaignCanvas from '../components/game/CampaignCanvas.jsx';
import CampaignHUD from '../components/game/CampaignHUD.jsx';
import CampaignControls from '../components/game/CampaignControls.jsx';
import BriefingScreen from '../components/game/BriefingScreen.jsx';
import GameOverScreen from '../components/game/GameOverScreen.jsx';
import PostRunStatsScreen from '../components/game/PostRunStatsScreen.jsx';
import PauseMenu from '../components/game/PauseMenu.jsx';
import EndgameScreen from '../components/game/EndgameScreen.jsx';
import { LEVELS, getCraft } from '../game/constants.js';
import { getDailyChallenge } from '../game/dailyChallenge.js';
import { api } from '@/api/supabaseApi';

export default function Game({ levelId: initialLevel = 0, difficulty = 'medium', skin = 'default', mode = 'mission', onMainMenu, totalScoreRef }) {
  const dailyChallenge = useMemo(() => (mode === 'daily' ? getDailyChallenge() : null), [mode]);
  const engineOptions = useMemo(() => ({
    mode,
    threatBonus: dailyChallenge?.threatBonus || 0,
    scanMult: dailyChallenge?.scanMult || 1,
    gasPenalty: dailyChallenge?.gasPenalty || 0,
  }), [mode, dailyChallenge]);

  const [levelId, setLevelId] = useState(() => Math.max(0, Math.min(LEVELS.length - 1, initialLevel || 0)));
  const [gameKey, setGameKey] = useState(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(totalScoreRef?.current || 0);
  const [hud, setHud] = useState(null);
  const [postRunStats, setPostRunStats] = useState(null);
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState('briefing');
  const [gameOverReason, setGameOverReason] = useState('detected');
  const engineRef = useRef(null);
  const stage = LEVELS[levelId];

  useEffect(() => {
    const next = Math.max(0, Math.min(LEVELS.length - 1, initialLevel || 0));
    setLevelId(next);
    setScore(0);
    setHud(null);
    setPostRunStats(null);
    setPaused(false);
    setState('briefing');
    setGameKey((k) => k + 1);
  }, [initialLevel, difficulty]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && state === 'playing') setPaused((p) => !p);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state]);

  const handleScoreChange = useCallback((s) => setScore(s), []);
  const handleHud = useCallback((snapshot) => setHud(snapshot), []);

  const handleLevelComplete = useCallback(async (s, d) => {
    setScore(s);
    const updatedTotal = totalScore + s;
    setTotalScore(updatedTotal);
    if (totalScoreRef) totalScoreRef.current = updatedTotal;
    setPostRunStats({ score: s, detection: d, cover: Math.max(0, 100 - d) });

    try {
      const me = await api.auth.me();
      if (me) {
        const perfect = d < 20;
        await api.entities.ScoreEntry.create({
          user_email: me.email,
          display_name: me.user_metadata?.display_name || me.email.split('@')[0],
          score: s,
          level_id: levelId,
          detection_pct: d,
          perfect_stealth: perfect,
          run_type: mode === 'daily' ? 'daily' : 'timeline',
        });
        const profiles = await api.entities.PlayerProfile.filter({ user_email: me.email });
        if (profiles?.length > 0) {
          const p = profiles[0];
          const nextMissions = (p.missions_completed || 0) + 1;
          const nextPerfect = (p.perfect_stealth_count || 0) + (perfect ? 1 : 0);
          const nextAchievements = Array.isArray(p.achievements) ? [...p.achievements] : [];
          if (perfect && !nextAchievements.includes('perfect_stealth')) nextAchievements.push('perfect_stealth');
          if (nextMissions >= 5 && !nextAchievements.includes('five_missions')) nextAchievements.push('five_missions');
          await api.entities.PlayerProfile.update(p.id, {
            best_score: Math.max(p.best_score || 0, s),
            total_score: (p.total_score || 0) + s,
            missions_completed: nextMissions,
            perfect_stealth_count: nextPerfect,
            achievements: nextAchievements,
          });
        } else {
          await api.entities.PlayerProfile.create({
            user_email: me.email,
            display_name: me.user_metadata?.display_name || me.email.split('@')[0],
            best_score: s,
            total_score: s,
            missions_completed: 1,
            perfect_stealth_count: perfect ? 1 : 0,
            achievements: perfect ? ['perfect_stealth'] : [],
          });
        }
      }
    } catch (err) {
      console.log('Score save error', err);
    }

    setState('level_complete');
  }, [levelId, totalScore, totalScoreRef, mode]);

  const handleGameOver = useCallback((reason) => {
    setGameOverReason(reason || 'detected');
    setState('game_over');
  }, []);

  const handleNextLevel = (dest) => {
    if (dest === 'endgame' || levelId >= LEVELS.length - 1) {
      setState('endgame');
      return;
    }
    const next = levelId + 1;
    setLevelId(next);
    setScore(0);
    setHud(null);
    setPostRunStats(null);
    setPaused(false);
    setState('briefing');
    setGameKey((k) => k + 1);
  };

  const handleRetry = () => {
    setScore(0);
    setHud(null);
    setPaused(false);
    setState('playing');
    setGameKey((k) => k + 1);
  };

  const playing = state === 'playing';

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#01010c' }}>
      {playing && (
        <CampaignCanvas
          key={gameKey}
          levelId={levelId}
          difficulty={difficulty}
          skin={skin}
          engineOptions={engineOptions}
          onScoreChange={handleScoreChange}
          onLevelComplete={handleLevelComplete}
          onGameOver={handleGameOver}
          onHud={handleHud}
          engineRef={engineRef}
          paused={paused}
        />
      )}

      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none">
            <CampaignHUD hud={hud} stage={stage} />
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none" style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md pointer-events-auto" style={{ background: 'rgba(5,5,18,0.72)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="font-orbitron text-[10px] tracking-[0.18em] text-white/40">{stage?.dateLabel}</div>
                <div className="font-orbitron text-[12px] tracking-[0.14em] text-white/80">{stage?.name?.toUpperCase()}</div>
                <button onClick={() => setPaused(true)} className="flex items-center gap-0.5 ml-1 opacity-60 hover:opacity-100" aria-label="Pause">
                  <div className="w-0.5 h-3 rounded-sm bg-white/80" />
                  <div className="w-0.5 h-3 rounded-sm bg-white/80" />
                </button>
              </div>
            </div>
            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-14 pointer-events-none">
              <div className="px-3 py-1 rounded-xl font-orbitron text-[9px] tracking-[0.14em] text-white/35" style={{ background: 'rgba(5,5,18,0.45)' }}>
                WASD STEER · Q DIM · E VENT · R ALIGN · SHIFT BURN · ESC PAUSE
              </div>
            </div>
            <CampaignControls engineRef={engineRef} controls={stage?.controls || []} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state === 'briefing' && (
          <BriefingScreen
            stage={stage}
            index={levelId}
            total={LEVELS.length}
            onEngage={() => { setPaused(false); setState('playing'); setGameKey((k) => k + 1); }}
            onBack={onMainMenu}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paused && playing && (
          <PauseMenu
            onResume={() => setPaused(false)}
            onRestart={handleRetry}
            onMainMenu={onMainMenu}
            craft={getCraft(stage)}
          />
        )}
      </AnimatePresence>

      {state === 'level_complete' && postRunStats && (
        <PostRunStatsScreen
          stats={postRunStats}
          isLastLevel={levelId === LEVELS.length - 1}
          nextLabel={LEVELS[levelId + 1] ? LEVELS[levelId + 1].name.toUpperCase() : undefined}
          onPlayAgain={handleRetry}
          onNextLevel={(dest) => handleNextLevel(dest)}
          onMainMenu={onMainMenu}
        />
      )}

      {state === 'game_over' && (
        <GameOverScreen
          levelId={levelId}
          reason={gameOverReason}
          craft={getCraft(stage)}
          onRetry={handleRetry}
          onMainMenu={onMainMenu}
        />
      )}

      {state === 'endgame' && (
        <EndgameScreen
          totalScore={totalScore + score}
          onRestart={() => {
            setLevelId(0);
            setScore(0);
            setTotalScore(0);
            setHud(null);
            setState('briefing');
            setGameKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
