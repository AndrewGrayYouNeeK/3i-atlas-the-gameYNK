import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, BookOpen, ChevronRight, ShoppingCart, Trophy, Zap, Orbit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LEVELS, DIFFICULTIES } from '../game/constants.js';
import { getDailyChallenge } from '../game/dailyChallenge.js';
import AchievementsPanel from '../components/menu/AchievementsPanel.jsx';
import SkinSelector from '../components/menu/SkinSelector.jsx';
import CometLogo from '../components/menu/CometLogo.jsx';
import { api } from '@/api/supabaseApi';

const TUTORIAL_STEPS = [
  {
    icon: '🎮',
    title: 'Movement',
    desc: 'WASD or Arrow Keys to steer Atlas through space. On mobile, use the on-screen joystick.',
    tip: 'Move slowly to stay undetected',
  },
  {
    icon: '⚡',
    title: 'Speed Control',
    desc: 'Hold SHIFT for burst speed. Hold CTRL to slow down. Speed directly raises detection rate.',
    tip: 'Creep through scan zones — never burst near probes',
  },
  {
    icon: '🌿',
    title: 'Gas Release',
    desc: 'Q = Methane (optical cloak), E = Ammonia (radar jam), R = Xenon (heat mask). 3 charges each.',
    tip: 'Gas charges are finite — use them wisely',
  },
  {
    icon: '👁',
    title: 'Three Eyes',
    desc: 'Press 1 = Night Vision, 2 = Heat Scan, 3 = Myth Mode (slow time, 20s cooldown).',
    tip: 'Myth Mode is your panic button',
  },
  {
    icon: '📡',
    title: 'Detection Bar',
    desc: 'Keep detection below 5% to win stealth bonus. Hit 100% and your cover is blown permanently.',
    tip: 'Stay safe — the bar never forgives',
  },
  {
    icon: '🎯',
    title: 'Objectives',
    desc: 'Complete all mission waypoints per level. Staying below 5% detection unlocks secret Atlas lore.',
    tip: 'Follow the green arrows to waypoints',
  },
];

const LEVEL_COLORS = ['#7c3aed', '#0ea5e9', '#dc2626', '#059669', '#f97316', '#2563eb', '#eab308', '#ff6600'];
const LEVEL_ICONS = ['❄️', '🪐', '🔴', '🌍', '☁️', '🔵', '☀️', '🔥'];
const DIFFICULTY = ['EASY', 'MEDIUM', 'HARD', 'EXTREME', 'EXTREME', 'EXTREME', 'EXTREME', 'EXTREME'];
const DIFF_COLORS = ['text-emerald-400', 'text-amber-400', 'text-orange-400', 'text-red-400', 'text-red-400', 'text-red-400', 'text-red-400'];

