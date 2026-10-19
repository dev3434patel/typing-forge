const CACHE_PREFIX = "sparowtype-public-v1-";
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
        (await cache.match("/index.html")) &&
        (await cache.match("/_offline-recovery.html"))
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
  if (cleanup) return () => {};
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
  cleanup = () => {
    registerGeneration++;
    window.removeEventListener("online", online);
    window.removeEventListener("offline", online);
    window.removeEventListener("beforeinstallprompt", beforeInstall);
    window.removeEventListener("appinstalled", installed);
    navigator.serviceWorker?.removeEventListener("controllerchange", changed);
    detachRegistration();
    cleanup = null;
  };
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
  const requested = navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
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
        const ready = await hasOfflineApp();
        if (generation !== registerGeneration) return;
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
  if (!registration) {
    cleanup?.();
    startPwa();
    return;
  }
  const current = registration;
  try {
    await current.update();
    const ready = await hasOfflineApp();
    if (registration !== current) return;
    update({
      phase: ready ? "ready" : "preparing",
      updateAvailable: Boolean(current.waiting),
      message: ready
        ? "Public app files are available on this device."
        : "The download is still being prepared. Keep this page open while connected.",
    });
  } catch {
    if (registration === current)
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
