import React, { createContext, useState } from "react";
import type { User, AuthContextType } from "../types/auth";
import { jwtDecode } from "jwt-decode"; // 🚨 YENİ: Token'ın içini okuyan sihirli neşter!

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Başlangıçta token varsa içini açıp gerçek verileri alıyoruz
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Token'ı çöz! İçindeki tenantId, id, email gibi bilgiler buraya akar.
        const decodedUser = jwtDecode<User>(token);
        return decodedUser;
      } catch (error) {
        console.log(error);
        // Token bozuksa veya süresi geçmişse temizle
        localStorage.removeItem("token");
        return null;
      }
    }
    return null;
  });

  const login = (token: string) => {
    localStorage.setItem("token", token);
    // 🚨 YENİ: Giriş yapıldığında da token'ı çözüp gerçek bilgileri state'e yazıyoruz
    const decodedUser = jwtDecode<User>(token);
    setUser(decodedUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};
