const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CHROME = 'C:\\Users\\WezaMwiwa\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1234\\chrome-headless-shell-win64\\chrome-headless-shell.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--no-proxy-server'],
  });
  // desktop light-through: library, study, capture
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('fonts.g') || u.includes('gstatic')) r.abort();
    else r.continue();
  });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(4000);
  await page.screenshot({ path: 'C:\\Users\\WezaMwiwa\\AppData\\Local\\Temp\\opencode\\gf-lib.png' });
  const clickTab = async (label) => {
    await page.evaluate((s) => {
      const b = [...document.querySelectorAll('[role="tab"]')].find((x) =>
        (x.textContent || '').includes(s),
      );
      if (!b) throw new Error('no tab: ' + s);
      b.click();
    }, label);
    await sleep(1200);
  };
  await clickTab('Study');
  await page.screenshot({ path: 'C:\\Users\\WezaMwiwa\\AppData\\Local\\Temp\\opencode\\gf-study.png' });
  await clickTab('Capture');
  await page.screenshot({ path: 'C:\\Users\\WezaMwiwa\\AppData\\Local\\Temp\\opencode\\gf-capture.png' });
  // mobile
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, isMobile: true });
  await m.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(4000);
  await m.screenshot({ path: 'C:\\Users\\WezaMwiwa\\AppData\\Local\\Temp\\opencode\\gf-mobile.png' });
  await browser.close();
  console.log('shots done');
})().catch((e) => {
  console.error('SHOTS-FAIL', e.message);
  process.exit(1);
});
