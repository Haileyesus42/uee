// Compiles every flagged (verified:false) entry across the pilot/batch output
// files into one deduplicated, categorized report for human review. Read-only
// against the output files; writes only the new report file — does not touch
// the database. See docs/flagged-questions-report.json for the result.
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'output');
const files = fs.readdirSync(outDir).filter((f) => /^(pilot|batch\d+)-.*\.json$/.test(f));

// Later files = later, more-refined passes. Last occurrence of an id wins.
const byId = new Map();
for (const f of files.sort()) {
  const data = JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf-8'));
  for (const d of data) {
    if (d.verified === false) byId.set(d.id, { ...d, sourceFiles: [...(byId.get(d.id)?.sourceFiles ?? []), f] });
  }
}

// Explicit, manually-reviewed categorization — read every entry above before
// writing this, not a keyword heuristic. category / confidence / action.
const CLASSIFY = {
  // --- Category: likely-wrong-stored-answer (highest priority — these say a
  // student could be marked wrong for the actually-correct choice) ---
  '76937298-4e22-4766-9b44-574d920611a3': ['likely-wrong-answer', 'high', 'Fix sign in option C text (should be minus, not plus) — existing explanation already derives the correct form and contradicts the stored option.'],
  'c0fe2321-3cbd-44d5-be79-894d05ef498b': ['likely-wrong-answer', 'high', 'Verify against source; independent calc + numeric check at x=0 both point to option B (index 1), not stored C (index 2).'],
  '9502f67d-dafb-43a0-9d23-7630960b28a7': ['likely-wrong-answer', 'high', 'Verify against source; vertex evaluation points to option A (index 0), not stored C (index 2) — no vertex produces the stored value.'],
  '5892b341-d722-418f-98a4-a9012d6e8815': ['likely-wrong-answer', 'high', 'Verify against source; stored option is neutral O2\'s MO config, not O2⁻\'s — option D (index 3) has the correct electron count.'],
  'fbc80e83-07a0-4840-91ff-b0b867455b04': ['likely-wrong-answer', 'high', 'Verify against source; day-of-week logic checked twice, points to option D (Saturday), not stored C (Friday).'],
  'bdfbd3ef-1552-4cbb-9cd0-3f22702d85f0': ['likely-wrong-answer', 'high', 'Verify against source; calculus checked twice, points to option B (e), not stored D (0).'],
  '9b30777e-8d5d-4985-af3d-c7432795cf87': ['likely-wrong-answer', 'high', 'Set B\'s condition as stored makes B infinite (true for all naturals) — likely a dropped bound in transcription, not just a wrong index.'],
  'efdbdb79-8f9f-45c5-a5d1-092d6f942082': ['likely-wrong-answer', 'high', 'All 4 options pair enzyme class with a different class\'s actual definition under standard EC classification — needs correction against source, not just a different index.'],
  '34eaed92-c316-4a5e-b241-6b8c3dbc7094': ['likely-wrong-answer', 'high', 'Standard conditional-tense rule: past-perfect if-clause pairs with "would not have worried" (option D), not stored "would not worry" (option C).'],
  '2b126c86-e5b4-4c26-910c-d6da3cd796f8': ['likely-wrong-answer', 'medium', 'Result is exactly 10x smaller than stored option — check for an exponent/unit error in the source, part of a 2014-2016 physics recovery batch worth a dedicated look.'],
  '52724e50-901d-4482-8bba-e44e7223bdee': ['likely-wrong-answer', 'medium', 'Result is exactly 10x smaller than stored option — same pattern as the glass-expansion question, same 2014 batch.'],
  '5be09412-dfe4-4f91-9718-d471d4dfdb6c': ['likely-wrong-answer', 'medium', 'Direct calculation from the given numbers is several orders of magnitude off from every option — prompt numbers and options may be inconsistent with each other.'],
  'a1e1a7a0-f0a8-4c55-ac51-c9686df44475': ['likely-wrong-answer', 'low', 'Independent calc (31.5%) is close to but not exactly the stored 30.43% — almost certainly the right option by elimination, just couldn\'t reproduce the exact figure. Low priority.'],

  // --- Category: prompt-text-defect (garbled/truncated, not an answer issue) ---
  '0e607315-b671-4415-9136-d8cbe938d4fa': ['prompt-text-defect', 'high', 'Prompt cut off mid-sentence after "How can one scientifically" — needs re-transcription from source.'],
  '9c1e9eba-facc-4163-83f2-6d81f1571c0a': ['prompt-text-defect', 'high', 'Prompt missing the numeric root-gap ("exceeds the other by ___") — needs re-transcription.'],
  'db079f85-0e31-4ccf-bdff-2db40b2a01b8': ['prompt-text-defect', 'high', 'Already self-documented as defective in its own stored explanation — none of the 4 options define "altruist" correctly.'],

  // --- Category: ambiguous-or-unverifiable (my own derivation genuinely
  // doesn't confirm the stored answer, but it's a close call, not a clear error) ---
  'acf798b4-8c03-4d04-80f0-8d72aa14eda7': ['ambiguous', 'low', 'Premise ("more than eleven times") doesn\'t uniquely determine an integer answer as literally stated — stored answer is a plausible boundary reading, not clearly wrong.'],
  '7ec265cb-5a85-4908-8a1c-14c4b72fdb5a': ['ambiguous', 'low', 'Two options are both defensibly "not true" for different reasons — stored answer isn\'t clearly wrong, just one of two reasonable picks.'],
  '20ae2cdb-4f2e-4377-8f7d-7b6cfd18eb0e': ['ambiguous', 'medium', 'My best-derived order isn\'t among the 4 given options at all — flagged three separate times across batches, consistent finding.'],
  '304a307d-d8dd-4245-b4c5-dab1024e2a17': ['ambiguous', 'low', 'Two orderings are both defensible depending on how the topic sentence is read.'],
  'fc33d9a1-a63b-4550-98a3-36c7ae3b2ccb': ['ambiguous', 'medium', 'Standard biology would include all three feeding modes (option D); stored answer excludes one — plausibly a curriculum-specific framing, not confirmed either way.'],
  '72ce8294-83ce-4679-8684-2fc9211ff370': ['ambiguous', 'low', 'Independent projectile calc doesn\'t cleanly match any option, including the stored one — possible rounding/approximation convention difference.'],
  'd8b029e9-c944-4994-bf89-a8a393c731a0': ['ambiguous', 'low', 'Could not reverse-engineer the sequence\'s pattern despite genuine effort — not evidence the stored answer is wrong, just unconfirmed.'],
  '9b4c64ea-db06-44b0-a427-6aef4c9b10f4': ['ambiguous', 'low', 'Magnitude confirmed correct; only the direction/sign is unverifiable since the prompt omits the field direction.'],
  'd2415376-9643-4d8a-b0aa-23e13590a2fe': ['ambiguous', 'low', 'Stored answer only resolves if F2 is known, and F2 is never given in the stored text — likely relied on a diagram.'],

  // --- Category: no-stored-answer-key (correctIndex is null; nothing to
  // verify against even where independently solvable) ---
  '18fed5c4-f1bc-4322-a7be-3eb2706bf717': ['no-answer-key', 'high', 'Confidently solved independently (option B, triangle inequality) — just needs a source answer key to confirm and record.'],
  '707b8092-31a3-4121-b100-1703227c5298': ['no-answer-key', 'low', 'Best independent guess is option C, but genuinely passage-dependent reasoning — needs a source answer key.'],
  '8cf58229-3a10-4973-93b8-dc6d780ed043': ['no-answer-key', 'medium', 'Prompt states the "correct value" inline, but none of the 4 options cleanly matches it and there\'s no stored correctIndex.'],
};

