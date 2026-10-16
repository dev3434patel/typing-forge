import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
export default function About() {
  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main max-w-3xl space-y-8">
        <div>
          <p className="eyebrow">Built for deliberate practice</p>
          <h1 className="text-4xl font-semibold mt-3">
            A clearer way to improve.
          </h1>
          <p className="text-muted-foreground leading-relaxed mt-4">
            SparowType brings focused tests, adaptive lessons, coding practice
            and races into one workspace. Your progress comes from the
            characters you actually type.
          </p>
        </div>
        <section className="panel p-6">
          <h2 className="text-xl font-medium mb-4">What your results mean</h2>
          <dl className="space-y-5 text-sm leading-relaxed">
            {[
              [
                "WPM",
                "Credited characters ÷ 5 ÷ elapsed minutes. Prose credits correct completed words and their actual separators; a timed test also credits the correct leading prefix of its final partial word. Code uses correct characters and is compared separately.",
              ],
              [
                "Input accuracy",
                "Correct insertion attempts ÷ all insertion attempts × 100. Correcting a mistake improves the final text, while the original mistake stays in your practice record. Deleting is not an insertion attempt.",
              ],
              [
                "Raw WPM & attempt rate",
                "Raw WPM measures the text still present, including errors. Attempt rate counts every inserted character, including characters you later delete. Both use the whole active duration.",
              ],
              [
                "Final text accuracy",
                "Correct retained characters as a percentage of processed target characters and extra characters. This is separate from input accuracy.",
              ],
              [
                "Consistency & burst",
                "Consistency summarizes the variation in one-second attempt-rate buckets, including idle time. It needs at least five seconds and five attempts. Burst is the highest complete five-second window. A dash means insufficient evidence.",
              ],
              [
                "Fair comparisons",
                "Personal bests compare the same metrics version, mode, duration, language, layout, scoring policy and assistance settings. Paused, repeated and assisted practice is identified. Legacy results keep their original definitions.",
              ],
            ].map(([term, meaning]) => (
              <div key={term}>
                <dt className="font-medium mb-1">{term}</dt>
                <dd className="text-muted-foreground">{meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section>
          <h2 className="text-xl font-medium mb-3">Privacy & cloud features</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Guest practice works locally. Signed-in public-corpus sessions can
            enter a retryable cloud queue. Custom text and free writing require
            explicit consent to upload. Cloud ranking requires validated session
            evidence and a configured backend. Validation checks consistency; it
            cannot establish who or what produced a keystroke. Event evidence
            expires after 90 days. Use Preferences to export your local history
            and Account to manage account data.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-medium mb-3">Comparing typing tools</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Monkeytype, Keybr and SparowType use different scoring rules. Keybr’s
            lesson accuracy marks errors at accepted target positions; SparowType’s
            input accuracy counts insertion attempts, including repeated and
            corrected errors. SparowType’s consistency formula also differs from
            Monkeytype’s. Compare the same duration, language, passage and
            correction policy, and keep repeated practice separate from
            unseen-text benchmarks.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground mt-3">
            Use precision mode to wait at a wrong character without removing its
            accuracy cost. Results can show the exact arithmetic, word credits
            and recorded edit replay. Keyboard Lab checks observed browser input
            and optional layout information; it cannot diagnose switches,
            identify your keyboard model or prove typing skill.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-medium mb-3">Content & accessibility</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Curated language packs include source and revision metadata. The
            virtual keyboard is a visual reference; physical input follows your
            operating system’s layout. Native scripts support composed input and
            right-to-left text. Display quality depends on available script
            fonts. Reduced motion follows your device setting. All navigation
            and test controls are accessible with a keyboard.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
