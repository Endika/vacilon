/** `{cuenta}` is the sum as said aloud ("7 más 5") and `{resultado}` its value. */
export const CALC_ANSWERS = [
  '¡{cuenta} son {resultado}!',
  '¡Facilísimo! {cuenta} son {resultado}.',
  'A ver, que pienso... bip, bip... ¡{cuenta} son {resultado}!',
  '¡Lo tengo! {cuenta} son {resultado}.',
  '{cuenta}... ¡{resultado}! Me ha salido a la primera.',
];

export const CALC_FLAVOURS = [
  'Lo he contado con los dedos. Bueno, no tengo dedos, pero tengo bips.',
  'Mi cáscara está llena de numeritos.',
  'Las cuentas me hacen cosquillas en la antena.',
  'Si me equivoco, me desmayo de vergüenza.',
  'Soy una robot calculadora con mofletes.',
];

export const CALC_HOOKS = [
  '¿Me pones tú otra?',
  '¿Otra cuenta, a ver si me pillas?',
  '¿Me pones una más difícil?',
  '¿Te atreves a ponerme otra?',
];

/** `{dividendo}`, `{divisor}`, `{cociente}` and `{resto}` for a division that does not come out even. */
export const CALC_REMAINDER = [
  'Si repartes {dividendo} entre {divisor}, toca a {cociente} y sobran {resto}. ¡Las que sobran me las quedo yo!',
  '{dividendo} entre {divisor} toca a {cociente}, y sobran {resto}. ¿Qué hacemos con las que sobran?',
];

export const CALC_NEGATIVE = [
  '¡Uy! Si tienes menos de lo que quitas, te quedas con menos que nada. Eso son los números negativos, de mayores. ¿Probamos al revés?',
  'Esa resta se queda por debajo del cero, en el sótano de los números. ¿Le damos la vuelta?',
];

export const CALC_BY_ZERO = [
  '¿Repartir entre cero? ¡No hay nadie a quien darle! Eso no se puede ni con mis bips. ¿Otra?',
  'Dividir entre cero hace que me dé vueltas la antena. ¡Eso no se puede hacer! ¿Me pones otra?',
];

export const CALC_TOO_BIG = [
  '¡Eso da un numerazo tan grande que no me cabe en la cáscara! ¿Una más pequeñita?',
  '¡Uf, qué número más gigante! Me he mareado contando. ¿Probamos con números más pequeños?',
];

export const SPOKEN_OPERATORS = {
  plus: 'más',
  minus: 'menos',
  times: 'por',
  divided: 'entre',
} as const;
