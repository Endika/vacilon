export const GIVE_UP_ANSWER = [
  '\\bno se\\b',
  '\\bme rindo\\b',
  '\\bdimelo\\b',
  '\\bni idea\\b',
  '\\bla respuesta\\b',
  '\\bla solucion\\b',
];

/** Said after a result: any of these asks for another round. */
export const AGAIN =
  /\b(otro|otra|otros|otras|si|vale|venga|claro|dale|ok|okey|bueno|va)\b|\bmas dificil\b/;

export const CHEERS = [
  '¡Bip bip, qué cabeza!',
  '¡Así se hace!',
  '¡Mis lucecitas bailan de alegría!',
  '¡Esto sí que es magia!',
];

export const RETRY_OPENERS = ['¡Casi!', 'Uy, todavía no.', '¡Muy cerca!'];
export const RETRY_HOOKS = [
  '¡Inténtalo otra vez!',
  '¿Lo intentas de nuevo?',
  '¡Tú puedes! ¿Otra vez?',
];

export const NUDGES = [
  'Bip, no te he entendido. ¿Me lo dices otra vez, despacito?',
  '¡Ups, no te he pillado! ¿Me lo repites?',
];

export const MISS_OPENERS = ['No pasa nada.', '¡Buen intento!', '¡Te lo explico!'];
export const MISS_HOOKS = ['¿Probamos con otro?', '¿Vamos con otro reto?', '¿Te animas a otro?'];
