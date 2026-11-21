import type { FaceMachine } from '../domain/face/machine';
import type { Stage } from '../domain/tricks/types';
import type { Bubble, SongPlayer } from './ports';

export interface StageDeps {
  bubble: Pick<Bubble, 'set'>;
  speak: (text: string) => Promise<void>;
  face: Pick<
    FaceMachine,
    'startSpeaking' | 'stopSpeaking' | 'syllable' | 'startDancing' | 'stopDancing'
  >;
  songs: SongPlayer;
}

export function createStage(deps: StageDeps): Stage {
  const { bubble, speak, face, songs } = deps;
  let dancing = false;

  return {
    async say(text) {
      bubble.set(text);
      await speak(text);
    },
    show: (text) => bubble.set(text),
    async play(song, onLine) {
      const syncMouth = !dancing;
      if (syncMouth) face.startSpeaking();
      try {
        await songs(song, { onLine, onNote: () => syncMouth && face.syllable() }).done;
      } finally {
        if (syncMouth) face.stopSpeaking();
      }
    },
    dance(on) {
      dancing = on;
      if (on) face.startDancing();
      else face.stopDancing();
    },
  };
}
