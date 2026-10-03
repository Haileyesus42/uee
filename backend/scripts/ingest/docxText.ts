// Thin wrapper around pandoc (already installed on this machine) for .docx text
// extraction — these files are native Word documents, not scans, so this is a
// direct format conversion with no OCR/vision involved at all.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function docxText(path: string): Promise<string> {
  const { stdout } = await execFileAsync('pandoc', ['-t', 'plain', path], { maxBuffer: 20 * 1024 * 1024 });
  return stdout;
}
