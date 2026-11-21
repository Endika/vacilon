import { clampMessage } from '../domain/conversation/message';
import { route } from '../domain/conversation/route';
import type { FaceMachine } from '../domain/face/machine';
import { FALLBACK } from '../domain/phrases';
import { PASS, type FollowUp, type Stage, type Trick } from '../domain/tricks/types';
import { askSafely } from './ask-safely';
import type { Names } from './names';
import type { Bubble, Brain } from './ports';
import type { Speaking } from './speaking';

export interface ConversationDeps {
  brain: Brain;
  stage: Stage;
  tricks: Trick[];
  names: Pick<Names, 'greeting' | 'recognize' | 'clearAwaiting' | 'apply'>;
  bubble: Bubble;
  speaking: Pick<Speaking, 'silence'>;
  face: Pick<FaceMachine, 'activity' | 'startThinking'>;
  /** What to do with the next message when her reply asked something she can follow. */
  followQuestion: (reply: string) => FollowUp | null;
  /** Fires when a message is accepted, so the input can be cleared. */
  onAccepted(): void;
  /** Fires when she starts or stops being busy with a message, so the controls can lock. */
  onBusy(busy: boolean): void;
}

/** One message at a time: a name, a trick, the follow-up left open by a trick or her last question, or the brain. */
export class Conversation {
  private followUp: FollowUp | null = null;
  private working = false;

  constructor(private readonly deps: ConversationDeps) {}

  get busy(): boolean {
    return this.working;
  }

  greet(): void {
    this.say(this.deps.names.greeting());
  }

  say(text: string): void {
    void this.deps.stage.say(text);
  }

  async submit(message: string): Promise<void> {
    const { stage, tricks, names } = this.deps;
    const text = clampMessage(message);
    if (this.working || text === '') return;
    this.deps.onAccepted();
    const intent = names.recognize(text);
    names.clearAwaiting();
    const target = route(text, {
      pendingFollowUp: this.followUp !== null,
      tricks,
      aboutNames: intent !== null,
    });
    const pending = this.followUp;
    this.followUp = null;
    if (target === 'names' && intent) return this.locked(() => stage.say(names.apply(intent)));
    if (target === 'followUp' && pending)
      return this.locked(() => this.continueWith(pending, text));
    if (typeof target === 'object') {
      return this.locked(async () => {
        this.followUp = await target.trick.run(stage, text);
      });
    }
    return this.locked(() => this.ask(text));
  }

  private async continueWith(pending: FollowUp, text: string): Promise<void> {
    const result = await pending(text, this.deps.stage);
    if (result === PASS) await this.ask(text);
    else this.followUp = result;
  }

  private async locked(work: () => Promise<void>): Promise<void> {
    const { bubble, speaking, face } = this.deps;
    this.setBusy(true);
    speaking.silence();
    bubble.set('');
    face.activity();
    try {
      await work();
    } catch {
      bubble.set(FALLBACK);
    } finally {
      bubble.thinking(false);
      this.setBusy(false);
    }
  }

  private setBusy(busy: boolean): void {
    this.working = busy;
    this.deps.onBusy(busy);
  }

  private async ask(text: string): Promise<void> {
    const { brain, bubble, face } = this.deps;
    face.startThinking();
    bubble.thinking(true);
    const answer = await askSafely(
      (onToken) => brain.reply(text, onToken),
      (partial) => {
        bubble.set(partial);
        bubble.thinking(false);
      },
    ).catch(() => FALLBACK);
    bubble.thinking(false);
    this.say(answer);
    if (answer !== FALLBACK) this.followUp = this.deps.followQuestion(answer);
  }
}
