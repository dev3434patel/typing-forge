import { Gamepad2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SignalRun } from "@/components/games/SignalRun";
import { useAuth } from "@/hooks/useAuth";
import { Link } from 'react-router-dom';

export default function Games() {
  const { user } = useAuth();
  const owner = user?.id ?? "guest";
  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow inline-flex items-center gap-2">
              <Gamepad2 size={15} /> Play with purpose
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A different kind of flow<span className="text-primary">.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Small worlds. Real character accuracy. Turn a little practice into
              a journey.
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
            Works offline after loading · no account needed
          </span>
        </div>
        <div className="mb-8 flex flex-wrap gap-3"><Link className="forge-button" to="/arcade">Explore the arcade</Link><Link className="forge-button-secondary" to="/progression">Your daily quests</Link></div>
        <SignalRun key={owner} owner={owner} />
      </main>
      <Footer />
    </div>
  );
}
