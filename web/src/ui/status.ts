import { byId } from './dom';

export interface Status {
  voiceLoading(loading: boolean): void;
  earLoading(loading: boolean): void;
}

export function createStatus(): Status {
  const box = byId<HTMLElement>('voice-status');
  const text = byId<HTMLElement>('voice-status-text');
  let voice = false;
  let ear = false;
  const render = (): void => {
    box.hidden = !(voice || ear);
    text.textContent = ear ? 'preparando mis orejas…' : 'preparando mi voz…';
  };
  return {
    voiceLoading(loading) {
      voice = loading;
      render();
    },
    earLoading(loading) {
      ear = loading;
      render();
    },
  };
}
