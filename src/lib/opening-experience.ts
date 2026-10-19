export const INTRO_ENABLED_STORAGE_KEY = "sparowtype.opening-animation.enabled";
export const INTRO_SEEN_SESSION_KEY = "sparowtype.opening-animation.seen";
export const INTRO_REPLAY_EVENT = "sparowtype:replay-intro";
export const INTRO_PREFERENCE_EVENT = "sparowtype:intro-preference";
export const INTRO_DURATION_MS = 4200;
/** Bound asset/GPU preparation separately so it cannot consume the animation. */
export const INTRO_PREPARATION_TIMEOUT_MS = 6000;
export const INTRO_RETURN_DURATION_MS = 900;
export const INTRO_REDUCED_DURATION_MS = 300;
export type OpeningMode = "full" | "returning" | "reduced" | "off";

let preferenceInMemory: boolean | undefined;
let memoryPreferenceOnly = false;
let seenInMemory = false;

export function getOpeningAnimationEnabled(): boolean {
  if (memoryPreferenceOnly) return preferenceInMemory ?? true;
  try {
    return window.localStorage.getItem(INTRO_ENABLED_STORAGE_KEY) !== "false";
  } catch {
    return preferenceInMemory ?? true;
  }
}

export function setOpeningAnimationEnabled(enabled: boolean): void {
  preferenceInMemory = enabled;
  try {
    window.localStorage.setItem(INTRO_ENABLED_STORAGE_KEY, String(enabled));
    memoryPreferenceOnly = false;
  } catch {
    // A blocked or full storage area must not prevent a device preference change.
    memoryPreferenceOnly = true;
  }
  window.dispatchEvent(
    new CustomEvent(INTRO_PREFERENCE_EVENT, {
      detail: { enabled },
    }),
  );
}

export function prefersReducedOpeningMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function hasSeenOpeningExperience(): boolean {
  if (seenInMemory) return true;
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOpeningExperienceSeen(): void {
  seenInMemory = true;
  try {
    window.sessionStorage.setItem(INTRO_SEEN_SESSION_KEY, "true");
  } catch {
    // The in-memory flag still prevents a replay during this page's lifetime.
  }
}

export function shouldShowOpeningExperience(): boolean {
  return getOpeningMode() !== "off";
}

export function getOpeningMode(reducedMotion = false): OpeningMode {
  if (
    typeof window === "undefined" ||
    !["/", "/typing-test"].includes(window.location.pathname) ||
    !getOpeningAnimationEnabled()
  )
    return "off";
  if (reducedMotion || prefersReducedOpeningMotion()) return "reduced";
  return hasSeenOpeningExperience() ? "returning" : "full";
}

export function openingDuration(mode: OpeningMode): number {
  return mode === "full"
    ? INTRO_DURATION_MS
    : mode === "returning"
      ? INTRO_RETURN_DURATION_MS
      : mode === "reduced"
        ? INTRO_REDUCED_DURATION_MS
        : 0;
}

export function shouldUseLowPowerScene(device: {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  coarsePointer?: boolean;
}): boolean {
  return (
    (device.hardwareConcurrency !== undefined &&
      device.hardwareConcurrency <= 4) ||
    (device.deviceMemory !== undefined && device.deviceMemory <= 4) ||
    device.coarsePointer === true
  );
}

/** Manual replay does not change the automatic-opening preference. */
export function replayOpeningAnimation(): void {
  window.dispatchEvent(new Event(INTRO_REPLAY_EVENT));
}
