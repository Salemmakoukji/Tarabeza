import { useState, useCallback } from 'react';
import { X, AlertCircle, Check, Eye } from 'lucide-react';

export function useToast(duration = 5000) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, text) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, text }]);
    if (type !== 'saving') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, [duration]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

const toastStyles = {
  error: { borderColor: '#f97316', icon: AlertCircle, iconClass: 'text-orange-500', label: 'Error' },
  success: { borderColor: '#10b981', icon: Check, iconClass: 'text-emerald-500', label: 'Success' },
  saving: { borderColor: '#f97316', icon: Eye, iconClass: 'text-orange-400', label: 'Saving' },
};

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts?.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const style = toastStyles[t.type] || toastStyles.success;
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start justify-between p-4 rounded-xl border border-slate-800 bg-[#111A2E] shadow-2xl transition-all duration-300 animate-slide-up text-slate-200"
            style={{ borderLeftWidth: '5px', borderLeftColor: style.borderColor }}
          >
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${style.iconClass} ${t.type === 'saving' ? 'animate-spin' : ''}`} />
              <div>
                <p className="font-semibold text-xs text-slate-400 uppercase tracking-wider">{style.label}</p>
                <p className="text-sm text-slate-200 mt-0.5">{t.text}</p>
              </div>
            </div>
            {t.type !== 'saving' && (
              <button onClick={() => onRemove(t.id)} className="text-slate-500 hover:text-slate-300 transition-colors ml-3" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
