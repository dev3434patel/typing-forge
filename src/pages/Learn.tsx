import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { KeybrLessonMode } from "@/components/keybr/KeybrLessonMode";
import { usePreferences } from "@/contexts/PreferencesContext";
import { getContentPack, graphemes } from "@/lib/content-packs";
import "@/components/keybr/learn-workspace.css";

export default function Learn() {
  const [params] = useSearchParams();
  const { preferences } = usePreferences();
  const keys = params.get("keys");
  const language = params.get("language") ?? undefined;
  const layout = params.get("layout") ?? undefined;
  const focusKeys = useMemo(
    () =>
      keys
        ? graphemes(
            keys.replace(/[,\s]/gu, ""),
            getContentPack(language ?? preferences.language).id,
          ).slice(0, 5)
        : undefined,
    [keys, language, preferences.language],
  );
  const retest = params.get("retest");
  const safeRetest =
    retest?.startsWith("/") && !retest.startsWith("//") ? retest : undefined;
  return (
    <div className="learn-workspace flex min-h-screen flex-col bg-background">
      <Header />
      <main
        id="main-content"
        className="learn-main mx-auto w-full flex-1 px-5 sm:px-8"
      >
        <div className="learn-page-heading flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-medium tracking-tight sm:text-lg">
              Make every key feel natural.
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Adaptive practice · a little more confidence with every lesson
            </p>
          </div>
          <Link
            to="/settings"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Adjust target and daily goal
          </Link>
        </div>
        <KeybrLessonMode
          focusKeys={focusKeys}
          sourceResultId={params.get("source") ?? undefined}
          retestTo={safeRetest}
          language={language}
          layout={layout}
        />
      </main>
      <Footer />
    </div>
  );
}
