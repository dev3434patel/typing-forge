import type { LearningSessionEvidence } from "@/lib/learning-evidence";
import type { SessionMetricValues } from "@/lib/typing-core/types";
import type { TestResult } from "@/lib/typing-engine";

export interface AuthUser { id: string; email: string; handle: string; created_at: string }
export interface AuthSession { user: AuthUser | null; csrfToken: string }
export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  expectedOwner?: string;
  signal?: AbortSignal;
}
export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";
export const isBackendConfigured = configuredBase !== "disabled" && (() => {
  if (configuredBase.startsWith("/") && !configuredBase.startsWith("//")) return true;
  try { return ["http:", "https:"].includes(new URL(configuredBase).protocol); } catch { return false; }
})();
export const API_BASE_URL = configuredBase.replace(/\/+$/, "");
let csrfToken = "";
let csrfBootstrap: Promise<void> | null = null;

async function request<T>(path: string, options: ApiRequestOptions, csrfRetry: boolean): Promise<T> {
  if (!isBackendConfigured) throw new ApiError("backend-unavailable", "Account services are disabled. Your local practice remains available.", 503);
  const method = options.method ?? "GET";
  const mutating = method !== "GET";
  if (mutating && !csrfToken) {
    csrfBootstrap ??= request<AuthSession>("/auth/session", {}, false).then(() => undefined).finally(() => { csrfBootstrap = null; });
    await csrfBootstrap;
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  const body = options.expectedOwner !== undefined
    ? { ...(options.body && typeof options.body === "object" ? options.body : {}), expectedOwner: options.expectedOwner }
    : options.body;
  try {
    const ownerQuery = !mutating && options.expectedOwner !== undefined
      ? `${path.includes("?") ? "&" : "?"}expectedOwner=${encodeURIComponent(options.expectedOwner)}` : "";
    const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}${ownerQuery}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json", ...(mutating ? { "Content-Type": "application/json", "X-CSRF-Token": csrfToken } : {}) },
      ...(mutating ? { body: JSON.stringify(body ?? {}) } : {}),
      signal: controller.signal,
    });
    let payload: unknown;
    try { payload = await response.json(); }
    catch { throw new ApiError("invalid-response", "The PHP API returned an unreadable response. Check its URL and server configuration.", response.status || 502); }
    if (!payload || typeof payload !== "object") throw new ApiError("invalid-response", "The PHP API returned an invalid response.", response.status || 502);
    const value = payload as { csrfToken?: unknown; error?: { code?: unknown; message?: unknown } };
    if (typeof value.csrfToken === "string") csrfToken = value.csrfToken;
    if (!response.ok || value.error) {
      const code = typeof value.error?.code === "string" ? value.error.code : "request-failed";
      if (mutating && csrfRetry && ["csrf", "csrf-invalid", "csrf-required", "invalid-csrf"].includes(code)) {
        csrfToken = "";
        return request<T>(path, options, false);
      }
      throw new ApiError(code, typeof value.error?.message === "string" ? value.error.message : "The account request could not be completed.", response.status);
    }
    return payload as T;
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    if (cause instanceof Error && cause.name === "AbortError") throw new ApiError("request-aborted", "The account request timed out or was canceled. Your local data is retained.", 0);
    throw new ApiError("network", "The PHP API could not be reached. Your local practice and history remain available.", 0);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
export function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> { return request<T>(path, options, true); }

