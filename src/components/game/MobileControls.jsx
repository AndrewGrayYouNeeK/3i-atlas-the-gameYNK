import { useRef, useEffect } from 'react';
import { Zap, Snail } from 'lucide-react';

export default function MobileControls({ engineRef }) {
  const joystickRef = useRef(null);
  const knobRef = useRef(null);
  const joystickActive = useRef(false);
  const joystickTouchId = useRef(null);
  const joystickStart = useRef({ x: 0, y: 0 });
  const maxDist = 44;

  useEffect(() => {
    const joystick = joystickRef.current;
    const knob = knobRef.current;
    if (!joystick || !knob) return;

    const onStart = (e) => {
      e.preventDefault();
      if (joystickActive.current) return;
      const touch = e.changedTouches[0];
      joystickTouchId.current = touch.identifier;
      const rect = joystick.getBoundingClientRect();
      joystickStart.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      joystickActive.current = true;
    };

    const onMove = (e) => {
      e.preventDefault();
      if (!joystickActive.current) return;
      let touch = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId.current) {
          touch = e.changedTouches[i];
          break;
        }
      }
      if (!touch) return;
      let dx = touch.clientX - joystickStart.current.x;
      let dy = touch.clientY - joystickStart.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      if (engineRef?.current) engineRef.current.setJoystick({ active: true, dx: dx / maxDist, dy: dy / maxDist });
    };

    const onEnd = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId.current) {
          joystickActive.current = false;
          joystickTouchId.current = null;
          knob.style.transform = 'translate(0px, 0px)';
          if (engineRef?.current) engineRef.current.setJoystick({ active: false, dx: 0, dy: 0 });
          break;
        }
      }
    };

    joystick.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: false });
    window.addEventListener('touchcancel', onEnd, { passive: false });

    return () => {
      joystick.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [engineRef]);

  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-5 pointer-events-none z-20 md:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
      {/* Left: Joystick */}
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        <div
          ref={joystickRef}
          className="w-32 h-32 rounded-full flex items-center justify-center relative select-none"
          style={{
            background: 'rgba(5,5,22,0.6)',
            border: '2px solid rgba(124,58,237,0.35)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(124,58,237,0.15)',
          }}
        >
          {/* Guide rings */}
          <div className="absolute inset-3 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
          <div
            ref={knobRef}
            className="w-14 h-14 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 35%, rgba(167,139,250,0.9), rgba(124,58,237,0.8))',
              border: '2px solid rgba(167,139,250,0.7)',
              boxShadow: '0 0 18px rgba(124,58,237,0.7)',
              willChange: 'transform',
              touchAction: 'none',
            }}
          />
        </div>
        <div className="font-orbitron text-[8px] tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>MOVE</div>
      </div>

      {/* Right: Speed buttons */}
      <div className="pointer-events-auto flex flex-col gap-3 items-center">
        <button
          onTouchStart={(e) => { e.preventDefault(); engineRef?.current?.setSpeed('burst'); }}
          onMouseDown={() => engineRef?.current?.setSpeed('burst')}
          className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-90 select-none"
          style={{
            background: 'rgba(124,58,237,0.35)',
            border: '2px solid rgba(167,139,250,0.5)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 16px rgba(124,58,237,0.3)',
            touchAction: 'manipulation',
          }}
        >
          <Zap className="w-6 h-6 text-violet-300" />
          <span className="font-orbitron text-[7px] text-violet-300/70">BURST</span>
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); engineRef?.current?.setSpeed('slow'); }}
          onMouseDown={() => engineRef?.current?.setSpeed('slow')}
          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-90 select-none"
          style={{
            background: 'rgba(14,165,233,0.2)',
            border: '2px solid rgba(56,189,248,0.4)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 12px rgba(14,165,233,0.2)',
            touchAction: 'manipulation',
          }}
        >
          <Snail className="w-5 h-5 text-sky-300" />
          <span className="font-orbitron text-[7px] text-sky-300/70">SLOW</span>
        </button>
      </div>
    </div>
  );
}