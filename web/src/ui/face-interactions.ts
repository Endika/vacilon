import type { FaceMachine } from '../domain/face/machine';
import { byId } from './dom';

const POINTER_RANGE = 0.9;

export function bindFaceInteractions(
  face: Pick<FaceMachine, 'pointer' | 'activity' | 'touch'>,
): void {
  const chispa = byId<HTMLButtonElement>('chispa');

  const track = (event: PointerEvent): void => {
    const rect = chispa.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    face.pointer(dx / (rect.width * POINTER_RANGE), dy / (rect.height * POINTER_RANGE));
  };

  document.addEventListener('pointerdown', (event) => {
    if (!chispa.contains(event.target as Node)) face.activity();
    track(event);
  });
  window.addEventListener('pointermove', track);
  chispa.addEventListener('click', () => face.touch(true));
}
