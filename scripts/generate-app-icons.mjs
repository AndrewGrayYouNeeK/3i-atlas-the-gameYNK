/**
 * Build App Store / Play Store icons and splash art from public/logo.webp.
 * Marketing / home-screen icons are full-bleed (edge-to-edge), flattened onto
 * #01010c with no alpha — Apple/Android apply the mask themselves.
 *
 * Android adaptive icon sources:
 *   icon-foreground.png — full-bleed art (no safe-zone padding)
 *   icon-background.png — solid #01010c
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logoPath = path.join(root, 'public', 'logo.webp');
const assetsDir = path.join(root, 'assets');
const bg = { r: 1, g: 1, b: 12, alpha: 1 }; // #01010c

/** Home-screen / store icons: fill the square. Splash keeps a smaller mark. */
const ICON_LOGO_RATIO = 1;
/** Slight center zoom so the medallion reads larger while corners stay starfield. */
const ICON_ZOOM = 1.06;
const SPLASH_LOGO_RATIO = 0.38;

async function solid(size, color = bg) {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Place logo on solid bg. logoRatio < 1 pads; zoom > 1 scales up and center-crops.
 * Output is opaque RGB PNG (no alpha channel).
 */
async function logoOnBg(canvasSize, logoRatio = 0.72, zoom = 1) {
  const fitted = Math.round(canvasSize * logoRatio * zoom);
  let pipeline = sharp(logoPath).resize(fitted, fitted, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  if (fitted > canvasSize) {
    const crop = Math.round((fitted - canvasSize) / 2);
    pipeline = pipeline.extract({
      left: crop,
      top: crop,
      width: canvasSize,
      height: canvasSize,
    });
    return pipeline.flatten({ background: bg }).removeAlpha().png().toBuffer();
  }

  const logo = await pipeline.png().toBuffer();
  const offset = Math.round((canvasSize - fitted) / 2);
  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .flatten({ background: bg })
    .removeAlpha()
    .png()
    .toBuffer();
}

/**
 * Adaptive-icon foreground: full-bleed opaque art (same as marketing icon).
 * Capacitor-assets may inset this; we strip insets afterward for Android.
 */
async function adaptiveForeground(canvasSize) {
  return logoOnBg(canvasSize, ICON_LOGO_RATIO, ICON_ZOOM);
}

async function main() {
  await mkdir(assetsDir, { recursive: true });

  const icon = await logoOnBg(1024, ICON_LOGO_RATIO, ICON_ZOOM);
  // 1280 is enough for Capacitor splash scaling and keeps the repo lean.
  const splash = await logoOnBg(1280, SPLASH_LOGO_RATIO);
  const foreground = await adaptiveForeground(1024);
  const background = await solid(1024);

  await writeFile(path.join(assetsDir, 'icon-only.png'), icon);
  await writeFile(path.join(assetsDir, 'icon.png'), icon);
  await writeFile(path.join(assetsDir, 'logo.png'), icon);
  await writeFile(path.join(assetsDir, 'icon-foreground.png'), foreground);
  await writeFile(path.join(assetsDir, 'icon-background.png'), background);
  await writeFile(path.join(assetsDir, 'splash.png'), splash);
  await writeFile(path.join(assetsDir, 'splash-dark.png'), splash);

  // Explicit App Store marketing icon (no alpha) for the iOS asset catalog.
  const iosIconDir = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  await mkdir(iosIconDir, { recursive: true });
  await writeFile(path.join(iosIconDir, 'AppIcon-512@2x.png'), icon);

  console.log('Wrote Capacitor asset sources to assets/ and iOS marketing icon (full-bleed).');
  console.log('Note: capacitor-assets may rewrite public/manifest.json — restore from git if needed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
