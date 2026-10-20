import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
export default function TouchTyping() {
  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main max-w-4xl space-y-8">
        <div>
          <p className="eyebrow">A foundation you can build on</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">
            Learn touch typing, one calm step at a time.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            Touch typing means finding keys by learned movement while keeping
            your attention on the text. Start with accuracy and a comfortable
            setup; speed is a result to observe, not a reason to rush.
          </p>
        </div>
        <section className="panel p-5 sm:p-7">
          <h2 className="text-xl font-medium">1. Settle into your keyboard</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sit comfortably, leave room to move your hands, and keep your
            shoulders relaxed. On a standard QWERTY reference, F and J usually
            have tactile markers for your index fingers. The home row is A S D F
            and J K L ;, with thumbs near Space. Other layouts and accessibility
            needs can call for different arrangements.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This is a reference, not a detector of your fingers or posture. Your
            operating system controls the characters your keyboard produces.
            Check the app’s virtual layout in Keyboard Lab if labels look
            unfamiliar.
          </p>
          <Link className="forge-button-secondary mt-5" to="/keyboard-lab">
            Check your input setup
          </Link>
        </section>
        <section className="panel p-5 sm:p-7">
          <h2 className="text-xl font-medium">
            2. Work with a small set of letters
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            New to the keyboard? Follow the structured English/QWERTY course from
            home-row keys through punctuation, then train sustained speed. Each
            lesson explains its targets and needs two qualifying passages to complete.
          </p>
          <Link className="forge-button mt-5" to="/lessons">Explore typing lessons</Link>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Use adaptive practice to build familiarity before adding complexity.
            Read the next part of the word, type at a manageable pace, and
            reduce speed when errors repeat. The learning model uses actual
            attempts and sufficient repeated evidence; a single fast lesson does
            not establish mastery.
          </p>
          <Link className="forge-button mt-5" to="/typing-practice">
            Start adaptive practice
          </Link>
        </section>
        <section className="panel p-5 sm:p-7">
          <h2 className="text-xl font-medium">
            3. Choose a correction policy deliberately
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Normal practice lets mistakes remain visible so you can see what you
            typed and correct them. Precision mode waits at a wrong character.
            Both retain the original incorrect attempt in input accuracy.
            Backspace can repair the text without erasing that history.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Input accuracy describes insertion attempts. Final text accuracy
            describes what remains. A corrected passage can therefore have
            perfect final text and lower input accuracy.
          </p>
          <Link
            className="text-primary underline underline-offset-4 min-h-11 inline-flex items-center mt-3"
            to="/about"
          >
            Understand the measurements
          </Link>
        </section>
        <section className="panel p-5 sm:p-7">
          <h2 className="text-xl font-medium">4. Make a short practice loop</h2>
          <ol className="mt-4 list-decimal pl-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>Take a comfortable baseline test on fresh text.</li>
            <li>Choose one repeated error or weak transition to practice.</li>
            <li>Complete a focused lesson, with breaks when needed.</li>
            <li>
              Retest with the same rules. Keep repeated-text results separate
              from fresh-text benchmarks.
            </li>
          </ol>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A few focused minutes can be easier to sustain than a rushed long
            session. There is no promised speed or fixed improvement timetable.
            Your results are useful when the task and measurement rules stay
            comparable.
          </p>
        </section>
        <div className="flex flex-wrap gap-4">
          <Link className="forge-button" to="/typing-test">
            Take a baseline test
          </Link>
          <Link className="forge-button-secondary" to="/learn">
            Build a practice habit
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
