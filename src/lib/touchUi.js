import { useEffect, useState } from 'react';
import { isNativeApp } from './native.js';

/**
 * True when the UI should use touch-first controls (no keyboard key hints).
 * - Capacitor native builds
 * - Coarse pointer / no hover (phones, many tablets)
 * - Narrow viewports below the md breakpoint (web mobile layout)
 * - Optional test override: window.__FORCE_TOUCH_UI__ = true
 */
export function prefersTouchUi() {
  if (typeof window === 'undefined') return false;
  if (window.__FORCE_TOUCH_UI__ === true) return true;
  if (isNativeApp()) return true;
  try {
    if (window.matchMedia('(pointer: coarse)').matches) return true;
    if (window.matchMedia('(hover: none)').matches) return true;
    if (window.matchMedia('(max-width: 767px)').matches) return true;
  } catch {
    // matchMedia unavailable
  }
  return false;
}

export function useTouchUi() {
  const [touchUi, setTouchUi] = useState(() => prefersTouchUi());

  useEffect(() => {
    const update = () => setTouchUi(prefersTouchUi());
    update();
    const queries = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(hover: none)'),
      window.matchMedia('(max-width: 767px)'),
    ];
    queries.forEach((q) => q.addEventListener?.('change', update));
    window.addEventListener('resize', update);
    return () => {
      queries.forEach((q) => q.removeEventListener?.('change', update));
      window.removeEventListener('resize', update);
    };
  }, []);

  return touchUi;
}
