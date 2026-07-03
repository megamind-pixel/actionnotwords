import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [settings, setSettings] = useState({ org_name: 'Actions Not Words', logo_url: '' });
  const [loading, setLoading] = useState(true);

  async function fetchAdmin() {
    try {
      const me = await api.getMe();
      setAdmin(me);
      setUnauthorized(false);
    } catch {
      setUnauthorized(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchAdmin();
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Only link for Google/OAuth sign-ins, not email+password
        if (event === 'SIGNED_IN' && session.user.app_metadata?.provider !== 'email') {
          try { await api.linkAdmin(); } catch {}
          // Small delay to let the DB commit before we read it back
          await new Promise(r => setTimeout(r, 300));
        }
        await fetchAdmin();
      } else {
        setAdmin(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' }
      }
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, admin, unauthorized, settings, setSettings, loading, signInWithEmail, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
