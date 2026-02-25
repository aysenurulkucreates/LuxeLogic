import React, { createContext, useState } from "react";
// 1. "import type" kullanarak TypeScript'i susturduk
import type { User, AuthContextType } from "../types/auth";

// 2. Export'u kaldırdık (Fast Refresh hatası için)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Bunu aşağıda kullanabilmek için export etmiyoruz, hook üzerinden erişeceğiz
export { AuthContext };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // 3. useState içinde direkt localStorage kontrolü yaparak useEffect hatasını çözdün, aferin sana!
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("token");
    return token ? { loggedIn: true } : null;
  });

  const login = (token: string) => {
    localStorage.setItem("token", token);
    setUser({ loggedIn: true });
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
