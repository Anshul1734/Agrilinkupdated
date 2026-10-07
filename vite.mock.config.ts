import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
export default defineConfig({
  server: { port: 8082, strictPort: true, proxy: { "/api": { target: "http://localhost:5002", changeOrigin: true } } },
  plugins: [react()],
  resolve: { alias: [
    { find: "firebase/app", replacement: "/private/tmp/claude-501/-Users-anshul-Desktop-agrilink/8614f17d-471e-43c1-a596-0d2009b29639/scratchpad/stubs/app.js" },
    { find: "firebase/auth", replacement: "/private/tmp/claude-501/-Users-anshul-Desktop-agrilink/8614f17d-471e-43c1-a596-0d2009b29639/scratchpad/stubs/auth.js" },
    { find: "@", replacement: path.resolve(__dirname, "src") },
  ] },
});
