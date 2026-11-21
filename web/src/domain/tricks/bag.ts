import type { Rng } from '../random';

function shuffled<T>(list: readonly T[], rng: Rng): T[] {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Yields every item once before any repeats; never repeats across a reshuffle. */
export function shuffleBag<T>(list: readonly T[], rng: Rng): () => T {
  let bag: T[] = [];
  let last: T | undefined;
  return () => {
    if (bag.length === 0) {
      bag = shuffled(list, rng);
      if (list.length > 1 && bag[bag.length - 1] === last) {
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
    }
    last = bag.pop();
    return last as T;
  };
}