const AUTH_EVENT_KEY = "sparowtype:auth-changed";
let currentSession: AuthSession | null = null;
let generation = 0;
const listeners = new Set<(session: AuthSession) => void>();
let stopSignals: (() => void) | null = null;
function publish(session: AuthSession, broadcast = false) {
  generation++;
  currentSession = session;
  listeners.forEach(listener => listener(session));
  if (broadcast && typeof window !== "undefined") {
    try { localStorage.setItem(AUTH_EVENT_KEY, `${Date.now()}:${Math.random()}`); } catch { /* Cookie authentication also refreshes on focus. */ }
  }
}
async function getSession(): Promise<AuthSession> {
  const before = generation;
  const session = await apiRequest<AuthSession>("/auth/session");
  if (generation !== before && currentSession) return currentSession;
  // An authenticated data operation can discover expiry before the next focus
  // event. Publish that owner change so /auth remains reachable for signing in.
  if (!currentSession || currentSession.user?.id !== session.user?.id) publish(session);
  else currentSession = session;
  return session;
}
export const authService = {
  getSession,
  currentSession: () => currentSession,
  subscribe(listener: (session: AuthSession) => void) {
    listeners.add(listener);
    if (!stopSignals && typeof window !== "undefined") {
      const refresh = () => { void getSession().then(session => publish(session)).catch(() => undefined); };
      const storage = (event: StorageEvent) => { if (event.key === AUTH_EVENT_KEY) refresh(); };
      const visible = () => { if (document.visibilityState === "visible") refresh(); };
      window.addEventListener("storage", storage);
      window.addEventListener("focus", refresh);
      document.addEventListener("visibilitychange", visible);
      stopSignals = () => {
        window.removeEventListener("storage", storage);
        window.removeEventListener("focus", refresh);
        document.removeEventListener("visibilitychange", visible);
      };
    }
    return () => {
      listeners.delete(listener);
      if (!listeners.size) { stopSignals?.(); stopSignals = null; }
    };
  },
  async signIn(email: string, password: string) {
    const session = await apiRequest<AuthSession>("/auth/signin", { method: "POST", body: { email, password } });
    publish(session, true);
    return session;
  },
  async signUp(email: string, password: string) {
    const session = await apiRequest<AuthSession>("/auth/signup", { method: "POST", body: { email, password } });
    publish(session, true);
    return session;
  },
  async signOut(expectedOwner = currentSession?.user?.id) {
    const session = await apiRequest<AuthSession>("/auth/signout", { method: "POST", expectedOwner });
    publish(session, true);
  },
  async refresh() { const session = await getSession(); publish(session); return session; },
};

export interface AccountSessionRow {
  clientSessionId: string; accepted: Record<string, unknown>; summary: TestResult;
  createdAt: number; payloadHash: string; comparisonKey?: string;
  metrics?: SessionMetricValues; personalBestEligible?: boolean; metricsVersion: string;
}
export interface AccountHistoryPage { sessions: AccountSessionRow[]; learningEvidence: LearningSessionEvidence[]; version: number; hasMore: boolean }
export interface PreferenceResponse { preferences: unknown; version: number; conflict?: boolean }
export interface RankedCohort { comparison_key: string; participants: number }
export interface RankedEntry {
  position: number; user_id: string; handle: string; best_wpm: number; avg_accuracy: number;
  test_count: number; total_entries: number; is_own: boolean;
}
export const accountApi = {
  profile: (owner?: string) => apiRequest<{ id: string; handle: string }>("/profile", { expectedOwner: owner }),
  updateProfile: (owner: string, handle: string) => apiRequest<{ id: string; handle: string }>("/profile", { method: "POST", body: { handle }, expectedOwner: owner }),
  preferences: (owner?: string) => apiRequest<PreferenceResponse>("/preferences", { expectedOwner: owner }),
  updatePreferences: (owner: string, expectedVersion: number, patch: unknown) => apiRequest<PreferenceResponse>("/preferences", { method: "POST", body: { expectedVersion, patch }, expectedOwner: owner }),
  history: (offset: number, limit = 500, owner?: string) => apiRequest<AccountHistoryPage>(`/sessions?offset=${offset}&limit=${limit}`, { expectedOwner: owner }),
  dataVersion: (owner?: string) => apiRequest<{ version: number }>("/data/version", { expectedOwner: owner }),
  submit: (candidate: unknown, cloudConsent: boolean, expectedOwner: string) => apiRequest<{ accepted: unknown }>("/sessions", { method: "POST", body: { candidate, cloudConsent }, expectedOwner }),
  deleteSession: (owner: string, id: string) => apiRequest<{ deleted: boolean }>(`/sessions/${encodeURIComponent(id)}`, { method: "DELETE", expectedOwner: owner }),
  deleteAccount: (owner: string) => apiRequest<{ deleted: boolean }>("/account/delete", { method: "POST", body: { confirmation: "DELETE MY ACCOUNT" }, expectedOwner: owner }),
  cohorts: () => apiRequest<{ cohorts: RankedCohort[] }>("/leaderboards/cohorts"),
  rankings: (comparisonKey: string, period: "alltime" | "day" | "week", offset: number) => apiRequest<{ entries: RankedEntry[]; total: number }>(`/leaderboards?${new URLSearchParams({ comparisonKey, period, limit: "25", offset: String(offset) })}`),
};