function missingSourceCategory(note) {
  const n = note.toLowerCase();
  if (/passage|paragraph|sentence (one|two)|reading/.test(n)) return 'missing-passage';
  if (/diagram|image|graph|chart|table|figure|structure|circuit|labeled|visual/.test(n)) return 'missing-diagram-or-image';
  return 'missing-source-material';
}

const MISSING_SOURCE_PATTERN = /cannot solve|unresolvable|unanswerable|not present (anywhere )?in the stored|missing (visual|image|diagram)/i;

const report = [];
for (const [id, entry] of byId) {
  const override = CLASSIFY[id];
  let category, confidence, action;
  if (override) {
    [category, confidence, action] = override;
  } else if (entry.correctIndex === null || MISSING_SOURCE_PATTERN.test(entry.note)) {
    category = missingSourceCategory(entry.note);
    confidence = 'n/a';
    action = entry.correctIndex === null
      ? 'Source the missing passage/diagram/answer key before this question can be explained or verified.'
      : 'A stored answer exists, but it can\'t be confirmed without the missing passage/diagram — source it before trusting the stored key.';
  } else {
    category = 'needs-review';
    confidence = 'unknown';
    action = 'Not auto-classified — read the note field directly.';
  }

  const optionText = (idx) => (typeof idx === 'number' && entry.options?.[idx] !== undefined ? entry.options[idx] : null);

  report.push({
    id,
    subject: entry.subject ?? null,
    examYear: entry.examYear ?? null,
    stream: entry.stream ?? null,
    prompt: entry.prompt,
    storedAnswerIndex: entry.correctIndex,
    storedAnswerText: optionText(entry.correctIndex),
    independentAnswerIndex: entry.modelAnswerIndex ?? entry.myIndependentAnswerIndex ?? null,
    independentAnswerText: optionText(entry.modelAnswerIndex ?? entry.myIndependentAnswerIndex),
    category,
    confidence,
    evidence: entry.note,
    recommendedAction: action,
    foundInBatches: [...new Set(entry.sourceFiles)],
  });
}

