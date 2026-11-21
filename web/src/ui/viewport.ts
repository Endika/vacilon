/** Keeps the app as tall as the visible area when the on-screen keyboard opens. */
export function followVisualViewport(host: HTMLElement): void {
  window.visualViewport?.addEventListener('resize', () => {
    host.style.setProperty('--app-height', `${window.visualViewport?.height ?? 0}px`);
    window.scrollTo(0, 0);
  });
}
