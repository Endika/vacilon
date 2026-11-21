/** International Morse; `.` is a dot and `-` a dash. */
export const MORSE: Record<string, string> = {
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  ñ: '--.--',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
};

export const MAX_CHARS = 12;

export const MORSE_NEED_WORD =
  '¡Dime qué palabra quieres y la pito en Morse! Por ejemplo: «hola». ¿Cuál es la tuya?';
export const MORSE_TOO_LONG = '¡Uf, eso es muy largo! Te lo digo hasta aquí.';
export const MORSE_INTROS = [
  '¡Allá va! Mira y escucha.',
  '¡Bip, bip! Mira y escucha cómo pita.',
  '¡Morse en marcha!',
];
export const MORSE_HOOKS = [
  '¿Te animas con otra palabra?',
  '¡Pídeme otra! ¿Qué palabra quieres ahora?',
  'Ahora tú: ¿me dices otra palabra para pitarla?',
];

export const TEACH_WORDS = [
  'sol',
  'mar',
  'luz',
  'pan',
  'ola',
  'paz',
  'sos',
  'gato',
  'luna',
  'casa',
  'pato',
  'nube',
];
export const TEACH_INTROS = [
  '¡Vamos con el Morse! Un punto es un pitido corto y una raya, uno largo. Escucha: ¿qué palabra es?',
  '¡Morse, qué guay! Puntos cortitos, rayas largas. Mira y escucha: ¿qué palabra te pito?',
];
export const TEACH_AGAIN = ['¿Quieres otra palabra en Morse?', '¿Vamos con otra palabra?'];
