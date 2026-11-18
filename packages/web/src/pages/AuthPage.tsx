import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { loginSchema, registerSchema } from '@unispace/shared';
import { BookOpen, CalendarDays, CheckSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Field, Input } from '../components/ui';
import { errorMessage } from '../api/client';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError('');
    setErrors({});

    const payload = mode === 'login' ? { email, password } : { name, email, password };
    const schema = mode === 'login' ? loginSchema : registerSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      setErrors(Object.fromEntries(Object.entries(flattened).map(([key, value]) => [key, value?.[0] || 'Invalid value'])));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden gradient-primary p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-xl font-extrabold">UniSpace</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Student life workspace</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">
            Everything about your studies, beautifully organized.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/80">
            Courses, assignments, exams and a personalized AI study plan — all in one calm, focused space.
          </p>
          <div className="mt-10 space-y-4">
            {[
              { icon: BookOpen, text: 'Track every course and deadline' },
              { icon: CheckSquare, text: 'Prioritize tasks and assignments' },
              { icon: CalendarDays, text: 'See your entire academic calendar' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm font-medium text-white/90">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <Icon size={17} />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/60">© 2026 UniSpace. Built for students who dream big.</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
              <Sparkles size={20} />
            </div>
            <span className="text-lg font-extrabold text-ink-900">UniSpace</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {mode === 'login' ? 'Sign in to continue to your workspace.' : 'Start organizing your academic life in minutes.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {mode === 'register' && (
              <div>
                <Field label="Full name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    autoComplete="name"
                  />
                </Field>
                {errors.name && <p className="mt-1 text-xs font-medium text-rose-600">{errors.name}</p>}
              </div>
            )}
            <div>
              <Field label="Email address">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  autoComplete="email"
                />
              </Field>
              {errors.email && <p className="mt-1 text-xs font-medium text-rose-600">{errors.email}</p>}
            </div>
            <div>
              <Field label="Password" hint={mode === 'register' ? 'At least 8 characters, with a letter and a number.' : undefined}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </Field>
              {errors.password && <p className="mt-1 text-xs font-medium text-rose-600">{errors.password}</p>}
            </div>

            {serverError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full py-3" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-ink-500">
            {mode === 'login' ? 'New to UniSpace?' : 'Already have an account?'}{' '}
            <a
              href={mode === 'login' ? '/register' : '/login'}
              className="font-bold text-lavender-600 hover:underline"
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </a>
          </p>

          {mode === 'login' && (
            <div className="mt-8 rounded-2xl border border-lavender-200 bg-lavender-50/70 p-4 text-xs leading-relaxed text-ink-500">
              <strong className="text-lavender-700">Demo account:</strong> demo@unispase.test / StudyHard123
              <br />Run <code className="rounded bg-white px-1 py-0.5">npm run db:seed</code> to load demo data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
