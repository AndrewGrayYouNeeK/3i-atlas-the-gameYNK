import { useEffect, useRef } from 'react';
import { CampaignEngine } from '../../game/campaign/engine.js';

export default function CampaignCanvas({
  levelId,
  difficulty = 'medium',
  skin = 'default',
  engineOptions = {},
  onDetectionChange,
  onScoreChange,
  onLevelComplete,
  onGameOver,
  onHud,
  engineRef,
  paused,
}) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frameId = 0;
    let engine;
    let resizeObserver;

    const syncCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || window.innerWidth));
      const height = Math.max(1, Math.round(rect.height || window.innerHeight));
      const ratio = Math.min(window.devicePixelRatio || 1, width < 900 ? 1.5 : 1.75);
      const bw = Math.round(width * ratio);
      const bh = Math.round(height * ratio);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
        gameRef.current?.resize();
      }
      return { width, height };
    };

    const handleKey = (e) => {
      if (!engine) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      engine.handleKey(e.key, e.type === 'keydown');
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };

    const boot = () => {
      const { width, height } = syncCanvasSize();
      if (width < 2 || height < 2) {
        frameId = requestAnimationFrame(boot);
        return;
      }
      engine = new CampaignEngine(canvas, levelId, difficulty, skin, engineOptions);
      engine.onDetectionChange = onDetectionChange;
      engine.onScoreChange = onScoreChange;
      engine.onLevelComplete = onLevelComplete;
      engine.onGameOver = onGameOver;
      engine.onHud = onHud;
      gameRef.current = engine;
      if (engineRef) engineRef.current = engine;
      if (!paused) engine.start();
    };

    frameId = requestAnimationFrame(boot);
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => syncCanvasSize());
      resizeObserver.observe(canvas);
    }
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      engine?.stop();
      if (engineRef) engineRef.current = null;
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, [levelId, difficulty, skin]);

  useEffect(() => {
    const engine = gameRef.current;
    if (!engine) return;
    if (paused) engine.pause();
    else engine.resume();
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
