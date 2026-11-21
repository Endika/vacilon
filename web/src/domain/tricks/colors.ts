import { randomNoRepeat, type Rng } from '../random';
import { COLOR_WORDS, findColors, mixOf, nameOf } from './color-mix';
import { MIX_ANSWERS, MIX_HOOKS, MIX_NEED_TWO, MIX_UNKNOWN, SAME_ANSWERS } from './content/colors';
import { normalizeForFilter } from '../conversation/safety';
import { fill } from './template';
import type { Trick } from './types';

const COLOR = `(${COLOR_WORDS})`;
const ASKING = '(sale|sera|se hace|resulta|obtengo|obtenemos|queda|da)';

export function createColors(rng: Rng): Trick {
  const answer = randomNoRepeat(MIX_ANSWERS, rng);
  const same = randomNoRepeat(SAME_ANSWERS, rng);
  const unknown = randomNoRepeat(MIX_UNKNOWN, rng);
  const hook = randomNoRepeat(MIX_HOOKS, rng);

  function reply(text: string): string {
    const [first, second] = findColors(normalizeForFilter(text));
    if (!first || !second) return MIX_NEED_TWO;
    if (first === second) return `${fill(same(), { a: nameOf(first) })} ${hook()}`;
    const mix = mixOf(first, second);
    if (!mix) return unknown();
    const values = { a: nameOf(first), b: nameOf(second), r: mix.result };
    return `${fill(answer(), values)} ${hook()}`;
  }

  return {
    id: 'colors',
    triggers: [
      /\bmezcl\w+ (los )?colores\b/,
      new RegExp(`\\bmezcl\\w+\\b.*\\b${COLOR}\\b`),
      new RegExp(
        `\\bque (color )?${ASKING}\\b.*\\b${COLOR}\\b.*\\b(con|y|e|mas)\\b.*\\b${COLOR}\\b`,
      ),
      new RegExp(`\\b${COLOR} (con|y|mas) ${COLOR}\\b.*\\bque (color )?${ASKING}\\b`),
    ],
    async run(stage, text) {
      await stage.say(reply(text));
      return null;
    },
  };
}
