import { localRoutePath } from "./lib/deployment";

export function shouldWarmHomeWorkspace(pathname: string): boolean {
  const local = localRoutePath(pathname);
  if (local === null) return false;
  return ["/", "/typing-test"].includes(local.replace(/\/+$/, "") || "/");
}

/** Share preparation across the opening and React without caching a failure. */
export function createWorkspaceLoader<T>(importWorkspace: () => Promise<T>) {
  let workspace: Promise<T> | undefined;
  return () =>
    (workspace ??= importWorkspace().catch((error) => {
      workspace = undefined;
      throw error;
    }));
}

// Preserve concurrent home preparation during the opening. Other destinations
// select their own lazy route without depending on an unused home-page chunk.
export const loadWorkspace = createWorkspaceLoader(() => {
  const application = import("./App");
  return typeof window !== "undefined" &&
    shouldWarmHomeWorkspace(window.location.pathname)
    ? Promise.all([application, import("./pages/Index")]).then(([module]) => module)
    : application;
});
