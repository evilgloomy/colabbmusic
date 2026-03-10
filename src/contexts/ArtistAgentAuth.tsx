import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { artistAgent } from '@/lib/artistAgent';

interface ArtistAgentAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const ArtistAgentAuthContext = createContext<ArtistAgentAuthContextType | undefined>(undefined);

export const ArtistAgentAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = artistAgent.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    artistAgent.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await artistAgent.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await artistAgent.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await artistAgent.auth.signOut();
  };

  return (
    <ArtistAgentAuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </ArtistAgentAuthContext.Provider>
  );
};

export const useArtistAgentAuth = () => {
  const ctx = useContext(ArtistAgentAuthContext);
  if (!ctx) throw new Error('useArtistAgentAuth must be used within ArtistAgentAuthProvider');
  return ctx;
};
