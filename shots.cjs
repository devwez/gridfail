const puppeteer = require('puppeteer-core');

const URL = 'http://127.0.0.1:4173/';
const OUT = (n) => `remotion/shots/${n}.png`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, substr) {
  await page.evaluate((s) => {
    const b = [...document.querySelectorAll('button')].find((x) =>
      (x.textContent || '').includes(s),
    );
    if (!b) throw new Error('no button: ' + s);
    b.click();
  }, substr);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath:
      'C:\\Users\\WezaMwiwa\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1234\\chrome-headless-shell-win64\\chrome-headless-shell.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1920,1080'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  // school network stalls Google Fonts forever — cut it, screenshots use fallback stack
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('fonts.g') || u.includes('gstatic')) r.abort();
    else r.continue();
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(4000);
  await page.screenshot({ path: OUT('01-library') });

  await clickText(page, 'Open');
  await sleep(1200);
  await page.screenshot({ path: OUT('02-open') });
  await clickText(page, 'Explain instantly');
  await sleep(3000);
  await page.screenshot({ path: OUT('03-study') });

  await clickText(page, 'Study');
  await sleep(1200);

  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(4000);
  await page.screenshot({ path: OUT('04-offline') });

  await browser.close();
  console.log('shots done');
})().catch((e) => {
  console.error('SHOTS-FAIL', e.message);
  process.exit(1);
});
