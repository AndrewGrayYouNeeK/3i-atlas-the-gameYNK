/**
 * Capture App Store screenshot sizes from a running preview of the Vite build.
 * Sizes: iPhone 6.9" (1320×2868), iPhone 6.5" (1284×2778), iPad 13" (2064×2752).
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'app-store', 'screenshots');
const PORT = 4179;
const BASE = `http://127.0.0.1:${PORT}`;

const DEVICES = [
  { name: 'iphone-6.9', width: 1320, height: 2868 },
  { name: 'iphone-6.5', width: 1284, height: 2778 },
  { name: 'ipad-13', width: 2064, height: 2752 },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await wait(500);
  }
  throw new Error(`Preview server did not start at ${url}`);
}

async function capture(page, device, slug, urlPath) {
  await page.setViewportSize({ width: device.width, height: device.height });
  await page.goto(`${BASE}${urlPath}`, { waitUntil: 'networkidle' });
  await wait(1200);
  const file = path.join(outDir, `${device.name}-${slug}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('wrote', path.relative(root, file));
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const preview = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT)],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }
  );

  preview.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForServer(BASE);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    for (const device of DEVICES) {
      await capture(page, device, '01-menu', '/');
      await capture(page, device, '02-privacy', '/privacy');
      await capture(page, device, '03-about', '/about');
      // Briefing for stage 0 — closest to in-game chrome without needing engine warm-up.
      await capture(page, device, '04-briefing', '/game?level=0&difficulty=medium');
    }

    await browser.close();
  } finally {
    preview.kill('SIGTERM');
    await wait(500);
    if (!preview.killed) preview.kill('SIGKILL');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
