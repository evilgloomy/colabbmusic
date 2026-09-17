import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LiveLayout from "@/live/LiveLayout";

/**
 * `/live` — opens or resumes the staff member's private direct room with Cola.
 * The session is created server-side by a security-definer RPC that requires a
 * live staff role, so RLS is unchanged.
 */
export default function LiveDirect() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any).rpc("live_get_or_create_direct_session");
      if (cancelled) return;
      if (error || !data) {
        setError(error?.message ?? "Could not open your direct room.");
        return;
      }
      const id = typeof data === "string" ? data : data?.id;
      navigate(`/live/session/${id}`, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <LiveLayout>
      <div className="live-center">
        <p className="live-status">{error ?? "Opening your room with Cola…"}</p>
        {error && (
          <button className="live-btn" onClick={() => navigate("/live/sessions")}>
            Go to sessions
          </button>
        )}
      </div>
    </LiveLayout>
  );
}
