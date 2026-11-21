import { normalizeForFilter } from '../conversation/safety';

const SWAPS: Record<string, string> = {
  mi: 'tu',
  mis: 'tus',
  conmigo: 'contigo',
  yo: 'tú',
  voy: 'vas',
  tengo: 'tienes',
  hago: 'haces',
  estoy: 'estás',
  soy: 'eres',
  juego: 'juegas',
  quiero: 'quieres',
  puedo: 'puedes',
  vivo: 'vives',
  prefiero: 'prefieres',
  veo: 'ves',
  vengo: 'vienes',
  salgo: 'sales',
  duermo: 'duermes',
};

const AFTER_ME = new Set(['gusta', 'gustan', 'encanta', 'encantan']);

/** First-person forms whose swap she cannot be sure of. */
const UNSWAPPABLE = new Set([
  'he',
  'hice',
  'fui',
  'vi',
  'dije',
  'tuve',
  'puse',
  'estuve',
  'vine',
  'di',
  'mio',
  'mia',
  'mios',
  'mias',
  'nos',
]);

const ACCENTED_NOUNS = new Set(['café', 'bebé', 'té', 'sofá', 'mamá', 'papá']);
const VERB_NEIGHBOURS = new Set([
  'a',
  'al',
  'en',
  'con',
  'de',
  'por',
  'para',
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'y',
  'que',
  'muy',
  'mucho',
  'bien',
  'mas',
  'tambien',
]);

function looksLikeUnlistedVerb(typed: string[], index: number): boolean {
  const word = typed[index].toLowerCase();
  const key = normalizeForFilter(word);
  if (UNSWAPPABLE.has(key) || key.endsWith('mos')) return true;
  if (index > 0 || ACCENTED_NOUNS.has(word) || key in SWAPS) return false;
  if (/[éí]$/.test(word)) return true;
  const next = typed[1] ? normalizeForFilter(typed[1]) : '';
  return /\w{3,}o$/.test(key) && VERB_NEIGHBOURS.has(next);
}

/** Her words said back to the child: "con mi hermana" becomes "con tu hermana". Null when that cannot be done safely. */
export function toSecondPerson(typed: string[]): string | null {
  const out: string[] = [];
  for (let index = 0; index < typed.length; index++) {
    const word = typed[index];
    const key = normalizeForFilter(word);
    const next = typed[index + 1] ? normalizeForFilter(typed[index + 1]) : '';
    if (looksLikeUnlistedVerb(typed, index)) return null;
    if (word.toLowerCase() === 'mí') out.push('ti');
    else if (key === 'mi' && !next) return null;
    else if (key === 'me') {
      if (!AFTER_ME.has(next)) return null;
      out.push('te');
    } else if (key in SWAPS)
      out.push(index === 0 && /^\p{Lu}/u.test(word) ? capital(SWAPS[key]) : SWAPS[key]);
    else out.push(word);
  }
  return out.join(' ');
}

function capital(word: string): string {
  return word[0].toUpperCase() + word.slice(1);
}
