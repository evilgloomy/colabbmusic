// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { OpenAIBrainProvider, LovableGatewayBrainProvider, generateWithFallback, configuredBrains } from "../../supabase/functions/_shared/brainProviders";
const input = { systemPrompt: "injected profile", history: [], userText: "你好" };
describe("server brain providers", () => {
  it("uses Responses API, configurable model and no stored responses", async () => {
    const transport = vi.fn().mockResolvedValue(new Response(JSON.stringify({ model: "configured", status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "你好呀" }] }] })));
    const result = await new OpenAIBrainProvider("server-only", "configured", transport).generate(input);
    expect(result.text).toBe("你好呀"); expect(result.provider).toBe("openai");
    const body = JSON.parse(transport.mock.calls[0][1].body);
    expect(transport.mock.calls[0][0]).toBe("https://api.openai.com/v1/responses");
    expect(body).toMatchObject({ model: "configured", store: false, reasoning: { effort: "none" }, instructions: input.systemPrompt });
  });
  it("reports actual fallback provider and model", async () => {
    const primary = { id: "openai", generate: vi.fn().mockRejectedValue(new Error("401 secret")) };
    const secondary = new LovableGatewayBrainProvider("key", "fallback-model", vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "fallback reply" } }] }))));
    expect(await generateWithFallback([primary, secondary], input, () => "local")).toMatchObject({ provider: "lovable", model: "fallback-model" });
    expect(await generateWithFallback([primary], input, () => "local")).toMatchObject({ provider: "deterministic", text: "local" });
  });
  it("does not fall back on cancellation", async () => {
    const controller = new AbortController(); controller.abort(); const fallback = vi.fn();
    await expect(generateWithFallback([], { ...input, signal: controller.signal }, fallback)).rejects.toThrow();
    expect(fallback).not.toHaveBeenCalled();
  });
  it("selects OpenAI first without requiring Lovable", () => {
    const env = { OPENAI_API_KEY: "test" }; expect(configuredBrains(key => env[key]).map(p => p.id)).toEqual(["openai"]);
  });
  it("treats incomplete or empty OpenAI output as provider failure", async () => {
    const provider = new OpenAIBrainProvider("key", undefined, vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "incomplete", output: [] }))));
    await expect(provider.generate(input)).rejects.toThrow("BrainUnavailable");
  });
});
