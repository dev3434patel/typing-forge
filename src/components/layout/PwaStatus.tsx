import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import {
  applyPwaUpdate,
  getPwaState,
  installPwa,
  startPwa,
  subscribePwa,
} from "@/lib/pwa";
export function PwaStatus() {
  const [state, setState] = useState(getPwaState);
  const [installLater, setInstallLater] = useState(false);
  const [updateLater, setUpdateLater] = useState(false);
  useEffect(() => subscribePwa(() => setState(getPwaState())), []);
  useEffect(() => startPwa(), []);
  useEffect(() => {
    if (!state.updateAvailable) setUpdateLater(false);
  }, [state.updateAvailable]);
  if (
    !state.offline &&
    ((state.updateAvailable ? updateLater : installLater) ||
      (!state.updateAvailable && !state.installAvailable))
  )
    return null;
  return (
    <aside
      className="mx-5 mt-4 rounded-xl border bg-card px-4 py-3 text-sm sm:mx-8"
      aria-label="App availability"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        {state.offline ? (
          <>
            <p className="flex items-center gap-2" role="status">
              <WifiOff className="size-4 shrink-0" aria-hidden="true" /> Offline
              · practice and local saving can continue with downloaded app
              files.
            </p>
            <Link
              to="/offline"
              className="min-h-11 inline-flex items-center text-primary underline underline-offset-4"
            >
              Offline information
            </Link>
          </>
        ) : state.updateAvailable ? (
          <>
            <p className="flex-1 basis-56" role="status">
              An app update is ready. Finish or export current practice before
              reloading.
            </p>
            <button className="forge-button-secondary" onClick={applyPwaUpdate}>
              <RefreshCw className="size-4" aria-hidden="true" /> Reload to
              update
            </button>
            <button
              className="forge-icon-button"
              aria-label="Remind me about the update later"
              onClick={() => setUpdateLater(true)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 basis-56">
              Keep SparowType close with an optional app shortcut.
            </p>
            <button
              className="forge-button-secondary"
              onClick={() => void installPwa()}
            >
              <Download className="size-4" aria-hidden="true" /> Install app
            </button>
            <button
              className="forge-icon-button"
              aria-label="Dismiss installation suggestion"
              onClick={() => setInstallLater(true)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
