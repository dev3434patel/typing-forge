import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { keyboardWorkerPlugin } from "./build/keyboard-worker-plugin";
import { openingCriticalPlugin } from "./build/opening-critical-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  preview: {
    proxy: { '/api': { target: process.env.SPAROWTYPE_PHP_URL || 'http://127.0.0.1:8081', changeOrigin: true } },
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
    proxy: { '/api': { target: process.env.SPAROWTYPE_PHP_URL || 'http://127.0.0.1:8081', changeOrigin: true } },
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
  build: {
    sourcemap: false, target: "es2022", manifest: true,
    modulePreload: {
      // A failed preloaded App module can remain poisoned across reloads in
      // affected WebKit builds (bug270357). Its real import still loads normally;
      // keep CSS and every other dependency's existing preload behavior.
      resolveDependencies: (_url, dependencies) => dependencies.filter(file => !/(?:^|\/)App-[^/]+\.js$/.test(file)),
    },
  },
});
