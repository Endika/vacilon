import { WELCOME } from '../phrases';

export const ASK_NAME = '¿Cómo te llamas? Así me acuerdo de ti.';
export const WELCOME_AND_ASK = `${WELCOME} ${ASK_NAME}`;
export const UNSAFE_NAME = '¡Ese nombre no me lo creo! ¿Cómo te llamas de verdad?';
export const UNKNOWN_NAME = 'Aún no lo sé. ¿Me lo dices?';
export const FORGOT_MINE =
  'Hecho, ya no me acuerdo de tu nombre. Si quieres, me lo vuelves a decir.';
export const FORGOT_ALL = 'Hecho, he olvidado todos los nombres. Empezamos de cero.';

/** `{x}` is replaced by the names. */
export const LEARNED = '¡Encantada, {x}! Ya me sé tu nombre: lo guardo en mi cáscara.';
export const MISSED = '¡Hola, {x}! Te había echado de menos.';
export const COMPANY_TWO = '¡Hola, {x}! Qué bien, compañía doble.';
export const COMPANY_MANY = '¡Hola, {x}! Qué bien, cuánta compañía.';
export const WHO_IS_HERE = '¡Hola! ¿Quién eres hoy: {x}?';
export const YOU_ARE = '¡Eres {x}! Me acuerdo perfectamente.';
export const YOU_ARE_MANY = '¡Sois {x}! Me acuerdo perfectamente.';
export const GREETINGS = [
  '¡Hola, {x}! ¡Qué alegría verte!',
  '¡Hola otra vez, {x}! ¿Hablamos?',
  '¡Bip! ¡Hola, {x}! Te estaba esperando.',
];

export function fill(template: string, names: string): string {
  return template.replace('{x}', names);
}
