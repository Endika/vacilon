import { byId } from './dom';

export interface Composer {
  set(text: string): void;
  clear(): void;
  lock(locked: boolean): void;
}

export function bindComposer(onSubmit: (text: string) => void, onInput: () => void): Composer {
  const input = byId<HTMLInputElement>('message');
  const send = byId<HTMLButtonElement>('send');
  input.addEventListener('input', onInput);
  byId<HTMLFormElement>('composer').addEventListener('submit', (event) => {
    event.preventDefault();
    onSubmit(input.value);
  });
  return {
    set: (text) => (input.value = text),
    clear: () => (input.value = ''),
    lock: (locked) => (send.disabled = locked),
  };
}
