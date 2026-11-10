import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export async function initNativeShell() {
  if (!isNativeApp()) return;

  document.documentElement.classList.add('native-app');
  document.body.classList.add('native-app');

  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.hide();
  } catch {
    // StatusBar is unavailable in some simulator builds; ignore.
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.None });
  } catch {
    // Keyboard plugin may be unavailable on some platforms.
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Splash already dismissed.
  }
}
