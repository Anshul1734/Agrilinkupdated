import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Port 5000 is taken by AirPlay Receiver on macOS, so the API defaults to 5001.
const API_TARGET = process.env.API_URL || "http://localhost:5001";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
