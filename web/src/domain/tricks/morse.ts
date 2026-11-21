import { normalizeForFilter } from '../conversation/safety';
import { randomNoRepeat, type Rng } from '../random';
import { shuffleBag } from './bag';
import { createAnswering, offerAnother, type Challenge } from './challenge';
import {
  MORSE_HOOKS,
  MORSE_INTROS,
  MORSE_NEED_WORD,
  MORSE_TOO_LONG,
  TEACH_AGAIN,
  TEACH_INTROS,
  TEACH_WORDS,
} from './content/morse';
import { clip, encode, foldForMorse, morseSong, show, type MorseText } from './morse-code';
import type { FollowUp, Stage, Trick } from './types';

const LEAD_IN =
  /^(?:(?:oye|chispa|porfa|por favor|hola)\s+)*(?:(?:como|que) se (?:dice|escribe)|(?:me )?(?:escribes?|escribeme|traduces?|traduceme|dices|dime|di|pon|ponme)|quiero saber como se (?:dice|escribe)|puedes (?:decir|escribir)(?:me)?)\s+/;
const BEFORE_MORSE = /(.+?)\s+en (?:el )?(?:codigo )?morse\b/;
const TEACH =
  /\b(ensenyame|ensenyar|ensenyas|aprender|aprendemos|practicar|jugar|jugamos|juguemos|hablar)\b/;

/** The words she was asked to write in Morse, folded, or an empty string. */
function requestedText(text: string): string {
  const before = BEFORE_MORSE.exec(foldForMorse(text))?.[1] ?? '';
  return before.replace(LEAD_IN, '');
}

export function createMorse(rng: Rng, names: () => readonly string[] = () => []): Trick {
  const answering = createAnswering(rng);
  const intro = randomNoRepeat(MORSE_INTROS, rng);
  const hook = randomNoRepeat(MORSE_HOOKS, rng);
  const teachIntro = randomNoRepeat(TEACH_INTROS, rng);
  const teachAgain = randomNoRepeat(TEACH_AGAIN, rng);
  const nextWord = shuffleBag(TEACH_WORDS, rng);

  async function beep(stage: Stage, text: MorseText): Promise<void> {
    const song = morseSong(text);
    await stage.play(song, (line) => stage.show(song.lines[line].text));
  }

  const challengeFor = (word: string): Challenge => ({
    judge: (normalized) => (new RegExp(`\\b${word}\\b`).test(normalized) ? 'right' : 'wrong'),
    hint: `Pista: empieza por la «${word[0]}».`,
    async right(stage) {
      await stage.say(answering.cheer(names(), teachAgain()));
      return offerAnother(teach);
    },
    async reveal(stage) {
      await stage.say(answering.miss(`La palabra era «${word}».`));
      return offerAnother(teach);
    },
  });

  async function teach(stage: Stage): Promise<FollowUp | null> {
    const word = nextWord();
    await stage.say(teachIntro());
    await beep(stage, encode(word));
    return answering.awaitAnswer(challengeFor(word));
  }

  async function spell(stage: Stage, folded: string): Promise<null> {
    const { text: clipped, cut } = clip(folded);
    const morse = encode(clipped);
    if (morse.length === 0) await stage.say(MORSE_NEED_WORD);
    else {
      await stage.say(cut ? MORSE_TOO_LONG : intro());
      await beep(stage, morse);
      await stage.say(`«${clipped.toUpperCase()}» en Morse es ${show(morse)}. ${hook()}`);
    }
    return null;
  }

  return {
    id: 'morse',
    triggers: [
      /\ben (el )?(codigo )?morse\b/,
      /\bcodigo morse\b/,
      /\b(ensenyame|ensenyar|ensenyas|aprender|aprendemos|practicar|jugar a|jugamos a|juguemos a|hablar)\b.*\bmorse\b/,
    ],
    async run(stage, text) {
      if (TEACH.test(normalizeForFilter(text))) return teach(stage);
      return spell(stage, requestedText(text));
    },
  };
}
