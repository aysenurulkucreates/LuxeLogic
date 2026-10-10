import React, { createContext, useState } from "react";
import type { User, AuthContextType } from "../types/auth";
import { jwtDecode } from "jwt-decode";
import { useApolloClient } from "@apollo/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const client = useApolloClient();

  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedUser = jwtDecode<User>(token);
        return decodedUser;
      } catch (error) {
        console.log(error);
        localStorage.removeItem("token");
        return null;
      }
    }
    return null;
  });

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decodedUser = jwtDecode<User>(token);
    setUser(decodedUser);
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setUser(null);
    await client.clearStore();
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};
