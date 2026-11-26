/**
 * After `npx cap sync android` / capacitor-assets, apply Play Store branding:
 * - App display name: "3iAtlas: The Game" (iOS keeps CFBundleDisplayName 3I/ATLAS)
 * - Adaptive launcher icons without the default 16.7% safe-zone inset (full-bleed)
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
const APP_NAME = '3iAtlas: The Game';

const ADAPTIVE_ICON_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

async function patchStrings() {
  const stringsPath = path.join(androidRes, 'values', 'strings.xml');
  let xml = await readFile(stringsPath, 'utf8');
  xml = xml.replace(
    /<string name="app_name">[^<]*<\/string>/,
    `<string name="app_name">${APP_NAME}</string>`,
  );
  xml = xml.replace(
    /<string name="title_activity_main">[^<]*<\/string>/,
    `<string name="title_activity_main">${APP_NAME}</string>`,
  );
  await writeFile(stringsPath, xml);
  console.log(`Patched Android app name → ${APP_NAME}`);
}

async function patchAdaptiveIcons() {
  for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
    const filePath = path.join(androidRes, 'mipmap-anydpi-v26', name);
    await writeFile(filePath, ADAPTIVE_ICON_XML);
  }
  console.log('Patched adaptive icons to full-bleed (no 16.7% inset).');
}

async function main() {
  await patchStrings();
  await patchAdaptiveIcons();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
