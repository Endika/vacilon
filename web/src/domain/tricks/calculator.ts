import { randomNoRepeat, type Picker, type Rng } from '../random';
import { calculate, parseCalculation, type Calculation, type Outcome } from './calculation';
import {
  CALC_ANSWERS,
  CALC_BY_ZERO,
  CALC_FLAVOURS,
  CALC_HOOKS,
  CALC_NEGATIVE,
  CALC_REMAINDER,
  CALC_TOO_BIG,
  SPOKEN_OPERATORS,
} from './content/calculator';
import { fill } from './template';
import type { Trick } from './types';

/** Answers the sums she is asked, always right, in her own voice. */
export function createCalculator(rng: Rng): Trick {
  const pick = (list: readonly string[]): Picker => randomNoRepeat(list, rng);
  const answer = pick(CALC_ANSWERS);
  const flavour = pick(CALC_FLAVOURS);
  const hook = pick(CALC_HOOKS);
  const remainder = pick(CALC_REMAINDER);
  const negative = pick(CALC_NEGATIVE);
  const byZero = pick(CALC_BY_ZERO);
  const tooBig = pick(CALC_TOO_BIG);

  function reply(calculation: Calculation, outcome: Outcome): string {
    const { left, operator, right } = calculation;
    switch (outcome.kind) {
      case 'exact': {
        const cuenta = `${left} ${SPOKEN_OPERATORS[operator]} ${right}`;
        return `${fill(answer(), { cuenta, resultado: String(outcome.value) })} ${flavour()} ${hook()}`;
      }
      case 'remainder':
        return fill(remainder(), {
          dividendo: String(left),
          divisor: String(right),
          cociente: String(outcome.quotient),
          resto: String(outcome.remainder),
        });
      case 'negative':
        return negative();
      case 'by-zero':
        return byZero();
      case 'too-big':
        return tooBig();
    }
  }

  return {
    id: 'calculator',
    triggers: [],
    matches: (text) => parseCalculation(text) !== null,
    async run(stage, text) {
      const calculation = parseCalculation(text);
      if (calculation) await stage.say(reply(calculation, calculate(calculation)));
      return null;
    },
  };
}
