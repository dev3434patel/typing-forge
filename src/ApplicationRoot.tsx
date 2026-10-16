import { lazy, Suspense, useEffect } from "react";
import { OpeningExperience } from "./components/brand/OpeningExperience";
import { loadWorkspace } from "./workspace-loader";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { scheduleAfterFirstPaint } from "./lib/after-first-paint";

const Workspace = lazy(loadWorkspace);

export default function ApplicationRoot() {
  useEffect(() => {
    // Useful opening content paints before account providers and workspace CSS.
    return scheduleAfterFirstPaint(() => {
      void loadWorkspace().catch(() => undefined);
    });
  }, []);
  return (
    <ErrorBoundary>
      <OpeningExperience>
        <Suspense
          fallback={
            <main className="workspace-loading" aria-label="Typing workspace">
              <p role="status">Preparing your typing workspace…</p>
            </main>
          }
        >
          <Workspace />
        </Suspense>
      </OpeningExperience>
    </ErrorBoundary>
  );
}
