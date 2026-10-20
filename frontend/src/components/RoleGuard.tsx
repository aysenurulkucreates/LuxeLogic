import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getHomePath } from "../config/permissions";

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
    // Yetkisiz: rolün ana sayfasına yönlendir
    return <Navigate to={getHomePath(user?.role)} replace />;
  }

  // Yetkisi VARSA, kapıyı aç ve sayfayı göster:
  return <>{children}</>;
};

export default RoleGuard;
