import { randomNoRepeat, type Picker, type Rng } from '../random';
import { SPOKEN_OPERATORS } from '../tricks/content/calculator';
import { fill } from '../tricks/template';
import { PASS, type FollowUp } from '../tricks/types';
import { readAnswer, type Answer } from './answer';
import {
  ANIMAL_REACTIONS,
  CHOICE_REACTIONS,
  COLOR_REACTIONS,
  FAVOURITE_REACTIONS,
  NAME_REACTIONS,
  NAME_REACTIONS_ABOUT,
  NUMBER_REACTIONS,
  SUM_RIGHT,
  SUM_WRONG,
  ZERO_REACTIONS,
} from './content';
import { classify, type Question } from './question';

/** Starts the reply with a capital, after an opening "¡" or "¿". */
function sentenceCase(text: string): string {
  return text.replace(
    /^([¡¿]?)(\p{Ll})/u,
    (_, mark: string, letter: string) => mark + letter.toUpperCase(),
  );
}

/** After a reply that asks something she can follow, reacts to the answer; anything else goes to the brain. */
export function createQuestionFollowing(rng: Rng): (reply: string) => FollowUp | null {
  const pick = (list: readonly string[]): Picker => randomNoRepeat(list, rng);
  const color = pick(COLOR_REACTIONS);
  const number = pick(NUMBER_REACTIONS);
  const zero = pick(ZERO_REACTIONS);
  const animal = pick(ANIMAL_REACTIONS);
  const nameAbout = pick(NAME_REACTIONS_ABOUT);
  const name = pick(NAME_REACTIONS);
  const favourite = pick(FAVOURITE_REACTIONS);
  const choice = pick(CHOICE_REACTIONS);
  const sumRight = pick(SUM_RIGHT);
  const sumWrong = pick(SUM_WRONG);

  function react(question: Question, answer: Answer): string {
    switch (answer.kind) {
      case 'sum': {
        if (question.kind !== 'sum') return '';
        const { left, operator, right } = question.calculation;
        const values = {
          cuenta: `${left} ${SPOKEN_OPERATORS[operator]} ${right}`,
          resultado: String(question.result),
        };
        return fill(answer.value === question.result ? sumRight() : sumWrong(), values);
      }
      case 'color':
        return fill(color(), { color: answer.color });
      case 'number':
        return answer.value === 0 ? zero() : fill(number(), { number: String(answer.value) });
      case 'animal':
        return fill(animal(), { animal: answer.withArticle });
      case 'name': {
        const about = question.kind === 'name' ? question.about : '';
        return about
          ? fill(nameAbout(), { name: answer.name, about })
          : fill(name(), { name: answer.name });
      }
      case 'favourite':
        return question.kind === 'favourite'
          ? fill(favourite(), {
              value: answer.value,
              about: question.about,
              favourite: question.favourite,
            })
          : answer.value;
      case 'choice':
        return fill(choice(), { option: answer.option });
    }
  }

  return (reply) => {
    const questions = classify(reply);
    if (questions.length === 0) return null;
    return async (text, stage) => {
      for (const question of questions) {
        const answer = readAnswer(question, text);
        if (!answer) continue;
        await stage.say(sentenceCase(react(question, answer)));
        return null;
      }
      return PASS;
    };
  };
}
