import React from "react";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

interface StatusBadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone = "neutral",
  children,
}) => (
  <span
    className={`inline-flex items-center shrink-0 px-2.5 py-1 rounded-full border text-xs font-semibold ${TONE_CLASSES[tone]}`}
  >
    {children}
  </span>
);

export default StatusBadge;
