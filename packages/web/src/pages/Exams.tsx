import { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { Button, Card, EmptyState, Field, Input, Modal, Select, Textarea } from '../components/ui';
import type { Course, Exam } from '../types';

const emptyForm = { title: '', courseId: '', examType: 'MIDTERM', startsAt: '', endsAt: '', location: '', notes: '' };

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () =>
    Promise.all([
      api.get<{ data: Exam[] }>('/exams'),
      api.get<{ data: Course[] }>('/courses'),
    ]).then(([examResponse, courseResponse]) => {
      setExams(examResponse.data.data);
      setCourses(courseResponse.data.data);
    });

  useEffect(() => {
    load().catch((e) => toast(errorMessage(e), 'error'));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditing(exam);
    setForm({
      title: exam.title,
      courseId: exam.courseId || '',
      examType: exam.examType,
      startsAt: toLocalInput(exam.startsAt),
      endsAt: toLocalInput(exam.endsAt),
      location: exam.location || '',
      notes: exam.notes || '',
    });
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      courseId: form.courseId || undefined,
      examType: form.examType,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      location: form.location,
      notes: form.notes,
    };
    try {
      if (editing) await api.patch(`/exams/${editing.id}`, payload);
      else await api.post('/exams', payload);
      toast(editing ? 'Exam updated' : 'Exam added');
      setOpen(false);
      await load();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (exam: Exam) => {
    if (!window.confirm(`Delete "${exam.title}"?`)) return;
    try {
      await api.delete(`/exams/${exam.id}`);
      toast('Exam deleted');
      await load();
    } catch (error) {
      toast(errorMessage(error), 'error');
    }
  };

  const now = Date.now();
  const upcoming = exams.filter((exam) => new Date(exam.startsAt).getTime() >= now);
  const past = exams.filter((exam) => new Date(exam.startsAt).getTime() < now);

  const renderExam = (exam: Exam) => {
    const date = new Date(exam.startsAt);
    return (
      <Card key={exam.id} className="group overflow-hidden transition hover:-translate-y-0.5">
        <div className="flex">
          <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-gradient-to-b from-lavender-500 to-indigo-500 py-5 text-white">
            <span className="text-2xl font-extrabold leading-none">{date.getDate()}</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="mt-1 text-[10px] text-white/70">{date.getFullYear()}</span>
          </div>
          <div className="min-w-0 flex-1 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-600">
                  {exam.examType}
                </span>
                <h3 className="mt-2 truncate text-sm font-extrabold text-ink-900">{exam.title}</h3>
                <p className="mt-0.5 text-[11px] font-semibold text-lavender-600">
                  {exam.course?.code || 'General'}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => openEdit(exam)} className="rounded-lg p-1.5 text-ink-500 hover:bg-lavender-50 hover:text-lavender-600">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(exam)} className="rounded-lg p-1.5 text-ink-500 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-500">
              <span className="flex items-center gap-1"><Clock size={13} /> {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              {exam.location && <span className="flex items-center gap-1"><MapPin size={13} /> {exam.location}</span>}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink-900">{exams.length} exams tracked</h2>
          <p className="text-xs text-ink-500">Never be surprised by a test again.</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add exam</Button>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          title="No exams scheduled"
          description="Add your first midterm, final or quiz to see it in your calendar."
          action={<Button onClick={openCreate}><Plus size={16} /> Add exam</Button>}
        />
      ) : (
        <>
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
              <CalendarDays size={16} className="text-lavender-500" /> Upcoming ({upcoming.length})
            </h3>
            {upcoming.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{upcoming.map(renderExam)}</div>
            ) : (
              <Card className="p-5 text-sm text-ink-500">No upcoming exams. Enjoy the calm!</Card>
            )}
          </div>
          {past.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-ink-500">Past exams ({past.length})</h3>
              <div className="grid gap-4 opacity-60 md:grid-cols-2 xl:grid-cols-3">{past.map(renderExam)}</div>
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit exam' : 'Add exam'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Exam title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Data Structures Midterm" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Course">
              <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.code} — {course.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Exam type">
              <Select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
                <option value="MIDTERM">Midterm</option>
                <option value="FINAL">Final</option>
                <option value="QUIZ">Quiz</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>
            <Field label="Starts at">
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
            </Field>
            <Field label="Ends at">
              <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
            </Field>
          </div>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Science Hall 204" />
          </Field>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Topics covered, allowed materials…" />
          </Field>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add exam'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
