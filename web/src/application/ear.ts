import type { EarResult } from '../domain/ear/result';
import type { Capture, Engine } from './ports';

export type EarLoading = { done: false; fraction: number } | { done: true };

export interface EarHandlers {
  onLoading(state: EarLoading): void;
  onPartial(text: string): void;
  onListening(listening: boolean): void;
}

export interface EarDeps {
  engine: () => Engine;
  capture: () => Capture;
  supported: () => boolean;
}

type Outcome = 'listening' | 'cancelled' | 'denied' | 'error';

function isDenied(error: unknown): boolean {
  return error instanceof Error && error.name === 'NotAllowedError';
}

export class Ear {
  private engine?: Engine;
  private loading?: Promise<boolean>;
  private capture?: Capture;
  private session?: Promise<Outcome>;
  private held = false;

  constructor(
    private readonly deps: EarDeps,
    private readonly handlers: EarHandlers,
  ) {}

  available(): boolean {
    return this.deps.supported();
  }

  async press(): Promise<void> {
    if (this.session || !this.available()) return;
    this.held = true;
    this.session = this.start();
    await this.session;
  }

  async release(): Promise<EarResult> {
    if (!this.available()) return { kind: 'unavailable' };
    const session = this.session;
    if (!session) return { kind: 'empty' };
    this.held = false;
    const outcome = await session;
    this.session = undefined;
    return outcome === 'listening' ? this.finish() : this.fromOutcome(outcome);
  }

  private fromOutcome(outcome: Exclude<Outcome, 'listening'>): EarResult {
    return outcome === 'cancelled' ? { kind: 'empty' } : { kind: outcome };
  }

  private async start(): Promise<Outcome> {
    if (!(await this.ensureLoaded())) return 'error';
    if (!this.held) return 'cancelled';
    const engine = this.engine!;
    const capture = this.deps.capture();
    try {
      engine.begin((text) => this.handlers.onPartial(text));
      await capture.start((chunk) => engine.feed(chunk));
    } catch (error) {
      return isDenied(error) ? 'denied' : 'error';
    }
    if (!this.held) {
      capture.stop();
      return 'cancelled';
    }
    this.capture = capture;
    this.handlers.onListening(true);
    return 'listening';
  }

  private async finish(): Promise<EarResult> {
    this.capture?.stop();
    this.capture = undefined;
    this.handlers.onListening(false);
    try {
      const text = (await this.engine!.finish()).trim();
      return text ? { kind: 'text', text } : { kind: 'empty' };
    } catch {
      return { kind: 'error' };
    }
  }

  private async ensureLoaded(): Promise<boolean> {
    if (this.engine) return true;
    this.loading ??= this.load();
    return this.loading;
  }

  private async load(): Promise<boolean> {
    const engine = this.deps.engine();
    this.handlers.onLoading({ done: false, fraction: 0 });
    try {
      await engine.load((fraction) => this.handlers.onLoading({ done: false, fraction }));
      this.engine = engine;
      return true;
    } catch {
      return false;
    } finally {
      this.loading = undefined;
      this.handlers.onLoading({ done: true });
    }
  }
}
