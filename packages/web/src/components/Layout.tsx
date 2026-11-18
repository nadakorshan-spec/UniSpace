import { ReactNode, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/exams', label: 'Exams', icon: GraduationCap },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/planner', label: 'AI Study Planner', icon: Sparkles },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your academic life at a glance' },
  '/courses': { title: 'Courses', subtitle: 'Organize everything you are studying' },
  '/tasks': { title: 'Tasks & Assignments', subtitle: 'Stay on top of every deadline' },
  '/exams': { title: 'Exams', subtitle: 'Plan ahead for every test' },
  '/calendar': { title: 'Academic Calendar', subtitle: 'Your schedule, all in one place' },
  '/planner': { title: 'AI Study Planner', subtitle: 'Let AI build your revision timetable' },
};

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const meta = pageTitles[location.pathname] || { title: 'UniSpace', subtitle: 'Student life workspace' };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-purple-500/25">
          <Sparkles size={22} />
        </div>
        <div>
          <div className="text-lg font-extrabold tracking-tight text-ink-900">UniSpace</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lavender-500">Student workspace</div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'gradient-primary text-white shadow-lg shadow-purple-500/20'
                    : 'text-ink-500 hover:bg-lavender-50 hover:text-lavender-700'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 rounded-2xl gradient-soft p-4">
        <p className="text-xs font-bold text-lavender-700">Study smarter ✨</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
          Generate a personalized revision plan from your tasks and exams.
        </p>
        <NavLink
          to="/planner"
          onClick={() => setSidebarOpen(false)}
          className="mt-3 inline-block text-xs font-bold text-lavender-600 hover:underline"
        >
          Try the AI planner →
        </NavLink>
      </div>

      <div className="flex items-center gap-3 border-t border-purple-100 px-5 py-4">
        <Avatar name={user?.name || 'Student'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink-900">{user?.name}</p>
          <p className="truncate text-[11px] text-ink-500">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
          title="Log out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] border-r border-purple-100 bg-white/95 backdrop-blur lg:block">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl">{sidebar}</aside>
          <button
            className="absolute right-4 top-4 rounded-xl bg-white p-2 shadow-lg"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="lg:pl-[268px]">
        <header className="glass sticky top-0 z-30 border-b border-purple-100/70 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              className="rounded-xl border border-purple-100 bg-white p-2 text-lavender-600 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">{meta.title}</h1>
              <p className="hidden text-xs text-ink-500 sm:block">{meta.subtitle}</p>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs font-semibold text-ink-500 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              All systems ready
            </div>
            <span className="lg:hidden"><Avatar name={user?.name || 'Student'} size="sm" /></span>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
