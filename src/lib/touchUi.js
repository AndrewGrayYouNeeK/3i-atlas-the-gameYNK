import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Device / input detection for the touch vs desktop layouts.
 *
 * We never trust the user agent alone. Desktop ("fine pointer") UI is used when
 * the primary pointer is a mouse/trackpad that can hover AND the device has no
 * Apple/Android touch screen. That covers:
 *   - Mac / Windows / Linux / ChromeOS browsers at 3iatlasgame.xyz
 *   - The iPhone/iPad app running on an Apple-silicon Mac (Capacitor reports
 *     "ios", but the Mac has no touch points and a fine, hovering pointer)
 * Phones, tablets (including iPadOS Safari, which pretends to be a Mac) and
 * the Android app keep the touch layout.
 *
 * Test overrides: `?ui=desktop` / `?ui=touch`, or window.__FORCE_TOUCH_UI__ /
 * window.__FORCE_DESKTOP_UI__ = true.
 */

/** Width at which the desktop layout spreads the HUD into columns. */
export const DESKTOP_WIDE_MIN = 1024;

function mq(query) {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function forcedMode() {
  if (typeof window === 'undefined') return null;
  if (window.__FORCE_TOUCH_UI__ === true) return 'touch';
  if (window.__FORCE_DESKTOP_UI__ === true) return 'desktop';
  try {
    const ui = new URLSearchParams(window.location.search).get('ui');
    if (ui === 'touch' || ui === 'desktop') {
      window.sessionStorage?.setItem('atlas-ui', ui);
      return ui;
    }
    const saved = window.sessionStorage?.getItem('atlas-ui');
    if (saved === 'touch' || saved === 'desktop') return saved;
  } catch {
    // storage / URL unavailable
  }
  return null;
}

function platform() {
  try {
    return Capacitor.getPlatform();
  } catch {
    return 'web';
  }
}

/** True when the device has a mouse/trackpad as its main input and no touch screen to speak of. */
export function hasDesktopInput() {
  if (typeof window === 'undefined') return false;
  const forced = forcedMode();
  if (forced) return forced === 'desktop';

  const plat = platform();
  if (plat === 'android') return false;

  const finePointer = mq('(pointer: fine)') && mq('(hover: hover)');
  if (!finePointer) return false;

  const touchPoints = navigator.maxTouchPoints || 0;
  const uaData = navigator.userAgentData;
  if (uaData && uaData.mobile === true) return false;

  if (plat === 'ios') {
    // iPhone/iPad app: only a Mac (no touch points) gets the desktop layout.
    // An iPad with a trackpad still has a touch screen, so it stays touch.
    return touchPoints === 0;
  }

  // Web: iPadOS Safari reports a "Macintosh" UA but has touch points.
  const ua = navigator.userAgent || '';
  if (/Macintosh|iPad|iPhone|Android/i.test(ua) && touchPoints > 1) return false;
  return true;
}

export function getDeviceProfile() {
  const desktop = hasDesktopInput();
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  const narrow = mq('(max-width: 767px)');
  // A desktop browser squeezed to phone width still uses keyboard + mouse,
  // but the touch layout reads better there; the iOS app on a Mac keeps its
  // phone-sized window, so it uses the desktop controls at any width.
  const touchUi = !desktop || (narrow && platform() === 'web');
  return {
    touchUi,
    desktop: !touchUi,
    wide: !touchUi && width >= DESKTOP_WIDE_MIN,
    platform: platform(),
  };
}

/** True when the UI should use touch-first controls (no keyboard key hints). */
export function prefersTouchUi() {
  return getDeviceProfile().touchUi;
}

function applyRootClasses(profile) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('ui-desktop', profile.desktop);
  root.classList.toggle('ui-desktop-wide', profile.wide);
  root.classList.toggle('ui-touch', profile.touchUi);
}

function sameProfile(a, b) {
  return a.touchUi === b.touchUi && a.wide === b.wide && a.platform === b.platform;
}

export function useDeviceProfile() {
  const [profile, setProfile] = useState(() => getDeviceProfile());

  useEffect(() => {
    const update = () => {
      const next = getDeviceProfile();
      applyRootClasses(next);
      setProfile((prev) => (sameProfile(prev, next) ? prev : next));
    };
    update();
    const queries = [
      '(pointer: coarse)',
      '(pointer: fine)',
      '(hover: none)',
      '(hover: hover)',
      '(max-width: 767px)',
    ].map((q) => window.matchMedia(q));
    queries.forEach((q) => q.addEventListener?.('change', update));
    window.addEventListener('resize', update);
    return () => {
      queries.forEach((q) => q.removeEventListener?.('change', update));
      window.removeEventListener('resize', update);
    };
  }, []);

  return profile;
}

export function useTouchUi() {
  return useDeviceProfile().touchUi;
}

/** Call once at startup so CSS can key off html.ui-desktop / html.ui-touch before React renders. */
export function initDeviceClasses() {
  applyRootClasses(getDeviceProfile());
}
