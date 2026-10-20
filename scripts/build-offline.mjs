import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoutes = [
  "/",
  "/typing-test",
  "/learn",
  "/lessons",
  "/typing-practice",
  "/practice",
  "/touch-typing",
  "/keyboard-lab",
  "/about",
  "/privacy",
  "/terms",
];
async function filesWithin(directory, prefix = "") {
  const entries = await readdir(path.join(directory, prefix), {
    withFileTypes: true,
  });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? filesWithin(directory, path.join(prefix, entry.name))
        : path.join(prefix, entry.name),
    ),
  );
  return nested.flat().map((file) => file.replaceAll(path.sep, "/"));
}
function text(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
// Recovery must remain readable before JavaScript or the lazy app stylesheet
// can load. These classes belong only to this static, public document.
const recoveryStyles = `
:root { color-scheme: dark; font-family: "Inter Variable", "Inter Fallback", system-ui, sans-serif; }
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; min-width: 0; background: #07070a; color: #ededf2; }
.recovery-shell { width: 100%; max-width: 52rem; margin: 0 auto; padding: clamp(48px, 10vh, 112px) clamp(20px, 5vw, 56px); }
.recovery-brand { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 0 0 48px; font: 700 18px/1.4 Sora, "Sora Fallback", system-ui, sans-serif; letter-spacing: -0.04em; }
.recovery-accent { color: #c6ff3d; }
.recovery-badge { padding: 4px 8px; border: 1px solid #44445c; border-radius: 6px; color: #b2b2c7; font: 500 11px/1.5 "Inter Variable", system-ui, sans-serif; letter-spacing: 0.04em; }
.recovery-title { margin: 0; font: 650 clamp(32px, 6vw, 48px)/1.2 Sora, "Sora Fallback", system-ui, sans-serif; letter-spacing: -0.035em; overflow-wrap: anywhere; text-wrap: balance; }
.recovery-copy { max-width: 60ch; margin: 24px 0 0; color: #b2b2c7; font-size: 16px; line-height: 1.75; overflow-wrap: anywhere; }
.recovery-actions { display: flex; flex-wrap: wrap; gap: 12px; min-width: 0; margin-top: 32px; }
.recovery-link { display: inline-flex; align-items: center; justify-content: center; min-width: 0; max-width: 100%; min-height: 44px; padding: 12px 18px; border: 1px solid #44445c; border-radius: 10px; background: #151520; color: #ededf2; font-size: 14px; font-weight: 600; line-height: 1.5; text-align: center; text-decoration: none; overflow-wrap: anywhere; }
.recovery-link-primary { border-color: #c6ff3d; background: #c6ff3d; color: #07070a; }
.recovery-link:hover { border-color: #c6ff3d; background: #222230; }
.recovery-link-primary:hover { background: #d4ff70; }
.recovery-link:focus-visible { outline: 2px solid #c6ff3d; outline-offset: 4px; }
.recovery-link-primary:focus-visible { outline-color: #ededf2; }
@media (max-width: 420px) { .recovery-actions { flex-direction: column; } .recovery-link { width: 100%; } }
`;
export async function buildOffline(outputDirectory = path.join(root, "dist")) {
  const output = path.resolve(outputDirectory);
  const html = await readFile(path.join(output, "index.html"), "utf8");
  const assetFiles = (await filesWithin(path.join(output, "assets"))).filter(
    (file) => /\.(?:js|css|woff2?|png|svg|webp|ico)$/.test(file),
  );
  if (!assetFiles.some((file) => file.endsWith(".js")))
    throw new Error(
      "A completed Vite build is required before preparing offline files.",
    );
  const cssLinks = [...html.matchAll(/<link\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => /rel="stylesheet"/.test(tag))
    .join("\n");
  // The opening build inlines the same self-hosted font faces. Keep them in
  // static recovery too; the public font files remain in the cache allowlist.
  const inlineFonts =
    html.match(
      /<style\b[^>]*\bdata-inline-fonts\b[^>]*>[\s\S]*?<\/style>/i,
    )?.[0] || "";
  const offlineHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#07070a"><title>Connection unavailable · SparowType</title>
${cssLinks}${inlineFonts}<style data-offline-recovery>${recoveryStyles}</style></head>
<body><main id="main-content" class="recovery-shell">
<p class="recovery-brand"><span>Sparow<span class="recovery-accent">Type</span></span><span class="recovery-badge">Offline</span></p>
<h1 class="recovery-title">This page needs a connection.</h1>
<p class="recovery-copy">Your browser can reopen the public practice workspace from its completed app download. Account requests, live rankings and human races need a connection. Your local typing history is not removed.</p>
<nav aria-label="Offline recovery" class="recovery-actions"><a class="recovery-link recovery-link-primary" href="/">Open guest practice</a><a class="recovery-link" href="/learn">Open adaptive lessons</a><a class="recovery-link" href="/offline">Offline information</a></nav>
</main></body></html>`;
  // Keep the static fallback distinct from routed /offline: clean-URL hosts
  // resolve offline.html before the SPA, hiding its actual controls online.
  await writeFile(path.join(output, "_offline-recovery.html"), offlineHtml);
  const allOutputFiles = await filesWithin(output);
  const rootPublicFiles = allOutputFiles.filter(
    (file) =>
      !file.includes("/") && /\.(?:svg|png|ico|webmanifest)$/.test(file),
  );
  const publicFontFiles = allOutputFiles.filter((file) =>
    /^fonts\/[^/]+\.(?:css|woff2?)$/.test(file),
  );
  const paths = [
    "/index.html",
    "/_offline-recovery.html",
    ...assetFiles.map((file) => "/assets/" + file),
    ...rootPublicFiles.map((file) => "/" + file),
    ...publicFontFiles.map((file) => "/" + file),
  ].sort();
  const digest = createHash("sha256");
  for (const file of paths) {
    digest.update(file);
    digest.update(await readFile(path.join(output, file.slice(1))));
  }
  const version = digest.digest("hex").slice(0, 20);
  const template = await readFile(path.join(root, "public", "sw.js"), "utf8");
  const worker = template
    .replace("__SPAROWTYPE_BUILD__", version)
    .replace("/*__SPAROWTYPE_PRECACHE__*/ []", JSON.stringify(paths));
  if (
    worker.includes("__SPAROWTYPE_BUILD__") ||
    worker.includes("/*__SPAROWTYPE_PRECACHE__*/")
  )
    throw new Error("Offline template injection failed.");
  await writeFile(path.join(output, "sw.js"), worker);
  const bytes = (
    await Promise.all(
      paths.map((file) => stat(path.join(output, file.slice(1)))),
    )
  ).reduce((sum, file) => sum + file.size, 0);
  await writeFile(
    path.join(output, "offline-build.json"),
    JSON.stringify({ version, publicFiles: paths.length, bytes }, null, 2),
  );
  // The real deployment origin is optional; never invent a production hostname.
  let sitemap = false;
  const robots = await readFile(path.join(output, "robots.txt"), "utf8").catch(
    () => "User-agent: *\nAllow: /\n",
  );
  const cleanRobots = robots.replace(/^Sitemap:.*$/gm, "").trimEnd();
  if (process.env.SPAROWTYPE_SITE_URL) {
    const origin = new URL(process.env.SPAROWTYPE_SITE_URL);
    if (
      !["http:", "https:"].includes(origin.protocol) ||
      origin.username ||
      origin.password
    )
      throw new Error(
        "SPAROWTYPE_SITE_URL must be a public HTTP(S) origin without credentials.",
      );
    const entries = publicRoutes
      .map(
        (route) =>
          `<url><loc>${text(new URL(route, origin.origin).href)}</loc></url>`,
      )
      .join("");
    await writeFile(
      path.join(output, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`,
    );
    await writeFile(
      path.join(output, "robots.txt"),
      cleanRobots +
        `\nSitemap: ${new URL("/sitemap.xml", origin.origin).href}\n`,
    );
    sitemap = true;
  } else {
    await unlink(path.join(output, "sitemap.xml")).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    await writeFile(path.join(output, "robots.txt"), cleanRobots + "\n");
  }
  return { version, publicFiles: paths.length, bytes, sitemap };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const result = await buildOffline(process.argv[2] || undefined);
  process.stdout.write(
    `Offline public app prepared: ${result.publicFiles} files, ${result.bytes} bytes, version ${result.version}. Sitemap ${result.sitemap ? "uses the configured origin" : "omitted until SPAROWTYPE_SITE_URL is configured"}.\n`,
  );
}
