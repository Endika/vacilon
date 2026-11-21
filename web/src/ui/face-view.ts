import type { FaceMachine, FaceView } from '../domain/face/machine';
import svg from './chispa.svg?raw';

export const TICK_MS = 80;
const GAZE_X = 7;
const GAZE_Y = 6;

export function mountFace(host: HTMLElement): SVGSVGElement {
  host.insertAdjacentHTML('afterbegin', svg);
  return host.querySelector('svg') as SVGSVGElement;
}

function setAttr(el: Element, name: string, value: string): void {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

export function applyView(root: SVGSVGElement, view: FaceView): void {
  setAttr(root, 'data-mode', view.mode);
  setAttr(root, 'data-eye-left', view.eyeLeft);
  setAttr(root, 'data-eye-right', view.eyeRight);
  setAttr(root, 'data-mouth', view.mouth);
  setAttr(root, 'data-cheeks', String(view.cheeks));
  root.style.setProperty('--gx', String(view.gaze.x * GAZE_X));
  root.style.setProperty('--gy', String(view.gaze.y * GAZE_Y));
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function playJump(root: SVGSVGElement): void {
  if (prefersReducedMotion()) return;
  const target = root.querySelector('.jumper');
  target?.animate(
    [
      { transform: 'translateY(0) scale(1, 1)' },
      { transform: 'translateY(0) scale(1.06, 0.92)', offset: 0.2 },
      { transform: 'translateY(-18px) scale(0.96, 1.06)', offset: 0.55 },
      { transform: 'translateY(0) scale(1.05, 0.94)', offset: 0.85 },
      { transform: 'translateY(0) scale(1, 1)' },
    ],
    { duration: 520, easing: 'ease-out' },
  );
}

export function runFace(root: SVGSVGElement, machine: FaceMachine): () => void {
  let jumps = 0;
  const frame = (): void => {
    machine.tick();
    const view = machine.view();
    applyView(root, view);
    if (view.jumpId !== jumps) {
      jumps = view.jumpId;
      playJump(root);
    }
  };
  frame();
  const timer = window.setInterval(frame, TICK_MS);
  return () => window.clearInterval(timer);
}
