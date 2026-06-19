import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const TAB_ROOTS = {
  '/': '/',
  '/store': '/store',
  '/leaderboard': '/leaderboard',
};

export function getTabRoot(pathname) {
  if (pathname.startsWith('/store')) return '/store';
  if (pathname.startsWith('/leaderboard')) return '/leaderboard';
  return '/';
}

export default function TabNavigator() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleTabNavigate = (event) => {
      const { to, reset } = event.detail || {};
      if (!to) return;

      const currentTab = getTabRoot(location.pathname);
      if (reset || currentTab === to) {
        navigate(TAB_ROOTS[to], { replace: true });
        return;
      }

      sessionStorage.setItem(`tab-history:${currentTab}`, `${location.pathname}${location.search}`);
      const targetPath = sessionStorage.getItem(`tab-history:${to}`) || TAB_ROOTS[to];
      navigate(targetPath);
    };

    window.addEventListener('tab:navigate', handleTabNavigate);
    return () => window.removeEventListener('tab:navigate', handleTabNavigate);
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const tabRoot = getTabRoot(location.pathname);
    sessionStorage.setItem(`tab-history:${tabRoot}`, `${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}