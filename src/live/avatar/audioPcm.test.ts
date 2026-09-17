import { describe, expect, it } from "vitest";
import { bytesToBinaryString, float32ToPcm16Bytes, resampleLinear } from "./audioPcm";

describe("LiveAvatar PCM conversion", () => {
  it("encodes normalized samples as little-endian signed PCM16", () => {
    const bytes = float32ToPcm16Bytes(new Float32Array([-1, 0, 1]));
    const view = new DataView(bytes.buffer);
    expect(view.getInt16(0, true)).toBe(-32768);
    expect(view.getInt16(2, true)).toBe(0);
    expect(view.getInt16(4, true)).toBe(32767);
  });

  it("resamples 32 kHz speech to approximately 24 kHz duration", () => {
    const oneSecond = new Float32Array(32_000);
    for (let i = 0; i < oneSecond.length; i++) oneSecond[i] = Math.sin((2 * Math.PI * 440 * i) / 32_000);
    const output = resampleLinear(oneSecond, 32_000, 24_000);
    expect(output.length).toBe(24_000);
  });

  it("preserves every PCM byte in the binary string expected by LiveAvatar", () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 254, 255]);
    const binary = bytesToBinaryString(bytes);
    expect(binary.length).toBe(bytes.length);
    expect(Array.from(binary, (char) => char.charCodeAt(0))).toEqual(Array.from(bytes));
  });
});
