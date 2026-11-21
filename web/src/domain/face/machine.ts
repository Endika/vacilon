import { cycle, randomNoRepeat, type Picker, type Rng } from '../random';
import { BORED_PHRASES, TICKLE_PHRASES, WAKE_PHRASES } from './phrases';

export const BORED_AFTER_MS = 30_000;
export const SLEEP_AFTER_MS = 60_000;
export const TICKLE_MS = 1_400;
export const YAWN_MS = 2_600;
export const POINTER_HOLD_MS = 2_500;
export const BLINK_MS = 160;
export const WINK_MS = 320;
export const WINK_CHANCE = 0.12;
export const MOUTH_MS = 130;
export const MOUTH_SMALL_LEVEL = 0.1;
export const MOUTH_OPEN_LEVEL = 0.35;
const BLINK_MIN_MS = 2_000;
const BLINK_SPAN_MS = 3_000;
const LOOK_MIN_MS = 1_200;
const LOOK_SPAN_MS = 2_300;

export type Mode =
  'idle' | 'bored' | 'asleep' | 'thinking' | 'speaking' | 'tickled' | 'dancing' | 'listening';
export type EyeShape = 'open' | 'closed' | 'happy';
export type MouthShape = 'smile' | 'open' | 'yawn' | 'flat' | 'small';
export type SayKind = 'tickle' | 'bored' | 'wake';
type Side = 'both' | 'left' | 'right';

export function mouthForLevel(level: number): MouthShape {
  if (level >= MOUTH_OPEN_LEVEL) return 'open';
  return level >= MOUTH_SMALL_LEVEL ? 'small' : 'smile';
}

export interface Gaze {
  x: number;
  y: number;
}

export interface FaceView {
  mode: Mode;
  eyeLeft: EyeShape;
  eyeRight: EyeShape;
  mouth: MouthShape;
  gaze: Gaze;
  cheeks: boolean;
  jumpId: number;
}

export interface FaceDeps {
  now: () => number;
  rng: Rng;
  onSay?: (kind: SayKind, text: string) => void;
}

export const SLEEPING_VIEW: FaceView = {
  mode: 'asleep',
  eyeLeft: 'closed',
  eyeRight: 'closed',
  mouth: 'smile',
  gaze: { x: 0, y: 0 },
  cheeks: false,
  jumpId: 0,
};

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));

export class FaceMachine {
  private readonly now: () => number;
  private readonly rng: Rng;
  private readonly onSay: (kind: SayKind, text: string) => void;
  private readonly pick: Record<SayKind, Picker>;

  private lastActivity: number;
  private asleep = false;
  private bored = false;
  private thinking = false;
  private speaking = false;
  private dancing = false;
  private listening = false;
  private tickledUntil = 0;
  private yawnUntil = 0;
  private jumpId = 0;

  private blinkAt: number;
  private blinkUntil = 0;
  private blinkSide: Side = 'both';

  private gaze: Gaze = { x: 0, y: 0 };
  private lookAt: number;
  private pointerUntil = 0;

  private mouthOpen = false;
  private mouthToggleAt = 0;
  private levelDriven = false;
  private pendingLevel = 0;
  private shownLevel = 0;

  constructor({ now, rng, onSay = () => undefined }: FaceDeps) {
    this.now = now;
    this.rng = rng;
    this.onSay = onSay;
    this.pick = {
      tickle: randomNoRepeat(TICKLE_PHRASES, rng),
      bored: cycle(BORED_PHRASES, rng),
      wake: randomNoRepeat(WAKE_PHRASES, rng),
    };
    const t = now();
    this.lastActivity = t;
    this.blinkAt = t + this.blinkDelay();
    this.lookAt = t + this.lookDelay();
  }

  tick(): void {
    const t = this.now();
    if (this.busy) this.lastActivity = t;
    this.updateBoredom(t);
    this.updateBlink(t);
    this.updateLook(t);
    this.updateMouth(t);
  }

  view(): FaceView {
    const t = this.now();
    const mode = this.mode(t);
    const [eyeLeft, eyeRight] = this.eyes(mode, t);
    return {
      mode,
      eyeLeft,
      eyeRight,
      mouth: this.mouth(mode, t),
      gaze: this.gazeFor(mode),
      cheeks: mode === 'tickled',
      jumpId: this.jumpId,
    };
  }

  activity(): void {
    const wasAsleep = this.asleep;
    this.lastActivity = this.now();
    this.bored = false;
    if (!wasAsleep) return;
    this.asleep = false;
    this.jumpId++;
    this.say('wake');
  }

  touch(onChispa: boolean): void {
    const wasAsleep = this.asleep;
    this.activity();
    if (!onChispa || wasAsleep) return;
    this.tickledUntil = this.now() + TICKLE_MS;
    this.jumpId++;
    if (!this.busy) this.say('tickle');
  }

