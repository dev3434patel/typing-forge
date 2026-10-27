import { Fragment, useEffect, useState, type ReactNode } from "react";
import { matchRoutes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isBackendConfigured } from "@/services/php-api";
import { subscribeWorkspaceReset, subscribeWorkspaceResetResult } from "@/services/workspace-reset";

function WorkspaceResetBoundary({ ownerId, children }: { ownerId: string; children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => subscribeWorkspaceReset(reset => {
    if (reset.ownerId === ownerId) setRevision(value => value + 1);
  }), [ownerId]);
  useEffect(() => subscribeWorkspaceResetResult(result => { if (result.ownerId === ownerId) setMessage(result.message); }), [ownerId]);
  return <>{message && <aside className="mx-4 mt-4 rounded-xl border bg-card p-4 text-sm flex flex-wrap items-center justify-between gap-3" role="status" aria-live="polite"><span>{message}</span><button className="forge-button-secondary" onClick={() => setMessage('')}>Dismiss</button></aside>}<Fragment key={revision}>{children}</Fragment></>;
}

const ownerRoutes = [
  "/", "/typing-test", "/learn", "/typing-practice", "/practice",
  "/lessons", "/games", "/race", "/race/:roomCode", "/stats",
  "/profile", "/settings", "/ranked", "/keyboard-lab",
  "/arcade", "/arcade/:gameId", "/progression", "/studio", "/classroom",
  "/friends", "/arena", "/arena/:roomCode",
].map(path => ({ path }));

/** Match the router's decoded, case-insensitive paths, including its aliases. */
function isOwnerScopedWorkspace(pathname: string): boolean {
  return matchRoutes(ownerRoutes, pathname) !== null;
}

/** An owner switch resets transient private passages, results and route UI. */
export function AccountWorkspace({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  // A real cookie session may resolve after local guest history. Do not mount
  // an interactive controller under a provisional guest owner and discard it
  // on hydration. Static/offline installations bypass account preparation.
  if (isBackendConfigured && loading && isOwnerScopedWorkspace(pathname)) {
    return <main id="workspace-preparation" className="forge-main py-24 text-muted-foreground" role="status" aria-label="Preparing account workspace" aria-live="polite" aria-busy="true">
      Checking your account and preparing this workspace…
    </main>;
  }
  const ownerId = user?.id ?? "guest";
  return <Fragment key={ownerId}><WorkspaceResetBoundary ownerId={ownerId}>{children}</WorkspaceResetBoundary></Fragment>;
}
