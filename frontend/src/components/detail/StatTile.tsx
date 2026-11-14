import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

// İkon metnin yanında, normal akışta durur: üst üste binme olmaz.
const StatTile: React.FC<StatTileProps> = ({
  icon: Icon,
  label,
  value,
  hint,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex items-start gap-3 text-left min-w-0">
    <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600">
      <Icon size={20} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug break-words">
        {value}
      </p>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  </div>
);

export default StatTile;
