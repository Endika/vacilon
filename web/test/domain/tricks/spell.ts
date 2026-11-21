const UNITS = [
  'cero',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciseis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
];
const TWENTIES = [
  'veinti',
  'veintiuno',
  'veintidos',
  'veintitres',
  'veinticuatro',
  'veinticinco',
  'veintiseis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
];
const TENS = [
  '',
  '',
  '',
  'treinta',
  'cuarenta',
  'cincuenta',
  'sesenta',
  'setenta',
  'ochenta',
  'noventa',
];
const HUNDREDS = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
];

function belowHundred(n: number): string {
  if (n <= 20) return UNITS[n];
  if (n < 30) return TWENTIES[n - 20];
  const [tens, unit] = [Math.floor(n / 10), n % 10];
  return unit === 0 ? TENS[tens] : `${TENS[tens]} y ${UNITS[unit]}`;
}

/** Normalized Spanish words for 0 to 999, written independently of the parser under test. */
export function spell(n: number): string {
  if (n === 100) return 'cien';
  if (n < 100) return belowHundred(n);
  const rest = n % 100;
  return rest === 0 ? HUNDREDS[n / 100] : `${HUNDREDS[Math.floor(n / 100)]} ${belowHundred(rest)}`;
}
