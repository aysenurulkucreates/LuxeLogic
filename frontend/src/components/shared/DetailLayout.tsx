import React, { type ReactNode } from "react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../ui/LoadingState";
import Button from "../ui/Button";

// --- INTERFACES (Cerrahi Tipler) ---
interface DetailLayoutProps {
  // 1. Fixed Header (Sabit Üst Çerçeve)
  title: string; // Müşteri Adı, Personel Adı vb.
  statusBadge?: ReactNode; // 🏷️APPROVED, PENDING gibi dinamik badge
  onEdit?: () => void; // Edit butonuna basınca ne olacak?
  onDelete?: () => void; // Delete butonuna basınca ne olacak?
  backUrl?: string; // Geri butonuna basınca nereye gidecek?

  // 2. Slot Structure (Değişken Boşluklar)
  profileSlot: ReactNode; // Slot A: Sol taraftaki Profil Kartı
  statsSlot?: ReactNode; // Slot B: Üstteki İstatistik Kartları (Opsiyonel)
  mainContentSlot: ReactNode; // Slot C: Alttaki Ana İçerik Tablosu/Sekmeleri

  isLoading?: boolean;
}

const DetailLayout: React.FC<DetailLayoutProps> = ({
  title,
  statusBadge,
  onEdit,
  onDelete,
  backUrl,
  profileSlot,
  statsSlot,
  mainContentSlot,
  isLoading = false, // Varsayılan olarak yükleme yok
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10 animate-in fade-in duration-500 text-left">
      {/* --- FIXED HEADER FRAME (Üst Ameliyathane) --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-6 min-w-0">
          {/* Back Button (Transfer Ambulansı 🚑) */}
          <button
            onClick={() => (backUrl ? navigate(backUrl) : navigate(-1))}
            aria-label="Go back"
            className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="space-y-1 text-left min-w-0">
            <p className="text-xs font-medium text-slate-500 text-left">
              Details
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900 truncate">
                {title} {/* 💎 BURAYA VERİ GELECEK */}
              </h1>
              {statusBadge} {/* 💎 BURAYA VERİ GELECEK */}
            </div>
          </div>
        </div>

        {/* Action Buttons (Cerrahi Müdahale Seti 💉) */}
        <div className="flex gap-3">
          {onEdit && (
            <Button icon={Edit} onClick={onEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              aria-label="Delete"
              className="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* --- MAIN BODY FRAME (Cerrahi Bölge) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">
        {/* --- SLOT A: PROFILE SIDEBAR (Sol Organ) --- */}
        <div className="sticky top-10 space-y-8">
          {profileSlot} {/* 💎 BURAYA VERİ GELECEK */}
        </div>

        {/* --- RIGHT SIDE CONTENT (Sağ Organ) --- */}
        <div className="space-y-10">
          {/* --- SLOT B: STATS CARDS (Üst Organ) --- */}
          {statsSlot && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {statsSlot} {/* 💎 BURAYA VERİ GELECEK */}
            </div>
          )}

          {/* --- SLOT C: MAIN CONTENT (Ana Organ) --- */}
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
            {mainContentSlot} {/* 💎 BURAYA VERİ GELECEK */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailLayout;
