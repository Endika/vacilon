export interface VoiceInfo {
  name: string;
  lang: string;
  localService?: boolean;
}

const langOf = (voice: VoiceInfo): string => voice.lang.toLowerCase().replace('_', '-');

/** Network voices are never used: they would send what Chispa says to a third party. */
function rank(voice: VoiceInfo): number {
  if (voice.localService === false) return -1;
  const lang = langOf(voice);
  if (lang === 'es-es') return 0;
  return lang.startsWith('es-') || lang === 'es' ? 1 : -1;
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
