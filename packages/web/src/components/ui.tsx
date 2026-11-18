import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import type { Task } from '../types';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-purple-100/80 bg-white card-shadow ${className}`}>
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender-400 focus-visible:ring-offset-2';
  const sizes = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  const variants = {
    primary: 'gradient-primary text-white shadow-lg shadow-purple-500/20 hover:brightness-110 hover:shadow-purple-500/30 active:scale-[0.98]',
    secondary: 'bg-lavender-50 text-lavender-700 border border-lavender-200 hover:bg-lavender-100',
    ghost: 'text-ink-500 hover:bg-lavender-50 hover:text-lavender-700',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100',
  };
  return (
    <button className={`${base} ${sizes} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-purple-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className || ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-[90px] resize-y ${props.className || ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className || ''}`} />;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/35 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`animate-fade-up max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-500 transition hover:bg-lavender-50 hover:text-lavender-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const priorityStyles: Record<Task['priority'], string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-sky-50 text-sky-700',
  HIGH: 'bg-amber-50 text-amber-700',
  URGENT: 'bg-rose-50 text-rose-600',
};

export function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${priorityStyles[priority]}`}>
      {priority}
    </span>
  );
}

const statusStyles: Record<Task['status'], string> = {
  TODO: 'bg-lavender-50 text-lavender-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
};

export function StatusBadge({ status }: { status: Task['status'] }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-lavender-50/50 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lavender-500 shadow-sm">
        <span className="text-xl">✦</span>
      </div>
      <h3 className="font-bold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-lavender-500 to-indigo-500 font-bold text-white ${size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'}`}
    >
      {initials}
    </div>
  );
}
