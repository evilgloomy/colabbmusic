import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLiveAuth } from "@/live/LiveAuthContext";
import type { LiveSessionConfig } from "@/live/lib/types";

/** Staff read the full briefing; guests only ever get the safe summary. */
export function useLiveSession(sessionId?: string) {
  const { isStaff, loading: authLoading } = useLiveAuth();
  const [config, setConfig] = useState<LiveSessionConfig | null>(null);
  const [brief, setBrief] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || authLoading) return;
    let cancelled = false;
    const db: any = supabase;

    (async () => {
      setLoading(true);
      if (isStaff) {
        const { data, error: err } = await db.from("live_sessions").select("*").eq("id", sessionId).maybeSingle();
        if (cancelled) return;
        if (err || !data) setError(err?.message || "Session not found");
        else {
          setBrief(data);
          setConfig(data as LiveSessionConfig);
        }
      } else {
        const { data, error: err } = await db.rpc("live_guest_session_view", { _session_id: sessionId });
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (err || !row) setError(err?.message || "You do not have access to this session.");
        else setConfig(row as LiveSessionConfig);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, isStaff, authLoading]);

  return { config, brief, loading, error };
}
