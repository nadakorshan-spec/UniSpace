import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, Clock, Loader2, Sparkles, WandSparkles } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { Button, Card, EmptyState, Field, Input, Select, Textarea } from '../components/ui';
import type { Course, StudyPlan } from '../types';

export default function StudyPlanner() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [days, setDays] = useState(7);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [focusCourseId, setFocusCourseId] = useState('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const { toast } = useToast();

  const loadPlans = () =>
    api.get<{ data: StudyPlan[] }>('/ai/study-plans').then((r) => {
      setPlans(r.data.data);
      setActivePlan((current) => current || r.data.data[0] || null);
    });

  useEffect(() => {
    api.get<{ data: Course[] }>('/courses').then((r) => setCourses(r.data.data)).catch(() => undefined);
    loadPlans().catch((e) => toast(errorMessage(e), 'error'));
  }, []);

  const generate = async (event: FormEvent) => {
    event.preventDefault();
    setGenerating(true);
    try {
      const { data } = await api.post<{ data: StudyPlan }>('/ai/study-plan', {
        days,
        hoursPerDay,
        focusCourseId: focusCourseId || undefined,
        notes,
      });
      setActivePlan(data.data);
      await loadPlans();
      toast('Your personalized study plan is ready!');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-7 text-white shadow-xl shadow-purple-500/20">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Sparkles size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Your AI Study Planner</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/80">
              Tell us how much time you have and we will build a balanced revision timetable from your tasks, priorities and upcoming exams.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-2">
            <WandSparkles size={18} className="text-lavender-500" />
            <h3 className="font-extrabold text-ink-900">Plan settings</h3>
          </div>
          <form onSubmit={generate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Days ahead">
                <Input type="number" min="1" max="14" value={days} onChange={(e) => setDays(Number(e.target.value))} />
              </Field>
              <Field label="Hours / day">
                <Input type="number" min="0.5" max="12" step="0.5" value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Focus course (optional)">
              <Select value={focusCourseId} onChange={(e) => setFocusCourseId(e.target.value)}>
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.code} — {course.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Anything else?">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I am weaker on graph algorithms and have a midterm on Friday."
              />
            </Field>
            <Button type="submit" className="w-full py-3" disabled={generating}>
              {generating ? <><Loader2 size={17} className="animate-spin" /> Building your plan…</> : <><Sparkles size={17} /> Generate study plan</>}
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-ink-500">
              Powered by OpenAI. Requires <code className="rounded bg-lavender-50 px-1">OPENAI_API_KEY</code> on the server.
            </p>
          </form>

          {plans.length > 0 && (
            <div className="mt-7 border-t border-purple-100 pt-5">
              <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-ink-500">Saved plans</h4>
              <div className="space-y-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setActivePlan(plan)}
                    className={`w-full rounded-xl border p-3 text-left text-xs transition ${
                      activePlan?.id === plan.id
                        ? 'border-lavender-300 bg-lavender-50'
                        : 'border-purple-50 hover:bg-lavender-50/60'
                    }`}
                  >
                    <span className="block font-bold text-ink-900">{plan.title}</span>
                    <span className="text-ink-500">
                      {new Date(plan.generatedAt).toLocaleString()} · {plan.sessions.length} sessions
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          {!activePlan ? (
            <EmptyState
              title="No study plan yet"
              description="Configure your available time and generate your first AI-powered revision timetable."
            />
          ) : (
            <div>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-purple-100 pb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-ink-900">{activePlan.title}</h3>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-500">{activePlan.summary}</p>
                </div>
                <span className="rounded-full bg-lavender-50 px-3 py-1.5 text-[11px] font-bold text-lavender-700">
                  {activePlan.model}
                </span>
              </div>

              <div className="space-y-3">
                {activePlan.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-purple-50 bg-lavender-50/40 p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-primary text-white">
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-[180px] flex-1">
                      <p className="text-sm font-bold text-ink-900">{session.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500">
                        <Clock size={12} />
                        {new Date(session.startsAt).toLocaleString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                        {' → '}
                        {new Date(session.endsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-lavender-600 shadow-sm">
                      {Math.round((new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime()) / 3600000 * 10) / 10}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
