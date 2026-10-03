import { supabase } from "@/integrations/supabase/client";
import { ShibaComputeAvatarClient, SHIBA_AVATAR_LABEL, type ComputeGrant } from "./ShibaComputeAvatarClient";
export type { RealtimeAvatarSnapshot, RealtimeAvatarStatus } from "./ShibaComputeAvatarClient";

export const realtimeAvatarBridge = new ShibaComputeAvatarClient({
  async createSession(liveSessionId) {
    const { data, error } = await supabase.functions.invoke("shiba-compute-session", { body: { live_session_id: liveSessionId } });
    if (error || !data?.session_token) throw Error("shibacompute_session_unavailable");
    return data as ComputeGrant;
  },
});
export const REALTIME_AVATAR_PROVIDER_LABEL = SHIBA_AVATAR_LABEL;
