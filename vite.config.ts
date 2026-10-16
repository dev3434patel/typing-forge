import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { keyboardWorkerPlugin } from "./build/keyboard-worker-plugin";
import { openingCriticalPlugin } from "./build/opening-critical-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  preview: {
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: wss:; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=(), gyroscope=()",
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    tailwindcss(),
    keyboardWorkerPlugin(),
    openingCriticalPlugin(),
  ],
  worker: { format: "es" },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: { sourcemap: false, target: "es2022", manifest: true },
});
