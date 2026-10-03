export type VoiceDiagnostics = {
  provider: string;
  state: "unknown" | "online" | "fallback" | "error";
  voiceIdConfigured: boolean | null;
  browserTtsFallback: boolean;
  error?: string;
};
let snapshot: VoiceDiagnostics = { provider: "MiniMax Speech 2.8 Turbo — Cola B", state: "unknown", voiceIdConfigured: null, browserTtsFallback: false };
const listeners = new Set<() => void>();
export const getVoiceDiagnostics = () => snapshot;
export const subscribeVoiceDiagnostics = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function setVoiceDiagnostics(patch: Partial<VoiceDiagnostics>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach(listener => listener());
}
