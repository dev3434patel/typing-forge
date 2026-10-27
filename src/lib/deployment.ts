/** URL paths belong to this installation, independently of local data owners. */
export const APP_BASE_PATH = import.meta.env?.BASE_URL || "/";
export const APP_ROUTER_BASENAME =
  APP_BASE_PATH === "/" ? "/" : APP_BASE_PATH.replace(/\/$/, "");
export const DEPLOYMENT_TARGET =
  import.meta.env?.VITE_DEPLOYMENT_TARGET || "php";
export const FRONTEND_ONLY =
  DEPLOYMENT_TARGET === "vercel" || DEPLOYMENT_TARGET === "github-pages";
export const PUBLIC_SITE_URL = import.meta.env?.VITE_PUBLIC_SITE_URL || "";

export function appPath(pathname = "/"): string {
  return APP_BASE_PATH + pathname.replace(/^\/+/, "");
}

export function localRoutePath(pathname: string): string | null {
  if (APP_BASE_PATH === "/") return pathname;
  const base = APP_ROUTER_BASENAME;
  if (pathname === base) return "/";
  return pathname.startsWith(APP_BASE_PATH)
    ? "/" + pathname.slice(APP_BASE_PATH.length)
    : null;
}

// Scope new subpath caches so removing one installation cannot remove another.
// Root installs retain their existing cache namespace and update behavior.
export const PUBLIC_CACHE_PREFIX =
  APP_BASE_PATH === "/"
    ? "sparowtype-public-v1-"
    : `sparowtype-public-subpath-${encodeURIComponent(APP_BASE_PATH)}-`;
