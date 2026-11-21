import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../../src/domain/random';
import { FEMALE_NAMES, ITEMS, MALE_NAMES } from '../../../src/domain/tricks/content/problems';
import {
  RULES,
  answerOf,
  apply,
  count,
  generateProblem,
  levelFor,
  planProblem,
  solutionOf,
  type Level,
} from '../../../src/domain/tricks/problem';

const LEVELS: Level[] = [1, 2, 3];
const RUNS = 3000;

const numbersIn = (text: string): number[] => (text.match(/\d+/g) ?? []).map(Number);

describe('problem plans', () => {
  for (const level of LEVELS) {
    it(`level ${level}: stays in range, never goes negative`, () => {
      const rules = RULES[level];
      for (let seed = 0; seed < RUNS; seed++) {
        const plan = planProblem(level, mulberry32(seed));
        expect(plan.start).toBeGreaterThanOrEqual(rules.start[0]);
        expect(plan.start).toBeLessThanOrEqual(rules.start[1]);
        expect(plan.steps).toHaveLength(rules.steps);
        let current = plan.start;
        for (const step of plan.steps) {
          expect(step.amount).toBeGreaterThanOrEqual(rules.amount[0]);
          expect(step.amount).toBeLessThanOrEqual(rules.amount[1]);
          current = apply(current, step);
          expect(current).toBeGreaterThanOrEqual(1);
          expect(current).toBeLessThanOrEqual(rules.cap);
        }
        expect(answerOf(plan)).toBe(current);
      }
    });
  }

  it('uses digits of the right size per level', () => {
    for (let seed = 0; seed < RUNS; seed++) {
      const one = planProblem(1, mulberry32(seed));
      expect([one.start, one.steps[0].amount].every((n) => n >= 10 && n <= 99)).toBe(true);
      const two = planProblem(2, mulberry32(seed));
      expect([two.start, two.steps[0].amount].every((n) => n >= 100 && n <= 999)).toBe(true);
    }
  });

  it('mixes additions and subtractions at every level', () => {
    for (const level of LEVELS) {
      const ops = new Set<string>();
      for (let seed = 0; seed < 200; seed++)
        planProblem(level, mulberry32(seed)).steps.forEach((s) => ops.add(s.op));
      expect(ops).toEqual(new Set(['add', 'sub']));
    }
  });

  it('explains the solution step by step and ends on the answer', () => {
    expect(solutionOf({ start: 99, steps: [{ op: 'add', amount: 50 }] })).toBe('99 más 50 son 149');
    expect(
      solutionOf({
        start: 45,
        steps: [
          { op: 'add', amount: 30 },
          { op: 'sub', amount: 12 },
        ],
      }),
    ).toBe('45 más 30 son 75, y 75 menos 12 son 63');
  });

  it('raises the level with the streak', () => {
    expect([0, 1, 2, 3, 4, 9].map(levelFor)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe('generated problems', () => {
  for (const level of LEVELS) {
    it(`level ${level}: the stated numbers give the stored answer`, () => {
      for (let seed = 0; seed < RUNS; seed++) {
        const plan = planProblem(level, mulberry32(seed));
        const problem = generateProblem(level, mulberry32(seed));
        expect(numbersIn(problem.text)).toEqual([plan.start, ...plan.steps.map((s) => s.amount)]);
        expect(problem.answer).toBe(answerOf(plan));
        expect(numbersIn(problem.solution).at(-1)).toBe(problem.answer);
      }
    });
  }

  it('writes clean Spanish: agreement, capitals and no leftover placeholders', () => {
    const plurals = new Map(ITEMS.map((item) => [item.plural, item]));
    for (const level of LEVELS) {
      for (let seed = 0; seed < RUNS; seed++) {
        const { text } = generateProblem(level, mulberry32(seed));
        expect(text).not.toMatch(/[{}]|undefined/);
        expect(text.length).toBeLessThanOrEqual(200);
        for (const [, noun] of text.matchAll(/\d+ (\S+?)[ .]/g))
          expect(plurals.has(noun), text).toBe(true);
        for (const sentence of text.split(/(?<=[.?]) /))
          expect(sentence, text).toMatch(/^[¿A-ZÁÉÍÓÚ]/);
        const asked = /¿(Cuántos|Cuántas) (\S+)/.exec(text);
        expect(asked, text).not.toBeNull();
        const item = plurals.get(asked?.[2] ?? '');
        expect(asked?.[1] === 'Cuántos', text).toBe(item?.gender === 'm');
      }
    }
  });

  it('uses the singular for one', () => {
    for (const item of ITEMS) {
      expect(count(1, item)).toBe(`1 ${item.singular}`);
      expect(count(2, item)).toBe(`2 ${item.plural}`);
    }
  });

  it('never states a quantity of one, so no verb needs a singular', () => {
    for (const level of LEVELS)
      for (let seed = 0; seed < RUNS; seed++)
        for (const n of numbersIn(generateProblem(level, mulberry32(seed)).text))
          expect(n).toBeGreaterThan(9);
  });

  it('balances girls and boys and never uses the banned names', () => {
    const joined = LEVELS.flatMap((level) =>
      Array.from({ length: RUNS }, (_, seed) => generateProblem(level, mulberry32(seed)).text),
    ).join(' ');
    const mentions = (names: string[]) =>
      names.reduce(
        (sum, name) => sum + (joined.match(new RegExp(`\\b${name}\\b`, 'g'))?.length ?? 0),
        0,
      );
    const ratio = mentions(FEMALE_NAMES) / mentions(MALE_NAMES);
    expect(ratio).toBeGreaterThan(0.85);
    expect(ratio).toBeLessThan(1.15);
    expect(joined).not.toMatch(/Mérida|Irune/);
    expect([...FEMALE_NAMES, ...MALE_NAMES]).not.toEqual(expect.arrayContaining(['Mérida']));
  });
});
