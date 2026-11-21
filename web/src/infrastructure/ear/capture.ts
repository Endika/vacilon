import { SAMPLE_RATE, type Capture } from '../../application/ports';

const BLOCK = SAMPLE_RATE / 10;

// Averages the input down to 16 kHz mono, so it does not depend on the context
// accepting that rate (Safari and Firefox do not), and posts 100 ms blocks.
const WORKLET = `
class CaptureProcessor extends AudioWorkletProcessor {
  ratio = sampleRate / ${SAMPLE_RATE};
  sum = 0;
  count = 0;
  phase = 0;
  out = new Float32Array(${BLOCK});
  filled = 0;

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    for (const sample of channel) {
      this.sum += sample;
      this.count++;
      this.phase++;
      if (this.phase < this.ratio) continue;
      this.phase -= this.ratio;
      this.out[this.filled++] = this.sum / this.count;
      this.sum = 0;
      this.count = 0;
      if (this.filled < ${BLOCK}) continue;
      this.port.postMessage(this.out.slice());
      this.filled = 0;
    }
    return true;
  }
}
registerProcessor('ear-capture', CaptureProcessor);
`;

const registered = new WeakSet<BaseAudioContext>();

async function registerWorklet(context: AudioContext): Promise<void> {
  if (registered.has(context)) return;
  const url = URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' }));
  try {
    await context.audioWorklet.addModule(url);
    registered.add(context);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Reuses `shared` when given (and leaves it open); otherwise owns a context per start. */
export function createCapture(shared?: AudioContext): Capture {
  let release: (() => void) | undefined;

  return {
    async start(onChunk) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      const context = shared ?? new AudioContext();
      try {
        await registerWorklet(context);
        await context.resume();
        const node = new AudioWorkletNode(context, 'ear-capture', { numberOfOutputs: 0 });
        node.port.onmessage = (event: MessageEvent<Float32Array>) => onChunk(event.data);
        const source = context.createMediaStreamSource(stream);
        source.connect(node);
        release = () => {
          source.disconnect();
          node.disconnect();
          node.port.close();
          stream.getTracks().forEach((track) => track.stop());
          if (!shared) void context.close();
        };
      } catch (error) {
        stream.getTracks().forEach((track) => track.stop());
        if (!shared) void context.close();
        throw error;
      }
    },
    stop() {
      release?.();
      release = undefined;
    },
  };
}
