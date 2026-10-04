import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import { logger } from '../utils/logger';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 for infinite/manual dismiss
  createdAt: number;
  action?: ToastAction;
  actionType?: string;
}

interface ActionFeedbackOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  actionType?: string;
  actionPayload?: any;
}

interface FeedbackContextType {
  toasts: ToastItem[];
  showSuccess: (title: string, message?: string, options?: { duration?: number; action?: ToastAction }) => string;
  showError: (title: string, error?: any, options?: { duration?: number; action?: ToastAction }) => string;
  showWarning: (title: string, message?: string, options?: { duration?: number }) => string;
  showInfo: (title: string, message?: string, options?: { duration?: number }) => string;
  showLoading: (title: string, message?: string) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  executeAction: <T>(
    actionFn: () => Promise<T>,
    options: ActionFeedbackOptions
  ) => Promise<T>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, options?: { duration?: number; action?: ToastAction; actionType?: string }): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const duration = options?.duration !== undefined ? options.duration : type === 'loading' ? 0 : type === 'error' ? 6000 : 4000;

      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
        createdAt: Date.now(),
        action: options?.action,
        actionType: options?.actionType,
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep up to 5 on screen

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string, options?: { duration?: number; action?: ToastAction }) => {
      logger.info(title, { message });
      return addToast('success', title, message, options);
    },
    [addToast]
  );

  const showError = useCallback(
    (title: string, error?: any, options?: { duration?: number; action?: ToastAction }) => {
      let msg = '';
      if (typeof error === 'string') msg = error;
      else if (error instanceof Error) msg = error.message;
      else if (error?.message) msg = String(error.message);
      else if (error) msg = JSON.stringify(error);

      logger.error(title, error, { message: msg });
      return addToast('error', title, msg || 'An unexpected error occurred.', options);
    },
    [addToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string, options?: { duration?: number }) => {
      logger.warn(title, { message });
      return addToast('warning', title, message, options);
    },
    [addToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string, options?: { duration?: number }) => {
      logger.info(title, { message });
      return addToast('info', title, message, options);
    },
    [addToast]
  );

  const showLoading = useCallback(
    (title: string, message?: string) => {
      return addToast('loading', title, message, { duration: 0 });
    },
    [addToast]
  );

  // Wraps an asynchronous action with automatic loading state, success toast, and meaningful error reporting
  const executeAction = useCallback(
    async <T,>(actionFn: () => Promise<T>, options: ActionFeedbackOptions): Promise<T> => {
      const actionName = options.actionType || 'EXECUTE_ACTION';
      const loadingId = options.loadingMessage
        ? addToast('loading', 'Processing Action...', options.loadingMessage, { duration: 0 })
        : null;

      try {
        logger.info(`START_${actionName}`, options.actionPayload);
        const result = await actionFn();
        if (loadingId) dismissToast(loadingId);

        const successText = options.successMessage || 'Operation completed successfully.';
        showSuccess('Action Succeeded', successText, { duration: 4000 });
        logger.info(`SUCCESS_${actionName}`, { result });
        return result;
      } catch (err: any) {
        if (loadingId) dismissToast(loadingId);

        const errorMsg =
          err?.message ||
          options.errorMessage ||
          'Failed to execute action. Please verify inputs and network connection.';

        showError('Action Failed', errorMsg, { duration: 6000 });
        logger.error(`FAIL_${actionName}`, err, { payload: options.actionPayload });
        throw err;
      }
    },
    [addToast, dismissToast, showSuccess, showError]
  );

  return (
    <FeedbackContext.Provider
      value={{
        toasts,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showLoading,
        dismissToast,
        clearAllToasts,
        executeAction,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// Toast notification rendering container
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto transform transition-all duration-300 ease-out translate-y-0 opacity-100 rounded-xl shadow-xl border p-4 backdrop-blur-md flex items-start gap-3.5 ${
              toast.type === 'success'
                ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/40 text-slate-850 dark:text-white'
                : toast.type === 'error'
                ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/50 text-slate-850 dark:text-white'
                : toast.type === 'warning'
                ? 'bg-white/95 dark:bg-slate-900/95 border-amber-500/40 text-slate-850 dark:text-white'
                : toast.type === 'loading'
                ? 'bg-white/95 dark:bg-slate-900/95 border-indigo-500/40 text-slate-850 dark:text-white'
                : 'bg-white/95 dark:bg-slate-900/95 border-blue-500/40 text-slate-850 dark:text-white'
            }`}
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center ring-4 ring-emerald-50 dark:ring-emerald-950/30">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center ring-4 ring-rose-50 dark:ring-rose-950/30">
                  <AlertCircle className="h-5 w-5" />
                </div>
              )}
              {toast.type === 'warning' && (
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center ring-4 ring-amber-50 dark:ring-amber-950/30">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              )}
              {toast.type === 'loading' && (
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 flex items-center justify-center ring-4 ring-indigo-50 dark:ring-indigo-950/30">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center ring-4 ring-blue-50 dark:ring-blue-950/30">
                  <Info className="h-5 w-5" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {toast.title}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                  {new Date(toast.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {toast.message && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                  {toast.message}
                </p>
              )}

              {/* Action Button if specified */}
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    onDismiss(toast.id);
                  }}
                  className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {toast.action.label}
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
