import React from "react";
import type { LucideIcon } from "lucide-react";

interface InfoCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

// Başlıklı beyaz kart. İçine FieldRow'lar ya da serbest içerik konur.
const InfoCard: React.FC<InfoCardProps> = ({ title, icon: Icon, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm text-left">
    <div className="flex items-center gap-2.5 px-5 sm:px-6 py-4 border-b border-slate-100">
      {Icon && <Icon size={18} className="text-indigo-600 shrink-0" />}
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    </div>
    <div className="px-5 sm:px-6 py-4">{children}</div>
  </section>
);

interface FieldListProps {
  children: React.ReactNode;
}

// FieldRow'ları ince çizgilerle ayırır.
export const FieldList: React.FC<FieldListProps> = ({ children }) => (
  <dl className="divide-y divide-slate-100 -my-3">{children}</dl>
);

interface FieldRowProps {
  label: string;
  children: React.ReactNode;
}

// Etiket solda, değer sağda; dar ekranda alt alta.
export const FieldRow: React.FC<FieldRowProps> = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-6 py-3">
    <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
    <dd className="text-sm font-medium text-slate-900 sm:text-right min-w-0 break-words">
      {children}
    </dd>
  </div>
);

export default InfoCard;
