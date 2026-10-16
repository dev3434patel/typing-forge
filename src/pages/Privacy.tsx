import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
export default function Privacy() {
  const sections = [
    [
      "Practice on this device",
      "Guest sessions and preferences are stored in this browser. Where available, history uses IndexedDB. If browser storage fails, the app reports a memory fallback that lasts only for the current visit. Clearing site data or using another browser can remove or separate these records.",
    ],
    [
      "Optional account sync",
      "An account connects to the Supabase service configured by this installation. Authentication uses your account credentials and session tokens. Public-corpus results can enter an owner-bound upload queue. Local storage and cloud storage are separate; a failed upload does not mean the result is already stored remotely.",
    ],
    [
      "Your private passages",
      "Custom passages and free writing stay local unless you explicitly allow cloud storage for that session. Consenting to upload includes its target, typed text and input evidence. Avoid entering passwords, confidential material or text you do not have permission to share.",
    ],
    [
      "Result and replay evidence",
      "A completed session can contain its target, typed text, timed edits, assistance flags and derived metrics. Raw evidence is scheduled to expire after 90 days while summaries can remain. Local expiry runs when the app is open; cloud expiry depends on the deployed server cleanup job. Downloaded exports remain wherever you save them.",
    ],
    [
      "Public results",
      "Eligible server-accepted challenges may appear with a public handle in matching rankings. Handles are separate from email addresses. Ordinary guest practice, local bots and unaccepted browser evidence do not become verified public scores.",
    ],
    [
      "Keyboard Lab",
      "The lab keeps observations in memory during the page visit. It does not save or upload its key map, typed survey or transition timings. A browser layout request happens only when you choose it. The lab cannot identify a keyboard brand, switch type or finger placement.",
    ],
    [
      "Offline app files",
      "The optional service worker downloads public application files and a generic page shell so guest practice can reopen offline after installation completes. It does not cache Supabase responses, authentication requests or personalized API data. Removing the offline download leaves your typing history and preferences in place.",
    ],
    [
      "Your controls",
      "Preferences and Account provide export, local reset, guest import and account data controls where available. Destructive actions require confirmation. Changing accounts resets transient routed practice state. Deleting cloud data requires a working authenticated backend and does not delete files you previously exported.",
    ],
    [
      "Hosting and installation details",
      "This source does not add a behavioral analytics or advertising service. Your host, configured authentication service and browser may process connection or security information under their own policies. This page describes the application’s data behavior; it does not certify a particular deployment’s legal compliance.",
    ],
  ];
  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main max-w-3xl space-y-7">
        <div>
          <p className="eyebrow">Your practice belongs to you</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">
            Privacy & your data
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            A clear account of what this app stores, what can leave this device,
            and the controls available to you. Updated 16 October 2026.
          </p>
        </div>
        {sections.map(([title, text]) => (
          <section className="panel p-5 sm:p-7" key={title}>
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {text}
            </p>
          </section>
        ))}
        <nav
          className="flex flex-wrap gap-4 text-sm"
          aria-label="Privacy resources"
        >
          <Link
            className="text-primary underline underline-offset-4 min-h-11 inline-flex items-center"
            to="/settings"
          >
            Preferences & exports
          </Link>
          <Link
            className="text-primary underline underline-offset-4 min-h-11 inline-flex items-center"
            to="/profile"
          >
            Account data
          </Link>
          <Link
            className="text-primary underline underline-offset-4 min-h-11 inline-flex items-center"
            to="/offline"
          >
            Offline controls
          </Link>
        </nav>
      </main>
      <Footer />
    </div>
  );
}