  pointer(x: number, y: number): void {
    const t = this.now();
    this.gaze = { x: clamp(x), y: clamp(y) };
    this.pointerUntil = t + POINTER_HOLD_MS;
    this.lookAt = this.pointerUntil;
  }

  startThinking(): void {
    this.activity();
    this.thinking = true;
    this.speaking = false;
  }

  startSpeaking(): void {
    this.thinking = false;
    this.speaking = true;
    this.levelDriven = false;
    this.openMouth();
  }

  /** Real audio level (0 to 1): from now on the mouth follows it instead of the syllable beat. */
  setMouthLevel(level: number): void {
    if (!this.speaking) return;
    this.levelDriven = true;
    this.pendingLevel = Math.max(this.pendingLevel, level);
  }

  stopSpeaking(): void {
    this.thinking = false;
    this.speaking = false;
    this.mouthOpen = false;
    this.levelDriven = false;
    this.pendingLevel = 0;
    this.shownLevel = 0;
    this.lastActivity = this.now();
  }

  startDancing(): void {
    this.activity();
    this.dancing = true;
  }

  stopDancing(): void {
    this.dancing = false;
    this.lastActivity = this.now();
  }

  startListening(): void {
    this.activity();
    this.listening = true;
  }

  stopListening(): void {
    this.listening = false;
    this.lastActivity = this.now();
  }

  syllable(): void {
    if (this.speaking) this.openMouth();
  }

  private get busy(): boolean {
    return this.thinking || this.speaking || this.dancing || this.listening;
  }

  private say(kind: SayKind): void {
    this.onSay(kind, this.pick[kind]());
  }

  private openMouth(): void {
    this.mouthOpen = true;
    this.mouthToggleAt = this.now() + MOUTH_MS;
  }

  private blinkDelay(): number {
    return BLINK_MIN_MS + this.rng() * BLINK_SPAN_MS;
  }

  private lookDelay(): number {
    return LOOK_MIN_MS + this.rng() * LOOK_SPAN_MS;
  }

  private updateBoredom(t: number): void {
    if (this.asleep) return;
    const idle = t - this.lastActivity;
    if (idle >= SLEEP_AFTER_MS) {
      this.asleep = true;
      this.bored = false;
    } else if (idle >= BORED_AFTER_MS && !this.bored) {
      this.bored = true;
      this.yawnUntil = t + YAWN_MS;
      this.say('bored');
    }
  }

  private updateBlink(t: number): void {
    if (this.asleep || t < this.blinkAt) return;
    const wink = this.rng() < WINK_CHANCE;
    this.blinkSide = wink ? (this.rng() < 0.5 ? 'left' : 'right') : 'both';
    this.blinkUntil = t + (wink ? WINK_MS : BLINK_MS);
    this.blinkAt = t + this.blinkDelay();
  }

  private updateLook(t: number): void {
    if (t < this.lookAt) return;
    this.lookAt = t + this.lookDelay();
    this.gaze = { x: this.rng() * 2 - 1, y: (this.rng() * 2 - 1) * 0.4 };
  }

  private updateMouth(t: number): void {
    if (this.levelDriven) {
      this.shownLevel = this.pendingLevel;
      this.pendingLevel = 0;
      return;
    }
    if (!this.speaking || t < this.mouthToggleAt) return;
    this.mouthOpen = !this.mouthOpen;
    this.mouthToggleAt = t + MOUTH_MS;
  }

  private mode(t: number): Mode {
    if (this.asleep) return 'asleep';
    if (t < this.tickledUntil) return 'tickled';
    if (this.listening) return 'listening';
    if (this.dancing) return 'dancing';
    if (this.thinking) return 'thinking';
    if (this.speaking) return 'speaking';
    return this.bored ? 'bored' : 'idle';
  }

  private gazeFor(mode: Mode): Gaze {
    if (mode === 'listening') return { x: 0, y: 0 };
    return mode === 'thinking' ? { x: this.gaze.x * 0.4, y: -1 } : this.gaze;
  }

  private eyes(mode: Mode, t: number): [EyeShape, EyeShape] {
    if (mode === 'asleep') return ['closed', 'closed'];
    if (mode === 'tickled' || mode === 'dancing') return ['happy', 'happy'];
    if (t >= this.blinkUntil) return ['open', 'open'];
    const left = this.blinkSide !== 'right';
    const right = this.blinkSide !== 'left';
    return [left ? 'closed' : 'open', right ? 'closed' : 'open'];
  }

  private mouth(mode: Mode, t: number): MouthShape {
    if (mode === 'tickled' || mode === 'dancing') return 'open';
    if (mode === 'thinking' || mode === 'listening') return 'small';
    if (mode === 'speaking' && this.levelDriven) return mouthForLevel(this.shownLevel);
    if (mode === 'speaking') return this.mouthOpen ? 'open' : 'smile';
    if (mode === 'bored') return t < this.yawnUntil ? 'yawn' : 'flat';
    return 'smile';
  }
}
