// Scrapes all subjects × years from Temari.et.
// The site renders questions as server-side HTML with KaTeX; the original
// LaTeX source lives inside <annotation encoding="application/x-tex"> tags
// on every math span. Playwright is used over raw fetch because the site is
// Next.js — a plain curl gets the RSC payload, not a rendered DOM, and
// parsing RSC streams is fragile. Playwright gives us the DOM directly.
const { chromium } = require('playwright');
const fs = require('fs/promises');
const path = require('path');

const SUBJECTS = [
  'mathematics', 'physics', 'chemistry', 'biology', 'english',
  'aptitude', 'civics', 'geography', 'history', 'economics',
];

// Temari URL slugs use E.C. year. Converting to exam G.C. year:
//   G.C. = E.C. + 7.5 (roughly; the Ethiopian year starts in September)
//   Temari labels are like "2016 E.C. (2024)" — so E.C. 2016 → G.C. 2024.
const EC_YEARS = [2005, 2006, 2007, 2008, 2009, 2011, 2013, 2014, 2015, 2016, 2017];

const BASE = 'https://temari.et/exam-prep/papers';
const OUTPUT = path.join(__dirname, 'output', 'temari-scrape');

function ecToGc(ec) {
  // Approximate: E.C. 2017 = G.C. 2025. This is what Temari's own page titles use.
  return ec + 8;
}

// Extract every LaTeX source string from an HTML fragment, in document order.
function latexFromHtml(html) {
  if (!html) return [];
  const re = /<annotation encoding="application\/x-tex">([^<]+)<\/annotation>/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

// Rebuild a human-readable prompt by replacing each KaTeX span with the LaTeX
// source it contains, and stripping remaining HTML tags.
function plainFromHtml(html) {
  if (!html) return '';
  // Replace each katex span with its LaTeX source, wrapped in $...$
  let out = html.replace(
    /<span class="katex">.*?<annotation encoding="application\/x-tex">([^<]+)<\/annotation>.*?<\/span>/gs,
    (_, tex) => `$${tex}$`,
  );
  // Strip remaining tags
  out = out.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  out = out
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
  return out.trim();
}

async function scrapeOne(browser, subject, yearEc) {
  const url = `${BASE}/grade-12-${subject}-${yearEc}`;
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  } catch {
    return { url, subject, yearEc, questions: [], error: 'timeout' };
  }

  const questions = await page.$$eval('article', (articles) =>
    articles.map((art) => {
      const numberText = art.querySelector('p')?.textContent || '';
      const numberMatch = numberText.match(/Question\s+(\d+)/);
      const number = numberMatch ? Number(numberMatch[1]) : null;

      const promptHtml = art.querySelector('h3')?.innerHTML || '';
      const optionEls = Array.from(art.querySelectorAll('ol > li'));
      // Each option li is "<span>A.</span><span class="min-w-0">value</span>".
      // The last span is not the value: for a math option it is a nested KaTeX
      // span (or an empty strut), so it came back blank and the option was
      // dropped. Take the value cell, falling back to the last child element.
      const options = optionEls.map((li) => {
        const valueEl = li.querySelector('span.min-w-0') || li.lastElementChild;
        return valueEl?.innerHTML || '';
      });

      const answerText = art.querySelector('details p')?.textContent || '';
      const answerMatch = answerText.match(/Answer:\s*([A-D])/);
      const correctLetter = answerMatch ? answerMatch[1] : null;

      // The explanation is inside the last div inside <details>
      const detailsDivs = art.querySelectorAll('details > div > div');
      const explanationHtml =
        detailsDivs.length > 0
          ? detailsDivs[detailsDivs.length - 1].innerHTML
          : '';

      return { number, promptHtml, options, correctLetter, explanationHtml };
    }),
  );

  await page.close();

  // Post-process the DOM data into clean JSON
  const cleaned = [];
  const skipped = [];
  for (const q of questions) {
    // Options must keep their DOM order: dropping an empty one would shift the
    // rest up and make correctIndex point at a different answer. A question
    // with a blank option (usually an image-only choice) is reported instead of
    // repaired, and its key is dropped if it falls outside the options present.
    const options = q.options.map(plainFromHtml);
    if (options.length < 2 || options.some((o) => o.length === 0)) {
      skipped.push({ number: q.number, reason: 'blank option' });
      continue;
    }

    const letterIndex = q.correctLetter ? q.correctLetter.charCodeAt(0) - 65 : null;
    cleaned.push({
      number: q.number,
      prompt: plainFromHtml(q.promptHtml),
      options,
      correctIndex: letterIndex !== null && letterIndex < options.length ? letterIndex : null,
      explanation: plainFromHtml(q.explanationHtml),
    });
  }

  return { url, subject, yearEc, questions: cleaned, skipped };
}

async function main() {
  await fs.mkdir(OUTPUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const subject of SUBJECTS) {
    for (const yearEc of EC_YEARS) {
      const outFile = path.join(OUTPUT, `${subject}-${yearEc}ec.json`);
      try {
        await fs.access(outFile);
        console.log(`✓ ${subject} ${yearEc} E.C. — already exists, skipping`);
        continue;
      } catch {
        // doesn't exist — scrape it
      }

      const result = await scrapeOne(browser, subject, yearEc);
      if (result.error) {
        console.log(`✗ ${subject} ${yearEc} E.C. — ${result.error}`);
        continue;
      }
      if (result.questions.length === 0) {
        console.log(
          `✗ ${subject} ${yearEc} E.C. — no questions found` +
            (result.skipped.length > 0 ? ` (${result.skipped.length} skipped)` : ''),
        );
        continue;
      }

      await fs.writeFile(
        outFile,
        JSON.stringify(
          {
            source: 'temari.et',
            url: result.url,
            subject,
            yearEc: result.yearEc,
            yearGc: ecToGc(result.yearEc),
            scrapedAt: new Date().toISOString(),
            questionCount: result.questions.length,
            skipped: result.skipped,
            questions: result.questions,
          },
          null,
          2,
        ),
      );
      console.log(
        `✓ ${subject} ${yearEc} E.C. (${ecToGc(yearEc)} G.C.) — ${result.questions.length} questions` +
          (result.skipped.length > 0 ? `, ${result.skipped.length} skipped (blank option)` : ''),
      );
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  await browser.close();
  console.log('\nDone. Output:', OUTPUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});