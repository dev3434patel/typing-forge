import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

/** Directory hosting with no SPA fallback: missing route files cannot pass through a dev server rewrite. */
export async function startFrontendStaticServer(directory: string) {
  if (!/^dist-static-[A-Za-z0-9_-]+$/.test(directory))
    throw new Error("Use a dedicated static audit artifact.");
  const root = await realpath(path.resolve(directory));
  const deployment = JSON.parse(
    await readFile(path.join(root, "deployment.json"), "utf8"),
  ) as {
    target: string;
    base: string;
    frontendOnly: boolean;
    api: string;
    siteUrl: string | null;
  };
  if (
    !deployment.frontendOnly ||
    deployment.api !== "disabled" ||
    !deployment.base.startsWith("/")
  )
    throw new Error("A frontend-only build is required.");
  const requests: { path: string; method: string; status: number }[] = [];
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const record = {
      path: url.pathname,
      method: request.method || "GET",
      status: 0,
    };
    requests.push(record);
    const end = (
      status: number,
      body = "",
      headers: Record<string, string | number> = {},
    ) => {
      record.status = status;
      response.writeHead(status, { "Cache-Control": "no-store", ...headers });
      response.end(request.method === "HEAD" ? undefined : body);
    };
    if (!["GET", "HEAD"].includes(record.method)) return end(405);
    if (!url.pathname.startsWith(deployment.base)) return end(404);
    let relative: string;
    try {
      relative = decodeURIComponent(url.pathname.slice(deployment.base.length));
    } catch {
      return end(400);
    }
    if (relative.split(/[\\/]/).some((part) => part.startsWith(".")))
      return end(403);
    let file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(root + path.sep)) return end(403);
    try {
      const info = await stat(file).catch(() => null);
      if (info?.isDirectory()) {
        if (!url.pathname.endsWith("/"))
          return end(301, "", { Location: url.pathname + "/" + url.search });
        file = path.join(file, "index.html");
      }
      if (!(await stat(file).catch(() => null))?.isFile())
        return end(404, await readFile(path.join(root, "404.html"), "utf8"), {
          "Content-Type": "text/html; charset=utf-8",
        });
      const resolved = await realpath(file);
      if (!resolved.startsWith(root + path.sep)) return end(403);
      const body = await readFile(resolved);
      record.status = 200;
      response.writeHead(200, {
        "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "Content-Length": body.length,
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch {
      end(500);
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing static audit listener.");
  let running = true;
  const stop = async () => {
    if (!running) return;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
    running = false;
  };
  const baseURL = `http://127.0.0.1:${address.port}${deployment.base}`;
  return { baseURL, deployment, requests, stop };
}
