import { use, type NameBook } from './book';
import { joinNames } from './join';
import { WELCOME_AND_ASK, WHO_IS_HERE, fill } from './phrases';
import type { Transition } from './transition';
import type { Picker } from '../random';

/** `pick` chooses one of the greeting templates for a single known name. */
export function greet(book: NameBook, pick: Picker): Transition {
  if (book.known.length === 0) return { book, reply: WELCOME_AND_ASK, awaiting: 'name' };
  if (book.known.length === 1) {
    const next = use(book, book.known);
    return { book: next, reply: fill(pick(), next.known[0]), awaiting: 'none' };
  }
  const reply = fill(WHO_IS_HERE, joinNames(book.known, 'or'));
  return { book: { ...book, current: [] }, reply, awaiting: 'who' };
}
