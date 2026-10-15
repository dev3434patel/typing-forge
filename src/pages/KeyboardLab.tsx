import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Keyboard,
  RotateCcw,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/hooks/useAuth";
import { getContentPack } from "@/lib/content-packs";
import { cn } from "@/lib/utils";
import {
  LAB_LAYOUT_LABELS,
  LAB_ROWS,
  REFERENCE_MAPS,
  buildTransitionDrill,
  compareLabLayouts,
  createLabState,
  observeLabKeyDown,
  observeLabKeyUp,
  readBrowserLayout,
  releaseLabFocus,
  transitionSummary,
  type BrowserLayoutResult,
  type KeyboardMapNavigator,
} from "@/lib/keyboard-lab";

const keyName = (key: string) => (key === " " ? "Space" : key);
const fallbackLabel = (code: string) =>
  ({
    Backquote: "`",
    Minus: "−",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Semicolon: ";",
    ControlLeft: "Ctrl",
    ControlRight: "Ctrl",
    MetaLeft: "Meta",
    MetaRight: "Meta",
    AltLeft: "Alt",
    AltRight: "Alt",
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
    CapsLock: "Caps",
    Backspace: "⌫",
    Enter: "Enter",
    Space: "Space",
  })[code] ?? code.replace(/^(Key|Digit)/, "");

