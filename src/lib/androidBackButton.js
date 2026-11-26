import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Android hardware / gesture back:
 * 1. Close an open overlay if a handler is registered (pause, tutorial, dialog)
 * 2. Otherwise history.back() when the WebView can go back
 * 3. Otherwise leave the app (move to background / exit)
 *
 * Pages register temporary handlers via registerAndroidBackHandler.
 */

/** @type {null | (() => boolean)} */
let overlayHandler = null;

/**
 * @param {() => boolean} handler  Return true if the back press was consumed.
 * @returns {() => void} unregister
 */
export function registerAndroidBackHandler(handler) {
  overlayHandler = handler;
  return () => {
    if (overlayHandler === handler) overlayHandler = null;
  };
}

export function initAndroidBackButton() {
  if (Capacitor.getPlatform() !== 'android') return;

  App.addListener('backButton', ({ canGoBack }) => {
    if (overlayHandler) {
      const consumed = overlayHandler();
      if (consumed) return;
    }

    if (canGoBack || window.history.length > 1) {
      window.history.back();
      return;
    }

    App.minimizeApp().catch(() => {
      void App.exitApp();
    });
  });
}
