import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameCanvas from '../components/game/GameCanvas.jsx';
import DetectionHUD from '../components/game/DetectionHUD.jsx';
import DetectionTensionGauge from '../components/game/DetectionTensionGauge.jsx';
import GasSelector from '../components/game/GasSelector.jsx';
import EyePanel from '../components/game/EyePanel.jsx';
import ObjectivesPanel from '../components/game/ObjectivesPanel.jsx';
import MobileControls from '../components/game/MobileControls.jsx';
import SpeedControl from '../components/game/SpeedControl.jsx';
import GameOverScreen from '../components/game/GameOverScreen.jsx';
import EndgameScreen from '../components/game/EndgameScreen.jsx';
import PostRunStatsScreen from '../components/game/PostRunStatsScreen.jsx';
import PauseMenu from '../components/game/PauseMenu.jsx';
import { LEVELS } from '../game/constants.js';
import { api } from '@/api/supabaseApi';

export default function Game({ levelId: initialLevel = 0, difficulty = 'medium', skin = 'default', onMainMenu, totalScoreRef }) {
  const [levelId, setLevelId] = useState(initialLevel);

  useEffect(() => {
    setLevelId(initialLevel);
    setScore(0);
    setDetection(0);
    setObjectives([]);
    setActiveGas(null);
    setPostRunStats(null);
    setPaused(false);
    setState('playing');
    setGameKey(k => k + 1);
  }, [initialLevel, difficulty]);
  const [gameKey, setGameKey] = useState(0);
  const [detection, setDetection] = useState(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(totalScoreRef?.current || 0);
  const [objectives, setObjectives] = useState([]);
  const [postRunStats, setPostRunStats] = useState(null);
  const [activeGas, setActiveGas] = useState(null);
  const [gasCooldowns, setGasCooldowns] = useState({});
  const [activeEye, setActiveEye] = useState(null);
  const [mythCooldown, setMythCooldown] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState('playing'); // playing | level_complete | game_over | endgame

  const engineRef = useRef(null);

  // Keyboard pause
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && state === 'playing') {
        setPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state]);

  // Poll engine state for speed / eye / myth
  useEffect(() => {
    const interval = setInterval(() => {
      const eng = engineRef.current;
      if (!eng) return;
      setSpeed(eng.atlas?.speed || 2);
      setActiveEye(eng.atlas?.eyeMode || null);
      setMythCooldown(eng.mythCooldown || 0);
    }, 100);
    return () => clearInterval(interval);
  }, [gameKey]);

  const handleDetectionChange = useCallback((val) => setDetection(val), []);
  const [gasCharges, setGasCharges] = useState({ methane: 3, ammonia: 3, xenon: 3 });

  const handleGasChange = useCallback((gas, cds, chs) => {
    setActiveGas(gas);
    if (cds) setGasCooldowns({ ...cds });
    if (chs) setGasCharges({ ...chs });
  }, []);

  const calculateGasUsed = () => {
    const current = gasCharges || { methane: 3, ammonia: 3, xenon: 3 };
    return (3 - (current.methane || 0)) + (3 - (current.ammonia || 0)) + (3 - (current.xenon || 0));
  };
  const handleScoreChange = useCallback((s) => setScore(s), []);
  const handleObjectiveUpdate = useCallback((objs) => setObjectives([...objs]), []);

  const handleLevelComplete = useCallback(async (s, d) => {
    setScore(s);
    const gasUsed = calculateGasUsed();
    const updatedTotal = totalScore + s;
    setTotalScore(updatedTotal);
    if (totalScoreRef) totalScoreRef.current = updatedTotal;
    setPostRunStats({ score: s, detection: d, gasUsed });

    try {
      const me = await api.auth.me();
      if (me) {
        const perfect = d < 5;
        await api.entities.ScoreEntry.create({
          user_email: me.email,
          display_name: me.user_metadata?.display_name || me.email.split('@')[0],
          score: s,
          level_id: levelId,
          detection_pct: d,
          perfect_stealth: perfect,
          run_type: 'single_level',
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
    } catch (e) {
      console.log('Score save error', e);
    }

    setState('level_complete');
  }, [levelId, gasCharges, totalScore, totalScoreRef]);

  const [gameOverReason, setGameOverReason] = useState('detected');
  const handleGameOver = useCallback((reason) => { setGameOverReason(reason || 'detected'); setState('game_over'); }, []);

  const activateGas = (gasId) => {
    if (engineRef.current) engineRef.current.activateGas(gasId);
  };

  const activateEye = (eyeId) => {
    if (engineRef.current) engineRef.current.activateEye(eyeId);
  };

  const handleNextLevel = (dest) => {
    if (dest === 'endgame' || levelId >= LEVELS.length - 1) {
      setState('endgame');
      return;
    }
    const next = levelId + 1;
    setTotalScore(ts => ts + score);
    setLevelId(next);
    setScore(0);
    setDetection(0);
    setObjectives([]);
    setActiveGas(null);
    setState('playing');
    setGameKey(k => k + 1);
  };

  const handleRetry = () => {
    setScore(0);
    setDetection(0);
    setObjectives([]);
    setActiveGas(null);
    setState('playing');
    setGameKey(k => k + 1);
  };

  const handleBurst = () => {
    if (engineRef.current) engineRef.current.setSpeed('burst');
  };

  const handleSlow = () => {
    if (engineRef.current) engineRef.current.setSpeed('slow');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#01010c' }}>
      {/* Game Canvas */}
      <div
        className="absolute inset-0"
        style={{ transform: detection > 65 ? `translate(${Math.sin(detection * 0.15) * 1.5}px, ${Math.cos(detection * 0.1) * 1.5}px)` : 'translate(0,0)' }}
      >
      <GameCanvas
        key={gameKey}
        levelId={levelId}
        difficulty={difficulty}
        skin={skin}
        onDetectionChange={handleDetectionChange}
        onGasChange={handleGasChange}
        onScoreChange={handleScoreChange}
        onLevelComplete={handleLevelComplete}
        onGameOver={handleGameOver}
        onObjectiveUpdate={handleObjectiveUpdate}
        engineRef={engineRef}
        paused={paused || state !== 'playing'}
      />
      </div>

      {/* Three.js 3D comet layer removed — 2D canvas comet handles rendering */}

      {/* HUD overlay — only shown during play */}
      <AnimatePresence>
        {state === 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <DetectionHUD detection={detection} score={score} level={levelId} />
            <DetectionTensionGauge detection={detection} />
            <ObjectivesPanel objectives={objectives} levelName={LEVELS[levelId]?.name} />
            <div className="pointer-events-auto">
              <GasSelector activeGas={activeGas} cooldowns={gasCooldowns} charges={gasCharges} onActivate={activateGas} />
              <EyePanel activeEye={activeEye} mythCooldown={mythCooldown} onActivate={activateEye} />
              <SpeedControl speed={speed} onBurst={handleBurst} onSlow={handleSlow} />
            </div>
            <MobileControls engineRef={engineRef} />

            <div className="absolute left-1/2 -translate-x-1/2 top-14 hidden md:block pointer-events-none">
              <div
                className="px-3 py-1.5 rounded-xl backdrop-blur-md font-orbitron text-[10px] tracking-[0.18em]"
                style={{ background: 'rgba(5,5,18,0.58)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.42)' }}
              >
                WASD / ARROWS MOVE · SHIFT BURST · CTRL SLOW · Q E R GAS · 1 2 3 EYES · ESC PAUSE
              </div>
            </div>

            {/* Top center — level name + pause */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none" style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md pointer-events-auto"
                style={{ background: 'rgba(5,5,18,0.72)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="font-orbitron text-[12px] tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {LEVELS[levelId]?.name?.toUpperCase()}
                </div>
                <button
                  onClick={() => setPaused(true)}
                  className="flex items-center gap-0.5 ml-1 opacity-50 hover:opacity-90 transition-opacity"
                  aria-label="Pause"
                >
                  <div className="w-0.5 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.7)' }} />
                  <div className="w-0.5 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.7)' }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <AnimatePresence>
        {paused && state === 'playing' && (
          <PauseMenu
            onResume={() => setPaused(false)}
            onRestart={handleRetry}
            onMainMenu={onMainMenu}
          />
        )}
      </AnimatePresence>

      {state === 'level_complete' && postRunStats && (
        <PostRunStatsScreen
          stats={postRunStats}
          isLastLevel={levelId === LEVELS.length - 1}
          onPlayAgain={handleRetry}
          onNextLevel={() => handleNextLevel()}
          onMainMenu={onMainMenu}
        />
      )}

      {state === 'game_over' && (
        <GameOverScreen
          levelId={levelId}
          reason={gameOverReason}
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
            setDetection(0);
            setObjectives([]);
            setActiveGas(null);
            setState('playing');
            setGameKey(k => k + 1);
          }}
        />
      )}
    </div>
  );
}