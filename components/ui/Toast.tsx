import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000); // Auto dismiss after 4s
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const styles = {
    success: 'bg-lime text-black border-black',
    error: 'bg-terracotta text-cream border-black',
    info: 'bg-white text-black border-black',
  };

  const icons = {
    success: '✓',
    error: '!',
    info: 'i',
  };

  return (
    <div className={`pointer-events-auto border-2 rounded-xl p-4 shadow-cartoon flex items-start gap-4 animate-in slide-in-from-right duration-300 ${styles[toast.type]}`}>
      <div className="w-8 h-8 shrink-0 border-2 border-current rounded-full flex items-center justify-center font-bold text-xl">
        {icons[toast.type]}
      </div>
      <div className="flex-1">
        <h4 className="font-display text-xl uppercase leading-none mt-1">{toast.title}</h4>
        {toast.message && <p className="text-sm font-bold opacity-80 mt-1 leading-tight">{toast.message}</p>}
      </div>
      <button onClick={onDismiss} className="opacity-50 hover:opacity-100 font-bold text-lg">×</button>
    </div>
  );
};
