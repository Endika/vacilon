import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../../src/domain/random';
import {
  BLINK_MS,
  BORED_AFTER_MS,
  FaceMachine,
  SLEEP_AFTER_MS,
  TICKLE_MS,
  WINK_MS,
  type SayKind,
} from '../../../src/domain/face/machine';
import { BORED_PHRASES, TICKLE_PHRASES, WAKE_PHRASES } from '../../../src/domain/face/phrases';

function setup(rng: () => number = mulberry32(7)) {
  let t = 1_000;
  const said: { kind: SayKind; text: string }[] = [];
  const machine = new FaceMachine({
    now: () => t,
    rng,
    onSay: (kind, text) => said.push({ kind, text }),
  });
  const advance = (ms: number, step = 50): void => {
    for (let spent = 0; spent < ms; spent += step) {
      t += step;
      machine.tick();
    }
  };
  return { machine, said, advance, time: () => t };
}

describe('idle, bored and asleep', () => {
  it('starts idle and keeps the idle mode until 30 s pass', () => {
    const { machine, advance } = setup();
    expect(machine.view().mode).toBe('idle');
    advance(BORED_AFTER_MS - 100);
    expect(machine.view().mode).toBe('idle');
  });

  it('gets bored after 30 s, yawns and says one bored phrase', () => {
    const { machine, said, advance } = setup();
    advance(BORED_AFTER_MS + 100);
    const view = machine.view();
    expect(view.mode).toBe('bored');
    expect(view.mouth).toBe('yawn');
    expect(said).toHaveLength(1);
    expect(said[0].kind).toBe('bored');
    expect(BORED_PHRASES).toContain(said[0].text);
  });

  it('stops yawning but stays bored, without repeating the phrase', () => {
    const { machine, said, advance } = setup();
    advance(BORED_AFTER_MS + 5_000);
    expect(machine.view().mouth).toBe('flat');
    expect(said).toHaveLength(1);
  });

  it('falls asleep after 60 s with closed eyes', () => {
    const { machine, advance } = setup();
    advance(SLEEP_AFTER_MS + 100);
    const view = machine.view();
    expect(view.mode).toBe('asleep');
    expect([view.eyeLeft, view.eyeRight]).toEqual(['closed', 'closed']);
  });

  it('wakes up on a touch with a wake phrase', () => {
    const { machine, said, advance } = setup();
    advance(SLEEP_AFTER_MS + 100);
    said.length = 0;
    machine.touch(false);
    expect(machine.view().mode).toBe('idle');
    expect(said).toHaveLength(1);
    expect(said[0].kind).toBe('wake');
    expect(WAKE_PHRASES).toContain(said[0].text);
  });

  it('wakes up on a submitted message', () => {
    const { machine, said, advance } = setup();
    advance(SLEEP_AFTER_MS + 100);
    machine.startThinking();
    expect(said.at(-1)?.kind).toBe('wake');
    expect(machine.view().mode).toBe('thinking');
  });

  it('activity postpones boredom', () => {
    const { machine, said, advance } = setup();
    advance(BORED_AFTER_MS - 1_000);
    machine.activity();
    advance(BORED_AFTER_MS - 1_000);
    expect(machine.view().mode).toBe('idle');
    expect(said).toHaveLength(0);
  });
});

describe('tickles', () => {
  it('shows happy eyes, pink cheeks and a tickle phrase, then recovers', () => {
    const { machine, said, advance } = setup();
    machine.touch(true);
    const view = machine.view();
    expect(view.mode).toBe('tickled');
    expect([view.eyeLeft, view.eyeRight]).toEqual(['happy', 'happy']);
    expect(view.cheeks).toBe(true);
    expect(TICKLE_PHRASES).toContain(said[0].text);
    advance(TICKLE_MS + 100);
    expect(machine.view().mode).toBe('idle');
    expect(machine.view().cheeks).toBe(false);
  });

  it('jumps on every tickle', () => {
    const { machine } = setup();
    const before = machine.view().jumpId;
    machine.touch(true);
    machine.touch(true);
    expect(machine.view().jumpId).toBe(before + 2);
  });

  it('does not repeat the same tickle phrase twice in a row', () => {
    const { machine, said } = setup(() => 0);
    machine.touch(true);
    machine.touch(true);
    expect(said[0].text).not.toBe(said[1].text);
  });

  it('a touch elsewhere does not tickle', () => {
    const { machine, said } = setup();
    machine.touch(false);
    expect(machine.view().mode).toBe('idle');
    expect(said).toHaveLength(0);
  });

  it('stays quiet while thinking', () => {
    const { machine, said } = setup();
    machine.startThinking();
    machine.touch(true);
    expect(said).toHaveLength(0);
  });
});

