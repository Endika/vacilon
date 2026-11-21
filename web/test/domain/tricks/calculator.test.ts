import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../../src/domain/random';
import {
  BIGGEST,
  calculate,
  parseCalculation,
  type Calculation,
} from '../../../src/domain/tricks/calculation';
import { createCalculator } from '../../../src/domain/tricks/calculator';
import { createTricks, matchTrick } from '../../../src/domain/tricks/registry';
import { fakeStage, said } from './stage';

const QUESTIONS: Array<[string, Calculation]> = [
  ['¿Cuánto es 7 más 5?', { left: 7, operator: 'plus', right: 5 }],
  ['cuanto es 7 mas 5', { left: 7, operator: 'plus', right: 5 }],
  ['Chispa, ¿cuántos son tres por cuatro?', { left: 3, operator: 'times', right: 4 }],
  ['cuánto es veintitrés menos ocho', { left: 23, operator: 'minus', right: 8 }],
  ['cuanto es cuarenta y dos entre seis', { left: 42, operator: 'divided', right: 6 }],
  ['7+5', { left: 7, operator: 'plus', right: 5 }],
  ['¿8 - 3?', { left: 8, operator: 'minus', right: 3 }],
  ['6x7', { left: 6, operator: 'times', right: 7 }],
  ['6 x 7', { left: 6, operator: 'times', right: 7 }],
  ['9 × 3', { left: 9, operator: 'times', right: 3 }],
  ['12*2', { left: 12, operator: 'times', right: 2 }],
  ['10/2', { left: 10, operator: 'divided', right: 2 }],
  ['20 ÷ 4', { left: 20, operator: 'divided', right: 4 }],
  ['cuánto es 5 multiplicado por 6', { left: 5, operator: 'times', right: 6 }],
  ['cuánto es 30 dividido entre 5', { left: 30, operator: 'divided', right: 5 }],
  ['cuanto es 30 partido por 3', { left: 30, operator: 'divided', right: 3 }],
  ['tres veces cuatro', { left: 3, operator: 'times', right: 4 }],
  ['sabes cuanto es cien mas cien', { left: 100, operator: 'plus', right: 100 }],
  ['cuanto es ciento veinte menos veinte', { left: 120, operator: 'minus', right: 20 }],
  ['cuanto es 2 mas 2 chispa', { left: 2, operator: 'plus', right: 2 }],
  ['kuanto es 4 mas 4', { left: 4, operator: 'plus', right: 4 }],
];

const NOT_CALCULATIONS = [
  'quiero más chuches',
  'tengo dos hermanas',
  'me gusta más el rosa',
  'un gato más un perro',
  'tengo 7 años',
  'hazme un problema',
  'dime una suma',
  'cuéntame un chiste',
  '3 más 4 son 7',
  'siete más cinco es doce',
  '2 + 2 = 4',
  'tres por cuatro igual a doce',
];

describe('parseCalculation', () => {
  it.each(QUESTIONS)('reads %s', (text, expected) => {
    expect(parseCalculation(text)).toEqual(expected);
  });

  it.each(NOT_CALCULATIONS)('ignores %s', (text) => {
    expect(parseCalculation(text)).toBeNull();
  });
});

describe('calculate', () => {
  it('adds, subtracts, multiplies and divides exactly', () => {
    expect(calculate({ left: 7, operator: 'plus', right: 5 })).toEqual({
      kind: 'exact',
      value: 12,
    });
    expect(calculate({ left: 7, operator: 'minus', right: 5 })).toEqual({
      kind: 'exact',
      value: 2,
    });
    expect(calculate({ left: 7, operator: 'minus', right: 7 })).toEqual({
      kind: 'exact',
      value: 0,
    });
    expect(calculate({ left: 7, operator: 'times', right: 5 })).toEqual({
      kind: 'exact',
      value: 35,
    });
    expect(calculate({ left: 35, operator: 'divided', right: 5 })).toEqual({
      kind: 'exact',
      value: 7,
    });
  });

  it('shares out an uneven division with what is left over', () => {
    expect(calculate({ left: 7, operator: 'divided', right: 2 })).toEqual({
      kind: 'remainder',
      quotient: 3,
      remainder: 1,
    });
  });

  it('flags negatives, division by zero and huge results', () => {
    expect(calculate({ left: 3, operator: 'minus', right: 5 })).toEqual({ kind: 'negative' });
    expect(calculate({ left: 3, operator: 'divided', right: 0 })).toEqual({ kind: 'by-zero' });
    expect(calculate({ left: BIGGEST, operator: 'plus', right: 1 })).toEqual({ kind: 'too-big' });
    expect(calculate({ left: BIGGEST, operator: 'plus', right: 0 })).toEqual({
      kind: 'exact',
      value: BIGGEST,
    });
  });
});

describe('calculator trick', () => {
  const tricks = createTricks(mulberry32(1));

  it('is the trick chosen for a question with symbols the filter would drop', () => {
    expect(matchTrick('7+5', tricks)?.id).toBe('calculator');
    expect(matchTrick('¿cuánto es 7 más 5?', tricks)?.id).toBe('calculator');
  });

  it('leaves a math problem request to the math problem trick', () => {
    expect(matchTrick('hazme un problema', tricks)?.id).toBe('math-problem');
  });

  it('says the right result and invites another', async () => {
    const { stage, calls } = fakeStage();
    const followUp = await createCalculator(mulberry32(3)).run(stage, '¿cuánto es 7 más 5?');
    const [text] = said(calls);
    expect(text).toContain('7 más 5 son 12');
    expect(text).toMatch(/\?$/);
    expect(followUp).toBeNull();
  });

  it('tells what is left over in an uneven division', async () => {
    const { stage, calls } = fakeStage();
    await createCalculator(mulberry32(3)).run(stage, '7 entre 2');
    expect(said(calls)[0]).toMatch(/toca a 3.*sobran 1/);
  });

  it('never states a wrong result', async () => {
    const rng = mulberry32(9);
    const calculator = createCalculator(rng);
    for (let i = 0; i < 300; i++) {
      const left = Math.floor(rng() * 200);
      const right = Math.floor(rng() * 50) + 1;
      const [symbol, spoken, value] = (
        [
          ['+', 'más', left + right],
          ['x', 'por', left * right],
        ] as const
      )[i % 2];
      const { stage, calls } = fakeStage();
      await calculator.run(stage, `${left}${symbol}${right}`);
      const numbers = said(calls)[0].match(/\d+/g)?.map(Number);
      expect(said(calls)[0]).toContain(`${left} ${spoken} ${right}`);
      expect(numbers).toEqual([left, right, value]);
    }
  });
});
