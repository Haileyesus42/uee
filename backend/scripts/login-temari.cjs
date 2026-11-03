const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // NOT headless
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://temari.et/sign-in');
  console.log('Browser is open. Log in manually. Waiting 3 minutes...');
  await page.waitForTimeout(180000); // 3 minutes to log in
  await context.storageState({ path: 'scripts/temari-auth.json' });
  console.log('Session saved to scripts/temari-auth.json');
  await browser.close();
})();
