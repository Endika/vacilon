import { describe, expect, it } from 'vitest';
import { LocalNameStore, NAMES_KEY } from '../../../src/infrastructure/names/local-name-store';

function memoryStorage(initial?: string) {
  const data = new Map<string, string>(initial === undefined ? [] : [[NAMES_KEY, initial]]);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const blocked = {
  getItem: (): string => {
    throw new Error('blocked');
  },
  setItem: (): void => {
    throw new Error('blocked');
  },
};

describe('LocalNameStore', () => {
  it('round-trips the names', () => {
    const store = new LocalNameStore(memoryStorage());
    store.save(['Mérida', 'Irune']);
    expect(store.load()).toEqual(['Mérida', 'Irune']);
  });

  it.each(['not json', '{"a":1}', '"x"', '[1,"Irune",null]'])(
    'tolerates corrupt data %s',
    (raw) => {
      const names = new LocalNameStore(memoryStorage(raw)).load();
      expect(names.every((n) => typeof n === 'string')).toBe(true);
      expect(names.length).toBeLessThanOrEqual(1);
    },
  );

  it('is empty when nothing is saved and survives missing or blocked storage', () => {
    expect(new LocalNameStore(memoryStorage()).load()).toEqual([]);
    for (const storage of [null, blocked]) {
      const store = new LocalNameStore(storage);
      expect(() => store.save(['Irune'])).not.toThrow();
      expect(store.load()).toEqual([]);
    }
  });
});
