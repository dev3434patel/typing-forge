import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const NotFound = () => {
  return (
    <div className="forge-shell">
      <Header />
      <main id="main-content" className="forge-main max-w-3xl py-20">
        <p className="eyebrow">404 · A different path</p>
        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold">
          This page is out of reach.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground leading-relaxed">
          The address may have changed or the page may not exist. Your saved
          practice stays on this device. Choose a familiar place to continue.
        </p>
        <nav className="mt-8 flex flex-wrap gap-4" aria-label="Page recovery">
          <Link to="/" className="forge-button">
            Return to practice
          </Link>
          <Link to="/learn" className="forge-button-secondary">
            Adaptive lessons
          </Link>
          <Link to="/touch-typing" className="forge-button-secondary">
            Touch typing guide
          </Link>
        </nav>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
