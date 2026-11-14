import React, { type ReactNode } from "react";
import DetailHeader from "../detail/DetailHeader";

// Beş detay sayfasının ortak iskeleti:
// başlık → özet kutucukları → ana kartlar (+ isteğe bağlı yan sütun).
interface DetailLayoutProps {
  eyebrow: string;
  title: string;
  avatar?: ReactNode;
  badge?: ReactNode;
  backUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;

  stats?: ReactNode[]; // StatTile'lar (dizi: sütun sayısı buna göre ayarlanır)
  aside?: ReactNode; // Geniş ekranda sağ sütun
  children: ReactNode; // InfoCard'lar
}

const STAT_COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

const DetailLayout: React.FC<DetailLayoutProps> = ({
  stats,
  aside,
  children,
  ...header
}) => {
  const statCount = stats?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 text-left">
      <DetailHeader {...header} />

      {statCount > 0 && (
        <div
          className={`grid grid-cols-2 gap-4 ${STAT_COLUMNS[Math.min(statCount, 4)]}`}
        >
          {stats}
        </div>
      )}

      {aside ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6 min-w-0">{children}</div>
          <div className="space-y-6 min-w-0">{aside}</div>
        </div>
      ) : (
        <div className="space-y-6">{children}</div>
      )}
    </div>
  );
};

export default DetailLayout;
