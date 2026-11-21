import { progressRatio } from './progress';

export interface Loader {
  update(loaded: number, total: number | null): void;
  fail(): void;
  done(): void;
}

export function createLoader(root: ParentNode): Loader {
  const screen = root.querySelector<HTMLElement>('.screen') as HTMLElement;
  const bar = root.querySelector<HTMLElement>('#bar') as HTMLElement;
  const fill = root.querySelector<HTMLElement>('#bar-fill') as HTMLElement;
  const text = root.querySelector<HTMLElement>('#loader-text') as HTMLElement;
  return {
    update(loaded, total) {
      const ratio = progressRatio(loaded, total);
      bar.classList.toggle('indeterminate', ratio === null);
      if (ratio === null) return bar.removeAttribute('aria-valuenow');
      const percent = Math.round(ratio * 100);
      bar.setAttribute('aria-valuenow', String(percent));
      fill.style.width = `${percent}%`;
    },
    done() {
      screen.dataset.loading = 'false';
    },
    fail() {
      text.textContent = 'Uy, Chispa no ha podido despertar. Recarga la página.';
      bar.hidden = true;
    },
  };
}
