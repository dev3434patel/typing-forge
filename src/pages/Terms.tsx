import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
export default function Terms() {
  const sections = [
    [
      "Personal practice",
      "SparowType is a tool for typing practice and performance feedback. Results depend on the selected duration, content, language, input method, correction policy and metric version. A result is not a professional qualification, employment certificate or medical assessment.",
    ],
    [
      "Accounts and fair use",
      "Use an account you are authorized to access. Do not submit another person’s identity, interfere with other users, attack the service or attempt to bypass access controls. Keep credentials private and use the account controls to sign out on shared devices.",
    ],
    [
      "Your text and exports",
      "Only enter text you are entitled to use. Keep sensitive or confidential material out of custom practice. You decide when to download exports or give explicit consent for private session uploads. An export can include typed text and replay evidence, so review it before sharing.",
    ],
    [
      "Rankings and competitions",
      "Rankings require acceptance by the configured backend. Browser replay checks internal consistency; they cannot establish who or what produced input. Assistance, repeated content, incompatible cohorts and local bots are labelled or separated. Do not present a provisional local score as an independently certified result.",
    ],
    [
      "Availability and changes",
      "Local practice can work without an account. Cloud accounts, synchronization, ranked challenges and human races depend on the host and configured backend. Offline practice requires a completed app download and can be affected by browser storage eviction. Save important history with the export controls.",
    ],
    [
      "Learning and accessibility",
      "The app provides practice guidance and configurable display options, not a guarantee of a particular improvement or compatibility with every keyboard, browser, input method or assistive tool. Use a comfortable position and stop or adjust practice if it causes discomfort.",
    ],
    [
      "Deployment responsibility",
      "This page describes intended application use. The operator of a public deployment is responsible for its contact information, applicable service policies and any required notices. No governing jurisdiction, accreditation, legal warranty or operator identity is invented here.",
    ],
  ];
  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main max-w-3xl space-y-7">
        <div>
          <p className="eyebrow">Clear expectations</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">
            Use & service information
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Practical conditions for using this typing workspace. Updated 16
            October 2026.
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
        <div className="flex flex-wrap gap-4">
          <Link className="forge-button-secondary" to="/privacy">
            Read about your data
          </Link>
          <Link className="forge-button" to="/">
            Start guest practice
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
