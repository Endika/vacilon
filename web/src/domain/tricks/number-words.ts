const SMALL = new Map<string, number>(
  Object.entries({
    cero: 0,
    un: 1,
    uno: 1,
    una: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    dieciseis: 16,
    diecisiete: 17,
    dieciocho: 18,
    diecinueve: 19,
    veinte: 20,
    veintiun: 21,
    veintiuno: 21,
    veintiuna: 21,
    veintidos: 22,
    veintitres: 23,
    veinticuatro: 24,
    veinticinco: 25,
    veintiseis: 26,
    veintisiete: 27,
    veintiocho: 28,
    veintinueve: 29,
  }),
);

const TENS = new Map<string, number>(
  Object.entries({
    treinta: 30,
    cuarenta: 40,
    cincuenta: 50,
    sesenta: 60,
    setenta: 70,
    ochenta: 80,
    noventa: 90,
  }),
);

const HUNDREDS = new Map<string, number>(
  Object.entries({
    ciento: 100,
    doscientos: 200,
    doscientas: 200,
    trescientos: 300,
    trescientas: 300,
    cuatrocientos: 400,
    cuatrocientas: 400,
    quinientos: 500,
    quinientas: 500,
    seiscientos: 600,
    seiscientas: 600,
    setecientos: 700,
    setecientas: 700,
    ochocientos: 800,
    ochocientas: 800,
    novecientos: 900,
    novecientas: 900,
  }),
);

const VOCABULARY = new Set([...SMALL.keys(), ...TENS.keys(), ...HUNDREDS.keys(), 'cien', 'y']);

function belowHundred(tokens: string[]): number | null {
  if (tokens.length === 1) return SMALL.get(tokens[0]) ?? TENS.get(tokens[0]) ?? null;
  if (tokens.length === 3 && tokens[1] === 'y') {
    const unit = SMALL.get(tokens[2]);
    const tens = TENS.get(tokens[0]);
    return tens !== undefined && unit !== undefined && unit >= 1 && unit <= 9 ? tens + unit : null;
  }
  return null;
}

/** Reads a whole run of normalized Spanish number words, from "cero" to "novecientos noventa y nueve". */
export function parseNumberWords(tokens: string[]): number | null {
  if (tokens.length === 1 && tokens[0] === 'cien') return 100;
  const hundreds = HUNDREDS.get(tokens[0]);
  if (hundreds === undefined) return belowHundred(tokens);
  if (tokens.length === 1) return tokens[0] === 'ciento' ? null : hundreds;
  const rest = belowHundred(tokens.slice(1));
  return rest ? hundreds + rest : null;
}

function findInWords(normalized: string): number | null {
  const tokens = normalized.split(' ');
  for (let start = 0; start < tokens.length; start++) {
    if (!VOCABULARY.has(tokens[start])) continue;
    for (let end = tokens.length; end > start; end--) {
      const value = parseNumberWords(tokens.slice(start, end));
      if (value !== null) return value;
    }
  }
  return null;
}

/** The first number in the text, written with digits or with words, or null. */
export function findNumber(normalized: string): number | null {
  const digits = /\b\d+\b/.exec(normalized);
  return digits ? Number(digits[0]) : findInWords(normalized);
}
