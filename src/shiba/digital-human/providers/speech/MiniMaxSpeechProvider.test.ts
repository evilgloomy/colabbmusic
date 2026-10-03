// @vitest-environment node
import { it, expect } from "vitest";
import { MiniMaxSpeechProvider } from "./MiniMaxSpeechProvider";
import { NEUTRAL } from "../../contracts/emotion";
it("preserves PCM bytes across split SSE network boundaries", async () => {
  const payload = 'data: {"type":"chunk","audio_base64":"AQIDBA=="}\r\n\r\ndata: {"type":"done"}\n\n';
  const stream = new ReadableStream({ start(controller) { for (const char of payload) controller.enqueue(new TextEncoder().encode(char)); controller.close(); } });
  const provider = new MiniMaxSpeechProvider(async () => new Response(stream));
  const result = [];
  for await (const chunk of provider.synthesize({ text: "你好", emotion: NEUTRAL, language: "yue", signal: new AbortController().signal })) result.push(...new Uint8Array(chunk.pcm));
  expect(result).toEqual([1, 2, 3, 4]);
});
it("rejects truncated streams instead of claiming successful completion", async () => {
  const provider = new MiniMaxSpeechProvider(async () => new Response('data: {"type":"chunk","audio_base64":"AQI="}\n\n'));
  await expect((async () => { for await (const _ of provider.synthesize({ text: "a", emotion: NEUTRAL, language: "en", signal: new AbortController().signal })) {} })()).rejects.toThrow("SpeechUnavailable");
});
