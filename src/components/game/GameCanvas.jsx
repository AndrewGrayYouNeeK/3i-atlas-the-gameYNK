import { useEffect, useRef } from 'react';
import { GameEngine } from '../../game/gameEngine.js';


export default function GameCanvas({ levelId, difficulty = 'medium', skin = 'default', onDetectionChange, onGasChange, onScoreChange,
  onLevelComplete, onGameOver, onObjectiveUpdate, activeGas, activeEye,
  engineRef, paused }) {

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
      const width = Math.max(1, Math.round(rect.width || canvas.parentElement?.getBoundingClientRect().width || window.innerWidth));
      const height = Math.max(1, Math.round(rect.height || canvas.parentElement?.getBoundingClientRect().height || window.innerHeight));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        if (gameRef.current) gameRef.current.resize(width, height);
      }

      return { width, height };
    };

    const handleKey = (e) => {
      if (!engine) return;
      engine.handleKey(e.key, e.type === 'keydown');
      if (e.type === 'keydown') {
        if (e.key === 'q' || e.key === 'Q') engine.activateGas('methane');
        if (e.key === 'e' || e.key === 'E') engine.activateGas('ammonia');
        if (e.key === 'r' || e.key === 'R') engine.activateGas('xenon');
        if (e.key === '1') engine.activateEye('night');
        if (e.key === '2') engine.activateEye('heat');
        if (e.key === '3') engine.activateEye('myth');
      }
    };

    const boot = () => {
      const { width, height } = syncCanvasSize();
      if (width < 2 || height < 2) {
        frameId = requestAnimationFrame(boot);
        return;
      }

      engine = new GameEngine(canvas, levelId, difficulty, skin);
      engine.onDetectionChange = onDetectionChange;
      engine.onGasChange = onGasChange;
      engine.onScoreChange = onScoreChange;
      engine.onLevelComplete = onLevelComplete;
      engine.onGameOver = onGameOver;
      engine.onObjectiveUpdate = onObjectiveUpdate;

      gameRef.current = engine;
      if (engineRef) engineRef.current = engine;
      engine.start();
    };

    frameId = requestAnimationFrame(boot);

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => syncCanvasSize());
      resizeObserver.observe(canvas);
      if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    }

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    window.addEventListener('resize', syncCanvasSize);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      if (engine) engine.stop();
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [levelId, difficulty, skin]);

  useEffect(() => {
    if (!gameRef.current) return;
    if (paused) gameRef.current.pause();
    else gameRef.current.resume();
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}