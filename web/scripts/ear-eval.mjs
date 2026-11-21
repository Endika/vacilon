// Dev-only: runs the app's VoskEngine in headless Chromium over the spike's WAV phrases.
// Usage: node scripts/ear-eval.mjs   (OIDO_CHROME overrides the Chromium path)
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SPIKE = join(homedir(), 'workspace/vacilon-notes/spike-oido');
const { chromium } = createRequire(join(SPIKE, 'package.json'))('playwright');
const root = fileURLToPath(new URL('..', import.meta.url));
const phrases = JSON.parse(readFileSync(join(SPIKE, 'eval/phrases.json'), 'utf8'));

function chromePath() {
  if (process.env.OIDO_CHROME) return process.env.OIDO_CHROME;
  const cache = join(homedir(), '.cache/ms-playwright');
  const dir = readdirSync(cache)
    .filter((d) => d.startsWith('chromium_headless_shell'))
    .sort()
    .pop();
  return join(cache, dir, 'chrome-headless-shell-linux64/chrome-headless-shell');
}

const words = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[a.length][b.length];
}

const server = await createServer({
  root,
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, strictPort: false },
});
await server.listen();
const origin = `http://127.0.0.1:${server.config.server.port}`;
const browser = await chromium.launch({ headless: true, executablePath: chromePath() });
try {
  const context = await browser.newContext();
  const external = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/eval/')) {
      return route.fulfill({
        contentType: 'audio/wav',
        body: readFileSync(join(SPIKE, 'public', url.pathname)),
      });
    }
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  await page.goto(`${origin}/ear-eval.html`);
  await page.waitForFunction(() => window.__ear);
  const started = Date.now();
  await page.evaluate(() => window.__ear.load());
  console.log(`model loaded in ${((Date.now() - started) / 1000).toFixed(1)} s`);

  for (const variant of ['normal', 'aguda']) {
    let errors = 0;
    let total = 0;
    let exact = 0;
    for (let i = 0; i < phrases.length; i++) {
      const url = `/eval/${String(i).padStart(2, '0')}-${variant}.wav`;
      const text = await page.evaluate((u) => window.__ear.transcribe(u), url);
      const ref = words(phrases[i]);
      const wrong = distance(ref, words(text));
      errors += wrong;
      total += ref.length;
      if (wrong === 0) exact++;
    }
    const wer = ((errors / total) * 100).toFixed(1);
    console.log(`${variant}: WER ${wer} %, exact ${exact}/${phrases.length}`);
  }
  console.log(`external requests: ${external.length}`, external.slice(0, 5));
} finally {
  await browser.close();
  await server.close();
}