describe('thinking and speaking', () => {
  it('looks up while thinking', () => {
    const { machine } = setup();
    machine.startThinking();
    const view = machine.view();
    expect(view.mode).toBe('thinking');
    expect(view.gaze.y).toBe(-1);
    expect(view.mouth).toBe('small');
  });

  it('opens and closes the mouth while speaking', () => {
    const { machine, advance } = setup();
    machine.startThinking();
    machine.startSpeaking();
    const shapes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      advance(60);
      shapes.add(machine.view().mouth);
    }
    expect(machine.view().mode).toBe('speaking');
    expect(shapes).toEqual(new Set(['open', 'smile']));
  });

  it('opens the mouth on a syllable boundary and closes it when speech ends', () => {
    const { machine, advance } = setup();
    machine.startSpeaking();
    advance(140);
    machine.syllable();
    expect(machine.view().mouth).toBe('open');
    machine.stopSpeaking();
    expect(machine.view().mode).toBe('idle');
    expect(machine.view().mouth).toBe('smile');
  });

  it('ignores syllables when not speaking', () => {
    const { machine } = setup();
    machine.syllable();
    expect(machine.view().mouth).toBe('smile');
  });

  it('never gets bored or sleepy while busy', () => {
    const { machine, advance } = setup();
    machine.startThinking();
    advance(SLEEP_AFTER_MS + 1_000, 500);
    expect(machine.view().mode).toBe('thinking');
  });

  it('starts the boredom clock again after speaking ends', () => {
    const { machine, advance } = setup();
    machine.startSpeaking();
    advance(BORED_AFTER_MS + 1_000, 500);
    machine.stopSpeaking();
    advance(BORED_AFTER_MS - 1_000, 500);
    expect(machine.view().mode).toBe('idle');
  });
});

