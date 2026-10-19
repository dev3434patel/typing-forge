import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  usePreferences,
  type Preferences,
} from "@/contexts/PreferencesContext";
import { THEMES, type ForgeTheme } from "@/lib/themes";
import {
  getOpeningAnimationEnabled,
  setOpeningAnimationEnabled,
  replayOpeningAnimation,
  INTRO_PREFERENCE_EVENT,
} from "@/lib/opening-experience";
import {
  CONTENT_PACKS,
  LAYOUTS as KEYBOARD_LAYOUTS,
} from "@/lib/content-packs";
import { useSessionHistory } from "@/hooks/useTestResults";
import { Download, RotateCcw, Check, Play } from "lucide-react";
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Settings() {
  const {
      preferences: p,
      updatePreferences: update,
      resetPreferences,
      storageAvailable,
      preferenceSyncStatus,
    } = usePreferences(),
    { records, storageMode } = useSessionHistory();
  const [notice, setNotice] = useState("");
  const [openingEnabled, setOpeningEnabled] = useState(getOpeningAnimationEnabled);
  useEffect(() => {
    const refresh = () => setOpeningEnabled(getOpeningAnimationEnabled());
    window.addEventListener(INTRO_PREFERENCE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(INTRO_PREFERENCE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const themeOption = (theme: ForgeTheme) => (
    <button
      aria-pressed={p.theme === theme.id}
      key={theme.id}
      onClick={() => update({ theme: theme.id })}
      className="min-w-0 text-left rounded-xl border p-4 min-h-28 relative"
      style={{
        background: theme.colors.surface,
        color: theme.colors.text,
        borderColor: p.theme === theme.id ? theme.colors.accent : theme.colors.border,
      }}
    >
      <span className="font-mono text-xl" style={{ color: theme.colors.accent }}>
        Aa<span style={{ color: theme.colors.muted }}> bb</span>
      </span>
      <span className="block text-xs mt-4">{theme.name}</span>
      {p.theme === theme.id && <Check size={15} className="absolute right-3 top-3" />}
    </button>
  );
  const toggle = (key: keyof Preferences, label: string, help: string) => (
    <label className="flex justify-between gap-4 py-4 border-b last:border-0">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground mt-1">{help}</span>
      </span>
      <input
        aria-label={label}
        className="size-5 shrink-0 accent-[var(--forge-accent)]"
        type="checkbox"
        checked={Boolean(p[key])}
        onChange={(event) => update({ [key]: event.target.checked })}
      />
    </label>
  );
  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main max-w-5xl">
        <p className="eyebrow">Make it yours</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
          Your practice, your space.
        </h1>
        <p className="text-muted-foreground mt-3 mb-10">
          Preferences are saved separately for each account and this device’s
          guest.
        </p>
        <p role="status" className="text-xs text-muted-foreground -mt-6 mb-8">
          {preferenceSyncStatus}
        </p>
        {!storageAvailable && (
          <p role="status" className="text-destructive mb-4">
            Preference storage is unavailable. Changes apply for this visit.
          </p>
        )}
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4">Appearance</h2>
          <div className="grid grid-cols-2 gap-3" aria-label="Sparow themes">
            {THEMES.slice(0, 2).map(themeOption)}
          </div>
          <h3 className="mt-6 mb-3 text-xs text-muted-foreground">More palettes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" aria-label="More themes">
            {THEMES.slice(2).map(themeOption)}
          </div>
        </section>
        <section className="panel p-5 sm:p-6 mb-10" aria-labelledby="opening-animation-title">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="min-w-0 flex flex-1 basis-64 items-center justify-between gap-4 min-h-11">
              <span>
                <span id="opening-animation-title" className="block text-sm font-medium">Opening animation</span>
                <span id="opening-animation-help" className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    The full 3D keyboard plays once per browser session. Replay it anytime; reduced motion is respected.
                </span>
              </span>
              <input
                type="checkbox"
                aria-labelledby="opening-animation-title"
                aria-describedby="opening-animation-help"
                className="size-5 shrink-0 accent-[var(--forge-accent)]"
                checked={openingEnabled}
                onChange={(event) => {
                  setOpeningAnimationEnabled(event.target.checked);
                  setOpeningEnabled(getOpeningAnimationEnabled());
                }}
              />
            </label>
            <button
              id="sparowtype-replay-opening"
              type="button"
              className="forge-button-secondary"
              onClick={replayOpeningAnimation}
            >
              <Play size={15} aria-hidden="true" /> Replay opening animation
            </button>
          </div>
        </section>
        <div className="grid md:grid-cols-2 gap-6">
          <section className="panel p-6">
            <h2 className="text-lg font-medium mb-6">Typing preferences</h2>
            <div className="space-y-5">
              <label className="block text-sm">
                Practice language
                <select
                  className="forge-input mt-2"
                  value={p.language}
                  onChange={(e) => update({ language: e.target.value })}
                >
                  {CONTENT_PACKS.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Keyboard layout
                <select
                  className="forge-input mt-2"
                  value={p.layout}
                  onChange={(e) => update({ layout: e.target.value })}
                >
                  {Object.entries(KEYBOARD_LAYOUTS).map(([id, layout]) => (
                    <option key={id} value={id}>
                      {layout.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Text size{" "}
                <span className="font-mono text-primary">{p.fontSize}px</span>
                <input
                  aria-label="Text size"
                  className="w-full mt-3 accent-[var(--forge-accent)]"
                  type="range"
                  min="18"
                  max="40"
                  step="2"
                  value={p.fontSize}
                  onChange={(e) => update({ fontSize: +e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Caret style
                <select
                  className="forge-input mt-2"
                  value={p.caretStyle}
                  onChange={(e) =>
                    update({
                      caretStyle: e.target.value as Preferences["caretStyle"],
                    })
                  }
                >
                  <option value="line">Line</option>
                  <option value="block">Block</option>
                  <option value="underline">Underline</option>
                  <option value="outline">Outline</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm">
                  Target WPM
                  <input
                    className="forge-input mt-2"
                    type="number"
                    min="10"
                    max="200"
                    value={p.targetWpm}
                    onChange={(e) =>
                      update({
                        targetWpm: Math.min(
                          200,
                          Math.max(10, +e.target.value || 10),
                        ),
                      })
                    }
                  />
                </label>
                <label className="text-sm">
                  Daily goal · min
                  <input
                    className="forge-input mt-2"
                    type="number"
                    min="1"
                    max="120"
                    value={p.dailyGoalMinutes}
                    onChange={(e) =>
                      update({
                        dailyGoalMinutes: Math.min(
                          120,
                          Math.max(1, +e.target.value || 1),
                        ),
                      })
                    }
                  />
                </label>
              </div>
            </div>
          </section>
          <section className="panel p-6">
            <h2 className="text-lg font-medium mb-2">Focus & feedback</h2>
            {toggle(
              "liveStats",
              "Live statistics",
              "Show speed and accuracy while you type.",
            )}
            {toggle(
              "focusMode",
              "Focus mode",
              "Keep supporting details quiet during your test.",
            )}
            {toggle(
              "smoothCaret",
              "Smooth caret",
              "Animate the caret when reduced motion is off.",
            )}
            {toggle(
              "reducedMotion",
              "Reduced motion",
              "Keep animation still. Your device’s reduced-motion setting always applies.",
            )}
            {toggle(
              "paceCaret",
              "Pace guide",
              "Show your target pace during practice.",
            )}
            {toggle("sound", "Typing sound", "A subtle click. Off by default.")}
            {typeof AudioContext !== "function" && (
              <p role="status" className="mt-3 text-xs text-muted-foreground">
                Typing sound is unavailable in this browser. Your sound preference is kept for devices that support it.
              </p>
            )}
            <label className="block mt-5 text-sm">
              Sound pack
              <select aria-label="Sound pack" aria-describedby="sound-pack-help" className="forge-input mt-2" value={p.soundPack} onChange={(event) => update({ soundPack: event.target.value as Preferences["soundPack"] })}>
                <option value="soft">Soft</option>
                <option value="mechanical">Mechanical</option>
                <option value="typewriter">Typewriter</option>
                <option value="arcade">Arcade</option>
                <option value="minimal">Minimal</option>
              </select>
              <span id="sound-pack-help" className="block mt-2 text-xs text-muted-foreground">Five synthesized styles. Sound starts only while you type.</span>
            </label>
            <label className="block mt-5 text-sm">
              Volume{" "}
              <input
                className="w-full mt-3 accent-[var(--forge-accent)]"
                aria-label="Sound volume"
                type="range"
                min="0"
                max="1"
                step=".05"
                value={p.volume}
                onChange={(e) => update({ volume: +e.target.value })}
              />
            </label>
          </section>
        </div>
        <section className="panel p-6 mt-6">
          <h2 className="text-lg font-medium">Your data</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-5">
            {records.length} sessions in this account’s local history.{" "}
            {storageMode === "indexeddb"
              ? "Browser storage is available."
              : "Memory storage only; export before closing."}{" "}
            Private custom text stays on this device unless you choose cloud
            storage. Event evidence expires after 90 days; summaries remain.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="forge-button-secondary"
              onClick={() => {
                downloadJson(
                  {
                    version: 3,
                    exportedAt: new Date().toISOString(),
                    preferences: p,
                    sessions: records,
                  },
                  "sparowtype-export.json",
                );
                setNotice(
                  "Export prepared. It includes your private session text when available.",
                );
              }}
            >
              <Download size={16} />
              Export my local data
            </button>
            <button
              className="forge-button-secondary"
              onClick={() => {
                resetPreferences();
                setNotice("Preferences reset. Your sessions are retained.");
              }}
            >
              <RotateCcw size={16} />
              Reset preferences
            </button>
          </div>
          <p role="status" className="text-sm text-muted-foreground mt-4">
            {notice}
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
