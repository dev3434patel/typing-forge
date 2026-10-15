import { lazy, Suspense, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
const Toaster = lazy(() =>
  import("@/components/ui/toaster").then((module) => ({
    default: module.Toaster,
  })),
);
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { AccountWorkspace } from "@/components/layout/AccountWorkspace";
const CommandPalette = lazy(() =>
  import("@/components/layout/CommandPalette").then((module) => ({
    default: module.CommandPalette,
  })),
);
const Index = lazy(() => import("./pages/Index"));
const Learn = lazy(() => import("./pages/Learn"));
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
    document.title = `${({ "/": "Practice", "/learn": "Learn", "/stats": "Progress", "/settings": "Preferences", "/race": "Race", "/leaderboard": "Rankings", "/profile": "Account", "/about": "About", "/auth": "Sign in", "/keyboard-lab": "Keyboard Lab", "/ranked": "Ranked challenge" } as Record<string, string>)[pathname] || "Typing"} · Typing Forge`;
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PreferencesProvider>
          <TooltipProvider>
            <Notifications />
            <BrowserRouter>
              <RouteEffects />
              <DeferredCommands />
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
                    <Route path="/learn" element={<Learn />} />
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
          </TooltipProvider>
        </PreferencesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
