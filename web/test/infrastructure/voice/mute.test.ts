import { describe, expect, it } from 'vitest';
import { loadMuted, saveMuted } from '../../../src/infrastructure/voice/mute';

function memoryStorage() {
  const data = new Map<string, string>();
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

describe('mute preference', () => {
  it('defaults to not muted', () => {
    expect(loadMuted(memoryStorage())).toBe(false);
  });

  it('persists and reads back both values', () => {
    const storage = memoryStorage();
    saveMuted(storage, true);
    expect(loadMuted(storage)).toBe(true);
    saveMuted(storage, false);
    expect(loadMuted(storage)).toBe(false);
  });

  it('survives blocked or missing storage', () => {
    expect(loadMuted(blocked)).toBe(false);
    expect(() => saveMuted(blocked, true)).not.toThrow();
    expect(loadMuted(null)).toBe(false);
    expect(() => saveMuted(null, true)).not.toThrow();
  });
});
