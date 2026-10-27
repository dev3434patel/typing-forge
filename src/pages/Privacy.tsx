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
      "Accounts use this installation’s server and database. Authentication uses a protected session cookie; sign-in tokens are not stored in browser local storage. Public-corpus results can enter an account-bound upload queue. Browser storage and account storage are separate; a failed upload does not mean the result is already stored on the server.",
    ],
    [
      "Your private passages",
      "Custom passages and free writing stay local unless you explicitly allow cloud storage for that session. Consenting to upload includes its target, typed text and input evidence. Avoid entering passwords, confidential material or text you do not have permission to share.",
    ],
    [
      "Result and replay evidence",
      "A completed session can contain its target, typed text, timed edits, assistance flags and derived metrics. Raw replay evidence is scheduled to expire after 90 days. Summary history and public-corpus learning projections, including ordered expected/typed keys and timing, can remain until you delete the session or account. Learn Typing keeps a small course grading record, including the lesson, result and qualification checks, until you delete the session or account; raw replay expiry does not erase that progress. These learning records can reconstruct portions of public practiced text; replay expiry does not delete all character-level learning data. Private custom passages and free writing do not receive this public-corpus projection. Browser expiry runs when the app is open; server expiry runs when account history is accessed and through the host’s cleanup command. Downloaded exports remain wherever you save them.",
    ],
    [
      "Public results",
      "Eligible server-accepted challenges may appear with a public handle in matching rankings. Handles are separate from email addresses. Ordinary guest practice, local bots and unaccepted browser evidence do not become verified public scores.",
    ],
    [
      "Arcade replays and your collection",
      "Arcade keeps bounded local best summaries and up to six canonical replays for features such as your own ghost. Raw replay copies follow the same 90-day expiry as session history; deletion of their source session also removes the replay and any best derived from it. Expiry runs while the app is open and when these records are read or exported. If durable removal is blocked, the app hides that copy for the current visit and reports that persistent removal remains unconfirmed. Separate reward receipts retain personal aggregate skill counts and timing statistics with source hashes rather than an ordered passage or raw event stream. These progression records survive individual session deletion to preserve reward and purchase history: local receipts remain until device workspace reset; verified receipts remain until account deletion. They are personal progress data, not anonymous data. Account rewards and leagues reference server-accepted evidence; local rewards never become verified standings.",
    ],
    [
      "Appearance and optional reminders",
      "Imported themes and WOFF2 fonts stay in this owner workspace on this device. They are included in its explicit export and reset, and are never uploaded by the editor. Optional in-app reminders require an explicit opt-in, use a local delivery journal and cross-tab lock, and have no background push, email provider or third-party tracking. They wait while you type and are limited to one local calendar day with at least 24 hours between deliveries.",
    ],
    [
      "Friends, duels and Arena",
      "Account friends and asynchronous duels use public handles. Other users receive bounded public progress and accepted comparisons, never your email or raw input stream. Private room codes allow access to the corresponding room. Arena replay evidence follows session retention and is removed with its source session or account. Blocking and reporting create owner-bound server records; a review request records a request and does not promise that a human moderator has approved it. Replay validation cannot prove that a person physically typed the input.",
    ],
    [
      "Placement guidance and course stars",
      "Optional placement uses three canonical practice sessions. A small local placement record keeps owner/session/run identities, stage, duration, attempt counts and derived statistics after raw replay expiry; it does not duplicate the passage or keystrokes. Deleting its session or workspace removes this record. Placement and personal course stars are guidance rather than ranked scores or identity-verified certificates. Free practice assist cannot award course checkpoints.",
    ],
    [
      "Classroom lite",
      "Device-only classrooms store bounded aliases and manually entered aggregate reports in owner-scoped browser storage. Their local labels cannot invite another device; report exchange is explicit. Server classrooms require a teacher account but students can use an alias and private code without an email account. Joining creates a narrow classroom session capability, not general account access. Choosing Share aggregate result sends the issued practice’s canonical event evidence for a replay check; classroom storage retains aggregate numeric facts and an evidence hash, not the raw log or typed text. Teachers receive aliases and aggregates only. Server private codes contain random secrets and are stored as hashes. Leaving and deleting class reports removes the current student membership and its reports; deleting the class or teacher account cascades its class data. Exported participation summaries omit aliases by default and remain wherever you save them. These defaults are not a legal compliance certification.",
    ],
    [
      "Keyboard Lab",
      "The lab keeps observations in memory during the page visit. It does not save or upload its key map, typed survey or transition timings. A browser layout request happens only when you choose it. The lab cannot identify a keyboard brand, switch type or finger placement.",
    ],
    [
      "Signal Run games",
      "Game input stays in memory during a run. Completed, unassisted local bests store only the mode, gates, clean gates, accuracy, active duration and pause flag in owner-scoped browser storage. They do not store your typed words, enter typing history or sync to rankings. You can clear game bests in Games, include them in local exports, or remove them with a workspace reset or acknowledged account deletion. These browser-editable records are not verified competitive scores.",
    ],
    [
      "Offline app files",
      "The optional service worker downloads public application files and a generic page shell so guest practice can reopen offline after installation completes. It does not cache authentication requests or personalized API data. Removing the offline download leaves your typing history and preferences in place.",
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
            and the controls available to you. Updated 21 October 2026.
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
