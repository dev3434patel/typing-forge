import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

/** Real disposable HTTP origin: no Playwright offline emulation or request routing. */
export async function startPwaStaticServer() {
  const root = await realpath(path.resolve("dist"));
  const build = JSON.parse(
    await readFile(path.join(root, "offline-build.json"), "utf8"),
  ) as {
    version: string;
    publicFiles: number;
    bytes: number;
  };
  const headerSource = await readFile(path.join(root, "_headers"), "utf8");
  const globalHeaders: Record<string, string> = {};
  let globalBlock = false;
  for (const line of headerSource.split(/\r?\n/)) {
    if (line.trim() === "/*") {
      globalBlock = true;
      continue;
    }
    if (line.length && !/^\s/.test(line)) globalBlock = false;
    const match = globalBlock && line.match(/^\s+([^:]+):\s*(.+)$/);
    if (match) globalHeaders[match[1].trim()] = match[2];
  }
  const requests: { path: string; method: string }[] = [];
  const server = createServer(async (request, response) => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(
        new URL(request.url || "/", "http://localhost").pathname,
      );
    } catch {
      response.writeHead(400).end();
      return;
    }
    requests.push({ path: pathname, method: request.method || "GET" });
    if (!["GET", "HEAD"].includes(request.method || "GET")) {
      response.writeHead(405).end();
      return;
    }
    let file = path.resolve(root, "." + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if (!(await stat(file).catch(() => null))?.isFile()) {
        if (path.extname(pathname)) {
          response.writeHead(404).end();
          return;
        }
        file = path.join(root, "index.html");
      }
      const resolved = await realpath(file);
      if (!resolved.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      const body = await readFile(resolved);
      response.writeHead(200, {
        ...globalHeaders,
        "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
        // Exclude reusable HTTP-cache responses from the outage proof. The
        // real service worker still fills its explicit public CacheStorage.
        "Cache-Control": "no-store",
        "Content-Length": body.length,
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch {
      response.writeHead(500).end();
    }
  });
  let running = false;
  const listen = async (port: number) => {
    await new Promise<void>((resolve, reject) => {
      const failed = (error: Error) => {
        server.off("listening", ready);
        reject(error);
      };
      const ready = () => {
        server.off("error", failed);
        resolve();
      };
      server.once("error", failed);
      server.once("listening", ready);
      server.listen(port, "127.0.0.1");
    });
    running = true;
  };
  await listen(0);
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Static PWA fixture has no TCP address");
  const port = address.port;
  const origin = `http://127.0.0.1:${port}`;
  const stop = async () => {
    if (!running) return;
    const closed = new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    server.closeAllConnections();
    await closed;
    running = false;
  };
  return {
    origin,
    build,
    requests,
    stop,
    resume: async () => {
      if (!running) await listen(port);
    },
  };
}
