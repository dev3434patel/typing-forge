import { useEffect, useState } from "react";

const DEVICE_PREFERENCES = "sparowtype.opening.preferences";
const PREFERENCES_CHANGED = "sparowtype:opening-preferences";
type OpeningPreferences = { language: string; reducedMotion: boolean };

function checked(value: unknown): OpeningPreferences {
  const input =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    language:
      typeof input.language === "string" &&
      /^[a-z-]{2,16}$/i.test(input.language)
        ? input.language
        : "en",
    reducedMotion: input.reducedMotion === true,
  };
}

function read(): OpeningPreferences {
  try {
    const device = localStorage.getItem(DEVICE_PREFERENCES);
    if (device) return checked(JSON.parse(device));
    const legacy = JSON.parse(
      localStorage.getItem("typingforge:v3:guest:preferences") || "null",
    );
    return checked(legacy?.schemaVersion === 3 ? legacy.values : legacy);
  } catch {
    return checked(null);
  }
}

/** Only non-sensitive device appearance hints are needed before account initialization. */
export function publishOpeningPreferences(value: OpeningPreferences) {
  const preferences = checked(value);
  try {
    localStorage.setItem(DEVICE_PREFERENCES, JSON.stringify(preferences));
  } catch {
    /* The event still updates the current page. */
  }
  window.dispatchEvent(
    new CustomEvent(PREFERENCES_CHANGED, { detail: preferences }),
  );
}

export function useOpeningPreferences() {
  const [preferences, setPreferences] = useState(read);
  useEffect(() => {
    const changed = (event: Event) => {
      const next =
        event instanceof CustomEvent ? checked(event.detail) : read();
      setPreferences((previous) =>
        previous.language === next.language &&
        previous.reducedMotion === next.reducedMotion
          ? previous
          : next,
      );
    };
    window.addEventListener(PREFERENCES_CHANGED, changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener(PREFERENCES_CHANGED, changed);
      window.removeEventListener("storage", changed);
    };
  }, []);
  return { preferences };
}
