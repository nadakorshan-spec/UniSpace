import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { Button, Card, EmptyState, Field, Input, Modal, PriorityBadge, Select, StatusBadge, Textarea } from '../components/ui';
import type { Course, Task } from '../types';

const emptyForm = {
  title: '',
  description: '',
  type: 'ASSIGNMENT',
  priority: 'MEDIUM',
  status: 'TODO',
  courseId: '',
  dueAt: '',
};

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function dueLabel(value?: string | null) {
  if (!value) return { text: 'No deadline', urgent: false };
  const date = new Date(value);
  const diff = date.getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  if (diff < 0) return { text: `Overdue · ${formatted}`, urgent: true };
  if (days <= 1) return { text: `Due soon · ${formatted}`, urgent: true };
  return { text: formatted, urgent: false };
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () =>
    Promise.all([
      api.get<{ data: Task[] }>('/tasks'),
      api.get<{ data: Course[] }>('/courses'),
    ]).then(([taskResponse, courseResponse]) => {
      setTasks(taskResponse.data.data);
      setCourses(courseResponse.data.data);
    });

  useEffect(() => {
    load().catch((e) => toast(errorMessage(e), 'error'));
  }, []);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!statusFilter || task.status === statusFilter) &&
          (!priorityFilter || task.priority === priorityFilter) &&
          (!search || task.title.toLowerCase().includes(search.toLowerCase())),
      ),
    [tasks, statusFilter, priorityFilter, search],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      status: task.status,
      courseId: task.courseId || '',
      dueAt: toLocalInput(task.dueAt),
    });
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      priority: form.priority,
      status: form.status,
      courseId: form.courseId || undefined,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
    };
    try {
      if (editing) await api.patch(`/tasks/${editing.id}`, payload);
      else await api.post('/tasks', payload);
      toast(editing ? 'Task updated' : 'Task created');
      setOpen(false);
      await load();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      await api.patch(`/tasks/${task.id}`, {
        status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
      });
      await load();
    } catch (error) {
      toast(errorMessage(error), 'error');
    }
  };

  const remove = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      toast('Task deleted');
      await load();
    } catch (error) {
      toast(errorMessage(error), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink-900">
            {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
          </h2>
          <p className="text-xs text-ink-500">Prioritize what matters and meet every deadline.</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> New task</Button>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto min-w-[150px]">
          <option value="">All statuses</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </Select>
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-auto min-w-[140px]">
          <option value="">All priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Create a task or assignment to see it in this list."
          action={<Button onClick={openCreate}><Plus size={16} /> New task</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const due = dueLabel(task.dueAt);
            const done = task.status === 'COMPLETED';
            return (
              <Card key={task.id} className={`group flex flex-wrap items-center gap-3 p-4 transition ${done ? 'opacity-70' : ''}`}>
                <button
                  onClick={() => toggleComplete(task)}
                  className={`shrink-0 rounded-full transition ${done ? 'text-emerald-500' : 'text-slate-300 hover:text-lavender-500'}`}
                  aria-label="Toggle complete"
                >
                  {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
                <div className="min-w-[180px] flex-1">
                  <p className={`text-sm font-bold text-ink-900 ${done ? 'line-through' : ''}`}>{task.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                    <span className="rounded-md bg-lavender-50 px-2 py-0.5 font-bold text-lavender-600">
                      {task.course?.code || 'Personal'}
                    </span>
                    <span className="rounded-md bg-slate-50 px-2 py-0.5 font-semibold">{task.type}</span>
                    <span className={`flex items-center gap-1 ${due.urgent && !done ? 'font-bold text-rose-500' : ''}`}>
                      <Clock size={12} /> {due.text}
                    </span>
                  </div>
                </div>
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openEdit(task)} className="rounded-lg p-2 text-ink-500 hover:bg-lavender-50 hover:text-lavender-600">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(task)} className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit task' : 'New task'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Submit assignment draft" required />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add a few details…" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="TASK">Task</option>
              </Select>
            </Field>
            <Field label="Course">
              <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.code} — {course.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </Field>
          </div>
          <Field label="Deadline">
            <Input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
