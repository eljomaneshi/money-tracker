import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import api, { setAuthToken } from "../lib/api";

type AuthContextType = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      setAuthToken(savedToken);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post("/auth/login", { email, password });
    const { token } = response.data;

    setToken(token);
    localStorage.setItem("token", token);
    setAuthToken(token);
  };

  const register = async (email: string, password: string): Promise<void> => {
    await api.post("/auth/register", { email, password });
  };

  const logout = (): void => {
    setToken(null);
    localStorage.removeItem("token");
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}