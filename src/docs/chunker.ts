export interface Chunk {
  text: string;
  file: string;
  index: number;
}

export interface ChunkOptions {
  maxChars?: number;
  overlapChars?: number;
}

const DEFAULT_MAX_CHARS = 1200;
const DEFAULT_OVERLAP_CHARS = 200;
const HEADING_RE = /^#{1,6}\s+/;

function splitSections(content: string): string[] {
  const lines = content.split("\n");
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (HEADING_RE.test(line) && current.length > 0) {
      sections.push(current.join("\n").trim());
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push(current.join("\n").trim());

  return sections.filter((section) => section.length > 0);
}

function slidingWindow(text: string, maxChars: number, overlapChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const windows: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    windows.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - overlapChars;
  }
  return windows;
}

export function chunkMarkdown(content: string, file: string, options: ChunkOptions = {}): Chunk[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const overlapChars = options.overlapChars ?? DEFAULT_OVERLAP_CHARS;

  const sections = splitSections(content);
  const chunks: Chunk[] = [];
  let index = 0;

  for (const section of sections) {
    for (const text of slidingWindow(section, maxChars, overlapChars)) {
      chunks.push({ text, file, index });
      index++;
    }
  }

  return chunks;
}
