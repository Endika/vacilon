import { bookFrom, type NameBook } from '../domain/names/book';
import { greet } from '../domain/names/greeting';
import { GREETINGS } from '../domain/names/phrases';
import { recognize, type NameIntent } from '../domain/names/recognize';
import { transition, type Awaiting, type Transition } from '../domain/names/transition';
import { randomNoRepeat, type Picker, type Rng } from '../domain/random';
import type { NameStore } from './ports';

export interface NamesDeps {
  store: NameStore;
  rng: Rng;
}

/** Remembers who is talking: reads introductions, answers about them and keeps the book on the device. */
export class Names {
  private book: NameBook;
  private awaiting: Awaiting = 'none';
  private readonly pickGreeting: Picker;

  constructor(private readonly deps: NamesDeps) {
    this.book = bookFrom(deps.store.load());
    this.pickGreeting = randomNoRepeat(GREETINGS, deps.rng);
  }

  get current(): readonly string[] {
    return this.book.current;
  }

  greeting(): string {
    return this.settle(greet(this.book, this.pickGreeting));
  }

  /** Reads the message with the question she last asked in mind. */
  recognize(text: string): NameIntent | null {
    return recognize(text, this.book, this.awaiting);
  }

  /** Any message answers the pending question, whether or not it was the answer. */
  clearAwaiting(): void {
    this.awaiting = 'none';
  }

  apply(intent: NameIntent): string {
    return this.settle(transition(this.book, intent));
  }

  private settle({ book, reply, awaiting }: Transition): string {
    this.book = book;
    this.awaiting = awaiting;
    this.deps.store.save(book.known);
    return reply;
  }
}
