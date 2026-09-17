type Grant = { session_id: string; session_token: string; signaling_url: string; expires_at: string };
type Dependencies = {
  authorize: (token: string, liveSessionId: string) => Promise<boolean>;
  apiUrl?: string;
  apiKey?: string;
  fetcher?: typeof fetch;
  cors: Record<string, string>;
};
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

/** Server-only bridge. Tests inject auth and HTTP; no master credential is serialized. */
export function shibaComputeSessionHandler(deps: Dependencies) {
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
    status, headers: { ...deps.cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  return async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: deps.cors });
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const token = /^Bearer ([^\s]+)$/.exec(req.headers.get("Authorization") ?? "")?.[1];
    if (!token) return json({ error: "unauthorized" }, 401);
    try {
      const reader = req.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 1024) { await reader.cancel(); return json({ error: "invalid_body" }, 400); }
          chunks.push(value);
        }
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const raw = new TextDecoder().decode(bytes);
      const body = JSON.parse(raw) as { live_session_id?: string };
      if (!UUID.test(body.live_session_id ?? "")) return json({ error: "invalid_live_session" }, 400);
      if (!await deps.authorize(token, body.live_session_id!)) return json({ error: "forbidden" }, 403);
      if (!deps.apiUrl || !deps.apiKey) return json({ error: "compute_not_configured" }, 503);
      const base = new URL(deps.apiUrl);
      if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || base.pathname !== "/") {
        return json({ error: "compute_not_configured" }, 503);
      }
      const response = await (deps.fetcher ?? fetch)(base.origin + "/v1/compute/sessions", {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
        headers: { Authorization: "Bearer " + deps.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ capability: "digital_human.avatar.realtime", character_id: "cola_b",
          client: "colabbmusic", output: { resolution: "720p", fps: 25 } }),
      });
      if (!response.ok) {
        await response.body?.cancel();
        return json({ error: response.status === 503 ? "compute_unavailable" : "compute_session_failed" }, 503);
      }
      const grant = await response.json() as Grant;
      if (!UUID.test(grant.session_id) || typeof grant.session_token !== "string" || grant.session_token.length > 4096 ||
          grant.signaling_url !== base.origin + "/v1/compute/sessions/" + grant.session_id ||
          !(Date.parse(grant.expires_at) > Date.now())) return json({ error: "compute_invalid_response" }, 502);
      // Explicit allowlist: no worker details, master key, provider payload or voice ID.
      return json({ session_id: grant.session_id, session_token: grant.session_token,
        signaling_url: grant.signaling_url, expires_at: grant.expires_at });
    } catch {
      return json({ error: "compute_session_unavailable" }, 503);
    }
  };
}
