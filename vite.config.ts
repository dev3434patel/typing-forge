import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { keyboardWorkerPlugin } from "./build/keyboard-worker-plugin";
import { openingCriticalPlugin } from "./build/opening-critical-plugin";
import { resolveDeploymentConfig } from "./build/deployment-config.mjs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const environment = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const deployment = resolveDeploymentConfig(environment);
  const proxy = deployment.frontendOnly
    ? undefined
    : {
        "/api": {
          target: environment.SPAROWTYPE_PHP_URL || "http://127.0.0.1:8081",
          changeOrigin: true,
        },
      };
  return {
    base: deployment.base,
    define: {
      "import.meta.env.VITE_DEPLOYMENT_TARGET": JSON.stringify(
        deployment.target,
      ),
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(deployment.apiBase),
      "import.meta.env.VITE_PUBLIC_SITE_URL": JSON.stringify(
        deployment.siteUrl,
      ),
    },
    preview: {
      proxy,
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
      proxy,
      fs: {
        // Preserve Vite's default deny rules when adding local PHP boundaries.
        deny: [
          ".env",
          ".env.*",
          "*.{crt,pem}",
          "**/.git/**",
          "**/backend/config.php",
          "**/backend/*-config.local.php",
          "**/backend/storage/**",
          "**/hosting-build/**",
          "**/hosting-archive/**",
          "**/.hosting-stage-*/**",
        ],
      },
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
      sourcemap: false,
      target: "es2022",
      manifest: true,
      modulePreload: {
        // A failed preloaded App module can remain poisoned across reloads in
        // affected WebKit builds (bug270357). Its real import still loads normally;
        // keep CSS and every other dependency's existing preload behavior.
        resolveDependencies: (_url, dependencies) =>
          dependencies.filter((file) => !/(?:^|\/)App-[^/]+\.js$/.test(file)),
      },
    },
  };
});