export default function KeyboardLab() {
  const { preferences, updatePreferences } = usePreferences();
  const { user } = useAuth();
  const [state, setState] = useState(createLabState);
  const [browserLayout, setBrowserLayout] =
    useState<BrowserLayoutResult | null>(null);
  const [reading, setReading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(preferences.layout);
  const [notice, setNotice] = useState("");
  const [lastSignal, setLastSignal] = useState("No key events observed yet.");
  const [surveyText, setSurveyText] = useState("");
  const [drillText, setDrillText] = useState("");
  const [chosenPair, setChosenPair] = useState<[string, string] | null>(null);
  const composition = useRef(false);
  const owner = user?.id ?? "guest";
  const requests = useRef({ generation: 0 });
  const survey = useRef<HTMLTextAreaElement>(null);
  const pack = getContentPack(preferences.language);

  useEffect(() => {
    const requestState = requests.current;
    requestState.generation++;
    setState(createLabState());
    setBrowserLayout(null);
    setReading(false);
    setSurveyText("");
    setDrillText("");
    setChosenPair(null);
    setNotice("");
    setLastSignal("No key events observed yet.");
    return () => {
      requestState.generation++;
    };
  }, [owner]);
  useEffect(() => {
    setSelectedLayout(preferences.layout);
  }, [preferences.layout]);
  const pairs = useMemo(() => transitionSummary(state), [state]);
  const measuredPairs = pairs.filter((pair) => pair.qualified);
  const mapping = useMemo(
    () =>
      browserLayout?.status === "available"
        ? { ...browserLayout.mapping, ...state.mapping }
        : state.mapping,
    [browserLayout, state.mapping],
  );
  const comparisons = useMemo(() => compareLabLayouts(mapping), [mapping]);
  const selectedComparison = comparisons.find(
    (result) => result.layout === selectedLayout,
  );
  const matchingLayouts = comparisons.filter(
    (result) => result.checked >= 6 && result.mismatches.length === 0,
  );
  const defaultPair: [string, string] = [
    pack.introductionOrder[0] ?? "e",
    pack.introductionOrder[1] ?? "r",
  ];
  const drillPair =
    chosenPair ??
    (measuredPairs[0]
      ? ([measuredPairs[0].from, measuredPairs[0].to] as [string, string])
      : defaultPair);
  const drill = buildTransitionDrill(...drillPair);
  const measuredCount = pairs.reduce(
    (total, pair) => total + pair.samplesMs.length,
    0,
  );

  async function requestLayout() {
    const generation = ++requests.current.generation;
    setReading(true);
    const result = await readBrowserLayout(
      navigator as unknown as KeyboardMapNavigator,
      window.isSecureContext,
    );
    if (generation !== requests.current.generation) return;
    setBrowserLayout(result);
    if (result.status === "available") {
      // A new browser snapshot replaces older layout hints, not key signals.
      setState((current) => ({ ...current, mapping: {} }));
    }
    setReading(false);
  }
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.currentTarget.blur();
      return;
    }
    const native = event.nativeEvent;
    setState((current) =>
      observeLabKeyDown(current, {
        code: event.code,
        key: event.key,
        at: performance.now(),
        repeat: event.repeat,
        isComposing: native.isComposing || composition.current,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      }),
    );
    setLastSignal(
      `${event.code || "Unidentified physical code"} → ${keyName(event.key)}${event.repeat ? " · repeat event" : ""}${native.isComposing || composition.current ? " · composition; excluded from transitions" : ""}. Last event reported Caps Lock ${event.getModifierState("CapsLock") ? "on" : "off"}.`,
    );
  }
  function reset() {
    requests.current.generation++;
    setReading(false);
    setState(createLabState());
    setBrowserLayout(null);
    setSurveyText("");
    setDrillText("");
    setChosenPair(null);
    setNotice("Session observations cleared.");
    setLastSignal("No key events observed yet.");
  }
  const inputProps = {
    onKeyDown: keyDown,
    onKeyUp: (event: KeyboardEvent<HTMLTextAreaElement>) =>
      setState((current) => observeLabKeyUp(current, event.code)),
    onFocus: () => {
      setFocused(true);
      setState(releaseLabFocus);
    },
    onBlur: () => {
      setFocused(false);
      composition.current = false;
      setState(releaseLabFocus);
    },
    onCompositionStart: () => {
      composition.current = true;
      setState(releaseLabFocus);
    },
    onCompositionEnd: () => {
      composition.current = false;
      setState(releaseLabFocus);
    },
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: false,
  };
  const targetKeys = [
    ...new Set(
      measuredPairs
        .slice(0, 3)
        .flatMap((pair) => [pair.from, pair.to])
        .filter((key) => pack.alphabet.includes(key)),
    ),
  ].join("");
  const learnLink = `/learn?${new URLSearchParams({ ...(targetKeys ? { keys: targetKeys } : {}), language: pack.id, layout: preferences.layout }).toString()}`;

  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main max-w-6xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow flex items-center gap-2">
              <Sparkles className="size-4" aria-hidden="true" /> A small lab for
              a smoother flow
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Know your input. Find your rhythm.
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              See the physical key codes and characters your browser reports,
              then explore the transitions that deserve a little practice.
              Nothing here changes your typing scores.
            </p>
          </div>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" /> Clear
            observations
          </Button>
        </div>

        <div
          className="grid gap-4 sm:grid-cols-3"
          aria-label="Observation summary"
        >
          {[
            [
              "Keys observed",
              String(Object.keys(state.keys).length),
              "Physical codes received in a focused lab input.",
            ],
            [
              "Transition samples",
              String(measuredCount),
              "Keydown intervals up to two seconds apart.",
            ],
            [
              "Data location",
              "This session",
              "No lab recordings are saved or uploaded.",
            ],
          ].map(([title, value, detail]) => (
            <section key={title} className="panel p-5">
              <h2 className="text-xs text-muted-foreground">{title}</h2>
              <p
                className="mt-3 text-2xl font-semibold tracking-tight"
                data-testid={
                  title === "Keys observed" ? "lab-key-count" : undefined
                }
              >
                {value}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {detail}
              </p>
            </section>
          ))}
        </div>

        <section className="panel p-5 sm:p-7" aria-labelledby="layout-title">
          <div className="flex flex-wrap justify-between items-start gap-5">
            <div className="max-w-xl">
              <h2
                id="layout-title"
                className="flex items-center gap-2 text-xl font-medium"
              >
                <ScanLine className="size-5 text-primary" aria-hidden="true" />{" "}
                Check your layout
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Optionally ask the browser for its key-to-character map. Support
                varies. This identifies mappings; it cannot identify your
                keyboard’s brand, switch type or finger placement.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={reading}
              onClick={() => void requestLayout()}
            >
              {reading ? "Reading layout…" : "Read browser layout"}
            </Button>
          </div>
          {browserLayout && (
            <p className="mt-4 text-sm" role="status">
              {browserLayout.status === "available"
                ? `Browser map available: ${Object.keys(browserLayout.mapping).length} mappings. This is a snapshot, not a hardware identity. Later unmodified manual input takes precedence; re-read after changing your operating system layout.`
                : browserLayout.message}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <div className="space-y-2 text-sm">
              <label
                htmlFor="lab-reference-layout"
                className="block text-muted-foreground"
              >
                Reference layout
              </label>
              <select
                id="lab-reference-layout"
                value={selectedLayout}
                onChange={(event) => {
                  setSelectedLayout(event.target.value);
                  setNotice("");
                }}
                className="h-10 rounded-lg border bg-background px-3"
              >
                {Object.entries(LAB_LAYOUT_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                updatePreferences({ layout: selectedLayout });
                setNotice(
                  `Practice layout set to ${LAB_LAYOUT_LABELS[selectedLayout]}. This does not change your operating system layout.`,
                );
              }}
            >
              <Check className="size-4" aria-hidden="true" /> Use this practice
              layout
            </Button>
          </div>
          <p
            className="mt-4 text-sm text-muted-foreground"
            data-testid="layout-agreement"
          >
            {selectedLayout === "native"
              ? "Native / custom keeps the virtual reference unmapped. Your actual characters still work."
              : !selectedComparison?.checked
                ? "No comparable letter mappings yet. Type several letters without Shift, or read the browser map."
                : `${selectedComparison.matched} of ${selectedComparison.checked} observed letter mappings agree with this reference.${selectedComparison.mismatches.length ? " Differences may come from a locale variant, remapping or another layout. Confirm your choice manually." : " Agreement is a hint, not proof of a particular layout."}`}
          </p>
          {matchingLayouts.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Matching partial references:{" "}
              {matchingLayouts
                .map((item) => LAB_LAYOUT_LABELS[item.layout])
                .join(", ")}
              . Preferences change only when you select “Use this practice
              layout”.
            </p>
          )}
          {notice && (
            <p className="mt-3 text-sm text-primary" role="status">
              {notice}
            </p>
          )}
        </section>

        <section className="panel p-5 sm:p-7" aria-labelledby="signals-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="signals-title"
              className="flex items-center gap-2 text-xl font-medium"
            >
              <Keyboard className="size-5 text-primary" aria-hidden="true" />{" "}
              Your key signals
            </h2>
            <span className="text-xs text-muted-foreground" role="status">
              {focused
                ? "Listening inside the focused lab input"
                : "Paused · focus a lab input to observe"}
            </span>
          </div>
          <label htmlFor="keyboard-survey" className="block text-sm mt-5 mb-2">
            Keyboard signal check
          </label>
          <textarea
            ref={survey}
            id="keyboard-survey"
            {...inputProps}
            value={surveyText}
            onChange={(event) => setSurveyText(event.target.value.slice(-4000))}
            rows={2}
            placeholder="Click here, then try your usual letters, punctuation and modifiers."
            aria-describedby="lab-input-help lab-last-signal"
            className="w-full rounded-xl border bg-background p-4 font-mono text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p
            id="lab-input-help"
            className="mt-2 text-xs text-muted-foreground leading-relaxed"
          >
            Only these two lab inputs observe key events. Tab moves to the next
            control, Shift + Tab moves back, and Escape ends capture. Do not
            enter passwords or sensitive text.
          </p>
          <p
            id="lab-last-signal"
            className="mt-3 min-h-10 break-words text-xs font-mono text-muted-foreground"
            aria-live="off"
          >
            {lastSignal}
          </p>
          <div
            className="mt-4 space-y-1.5 overflow-x-auto pb-3"
            aria-label="Physical key observations"
          >
            <div className="min-w-[640px] space-y-1.5">
              {LAB_ROWS.map((row, rowIndex) => (
                <ul key={rowIndex} className="flex justify-center gap-1.5">
                  {row.map((code) => {
                    const observed = state.keys[code];
                    const label =
                      mapping[code] ?? REFERENCE_MAPS[selectedLayout]?.[code];
                    const display = keyName(label || fallbackLabel(code));
                    const status = observed?.pressed
                      ? "pressed"
                      : observed
                        ? "release state cleared or keyup received"
                        : "not observed";
                    return (
                      <li
                        key={code}
                        data-key-code={code}
                        title={`${code}: ${status}${observed ? `; ${observed.presses} presses, ${observed.releases} keyup events, ${observed.repeats} repeats; characters: ${observed.logicalKeys.map(keyName).join(", ")}` : ""}`}
                        className={cn(
                          "relative grid h-10 min-w-9 flex-1 place-items-center rounded-md border px-1 font-mono text-xs",
                          code === "Space" && "flex-[5]",
                          code === "Backspace" && "flex-[1.5]",
                          !observed && "text-muted-foreground",
                          observed &&
                            !observed.pressed &&
                            "border-primary/50 bg-primary/10 text-primary",
                          observed?.pressed &&
                            "bg-primary border-primary text-primary-foreground",
                        )}
                      >
                        <span aria-hidden="true">{display}</span>
                        <span className="sr-only">
                          {code}: {display}, {status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Neutral = not observed · tinted = observed · solid = currently down.
            The diagram uses a common desktop arrangement; compact, ISO, split
            and mobile keyboards may differ. An unseen key or missed keyup does
            not indicate a hardware fault.
          </p>
          <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-4">
            {[
              ["Repeat events excluded", state.repeats],
              [
                "Composition / dead-key events excluded",
                state.compositionEvents,
              ],
              ["Shortcut events excluded", state.shortcutEvents],
              ["Unknown physical codes", state.unidentifiedEvents],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel p-5 sm:p-7" aria-labelledby="rhythm-title">
          <p className="eyebrow">Transition studio</p>
          <h2 id="rhythm-title" className="mt-3 text-xl font-medium">
            Practice the space between two keys.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A single reading can be a hesitation. Three or more observations let
            you inspect a pair’s median interval. These browser keydown timings
            describe this session’s rhythm; they do not measure keyboard latency
            or diagnose your technique.
          </p>
          <div className="mt-6 rounded-xl border bg-background p-5">
            <p className="text-xs text-muted-foreground">
              {chosenPair
                ? "Your selected transition"
                : measuredPairs.length
                  ? "A repeatedly observed transition"
                  : `Starter pair from ${pack.label} · not a personal recommendation yet`}
            </p>
            <p
              className="mt-3 font-mono text-xl leading-loose tracking-wider break-words"
              data-testid="transition-drill"
              dir={pack.direction}
            >
              {drill}
            </p>
          </div>
          <label htmlFor="transition-input" className="block mt-5 mb-2 text-sm">
            Transition practice input
          </label>
          <textarea
            id="transition-input"
            {...inputProps}
            value={drillText}
            onChange={(event) => setDrillText(event.target.value.slice(-4000))}
            rows={2}
            aria-describedby="transition-help"
            className="w-full rounded-xl border bg-background p-4 font-mono text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            dir={pack.direction}
          />
          <p
            id="transition-help"
            className="mt-2 text-xs leading-relaxed text-muted-foreground"
          >
            Copy the pair pattern at a comfortable pace. Repeat events,
            composition, shortcuts, spaces, zero or negative intervals, focus
            changes and gaps over two seconds are excluded. Readings below
            include both lab inputs.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Observed transition intervals in this lab session
              </caption>
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-normal" scope="col">
                    Transition
                  </th>
                  <th className="pb-3 pr-4 font-normal" scope="col">
                    Samples
                  </th>
                  <th className="pb-3 pr-4 font-normal" scope="col">
                    Median interval
                  </th>
                  <th className="pb-3 font-normal" scope="col">
                    Practice
                  </th>
                </tr>
              </thead>
              <tbody>
                {pairs.slice(0, 8).map((pair) => (
                  <tr
                    key={JSON.stringify([pair.from, pair.to])}
                    className="border-t"
                  >
                    <th className="py-3 pr-4 font-mono font-normal" scope="row">
                      {pair.from} → {pair.to}
                    </th>
                    <td className="py-3 pr-4">
                      {pair.samplesMs.length}
                      {!pair.qualified && (
                        <span className="block text-xs text-muted-foreground">
                          Need 3 for a suggestion
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono">
                      {Math.round(pair.medianMs)} ms
                    </td>
                    <td className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Practice ${pair.from} to ${pair.to}`}
                        onClick={() => {
                          setChosenPair([pair.from, pair.to]);
                          setDrillText("");
                        }}
                      >
                        Use pair
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pairs.length === 0 && (
              <p className="py-5 text-sm text-muted-foreground">
                No eligible transitions yet. Type a few letters in either lab
                input.
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
            <p className="max-w-xl text-xs text-muted-foreground">
              {targetKeys
                ? `Practice these observed characters in Learn: ${targetKeys.split("").join(", ")}. This short survey does not award mastery or change learning history.`
                : "Continue with an adaptive lesson. This survey does not award mastery or change learning history."}
            </p>
            <Button asChild variant="outline">
              <Link to={learnLink}>
                Continue in Learn{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
