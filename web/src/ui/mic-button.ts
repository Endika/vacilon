import type { Listening } from '../application/listening';
import { byId } from './dom';

export interface MicButton {
  setHidden(hidden: boolean): void;
  setPressed(pressed: boolean): void;
  lock(locked: boolean): void;
}

export function bindMic(talk: Pick<Listening, 'press' | 'release'>): MicButton {
  const button = byId<HTMLButtonElement>('mic');
  const release = (): void => void talk.release();

  /** Space is the talk key only when nothing else would use it. */
  const isTalkKeyTarget = (target: EventTarget | null): boolean =>
    target === document.body || target === button;

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    talk.press();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, release);
  }
  button.addEventListener('contextmenu', (event) => event.preventDefault());
  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || event.repeat || !isTalkKeyTarget(event.target)) return;
    event.preventDefault();
    talk.press();
  });
  document.addEventListener('keyup', (event) => {
    if (event.code !== 'Space' || !isTalkKeyTarget(event.target)) return;
    event.preventDefault();
    release();
  });

  return {
    setHidden: (hidden) => (button.hidden = hidden),
    setPressed: (pressed) => button.setAttribute('aria-pressed', String(pressed)),
    lock: (locked) => (button.disabled = locked),
  };
}
