import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { shibaComputeSessionHandler } from "../_shared/shibaComputeSession.ts";

Deno.serve(shibaComputeSessionHandler({
  cors: corsHeaders,
  apiUrl: Deno.env.get("SHIBA_COMPUTE_API_URL"),
  apiKey: Deno.env.get("SHIBA_COMPUTE_API_KEY"),
  async authorize(token, liveSessionId) {
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: "Bearer " + token } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) return false;
    // Reuse the existing SECURITY DEFINER access check with the user's JWT.
    // A general Live role by itself does not authorize another guest's room.
    const { data, error } = await client.rpc("live_guest_session_view", { _session_id: liveSessionId });
    return !error && data?.ok === true && data.id === liveSessionId && data.status !== "ended";
  },
}));
