// Puppeteer smoke test for the Gradio Pipeline Hub
// - Loads index.html, verifies cards render
// - Opens a modal and verifies the deploy command is copyable
// - Loads tester.html, clicks the sample button, runs analysis
// - Takes screenshots for visual verification
import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const ART = new URL('./artifacts/', import.meta.url).pathname;
mkdirSync(ART, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});

const fail = (msg) => {
  console.error('FAIL:', msg);
  process.exit(1);
};

console.log('=== Test 1: Index page loads, cards render ===');
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 30000 });
await sleep(800);

// Wait for the React app to mount and the grid to populate
await page.waitForSelector('.tool-card', { timeout: 15000 });
const cardCount = await page.$$eval('.tool-card', (els) => els.length);
console.log('  → cards rendered:', cardCount);
if (cardCount < 5) fail(`expected at least 5 cards, got ${cardCount}`);

// Verify the brand header is present
const brand = await page.$eval('.brand h1', (el) => el.textContent);
console.log('  → brand:', brand);
if (!brand.includes('Gradio')) fail('brand mismatch');

await page.screenshot({ path: ART + 'index-initial.png', fullPage: false });

console.log('=== Test 2: Search filter narrows the grid ===');
const search = await page.$('input[type="search"]');
await search.click();
await search.type('whisper');
await sleep(500);
const filteredCount = await page.$$eval('.tool-card', (els) => els.length);
console.log('  → search "whisper" → cards:', filteredCount);
if (filteredCount === 0) fail('search returned 0 results');
if (filteredCount >= cardCount) fail('search did not narrow results');
await page.screenshot({ path: ART + 'index-search.png' });

// Clear search via the React-controlled input setter
async function clearSearch() {
  await page.evaluate(() => {
    const input = document.querySelector('.search input');
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(300);
}
await clearSearch();

console.log('=== Test 3: Category filter ===');
const catPills = await page.$$('.cat-pill');
if (catPills.length === 0) fail('no category pills in sidebar');
const firstCatLabel = await page.$eval('.cat-pill .cat-pill__label', (el) => el.textContent);
console.log('  → first category:', firstCatLabel);
await catPills[0].click();
await sleep(400);
const catCount = await page.$$eval('.tool-card', (els) => els.length);
console.log('  → cards after category click:', catCount);
if (catCount === 0) fail('category filter returned 0');
await page.screenshot({ path: ART + 'index-category.png' });

// Toggle off
await catPills[0].click();
await sleep(300);

console.log('=== Test 4: Modal opens with deploy command ===');
const firstCard = await page.$('.tool-card');
await firstCard.click();
await page.waitForSelector('.modal', { timeout: 5000 });
const modalTitle = await page.$eval('.modal__title', (el) => el.textContent);
console.log('  → modal title:', modalTitle);
if (!modalTitle.trim()) fail('modal title empty');

const deployCmd = await page.$eval('.modal__deploy-cmd', (el) => el.textContent);
console.log('  → deploy command present:', deployCmd.includes('gradio deploy'));
if (!deployCmd.includes('gradio deploy')) fail('deploy command missing');
if (!deployCmd.includes('YOUR_HF_TOKEN')) fail('YOUR_HF_TOKEN placeholder missing');

await page.screenshot({ path: ART + 'index-modal.png', fullPage: false });

// Close modal
const closeBtn = await page.$('.modal__close');
await closeBtn.click();
await sleep(300);
const modalGone = await page.$('.modal');
if (modalGone) fail('modal did not close');

console.log('=== Test 5: Theme toggle ===');
const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
await page.click('.theme-toggle');
await sleep(200);
const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
console.log('  → theme:', themeBefore, '→', themeAfter);
if (themeBefore === themeAfter) fail('theme did not toggle');
await page.screenshot({ path: ART + 'index-light.png' });

// Toggle back
await page.click('.theme-toggle');
await sleep(200);

console.log('=== Test 6: Tester page loads and analyzes sample ===');
await page.goto(BASE + '/tester.html', { waitUntil: 'networkidle2' });
await sleep(500);

await page.waitForSelector('#sample-btn');
await page.click('#sample-btn');
await sleep(400);
await page.click('#analyze-btn');
// Analysis is fast for a 4s synthetic sample
await sleep(2500);

const status = await page.$eval('#status', (el) => el.textContent);
console.log('  → status:', status);
if (!/complete|detected/i.test(status)) fail('analysis did not complete');

const notesCount = await page.$eval('#s-notes', (el) => el.textContent);
const keyDetected = await page.$eval('#s-key', (el) => el.textContent);
const tempoDetected = await page.$eval('#s-tempo', (el) => el.textContent);
console.log('  → notes:', notesCount, '· key:', keyDetected, '· tempo:', tempoDetected);
if (notesCount === '—') fail('no notes detected from sample');
if (keyDetected === '—') fail('no key detected from sample');
if (!/[0-9]+ BPM/.test(tempoDetected)) fail('no tempo detected from sample');

const desc = await page.$eval('#description', (el) => el.textContent);
if (!desc.includes('MULTI-INSTRUMENT ARRANGEMENT')) fail('description not generated');
if (!desc.includes('C major')) fail('expected C major key in description');

await page.screenshot({ path: ART + 'tester-after-analysis.png', fullPage: false });

console.log('=== Test 7: Console error check ===');
if (errors.length > 0) {
  console.log('  → errors captured:');
  for (const e of errors) console.log('    -', e);
  // GitHub API may rate-limit (403/429), HF API may 403, and "Failed to load
  // resource" 404s are typically favicons. Only fail on genuinely unhandled
  // JS errors, not network 4xx for background enrichment.
  const hard = errors.filter(
    (e) =>
      !/github|429|403|forbidden|rate|huggingface|favicon/i.test(e) &&
      !/Failed to load resource/i.test(e)
  );
  if (hard.length > 0) fail('hard page errors: ' + hard.join('; '));
} else {
  console.log('  → no errors');
}

await browser.close();
console.log('\n✅ All tests passed');
console.log('Screenshots: ' + ART);
