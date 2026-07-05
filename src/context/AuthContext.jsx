import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    if (!supabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signUp({ email, password });
  }

  async function signIn(email, password) {
    if (!supabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    if (!supabaseConfigured) return;
    return supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, configured: supabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
