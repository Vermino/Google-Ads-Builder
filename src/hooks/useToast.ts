import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  id: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    info: (message: string) => showToast(message, 'info'),
    success: (message: string) => showToast(message, 'success'),
    warning: (message: string) => showToast(message, 'warning'),
    error: (message: string) => showToast(message, 'error'),
  };
};
