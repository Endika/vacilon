import { randomNoRepeat, type Rng } from '../random';
import { shuffleBag } from './bag';
import { FACTS, FACT_INTROS } from './content/facts';
import type { Trick } from './types';

const SOMETHING = '(curioso|interesante|divertido|chulo)s?';

export function createFact(rng: Rng): Trick {
  const nextFact = shuffleBag(FACTS, rng);
  const intro = randomNoRepeat(FACT_INTROS, rng);
  return {
    id: 'fact',
    triggers: [
      new RegExp(`\\b(cuentame|cuenta|dime|dinos|dame|sabes|ponme) algo ${SOMETHING}\\b`),
      /\b(cuentame|cuenta|dime|dinos|dame) algo que (yo )?no (se|sepa|sepamos)\b/,
      new RegExp(`\\b(un|otro|algun) dato ${SOMETHING}\\b`),
      /\b(dime|dame|cuentame|quiero|dinos) (un|otro|algun) dato\b/,
      /\botro dato\b/,
      /\b(cuentame|dime) (cosas|datos) (curiosas|curiosos|interesantes)\b/,
      /^((oye|hola|venga|chispa) )*sabias que$/,
    ],
    async run(stage) {
      const fact = nextFact();
      await stage.say(`${intro()} ${fact.text} ${fact.hook}`);
      return null;
    },
  };
}
