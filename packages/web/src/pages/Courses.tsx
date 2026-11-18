import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, Pencil, GraduationCap, ListTodo } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { Button, Card, EmptyState, Field, Input, Modal, Select, Textarea } from '../components/ui';
import type { Course } from '../types';

const colors = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#6366F1'];

const emptyForm = { code: '', title: '', instructor: '', color: '#8B5CF6', credits: '3', term: 'Fall 2026' };

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => api.get<{ data: Course[] }>('/courses').then((r) => setCourses(r.data.data));
  useEffect(() => {
    load().catch((e) => toast(errorMessage(e), 'error'));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      code: course.code,
      title: course.title,
      instructor: course.instructor || '',
      color: course.color,
      credits: String(course.credits ?? 3),
      term: course.term || '',
    });
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      credits: form.credits ? Number(form.credits) : undefined,
    };
    try {
      if (editing) {
        await api.patch(`/courses/${editing.id}`, payload);
        toast('Course updated');
      } else {
        await api.post('/courses', payload);
        toast('Course created');
      }
      setOpen(false);
      await load();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (course: Course) => {
    if (!window.confirm(`Delete ${course.code} — ${course.title}? Its tasks and exams will remain.`)) return;
    try {
      await api.delete(`/courses/${course.id}`);
      toast('Course deleted');
      await load();
    } catch (error) {
      toast(errorMessage(error), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink-900">{courses.length} courses this term</h2>
          <p className="text-xs text-ink-500">Keep your subjects organized and color-coded.</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add course</Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Add your first course to start organizing assignments and exams."
          action={<Button onClick={openCreate}><Plus size={16} /> Add course</Button>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="group overflow-hidden transition-transform hover:-translate-y-1">
              <div className="h-1.5 w-full" style={{ background: course.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <span
                    className="rounded-lg px-2.5 py-1 text-[11px] font-extrabold"
                    style={{ background: `${course.color}1a`, color: course.color }}
                  >
                    {course.code}
                  </span>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => openEdit(course)} className="rounded-lg p-2 text-ink-500 hover:bg-lavender-50 hover:text-lavender-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(course)} className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3 className="mt-4 text-base font-extrabold text-ink-900">{course.title}</h3>
                <p className="mt-1 text-xs text-ink-500">{course.instructor || 'Instructor not set'}</p>
                <div className="mt-5 flex items-center gap-4 border-t border-purple-50 pt-4 text-[11px] font-semibold text-ink-500">
                  <span className="flex items-center gap-1.5"><ListTodo size={14} /> {course._count?.tasks ?? 0} tasks</span>
                  <span className="flex items-center gap-1.5"><GraduationCap size={14} /> {course._count?.exams ?? 0} exams</span>
                  <span className="ml-auto">{course.credits ?? '—'} cr</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit course' : 'New course'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Course code">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CS 301" required />
            </Field>
            <Field label="Credits">
              <Input type="number" min="0" max="30" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
            </Field>
          </div>
          <Field label="Course title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Data Structures" required />
          </Field>
          <Field label="Instructor">
            <Input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} placeholder="Dr. Rivera" />
          </Field>
          <Field label="Term">
            <Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="Fall 2026" />
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`h-8 w-8 rounded-full border-2 transition ${form.color === color ? 'scale-110 border-ink-900' : 'border-transparent'}`}
                  style={{ background: color }}
                  aria-label={`Choose ${color}`}
                />
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create course'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
