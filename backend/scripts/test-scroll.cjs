const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://temari.et/exam-prep/papers/grade-12-mathematics-2016', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForSelector('article', { timeout: 10000 });

  console.log('Initial:', await page.$$eval('article', (e) => e.length));

  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(500);
    const n = await page.$$eval('article', (e) => e.length);
    console.log('scroll ' + (i + 1) + ':', n);
    if (n >= 50) break;
  }

  await browser.close();
})();
