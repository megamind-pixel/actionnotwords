import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, School, BookOpen, 
  BarChart3, UserPlus, Settings, ChevronLeft, 
  ChevronRight, LogOut, User 
} from 'lucide-react';
import { ANWLogoSVG } from './ANWLogo';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
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

  const sidebarClass = `sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`;

  return (
    <>
      <div className={`mob-overlay ${mobileOpen ? 'show' : ''}`} onClick={onMobileClose} />
      <aside className={sidebarClass}>
        <div className="sb-logo">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          ) : (
            <ANWLogoSVG size={32} color="#3B82F6" />
          )}
          <div className="sb-logo-text">
            <strong>{settings.org_name}</strong>
            <small>Performance Tracker</small>
          </div>
          <button className="collapse-btn no-print" onClick={onToggle} style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)' }}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
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
                onClick={onMobileClose}
                title={collapsed ? item.label : ''}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">{initials}</div>
            <div className="sb-user-info">
              <span className="sb-uname">{user?.email?.split('@')[0] || 'Admin'}</span>
              <span className="sb-urole">Administrator</span>
            </div>
            {!collapsed && (
              <button onClick={signOut} className="logout-btn" style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)' }}>
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
