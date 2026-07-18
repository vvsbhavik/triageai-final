import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-5 right-5 z-200 flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0"
      aria-live="assertive"
      id="toast-container"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
  key?: React.Key;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-emerald-50 border-emerald-100 text-emerald-900";
      case "error":
        return "bg-red-50 border-red-100 text-red-900";
      case "info":
        return "bg-blue-50 border-blue-100 text-blue-900";
    }
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg glass-panel transition-all duration-300 animate-slide-in-right ${getBgColor()}`}
    >
      {getIcon()}
      <p className="text-xs font-semibold leading-relaxed flex-grow">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors focus:ring-2 focus:ring-slate-200 focus:outline-hidden"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
