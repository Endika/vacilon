import type { NameStore } from '../../application/ports';

export const NAMES_KEY = 'vacilon.names';

type Backing = Pick<Storage, 'getItem' | 'setItem'>;

export class LocalNameStore implements NameStore {
  constructor(private readonly storage: Backing | null) {}

  load(): string[] {
    try {
      const parsed: unknown = JSON.parse(this.storage?.getItem(NAMES_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((n): n is string => typeof n === 'string') : [];
    } catch {
      return [];
    }
  }

  save(names: readonly string[]): void {
    try {
      this.storage?.setItem(NAMES_KEY, JSON.stringify(names));
    } catch {
      // storage may be blocked; the names just won't persist
    }
  }
}
