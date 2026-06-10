import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const PAGE_META = {
  '/': { title: 'Dashboard', subtitle: 'Overview — ANW Performance Tracker' },
  '/students': { title: 'Students', subtitle: 'All sponsored students' },
  '/schools': { title: 'Partner Schools', subtitle: 'Schools with ANW-sponsored students' },
  '/results': { title: 'Exam Results', subtitle: 'End-of-term academic records' },
  '/reports': { title: 'Reports', subtitle: 'Analytics & insights' },
  '/admins': { title: 'Manage Admins', subtitle: 'Admin team management' },
  '/settings': { title: 'Settings', subtitle: 'Configuration' },
};

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: 'ANW', subtitle: '' };

  return (
    <div className="app-layout">
      <div className={`mob-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
        />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
