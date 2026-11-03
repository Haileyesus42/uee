const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Loading page...');
  await page.goto('https://temari.et/exam-prep/papers/grade-12-mathematics-2016', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  const count = await page.$$eval('article', (els) => els.length);
  console.log('Articles found:', count);

  if (count > 0) {
    const sample = await page.$eval('article', (el) => ({
      number: el.querySelector('p')?.textContent?.trim(),
      promptHtmlLength: el.querySelector('h3')?.innerHTML.length,
      optionCount: el.querySelectorAll('ol > li').length,
      answerText: el.querySelector('details p')?.textContent?.slice(0, 80),
      hasLatexAnnotation: (el.querySelector('h3')?.innerHTML || '').includes('application/x-tex'),
    }));
    console.log(JSON.stringify(sample, null, 2));
  }

  await browser.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
