import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // VITE_BASE_PATH 由 GitHub Actions 傳入（/flight-price-tracker/）；本機開發保持 /
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    host: true,
    port: 5173,
    // 於 Docker 內可正確進行 HMR
    watch: { usePolling: true },
  },
});
