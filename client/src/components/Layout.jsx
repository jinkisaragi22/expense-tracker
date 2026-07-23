import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const nav = [
  { to: '/', label: 'Dashboard', icon: '◧' },
  { to: '/transactions', label: 'Transactions', icon: '⇄' },
  { to: '/categories', label: 'Categories', icon: '⬡' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0 bg-ink text-surface flex md:flex-col items-center md:items-stretch justify-between px-4 py-3 md:px-5 md:py-8">
        <div className="flex md:block items-center gap-6">
          <div className="font-display font-bold text-xl tracking-tight md:mb-10">
            cash<span className="text-brand">trail</span><span className="text-brand">.</span>
          </div>
          <nav className="flex md:flex-col gap-1">
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
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="md:border-t md:border-white/15 md:pt-4 flex md:flex-col items-center md:items-start gap-2">
          <div className="hidden md:block text-sm text-surface/80 truncate">{user?.name}</div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-surface/60 hover:text-white cursor-pointer"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 px-5 py-6 md:px-10 md:py-10 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
