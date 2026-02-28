import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, CircleUser } from "lucide-react";
import { useAuth } from "../../hooks/useAuth"; // Senin hook'un

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path?: string;
  onClick?: () => void;
  isAction?: boolean;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth(); //

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  // 🩺 Üstte kalacak ana rotalar
  const topMenuItems: MenuItem[] = [
    {
      name: "Overview",
      path: "/overview",
      icon: LayoutDashboard,
    },
    {
      name: "Customers",
      path: "/customers",
      icon: Users,
    },
  ];

  // 🩺 En altta duracak kişisel rotalar
  const bottomMenuItems: MenuItem[] = [
    {
      name: "Profile",
      path: "/profile",
      icon: CircleUser,
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
        className={`${commonStyles} text-red-500 hover:bg-red-50`}
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
              ? "bg-blue-50 text-blue-600 shadow-sm"
              : "text-gray-500 hover:bg-gray-50"
          }`
        }
      >
        <item.icon size={20} />
        <span>{item.name}</span>
      </NavLink>
    );
  };

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      {/* Logo Alanı */}
      <div className="p-8">
        <h2 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          LuxeLogic
        </h2>
      </div>

      {/* Üst Menü Linkleri */}
      <nav className="flex-1 px-4 space-y-1">
        {topMenuItems.map(renderItem)}
      </nav>

      {/* 🩺 ALT KISIM: 'mt-auto' ile en aşağıya itiyoruz */}
      <div className="px-4 pb-6 mt-auto">
        {/* Ayırıcı Çizgi */}
        <div className="h-px bg-gray-100 mx-4 mb-4" />

        <nav className="space-y-1">{bottomMenuItems.map(renderItem)}</nav>
      </div>
    </div>
  );
};

export default Sidebar;
