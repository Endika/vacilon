import { PiperClient, type WorkerLike } from './client';
import type { ChunkPlayer } from './player';
import { PiperSpeaker } from './speaker';

export interface PiperBoot {
  speaker: PiperSpeaker;
  bytes: number;
  ms: number;
}

export async function bootPiper(
  player: ChunkPlayer,
  base: string,
  onProgress: (loaded: number, total: number | null) => void = () => undefined,
): Promise<PiperBoot> {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const client = new PiperClient(worker as unknown as WorkerLike);
  try {
    const { bytes, ms } = await client.load(base, onProgress);
    return { speaker: new PiperSpeaker(client, player), bytes, ms };
  } catch (error) {
    client.dispose();
    throw error;
  }
}
