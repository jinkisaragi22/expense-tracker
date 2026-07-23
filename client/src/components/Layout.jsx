import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const nav = [
  { to: '/', label: 'Dashboard', icon: '◧' },
  { to: '/transactions', label: 'Transactions', icon: '⇄' },
  { to: '/categories', label: 'Categories', icon: '⬡' },
  { to: '/splits', label: 'Split bills', icon: '⋔' },
];

function Brand() {
  return (
    <div className="font-display font-bold text-xl tracking-tight">
      cash<span className="text-brand">trail</span><span className="text-brand">.</span>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0 flex-col justify-between bg-ink text-surface px-5 py-8">
        <div>
          <div className="mb-10"><Brand /></div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-brand text-white font-medium' : 'text-surface/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <span aria-hidden className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-white/15 pt-4">
          <div className="text-sm text-surface/80 truncate">{user?.name}</div>
          <button onClick={handleLogout} className="mt-1 text-xs text-surface/60 hover:text-white cursor-pointer">
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-ink text-surface px-4 py-3">
        <Brand />
        <button onClick={handleLogout} className="text-xs text-surface/70 hover:text-white cursor-pointer">
          Log out
        </button>
      </header>

      <main className="flex-1 px-4 pt-6 pb-28 md:px-10 md:py-10 max-w-6xl">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-ink text-surface"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Main navigation"
      >
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                isActive ? 'text-brand font-medium' : 'text-surface/60'
              }`
            }
          >
            <span aria-hidden className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
