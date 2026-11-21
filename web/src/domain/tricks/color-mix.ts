import { COLORS, MIXES, type ColorDef, type ColorId, type Mix } from './content/colors';

const WORDS = new Map<string, ColorId>(
  (Object.entries(COLORS) as [ColorId, ColorDef][]).flatMap(([id, color]) =>
    color.words.map((word): [string, ColorId] => [word, id]),
  ),
);

export const COLOR_WORDS = [...WORDS.keys()].join('|');

const WORD_PATTERN = new RegExp(`\\b(${COLOR_WORDS})\\b`, 'g');

const VOCABULARY = new RegExp(
  `\\b(${[...WORDS.keys(), ...MIXES.flatMap((m) => m.answers)].join('|')})\\b`,
);

/** Whether the text names any colour she knows, mixed or not. */
export const mentionsColor = (normalized: string): boolean => VOCABULARY.test(normalized);

const keyOf = (a: ColorId, b: ColorId): string => [a, b].sort().join('+');

const MIX_BY_PAIR = new Map(MIXES.map((m) => [keyOf(m.a, m.b), m]));

/** Colours named in the text, in order; a repeated colour counts twice. */
export function findColors(normalized: string): ColorId[] {
  return [...normalized.matchAll(WORD_PATTERN)].map((match) => WORDS.get(match[1]) as ColorId);
}

export function mixOf(a: ColorId, b: ColorId): Mix | null {
  return MIX_BY_PAIR.get(keyOf(a, b)) ?? null;
}

export const nameOf = (id: ColorId): string => COLORS[id].name;
