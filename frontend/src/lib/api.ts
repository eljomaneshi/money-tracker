import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

export type SessionExpiryHandler = () => void;

let sessionExpiryHandler: SessionExpiryHandler | null = null;
let isHandlingSessionExpiry = false;
let lockResetTimeout: ReturnType<typeof setTimeout> | null = null;

export function setSessionExpiryHandler(
  handler: SessionExpiryHandler | null
): void {
  sessionExpiryHandler = handler;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function requestHasAuthHeader(config?: InternalAxiosRequestConfig): boolean {
  if (!config?.headers) return false;
  const headers = config.headers;
  if ("get" in headers && typeof headers.get === "function") {
    return Boolean(headers.get("Authorization") || headers.get("authorization"));
  }
  const rawHeaders = headers as Record<string, unknown>;
  return Boolean(
    rawHeaders["Authorization"] ||
      rawHeaders["authorization"] ||
      rawHeaders["AUTHORIZATION"]
  );
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const isLoginRequest = url.includes("/auth/login");
    const hasAuth =
      requestHasAuthHeader(error?.config) ||
      Boolean(localStorage.getItem("token"));

    const isSessionExpired =
      status === 401 &&
      !isLoginRequest &&
      hasAuth;

    if (isSessionExpired && !isHandlingSessionExpiry) {
      isHandlingSessionExpiry = true;

      if (lockResetTimeout) {
        clearTimeout(lockResetTimeout);
      }
      lockResetTimeout = setTimeout(() => {
        isHandlingSessionExpiry = false;
        lockResetTimeout = null;
      }, 1500);

      setAuthToken(null);

      if (sessionExpiryHandler) {
        sessionExpiryHandler();
      }
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("token", token);
    if (lockResetTimeout) {
      clearTimeout(lockResetTimeout);
      lockResetTimeout = null;
    }
    isHandlingSessionExpiry = false;
  } else {
    localStorage.removeItem("token");
  }
}

export default api;