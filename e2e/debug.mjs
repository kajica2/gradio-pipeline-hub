import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1500));

// Inspect the category pill numbers (counts in sidebar)
const pillCounts = await page.$$eval('.cat-pill', (els) =>
  els.map((e) => ({
    label: e.querySelector('.cat-pill__label')?.textContent,
    count: e.querySelector('.cat-pill__num')?.textContent,
    pressed: e.getAttribute('aria-pressed'),
  }))
);
console.log('PILLS (first 5):', pillCounts.slice(0, 5));

// Click music transcription
const firstPill = await page.$('.cat-pill');
await firstPill.click();
await new Promise((r) => setTimeout(r, 500));

const cardNames = await page.$$eval('.tool-card__name', (els) =>
  els.map((e) => e.firstChild?.textContent)
);
console.log('CARD NAMES after Music Trans click:', cardNames);

const toolbarCount = await page.$eval('.toolbar__count', (el) => el.textContent);
console.log('TOOLBAR:', toolbarCount);

// Click again to deselect
await firstPill.click();
await new Promise((r) => setTimeout(r, 500));
const cleared = await page.$$eval('.tool-card__name', (els) =>
  els.map((e) => e.firstChild?.textContent)
);
console.log('CARD NAMES after deselect:', cleared.slice(0, 5));

// Try searching for "music" instead
await page.click('.search input');
await page.type('.search input', 'music');
await new Promise((r) => setTimeout(r, 500));
const musicSearch = await page.$$eval('.tool-card__name', (els) =>
  els.map((e) => e.firstChild?.textContent)
);
console.log('CARD NAMES search="music":', musicSearch);

await browser.close();
