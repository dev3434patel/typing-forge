import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { applyTheme } from "@/lib/themes";
import { useAuth } from "@/hooks/useAuth";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  PREFERENCE_DEFAULTS,
  validatePreferences,
  validatePreferencePatch,
  mergeCloudPreferences,
  acknowledgePreferences,
  type PreferenceEnvelope,
} from "@/services/preferences-store";
import { useTestStore } from "@/stores/test-store";
import { sessionRepository } from "@/services/session-repository";
import { publishOpeningPreferences } from "@/lib/opening-preferences";
export interface Preferences {
  theme: string;
  targetWpm: number;
  language: string;
  layout: string;
  fontSize: number;
  caretStyle: "line" | "block" | "underline" | "outline";
  smoothCaret: boolean;
  sound: boolean;
  soundPack: "soft" | "mechanical" | "typewriter" | "arcade" | "minimal";
  reducedMotion: boolean;
  volume: number;
  dailyGoalMinutes: number;
  liveStats: boolean;
  focusMode: boolean;
  paceCaret: boolean;
}
export const DEFAULT_PREFERENCES = PREFERENCE_DEFAULTS;
const memory = new Map<string, PreferenceEnvelope>();
function read(key: string): PreferenceEnvelope {
  if (memory.has(key)) return memory.get(key)!;
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "null");
    const versioned = raw?.schemaVersion === 3;
    const values = validatePreferences(versioned ? raw.values : raw);
    const entry: PreferenceEnvelope = {
      schemaVersion: 3,
      values,
      pending: versioned
        ? validatePreferencePatch(raw.pending, values)
        : raw
          ? values
          : {},
      cloudVersion:
        versioned && Number.isFinite(raw.cloudVersion) ? raw.cloudVersion : 0,
      updatedAt:
        versioned && Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
    };
    memory.set(key, entry);
    return entry;
  } catch {
    return {
      schemaVersion: 3,
      values: { ...DEFAULT_PREFERENCES },
      pending: {},
      cloudVersion: 0,
      updatedAt: 0,
    };
  }
}
type Value = {
  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;
  resetPreferences: () => void;
  storageAvailable: boolean;
  preferenceSyncStatus: string;
};
const Context = createContext<Value | undefined>(undefined);
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(),
    owner = user?.id ?? "guest",
    key = `typingforge:v3:${owner}:preferences`;
  const [entry, setEntry] = useState(() => ({ key, envelope: read(key) })),
    [storageAvailable, setStorageAvailable] = useState(true),
    [preferenceSyncStatus, setStatus] = useState(
      "Preferences saved on this device.",
    ),
    [ready, setReady] = useState(""),
    [retry, setRetry] = useState(0);
  const current = useRef({ key, owner, envelope: entry.envelope });
  const deferred = useRef<{ key: string; values: Preferences } | null>(null);
  if (current.current.key !== key)
    current.current = { key, owner, envelope: read(key) };
  const envelope =
    entry.key === key ? entry.envelope : current.current.envelope;
  const persist = useCallback(
    (next: PreferenceEnvelope) => {
      if (current.current.key !== key) return;
      current.current.envelope = next;
      memory.set(key, next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
      setEntry({ key, envelope: next });
    },
    [key],
  );
  const acceptCloud = useCallback(
    (next: PreferenceEnvelope) => {
      const focused = document.activeElement;
      const typing =
        useTestStore.getState().status === "running" ||
        (focused instanceof HTMLTextAreaElement && focused.value.length > 0);
      if (typing) {
        deferred.current = { key, values: next.values };
        persist({
          ...next,
          values: validatePreferences({
            ...current.current.envelope.values,
            ...next.pending,
          }),
        });
      } else {
        deferred.current = null;
        persist(next);
      }
    },
    [key, persist],
  );
  useEffect(() => {
    setEntry({ key, envelope: read(key) });
    setReady("");
    let active = true;
    if (owner === "guest" || !isSupabaseConfigured) {
      setStatus("Preferences saved on this device.");
      setReady(key);
      return;
    }
    setStatus("Checking account preferences…");
    void Promise.resolve(
      supabase
        .from("user_preferences" as never)
        .select("preferences,version")
        .eq("user_id", owner)
        .maybeSingle(),
    )
      .then(({ data, error }) => {
        if (!active || current.current.key !== key) return;
        if (error) {
          setStatus(
            `Preferences saved locally. Account sync unavailable: ${error.message}`,
          );
          setReady(key);
          return;
        }
        const cloud = data as unknown as {
          preferences: unknown;
          version: number;
        } | null;
        if (cloud)
          acceptCloud(mergeCloudPreferences(current.current.envelope, cloud));
        setStatus(
          Object.keys(current.current.envelope.pending).length
            ? "Preferences saved locally; account sync pending."
            : "Preferences are up to date.",
        );
        setReady(key);
      })
      .catch((cause) => {
        if (active && current.current.key === key) {
          setStatus(
            `Preferences saved locally. ${cause instanceof Error ? cause.message : "Account sync failed."}`,
          );
          setReady(key);
        }
      });
    return () => {
      active = false;
    };
  }, [key, owner, acceptCloud, retry]);
  useEffect(() => {
    if (
      ready !== key ||
      owner === "guest" ||
      !isSupabaseConfigured ||
      !Object.keys(envelope.pending).length
    )
      return;
    let active = true;
    const timer = setTimeout(() => {
      const snapshot = current.current.envelope;
      const sent = { ...snapshot.pending };
      setStatus("Saving preferences to your account…");
      void Promise.resolve(
        supabase.rpc(
          "forge_update_preferences" as never,
          {
            p_owner: owner,
            p_expected_version: snapshot.cloudVersion,
            p_patch: sent,
          } as never,
        ),
      )
        .then(({ data, error }) => {
          if (!active || current.current.key !== key) return;
          if (error) {
            setStatus(
              `Preferences saved locally. Account sync failed: ${error.message}`,
            );
            return;
          }
          const cloud = data as unknown as {
            preferences: unknown;
            version: number;
            conflict: boolean;
          };
          if (!cloud) {
            setStatus(
              "Preferences saved locally. The server did not acknowledge the update.",
            );
            return;
          }
          const next = cloud.conflict
            ? mergeCloudPreferences(current.current.envelope, cloud)
            : acknowledgePreferences(current.current.envelope, sent, cloud);
          acceptCloud(next);
          setStatus(
            Object.keys(next.pending).length
              ? "Preferences saved locally; account sync pending."
              : "Preferences saved to your account.",
          );
        })
        .catch((cause) => {
          if (active && current.current.key === key)
            setStatus(
              `Preferences saved locally. ${cause instanceof Error ? cause.message : "Account sync failed."}`,
            );
        });
    }, 650);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [envelope.pending, envelope.cloudVersion, key, owner, ready, acceptCloud]);
  useEffect(() => {
    const timer = setInterval(() => {
      const pending = deferred.current;
      if (
        !pending ||
        pending.key !== key ||
        useTestStore.getState().status === "running"
      )
        return;
      const focused = document.activeElement;
      if (focused instanceof HTMLTextAreaElement && focused.value.length > 0)
        return;
      deferred.current = null;
      persist({
        ...current.current.envelope,
        values: validatePreferences({
          ...pending.values,
          ...current.current.envelope.pending,
        }),
      });
    }, 500);
    return () => clearInterval(timer);
  }, [key, persist]);
  useEffect(() => {
    const resume = () => setRetry((value) => value + 1);
    globalThis.addEventListener?.("online", resume);
    const timer = setInterval(resume, 30000);
    return () => {
      clearInterval(timer);
      globalThis.removeEventListener?.("online", resume);
    };
  }, []);
  useEffect(
    () =>
      sessionRepository.subscribe((event) => {
        if (event.type !== "clear" || event.ownerId !== owner) return;
        memory.delete(key);
        const reset: PreferenceEnvelope = {
          schemaVersion: 3,
          values: { ...DEFAULT_PREFERENCES },
          pending: {},
          cloudVersion: 0,
          updatedAt: 0,
        };
        current.current.envelope = reset;
        setEntry({ key, envelope: reset });
        setStatus("Preferences reset on this device.");
      }),
    [key, owner],
  );
  const preferences = envelope.values;
  useEffect(() => {
    publishOpeningPreferences({
      language: preferences.language,
      reducedMotion: preferences.reducedMotion,
    });
  }, [preferences.language, preferences.reducedMotion]);
  useEffect(() => {
    applyTheme(preferences.theme);
    document.documentElement.style.setProperty(
      "--typing-size",
      `${preferences.fontSize}px`,
    );
    document.documentElement.dataset.reducedMotion = String(
      preferences.reducedMotion,
    );
  }, [preferences.theme, preferences.fontSize, preferences.reducedMotion]);
  const updatePreferences = useCallback(
    (patch: Partial<Preferences>) => {
      const previous = current.current.envelope;
      const validPatch = validatePreferencePatch(patch, previous.values);
      const values = validatePreferences({ ...previous.values, ...validPatch });
      const pending = { ...previous.pending, ...validPatch };
      persist({ ...previous, values, pending, updatedAt: Date.now() });
      setStatus(
        owner === "guest"
          ? "Preferences saved on this device."
          : "Preferences saved locally; account sync pending.",
      );
    },
    [persist, owner],
  );
  const resetPreferences = useCallback(
    () => updatePreferences(DEFAULT_PREFERENCES),
    [updatePreferences],
  );
  const value = useMemo(
    () => ({
      preferences,
      updatePreferences,
      resetPreferences,
      storageAvailable,
      preferenceSyncStatus,
    }),
    [
      preferences,
      updatePreferences,
      resetPreferences,
      storageAvailable,
      preferenceSyncStatus,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("PreferencesProvider is required");
  return value;
}