// Likely-wrong-answer first (needs the most urgent human attention), then
// prompt defects, then everything else, grouped.
const order = { 'likely-wrong-answer': 0, 'prompt-text-defect': 1, ambiguous: 2, 'no-answer-key': 3 };
report.sort((a, b) => (order[a.category] ?? 9) - (order[b.category] ?? 9));

const counts = {};
for (const r of report) counts[r.category] = (counts[r.category] ?? 0) + 1;

const outPath = path.join(__dirname, 'output', 'flagged-questions-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

const CATEGORY_LABEL = {
  'likely-wrong-answer': 'Likely-incorrect stored answer key',
  'prompt-text-defect': 'Prompt text is truncated or garbled',
  ambiguous: 'Genuinely ambiguous — multiple defensible answers',
  'no-answer-key': 'No stored answer key to confirm against',
  'missing-passage': 'Unresolvable — referenced reading passage is missing',
  'missing-diagram-or-image': 'Unresolvable — referenced diagram/image/chart is missing',
  'missing-source-material': 'Unresolvable — other missing source material',
};

let md = '# Flagged Questions Report\n\n';
md += `Generated ${new Date().toISOString().slice(0, 10)} from ${files.length} pilot/batch output file(s). `;
md += `${report.length} unique questions flagged, deduplicated by id.\n\n`;
md += 'This is a proposal file for human review. No database writes, answer-key changes, or explanation ';
md += 'regeneration were made based on this report — every item here still needs to be checked against the ';
md += 'original exam source before anything changes.\n\n';
md += '## Summary\n\n| Category | Count |\n|---|---|\n';
for (const [cat, label] of Object.entries(CATEGORY_LABEL)) {
  if (counts[cat]) md += `| ${label} | ${counts[cat]} |\n`;
}

for (const [cat, label] of Object.entries(CATEGORY_LABEL)) {
  const rows = report.filter((r) => r.category === cat);
  if (rows.length === 0) continue;
  md += `\n## ${label} (${rows.length})\n`;
  for (const r of rows) {
    md += `\n### \`${r.id}\`\n`;
    md += `**Subject/year:** ${r.subject ?? '?'} ${r.examYear ?? ''} (${r.stream ?? '?'}) · **Confidence:** ${r.confidence}\n\n`;
    md += `**Prompt:** ${r.prompt}\n\n`;
    md += `**Stored answer:** ${r.storedAnswerIndex === null ? 'none' : `[${r.storedAnswerIndex}] ${r.storedAnswerText}`}`;
    if (r.independentAnswerIndex !== null) {
      md += ` · **Independently derived:** [${r.independentAnswerIndex}] ${r.independentAnswerText}`;
    }
    md += '\n\n';
    md += `**Evidence:** ${r.evidence}\n\n`;
    md += `**Recommended action:** ${r.recommendedAction}\n`;
  }
}

const mdPath = path.join(__dirname, 'output', 'flagged-questions-report.md');
fs.writeFileSync(mdPath, md);

console.log(`Wrote ${report.length} entries to:\n  ${outPath}\n  ${mdPath}`);
console.log('By category:', counts);
