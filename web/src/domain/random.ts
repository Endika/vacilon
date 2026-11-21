export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Picker = () => string;

export function randomNoRepeat(list: readonly string[], rng: Rng): Picker {
  let last = -1;
  return () => {
    let index = Math.floor(rng() * list.length);
    if (list.length > 1 && index === last) index = (index + 1) % list.length;
    last = index;
    return list[index];
  };
}

export function cycle(list: readonly string[], rng: Rng): Picker {
  let next = Math.floor(rng() * list.length);
  return () => list[next++ % list.length];
}
