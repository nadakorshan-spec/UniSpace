import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';
interface ToastItem { id: number; message: string; type: ToastType }
interface ToastContextValue { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setItems((prev) => prev.filter((item) => item.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-xl animate-fade-up ${
              item.type === 'success' ? 'border-emerald-200' : 'border-rose-200'
            }`}
          >
            {item.type === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
            )}
            <span className="flex-1 font-medium text-ink-900">{item.message}</span>
            <button onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}>
              <X size={15} className="text-ink-500" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
