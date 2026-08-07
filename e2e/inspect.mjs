import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const failed = [];
page.on('response', (r) => {
  if (r.status() >= 400) failed.push(r.status() + ' ' + r.url());
});
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 5000));
console.log('FAILED/4xx:');
for (const f of failed.slice(0, 20)) console.log('  ', f);
console.log('Total:', failed.length);
await browser.close();
