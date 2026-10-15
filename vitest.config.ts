import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node", // Use node environment for pure unit tests
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Business-logic coverage gate. React routes are verified by browser flows.
      include: [
        "src/lib/typing-core/**/*.ts",
        "src/lib/keybr-engine.ts",
        "src/lib/learning-evidence.ts",
        "src/lib/bot-engine.ts",
        "src/lib/content-packs.ts",
        "src/lib/session-diagnostics.ts",
        "src/lib/keyboard-lab.ts",
        "src/services/session-repository.ts",
        "src/services/session-sync.ts",
        "supabase/functions/_shared/validation.ts",
      ],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 85 },
      exclude: [
        "node_modules/",
        "src/test-setup.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "**/__tests__",
        "e2e/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
