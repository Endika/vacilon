export type ColorId =
  | 'rojo'
  | 'amarillo'
  | 'azul'
  | 'blanco'
  | 'negro'
  | 'verde'
  | 'naranja'
  | 'morado'
  | 'rosa'
  | 'marron'
  | 'gris';

export interface ColorDef {
  /** How she says it. */
  name: string;
  /** Normalized words that mean this colour. */
  words: string[];
}

export const COLORS: Record<ColorId, ColorDef> = {
  rojo: { name: 'rojo', words: ['rojo', 'roja'] },
  amarillo: { name: 'amarillo', words: ['amarillo', 'amarilla'] },
  azul: { name: 'azul', words: ['azul'] },
  blanco: { name: 'blanco', words: ['blanco', 'blanca'] },
  negro: { name: 'negro', words: ['negro', 'negra'] },
  verde: { name: 'verde', words: ['verde'] },
  naranja: { name: 'naranja', words: ['naranja'] },
  morado: { name: 'morado', words: ['morado', 'morada', 'violeta', 'purpura'] },
  rosa: { name: 'rosa', words: ['rosa', 'rosado'] },
  marron: { name: 'marrón', words: ['marron', 'cafe'] },
  gris: { name: 'gris', words: ['gris'] },
};

export interface Mix {
  a: ColorId;
  b: ColorId;
  /** How she says the result. */
  result: string;
  /** Normalized answers the quiz accepts. */
  answers: string[];
}

const mix = (a: ColorId, b: ColorId, result: string, ...answers: string[]): Mix => ({
  a,
  b,
  result,
  answers,
});

/** Paint mixing: the three primaries plus white and black give every pair of the five. */
export const MIXES: Mix[] = [
  mix('rojo', 'amarillo', 'naranja', 'naranja'),
  mix('amarillo', 'azul', 'verde', 'verde'),
  mix('rojo', 'azul', 'morado', 'morado', 'violeta', 'purpura'),
  mix('rojo', 'blanco', 'rosa', 'rosa', 'rosado'),
  mix('blanco', 'negro', 'gris', 'gris'),
  mix('rojo', 'negro', 'granate', 'granate', 'rojo oscuro'),
  mix('azul', 'blanco', 'celeste', 'celeste', 'azul claro'),
  mix('azul', 'negro', 'azul marino', 'azul marino', 'azul oscuro'),
  mix('amarillo', 'blanco', 'amarillo claro', 'amarillo claro', 'crema'),
  mix('amarillo', 'negro', 'verde oliva', 'verde oliva', 'verde oscuro'),
  mix('rojo', 'verde', 'marrón', 'marron', 'cafe'),
  mix('azul', 'naranja', 'marrón', 'marron', 'cafe'),
  mix('amarillo', 'morado', 'marrón', 'marron', 'cafe'),
  mix('verde', 'blanco', 'verde claro', 'verde claro'),
  mix('verde', 'negro', 'verde oscuro', 'verde oscuro'),
  mix('naranja', 'blanco', 'melocotón', 'melocoton', 'naranja claro'),
  mix('morado', 'blanco', 'lila', 'lila', 'morado claro'),
  mix('azul', 'verde', 'turquesa', 'turquesa', 'azul verdoso'),
];

/** `{a}`, `{b}` and `{r}` are the two colours and the result. */
export const MIX_ANSWERS = [
  'Si mezclas {a} con {b}, ¡sale {r}!',
  '¡Mezcla {a} y {b} y te sale {r}!',
  'Con {a} y {b} sale… ¡{r}! Es magia de pinturas.',
];
export const SAME_ANSWERS = [
  'Si mezclas {a} con {a}, ¡sigue siendo {a}!',
  'Con {a} y {a} no cambia nada: ¡sigue siendo {a}!',
];
export const MIX_HOOKS = [
  '¿Probamos otra mezcla?',
  '¿Qué dos colores mezclamos ahora?',
  '¿Y si pruebas con otros? ¡Pregúntame!',
];
export const MIX_UNKNOWN = [
  '¡Esa mezcla no la he probado! ¿Lo pruebas con pinturas y me cuentas?',
  '¡Uy, esa no me la sé! ¿La pruebas con pinturas y me cuentas qué sale?',
];
export const MIX_NEED_TWO =
  '¡Dime dos colores y te cuento qué sale! Por ejemplo: azul y amarillo. ¿Cuáles pruebas?';

export const QUIZ_INTROS = [
  '¡A jugar a los colores!',
  '¡Concurso de colores!',
  '¡Atención, artistas!',
];
/** `{a}` and `{b}` are the two colours. */
export const QUIZ_QUESTION = '¿Qué color sale si mezclas {a} con {b}?';
export const QUIZ_AGAIN = ['¿Otro color?', '¿Vamos con otra mezcla?', '¿Te animas con otro?'];
