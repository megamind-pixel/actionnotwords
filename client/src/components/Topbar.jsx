import { Menu, Bell, Search, ChevronRight, Calendar, Layers, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Topbar({ title, onMenuClick, searchValue, onSearchChange }) {
  const { settings, signOut, user } = useAuth();
  
  return (
    <div className="topbar no-print">
      {/* Left side: hamburger + page title */}
      <div className="flex-center gap-12">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        
        <div>
          {/* Breadcrumb – hidden on mobile via CSS */}
          <div className="breadcrumb">
            <span>ANW</span>
            <ChevronRight size={12} />
            <span>Platform</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{title}</span>
          </div>
          <div className="tb-title">
            <h1>{title}</h1>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="tb-right">
        {/* Search – hidden on small mobile via CSS */}
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search records..."
            value={searchValue || ''}
            onChange={e => onSearchChange?.(e.target.value)}
          />
        </div>

        {/* Year / Term badges – hidden on small mobile */}
        <div className="tb-meta-badges">
          <div className="tb-badge">
            <Calendar size={13} />
            <span>{settings.current_year}</span>
          </div>
          <div className="tb-badge">
            <Layers size={13} />
            <span>Term {settings.current_term}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-center gap-4">
          <button className="tb-action-btn" title="Notifications">
            <Bell size={18} />
          </button>
          <button
            className="tb-action-btn"
            title={`Sign out (${user?.email})`}
            onClick={signOut}
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
