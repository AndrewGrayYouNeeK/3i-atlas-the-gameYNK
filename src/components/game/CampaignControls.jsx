import { useEffect, useRef } from 'react';
import { useTouchUi } from '@/lib/touchUi.js';

function hold(engineRef, name) {
  return {
    onPointerDown: (e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      engineRef.current?.setAction(name, true);
    },
    onPointerUp: (e) => {
      e.preventDefault();
      engineRef.current?.setAction(name, false);
    },
    onPointerCancel: () => engineRef.current?.setAction(name, false),
  };
}

export default function CampaignControls({ engineRef, controls = [] }) {
  const joystickRef = useRef(null);
  const knobRef = useRef(null);
  const active = useRef(false);
  const touchId = useRef(null);
  const origin = useRef({ x: 0, y: 0 });
  const maxDist = 46;
  const touchUi = useTouchUi();

  useEffect(() => {
    const joystick = joystickRef.current;
    const knob = knobRef.current;
    if (!joystick || !knob) return;

    const start = (e) => {
      e.preventDefault();
      if (active.current) return;
      const touch = e.changedTouches[0];
      touchId.current = touch.identifier;
      const rect = joystick.getBoundingClientRect();
      origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      active.current = true;
    };
    const move = (e) => {
      if (!active.current) return;
      e.preventDefault();
      let touch = null;
      for (const item of e.changedTouches) {
        if (item.identifier === touchId.current) touch = item;
      }
      if (!touch) return;
      let dx = touch.clientX - origin.current.x;
      let dy = touch.clientY - origin.current.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      engineRef.current?.setJoystick({ active: true, dx: dx / maxDist, dy: dy / maxDist });
    };
    const end = (e) => {
      for (const item of e.changedTouches) {
        if (item.identifier === touchId.current) {
          active.current = false;
          touchId.current = null;
          knob.style.transform = 'translate(0px, 0px)';
          engineRef.current?.setJoystick({ active: false, dx: 0, dy: 0 });
        }
      }
    };
    joystick.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end, { passive: false });
    window.addEventListener('touchcancel', end, { passive: false });
    return () => {
      joystick.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
    };
  }, [engineRef]);

  const button = (control, { showKey }) => (
    <button
      key={control.id}
      type="button"
      aria-label={control.label}
      className="min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-2xl font-orbitron text-[11px] tracking-wider text-white/90 select-none flex flex-col items-center justify-center"
      style={{ background: 'rgba(18, 16, 40, 0.95)', border: '1px solid rgba(196,181,253,0.45)', touchAction: 'none' }}
      {...hold(engineRef, control.id)}
    >
      {showKey && (
        <span className="text-[8px] text-white/35 leading-none mb-0.5">{control.key}</span>
      )}
      <span className="leading-tight">{control.label}</span>
    </button>
  );

  if (touchUi) {
    return (
      <div
        className="shrink-0 z-20 pointer-events-none w-full"
        style={{
          paddingTop: 0,
          paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
          background: 'rgba(5,6,16,0.78)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-end justify-between gap-2 pt-2 pb-1">
          <div
            ref={joystickRef}
            className="pointer-events-auto w-[112px] h-[112px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(5,6,18,0.55)', border: '1px solid rgba(255,255,255,0.1)', touchAction: 'none' }}
            aria-label="Steer"
          >
            <div ref={knobRef} className="w-12 h-12 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
          </div>
          <div className="pointer-events-auto flex flex-wrap justify-end content-end gap-2 max-w-[62%]">
            {controls.map((c) => button(c, { showKey: false }))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex absolute bottom-4 right-4 z-20 gap-2 pointer-events-auto">
      {controls.map((c) => button(c, { showKey: true }))}
    </div>
  );
}
