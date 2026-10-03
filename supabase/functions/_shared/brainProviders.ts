/** Server-only language engines. Character identity is supplied by Aurora. */
export interface BrainInput {
  systemPrompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  userText: string;
  signal?: AbortSignal;
}
export interface BrainResult { text: string; provider: string; model: string; latencyMs: number }
export interface BrainProvider { id: string; generate(input: BrainInput): Promise<BrainResult> }
type Transport = typeof fetch;

export class OpenAIBrainProvider implements BrainProvider {
  readonly id = "openai";
  constructor(private key: string, private model = "gpt-5.6-luna", private transport: Transport = fetch) {}
  async generate(input: BrainInput): Promise<BrainResult> {
    const started = performance.now();
    const response = await this.transport("https://api.openai.com/v1/responses", {
      method: "POST", signal: input.signal,
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, instructions: input.systemPrompt,
        input: [...input.history, { role: "user", content: input.userText }],
        reasoning: { effort: "none" }, max_output_tokens: 400, store: false }),
    });
    if (!response.ok) throw new Error("BrainUnavailable");
    const data = await response.json();
    const text = (data.output ?? []).filter((item: any) => item.type === "message")
      .flatMap((item: any) => item.content ?? []).filter((item: any) => item.type === "output_text")
      .map((item: any) => item.text).join("").trim();
    if (!text || data.status === "incomplete" || data.error) throw new Error("BrainUnavailable");
    return { text, provider: this.id, model: data.model ?? this.model, latencyMs: performance.now() - started };
  }
}
export class LovableGatewayBrainProvider implements BrainProvider {
  readonly id = "lovable";
  constructor(private key: string, private model = "google/gemini-2.5-flash", private transport: Transport = fetch) {}
  async generate(input: BrainInput): Promise<BrainResult> {
    const started = performance.now();
    const response = await this.transport("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST", signal: input.signal,
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, messages: [{ role: "system", content: input.systemPrompt },
        ...input.history, { role: "user", content: input.userText }], reasoning_effort: "none", max_tokens: 400 }),
    });
    if (!response.ok) throw new Error("BrainUnavailable");
    const data = await response.json();
    const text = String(data.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error("BrainUnavailable");
    return { text, provider: this.id, model: data.model ?? this.model, latencyMs: performance.now() - started };
  }
}
export function configuredBrains(env: (name: string) => string | undefined): BrainProvider[] {
  const primary = env("AURORA_LITE_PROVIDER") ?? "openai";
  const providers: BrainProvider[] = [];
  if (primary === "openai" && env("OPENAI_API_KEY")) providers.push(new OpenAIBrainProvider(env("OPENAI_API_KEY")!, env("AURORA_LITE_MODEL")));
  if (env("LOVABLE_API_KEY")) providers.push(new LovableGatewayBrainProvider(env("LOVABLE_API_KEY")!,
    primary === "lovable" ? env("AURORA_LITE_MODEL") : env("AURORA_LITE_FALLBACK_MODEL")));
  return providers;
}
export async function generateWithFallback(providers: BrainProvider[], input: BrainInput, fallback: () => string): Promise<BrainResult> {
  const started = performance.now();
  for (const provider of providers) {
    input.signal?.throwIfAborted();
    const controller = new AbortController();
    const abort = () => controller.abort();
    input.signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, 8000);
    try { return await provider.generate({ ...input, signal: controller.signal }); }
    catch { input.signal?.throwIfAborted(); }
    finally { clearTimeout(timer); input.signal?.removeEventListener("abort", abort); }
  }
  input.signal?.throwIfAborted();
  return { text: fallback(), provider: "deterministic", model: "aurora-lite-fallback", latencyMs: performance.now() - started };
}
