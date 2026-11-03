const { chromium } = require('playwright');
const fs = require('fs/promises');
const path = require('path');

const SUBJECTS = ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'aptitude', 'civics', 'geography', 'history', 'economics'];
const EC_YEARS = [2005, 2006, 2007, 2008, 2009, 2011, 2013, 2014, 2015, 2016, 2017];
const BASE = 'https://temari.et/exam-prep/papers';
const OUTPUT = path.join(__dirname, 'output', 'temari-scrape');

function ecToGc(ec) { return ec + 8; }

function plainFromHtml(html) {
  if (!html) return '';
  let out = html.replace(
    /<span class="katex">[\s\S]*?<annotation encoding="application\/x-tex">([^<]+)<\/annotation>[\s\S]*?<\/span>/g,
    (_, tex) => '$' + tex + '$',
  );
  out = out.replace(/<[^>]+>/g, '');
  return out
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function scrollAndWaitForArticles(page, maxWaitMs) {
  maxWaitMs = maxWaitMs || 15000;
  const start = Date.now();
  let lastCount = 0;
  let stableRounds = 0;

  while (Date.now() - start < maxWaitMs) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(300);

    const count = await page.$$eval('article', (els) => els.length);
    if (count === lastCount) {
      stableRounds++;
      if (stableRounds >= 3) break;
    } else {
      stableRounds = 0;
      lastCount = count;
    }
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  return lastCount;
}

async function scrapeOne(browser, subject, yearEc) {
  const url = BASE + '/grade-12-' + subject + '-' + yearEc;
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    await page.close();
    return { error: 'timeout', url: url, subject: subject, yearEc: yearEc, questions: [] };
  }

  try {
    await page.waitForSelector('article', { timeout: 10000 });
  } catch (e) {
    await page.close();
    return { error: 'no articles', url: url, subject: subject, yearEc: yearEc, questions: [] };
  }

  await scrollAndWaitForArticles(page);

  const raw = await page.$$eval('article', (articles) =>
    articles.map((art) => {
      const numText = art.querySelector('p') ? art.querySelector('p').textContent : '';
      const numMatch = numText ? numText.match(/Question\s+(\d+)/) : null;
      const promptEl = art.querySelector('h3');
      const promptHtml = promptEl ? promptEl.innerHTML : '';
      const optionEls = Array.from(art.querySelectorAll('ol > li'));
      // An option li is "<span>A.</span><span class="min-w-0">value</span>".
      // The last span is not the value: for a math option it is a nested KaTeX
      // span (or an empty strut), which came back blank and got the option
      // dropped. Take the value cell, falling back to the last child element.
      const options = optionEls.map((li) => {
        const valueEl = li.querySelector('span.min-w-0') || li.lastElementChild;
        return valueEl ? valueEl.innerHTML : '';
      });
      const answerEl = art.querySelector('details p');
      const answerText = answerEl ? answerEl.textContent : '';
      const answerMatch = answerText ? answerText.match(/Answer:\s*([A-D])/) : null;
      const detailsDivs = art.querySelectorAll('details > div > div');
      const explanationHtml = detailsDivs.length > 0 ? detailsDivs[detailsDivs.length - 1].innerHTML : '';
      return {
        number: numMatch ? Number(numMatch[1]) : null,
        promptHtml: promptHtml,
        options: options,
        correctLetter: answerMatch ? answerMatch[1] : null,
        explanationHtml: explanationHtml,
      };
    }),
  );

  await page.close();

  const questions = [];
  const skipped = [];

  for (const q of raw) {
    // Every option must keep its original slot: filtering empty options out
    // shifts the ones after it, so correctIndex would then point at a
    // different answer — a wrong key is worse than a missing question. A
    // question with a blank option (usually an image-only choice) is reported
    // instead of repaired, and the answer is dropped if it falls outside the
    // options actually present.
    const options = q.options.map(plainFromHtml);
    if (options.length < 2 || options.some((o) => o.length === 0)) {
      skipped.push({ number: q.number, reason: 'blank option' });
      continue;
    }

    const letterIndex = q.correctLetter ? q.correctLetter.charCodeAt(0) - 65 : null;
    questions.push({
      number: q.number,
      prompt: plainFromHtml(q.promptHtml),
      options: options,
      correctIndex: letterIndex !== null && letterIndex < options.length ? letterIndex : null,
      explanation: plainFromHtml(q.explanationHtml),
    });
  }

  return { url: url, subject: subject, yearEc: yearEc, questions: questions, skipped: skipped };
}

async function main() {
  await fs.mkdir(OUTPUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  for (let i = 0; i < SUBJECTS.length; i++) {
    const subject = SUBJECTS[i];
    for (let j = 0; j < EC_YEARS.length; j++) {
      const yearEc = EC_YEARS[j];
      const outFile = path.join(OUTPUT, subject + '-' + yearEc + 'ec.json');

      try {
        await fs.access(outFile);
        console.log('✓ ' + subject + ' ' + yearEc + ' E.C. — exists, skip');
        continue;
      } catch (e) {}

      const r = await scrapeOne(browser, subject, yearEc);
      if (r.error) {
        console.log('✗ ' + subject + ' ' + yearEc + ' E.C. — ' + r.error);
        continue;
      }
      if (r.questions.length === 0) {
        console.log('✗ ' + subject + ' ' + yearEc + ' E.C. — 0 questions'
          + (r.skipped.length > 0 ? ' (' + r.skipped.length + ' skipped)' : ''));
        continue;
      }

      await fs.writeFile(outFile, JSON.stringify({
        source: 'temari.et',
        url: r.url,
        subject: r.subject,
        yearEc: r.yearEc,
        yearGc: ecToGc(r.yearEc),
        scrapedAt: new Date().toISOString(),
        questionCount: r.questions.length,
        skipped: r.skipped,
        questions: r.questions,
      }, null, 2));

      console.log('✓ ' + subject + ' ' + yearEc + ' E.C. (' + ecToGc(yearEc) + ' G.C.) — ' + r.questions.length + ' questions'
        + (r.skipped.length > 0 ? ', ' + r.skipped.length + ' skipped (blank option)' : ''));
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  await browser.close();
  console.log('\nDone. Output: ' + OUTPUT);
}

main().catch((e) => { console.error(e); process.exit(1); });