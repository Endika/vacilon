import { actionFor, type EarAction } from '../domain/ear/action';
import type { FaceMachine } from '../domain/face/machine';
import { Ear } from './ear';
import type { Capture, Engine } from './ports';

export interface ListeningDeps {
  engine: () => Engine;
  capture: () => Capture;
  supported: () => boolean;
  face: Pick<FaceMachine, 'stopSpeaking' | 'startListening' | 'stopListening'>;
  /** False while a message is being answered. */
  canListen: () => boolean;
  silence: () => void;
  submit: (text: string) => void;
  say: (text: string) => void;
  view: ListeningView;
}

export interface ListeningView {
  loading(loading: boolean): void;
  partial(text: string): void;
  listening(on: boolean): void;
  hide(): void;
}

/** Hold to talk: what she hears becomes a message, and a failed hearing is told kindly. */
export class Listening {
  private readonly ear: Ear;
  private held = false;
  private earLoading = false;
  private active = false;

  constructor(private readonly deps: ListeningDeps) {
    const { view, face } = deps;
    this.ear = new Ear(
      { engine: deps.engine, capture: deps.capture, supported: deps.supported },
      {
        onLoading: (state) => {
          this.earLoading = !state.done;
          view.loading(this.earLoading);
        },
        onPartial: (text) => view.partial(text),
        onListening: (on) => {
          this.active = on;
          view.listening(on);
          if (on) face.startListening();
          else face.stopListening();
        },
      },
    );
  }

  get listening(): boolean {
    return this.active;
  }

  available(): boolean {
    return this.ear.available();
  }

  press(): void {
    if (!this.deps.canListen() || this.held) return;
    this.held = true;
    this.deps.silence();
    this.deps.face.stopSpeaking();
    void this.ear.press();
  }

  async release(): Promise<void> {
    if (!this.held) return;
    this.held = false;
    const loading = this.earLoading;
    this.perform(actionFor(await this.ear.release(), loading));
  }

  private perform(action: EarAction): void {
    if (action.kind === 'hide') this.deps.view.hide();
    else if (action.kind === 'submit') {
      this.deps.view.partial(action.text);
      this.deps.submit(action.text);
    } else this.deps.say(action.text);
  }
}
