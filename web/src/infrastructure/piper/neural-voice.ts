import type { NeuralVoice, Speaker } from '../../application/ports';
import { bootPiper } from './boot';
import { ChunkPlayer } from './player';

const MIB = 1048576;

export interface PiperVoice extends NeuralVoice {
  /** The Web Audio context that music and the microphone share; null until it is open. */
  audioContext(): AudioContext | null;
}

export function createPiperVoice(voiceUrl: string): PiperVoice {
  let player: ChunkPlayer | null = null;
  return {
    open() {
      try {
        player = new ChunkPlayer(new AudioContext());
        player.unlock();
      } catch (error) {
        console.warn('Web Audio is not available, keeping the system voice.', error);
      }
      return player !== null;
    },
    async build(): Promise<Speaker> {
      if (!player) throw new Error('Audio output is not open');
      const { speaker, bytes, ms } = await bootPiper(player, voiceUrl);
      console.info(`Voz de Chispa lista: ${(bytes / MIB).toFixed(1)} MB, ${Math.round(ms)} ms.`);
      return speaker;
    },
    audioContext: () => player?.audioContext ?? null,
  };
}
