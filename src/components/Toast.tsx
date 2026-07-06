import React, { createContext, useCallback, useContext, useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, XCircle, X } from 'lucide-react';

type Toast = { id: number; type: 'success' | 'error'; message: string };

const ToastContext = createContext<{
  success: (msg: string) => void;
  error: (msg: string) => void;
}>({ success: () => {}, error: () => {} });

export const useToast = () => useContext(ToastContext);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: Toast['type'], message: string) => {
    const id = nextId++;
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const ctx = {
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={clsx(
              'flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium bg-white',
              t.type === 'success' ? 'border-emerald-200 text-emerald-800' : 'border-red-200 text-red-800'
            )}
          >
            {t.type === 'success'
              ? <CheckCircle2 size={16} className="text-emerald-500" />
              : <XCircle size={16} className="text-red-500" />}
            {t.message}
            <button onClick={() => setToasts(list => list.filter(x => x.id !== t.id))} className="ml-2 text-gray-300 hover:text-gray-500">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
