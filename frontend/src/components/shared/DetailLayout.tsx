import React, { type ReactNode } from "react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  // --- LOADING STATE (Surgical Waiting Room ⏳) ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
        <p className="ml-4 text-slate-500 font-bold">
          Resuscitating data... 💉
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 animate-in fade-in duration-500 text-left">
      {/* --- FIXED HEADER FRAME (Üst Ameliyathane) --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          {/* Back Button (Transfer Ambulansı 🚑) */}
          <button
            onClick={() => (backUrl ? navigate(backUrl) : navigate(-1))}
            className="p-4 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 hover:text-indigo-600 transition-all active:scale-95"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="space-y-1 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">
              File Detail Report
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight text-left truncate">
                {title} {/* 💎 BURAYA VERİ GELECEK */}
              </h1>
              {statusBadge} {/* 💎 BURAYA VERİ GELECEK */}
            </div>
          </div>
        </div>

        {/* Action Buttons (Cerrahi Müdahale Seti 💉) */}
        <div className="flex gap-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200"
            >
              <Edit size={16} /> Edit Case
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors border border-rose-100"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* --- MAIN BODY FRAME (Cerrahi Bölge) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-10 items-start">
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
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            {mainContentSlot} {/* 💎 BURAYA VERİ GELECEK */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailLayout;
