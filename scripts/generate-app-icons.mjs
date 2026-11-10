/**
 * Build App Store / Play Store icons and splash art from public/logo.webp.
 * Marketing icon is flattened onto #01010c (no alpha) as Apple requires.
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

async function logoOnBg(canvasSize, logoRatio = 0.72) {
  const logoSize = Math.round(canvasSize * logoRatio);
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const offset = Math.round((canvasSize - logoSize) / 2);
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
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(assetsDir, { recursive: true });

  const icon = await logoOnBg(1024, 0.78);
  // 1280 is enough for Capacitor splash scaling and keeps the repo lean.
  const splash = await logoOnBg(1280, 0.38);
  const foreground = await sharp(logoPath)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
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

  console.log('Wrote Capacitor asset sources to assets/ and iOS marketing icon.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
