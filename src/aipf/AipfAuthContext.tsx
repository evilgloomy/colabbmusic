import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface AipfAuthValue {
  session: Session | null;
  user: User | null;
  role: "admin" | "reviewer" | "member" | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AipfAuthContext = createContext<AipfAuthValue | null>(null);

export function AipfAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AipfAuthValue["role"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        // Defer role fetch to avoid deadlocks per Supabase guidance
        setTimeout(() => fetchRole(s.user.id), 0);
      } else {
        setRole(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchRole(data.session.user.id);
      setLoading(false);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  async function fetchRole(uid: string) {
    const db: any = supabase;
    const { data } = await db.from("aipf_user_roles").select("role").eq("user_id", uid);
    const roles = (data || []).map((r: any) => r.role as string);
    if (roles.includes("admin")) setRole("admin");
    else if (roles.includes("reviewer")) setRole("reviewer");
    else if (roles.includes("member")) setRole("member");
    else setRole(null);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/aipf/admin/login` },
    });
    return { error: error?.message };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setRole(null);
  }

  return (
    <AipfAuthContext.Provider
      value={{ session, user: session?.user ?? null, role, loading, signIn, signUp, signOut }}
    >
      {children}
    </AipfAuthContext.Provider>
  );
}

export function useAipfAuth() {
  const ctx = useContext(AipfAuthContext);
  if (!ctx) throw new Error("useAipfAuth must be used inside AipfAuthProvider");
  return ctx;
}
