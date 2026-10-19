import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TestSettings } from "@/components/typing/TestSettings";
import { TypingArea } from "@/components/typing/TypingArea";
import { sessionRepository } from "@/services/session-repository";
import { useTestStore } from "@/stores/test-store";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/hooks/useAuth";
import { useTestResults } from "@/hooks/useTestResults";
import {
  getContentPack,
  generatePackText,
  seededRandom,
} from "@/lib/content-packs";
import { getRandomCodeSnippet } from "@/lib/content-library";
import { getRandomQuote } from "@/lib/quotes";
import type {
  SessionConfig,
  SessionResult,
  SessionSnapshot,
} from "@/lib/typing-core";
const SessionResults = lazy(() =>
  import("@/components/typing/SessionResults").then((module) => ({
    default: module.SessionResults,
  })),
);
export default function Index() {
  const [params] = useSearchParams();
  const { settings, resetTest } = useTestStore(),
    { preferences: p } = usePreferences(),
    { user } = useAuth(),
    navigate = useNavigate();
  const { saveSession, syncState, retrySync, enableCloudStorage } =
    useTestResults();
  const [nonce, setNonce] = useState(0),
    [result, setResult] = useState<SessionResult | null>(null),
    [custom, setCustom] = useState(""),
    [customReady, setCustomReady] = useState(false),
    [repeat, setRepeat] = useState<string | null>(null),
    [error, setError] = useState("");
  const saved = useRef(new Set<string>()),
    appendCounter = useRef(0);
  const [retestConfiguration, setRetestConfiguration] =
    useState<SessionConfig | null>(null);
  const retestId = params.get("retest");
  useEffect(() => {
    let active = true;
    if (!retestId) {
      setRetestConfiguration(null);
      return;
    }
    void sessionRepository.get(user?.id || "guest", retestId).then((record) => {
      if (!active) return;
      const source = record?.candidate as SessionResult | undefined;
      if (
        !source?.configuration ||
        source.configuration.mode === "race" ||
        source.configuration.mode === "learn" ||
        source.configuration.scoringPolicy === "free"
      ) {
        setError(
          "This original passage is unavailable for a matched retest. Start a fresh test.",
        );
        return;
      }
      setRetestConfiguration({
        ...source.configuration,
        clientSessionId: crypto.randomUUID(),
        initialTarget: source.targetText,
        challengeId: undefined,
        startImmediately: false,
        repeatedContent: true,
        paused: false,
        settings: {
          ...source.configuration.settings,
          sourceResultId: source.clientSessionId,
        },
      });
      setCustomReady(true);
    });
    return () => {
      active = false;
    };
  }, [retestId, user?.id]);
  const configuration = useMemo<SessionConfig>(() => {
    if (retestConfiguration) return { ...retestConfiguration, correctionPolicy: "current-word" };
    const seed = crypto.randomUUID(),
      mode = settings.mode === "keybr" ? "time" : settings.mode,
      pack = getContentPack(mode === "quote" || mode === "code" ? "en" : p.language);
    const generatedWords = ["time", "words", "zen"].includes(mode) &&
      !(mode === "zen" && settings.zenStyle === "free");
    const random = seededRandom(seed);
    const words = (count: number) =>
      generatePackText(p.language, count, seed)
        .split(" ")
        .map((word) =>
          settings.numbers && random() < 0.1
            ? String(Math.floor(random() * 1000))
            : word +
              (settings.punctuation && random() < 0.15
                ? [".", ",", "!", "?"][Math.floor(random() * 4)]
                : ""),
        )
        .join(" ");
    const passage = mode === "quote" ? getRandomQuote(seed, settings.quoteLength) : null,
      snippet =
        mode === "code" ? getRandomCodeSnippet(settings.codeLanguage) : null;
    const initialTarget =
      repeat ??
      (mode === "custom"
        ? custom.trim()
        : mode === "zen" && settings.zenStyle === "free"
          ? ""
          : passage
            ? passage.text
            : snippet
              ? snippet.content
              : words(mode === "words" ? settings.wordCount : 120));
    return {
      clientSessionId: seed,
      ownerScope: user?.id || "guest",
      mode,
      correctionPolicy: "current-word",
      initialTarget,
      durationMs: mode === "time" ? settings.duration * 1000 : undefined,
      scoringPolicy:
        mode === "code"
          ? "code"
          : mode === "zen" && settings.zenStyle === "free"
            ? "free"
            : "prose",
      language: pack.id,
      keyboardLayout: p.layout,
      script: pack.script,
      inputMethod: "keyboard-or-composition",
      contentRevision: passage?.revision ?? snippet?.revision ?? pack.revision,
      generatorVersion: "forge-content-v1",
      seed,
      punctuation: generatedWords && settings.punctuation,
      numbers: generatedWords && settings.numbers,
      wordCount: mode === "words" ? settings.wordCount : undefined,
      codeLanguage: mode === "code" ? settings.codeLanguage : undefined,
      privacy:
        mode === "custom" || (mode === "zen" && settings.zenStyle === "free")
          ? "private-custom"
          : "public-corpus",
      repeatedContent: repeat !== null,
      rejectIncorrect:
        settings.precisionMode &&
        !(mode === "zen" && settings.zenStyle === "free"),
      settings: {
        tabIndents: mode === "code" && settings.tabIndents,
        contentId: passage?.id ?? snippet?.id ?? pack.id,
        contentAuthor:
          passage?.author ?? snippet?.author ?? pack.provenance.author,
        contentLicense:
          passage?.license ?? snippet?.license ?? pack.provenance.license,
        ...(mode === "quote" ? { quoteLength: settings.quoteLength } : {}),
      },
    };
    // Custom text is committed explicitly by the Start button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings,
    p.language,
    p.layout,
    user?.id,
    nonce,
    customReady,
    repeat,
    retestConfiguration,
  ]);
  useEffect(() => {
    setResult(null);
    setError("");
    resetTest();
    appendCounter.current = 0;
  }, [configuration.clientSessionId, resetTest]);
  useEffect(() => {
    if (settings.mode === "keybr") navigate("/learn", { replace: true });
  }, [settings.mode, navigate]);
  const complete = useCallback(
    (finished: SessionResult) => {
      setResult(finished);
      useTestStore.setState({ status: "finished" });
      if (!saved.current.has(finished.clientSessionId)) {
        saved.current.add(finished.clientSessionId);
        void saveSession(finished).catch((cause) =>
          setError(
            cause instanceof Error
              ? cause.message
              : "Saving failed. Export this result before closing.",
          ),
        );
      }
    },
    [saveSession],
  );
  const next = () => {
    setResult(null);
    setRepeat(null);
    setRetestConfiguration(null);
    if (settings.mode === "custom") setCustomReady(false);
    navigate("/");
    setNonce((value) => value + 1);
  };
  const repeatPassage = () => {
    if (!result) return;
    setRetestConfiguration({
      ...result.configuration,
      clientSessionId: crypto.randomUUID(),
      initialTarget: result.targetText,
      repeatedContent: true,
      challengeId: undefined,
      paused: false,
    });
    setCustomReady(true);
    setResult(null);
  };
  const onStatus = useCallback(
    (status: SessionSnapshot["status"]) => {
      const mapped =
        status === "finished"
          ? "finished"
          : status === "ready"
            ? "idle"
            : "running";
      // Input/timer snapshots keep reporting their status. Publish only a real
      // transition so store subscribers do not rebuild the page shell per key.
      useTestStore.setState((state) =>
        state.status === mapped ? state : { status: mapped },
      );
    },
    [],
  );
  return (
    <div className="forge-shell practice-shell">
      <Header />
      <main
        id="main-content"
        className={`forge-main ${result ? "" : "practice-main"}`}
      >
        {!result && (
          <>
            <h1 className="sr-only">Typing practice</h1>
            {retestConfiguration ? (
              <div className="panel p-4 mb-8 flex flex-wrap justify-between gap-3 items-center text-sm">
                <span>
                  Repeated passage · {configuration.mode} · original language
                  and layout
                </span>
                <button className="forge-button-secondary" onClick={next}>
                  Fresh test
                </button>
              </div>
            ) : (
              <TestSettings />
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive panel p-4 mb-5">
            {error}
          </p>
        )}
        <Suspense
          fallback={
            <p className="panel p-10 text-muted-foreground" role="status">
              Preparing your session results…
            </p>
          }
        >
          {result ? (
            <SessionResults
              result={result}
              onRestart={next}
              quickRestart
              onRepeat={repeatPassage}
              saveStatus={syncState}
              onRetrySave={() => void retrySync()}
              onCloudConsent={() => {
                if (
                  window.confirm(
                    "Allow this session’s target text, typed text and input evidence to be stored in your account?",
                  )
                )
                  void enableCloudStorage(result.clientSessionId).catch(
                    (cause) => setError(String(cause)),
                  );
              }}
            />
          ) : configuration.mode === "custom" && !customReady ? (
            <section className="panel p-6">
              <h2 className="font-medium mb-2">Bring your own passage</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Paste up to 10,000 characters to practice. Your text stays
                private on this device.
              </p>
              <label htmlFor="custom-passage" className="sr-only">
                Custom practice passage
              </label>
              <textarea
                id="custom-passage"
                className="forge-input min-h-48 font-mono leading-relaxed"
                value={custom}
                maxLength={10000}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Add something you want to get better at typing…"
              />
              <button
                className="forge-button mt-4"
                disabled={!custom.trim()}
                onClick={() => setCustomReady(true)}
              >
                Start private practice
                <ArrowUpRight size={16} />
              </button>
            </section>
          ) : (
            <TypingArea
              key={configuration.clientSessionId}
              configuration={configuration}
              onTestComplete={complete}
              onRestart={next}
              onStatusChange={onStatus}
              autoFocus={nonce > 0 ? true : undefined}
              appendContent={
                ["time", "zen"].includes(configuration.mode) &&
                configuration.scoringPolicy === "prose"
                  ? () =>
                      generatePackText(
                        configuration.language || "en",
                        80,
                        `${configuration.seed}:${++appendCounter.current}`,
                      )
                  : undefined
              }
            />
          )}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
