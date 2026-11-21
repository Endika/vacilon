export interface VoiceInfo {
  name: string;
  lang: string;
  localService?: boolean;
}

const langOf = (voice: VoiceInfo): string => voice.lang.toLowerCase().replace('_', '-');

function rank(voice: VoiceInfo): number {
  const lang = langOf(voice);
  const base = lang === 'es-es' ? 0 : lang.startsWith('es-') || lang === 'es' ? 2 : -1;
  if (base < 0) return -1;
  return base + (voice.localService === false ? 1 : 0);
}

export function pickVoice<T extends VoiceInfo>(voices: readonly T[]): T | null {
  let best: T | null = null;
  let bestRank = Infinity;
  for (const voice of voices) {
    const r = rank(voice);
    if (r >= 0 && r < bestRank) {
      best = voice;
      bestRank = r;
    }
  }
  return best;
}
