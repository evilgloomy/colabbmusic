/** Cola/Supabase composition root. The portable runtime does not import this module. */
import { supabase } from "@/integrations/supabase/client";
import { DigitalHumanSession } from "@/shiba/digital-human/runtime/DigitalHumanSession";
import { AuroraLiteBrainAdapter } from "@/shiba/digital-human/providers/brain/AuroraLiteBrainAdapter";
import { LemoLiteEmotionProvider } from "@/shiba/digital-human/providers/emotion/LemoLiteEmotionProvider";
import { MiniMaxSpeechProvider } from "@/shiba/digital-human/providers/speech/MiniMaxSpeechProvider";
import { BrowserAudioOutput } from "@/shiba/digital-human/providers/speech/BrowserAudioOutput";
import { NativeAvatarClient } from "@/shiba/digital-human/providers/avatar/NativeAvatarClient";
import type { Microphone } from "@/shiba/digital-human/contracts/speech";
import type { DigitalHumanCharacter } from "@/shiba/digital-human/contracts/character";
import { RuntimeError } from "@/shiba/digital-human/contracts/session";
export const cola: DigitalHumanCharacter = {
  id: "cola_b", displayName: "Cola B", brainProfile: "cola-aurora-lite",
  speech: { provider: "minimax" }, avatar: { provider: "shiba-native", avatarId: "cola_b" }, defaultLanguage: "yue",
};
async function request(name: string, body: unknown, signal: AbortSignal) {
  const { data } = await supabase.auth.getSession(); signal.throwIfAborted();
  if (!data.session) throw new RuntimeError("SessionExpired");
  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST", signal, headers: { Authorization: `Bearer ${data.session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}
export function createColaSession(sessionId: string, microphone: Microphone, language?: string, silenceThresholdMs?: number) {
  const avatar = new NativeAvatarClient(async signal => {
    const response = await request("native-avatar-session", { session_id: sessionId }, signal);
    if (!response.ok) throw new RuntimeError("AvatarUnavailable"); return response.json();
  });
  return new DigitalHumanSession({ character: cola, sessionId, microphone, language, silenceThresholdMs, avatar,
    brain: new AuroraLiteBrainAdapter(async (body, signal) => {
      const response = await request("live-turn", body, signal);
      if (!response.ok) throw new RuntimeError(response.status === 401 ? "SessionExpired" : "BrainUnavailable");
      const data = await response.json(); if (!data.ok) throw new RuntimeError("BrainUnavailable"); return data;
    }), emotion: new LemoLiteEmotionProvider(), speech: new MiniMaxSpeechProvider((body, signal) => request("cola-voice", body, signal)),
    output: new BrowserAudioOutput(),
  });
}
