import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface UIFeedbackContextType {
  showToast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
}

const UIFeedbackContext = createContext<UIFeedbackContextType | undefined>(undefined);

export const useUIFeedback = () => {
  const context = useContext(UIFeedbackContext);
  if (!context) {
    throw new Error('useUIFeedback debe usarse dentro de UIFeedbackProvider');
  }
  return context;
};

export const UIFeedbackProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmResolver, setConfirmResolver] = useState<((value: boolean) => void) | null>(null);
  const confirmPrimaryButtonRef = useRef<HTMLButtonElement | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const closeConfirm = useCallback((result: boolean) => {
    if (confirmResolver) {
      confirmResolver(result);
    }
    setConfirmResolver(null);
    setConfirmState(null);
  }, [confirmResolver]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmResolver(() => resolve);
      setConfirmState({
        isOpen: true,
        ...options,
      });
    });
  }, []);

  const value = useMemo(() => ({ showToast, confirm }), [showToast, confirm]);

  useEffect(() => {
    if (!confirmState?.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeConfirm(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    confirmPrimaryButtonRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmState?.isOpen, closeConfirm]);

  return (
    <UIFeedbackContext.Provider value={value}>
      {children}

      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertTriangle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Cerrar notificación"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {confirmState?.isOpen && (
        <div
          className="confirm-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeConfirm(false);
            }
          }}
        >
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
            <h3 id="confirm-dialog-title">{confirmState.title || 'Confirmar acción'}</h3>
            <p>{confirmState.message}</p>
            <div className="confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => closeConfirm(false)}>
                {confirmState.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                ref={confirmPrimaryButtonRef}
                className={confirmState.danger ? 'btn-danger' : 'btn-primary'}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIFeedbackContext.Provider>
  );
};
