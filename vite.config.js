import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    host: true, // expose to 0.0.0.0
    port: Number(process.env.PORT) || 4173,
    allowedHosts: ["medical-frontend-qsoh.onrender.com"],
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
});
