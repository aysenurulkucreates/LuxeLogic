import React from "react";
import { Search, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Çoğul isim: "No {plural} found." */
  plural: string;
  /** Tekil isim: "add your first {singular}." */
  singular: string;
  icon?: LucideIcon;
}

// Liste sayfalarında veri olmadığında tablo başlıklarının altında gösterilen ortak boş durum.
const EmptyState: React.FC<EmptyStateProps> = ({
  plural,
  singular,
  icon: Icon = Search,
}) => {
  return (
    <div className="py-32 text-center flex flex-col items-center gap-4">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
        <Icon size={48} aria-hidden="true" />
      </div>
      <p className="text-lg font-semibold text-slate-700">No {plural} found.</p>
      <p className="text-sm text-slate-500 max-w-xs">
        Try a different search or add your first {singular}.
      </p>
    </div>
  );
};

export default EmptyState;
