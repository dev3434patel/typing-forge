import { lazy, Suspense, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
const Toaster = lazy(() =>
  import("@/components/ui/toaster").then((module) => ({
    default: module.Toaster,
  })),
);
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { AccountWorkspace } from "@/components/layout/AccountWorkspace";
import "./index.css";
import { applyRouteSeo } from "@/lib/seo";
const PwaStatus = lazy(() =>
  import("@/components/layout/PwaStatus").then((module) => ({
    default: module.PwaStatus,
  })),
);
const CommandPalette = lazy(() =>
  import("@/components/layout/CommandPalette").then((module) => ({
    default: module.CommandPalette,
  })),
);
const Learn = lazy(() => import("./pages/Learn"));
const Index = lazy(() => import("./pages/Index"));
const Stats = lazy(() => import("./pages/Stats"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const Race = lazy(() => import("./pages/Race"));
const Ranked = lazy(() => import("./pages/Ranked"));
const Settings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));
const KeyboardLab = lazy(() => import("./pages/KeyboardLab"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Offline = lazy(() => import("./pages/Offline"));
const TouchTyping = lazy(() => import("./pages/TouchTyping"));
function DeferredCommands() {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => {
      setLoaded(true);
      setOpen(true);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (
        !event.isComposing &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        if (!event.repeat) {
          setLoaded(true);
          setOpen((value) => !value);
        }
      }
    };
    window.addEventListener("forge:commands", show);
    window.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener("forge:commands", show);
      window.removeEventListener("keydown", keyboard);
    };
  }, []);
  return loaded ? (
    <Suspense fallback={null}>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </Suspense>
  ) : null;
}
function Notifications() {
  const { toasts } = useToast();
  return toasts.length ? (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  ) : null;
}
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    applyRouteSeo(pathname, window.location.origin);
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PreferencesProvider>
          <Notifications />
          {/* Replace the active typing route immediately while a lazy destination loads. */}
          <BrowserRouter useTransitions={false}>
            <RouteEffects />
            <DeferredCommands />
            <Suspense fallback={null}>
              <PwaStatus />
            </Suspense>
            <Suspense
              fallback={
                <main
                  className="forge-main py-24 text-muted-foreground"
                  role="status"
                >
                  Loading your workspace…
                </main>
              }
            >
              <AccountWorkspace>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/typing-test" element={<Index />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/typing-practice" element={<Learn />} />
                  <Route path="/practice" element={<Learn />} />
                  <Route path="/touch-typing" element={<TouchTyping />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/offline" element={<Offline />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/race" element={<Race />} />
                  <Route path="/race/:roomCode" element={<Race />} />
                  <Route path="/ranked" element={<Ranked />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/keyboard-lab" element={<KeyboardLab />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AccountWorkspace>
            </Suspense>
          </BrowserRouter>
        </PreferencesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
