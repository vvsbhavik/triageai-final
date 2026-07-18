import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  id?: string;
  className?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value?: string | number;
  onChange?: (event: any) => void;
  min?: string | number;
  max?: string | number;
  disabled?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const defaultId = useId();
  const inputId = id || defaultId;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-slate-400 uppercase tracking-wider block"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full ${
            leftIcon ? "pl-10" : "px-4"
          } pr-4 py-2.5 bg-slate-50 border ${
            error ? "border-red-300" : "border-slate-200"
          } rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder-slate-400 ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  id?: string;
  className?: string;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  value?: string | number;
  onChange?: (event: any) => void;
  disabled?: boolean;
}

export function TextArea({
  label,
  error,
  className = "",
  id,
  ...props
}: TextAreaProps) {
  const defaultId = useId();
  const textareaId = id || defaultId;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-bold text-slate-400 uppercase tracking-wider block"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-4 py-2.5 bg-slate-50 border ${
          error ? "border-red-300" : "border-slate-200"
        } rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder-slate-400 resize-none ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="text-xs text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
