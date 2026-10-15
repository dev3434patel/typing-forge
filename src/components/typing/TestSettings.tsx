import {
  useTestStore,
  type TestMode,
  type TestDuration,
} from "@/stores/test-store";
import {
  Clock3,
  Type,
  Quote,
  Sparkles,
  Code2,
  FileText,
  Plus,
} from "lucide-react";
import { CODE_LANGUAGES } from "@/lib/content-library";
import { CONTENT_PACKS } from "@/lib/content-packs";
import { usePreferences } from "@/contexts/PreferencesContext";
const modes = [
  { value: "time", label: "Time", icon: Clock3 },
  { value: "words", label: "Words", icon: Type },
  { value: "quote", label: "Quote", icon: Quote },
  { value: "code", label: "Code", icon: Code2 },
  { value: "custom", label: "Custom", icon: FileText },
  { value: "zen", label: "Zen", icon: Sparkles },
] as const;
export function TestSettings() {
  const { settings, setSettings, status } = useTestStore(),
    { preferences, updatePreferences } = usePreferences();
  return (
    <section
      aria-label="Test configuration"
      className="test-toolbar"
      data-running={status === "running"}
    >
      <div className="flex items-center flex-wrap gap-1 justify-between">
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Test mode"
        >
          {modes.map(({ value, label, icon: Icon }) => (
            <button
              className="forge-chip"
              aria-pressed={settings.mode === value}
              key={value}
              onClick={() => setSettings({ mode: value as TestMode })}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        {["time", "words"].includes(settings.mode) && (
          <div
            className="flex gap-1 pl-2 border-l"
            role="group"
            aria-label={
              settings.mode === "time" ? "Test duration" : "Word count"
            }
          >
            {(settings.mode === "time"
              ? [15, 30, 60, 120]
              : [25, 50, 100, 200]
            ).map((value) => (
              <button
                className="forge-chip font-mono"
                aria-pressed={
                  (settings.mode === "time"
                    ? settings.duration
                    : settings.wordCount) === value
                }
                key={value}
                onClick={() =>
                  setSettings(
                    settings.mode === "time"
                      ? { duration: value as TestDuration }
                      : { wordCount: value },
                  )
                }
              >
                {value}
                <span className="sr-only">
                  {settings.mode === "time" ? "seconds" : "words"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="test-toolbar-options flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2">
        {!(settings.mode === "zen" && settings.zenStyle === "free") && (
          <label
            className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground"
            title="Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice."
          >
            <input
              type="checkbox"
              checked={settings.precisionMode}
              onChange={(event) =>
                setSettings({ precisionMode: event.target.checked })
              }
              className="h-4 w-4 accent-[var(--forge-accent)]"
            />
            Precision mode · stop on errors
          </label>
        )}
        {settings.mode === "zen" && (
          <div role="group" aria-label="Zen style">
            <button
              className="forge-chip !text-xs"
              aria-pressed={settings.zenStyle === "prompted"}
              onClick={() => setSettings({ zenStyle: "prompted" })}
            >
              Prompted practice
            </button>
            <button
              className="forge-chip !text-xs"
              aria-pressed={settings.zenStyle === "free"}
              onClick={() => setSettings({ zenStyle: "free" })}
            >
              Free writing
            </button>
          </div>
        )}
        {["time", "words", "zen"].includes(settings.mode) && (
          <>
            <label className="test-toolbar-select-label text-xs text-muted-foreground">
              Language
              <select
                aria-label="Language"
                className="test-toolbar-select"
                value={preferences.language}
                onChange={(e) =>
                  updatePreferences({ language: e.target.value })
                }
              >
                {CONTENT_PACKS.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="hidden sm:block h-4 border-l mx-1" aria-hidden="true" />
            <button
              className="forge-chip !text-xs"
              aria-pressed={settings.punctuation}
              onClick={() =>
                setSettings({ punctuation: !settings.punctuation })
              }
            >
              <Plus size={12} />
              punctuation
            </button>
            <button
              className="forge-chip !text-xs"
              aria-pressed={settings.numbers}
              onClick={() => setSettings({ numbers: !settings.numbers })}
            >
              # numbers
            </button>
          </>
        )}
        {settings.mode === "code" && (
          <>
            <label className="test-toolbar-select-label text-xs text-muted-foreground">
              Code language
              <select
                aria-label="Code language"
                className="test-toolbar-select"
                value={settings.codeLanguage}
                onChange={(e) => setSettings({ codeLanguage: e.target.value })}
              >
                {CODE_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={settings.tabIndents}
                onChange={(event) =>
                  setSettings({ tabIndents: event.target.checked })
                }
                className="h-4 w-4 accent-[var(--forge-accent)]"
              />
              Enable Tab indentation
            </label>
            <p className="test-toolbar-help text-xs text-muted-foreground">
              Exact whitespace · separate code metrics
            </p>
          </>
        )}
        {settings.mode === "quote" && (
          <p className="text-xs text-muted-foreground py-3">
            Complete a passage. Every correction remains part of your practice.
          </p>
        )}
        {settings.mode === "custom" && (
          <p className="text-xs text-muted-foreground py-3">
            Your own text. Stored on this device unless you choose to upload.
          </p>
        )}
      </div>
    </section>
  );
}
