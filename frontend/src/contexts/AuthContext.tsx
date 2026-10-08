import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { setAuthToken, setSessionExpiryHandler } from "../lib/api";

type AuthContextType = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const logout = useCallback((): void => {
    setToken(null);
    localStorage.removeItem("token");
    setAuthToken(null);
  }, []);

  useEffect(() => {
    setSessionExpiryHandler(() => {
      const returnPath = `${location.pathname}${location.search}${location.hash}`;
      logout();
      navigate("/login", {
        replace: true,
        state: {
          sessionExpiredMessage: "Your session has expired. Please sign in again.",
          from: returnPath,
        },
      });
    });

    return () => {
      setSessionExpiryHandler(null);
    };
  }, [navigate, location, logout]);

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