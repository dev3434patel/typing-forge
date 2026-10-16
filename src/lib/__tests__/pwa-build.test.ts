import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildOffline } from "../../../scripts/build-offline.mjs";

const directories: string[] = [];
const originalOrigin = process.env.SPAROWTYPE_SITE_URL;
afterEach(async () => {
  if (originalOrigin === undefined) delete process.env.SPAROWTYPE_SITE_URL;
  else process.env.SPAROWTYPE_SITE_URL = originalOrigin;
  for (const directory of directories.splice(0)) {
    const resolved = path.resolve(directory);
    if (
      path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
      !path.basename(resolved).startsWith("sparowtype-offline-fixture-")
    )
      throw new Error("Unsafe fixture cleanup path");
    await rm(resolved, { recursive: true, force: true });
  }
});
async function fixture() {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "sparowtype-offline-fixture-"),
  );
  directories.push(directory);
  await mkdir(path.join(directory, "assets"));
  await mkdir(path.join(directory, "fonts"));
  await writeFile(
    path.join(directory, "fonts", "fonts.css"),
    '@font-face{font-family:Fixture;src:url("/fonts/fixture.woff2")}',
  );
  await writeFile(
    path.join(directory, "fonts", "fixture.woff2"),
    "public font fixture",
  );
  await writeFile(
    path.join(directory, "fonts", "private.json"),
    '{"private":true}',
  );
  await writeFile(
    path.join(directory, "index.html"),
    '<html><head><link rel="stylesheet" href="/assets/style-123.css"></head><body>Public app shell</body></html>',
  );
  await writeFile(
    path.join(directory, "assets", "main-123.js"),
    "export const publicApp = true;",
  );
  await writeFile(
    path.join(directory, "assets", "style-123.css"),
    "body{color:white}",
  );
  await writeFile(
    path.join(directory, "site.webmanifest"),
    '{"name":"SparowType"}',
  );
  await writeFile(
    path.join(directory, "robots.txt"),
    "User-agent: *\nAllow: /\n",
  );
  await writeFile(
    path.join(directory, ".env"),
    "PRIVATE_FIXTURE_VALUE=not-for-cache",
  );
  await writeFile(
    path.join(directory, "private.json"),
    '{"private":"not-for-cache"}',
  );
  return directory;
}
describe("offline build artifacts", () => {
  it("injects a deterministic public file list without private files or invented sitemap origin", async () => {
    delete process.env.SPAROWTYPE_SITE_URL;
    const directory = await fixture();
    const first = await buildOffline(directory);
    const second = await buildOffline(directory);
    expect(second.version).toBe(first.version);
    expect(first.sitemap).toBe(false);
    const worker = await readFile(path.join(directory, "sw.js"), "utf8");
    expect(worker).not.toContain("__SPAROWTYPE_");
    expect(worker).not.toContain("private.json");
    expect(worker).not.toContain(".env");
    expect(worker).toContain("/assets/main-123.js");
    expect(worker).toContain("/fonts/fonts.css");
    expect(worker).toContain("/fonts/fixture.woff2");
    expect(worker).toContain("/index.html");
    expect(worker).toContain("/_offline-recovery.html");
    expect(worker).not.toContain('"/offline.html"');
    await expect(
      readFile(path.join(directory, "offline.html")),
    ).rejects.toThrow();
    const fallback = await readFile(
      path.join(directory, "_offline-recovery.html"),
      "utf8",
    );
    expect(fallback).toContain("noindex,nofollow");
    expect(fallback).toContain('href="/assets/style-123.css"');
    expect(fallback).toContain("<style data-offline-recovery>");
    expect(fallback).toContain(".recovery-link:focus-visible");
    expect(fallback).toContain("min-height: 44px");
    expect(fallback).toContain('class="recovery-shell"');
    expect(fallback).not.toContain("forge-main");
    expect(fallback).not.toContain("<script");
    await expect(
      readFile(path.join(directory, "sitemap.xml")),
    ).rejects.toThrow();
    expect(
      await readFile(path.join(directory, "robots.txt"), "utf8"),
    ).not.toContain("Sitemap:");
  });
  it("changes its version when actual public app bytes change", async () => {
    delete process.env.SPAROWTYPE_SITE_URL;
    const directory = await fixture();
    const before = await buildOffline(directory);
    await writeFile(
      path.join(directory, "assets", "main-123.js"),
      'export const publicApp = "new";',
    );
    expect((await buildOffline(directory)).version).not.toBe(before.version);
  });
  it("preserves inlined public font faces in recovery and accounts for their bytes", async () => {
    delete process.env.SPAROWTYPE_SITE_URL;
    const directory = await fixture();
    const before = await buildOffline(directory);
    const inlineFonts =
      '<style data-inline-fonts>@font-face{font-family:Fixture;src:url("/fonts/fixture.woff2")}</style>';
    await writeFile(
      path.join(directory, "index.html"),
      `<html><head>${inlineFonts}<style data-opening-critical>.awakening-title{color:gray}</style></head><body>Public app shell</body></html>`,
    );
    const after = await buildOffline(directory);
    const recovery = await readFile(
      path.join(directory, "_offline-recovery.html"),
      "utf8",
    );
    expect(recovery).toContain(inlineFonts);
    expect(recovery).toContain("<style data-offline-recovery>");
    expect(recovery).not.toContain("data-opening-critical");
    expect(after.version).not.toBe(before.version);
    expect(after.publicFiles).toBe(before.publicFiles);
    expect(after.bytes).toBeGreaterThan(before.bytes);
    const worker = await readFile(path.join(directory, "sw.js"), "utf8");
    expect(worker).toContain("/fonts/fonts.css");
    expect(worker).toContain("/fonts/fixture.woff2");
  });
  it("emits only public sitemap routes with the explicitly configured origin", async () => {
    process.env.SPAROWTYPE_SITE_URL = "https://example.test/subpath";
    const directory = await fixture();
    expect((await buildOffline(directory)).sitemap).toBe(true);
    const sitemap = await readFile(path.join(directory, "sitemap.xml"), "utf8");
    expect(sitemap).toContain("https://example.test/touch-typing");
    expect(sitemap).not.toMatch(
      /profile|settings|auth|stats|private|leaderboard/,
    );
    expect(
      await readFile(path.join(directory, "robots.txt"), "utf8"),
    ).toContain("Sitemap: https://example.test/sitemap.xml");
  });
  it("rejects invalid or credential-bearing deployment origins", async () => {
    process.env.SPAROWTYPE_SITE_URL = "https://person:secret@example.test";
    await expect(buildOffline(await fixture())).rejects.toThrow(
      "without credentials",
    );
  });
  it("removes an earlier sitemap when a later build has no configured origin", async () => {
    const directory = await fixture();
    process.env.SPAROWTYPE_SITE_URL = "https://example.test";
    await buildOffline(directory);
    delete process.env.SPAROWTYPE_SITE_URL;
    expect((await buildOffline(directory)).sitemap).toBe(false);
    await expect(
      readFile(path.join(directory, "sitemap.xml")),
    ).rejects.toThrow();
    expect(
      await readFile(path.join(directory, "robots.txt"), "utf8"),
    ).not.toContain("Sitemap:");
  });
  it("requires actual emitted JavaScript before claiming an offline build", async () => {
    const directory = await fixture();
    await rm(path.join(directory, "assets", "main-123.js"));
    await expect(buildOffline(directory)).rejects.toThrow(
      "completed Vite build",
    );
  });
});
