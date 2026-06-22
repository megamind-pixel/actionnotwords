import { Menu, Bell, Search, ChevronRight, Calendar, Layers, Moon, Sun, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Topbar({ title, onMenuClick, searchValue, onSearchChange }) {
  const { settings } = useAuth();
  
  return (
    <div className="topbar no-print">
      <div className="flex-center gap-16">
        <button className="menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        
        <div>
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

      <div className="tb-right">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search records..."
            value={searchValue || ''}
            onChange={e => onSearchChange?.(e.target.value)}
          />
        </div>

        <div className="flex-center gap-8" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 16 }}>
          <div className="flex-center gap-4 text-xs font-semibold" style={{ color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
            <Calendar size={14} />
            <span>{settings.current_year}</span>
          </div>
          <div className="flex-center gap-4 text-xs font-semibold" style={{ color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
            <Layers size={14} />
            <span>Term {settings.current_term}</span>
          </div>
        </div>

        <div className="flex-center gap-4">
          <button className="tb-action-btn" title="Toggle Theme">
            <Sun size={18} />
          </button>
          <button className="tb-action-btn" title="Notifications">
            <Bell size={18} />
          </button>
          <button className="tb-action-btn" title="Profile">
            <User size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
