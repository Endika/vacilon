import type { Riddle } from './types';

export const RIDDLES: Riddle[] = [
  {
    question: 'Blanco por dentro, verde por fuera. Si quieres que te lo diga, espera.',
    answers: ['pera'],
    solution: 'la pera',
  },
  {
    question: 'Tiene dientes y no come, tiene cabeza y no es persona.',
    answers: ['ajo', 'ajos'],
    solution: 'el ajo',
  },
  {
    question: 'Agua pasa por mi casa, cate de mi corazón.',
    answers: ['aguacate', 'aguacates'],
    solution: 'el aguacate',
  },
  {
    question: 'Tengo agujas y no sé coser, tengo números y no sé leer.',
    answers: ['reloj', 'relojes'],
    solution: 'el reloj',
  },
  {
    question: 'Vuela sin alas, silba sin boca, empuja sin manos y no se ve.',
    answers: ['viento', 'aire'],
    solution: 'el viento',
  },
  {
    question: 'Lleva su casa a cuestas y deja un caminito brillante.',
    answers: ['caracol', 'caracoles', 'babosa'],
    solution: 'el caracol',
  },
  {
    question: 'Cuanto más grande es, menos se ve.',
    answers: ['oscuridad', 'oscuro', 'noche'],
    solution: 'la oscuridad',
  },
  {
    question: 'Te la digo y no me entiendes, te la repito y no me comprendes.',
    answers: ['tela'],
    solution: 'la tela',
  },
  {
    question: 'Soy un huevito que flota, blanco y rosa, y hago bip.',
    answers: ['chispa', 'tu', 'robot'],
    solution: 'yo, Chispa',
  },
  {
    question: 'Vuelo de noche, duermo de día y nunca verás plumas en el ala mía.',
    answers: ['murcielago', 'murcielagos'],
    solution: 'el murciélago',
  },
  {
    question: 'Tiene hojas y no es árbol, tiene lomo y no es caballo.',
    answers: ['libro', 'libros', 'cuaderno'],
    solution: 'el libro',
  },
  {
    question: 'Sube llena y baja vacía, y si no se da prisa, la sopa se enfría.',
    answers: ['cuchara', 'cucharas'],
    solution: 'la cuchara',
  },
  {
    question: 'Cuanto más le quitas, más grande se hace.',
    answers: ['agujero', 'hoyo', 'bujero'],
    solution: 'el agujero',
  },
  {
    question: 'Tiene ojos y no ve, tiene agua y no la bebe, y está peludo por fuera.',
    answers: ['coco', 'cocos'],
    solution: 'el coco',
  },
  {
    question: 'Sale de noche, redonda y plateada, y a veces se esconde como una tajada.',
    answers: ['luna'],
    solution: 'la luna',
  },
  {
    question: 'Cuanto más mojada está, más seca.',
    answers: ['toalla', 'toallas'],
    solution: 'la toalla',
  },
];

export const RIDDLE_INTROS = [
  '¡A ver si la adivinas!',
  'Atención, adivinanza:',
  'Esta es difícil, ¿eh?',
];
export const GIVE_UP = [
  '\\bno se\\b',
  '\\bme rindo\\b',
  '\\bdimelo\\b',
  '\\bni idea\\b',
  '\\bpista\\b',
];
export const RIGHT = [
  '¡Has acertado! ¡Eres una máquina, como yo!',
  '¡Bip bip, correcto! Qué cabeza tienes.',
  '¡Sí! ¡Me has pillado!',
];
/** `{x}` is replaced by the solution. */
export const WRONG = [
  '¡Casi! Era {x}.',
  'Uy, no. ¡Era {x}!',
  '¡Buen intento! La respuesta es {x}.',
];

/** `{x}` is replaced by the solution; said when she gives up. */
export const REVEAL = [
  '¡Era {x}! A la próxima la pillas.',
  'Te lo digo bajito: {x}.',
  '¡Tachán! Era {x}. ¿A que tenía truco?',
];
