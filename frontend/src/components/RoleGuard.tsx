import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface User {
  id: string;
  role: string;
}

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[]; // Bu odaya kimler girebilir?
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth() as { user: User | null };

  // Adamın rolü, izin verilen roller listesinde YOKSA:
  if (!user || !allowedRoles.includes(user.role)) {
    // ÇARPILDI! ⚡️ Adamı direkt yetkisi olan güvenli bir limana (Appointments) fırlat!
    return <Navigate to="/appointments" replace />;
  }

  // Yetkisi VARSA, kapıyı aç ve sayfayı göster:
  return <>{children}</>;
};

export default RoleGuard;
