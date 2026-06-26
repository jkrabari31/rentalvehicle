import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, FileText, CheckCircle, BarChart3, Settings, Moon, Sun, Wrench } from 'lucide-react';
import { useAppStore } from '../store';
import { useEffect } from 'react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Vehicles', path: '/vehicles', icon: Car },
  { name: 'Active Rentals', path: '/rentals', icon: FileText },
  { name: 'Completed', path: '/completed', icon: CheckCircle },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <aside className="w-64 border-r border-slate-800/50 bg-slate-950 text-slate-300 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800/50 flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-0.5 overflow-hidden shrink-0 shadow-sm">
            <img src="/logo.png" alt="SB Group Logo" className="w-full h-full object-contain rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-red-500 font-bold text-lg">SB</span>'; }} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent truncate tracking-tight">
            SB Bike Rental
          </h1>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-white ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md' 
                    : 'hover:bg-slate-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800/50">
          <button 
            onClick={toggleTheme}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-white font-bold hover:bg-slate-900 transition-all duration-200"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-transparent">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
