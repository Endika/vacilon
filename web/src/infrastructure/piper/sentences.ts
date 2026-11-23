const MAX_CHUNK = 90;
const TARGET_CHUNK = 60;

// Never end a sentence: titles, initials and the like.
const NEVER_END = new Set([
  'sr',
  'sra',
  'srta',
  'dr',
  'dra',
  'd',
  'dña',
  'ud',
  'uds',
  'vd',
  'vds',
  'prof',
  'lic',
  'ing',
  'arq',
  'sto',
  'sta',
  'av',
  'avda',
  'núm',
  'pág',
  'págs',
  'tel',
  'aprox',
  'ee',
]);
// Abbreviations that may also close a sentence: only joined when a lowercase word follows.
const MAYBE_END = new Set(['etc', 'ej', 'p', 'uu', 'cía', 'máx', 'mín']);

const TERMINATOR = /[.!?…]/;
const CLOSERS = /["'”’»)\]]/;

function isAbbreviation(before: string, next: string): boolean {
  const word = /([\p{L}]+)$/u.exec(before)?.[1];
  if (!word) return false;
  if (word.length === 1 && /\p{Lu}/u.test(word) && /(^|[\s(¡¿"“«])$/.test(before.slice(0, -1)))
    return true;
  const lower = word.toLowerCase();
  if (NEVER_END.has(lower)) return true;
  return MAYBE_END.has(lower) && /^\p{Ll}|^\d/u.test(next);
}

function splitLong(sentence: string): string[] {
  if (sentence.length <= MAX_CHUNK) return [sentence];
  const pieces = sentence.split(/(?<=,)\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const piece of pieces) {
    if (current !== '' && current.length + 1 + piece.length > TARGET_CHUNK) {
      chunks.push(current);
      current = piece;
    } else {
      current = current === '' ? piece : `${current} ${piece}`;
    }
  }
  if (current !== '') chunks.push(current);
  return chunks;
}

export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  let i = 0;
  while (i < text.length) {
    if (!TERMINATOR.test(text[i])) {
      i++;
      continue;
    }
    let end = i;
    while (end < text.length && TERMINATOR.test(text[end])) end++;
    const onlyDots = text.slice(i, end) === '.';
    while (end < text.length && CLOSERS.test(text[end])) end++;
    const atBoundary = end >= text.length || /\s/.test(text[end]);
    const rest = text.slice(end).trimStart();
    if (atBoundary && !(onlyDots && isAbbreviation(text.slice(start, i), rest))) {
      sentences.push(text.slice(start, end));
      start = end;
    }
    i = end;
  }
  sentences.push(text.slice(start));
  return sentences
    .map((s) => s.trim())
    .filter((s) => /\p{L}|\d/u.test(s))
    .flatMap(splitLong);
}
