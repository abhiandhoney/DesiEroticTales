import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const baseUrl = 'http://127.0.0.1:5174/scripts/crop-test/index.html';

function startDevServer() {
  return spawn(
    'node',
    ['./node_modules/vite/bin/vite.js', '--config', 'vite.crop-test.config.ts', '--host', '127.0.0.1'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

async function waitForServer(proc) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const chunk = proc.stdout?.read()?.toString() ?? '';
    if (chunk.includes('Local:') || chunk.includes('5174')) return;
    await delay(250);
  }
  throw new Error('Vite dev server did not start in time');
}

async function run() {
  const proc = startDevServer();
  const errors = [];
  const warnings = [];

  try {
    await waitForServer(proc);
    await delay(500);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') errors.push(`console.error: ${text}`);
      if (text.includes('preventDefault') && text.includes('passive')) {
        warnings.push(text);
      }
    });

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForSelector('.crop-viewport', { timeout: 10_000 });
    await page.waitForSelector('.crop-image', { timeout: 10_000 });

    const viewport = page.locator('.crop-viewport');
    const zoom = page.locator('#crop-zoom');
    const image = page.locator('.crop-image');

    const scaleBeforeWheel = Number(await zoom.inputValue());
    const box = await viewport.boundingBox();
    if (!box) throw new Error('Crop viewport not visible');

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.wheel(0, -120);
    await delay(100);

    const scaleAfterWheel = Number(await zoom.inputValue());
    if (scaleAfterWheel <= scaleBeforeWheel) {
      throw new Error(`Wheel zoom did not increase scale (${scaleBeforeWheel} -> ${scaleAfterWheel})`);
    }

    const transformBeforeDrag = await image.evaluate((el) => el.style.transform);
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 80, centerY + 40, { steps: 8 });
    await page.mouse.up();
    await delay(100);

    const transformAfterDrag = await image.evaluate((el) => el.style.transform);
    if (transformBeforeDrag === transformAfterDrag) {
      throw new Error('Drag did not change image transform');
    }

    // Hover moves without press should not crash.
    await page.mouse.move(centerX + 20, centerY + 20);
    await page.mouse.move(centerX - 30, centerY - 10, { steps: 5 });
    await delay(50);

    await page.locator('.btn-primary', { hasText: 'Use as cover' }).click();
    await page.waitForFunction(() => window.__cropTest?.applied === true, null, { timeout: 10_000 });

    await browser.close();

    if (warnings.length) {
      throw new Error(`Passive wheel warnings detected:\n${warnings.join('\n')}`);
    }

    if (errors.length) {
      throw new Error(`Browser errors detected:\n${errors.join('\n')}`);
    }

    console.log('PASS: crop modal wheel zoom, drag reposition, and apply all work without errors.');
  } finally {
    proc.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('FAIL:', err.message ?? err);
  process.exit(1);
});