export type ItemKind = 'food' | 'animal' | 'person' | 'thing';

export interface Item {
  singular: string;
  plural: string;
  gender: 'm' | 'f';
  kind: ItemKind;
}

const item = (singular: string, plural: string, gender: 'm' | 'f', kind: ItemKind): Item => ({
  singular,
  plural,
  gender,
  kind,
});

export const ITEMS: Item[] = [
  item('manzana', 'manzanas', 'f', 'food'),
  item('plátano', 'plátanos', 'm', 'food'),
  item('galleta', 'galletas', 'f', 'food'),
  item('caramelo', 'caramelos', 'm', 'food'),
  item('fresa', 'fresas', 'f', 'food'),
  item('helado', 'helados', 'm', 'food'),
  item('naranja', 'naranjas', 'f', 'food'),
  item('croqueta', 'croquetas', 'f', 'food'),
  item('piruleta', 'piruletas', 'f', 'food'),
  item('sandía', 'sandías', 'f', 'food'),
  item('cromo', 'cromos', 'm', 'thing'),
  item('globo', 'globos', 'm', 'thing'),
  item('pila', 'pilas', 'f', 'thing'),
  item('canica', 'canicas', 'f', 'thing'),
  item('pegatina', 'pegatinas', 'f', 'thing'),
  item('calcetín', 'calcetines', 'm', 'thing'),
  item('peluche', 'peluches', 'm', 'thing'),
  item('sombrero', 'sombreros', 'm', 'thing'),
  item('paraguas', 'paraguas', 'm', 'thing'),
  item('cometa', 'cometas', 'f', 'thing'),
  item('pelota', 'pelotas', 'f', 'thing'),
  item('pingüino', 'pingüinos', 'm', 'animal'),
  item('pato', 'patos', 'm', 'animal'),
  item('rana', 'ranas', 'f', 'animal'),
  item('elefante', 'elefantes', 'm', 'animal'),
  item('caracol', 'caracoles', 'm', 'animal'),
  item('pulpo', 'pulpos', 'm', 'animal'),
  item('jirafa', 'jirafas', 'f', 'animal'),
  item('tortuga', 'tortugas', 'f', 'animal'),
  item('loro', 'loros', 'm', 'animal'),
  item('hormiga', 'hormigas', 'f', 'animal'),
  item('payaso', 'payasos', 'm', 'person'),
  item('pirata', 'piratas', 'm', 'person'),
  item('astronauta', 'astronautas', 'm', 'person'),
  item('mago', 'magos', 'm', 'person'),
  item('hada', 'hadas', 'f', 'person'),
];

export const FEMALE_NAMES = [
  'Lucía',
  'Sofía',
  'Carmen',
  'Alba',
  'Laura',
  'Paula',
  'Marta',
  'Nora',
  'Ariadna',
  'Valeria',
  'Julia',
  'Clara',
];

export const MALE_NAMES = [
  'Mateo',
  'Hugo',
  'Leo',
  'Pablo',
  'Daniel',
  'Martín',
  'Álvaro',
  'Nico',
  'Iker',
  'Biel',
  'Adrián',
  'Samuel',
];

export const CHISPA = 'Chispa';
export const CHISPA_ODDS = 0.08;

/**
 * Placeholders: `{who}`, `{other}`, `{n}` (the amount with its noun), `{items}` (the plural
 * noun) and `{cuantos}` (cuántos or cuántas). Amounts are always two digits or more, so every
 * verb stays plural.
 */
export interface Phrase {
  text: string;
  /** Only used with items of these kinds. */
  for?: ItemKind[];
}

export interface Scene {
  for?: ItemKind[];
  start: string;
  question: string;
  add: Phrase[];
  sub: Phrase[];
}

export const SCENES: Scene[] = [
  {
    start: '{who} tiene {n}.',
    question: '¿{cuantos} {items} tiene ahora {who}?',
    add: [
      { text: '{other} le regala {n}.' },
      { text: 'Luego {who} compra {n}.' },
      { text: '{who} encuentra {n} en el parque.' },
      { text: '{who} gana {n} en un concurso.' },
      { text: 'En el cole, {who} recoge {n} más.' },
    ],
    sub: [
      { text: '{who} regala {n} a {other}.' },
      { text: '{who} pierde {n} jugando.' },
      { text: '{who} presta {n} a {other}.' },
      { text: 'A {who} se le rompen {n}.', for: ['thing'] },
      { text: '{who} se come {n}.', for: ['food'] },
    ],
  },
  {
    for: ['animal', 'person'],
    start: 'En el autobús van {n}.',
    question: '¿{cuantos} {items} hay ahora en el autobús?',
    add: [{ text: 'En la parada suben {n}.' }],
    sub: [{ text: 'En la parada bajan {n}.' }],
  },
  {
    for: ['food', 'thing'],
    start: 'En la tienda hay {n}.',
    question: '¿{cuantos} {items} hay ahora en la tienda?',
    add: [{ text: 'Hoy llegan {n} más.' }],
    sub: [{ text: 'Se venden {n}.' }],
  },
  {
    for: ['animal', 'person'],
    start: 'En la fiesta hay {n}.',
    question: '¿{cuantos} {items} hay ahora en la fiesta?',
    add: [{ text: 'Llegan {n} más.' }],
    sub: [{ text: 'Se van a casa {n}.' }],
  },
];

export type HintKey = 'add-1' | 'sub-1' | 'add-2' | 'sub-2' | 'steps';

export const HINTS: Record<HintKey, string> = {
  'add-1': 'Prueba a sumar primero las decenas y luego las unidades.',
  'sub-1': 'Prueba a restar por partes: primero las decenas y luego las unidades.',
  'add-2': 'Suma primero las centenas, luego las decenas y al final las unidades.',
  'sub-2': 'Resta por partes: primero las centenas, luego las decenas y al final las unidades.',
  steps: 'Ve paso a paso: haz primero una cuenta y con su resultado, la siguiente.',
};

export const PROBLEM_INTROS = [
  '¡Reto de mates en marcha!',
  'Atención, problema:',
  '¡Allá va uno!',
  '¡Enciende la cabeza de calcular!',
];

export const PROBLEM_HARDER = '¿Otro más difícil?';
export const PROBLEM_HOOKS = ['¿Otro?', '¿Te animas con otro?', '¿Vamos con otro reto?'];
export const streakLine = (streak: number): string => `¡Ya van ${streak} seguidos!`;
