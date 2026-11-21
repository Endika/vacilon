import { actionFor, type EarAction } from '../domain/ear/action';
import type { FaceMachine } from '../domain/face/machine';
import { Ear } from './ear';
import type { Capture, Engine } from './ports';

/** Starts `run` after `ms` and returns a function that cancels it. */
export type StartTimer = (run: () => void, ms: number) => () => void;

/** With nothing heard by then, she stops listening. */
export const NO_SPEECH_MS = 6_000;
/** The microphone is never open longer than this. */
export const MAX_LISTEN_MS = 15_000;

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
  timer: StartTimer;
}

export interface ListeningView {
  loading(loading: boolean): void;
  partial(text: string): void;
  listening(on: boolean): void;
  hide(): void;
}

/**
 * Tap to talk: she listens until the speaker pauses, taps again or a time limit passes; what she
 * hears becomes a message, and a failed hearing is told kindly.
 */
export class Listening {
  private readonly ear: Ear;
  private readonly timer: StartTimer;
  private held = false;
  private earLoading = false;
  private active = false;
  private heard = false;
  private cancelTimers: Array<() => void> = [];

  constructor(private readonly deps: ListeningDeps) {
    const { view, face } = deps;
    this.timer = deps.timer;
    this.ear = new Ear(
      { engine: deps.engine, capture: deps.capture, supported: deps.supported },
      {
        onLoading: (state) => {
          this.earLoading = !state.done;
          view.loading(this.earLoading);
        },
        onPartial: (text) => {
          if (text) this.heard = true;
          view.partial(text);
        },
        onListening: (on) => {
          this.active = on;
          view.listening(on);
          if (on) {
            face.startListening();
            this.armTimers();
          } else {
            face.stopListening();
            this.clearTimers();
          }
        },
        onPause: () => void this.release(),
      },
    );
  }

  get listening(): boolean {
    return this.active;
  }

  available(): boolean {
    return this.ear.available();
  }

  toggle(): void {
    if (this.held) void this.release();
    else this.press();
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

  private armTimers(): void {
    this.heard = false;
    this.cancelTimers = [
      this.timer(() => {
        if (!this.heard) void this.release();
      }, NO_SPEECH_MS),
      this.timer(() => void this.release(), MAX_LISTEN_MS),
    ];
  }

  private clearTimers(): void {
    for (const cancel of this.cancelTimers) cancel();
    this.cancelTimers = [];
  }

  private perform(action: EarAction): void {
    if (action.kind === 'hide') this.deps.view.hide();
    else if (action.kind === 'submit') {
      this.deps.view.partial(action.text);
      this.deps.submit(action.text);
    } else this.deps.say(action.text);
  }
}
