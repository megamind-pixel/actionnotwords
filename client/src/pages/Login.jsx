import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AfricaMapSVG } from '../components/ANWLogo';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestName, setRequestName] = useState('');
  const { signInWithEmail, signInWithGoogle, user, settings } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/'); }, [user]);

  // Animated particles
  useEffect(() => {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div');
      p.className = 'login-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--pdx', (Math.random() - 0.5) * 100 + 'px');
      p.style.animationDuration = (8 + Math.random() * 14) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.width = p.style.height = (1 + Math.random() * 2.5) + 'px';
      container.appendChild(p);
    }
  }, []);

  async function handleEmail(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try { await signInWithEmail(email, password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true); setError('');
    try { await signInWithGoogle(); }
    catch (err) { setError(err.message); setLoading(false); }
  }

  async function handleRequestAccess(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.requestAccess({ email, name: requestName });
      toast.success('Access request submitted! An admin will review it.');
      setIsRequesting(false);
      setEmail('');
      setRequestName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-particles" id="particles" />
      <div className="login-left">
        <div className="login-map">
          {settings?.logo_url ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeSlideUp .6s ease .3s both' }}>
              <img src={settings.logo_url} alt="Org Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <AfricaMapSVG />
          )}
        </div>
        <div className="login-brand">
          {settings?.org_name ? settings.org_name.toUpperCase() : 'ACTIONS NOT WORDS'}
        </div>
        <div className="login-tagline">Student Performance Tracker</div>
      </div>
      
      <div className="login-right">
        <div className="login-card">
        {isRequesting ? (
          <>
            <div style={{fontSize:'17px',fontWeight:700,color:'#fff',marginBottom:'3px'}}>Request Access</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,.3)',marginBottom:'20px'}}>
              Submit a request to join the team
            </div>
            {error && (
              <div style={{background:'rgba(192,41,42,.15)',border:'1px solid rgba(192,41,42,.3)',borderRadius:'8px',padding:'10px 12px',fontSize:'12.5px',color:'#ff8080',marginBottom:'14px'}}>
                {error}
              </div>
            )}
            <form onSubmit={handleRequestAccess}>
              <label className="login-input-label">Full Name</label>
              <input className="login-input" type="text" placeholder="Jane Kamau" value={requestName} onChange={e=>setRequestName(e.target.value)} required />
              <label className="login-input-label">Email</label>
              <input className="login-input" type="email" placeholder="jane@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Request Access'}
              </button>
            </form>
            <div className="login-note" style={{marginTop: 16}}>
              <button onClick={() => setIsRequesting(false)} style={{color: '#fff', textDecoration: 'underline'}}>Back to Login</button>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:'17px',fontWeight:700,color:'#fff',marginBottom:'3px'}}>Sign In</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,.3)',marginBottom:'20px'}}>
              Super Admin — email &amp; password
            </div>
            {error && (
              <div style={{background:'rgba(192,41,42,.15)',border:'1px solid rgba(192,41,42,.3)',borderRadius:'8px',padding:'10px 12px',fontSize:'12.5px',color:'#ff8080',marginBottom:'14px'}}>
                {error}
              </div>
            )}
            <form onSubmit={handleEmail}>
              <label className="login-input-label">Email</label>
              <input className="login-input" type="email" placeholder="admin@actionsnotwords.org" value={email} onChange={e=>setEmail(e.target.value)} required />
              <label className="login-input-label">Password</label>
              <input className="login-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
              <button className="login-submit" type="submit" disabled={loading}>
                <LogIn size={15} />
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            <div className="login-divider">or</div>
            <button className="google-btn" onClick={handleGoogle} disabled={loading}>
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google (Invited Admins)
            </button>
            <div className="login-note" style={{marginTop: 16}}>
              Need access? <button type="button" onClick={() => setIsRequesting(true)} style={{color: '#fff', textDecoration: 'underline'}}>Request Access</button>
            </div>
          </>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
