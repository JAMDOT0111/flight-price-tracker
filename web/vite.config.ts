import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // 於 Docker 內可正確進行 HMR
    watch: { usePolling: true },
  },
});
