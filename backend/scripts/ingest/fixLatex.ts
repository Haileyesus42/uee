// Repairs a well-known class of model inconsistency: LaTeX commands that
// sometimes lose their leading backslash. \dfrac, \frac, and \sqrt are the
// frequent offenders — the model knows the command but occasionally emits it
// bare. Commands that already have a backslash are left untouched.
//
// Applied at import time (before the write to Postgres) so every paper gets
// the same fix without per-paper manual correction.

const COMMANDS_TO_FIX = [
  'dfrac', 'frac', 'tfrac',
  'sqrt',
  'pi', 'theta', 'alpha', 'beta', 'gamma', 'delta',
  'times', 'div', 'cdot', 'pm', 'mp',
  'leq', 'geq', 'neq', 'approx', 'equiv',
  'infty', 'sum', 'prod', 'int', 'partial',
  'to', 'rightarrow', 'leftarrow', 'Rightarrow',
  'left', 'right',
  'text', 'mathrm', 'mathbf', 'mathit',
  'sin', 'cos', 'tan', 'log', 'ln',
  'ldots', 'dots', 'cdots',
  'degree', 'circ', 'angle',
];

function fixLatex(input: string): string {
  if (!input) return input;
  let out = input;

  for (const cmd of COMMANDS_TO_FIX) {
    // Match the bare command not preceded by a backslash.
    // - (?<!\\) negative lookbehind: don't match if already \dfrac
    // - \b word boundary after so "pink" doesn't match "pi"
    // Followed by either { (for brace commands) or a space/end (for symbol commands)
    const re = new RegExp(`(?<!\\\\)\\b${cmd}\\b`, 'g');
    out = out.replace(re, `\\${cmd}`);
  }

  return out;
}

/** Repairs a batch of extracted questions in place. */
export function fixLatexOnQuestions<T extends {
  prompt: string;
  options: string[];
  explanation: string;
}>(questions: T[]): T[] {
  return questions.map((q) => ({
    ...q,
    prompt: fixLatex(q.prompt),
    options: q.options.map(fixLatex),
    explanation: fixLatex(q.explanation),
  }));
}
