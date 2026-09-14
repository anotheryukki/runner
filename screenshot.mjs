import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const PUPPETEER_PROJECT = 'C:/Users/User/AppData/Local/Temp/puppeteer-test/package.json';
const CHROME_CACHE = 'C:/Users/User/.cache/puppeteer/chrome';

const require = createRequire(PUPPETEER_PROJECT);
const puppeteer = require('puppeteer-core');

function latestChrome() {
  const dirs = fs.readdirSync(CHROME_CACHE).filter((d) => d.startsWith('win64-'));
  dirs.sort((a, b) =>
    a.replace('win64-', '').localeCompare(b.replace('win64-', ''), undefined, { numeric: true })
  );
  const latest = dirs[dirs.length - 1];
  return path.join(CHROME_CACHE, latest, 'chrome-win64', 'chrome.exe');
}

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const isMobile = label.toLowerCase().includes('mobile');
const viewport = isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };

const outDir = './temporary screenshots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const existing = fs
  .readdirSync(outDir)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => parseInt(m[1], 10));
const next = existing.length ? Math.max(...existing) + 1 : 1;
const fileName = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath = path.join(outDir, fileName);

const browser = await puppeteer.launch({
  executablePath: latestChrome(),
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: outPath });
  console.log(`Saved ${outPath}`);
} finally {
  await browser.close();
}
