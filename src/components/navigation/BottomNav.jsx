import { Home, ShoppingCart, Trophy } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getTabRoot } from './TabNavigator.jsx';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/store', label: 'Store', icon: ShoppingCart },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function BottomNav() {
  const location = useLocation();
  const activeTab = getTabRoot(location.pathname);

  if (!['/', '/store', '/leaderboard'].includes(activeTab)) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-3 px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = activeTab === to;
          return (
            <button
              key={to}
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('tab:navigate', {
                  detail: { to, reset: active },
                }));
              }}
              className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-center"
            >
              <Icon className="w-5 h-5" style={{ color: active ? '#c4b5fd' : 'rgba(255,255,255,0.45)' }} />
              <span className="font-orbitron text-[12px]" style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.45)' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}