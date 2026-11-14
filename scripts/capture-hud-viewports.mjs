/**
 * Capture gameplay HUD at phone viewports (portrait + landscape).
 * Usage: node /tmp/capture-hud-viewports.mjs <outDir> [port]
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = '/agent/repos/3i-atlas-the-gameYNK';
const outDir = path.resolve(process.argv[2] || '/tmp/hud-shots');
const PORT = Number(process.argv[3] || 4188);
const BASE = `http://127.0.0.1:${PORT}`;

const VIEWPORTS = [
  { name: 'se-portrait', width: 375, height: 667, hasTouch: true, isMobile: true },
  { name: 'se-landscape', width: 667, height: 375, hasTouch: true, isMobile: true },
  { name: 'mini-portrait', width: 375, height: 812, hasTouch: true, isMobile: true },
  { name: 'promax-portrait', width: 430, height: 932, hasTouch: true, isMobile: true },
  { name: 'promax-landscape', width: 932, height: 430, hasTouch: true, isMobile: true },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await wait(250);
  }
  throw new Error(`Preview server did not start at ${url}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  preview.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForServer(BASE);
    const browser = await chromium.launch({ headless: true });

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        hasTouch: vp.hasTouch,
        isMobile: vp.isMobile,
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__FORCE_TOUCH_UI__ = true;
      });
      await page.goto(`${BASE}/game?level=1&difficulty=medium`, { waitUntil: 'networkidle' });
      await wait(700);
      await page.getByRole('button', { name: /ENGAGE DISGUISE/i }).click();
      await wait(2000);
      const file = path.join(outDir, `${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log('wrote', file);
      await context.close();
    }

    await browser.close();
  } finally {
    preview.kill('SIGTERM');
    await wait(400);
    if (!preview.killed) preview.kill('SIGKILL');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
