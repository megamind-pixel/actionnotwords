import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PAGE_META = {
  '/': { title: 'Dashboard' },
  '/students': { title: 'Student Directory' },
  '/schools': { title: 'Partner Schools' },
  '/results': { title: 'Academic Performance' },
  '/reports': { title: 'Insights & Analytics' },
  '/admins': { title: 'Team Management' },
  '/settings': { title: 'Platform Settings' },
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: 'ANW Platform' };
  const { signOut } = useAuth();

  // Sync collapsed state with local storage or initial preference
  useEffect(() => {
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    setCollapsed(isCollapsed);
  }, []);

  // Inactivity Timeout
  useEffect(() => {
    let timeout;
    const INACTIVITY_TIME = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        toast.error('You have been signed out due to inactivity.');
        signOut();
      }, INACTIVITY_TIME);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [signOut]);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', newState);
  };

  return (
    <div className="app-layout">
      <Sidebar 
        collapsed={collapsed} 
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`main ${collapsed ? 'expanded' : ''}`}>
        <Topbar
          title={meta.title}
          onMenuClick={() => setMobileOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
