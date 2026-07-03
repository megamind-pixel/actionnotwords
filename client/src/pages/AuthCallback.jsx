import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Handles the OAuth redirect from Supabase/Google.
 * Supabase needs to process the code/token in the URL before we redirect.
 * A plain <Navigate> would throw away the token — this component waits for
 * the session to be established first.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Give Supabase's onAuthStateChange a moment to exchange the code,
    // then check if we have a valid session.
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      navigate(session ? '/' : '/login', { replace: true });
    };

    // Small delay to let the auth state listener fire first
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
}
