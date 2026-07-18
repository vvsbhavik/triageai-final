import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  type?: "button" | "submit" | "reset";
  onClick?: (event: any) => void;
}

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus:ring-blue-500/30",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/40 focus:ring-slate-500/20",
    danger:
      "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/30 focus:ring-red-500/20",
    ghost:
      "text-slate-600 hover:bg-slate-50 border border-transparent focus:ring-slate-500/10",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span
          className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
