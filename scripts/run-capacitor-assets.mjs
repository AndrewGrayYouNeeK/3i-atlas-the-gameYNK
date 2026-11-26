/**
 * Run capacitor-assets, then restore web PWA manifest (capacitor-assets rewrites it)
 * and apply Android Play branding / full-bleed adaptive icons.
 */
import { spawnSync } from 'node:child_process';
import { copyFile, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'public', 'manifest.json');
const manifestBackup = path.join(root, 'public', 'manifest.json.icons-backup');

async function main() {
  const originalManifest = await readFile(manifestPath, 'utf8');
  await writeFile(manifestBackup, originalManifest);

  const result = spawnSync(
    'npx',
    [
      'capacitor-assets',
      'generate',
      '--iconBackgroundColor',
      '#01010c',
      '--iconBackgroundColorDark',
      '#01010c',
      '--splashBackgroundColor',
      '#01010c',
      '--splashBackgroundColorDark',
      '#01010c',
    ],
    { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
  );

  await copyFile(manifestBackup, manifestPath);
  await rm(manifestBackup, { force: true });
  await rm(path.join(root, 'icons'), { recursive: true, force: true });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  const patch = spawnSync('node', [path.join(root, 'scripts', 'patch-android-play-branding.mjs')], {
    cwd: root,
    stdio: 'inherit',
  });
  if (patch.status !== 0) {
    process.exit(patch.status || 1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
