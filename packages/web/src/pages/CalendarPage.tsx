import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, GraduationCap, ListTodo } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Card, EmptyState } from '../components/ui';
import { useToast } from '../components/Toast';
import type { CalendarEvent } from '../types';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const { toast } = useToast();

  useEffect(() => {
    api
      .get<{ data: CalendarEvent[] }>('/calendar')
      .then((r) => setEvents(r.data.data))
      .catch((e) => toast(errorMessage(e), 'error'));
  }, []);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - offset);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = dayKey(new Date(event.start));
      map.set(key, [...(map.get(key) || []), event]);
    });
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(selected) || [];
  const selectedDate = grid.find((d) => dayKey(d) === selected) || new Date();

  const changeMonth = (delta: number) => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-ink-900">
                {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-xs text-ink-500">Click a date to see its schedule</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => changeMonth(-1)} className="rounded-xl border border-purple-100 bg-white p-2 text-ink-500 hover:bg-lavender-50">
                <ChevronLeft size={17} />
              </button>
              <button onClick={() => setCursor(new Date())} className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs font-bold text-lavender-600 hover:bg-lavender-50">
                Today
              </button>
              <button onClick={() => changeMonth(1)} className="rounded-xl border border-purple-100 bg-white p-2 text-ink-500 hover:bg-lavender-50">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => (
              <div key={day} className="pb-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-ink-500">
                {day}
              </div>
            ))}
            {grid.map((date) => {
              const key = dayKey(date);
              const dayEvents = eventsByDay.get(key) || [];
              const isCurrentMonth = date.getMonth() === cursor.getMonth();
              const isToday = key === dayKey(new Date());
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`flex min-h-[76px] flex-col rounded-xl border p-2 text-left transition sm:min-h-[92px] ${
                    isSelected
                      ? 'gradient-primary text-white shadow-md'
                      : isToday
                        ? 'border-lavender-300 bg-lavender-50'
                        : 'border-purple-50 bg-white hover:bg-lavender-50/60'
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-ink-900'}`}>{date.getDate()}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={`${event.kind}-${event.id}`}
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : ''}`}
                        style={!isSelected ? { background: event.color } : undefined}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className={`text-[9px] font-bold ${isSelected ? 'text-white' : 'text-ink-500'}`}>
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[11px] font-semibold text-ink-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-lavender-500" /> Task deadline</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Exam</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-lavender-500" />
            <div>
              <h3 className="font-extrabold text-ink-900">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <p className="text-[11px] text-ink-500">{selectedEvents.length} scheduled items</p>
            </div>
          </div>
          {selectedEvents.length === 0 ? (
            <EmptyState title="Free day" description="No tasks or exams scheduled for this date." />
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <div key={`${event.kind}-${event.id}`} className="rounded-xl border border-purple-50 p-3" style={{ borderLeft: `3px solid ${event.color}` }}>
                  <div className="flex items-start gap-2">
                    {event.kind === 'EXAM' ? (
                      <GraduationCap size={16} className="mt-0.5 shrink-0 text-blue-500" />
                    ) : (
                      <ListTodo size={16} className="mt-0.5 shrink-0 text-lavender-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink-900">{event.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        {event.kind} · {event.courseCode || 'Personal'}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-lavender-600">
                        <Clock size={12} /> {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      {event.location && <p className="text-[11px] text-ink-500">{event.location}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-extrabold text-ink-900">All scheduled items</h3>
        {events.length === 0 ? (
          <p className="text-sm text-ink-500">Add tasks with deadlines or exams to populate your calendar.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <button
                key={`${event.kind}-${event.id}`}
                onClick={() => {
                  setSelected(dayKey(new Date(event.start)));
                  setCursor(new Date(event.start));
                }}
                className="flex items-center gap-3 rounded-xl border border-purple-50 p-3 text-left transition hover:bg-lavender-50"
              >
                <span className="h-9 w-1 rounded-full" style={{ background: event.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-ink-900">{event.title}</span>
                  <span className="block text-[10px] text-ink-500">
                    {new Date(event.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
