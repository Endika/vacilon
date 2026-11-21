export function onUserGesture(handler: () => void): void {
  for (const type of ['click', 'keydown', 'pointerdown']) {
    document.addEventListener(type, handler, { capture: true });
  }
}
