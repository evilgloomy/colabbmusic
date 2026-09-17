const NATIVE_AVATAR_SAMPLE_RATE = 16_000;

/** Collapse an AudioBuffer to mono without changing its sample rate. */
export function audioBufferToMono(buffer: AudioBuffer): Float32Array {
  const length = buffer.length;
  const mono = new Float32Array(length);
  const channels = Math.max(1, buffer.numberOfChannels);

  for (let c = 0; c < channels; c++) {
    const channel = buffer.getChannelData(Math.min(c, buffer.numberOfChannels - 1));
    for (let i = 0; i < length; i++) mono[i] += channel[i] / channels;
  }
  return mono;
}

/**
 * Small deterministic linear resampler. Speech does not need a heavyweight
 * DSP dependency here; NativeAvatar requires 16 kHz mono PCM16 and MiniMax's
 * decoded speech normally arrives at 32 kHz.
 */
export function resampleLinear(
  input: Float32Array,
  fromSampleRate: number,
  toSampleRate = NATIVE_AVATAR_SAMPLE_RATE,
): Float32Array {
  if (!input.length || fromSampleRate <= 0 || toSampleRate <= 0) return new Float32Array();
  if (fromSampleRate === toSampleRate) return new Float32Array(input);

  const ratio = fromSampleRate / toSampleRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const source = i * ratio;
    const left = Math.floor(source);
    const right = Math.min(input.length - 1, left + 1);
    const mix = source - left;
    output[i] = input[left] * (1 - mix) + input[right] * mix;
  }
  return output;
}

/** Convert normalized float samples to signed little-endian PCM16 bytes. */
export function float32ToPcm16Bytes(samples: Float32Array): Uint8Array {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const value = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
    view.setInt16(i * 2, value, true);
  }
  return bytes;
}

/** Legacy binary transports expect a byte-preserving JS binary string. */
export function bytesToBinaryString(bytes: Uint8Array): string {
  let output = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    output += String.fromCharCode(...chunk);
  }
  return output;
}

/**
 * Convert one or more decoded MiniMax AudioBuffers into the format required by
 * Native Avatar: raw signed 16-bit mono PCM at 16 kHz.
 */
export function audioBuffersToNativeAvatarPcm(buffers: AudioBuffer[]): string {
  if (!buffers.length) return "";

  const parts = buffers.map((buffer) => {
    const mono = audioBufferToMono(buffer);
    const resampled = resampleLinear(mono, buffer.sampleRate, NATIVE_AVATAR_SAMPLE_RATE);
    return float32ToPcm16Bytes(resampled);
  });

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    joined.set(part, offset);
    offset += part.length;
  }
  return bytesToBinaryString(joined);
}

export const NATIVE_AVATAR_PCM_SAMPLE_RATE = NATIVE_AVATAR_SAMPLE_RATE;
