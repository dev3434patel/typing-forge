import { APP_BASE_PATH, appPath, PUBLIC_CACHE_PREFIX } from "./deployment";
const CACHE_PREFIX = PUBLIC_CACHE_PREFIX;
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export interface PwaState {
  supported: boolean;
  phase: "idle" | "preparing" | "ready" | "unavailable" | "error";
  offline: boolean;
  installed: boolean;
  installAvailable: boolean;
  updateAvailable: boolean;
  message: string;
}
let state: PwaState = {
  supported: false,
  phase: "idle",
  offline: false,
  installed: false,
  installAvailable: false,
  updateAvailable: false,
  message: "Offline availability has not been checked.",
};
const listeners = new Set<() => void>();
let registration: ServiceWorkerRegistration | null = null;
const registrationRequests = new Set<Promise<ServiceWorkerRegistration>>();
const removalCandidates = new Set<ServiceWorkerRegistration>();
let installPrompt: InstallPrompt | null = null;
let cleanup: (() => void) | null = null;
let explicitReload = false;
let reloading = false;
let registerGeneration = 0;
let readinessRevision = 0;
let documentCleanup: (() => void) | null = null;
let documentSuspended = false;
const readinessCancellations = new Set<() => void>();
const READINESS_MESSAGE = "SPAROWTYPE_PUBLIC_READINESS_V1";
const READINESS_TIMEOUT_MS = 3_000;
function cancelReadinessChecks() {
  for (const cancel of [...readinessCancellations]) cancel();
}
/** Reads only the public worker's boolean; a departing document never opens caches. */
function workerHasOfflineApp(value: ServiceWorkerRegistration): Promise<boolean> {
  const worker = value.waiting ?? value.active ?? value.installing;
  if (!worker || typeof MessageChannel === "undefined")
    return Promise.resolve(false);
  return new Promise((resolve) => {
    let channel: MessageChannel | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    const finish = (ready: boolean) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      readinessCancellations.delete(cancel);
      if (channel) {
        channel.port1.onmessage = null;
        channel.port1.onmessageerror = null;
        channel.port1.close();
        channel.port2.close();
      }
      resolve(ready);
    };
    const cancel = () => finish(false);
    try {
      channel = new MessageChannel();
      readinessCancellations.add(cancel);
      channel.port1.onmessage = (event: MessageEvent) => {
        if (
          event.data?.type === READINESS_MESSAGE &&
          typeof event.data.ready === "boolean"
        )
          finish(event.data.ready);
      };
      channel.port1.onmessageerror = cancel;
      timer = setTimeout(cancel, READINESS_TIMEOUT_MS);
      worker.postMessage({ type: READINESS_MESSAGE }, [channel.port2]);
    } catch {
      finish(false);
    }
  });
}
/** Always stops the current generation, including one created by manual reprepare. */
export function stopCurrentPwa(): void {
  cleanup?.();
}
/** Own registration before React's lazy workspace and its passive effects render. */
export function startPwaDocumentLifetime(
  enabled = import.meta.env.PROD,
): () => void {
  if (documentCleanup) return () => {};
  if (typeof window === "undefined") return () => {};
  const hidden = () => {
    documentSuspended = true;
    stopCurrentPwa();
  };
  const shown = (event: PageTransitionEvent) => {
    if (event.persisted) {
      documentSuspended = false;
      startPwa(enabled);
    }
  };
  const stop = () => {
    if (documentCleanup !== stop) return;
    window.removeEventListener("pagehide", hidden);
    window.removeEventListener("pageshow", shown);
    documentCleanup = null;
    documentSuspended = false;
    stopCurrentPwa();
  };
  documentCleanup = stop;
  documentSuspended = false;
  window.addEventListener("pagehide", hidden);
  window.addEventListener("pageshow", shown);
  startPwa(enabled);
  return stop;
}
function update(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}
export function getPwaState(): PwaState {
  return state;
}
export function subscribePwa(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function isPublicAppCache(name: string): boolean {
  return name.startsWith(CACHE_PREFIX);
}
export async function hasOfflineApp(
  cacheStorage: CacheStorage | undefined = globalThis.caches,
): Promise<boolean> {
  try {
    if (!cacheStorage) return false;
    for (const name of (await cacheStorage.keys()).filter(isPublicAppCache)) {
      const cache = await cacheStorage.open(name);
      if (
        (await cache.match(appPath("/index.html"))) &&
        (await cache.match(appPath("/_offline-recovery.html")))
      )
        return true;
    }
  } catch {
    /* Browser storage can be unavailable even when the API exists. */
  }
  return false;
}
/** Registers only the public production worker; never requests install permission. */
export function startPwa(enabled = import.meta.env.PROD): () => void {
  if (cleanup || documentSuspended) return () => {};
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return () => {};
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  update({ offline: !navigator.onLine, installed: Boolean(standalone) });
  const online = () => update({ offline: !navigator.onLine });
  const beforeInstall = (event: Event) => {
    if (!("prompt" in event) || typeof event.prompt !== "function") return;
    event.preventDefault();
    installPrompt = event as InstallPrompt;
    update({ installAvailable: !state.installed });
  };
  const installed = () => {
    installPrompt = null;
    update({ installed: true, installAvailable: false });
  };
  const changed = () => {
    if (explicitReload && !reloading) {
      reloading = true;
      location.reload();
    }
  };
  window.addEventListener("online", online);
  window.addEventListener("offline", online);
  window.addEventListener("beforeinstallprompt", beforeInstall);
  window.addEventListener("appinstalled", installed);
  const supported =
    enabled && window.isSecureContext && "serviceWorker" in navigator;
  let detachRegistration = () => {};
  const stop = () => {
    if (cleanup !== stop) return;
    registerGeneration++;
    cancelReadinessChecks();
    window.removeEventListener("online", online);
    window.removeEventListener("offline", online);
    window.removeEventListener("beforeinstallprompt", beforeInstall);
    window.removeEventListener("appinstalled", installed);
    navigator.serviceWorker?.removeEventListener("controllerchange", changed);
    detachRegistration();
    cleanup = null;
  };
  cleanup = stop;
  if (!supported) {
    update({
      supported: false,
      phase: "unavailable",
      message: enabled
        ? "This browser or connection does not support the public offline download. Local results can still be saved while this page is open."
        : "Offline downloads are prepared in a production build. Local practice remains available in this open page.",
    });
    return cleanup;
  }
  update({
    supported: true,
    phase: "preparing",
    message: "Preparing public app files for offline practice…",
  });
  const generation = ++registerGeneration;
  navigator.serviceWorker.addEventListener("controllerchange", changed);
  let requested: Promise<ServiceWorkerRegistration>;
  try {
    requested = navigator.serviceWorker.register(appPath("/sw.js"), {
      scope: APP_BASE_PATH,
      updateViaCache: "none",
    });
  } catch {
    update({
      phase: "error",
      message:
        "Offline files could not be prepared. Your local results are unchanged. Reconnect and try the offline controls again.",
    });
    return cleanup;
  }
  registrationRequests.add(requested);
  void requested
    .then(async (value) => {
      if (generation !== registerGeneration) {
        // A timed-out removal must still be able to find this late result on
        // retry. Do not revive its readiness/status observers.
        removalCandidates.add(value);
        return;
      }
      registration = value;
      const refresh = async () => {
        if (generation !== registerGeneration) return;
        const revision = ++readinessRevision;
        cancelReadinessChecks();
        const ready = await workerHasOfflineApp(value);
        if (
          generation !== registerGeneration ||
          registration !== value ||
          revision !== readinessRevision
        ) return;
        update({
          phase: ready ? "ready" : "preparing",
          updateAvailable: Boolean(
            value.waiting && navigator.serviceWorker.controller,
          ),
          message: ready
            ? "Public app files are available on this device. Account requests and live competitions still need a connection."
            : "The public app download has not finished. Keep this page open while connected.",
        });
      };
      const observe = () => {
        const worker = value.installing;
        if (!worker) return;
        const changedState = () => {
          if (generation !== registerGeneration) return;
          if (worker.state === "redundant")
            update({
              phase: "error",
              message:
                "The offline download could not complete. Your typing history is unchanged; retry when connected.",
            });
          else if (worker.state === "installed" || worker.state === "activated")
            void refresh();
        };
        worker.addEventListener("statechange", changedState);
        const previousDetach = detachRegistration;
        detachRegistration = () => {
          previousDetach();
          worker.removeEventListener("statechange", changedState);
        };
        changedState();
      };
      value.addEventListener("updatefound", observe);
      const previousDetach = detachRegistration;
      detachRegistration = () => {
        previousDetach();
        value.removeEventListener("updatefound", observe);
      };
      observe();
      await refresh();
    })
    .catch(() => {
      if (generation === registerGeneration)
        update({
          phase: "error",
          message:
            "Offline files could not be prepared. Your local results are unchanged. Reconnect and try the offline controls again.",
        });
    })
    .finally(() => {
      registrationRequests.delete(requested);
    });
  return cleanup;
}
export async function checkPwaDownload(): Promise<void> {
  if (documentSuspended) return;
  if (!registration) {
    cleanup?.();
    startPwa();
    return;
  }
  const current = registration;
  const generation = registerGeneration;
  const revision = ++readinessRevision;
  cancelReadinessChecks();
  const isCurrent = () =>
    !documentSuspended &&
    registration === current &&
    generation === registerGeneration &&
    revision === readinessRevision;
  try {
    await current.update();
    if (!isCurrent()) return;
    const ready = await workerHasOfflineApp(current);
    if (!isCurrent()) return;
    update({
      phase: ready ? "ready" : "preparing",
      updateAvailable: Boolean(current.waiting),
      message: ready
        ? "Public app files are available on this device."
        : "The download is still being prepared. Keep this page open while connected.",
    });
  } catch {
    if (isCurrent())
      update({
        message:
          "Could not check for a new download. Reconnect and try again; existing local history is unchanged.",
      });
  }
}
export async function installPwa(): Promise<void> {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = null;
  update({ installAvailable: false });
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted")
      update({
        message:
          "Installation was requested. Your browser completes the installation.",
      });
  } catch {
    update({
      message:
        "Installation was not completed. Your browser may offer its own install menu.",
    });
  }
}
export function applyPwaUpdate(): void {
  if (!registration?.waiting) return;
  explicitReload = true;
  registration.waiting.postMessage({ type: "ACTIVATE_UPDATE" });
}
function waitForInstaller(worker: ServiceWorker | null): Promise<void> {
  if (!worker || ["installed", "activated", "redundant"].includes(worker.state))
    return Promise.resolve();
  return new Promise((resolve, reject) => {
    const stop = () => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", changed);
    };
    const changed = () => {
      if (!["installed", "activated", "redundant"].includes(worker.state)) return;
      stop();
      resolve();
    };
    const timer = setTimeout(() => {
      stop();
      reject(new Error("The offline installer is still running."));
    }, 10_000);
    worker.addEventListener("statechange", changed);
    changed();
  });
}
function boundedRemovalWait<T>(pending: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("The browser did not finish the offline operation."));
    }, 10_000);
  });
  return Promise.race([pending, deadline]).finally(() => clearTimeout(timer));
}
/** Removes only this app's public downloads; IndexedDB/history/preferences are untouched. */
export async function clearPwaDownload(): Promise<void> {
  // Registration and cache installation can still be in flight when the user
  // removes a download. Finish cancelling that installer before deleting its
  // files, otherwise it can write the download back after removal succeeds.
  const requested = [...registrationRequests];
  if (registration) removalCandidates.add(registration);
  registerGeneration++;
  cancelReadinessChecks();
  explicitReload = false;
  reloading = false;
  registration = null;
  try {
    const resolved = await boundedRemovalWait(Promise.allSettled(requested));
    for (const result of resolved)
      if (result.status === "fulfilled") removalCandidates.add(result.value);
    for (const current of [...removalCandidates]) {
      const installing = current.installing;
      await boundedRemovalWait(current.unregister());
      await waitForInstaller(installing);
      removalCandidates.delete(current);
    }
    if (typeof caches !== "undefined")
      await Promise.all(
        (await caches.keys())
          .filter(isPublicAppCache)
          .map((name) => caches.delete(name)),
      );
    update({
      phase: "idle",
      updateAvailable: false,
      message:
        "Public offline files removed. Your typing history and preferences are unchanged. This open tab may keep its current worker until it closes.",
    });
  } catch {
    update({
      phase: "error",
      message:
        "Some public offline files could not be removed. Retry removal when the browser finishes its download, or use your browser’s site controls; typing history was not reset.",
    });
  }
}
