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
const applicationEntry = Object.entries(manifest).find(
  ([, item]) => item.name === "App",
);
if (applicationEntry) include(applicationEntry[0]);
const bootstrapFiles = new Set();
function includeBootstrap(key) {
  const item = manifest[key];
  if (!item || bootstrapFiles.has(item.file)) return;
  bootstrapFiles.add(item.file);
  (item.imports || []).forEach(includeBootstrap);
}
includeBootstrap("index.html");
const introKeys = new Set();
function includeIntro(key) {
  const item = manifest[key];
  if (!item || introKeys.has(key) || files.has(item.file)) return;
  introKeys.add(key);
  [...(item.imports || []), ...(item.dynamicImports || [])].forEach(
    includeIntro,
  );
}
const introEntry = Object.entries(manifest).find(
  ([, item]) => item.name === "keyboard-scene",
);
if (introEntry) includeIntro(introEntry[0]);
const workerEntry = Object.entries(manifest).find(
  ([, item]) => item.name === "keyboard-render-worker",
);
const bloomEntry = Object.entries(manifest).find(
  ([, item]) => item.name === "keyboard-bloom",
);
const bridgeEntry = Object.entries(manifest).find(
  ([, item]) => item.name === "keyboard-scene-bridge",
);
// Native worker imports intentionally bypass Vite's DOM preload helper. Include
// those emitted entries explicitly rather than hiding them from the budget.
for (const entry of [workerEntry, bloomEntry, bridgeEntry])
  if (entry) includeIntro(entry[0]);
const introFiles = [
  ...new Set([...introKeys].map((key) => manifest[key].file)),
].filter((file) => !files.has(file));
let introDeferredJsGzipBytes = 0;
for (const file of introFiles)
  introDeferredJsGzipBytes += gzipSync(
    await readFile(path.join(root, file)),
  ).length;
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
  else if (
    file.endsWith(".js") &&
    !files.has(`assets/${file}`) &&
    !introFiles.includes(`assets/${file}`)
  )
    features.push({ file, gzipBytes: gzipSync(data).length });
}
const report = {
  bootstrapJsGzipBytes: (
    await Promise.all(
      [...bootstrapFiles].map(
        async (file) => gzipSync(await readFile(path.join(root, file))).length,
      ),
    )
  ).reduce((sum, bytes) => sum + bytes, 0),
  initialPracticeJsGzipBytes: initial.reduce(
    (sum, item) => sum + item.gzipBytes,
    0,
  ),
  maxFeatureJsGzipBytes: Math.max(0, ...features.map((item) => item.gzipBytes)),
  introDeferredJsGzipBytes,
  introFiles,
  workerFile: workerEntry?.[1].file ?? null,
  css,
  fonts,
  initial,
  budgets: {
    initialPracticeJsGzipBytes: 200_000,
    featureJsGzipBytes: 150_000,
    introDeferredJsGzipBytes: 220_000,
  },
};
function deferredGraphGzip(entry) {
  const visited = new Set();
  function visit(key) {
    const item = manifest[key];
    if (!item || files.has(item.file) || visited.has(item.file)) return;
    visited.add(item.file);
    (item.imports || []).forEach(visit);
  }
  visit(entry);
  return Promise.all([...visited].map(async file => gzipSync(await readFile(path.join(root, file))).length)).then(sizes => sizes.reduce((sum, size) => sum + size, 0));
}
function requiredEntry(source, name) {
  if (manifest[source]) return source;
  const found = Object.entries(manifest).find(([, item]) => item.name === name && item.isDynamicEntry);
  if (!found) throw new Error(`Missing required feature bundle: ${source}`);
  return found[0];
}
report.arcadeRouteGzipBytes = await deferredGraphGzip(requiredEntry('src/games/ui/ArcadePage.tsx', 'ArcadePage'));
report.arcadePlayerGzipBytes = await deferredGraphGzip(requiredEntry('src/games/ui/ArcadePlayer.tsx', 'ArcadePlayer'));
report.dashboardRouteGzipBytes = await deferredGraphGzip('src/pages/Stats.tsx');
report.budgets.arcadeRouteGzipBytes = 90_000;
report.budgets.arcadePlayerGzipBytes = 90_000;
report.budgets.dashboardRouteGzipBytes = 120_000;
report.arcadeAbsentFromInitialPractice = ![...files].some(file => /ArcadePage|arcade|game-engine/i.test(file));
console.log(JSON.stringify(report, null, 2));
if (
  report.initialPracticeJsGzipBytes >
    report.budgets.initialPracticeJsGzipBytes ||
  report.maxFeatureJsGzipBytes > report.budgets.featureJsGzipBytes ||
  report.introDeferredJsGzipBytes > report.budgets.introDeferredJsGzipBytes ||
  report.arcadeRouteGzipBytes > report.budgets.arcadeRouteGzipBytes ||
  report.arcadePlayerGzipBytes > report.budgets.arcadePlayerGzipBytes ||
  report.dashboardRouteGzipBytes > report.budgets.dashboardRouteGzipBytes ||
  !report.arcadeAbsentFromInitialPractice
)
  process.exitCode = 1;
