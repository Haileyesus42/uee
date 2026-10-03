// Deterministic parser for exam text that already carries its own answer key —
// specifically the format seen in backend/assets/exams/*.pdf, e.g.:
//
//   1. A transgenic organism is an organism that
//   A. can undergo chromosomal non-disjunction.
//   B. replicates its DNA without control.
//   C. has received genetic material of another organism. '
//   D. is artificially cultured and harvested.
//   Explanation: Capitalism is an economic system based on...
//
// The trailing `'` marks the correct option; `Explanation:` starts a transcribed
// explanation. Parsing this deterministically means zero LLM cost and zero
// hallucination risk for the (majority) of questions that match the pattern
// cleanly — Groq is only worth calling for the ones that don't.
//
// This format assumes the source already HAS an answer key embedded in the text.
// Source documents with no such marker (see docxText.ts callers) can't produce a
// trustworthy correctIndex this way at all — see extractExam.ts for how that's
// handled (flagged, not guessed).

export type ParsedExamQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number; // -1 if no marker was found — caller must handle this
  explanation: string; // '' if no Explanation: block was found
  explanationSource: 'transcribed' | 'generated';
  confidence: 'high' | 'low';
  note?: string;
  rawText: string; // original block text, for any Groq fallback that needs real source material
};

// Source files in this pipeline embed both a correct-answer marker AND a "why
// the other options are wrong: A. ... B. ..." explanation — two independent
// signals for the same fact. When they disagree (the marked-correct letter is
// listed among the ones the explanation says are wrong), that's evidence of an
// error in the SOURCE document, not the parser — confirmed by hand on at least
// one real question in the Biology 2016 paper, where the marker sat on an
// option the explanation itself calls incorrect. Cheap to check, valuable to
// catch automatically rather than trusting the marker blindly.
export function explanationContradictsAnswer(explanation: string, correctIndex: number): boolean {
  if (correctIndex < 0) return false;
  const letter = String.fromCharCode(65 + correctIndex);
  const wrongSectionMatch = explanation.match(/wrong:?\s*(.*)$/i);
  if (!wrongSectionMatch) return false;
  const letterListedAsWrong = new RegExp(`(?:^|[\\s,;.])${letter}\\.\\s`).test(wrongSectionMatch[1]);
  return letterListedAsWrong;
}

// File-level check: if the marker overwhelmingly lands on one letter across a
// large batch of questions, that's not a real exam's answer distribution — it's
// evidence the marker itself is broken for this whole file (confirmed on real
// files: Biology and History 2016 both had ~100% "A", while English and SAT 2016
// had a normal spread). Conservative thresholds (needs both a real sample size
// and a heavy skew) so a small or genuinely lopsided quiz doesn't false-positive.
export function isAnswerKeyUnreliable(questions: ParsedExamQuestion[]): boolean {
  const withKey = questions.filter((q) => q.correctIndex >= 0);
  if (withKey.length < 10) return false;
  const counts = new Map<number, number>();
  for (const q of withKey) counts.set(q.correctIndex, (counts.get(q.correctIndex) ?? 0) + 1);
  const maxShare = Math.max(...counts.values()) / withKey.length;
  return maxShare > 0.85;
}

const QUESTION_START = /^\s*(\d+)\.\s*/;
const OPTION_START = /^\s*([A-F])[.)]\s*(.*)$/;
const EXPLANATION_START = /^\s*Explanation\s*:\s*/i;
const CORRECT_MARKER = /\s*'\s*$/;

// Finds a "Grade <n> · <Subject> · <year>" style header line near the top of the
// document, if present. Purely informational (the caller supplies subject/year
// explicitly via CLI flags) — used only to sanity-check the file matches what
// was passed in.
export function findHeaderLine(text: string): string | null {
  const lines = text.split('\n').slice(0, 10);
  const headerLine = lines.find((l) => /grade\s+\d+/i.test(l) && l.includes('·'));
  return headerLine?.trim() ?? null;
}

export function parseExamQuestions(text: string): ParsedExamQuestion[] {
  const lines = text.split('\n');
  const blocks: string[][] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    if (QUESTION_START.test(line)) {
      if (current) blocks.push(current);
      current = [line.replace(QUESTION_START, '')];
    } else if (current) {
      current.push(line);
    }
  }
  if (current) blocks.push(current);

  return blocks.map((block) => parseBlock(block));
}

function parseBlock(lines: string[]): ParsedExamQuestion {
  const promptLines: string[] = [];
  const options: string[] = [];
  const explanationLines: string[] = [];
  let correctIndex = -1;
  let section: 'prompt' | 'options' | 'explanation' = 'prompt';

  for (const rawLine of lines) {
    const optionMatch = rawLine.match(OPTION_START);
    if (optionMatch) {
      section = 'options';
      let optionText = optionMatch[2].trim();
      if (CORRECT_MARKER.test(optionText)) {
        correctIndex = options.length;
        optionText = optionText.replace(CORRECT_MARKER, '').trim();
      }
      options.push(optionText);
      continue;
    }
    if (EXPLANATION_START.test(rawLine)) {
      section = 'explanation';
      explanationLines.push(rawLine.replace(EXPLANATION_START, ''));
      continue;
    }
    if (section === 'prompt') {
      promptLines.push(rawLine);
    } else if (section === 'options' && options.length > 0 && rawLine.trim().length > 0) {
      // A wrapped continuation of the last option (long options routinely wrap
      // to a second line in -layout output) — appended rather than dropped,
      // since the correct-answer marker often lands on the wrapped line, not
      // the first one (e.g. "...on the inner membrane of mitochondria. '").
      let text = rawLine.trim();
      if (CORRECT_MARKER.test(text)) {
        correctIndex = options.length - 1;
        text = text.replace(CORRECT_MARKER, '').trim();
      }
      options[options.length - 1] = `${options[options.length - 1]} ${text}`.trim();
    } else if (section === 'explanation') {
      explanationLines.push(rawLine);
    }
  }

  const explanation = explanationLines.join(' ').replace(/\s+/g, ' ').trim();
  const prompt = promptLines.join(' ').replace(/\s+/g, ' ').trim();

  const contradicted = correctIndex >= 0 && explanationContradictsAnswer(explanation, correctIndex);
  const confidence: 'high' | 'low' =
    options.length >= 2 && correctIndex >= 0 && prompt.length > 0 && !contradicted ? 'high' : 'low';

  return {
    prompt,
    options: options.map((o) => o.replace(/\s+/g, ' ').trim()),
    correctIndex,
    ...(contradicted && {
      note: `The marked answer (${String.fromCharCode(65 + correctIndex)}) is listed as incorrect in this question's own explanation — the source document contradicts itself. Verify the real answer by hand.`,
    }),
    explanation,
    explanationSource: 'transcribed',
    confidence,
    rawText: lines.join('\n').trim(),
  };
}
