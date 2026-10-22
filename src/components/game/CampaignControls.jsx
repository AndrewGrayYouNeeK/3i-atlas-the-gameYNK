import { useEffect, useRef } from 'react';

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

  const button = (control) => (
    <button
      key={control.id}
      type="button"
      className="px-3 py-3 rounded-2xl font-orbitron text-[10px] tracking-wider text-white/85 select-none"
      style={{ background: 'rgba(18, 16, 40, 0.92)', border: '1px solid rgba(196,181,253,0.45)', touchAction: 'none' }}
      {...hold(engineRef, control.id)}
    >
      <div className="text-[8px] text-white/35 mb-0.5">{control.key}</div>
      {control.label}
    </button>
  );

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none md:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="flex items-end justify-between px-3">
          <div
            ref={joystickRef}
            className="pointer-events-auto w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(5,6,18,0.55)', border: '1px solid rgba(255,255,255,0.1)', touchAction: 'none' }}
          >
            <div ref={knobRef} className="w-12 h-12 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
          </div>
          <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5 max-w-[60%]">
            {controls.map(button)}
          </div>
        </div>
      </div>

      <div className="hidden md:flex absolute bottom-4 right-4 z-20 gap-2 pointer-events-auto">
        {controls.map(button)}
      </div>
    </>
  );
}
