import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  ListTodo,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Card, EmptyState, PriorityBadge, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats } from '../types';

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'No date';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ data: DashboardStats }>('/dashboard/stats')
      .then((response) => setStats(response.data.data))
      .catch((err) => setError(err.message || 'Could not load dashboard'));
  }, []);

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/70" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Active courses', value: stats.totalCourses, icon: BookOpen, tint: 'from-violet-500 to-purple-600', link: '/courses' },
    { label: 'Pending tasks', value: stats.pendingTasks, icon: ListTodo, tint: 'from-blue-500 to-indigo-600', link: '/tasks' },
    { label: 'Upcoming exams', value: stats.upcomingExamsCount, icon: GraduationCap, tint: 'from-fuchsia-500 to-pink-600', link: '/exams' },
    { label: 'Deadlines this week', value: stats.deadlinesThisWeek, icon: CalendarClock, tint: 'from-amber-500 to-orange-600', link: '/calendar' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-col gap-4 rounded-3xl gradient-primary p-6 text-white shadow-xl shadow-purple-500/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">{greeting}, {user?.name?.split(' ')[0]} 👋</h2>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              You have <strong>{stats.pendingTasks} tasks</strong> in progress and{' '}
              <strong>{stats.upcomingExamsCount} exams</strong> coming up. Keep the momentum going!
            </p>
          </div>
          <Link
            to="/planner"
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
          >
            <Sparkles size={17} /> Generate study plan
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.link} className="group">
              <Card className="relative overflow-hidden p-5 transition-transform group-hover:-translate-y-1">
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${card.tint} opacity-10`} />
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.tint} text-white shadow-md`}>
                    <Icon size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-lavender-500" />
                </div>
                <p className="mt-5 text-3xl font-extrabold text-ink-900">{card.value}</p>
                <p className="mt-1 text-xs font-semibold text-ink-500">{card.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink-900">Weekly activity</h3>
              <p className="text-xs text-ink-500">Tasks and exams due each day</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
              <TrendingUp size={14} /> {stats.completionRate}% complete
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyActivity} margin={{ top: 5, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede9fe" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b678f', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#6b678f', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f5f3ff' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #ede9fe', fontSize: 12 }}
                />
                <Bar dataKey="tasks" name="Tasks" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="exams" name="Exams" fill="#93C5FD" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-ink-900">Progress overview</h3>
          <p className="text-xs text-ink-500">How your work is distributed</p>
          <div className="mt-6 flex items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(#8B5CF6 ${stats.completionRate * 3.6}deg, #ede9fe 0deg)` }}>
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-extrabold text-ink-900">{stats.completionRate}%</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">completed</span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2.5">
            {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => (
              <div key={priority} className="flex items-center justify-between text-xs">
                <PriorityBadge priority={priority} />
                <span className="font-bold text-ink-900">{stats.priorityCounts[priority]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-900">Upcoming deadlines</h3>
            <Link to="/tasks" className="text-xs font-bold text-lavender-600 hover:underline">View all →</Link>
          </div>
          {stats.upcomingTasks.length === 0 ? (
            <EmptyState title="All caught up" description="No upcoming deadlines. Enjoy the calm!" />
          ) : (
            <div className="space-y-3">
              {stats.upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-xl border border-purple-50 bg-lavender-50/40 p-3">
                  <span className="h-9 w-1.5 rounded-full" style={{ background: task.course?.color || '#8B5CF6' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{task.title}</p>
                    <p className="text-[11px] text-ink-500">{task.course?.code || 'Personal'} · {formatDate(task.dueAt)}</p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-900">Next exams</h3>
            <Link to="/exams" className="text-xs font-bold text-lavender-600 hover:underline">View all →</Link>
          </div>
          {stats.upcomingExams.length === 0 ? (
            <EmptyState title="No exams scheduled" description="Add an exam to see it here." />
          ) : (
            <div className="space-y-3">
              {stats.upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center gap-3 rounded-xl border border-blue-50 bg-blue-50/40 p-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <span className="text-sm font-extrabold leading-none">{new Date(exam.startsAt).getDate()}</span>
                    <span className="text-[9px] font-bold uppercase">{new Date(exam.startsAt).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{exam.title}</p>
                    <p className="text-[11px] text-ink-500">{exam.course?.code || 'General'} · {formatDate(exam.startsAt)}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-blue-600">{exam.examType}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-ink-900">Your courses</h3>
          <Link to="/courses" className="text-xs font-bold text-lavender-600 hover:underline">Manage courses →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.courses.map((course) => (
            <div key={course.id} className="rounded-2xl border border-purple-50 p-4" style={{ borderTop: `3px solid ${course.color}` }}>
              <p className="text-xs font-bold text-lavender-600">{course.code}</p>
              <p className="mt-1 truncate text-sm font-bold text-ink-900">{course.title}</p>
              <p className="mt-2 text-[11px] text-ink-500">{course.term || 'Current term'}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-center gap-2 pb-2 text-[11px] font-medium text-ink-500">
        <CheckCircle2 size={14} className="text-emerald-500" /> All data is private to your account ·{' '}
        <StatusBadge status="TODO" /> tasks shown across views
      </div>
    </div>
  );
}
