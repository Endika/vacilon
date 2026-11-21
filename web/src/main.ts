import './style.css';
import { Conversation } from './application/conversation';
import { Listening } from './application/listening';
import { Names } from './application/names';
import { Speaking } from './application/speaking';
import { createStage } from './application/stage';
import { VoiceStartup } from './application/voice-startup';
import { FaceMachine, SLEEPING_VIEW } from './domain/face/machine';
import { createTricks } from './domain/tricks/registry';
import { playSong } from './infrastructure/audio/song-player';
import { BrainClient } from './infrastructure/brain/client';
import { createCapture } from './infrastructure/ear/capture';
import { browserSupportsEar } from './infrastructure/ear/support';
import { VoskEngine } from './infrastructure/ear/vosk';
import { LocalNameStore } from './infrastructure/names/local-name-store';
import { setupInstall } from './infrastructure/install/install';
import { createPiperVoice } from './infrastructure/piper/neural-voice';
import { VoiceSelector } from './infrastructure/voice/selector';
import { safeStorage } from './infrastructure/voice/storage';
import { browserTimer } from './infrastructure/timer';
import { Tts } from './infrastructure/voice/tts';
import { createBubble } from './ui/bubble';
import { bindComposer } from './ui/composer';
import { byId } from './ui/dom';
import { applyView, mountFace, playJump, runFace } from './ui/face-view';
import { bindFaceInteractions } from './ui/face-interactions';
import { onUserGesture } from './ui/gesture';
import { createLoader } from './ui/loader';
import { bindMic } from './ui/mic-button';
import { bindMute } from './ui/mute-button';
import { createStatus } from './ui/status';
import { mountTemplate } from './ui/template';
import { followVisualViewport } from './ui/viewport';

function assetUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}

async function main(host: HTMLElement): Promise<void> {
  mountTemplate(host);
  const faceSvg = mountFace(byId('chispa'));
  const bubble = createBubble(host);
  const loader = createLoader(host);
  const status = createStatus();

  const tts = new Tts();
  const voice = new VoiceSelector(tts, safeStorage());
  const piper = createPiperVoice(assetUrl('voice/'));
  const brain = new BrainClient(
    new Worker(new URL('./infrastructure/brain/worker.ts', import.meta.url), { type: 'module' }),
  );

  const face = new FaceMachine({
    now: () => performance.now(),
    rng: Math.random,
    onSay: (_kind, text) => {
      bubble.set(text);
      if (!conversation.busy && !listening.listening) void speaking.speak(text);
    },
  });
  const speaking = new Speaking({ voice, face });
  const startup = new VoiceStartup({
    voice,
    neural: piper,
    speaking,
    systemVoice: () => tts.canSpeak,
    onLoading: status.voiceLoading,
  });
  const stage = createStage({
    bubble,
    speak: (text) => speaking.speak(text),
    face,
    songs: (song, handlers) =>
      playSong(piper.audioContext(), song, handlers, { muted: voice.muted }),
  });

  const composer = bindComposer(
    (text) => void conversation.submit(text),
    () => face.activity(),
  );
  const mic = bindMic({ toggle: () => listening.toggle() });

  const names = new Names({ store: new LocalNameStore(safeStorage()), rng: Math.random });
  const conversation = new Conversation({
    brain,
    stage,
    tricks: createTricks(Math.random, () => names.current),
    names,
    bubble,
    speaking,
    face,
    onAccepted: composer.clear,
    onBusy: (busy) => {
      composer.lock(busy);
      mic.lock(busy);
    },
  });
  const listening = new Listening({
    engine: () => new VoskEngine(),
    capture: () => createCapture(piper.audioContext() ?? undefined),
    supported: browserSupportsEar,
    timer: browserTimer,
    face,
    canListen: () => !conversation.busy,
    silence: () => speaking.silence(),
    submit: (text) => void conversation.submit(text),
    say: (text) => conversation.say(text),
    view: {
      loading: status.earLoading,
      partial: composer.set,
      listening: mic.setPressed,
      hide: () => mic.setHidden(true),
    },
  });

  setupInstall(byId('install'), byId('guide'));
  applyView(faceSvg, SLEEPING_VIEW);
  bindMute(voice, () => speaking.toggleMute());
  mic.setHidden(!listening.available());
  bindFaceInteractions(face);
  onUserGesture(() => startup.gesture());
  followVisualViewport(host);

  try {
    await brain.load(assetUrl('model/'), loader.update);
  } catch {
    loader.fail();
    return;
  }
  loader.done();
  startup.brainLoaded();
  runFace(faceSvg, face);
  playJump(faceSvg);
  conversation.greet();
}

void main(document.getElementById('app') as HTMLElement);
