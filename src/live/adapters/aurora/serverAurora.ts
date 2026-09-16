import { supabase } from "@/integrations/supabase/client";
import type { AuroraAdapter, AuroraRequest, AuroraResult } from "@/live/lib/types";

/**
 * Server-routed Aurora adapter. The browser never sees producer context,
 * system prompts, or provider keys — the `live-turn` function owns all of it.
 * In Phase 1 the function answers with a server-side mock.
 */
export function createServerAuroraAdapter(): AuroraAdapter {
  return {
    id: "server-aurora",
    isMock: false,
    async generate(req: AuroraRequest): Promise<AuroraResult> {
      const { data, error } = await supabase.functions.invoke("live-turn", { body: req });
      if (error) throw new Error(error.message || "Aurora request failed");
      if (!data?.ok) throw new Error(data?.error || "Aurora request failed");
      return {
        reply_text: data.reply_text,
        engine: data.engine,
        lemo: data.lemo,
        metadata: data.metadata,
        memory_refs: data.memory_refs,
        message_id: data.message_id,
        latency: data.latency,
        mock: Boolean(data.mock),
      };
    },
  };
}
