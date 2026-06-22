import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Schools from './pages/Schools';
import Results from './pages/Results';
import Reports from './pages/Reports';
import Admins from './pages/Admins';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { user, loading, unauthorized, signOut } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div className="spinner"/></div>;
  
  if (user && unauthorized) {
    return (
      <div className="flex-center" style={{minHeight:'100vh', flexDirection:'column', gap: 20, padding: 20, textAlign: 'center'}}>
        <div className="card" style={{maxWidth: 400}}>
          <h2 className="mb-16">Access Restricted</h2>
          <p className="text-muted mb-24">Your account ({user.email}) is not yet linked to an active admin record. Please contact your Super Admin to activate your access.</p>
          <button className="btn btn-primary w-full" onClick={signOut}>Sign Out</button>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<Navigate to="/" replace />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="schools" element={<Schools />} />
        <Route path="results" element={<Results />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admins" element={<Admins />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="bottom-right" toastOptions={{
            style: { borderRadius: 10, fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 500 },
            success: { style: { background: '#0f7940', color: '#fff' } },
            error: { style: { background: '#C0292A', color: '#fff' } },
          }} />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
