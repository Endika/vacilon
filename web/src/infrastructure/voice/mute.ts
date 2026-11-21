const KEY = 'chispa.muted';

export function loadMuted(storage: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(storage: Pick<Storage, 'setItem'> | null, muted: boolean): void {
  try {
    storage?.setItem(KEY, muted ? '1' : '0');
  } catch {
    // storage may be blocked; the preference just won't persist
  }
}
