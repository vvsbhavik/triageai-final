import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "critical" | "high" | "medium" | "low" | "neutral" | "success";
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const styles = {
    critical: "bg-red-50 text-red-700 border-red-100",
    high: "bg-orange-50 text-orange-700 border-orange-100",
    medium: "bg-amber-50 text-amber-700 border-amber-100",
    low: "bg-emerald-50 text-emerald-700 border-emerald-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    neutral: "bg-slate-50 text-slate-700 border-slate-200/60",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1 ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
