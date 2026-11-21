import type { SongHandlers, SongPlayback } from '../../application/ports';
import type { Song } from '../../domain/tricks/content/types';
import { schedule, songSeconds, type ScheduledNote } from '../../domain/tricks/music';

const PEAK_GAIN = 0.12;
const ATTACK_S = 0.01;
const GAP_S = 0.04;

function beep(ctx: AudioContext, note: ScheduledNote & { frequency: number }): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const at = ctx.currentTime + note.start;
  const end = at + Math.max(note.duration - GAP_S, ATTACK_S * 2);
  osc.type = 'square';
  osc.frequency.value = note.frequency;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(PEAK_GAIN, at + ATTACK_S);
  gain.gain.exponentialRampToValueAtTime(0.001, end);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(end);
  return osc;
}

export function playSong(
  ctx: AudioContext | null,
  song: Song,
  handlers: SongHandlers,
  opts: { muted: boolean },
): SongPlayback {
  const notes = schedule(song);
  const oscillators: OscillatorNode[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];
  let finish: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    finish = resolve;
  });

  let lastLine = -1;
  for (const note of notes) {
    const sounding = note.frequency !== null;
    if (ctx && !opts.muted && sounding) {
      oscillators.push(beep(ctx, note as ScheduledNote & { frequency: number }));
    }
    const newLine = note.line !== lastLine;
    lastLine = note.line;
    timers.push(
      setTimeout(() => {
        if (newLine) handlers.onLine?.(note.line);
        if (sounding) handlers.onNote?.(note);
      }, note.start * 1000),
    );
  }
  timers.push(setTimeout(finish, songSeconds(song) * 1000));

  return {
    done,
    stop() {
      timers.forEach(clearTimeout);
      for (const osc of oscillators) {
        try {
          osc.stop();
        } catch {
          // already ended
        }
      }
      finish();
    },
  };
}
