import { joinNames } from './join';

/** The opening of a right riddle answer, or nothing when nobody has said a name. */
export function praise(names: readonly string[]): string {
  return names.length === 0 ? '' : `¡Has acertado, ${joinNames(names, 'and')}!`;
}
