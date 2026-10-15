import { readFile, readdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..", "dist");
const manifest = JSON.parse(
  await readFile(path.join(root, ".vite", "manifest.json"), "utf8"),
);
const files = new Set();
function include(key) {
  const item = manifest[key];
  if (!item || files.has(item.file)) return;
  files.add(item.file);
  (item.imports || []).forEach(include);
}
include("index.html");
include("src/pages/Index.tsx");
const initial = [];
for (const file of files) {
  const bytes = await readFile(path.join(root, file));
  initial.push({
    file,
    bytes: bytes.length,
    gzipBytes: gzipSync(bytes).length,
  });
}
const assets = await readdir(path.join(root, "assets"));
const css = [],
  fonts = [],
  features = [];
for (const file of assets) {
  const data = await readFile(path.join(root, "assets", file));
  if (file.endsWith(".css"))
    css.push({ file, bytes: data.length, gzipBytes: gzipSync(data).length });
  else if (file.endsWith(".woff2")) fonts.push({ file, bytes: data.length });
  else if (file.endsWith(".js") && !files.has(`assets/${file}`))
    features.push({ file, gzipBytes: gzipSync(data).length });
}
const report = {
  initialPracticeJsGzipBytes: initial.reduce(
    (sum, item) => sum + item.gzipBytes,
    0,
  ),
  maxFeatureJsGzipBytes: Math.max(0, ...features.map((item) => item.gzipBytes)),
  css,
  fonts,
  initial,
  budgets: { initialPracticeJsGzipBytes: 200_000, featureJsGzipBytes: 150_000 },
};
console.log(JSON.stringify(report, null, 2));
if (
  report.initialPracticeJsGzipBytes >
    report.budgets.initialPracticeJsGzipBytes ||
  report.maxFeatureJsGzipBytes > report.budgets.featureJsGzipBytes
)
  process.exitCode = 1;
