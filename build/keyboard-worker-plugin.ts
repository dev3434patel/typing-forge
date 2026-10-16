import path from "node:path";
import type { Plugin } from "vite";

/** One Rollup graph lets the worker and its compatibility path reuse identical scene chunks. */
export function keyboardWorkerPlugin(): Plugin {
  const entries: Record<string, { source: string; name: string }> = {
    "virtual:keyboard-worker-url": {
      source: "keyboard-render.worker.ts",
      name: "keyboard-render-worker",
    },
    "virtual:keyboard-bloom-url": {
      source: "keyboard-bloom.ts",
      name: "keyboard-bloom",
    },
  };
  let production = false;
  let root = "";
  return {
    name: "sparowtype-shared-keyboard-worker",
    configResolved(config) {
      production = config.command === "build";
      root = config.root;
    },
    resolveId(id) {
      return entries[id] ? "\0" + id : undefined;
    },
    load(id) {
      const entry = id.startsWith("\0") ? entries[id.slice(1)] : undefined;
      if (!entry) return;
      if (!production)
        return `export default "/src/components/brand/${entry.source}";`;
      const reference = this.emitFile({
        type: "chunk",
        id: path.resolve(root, "src/components/brand/" + entry.source),
        name: entry.name,
        preserveSignature: "strict",
      });
      return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
    },
  };
}
