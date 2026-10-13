import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type: options.type || "info",
      duration: options.duration ?? 4000,
      action: options.action,
      dismissible: options.dismissible !== false,
    };

    setToasts((prev) => [...prev, toast]);

    if (toast.duration > 0) {
      setTimeout(() => removeToast(id), toast.duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((message, options) => addToast(message, { ...options, type: "success" }), [addToast]);
  const error = useCallback((message, options) => addToast(message, { ...options, type: "error" }), [addToast]);
  const info = useCallback((message, options) => addToast(message, { ...options, type: "info" }), [addToast]);
  const loading = useCallback((message, options) => addToast(message, { ...options, type: "loading", duration: 0 }), [addToast]);

  const dismiss = useCallback((id) => removeToast(id), [removeToast]);

  const dismissAll = useCallback(() => setToasts([]), []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, success, error, info, loading, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
    loading: <Loader2 size={20} className="toast-spinner" />,
  };

  const iconColors = {
    success: "var(--success-color, #217a35)",
    error: "var(--error-color, #b1451e)",
    info: "var(--burnt)",
    loading: "var(--burnt)",
  };

  return (
    <div
      className={`toast toast-${toast.type}`}
      style={{ "--toast-icon-color": iconColors[toast.type] }}
      role="alert"
      aria-live="assertive"
    >
      <span className="toast-icon" aria-hidden="true">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      {toast.action && (
        <button className="toast-action" onClick={toast.action.onClick}>
          {toast.action.label}
        </button>
      )}
      {toast.dismissible && (
        <button className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
          <X size={16} />
        </button>
      )}
      {toast.duration > 0 && <div className="toast-progress" style={{ "--duration": `${toast.duration}ms` }} />}
    </div>
  );
}