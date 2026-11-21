import { forgetAll, forgetCurrent, isKnown, use, type NameBook } from './book';
import { joinNames } from './join';
import type { NameIntent } from './recognize';
import {
  COMPANY_MANY,
  COMPANY_TWO,
  FORGOT_ALL,
  FORGOT_MINE,
  LEARNED,
  MISSED,
  UNKNOWN_NAME,
  UNSAFE_NAME,
  YOU_ARE,
  YOU_ARE_MANY,
  fill,
} from './phrases';

/** What Chispa has just asked, so the next message is read as its answer. */
export type Awaiting = 'none' | 'name' | 'who';

export interface Transition {
  book: NameBook;
  reply: string;
  awaiting: Awaiting;
}

function welcomeBack(names: readonly string[]): string {
  const template = names.length === 1 ? MISSED : names.length === 2 ? COMPANY_TWO : COMPANY_MANY;
  return fill(template, joinNames(names, 'and'));
}

function present(book: NameBook, names: readonly string[]): Transition {
  const learned = names.length === 1 && !isKnown(book, names[0]);
  const next = use(book, names);
  const reply = learned ? fill(LEARNED, next.current[0]) : welcomeBack(next.current);
  return { book: next, reply, awaiting: 'none' };
}

function whoAmI(book: NameBook): Transition {
  if (book.current.length === 0) return { book, reply: UNKNOWN_NAME, awaiting: 'name' };
  const template = book.current.length === 1 ? YOU_ARE : YOU_ARE_MANY;
  return { book, reply: fill(template, joinNames(book.current, 'and')), awaiting: 'none' };
}

export function transition(book: NameBook, intent: NameIntent): Transition {
  switch (intent.kind) {
    case 'present':
      return present(book, intent.names);
    case 'unsafe':
      return { book, reply: UNSAFE_NAME, awaiting: 'name' };
    case 'forgetMine':
      return { book: forgetCurrent(book), reply: FORGOT_MINE, awaiting: 'none' };
    case 'forgetAll':
      return { book: forgetAll(), reply: FORGOT_ALL, awaiting: 'none' };
    case 'whoAmI':
      return whoAmI(book);
  }
}
