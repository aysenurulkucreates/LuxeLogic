import React, { type ReactNode } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

interface DetailHeaderProps {
  eyebrow: string; // Kayıt türü: "Appointment", "Customer"...
  title: string;
  avatar?: ReactNode;
  badge?: ReactNode;
  backUrl?: string;
  // Verilmeyen aksiyonun butonu hiç çizilmez (rol izni yoksa undefined geçin).
  onEdit?: () => void;
  onDelete?: () => void;
}

const DetailHeader: React.FC<DetailHeaderProps> = ({
  eyebrow,
  title,
  avatar,
  badge,
  backUrl,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 text-left">
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={() => (backUrl ? navigate(backUrl) : navigate(-1))}
          aria-label="Go back"
          className="shrink-0 p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        {avatar && <div className="shrink-0">{avatar}</div>}

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{eyebrow}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 break-words min-w-0">
              {title}
            </h1>
            {badge}
          </div>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-3 shrink-0">
          {onEdit && (
            <Button icon={Pencil} onClick={onEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default DetailHeader;
