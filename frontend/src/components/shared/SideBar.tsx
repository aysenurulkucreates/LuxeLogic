import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path?: string;
  onClick?: () => void;
  isAction?: boolean;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const menuItems: MenuItem[] = [
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
    {
      name: "Logout",
      icon: LogOut,
      isAction: true,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      {/* Logo Alanı */}
      <div className="p-8">
        <h2 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          LuxeLogic
        </h2>
      </div>

      {/* Menü Linkleri */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          // Ortak tasarım sınıflarımız (DRY prensibi - Kendini tekrar etme)
          const commonStyles =
            "flex items-center gap-3 px-4 py-3 rounded-xl transition w-full";
          // Eğer item.onClick varsa buton bas, yoksa NavLink bas!
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
                `${commonStyles} ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
