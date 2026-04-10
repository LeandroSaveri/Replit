import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
};

const accents: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/5',
  error: 'border-red-500/30 bg-red-500/5',
  info: 'border-blue-500/30 bg-blue-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = `toast-${++counterRef.current}`;
    const duration = opts.duration ?? 4000;
    setToasts(prev => [...prev.slice(-4), { ...opts, id, duration }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) =>
    toast({ type: 'success', title, description }), [toast]);
  const error = useCallback((title: string, description?: string) =>
    toast({ type: 'error', title, description }), [toast]);
  const info = useCallback((title: string, description?: string) =>
    toast({ type: 'info', title, description }), [toast]);
  const warning = useCallback((title: string, description?: string) =>
    toast({ type: 'warning', title, description }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className={`pointer-events-auto w-80 max-w-[calc(100vw-3rem)] flex items-start gap-3 px-4 py-3 rounded-xl border bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 ${accents[t.type]}`}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 p-0.5 text-slate-500 hover:text-slate-300 transition-colors rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToastSimple() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastSimple must be used within ToastProvider');
  return ctx;
}
