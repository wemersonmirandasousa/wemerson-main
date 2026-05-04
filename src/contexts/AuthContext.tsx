import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'editor' | 'readonly' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  isEditor: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  isEditor: false,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      setRole((data?.role as AppRole) ?? 'readonly');
    } catch {
      setRole('readonly');
    }
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Check if this is the master user (00@wemerson.app) — mark as ephemeral
        if (sess.user.email === '00@wemerson.app') {
          sessionStorage.setItem('ephemeral_session', 'true');
        }
        // Use setTimeout to avoid potential deadlock with Supabase auth
        setTimeout(() => fetchRole(sess.user.id), 0);
      } else {
        setRole(null);
      }
      setIsLoading(false);
    });

    // Then get session
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      // If ephemeral session flag is set and page was refreshed, sign out
      if (sess?.user?.email === '00@wemerson.app') {
        const isEphemeral = sessionStorage.getItem('ephemeral_session');
        if (!isEphemeral) {
          // Page was refreshed or reopened — sign out the master user
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setRole(null);
          setIsLoading(false);
          return;
        }
      }
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        await fetchRole(sess.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isEditor: role === 'editor', isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
