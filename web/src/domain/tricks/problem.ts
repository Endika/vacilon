import type { Rng } from '../random';
import {
  CHISPA,
  CHISPA_ODDS,
  FEMALE_NAMES,
  HINTS,
  ITEMS,
  MALE_NAMES,
  SCENES,
  type HintKey,
  type Item,
  type Phrase,
  type Scene,
} from './content/problems';
import { fill } from './template';

export type Op = 'add' | 'sub';
export type Level = 1 | 2 | 3;

export interface Step {
  op: Op;
  amount: number;
}

export interface Plan {
  start: number;
  steps: Step[];
}

export interface Problem {
  text: string;
  answer: number;
  /** The worked solution, spoken in words. */
  solution: string;
  hint: string;
}

interface LevelRules {
  start: [number, number];
  amount: [number, number];
  cap: number;
  steps: number;
}

export const RULES: Record<Level, LevelRules> = {
  1: { start: [10, 99], amount: [10, 99], cap: 150, steps: 1 },
  2: { start: [101, 899], amount: [100, 899], cap: 999, steps: 1 },
  3: { start: [30, 99], amount: [10, 99], cap: 300, steps: 2 },
};

export function levelFor(streak: number): Level {
  if (streak >= 4) return 3;
  return streak >= 2 ? 2 : 1;
}

const between = (low: number, high: number, rng: Rng): number =>
  low + Math.floor(rng() * (high - low + 1));

const pick = <T>(list: readonly T[], rng: Rng): T => list[Math.floor(rng() * list.length)];

/** Amounts a step may take from `current`: adding stays under the cap, taking away leaves something. */
function stepRange(op: Op, current: number, rules: LevelRules): [number, number] {
  const [low, high] = rules.amount;
  return [low, Math.min(high, op === 'add' ? rules.cap - current : current - 1)];
}

export function apply(current: number, { op, amount }: Step): number {
  return op === 'add' ? current + amount : current - amount;
}

function nextStep(current: number, rules: LevelRules, rng: Rng): Step {
  const ops = (['add', 'sub'] as const).filter((op) => {
    const [low, high] = stepRange(op, current, rules);
    return high >= low;
  });
  const op = pick(ops, rng);
  const [low, high] = stepRange(op, current, rules);
  return { op, amount: between(low, high, rng) };
}

export function planProblem(level: Level, rng: Rng): Plan {
  const rules = RULES[level];
  const start = between(rules.start[0], rules.start[1], rng);
  const steps: Step[] = [];
  let current = start;
  for (let i = 0; i < rules.steps; i++) {
    const step = nextStep(current, rules, rng);
    steps.push(step);
    current = apply(current, step);
  }
  return { start, steps };
}

export function answerOf({ start, steps }: Plan): number {
  return steps.reduce(apply, start);
}

export function solutionOf({ start, steps }: Plan): string {
  let current = start;
  const parts = steps.map((step) => {
    const next = apply(current, step);
    const part = `${current} ${step.op === 'add' ? 'más' : 'menos'} ${step.amount} son ${next}`;
    current = next;
    return part;
  });
  return parts.join(', y ');
}

function hintKey(level: Level, plan: Plan): HintKey {
  return level === 3 ? 'steps' : `${plan.steps[0].op}-${level}`;
}

/** "25 cromos", "1 cromo". */
export function count(amount: number, item: Item): string {
  return `${amount} ${amount === 1 ? item.singular : item.plural}`;
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const fits = (list: { for?: string[] }, kind: string): boolean =>
  !list.for || list.for.includes(kind);

function pickWho(rng: Rng): string {
  if (rng() < CHISPA_ODDS) return CHISPA;
  return pick(rng() < 0.5 ? FEMALE_NAMES : MALE_NAMES, rng);
}

function pickOther(who: string, rng: Rng): string {
  let other = pickWho(rng);
  while (other === who) other = pickWho(rng);
  return other;
}

function tell(scene: Scene, plan: Plan, item: Item, rng: Rng): string {
  const who = pickWho(rng);
  const names = { who, other: pickOther(who, rng) };
  const say = (template: string, amount?: number): string =>
    capitalize(
      fill(template, {
        ...names,
        n: amount === undefined ? '' : count(amount, item),
        items: item.plural,
        cuantos: item.gender === 'm' ? 'Cuántos' : 'Cuántas',
      }),
    );
  const phrase = ({ op, amount }: Step): string => {
    const options: Phrase[] = scene[op].filter((p) => fits(p, item.kind));
    return say(pick(options, rng).text, amount);
  };
  return [say(scene.start, plan.start), ...plan.steps.map(phrase), say(scene.question)].join(' ');
}

export function generateProblem(level: Level, rng: Rng): Problem {
  const plan = planProblem(level, rng);
  const scene = pick(SCENES, rng);
  const item = pick(
    ITEMS.filter((candidate) => fits(scene, candidate.kind)),
    rng,
  );
  return {
    text: tell(scene, plan, item, rng),
    answer: answerOf(plan),
    solution: solutionOf(plan),
    hint: HINTS[hintKey(level, plan)],
  };
}
