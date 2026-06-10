import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, School, BookOpen, BarChart3, UserPlus, Settings } from 'lucide-react';
import { ANWLogoSVG } from './ANWLogo';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ open, onClose }) {
  const { user, settings, signOut } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'AD';

  const links = [
    { section: 'Overview' },
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/schools', label: 'Schools', icon: School },
    { section: 'Academics' },
    { to: '/results', label: 'Exam Results', icon: BookOpen },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { section: 'Admin' },
    { to: '/admins', label: 'Manage Admins', icon: UserPlus },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sb-logo">
        {settings.logo_url ? (
          <img src={settings.logo_url} alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        ) : (
          <ANWLogoSVG size={40} />
        )}
        <div className="sb-logo-text">
          <strong style={{ textTransform: 'uppercase' }}>{settings.org_name}</strong>
          <small>Performance Tracker</small>
        </div>
      </div>

      <nav className="sb-nav">
        {links.map((item, i) =>
          item.section ? (
            <div key={i} className="sb-section">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={16} strokeWidth={1.8} />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="sb-footer">
        <button className="sb-user" onClick={signOut}>
          <div className="sb-avatar">{initials}</div>
          <div>
            <span className="sb-uname">{user?.email?.split('@')[0] || 'Admin'}</span>
            <span className="sb-urole">Click to sign out</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