describe('blinks, winks and gaze', () => {
  it('blinks at intervals between 2 and 5 seconds', () => {
    const { machine, advance } = setup(() => 0.5);
    const starts: number[] = [];
    let closed = false;
    let t = 0;
    for (let i = 0; i < 400; i++) {
      advance(50);
      t += 50;
      const isClosed = machine.view().eyeLeft === 'closed';
      if (isClosed && !closed) starts.push(t);
      closed = isClosed;
    }
    expect(starts.length).toBeGreaterThan(3);
    for (let i = 1; i < starts.length; i++) {
      const gap = starts[i] - starts[i - 1];
      expect(gap).toBeGreaterThanOrEqual(BLINK_MS);
      expect(gap).toBeLessThanOrEqual(5_200);
      expect(gap).toBeGreaterThanOrEqual(3_000);
    }
  });

  it('closes both eyes on a normal blink', () => {
    const { machine, advance } = setup(() => 0.5);
    advance(3_600, 20);
    const eyes: string[] = [];
    for (let i = 0; i < 20; i++) {
      advance(20);
      const v = machine.view();
      if (v.eyeLeft === 'closed') eyes.push(v.eyeRight);
    }
    expect(eyes.length).toBeGreaterThan(0);
    expect(new Set(eyes)).toEqual(new Set(['closed']));
  });

  it('winks one eye when the rng falls under 12 %', () => {
    const { machine, advance } = setup(() => 0.05);
    let sides = new Set<string>();
    for (let n = 0; n < 200; n++) {
      advance(50);
      const v = machine.view();
      if (v.eyeLeft !== v.eyeRight) sides = new Set([v.eyeLeft, v.eyeRight]);
    }
    expect(sides).toEqual(new Set(['open', 'closed']));
  });

  it('winks about 12 % of the time with a seeded rng', () => {
    const { machine, advance } = setup(mulberry32(123));
    let winks = 0;
    let blinks = 0;
    let busy = false;
    for (let n = 0; n < 6_000; n++) {
      advance(50);
      machine.activity();
      const v = machine.view();
      const closedCount = Number(v.eyeLeft === 'closed') + Number(v.eyeRight === 'closed');
      if (closedCount > 0 && !busy) {
        blinks++;
        if (closedCount === 1) winks++;
      }
      busy = closedCount > 0;
    }
    expect(blinks).toBeGreaterThan(50);
    expect(winks / blinks).toBeGreaterThan(0.05);
    expect(winks / blinks).toBeLessThan(0.25);
    expect(WINK_MS).toBeGreaterThan(BLINK_MS);
  });

  it('follows the pointer, clamped, and then goes back to wandering', () => {
    const { machine, advance } = setup();
    machine.pointer(5, -3);
    expect(machine.view().gaze).toEqual({ x: 1, y: -1 });
    advance(1_000);
    expect(machine.view().gaze).toEqual({ x: 1, y: -1 });
    advance(6_000);
    const { x, y } = machine.view().gaze;
    expect(Math.abs(x)).toBeLessThanOrEqual(1);
    expect(Math.abs(y)).toBeLessThanOrEqual(0.4);
  });

  it('looks around by itself within limits', () => {
    const { machine, advance } = setup();
    const seen = new Set<number>();
    for (let i = 0; i < 100; i++) {
      advance(200);
      const { x, y } = machine.view().gaze;
      seen.add(x);
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.4);
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('does not blink while asleep', () => {
    const { machine, advance } = setup();
    advance(SLEEP_AFTER_MS + 100);
    const eyes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      advance(100);
      eyes.add(machine.view().eyeLeft);
    }
    expect(eyes).toEqual(new Set(['closed']));
  });
});

describe('dancing', () => {
  it('dances with happy eyes and an open mouth', () => {
    const { machine } = setup();
    machine.startDancing();
    const view = machine.view();
    expect(view.mode).toBe('dancing');
    expect([view.eyeLeft, view.eyeRight, view.mouth]).toEqual(['happy', 'happy', 'open']);
  });

  it('never gets bored or sleepy while dancing, and idles afterwards', () => {
    const { machine, advance } = setup();
    machine.startDancing();
    advance(SLEEP_AFTER_MS + 1_000, 500);
    expect(machine.view().mode).toBe('dancing');
    machine.stopDancing();
    expect(machine.view().mode).toBe('idle');
  });

  it('wakes Chispa up when the dance starts', () => {
    const { machine, advance } = setup();
    advance(SLEEP_AFTER_MS + 1_000, 500);
    expect(machine.view().mode).toBe('asleep');
    machine.startDancing();
    expect(machine.view().mode).toBe('dancing');
  });

  it('is tickled over dancing, and dancing wins over thinking and speaking', () => {
    const { machine } = setup();
    machine.startThinking();
    machine.startDancing();
    expect(machine.view().mode).toBe('dancing');
    machine.touch(true);
    expect(machine.view().mode).toBe('tickled');
  });

  it('lets the mouth follow syllables when singing', () => {
    const { machine } = setup();
    machine.startSpeaking();
    machine.syllable();
    expect(machine.view().mouth).toBe('open');
  });
});

describe('listening', () => {
  it('looks straight ahead with a small mouth', () => {
    const { machine } = setup();
    machine.pointer(0.8, -0.5);
    machine.startListening();
    const view = machine.view();
    expect(view.mode).toBe('listening');
    expect(view.gaze).toEqual({ x: 0, y: 0 });
    expect(view.mouth).toBe('small');
  });

  it('never gets bored or sleepy while listening, and idles afterwards', () => {
    const { machine, advance } = setup();
    machine.startListening();
    advance(SLEEP_AFTER_MS + 1_000, 500);
    expect(machine.view().mode).toBe('listening');
    machine.stopListening();
    expect(machine.view().mode).toBe('idle');
  });

  it('wakes Chispa up', () => {
    const { machine, advance } = setup();
    advance(SLEEP_AFTER_MS + 1_000, 500);
    machine.startListening();
    expect(machine.view().mode).toBe('listening');
  });

  it('is tickled over listening, and listening wins over dancing, thinking and speaking', () => {
    const { machine } = setup();
    machine.startThinking();
    machine.startDancing();
    machine.startListening();
    expect(machine.view().mode).toBe('listening');
    machine.touch(true);
    expect(machine.view().mode).toBe('tickled');
  });
});
