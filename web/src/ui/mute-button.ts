import type { Voice } from '../application/ports';
import { byId } from './dom';

export function bindMute(voice: Pick<Voice, 'muted'>, toggle: () => void): void {
  const button = byId<HTMLButtonElement>('mute');
  const render = (): void => {
    button.setAttribute('aria-pressed', String(voice.muted));
    button.setAttribute('aria-label', voice.muted ? 'Activar la voz' : 'Silenciar la voz');
  };
  button.hidden = !('speechSynthesis' in window || 'AudioContext' in window);
  button.addEventListener('click', () => {
    toggle();
    render();
  });
  render();
}
