import { loadEnv } from "vite";

const publicEnv = loadEnv("production", process.cwd(), "VITE_");
/** Resolve the same public API base as the shipped browser bundle. */
export function phpApiBase(appUrl: string): URL {
  const base = publicEnv.VITE_API_BASE_URL?.trim() || "/api";
  return new URL(`${base.replace(/\/+$/, "")}/`, appUrl);
}
