import type { Bubble } from '../application/ports';
import { BUBBLE_SCALES, bubbleScaleIndex } from './bubble-size';

const OVERFLOW_TOLERANCE_PX = 4;

export function createBubble(root: ParentNode): Bubble {
  const box = root.querySelector<HTMLElement>('.bubble') as HTMLElement;
  const said = root.querySelector<HTMLElement>('#said') as HTMLElement;

  function fit(text: string): void {
    let index = bubbleScaleIndex(text.length);
    said.style.setProperty('--scale', String(BUBBLE_SCALES[index]));
    while (
      said.scrollHeight - said.clientHeight > OVERFLOW_TOLERANCE_PX &&
      index < BUBBLE_SCALES.length - 1
    ) {
      index += 1;
      said.style.setProperty('--scale', String(BUBBLE_SCALES[index]));
    }
  }

  window.addEventListener('resize', () => fit(said.textContent ?? ''));

  return {
    set(text) {
      said.textContent = text;
      box.dataset.empty = String(text === '');
      fit(text);
    },
    thinking(on) {
      box.dataset.thinking = String(on);
    },
  };
}
