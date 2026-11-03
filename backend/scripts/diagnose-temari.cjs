const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://temari.et/exam-prep/papers/grade-12-mathematics-2016', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForSelector('article', { timeout: 10000 });

  // 1. What does the page title/heading say about question count?
  const heading = await page.evaluate(() => {
    const h1 = document.querySelector('h1')?.textContent?.trim();
    const bodyText = document.body.textContent || '';
    const match = bodyText.match(/(\d+)\s+questions?/i);
    return { h1, questionCountMentioned: match ? match[1] : null };
  });
  console.log('Heading:', heading);

  // 2. Is there a sign-in wall or "unlock" prompt?
  const signInWall = await page.evaluate(() => {
    const bodyText = document.body.textContent || '';
    const indicators = [
      /sign in to/i, /log in to/i, /unlock/i, /premium/i,
      /subscribe/i, /register/i, /create.*account/i,
    ];
    return indicators
      .map((re) => bodyText.match(re)?.[0])
      .filter(Boolean);
  });
  console.log('Sign-in hints:', signInWall);

  // 3. Find the scrollable container (may not be window/body)
  const scrollContainer = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      if (el.scrollHeight > el.clientHeight + 100 && el.clientHeight > 300) {
        return {
          tag: el.tagName,
          className: (el.className || '').toString().slice(0, 80),
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        };
      }
    }
    return null;
  });
  console.log('Scroll container:', scrollContainer);

  // 4. Count lazy references ($L) — how many articles exist in RSC payload
  const html = await page.content();
  const lazyRefs = (html.match(/\$L[0-9a-f]+/g) || []).length;
  console.log('Lazy $L refs in HTML:', lazyRefs);

  // 5. If there's an inner scroll container, try scrolling it
  if (scrollContainer) {
    console.log('\nTrying to scroll the inner container...');
    const before = await page.$$eval('article', (e) => e.length);
    console.log('Articles before:', before);

    for (let i = 0; i < 10; i++) {
      await page.evaluate((tag) => {
        const containers = Array.from(document.querySelectorAll(tag));
        for (const el of containers) {
          if (el.scrollHeight > el.clientHeight + 100) {
            el.scrollTop += 600;
            return;
          }
        }
      }, scrollContainer.tag);
      await page.waitForTimeout(500);
    }

    const after = await page.$$eval('article', (e) => e.length);
    console.log('Articles after inner scroll:', after);
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
