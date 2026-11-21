import type { Listening } from '../application/listening';
import { byId } from './dom';

export interface MicButton {
  setHidden(hidden: boolean): void;
  setPressed(pressed: boolean): void;
  lock(locked: boolean): void;
}

const TAP_TO_TALK = 'Toca para hablar';
const TAP_TO_STOP = 'Toca para terminar';

export function bindMic(talk: Pick<Listening, 'toggle'>): MicButton {
  const button = byId<HTMLButtonElement>('mic');

  button.addEventListener('click', () => talk.toggle());
  /** On a focused button, Space already clicks; elsewhere it only talks when nothing else would use it. */
  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || event.repeat || event.target !== document.body) return;
    event.preventDefault();
    talk.toggle();
  });

  return {
    setHidden: (hidden) => (button.hidden = hidden),
    setPressed: (pressed) => {
      button.setAttribute('aria-pressed', String(pressed));
      button.setAttribute('aria-label', pressed ? TAP_TO_STOP : TAP_TO_TALK);
    },
    lock: (locked) => (button.disabled = locked),
  };
}
