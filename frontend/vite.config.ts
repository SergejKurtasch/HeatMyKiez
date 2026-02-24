import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/addresses": { target: "http://localhost:8000", changeOrigin: true },
      "/buildings": { target: "http://localhost:8000", changeOrigin: true },
      "/calculator": { target: "http://localhost:8000", changeOrigin: true },
      "/contractors": { target: "http://localhost:8000", changeOrigin: true },
      "/health": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