export default function MainMenu({ onStartGame }) {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [achievements, setAchievements] = useState([]);
  const [ownedSkins, setOwnedSkins] = useState(['default']);
  const [selectedSkin, setSelectedSkin] = useState('default');
  const [profileId, setProfileId] = useState(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    api.auth.me().then(async (me) => {
      if (!me) return;
      const profiles = await api.entities.PlayerProfile.filter({ user_email: me.email });
      const profile = profiles?.[0];
      if (profile) {
        setOwnedSkins(profile.owned_skins || ['default']);
        setSelectedSkin(profile.selected_skin || 'default');
        setProfileId(profile.id);
      }
      const items = (profile?.achievements || []).map((id) => ({
        id,
        name: id === 'perfect_stealth' ? 'Perfect Stealth' : id === 'five_missions' ? 'Five Missions' : 'Top 10',
        description: id === 'perfect_stealth' ? 'Finish a run under 5% detection.' : id === 'five_missions' ? 'Complete five missions.' : 'Reach the top 10 leaderboard.',
      }));
      setAchievements(items);
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 350 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() < 0.05 ? Math.random() * 2 + 1 : Math.random() * 0.8 + 0.2,
      s: Math.random() * 0.015 + 0.003, o: Math.random() * Math.PI * 2,
      col: Math.random() < 0.08 ? '#ffd0a0' : Math.random() < 0.08 ? '#a8c8ff' : '#ffffff',
    }));

    // Drifting comet trails
    const comets = Array.from({ length: 4 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: 0.15 + Math.random() * 0.2, vy: (Math.random() - 0.5) * 0.1,
      trail: [], life: Math.random(),
      col: ['rgba(180,100,255,', 'rgba(100,200,255,', 'rgba(255,200,100,'][Math.floor(Math.random() * 3)],
    }));

    let t = 0;
    const draw = () => {
      t++;
      ctx.fillStyle = 'rgba(1,1,12,0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (const s of stars) {
        const f = 0.5 + 0.5 * Math.sin(t * s.s + s.o);
        const a = f * (s.r > 1 ? 0.9 : 0.6);
        const col = s.col === '#ffd0a0' ? `rgba(255,208,160,${a})` : s.col === '#a8c8ff' ? `rgba(168,200,255,${a})` : `rgba(255,255,255,${a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        if (s.r > 1) {
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.3})`; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(s.x - s.r * 3, s.y); ctx.lineTo(s.x + s.r * 3, s.y);
          ctx.moveTo(s.x, s.y - s.r * 3); ctx.lineTo(s.x, s.y + s.r * 3); ctx.stroke();
        }
      }

      // Comets
      for (const c of comets) {
        c.x += c.vx; c.y += c.vy;
        c.trail.push({ x: c.x, y: c.y });
        if (c.trail.length > 40) c.trail.shift();
        if (c.x > canvas.width + 50) { c.x = -50; c.y = Math.random() * canvas.height; c.trail = []; }
        for (let i = 1; i < c.trail.length; i++) {
          const prog = i / c.trail.length;
          ctx.beginPath(); ctx.moveTo(c.trail[i-1].x, c.trail[i-1].y); ctx.lineTo(c.trail[i].x, c.trail[i].y);
          ctx.strokeStyle = c.col + (prog * 0.5) + ')'; ctx.lineWidth = prog * 2.5; ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    ctx.fillStyle = '#01010c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const selectedLvl = LEVELS[selectedLevel];
  const daily = getDailyChallenge();

  return (
    <div className="relative w-screen h-screen overflow-x-hidden overflow-y-auto overscroll-none font-exo" style={{ background: '#01010c' }}>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Radial vignette */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, background: 'radial-gradient(ellipse at 50% 100%, transparent 40%, rgba(0,0,8,0.7) 100%)' }} />

      <div className="relative z-20 min-h-full flex flex-col items-center justify-start px-4 gap-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 7rem)' }}>

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          {/* Logo */}
          <motion.div
            className="mx-auto mb-4 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CometLogo size={200} />
          </motion.div>

          <div className="text-xs tracking-widest mt-1 mb-1" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'Exo 2', sans-serif" }}>
            by <span style={{ color: 'rgba(200,180,255,0.45)' }}>Andrew Gray</span>
          </div>
          <p className="text-sm text-white/35 mt-2 max-w-xs mx-auto leading-relaxed">
            An alien vessel disguised as a comet. One chance to cross the solar system undetected. Don't act like a ship.
          </p>
        </motion.div>

        {/* ── LEVEL SELECT ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-xl mb-6"
        >
          <div className="font-orbitron text-[11px] text-white/25 tracking-[0.3em] text-center mb-3">
            SELECT MISSION
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {LEVELS.map((level, i) => (
              <motion.button
                key={level.id}
                onClick={() => setSelectedLevel(i)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className={`relative p-3 rounded-2xl border text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                  ${selectedLevel === i
                    ? 'border-violet-500/70 bg-violet-900/30'
                    : 'border-white/8 bg-white/4 hover:border-white/18 hover:bg-white/6'
                  }`}
                style={selectedLevel === i ? { boxShadow: `0 0 20px ${LEVEL_COLORS[i]}40, 0 4px 20px rgba(0,0,0,0.4)` } : { boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
              >
                <div className="text-base mb-1.5">{LEVEL_ICONS[i]}</div>
                <div className="font-orbitron text-[12px] text-white/35 mb-0.5">LVL {i + 1}</div>
                <div className="font-orbitron text-[10px] font-bold text-white leading-tight">{level.name}</div>
                <div className={`font-orbitron text-[12px] mt-1.5 ${DIFF_COLORS[i]}`}>{DIFFICULTY[i]}</div>
                {selectedLevel === i && (
                  <motion.div
                    className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-violet-400"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Selected level description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedLevel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-3 px-4 py-2.5 rounded-xl border border-white/6 bg-white/3"
            >
              <div className="text-[11px] text-white/45 leading-relaxed">{selectedLvl.description}</div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── DIFFICULTY SELECT ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-xl mb-5"
        >
          <div className="font-orbitron text-[11px] text-white/25 tracking-[0.3em] text-center mb-3">
            DIFFICULTY
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(DIFFICULTIES).map((d) => (
              <motion.button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="relative p-3 rounded-2xl border text-center transition-all duration-200 outline-none"
                style={{
                  borderColor: difficulty === d.id ? d.borderColor : 'rgba(255,255,255,0.08)',
                  background: difficulty === d.id ? d.bg : 'rgba(255,255,255,0.03)',
                  boxShadow: difficulty === d.id ? `0 0 18px ${d.glow}, 0 4px 16px rgba(0,0,0,0.4)` : '0 2px 12px rgba(0,0,0,0.3)',
                }}
              >
                <div className="font-orbitron text-xs font-bold mb-1" style={{ color: difficulty === d.id ? d.color : 'rgba(255,255,255,0.5)' }}>
                  {d.label}
                </div>
                <div className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Exo 2', sans-serif" }}>
                  {d.description}
                </div>
                {difficulty === d.id && (
                  <motion.div
                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                    style={{ background: d.color }}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── GAME MODES ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="w-full max-w-xl mb-5"
        >
          <div className="font-orbitron text-[11px] text-white/25 tracking-[0.3em] text-center mb-3">
            GAME MODES
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <motion.button
              onClick={() => navigate(`/game?level=0&difficulty=${difficulty}&skin=${selectedSkin}&mode=solar_run`)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="p-4 rounded-2xl border text-left transition-all"
              style={{ borderColor: 'rgba(251,191,36,0.45)', background: 'rgba(251,191,36,0.08)', boxShadow: '0 0 20px rgba(251,191,36,0.15)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Orbit className="w-4 h-4 text-amber-400" />
                <span className="font-orbitron text-xs font-bold text-amber-300">SOLAR RUN</span>
              </div>
              <p className="text-[10px] text-white/45 leading-relaxed">All {LEVELS.length} missions in one epic voyage from the Kuiper Belt to the Sun.</p>
            </motion.button>
            <motion.button
              onClick={() => navigate(`/game?level=${daily.levelId}&difficulty=${daily.difficulty}&skin=${selectedSkin}&mode=daily`)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="p-4 rounded-2xl border text-left transition-all"
              style={{ borderColor: 'rgba(52,211,153,0.45)', background: 'rgba(52,211,153,0.08)', boxShadow: '0 0 20px rgba(52,211,153,0.15)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="font-orbitron text-xs font-bold text-emerald-300">DAILY CHALLENGE</span>
              </div>
              <p className="text-[10px] text-white/45 leading-relaxed">
                {daily.level.name} · {daily.difficultyDef.label} · {daily.bonusLabel}
              </p>
            </motion.button>
          </div>
        </motion.div>

        {/* ── SKIN SELECTOR ── */}
        <SkinSelector
          ownedSkins={ownedSkins}
          selectedSkin={selectedSkin}
          onSelect={async (skinId) => {
            setSelectedSkin(skinId);
            if (profileId) {
              await api.entities.PlayerProfile.update(profileId, { selected_skin: skinId });
            }
          }}
        />

        {/* ── ACTIONS ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-3 w-full"
        >
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl justify-center items-stretch">
            <motion.button
              onClick={() => { setTutorialStep(0); setShowTutorial(true); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-3 rounded-2xl border border-white/12 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 font-orbitron text-xs tracking-wider transition-all duration-200 outline-none"
            >
              <BookOpen className="w-3.5 h-3.5" />
              HOW TO PLAY
            </motion.button>

            <motion.button
              onClick={() => navigate(`/game?level=${selectedLevel}&difficulty=${difficulty}&skin=${selectedSkin}&mode=mission`)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-1 justify-center items-center gap-3 px-8 py-4 rounded-2xl font-orbitron text-base font-bold text-white tracking-wider transition-all duration-200 outline-none"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                boxShadow: '0 0 32px rgba(140,80,255,0.7), 0 4px 20px rgba(0,0,0,0.5)',
                minHeight: '56px',
              }}
            >
              <Play className="w-5 h-5 fill-white" />
              BEGIN MISSION
              <ChevronRight className="w-5 h-5 opacity-70" />
            </motion.button>
          </div>

          {/* Secondary nav */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl justify-center">
            <motion.button
              onClick={() => navigate('/leaderboard')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-3 rounded-2xl border font-orbitron text-xs tracking-wider transition-all"
              style={{ borderColor: 'rgba(14,165,233,0.6)', background: 'rgba(14,165,233,0.18)', color: '#38bdf8', boxShadow: '0 0 16px rgba(14,165,233,0.3), 0 4px 16px rgba(0,0,0,0.4)' }}
            >
              <Trophy className="w-4 h-4" />
              LEADERBOARD
            </motion.button>
            <motion.button
              onClick={() => navigate('/store')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-3 rounded-2xl border font-orbitron text-xs tracking-wider transition-all"
              style={{ borderColor: 'rgba(124,58,237,0.6)', background: 'rgba(124,58,237,0.18)', color: '#c4b5fd', boxShadow: '0 0 16px rgba(124,58,237,0.3), 0 4px 16px rgba(0,0,0,0.4)' }}
            >
              <ShoppingCart className="w-4 h-4" />
              STORE
            </motion.button>
          </div>
        </motion.div>

        <div className="w-full max-w-xl mt-4 mb-6">
          <AchievementsPanel achievements={achievements} />
        </div>

        {/* Bottom hint bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 mb-2 flex flex-wrap items-center justify-center gap-4 px-4"
        >
          {[
            { icon: '⌨', label: 'WASD MOVE' },
            { icon: '⇧', label: 'SHIFT BURST' },
            { icon: 'Q', label: 'GAS RELEASE' },
            { icon: '1', label: 'VISION MODES' },
          ].map(h => (
            <div key={h.label} className="flex items-center gap-1.5">
              <span className="font-orbitron text-[8px] px-1.5 py-0.5 rounded bg-white/8 border border-white/12 text-white/50">{h.icon}</span>
              <span className="font-orbitron text-[8px] text-white/25 tracking-wider hidden sm:block">{h.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── TUTORIAL MODAL ── */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,10,0.88)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowTutorial(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{ background: 'rgba(12,8,28,0.98)', border: '1px solid rgba(140,80,255,0.25)', boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(100,60,200,0.15)' }}
            >
              {/* Progress bar */}
              <div className="h-0.5 bg-white/8">
                <motion.div
                  className="h-full bg-violet-500"
                  animate={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="font-orbitron text-[9px] text-violet-400/70 tracking-[0.3em]">
                    HOW TO PLAY
                  </div>
                  <div className="font-orbitron text-[9px] text-white/30">
                    {tutorialStep + 1} / {TUTORIAL_STEPS.length}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={tutorialStep}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="text-3xl mb-4">{TUTORIAL_STEPS[tutorialStep].icon}</div>
                    <h3 className="font-orbitron text-xl font-bold text-white mb-2">
                      {TUTORIAL_STEPS[tutorialStep].title}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed mb-4">
                      {TUTORIAL_STEPS[tutorialStep].desc}
                    </p>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-900/30 border border-violet-500/20">
                      <span className="text-violet-400 text-xs">💡</span>
                      <span className="text-xs text-violet-300/80 italic">{TUTORIAL_STEPS[tutorialStep].tip}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                    disabled={tutorialStep === 0}
                    className="flex-1 py-3 rounded-2xl border border-white/10 font-orbitron text-xs text-white/40 disabled:opacity-20 hover:bg-white/5 transition-all duration-200"
                  >
                    PREV
                  </button>
                  {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                    <button
                      onClick={() => setTutorialStep(tutorialStep + 1)}
                      className="flex-2 flex-grow py-3 rounded-2xl font-orbitron text-xs text-white transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 4px 16px rgba(100,60,200,0.4)' }}
                    >
                      NEXT →
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowTutorial(false)}
                      className="flex-2 flex-grow py-3 rounded-2xl font-orbitron text-xs text-white transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 16px rgba(5,150,105,0.4)' }}
                    >
                      LET'S GO ✓
                    </button>
                  )}
                </div>

                {/* Dot indicators */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTutorialStep(i)}
                      className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-200 ${i === tutorialStep ? '' : ''}`}
                    >
                      <span className={`rounded-full transition-all duration-200 ${i === tutorialStep ? 'w-4 h-1.5 bg-violet-400' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}