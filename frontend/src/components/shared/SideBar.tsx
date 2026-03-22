import React from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  LogOut,
  CircleUser,
  Package,
  SlidersHorizontal,
  Contact,
  CalendarClock,
  HandCoins,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface User {
  id: string;
  email: string;
  role: string;
}

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path?: string;
  onClick?: () => void;
  isAction?: boolean;
  allowedRoles?: string[]; //  Bu menüyü kimler görebilir? (Eğer boşsa herkes görür)
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  //  user'ı da çektik! Artık kimin giriş yaptığını biliyoruz.
  const { user, logout } = useAuth() as {
    user: User | null;
    logout: () => void;
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const topMenuItems: MenuItem[] = [
    {
      name: "Overview",
      path: "/overview",
      icon: LayoutDashboard,
      // Sekreter finansal özetleri görmesin, doktor ve admin görsün
      allowedRoles: ["SUPER_ADMIN", "TENANT_ADMIN", "DOCTOR"],
    },
    {
      name: "Appointments",
      path: "/appointments",
      icon: CalendarClock,
      // Herkes randevuları görmeli (Kısıtlama yok, o yüzden allowedRoles yazmıyoruz)
    },
    {
      name: "Customers",
      path: "/customers",
      icon: Users,
      // Hastaları/Müşterileri herkes görebilir
    },
    {
      name: "Products",
      path: "/products",
      icon: Package,
      // Sadece yöneticiler ve belki doktorlar stokları görebilir
      allowedRoles: ["SUPER_ADMIN", "TENANT_ADMIN", "DOCTOR"],
    },
    {
      name: "Staff",
      path: "/staff",
      icon: Contact,
      //  Personel maaşları/ayarlarını SADECE yöneticiler görebilir!
      allowedRoles: ["SUPER_ADMIN", "TENANT_ADMIN"],
    },
    {
      name: "Sales",
      path: "/sales",
      icon: HandCoins,
      // 🚨 FİNANS: Kasayı sadece yöneticiler görebilir!
      allowedRoles: ["SUPER_ADMIN", "TENANT_ADMIN"],
    },
  ];

  const bottomMenuItems: MenuItem[] = [
    {
      name: "Profile",
      path: "/profile",
      icon: CircleUser,
      // Herkes kendi profilini görebilir
    },
    {
      name: "Settings",
      path: "/settings",
      icon: SlidersHorizontal,
      // Klinik ayarlarını sadece yöneticiler değiştirebilir
      allowedRoles: ["SUPER_ADMIN", "TENANT_ADMIN"],
    },
    {
      name: "Logout",
      icon: LogOut,
      isAction: true,
      onClick: handleLogout,
    },
  ];

  // Ortak tasarım sınıflarımız
  const commonStyles =
    "flex items-center gap-3 px-4 py-3 rounded-xl transition w-full font-medium";

  // Tekrarlanan render mantığını bir fonksiyonla sadeleştirelim
  const renderItem = (item: MenuItem) => {
    return item.onClick ? (
      <button
        key={item.name}
        onClick={item.onClick}
        className={`${commonStyles} text-rose-500 hover:bg-rose-50`}
      >
        <item.icon size={20} />
        <span>{item.name}</span>
      </button>
    ) : (
      <NavLink
        key={item.path}
        to={item.path!}
        className={({ isActive }) =>
          `${commonStyles} ${
            isActive
              ? "bg-indigo-50 text-indigo-600 shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
          }`
        }
      >
        <item.icon size={20} />
        <span>{item.name}</span>
      </NavLink>
    );
  };

  //  Adamın rolü bu menüyü görmeye yetiyor mu?
  const checkAccess = (item: MenuItem) => {
    // Eğer menüde "allowedRoles" kısıtlaması yoksa, direkt göster (return true)
    if (!item.allowedRoles) return true;

    // Eğer kısıtlama varsa ve user yoksa (ki olmamalı), gizle
    if (!user || !user.role) return false;

    // Adamın rolü, izin verilen roller listesinin içinde var mı?
    return item.allowedRoles.includes(user.role);
  };

  return (
    <div className="w-64 bg-white border-r border-slate-100 flex flex-col min-h-screen">
      {/* Logo Alanı */}
      <div className="p-8">
        <Link
          to={
            user?.role === "STAFF" || user?.role === "NURSE"
              ? "/appointments"
              : "/overview"
          }
          className="block w-fit hover:opacity-80 transition-opacity cursor-pointer active:scale-95"
        >
          <h2 className="text-2xl font-black bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            LuxeLogic
          </h2>
        </Link>
      </div>

      {/* Üst Menü Linkleri */}
      <nav className="flex-1 px-4 space-y-1">
        {topMenuItems
          .filter(checkAccess) // 🚨 SÜZGECİ TAKTIK!
          .map(renderItem)}
      </nav>

      {/* 🩺 ALT KISIM: 'mt-auto' ile en aşağıya itiyoruz */}
      <div className="px-4 pb-6 mt-auto">
        {/* Ayırıcı Çizgi */}
        <div className="h-px bg-slate-100 mx-4 mb-4" />

        <nav className="space-y-1">
          {bottomMenuItems
            .filter(checkAccess) // 🚨 SÜZGECİ BURAYA DA TAKTIK!
            .map(renderItem)}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
