import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/auth": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/users": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/expenses": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/accounts": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/notes": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/account-actions": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/subscriptions": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/integrations": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});