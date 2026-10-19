import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  applyPwaUpdate,
  checkPwaDownload,
  clearPwaDownload,
  getPwaState,
  installPwa,
  subscribePwa,
} from "@/lib/pwa";
export default function Offline() {
  const [state, setState] = useState(getPwaState);
  const [busy, setBusy] = useState(false);
  useEffect(() => subscribePwa(() => setState(getPwaState())), []);
  const clear = async () => {
    setBusy(true);
    try {
      await clearPwaDownload();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main max-w-4xl space-y-8">
        <div>
          <p className="eyebrow">A little less dependent on a connection</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">
            Your offline workspace
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            After the public app download completes, this browser can reopen
            guest tests, adaptive lessons and the typing guide without a
            connection. Local history uses the same storage and scoring rules.
          </p>
        </div>
        <section className="panel p-5 sm:p-7" aria-labelledby="offline-status">
          <h2 id="offline-status" className="text-lg font-medium">
            This device
          </h2>
          <p className="mt-3 text-sm leading-relaxed" role="status">
            {state.message}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Connection: {state.offline ? "offline" : "online"} · Public
            download:{" "}
            {state.phase === "ready"
              ? "available"
              : state.phase === "preparing"
                ? "preparing"
                : state.phase === "error"
                  ? "needs attention"
                  : "not confirmed"}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="forge-button-secondary"
              disabled={busy || state.offline}
              onClick={() => void checkPwaDownload()}
            >
              Check offline download
            </button>
            {state.installAvailable && (
              <button
                className="forge-button-secondary"
                onClick={() => void installPwa()}
              >
                Install app
              </button>
            )}
            {state.updateAvailable && (
              <button className="forge-button" onClick={applyPwaUpdate}>
                Reload to apply update
              </button>
            )}
            <button
              className="forge-button-secondary"
              disabled={busy}
              onClick={() => void clear()}
            >
              {busy ? "Removing public files…" : "Remove offline download"}
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Removing public files does not delete typing history, preferences or
            account data. This open tab can remain controlled until it closes.
            Reopen online and use “Check offline download” to prepare the files
            again.
          </p>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="panel p-5 sm:p-7">
            <h2 className="text-lg font-medium">Ready for local practice</h2>
            <ul className="mt-4 list-disc pl-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>Timed and finite tests using bundled public content.</li>
              <li>Adaptive lessons, layout references and local results.</li>
              <li>Private custom practice while the workspace is open.</li>
              <li>JSON and image exports supported by your browser.</li>
            </ul>
          </div>
          <div className="panel p-5 sm:p-7">
            <h2 className="text-lg font-medium">A connection is needed</h2>
            <ul className="mt-4 list-disc pl-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>Sign in, account changes and cloud data operations.</li>
              <li>Server-issued ranked challenges and live rankings.</li>
              <li>Human race rooms and server-confirmed opponent progress.</li>
              <li>
                Preparing a new app version or restoring an evicted download.
              </li>
            </ul>
          </div>
        </section>
        <section className="panel p-5 sm:p-7">
          <h2 className="text-lg font-medium">A download is not a backup</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your browser can evict app files or local history to recover
            storage. Private browsing can be temporary. Use exports for records
            you want to keep. Cloud uploads wait for a working connection and
            remain provisional until accepted; offline mode does not create
            verified scores.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The worker downloads public program files and a generic shell. It
            does not cache authentication or personalized API responses.
            Browser support and installation menus vary; using a normal browser
            tab remains supported.
          </p>
          <Link
            className="text-primary underline underline-offset-4 mt-3 min-h-11 inline-flex items-center"
            to="/privacy"
          >
            Read the data details
          </Link>
        </section>
        <div className="flex flex-wrap gap-4">
          <Link className="forge-button" to="/">
            Open typing practice
          </Link>
          <Link className="forge-button-secondary" to="/learn">
            Open adaptive lessons
          </Link>
          <Link className="forge-button-secondary" to="/settings">
            Export your history
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
