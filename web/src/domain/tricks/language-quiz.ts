import { normalizeForFilter } from '../conversation/safety';
import { randomNoRepeat, type Rng } from '../random';
import { shuffleBag } from './bag';
import { createAnswering, offerAnother, type Challenge, type Verdict } from './challenge';
import {
  ASK_MEANING,
  ASK_WORD,
  LANGUAGE_AGAIN,
  LANGUAGE_INTROS,
  LANGUAGE_NAMES,
  SAY_MEANING,
  SAY_WORD,
  WORDS,
  type Language,
  type Word,
} from './content/words';
import { capitalize, sayWord } from './languages';
import { fill } from './template';
import type { FollowUp, Stage, Trick } from './types';
import {
  foreignForms,
  LANGUAGE_PATTERN,
  languageIn,
  mentionsAny,
  spanishForms,
} from './vocabulary';

const LANG = `(${LANGUAGE_PATTERN}|idiomas)`;
/** Short answers that miss count as tries; longer ones are probably not an answer. */
const MAX_ANSWER_WORDS = 3;

type Direction = 'toForeign' | 'toSpanish';

/** Words worth asking: the translation differs from Spanish and does not depend on who speaks. */
export function quizWords(language: Language): Word[] {
  return WORDS.filter((word) => {
    if (language === 'eu' && word.euNote) return false;
    const spanish = spanishForms(word);
    return !foreignForms(word, language).some((form) => spanish.includes(form));
  });
}

const judgeWith =
  (forms: readonly string[]) =>
  (normalized: string): Verdict => {
    if (mentionsAny(normalized, forms)) return 'right';
    return normalized.split(' ').length <= MAX_ANSWER_WORDS ? 'wrong' : 'unclear';
  };

export function createLanguageQuiz(rng: Rng, names: () => readonly string[] = () => []): Trick {
  const answering = createAnswering(rng);
  const intro = randomNoRepeat(LANGUAGE_INTROS, rng);
  const again = randomNoRepeat(LANGUAGE_AGAIN, rng);
  const next: Record<Language, () => Word> = {
    en: shuffleBag(quizWords('en'), rng),
    eu: shuffleBag(quizWords('eu'), rng),
  };

  function challengeFor(word: Word, language: Language, direction: Direction): Challenge {
    const toForeign = direction === 'toForeign';
    const forms = toForeign ? foreignForms(word, language) : spanishForms(word);
    const shown = toForeign ? word[language][0] : word.es[0];
    const lang = LANGUAGE_NAMES[language];
    const answer = toForeign
      ? sayWord(word, language, SAY_WORD[0])
      : fill(SAY_MEANING, { Word: capitalize(word[language][0]), es: word.es[0], lang });
    return {
      judge: judgeWith(forms),
      hint: `Pista: empieza por la «${shown[0]}».`,
      async right(stage) {
        await stage.say(answering.cheer(names(), `${answer} ${again()}`));
        return offerAnother(round(language));
      },
      async reveal(stage) {
        await stage.say(answering.miss(answer));
        return offerAnother(round(language));
      },
    };
  }

  const round =
    (choice: Language | null) =>
    async (stage: Stage): Promise<FollowUp | null> => {
      const language = choice ?? (rng() < 0.5 ? 'en' : 'eu');
      const word = next[language]();
      const direction: Direction = rng() < 0.5 ? 'toForeign' : 'toSpanish';
      const lang = LANGUAGE_NAMES[language];
      const question =
        direction === 'toForeign'
          ? fill(ASK_WORD, { es: word.es[0], lang })
          : fill(ASK_MEANING, { word: word[language][0], lang });
      await stage.say(`${intro()} ${question}`);
      return answering.awaitAnswer(challengeFor(word, language, direction));
    };

  return {
    id: 'language-quiz',
    triggers: [
      new RegExp(`\\b(juguemos|jugar|jugamos|jugando) (a |al |con )?(los )?${LANG}\\b`),
      new RegExp(
        `\\b(ensenyame|ensenyar|ensenyas|aprender|aprendemos|practicar|practicamos) ${LANG}\\b`,
      ),
      new RegExp(`\\b(concurso|juego|reto) de ${LANG}\\b`),
      new RegExp(`\\b(hablas|sabes|hablamos) ${LANG}\\b`),
    ],
    run: (stage, text) => round(languageIn(normalizeForFilter(text)))(stage),
  };
}
