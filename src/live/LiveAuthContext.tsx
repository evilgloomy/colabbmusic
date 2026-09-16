import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { LiveRole } from "@/live/lib/types";

interface LiveAuthValue {
  session: Session | null;
  user: User | null;
  role: LiveRole | null;
  loading: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const LiveAuthContext = createContext<LiveAuthValue | null>(null);

/** Isolated from AIPF and from the fan-chat backend. Sign-in only — no signup. */
export function LiveAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<LiveRole | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchRole(uid: string) {
    const db: any = supabase;
    const { data } = await db.from("live_user_roles").select("role").eq("user_id", uid);
    const roles: string[] = (data || []).map((r: any) => r.role);
    if (roles.includes("admin")) setRole("admin");
    else if (roles.includes("producer")) setRole("producer");
    else if (roles.includes("guest")) setRole("guest");
    else setRole(null);
  }

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) setTimeout(() => fetchRole(s.user.id), 0);
      else setRole(null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchRole(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const value: LiveAuthValue = {
    session,
    user: session?.user ?? null,
    role,
    loading,
    isStaff: role === "admin" || role === "producer",
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    async signOut() {
      await supabase.auth.signOut();
      setRole(null);
    },
    async refreshRole() {
      if (session?.user) await fetchRole(session.user.id);
    },
  };

  return <LiveAuthContext.Provider value={value}>{children}</LiveAuthContext.Provider>;
}

export function useLiveAuth() {
  const ctx = useContext(LiveAuthContext);
  if (!ctx) throw new Error("useLiveAuth must be used inside LiveAuthProvider");
  return ctx;
}
