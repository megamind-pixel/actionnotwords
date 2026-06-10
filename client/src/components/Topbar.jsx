import { Menu, Bell, Search } from 'lucide-react';

export function Topbar({ title, subtitle, onMenuClick, searchValue, onSearchChange }) {
  return (
    <div className="topbar">
      <div className="flex-center gap-12">
        <button className="menu-btn" onClick={onMenuClick}>
          <Menu size={19} />
        </button>
        <div className="tb-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="tb-right">
        <div className="search-bar">
          <Search size={13} />
          <input
            placeholder="Search…"
            value={searchValue || ''}
            onChange={e => onSearchChange?.(e.target.value)}
          />
        </div>
        <button className="icon-btn">
          <Bell size={16} />
        </button>
      </div>
    </div>
  );
}
