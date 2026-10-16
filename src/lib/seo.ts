export interface PageSeo {
  title: string;
  description: string;
  indexable: boolean;
  canonicalPath?: string;
}

const page = (
  title: string,
  description: string,
  indexable = true,
  canonicalPath?: string,
): PageSeo => ({
  title: `${title} · SparowType`,
  description,
  indexable,
  canonicalPath,
});
export const PUBLIC_SEO_ROUTES: Readonly<Record<string, PageSeo>> = {
  "/": page(
    "Typing test and deliberate practice",
    "Measure typing speed and input accuracy with timed tests, real correction evidence and focused practice. Start as a guest.",
  ),
  "/typing-test": page(
    "Free typing speed test",
    "Take a timed typing test, inspect WPM and accuracy, then practice the keys that need attention. Your local results stay on this device.",
    true,
    "/",
  ),
  "/learn": page(
    "Adaptive typing practice",
    "Build touch typing skills with lessons that use observed key accuracy and timing. Introduce new letters as your evidence grows.",
  ),
  "/typing-practice": page(
    "Practice typing with purpose",
    "Use adaptive typing lessons, targeted keys and a daily practice goal. Start with a manageable set of letters and grow steadily.",
    true,
    "/learn",
  ),
  "/practice": page(
    "Focused typing practice",
    "Practice your weaker keys with adaptive lessons and clear progress evidence. Keep repeated passages separate from fresh typing tests.",
    true,
    "/learn",
  ),
  "/touch-typing": page(
    "How to learn touch typing",
    "Learn a practical touch typing routine: comfortable posture, keyboard reference, accuracy before speed and short, focused practice.",
  ),
  "/keyboard-lab": page(
    "Keyboard layout and transition lab",
    "Inspect the key codes and characters your browser reports. Check layout hints and build short drills from measured transitions.",
  ),
  "/about": page(
    "About and typing metrics",
    "Understand SparowType WPM, input accuracy, final text accuracy, comparison rules and the limits of browser evidence.",
  ),
  "/privacy": page(
    "Privacy and local data",
    "Understand local history, account sync, private passage consent, replay retention and data controls in SparowType.",
  ),
  "/terms": page(
    "Use and service information",
    "Read the conditions and limits of using SparowType for personal typing practice, shared content and optional account features.",
  ),
};
const PRIVATE_PAGES: Readonly<Record<string, PageSeo>> = {
  "/stats": page(
    "Your typing progress",
    "Your owner-scoped typing history, measured key evidence and comparable practice results.",
    false,
  ),
  "/profile": page(
    "Your account and data",
    "Manage your account identity, local history, exports and deletion controls.",
    false,
  ),
  "/settings": page(
    "Practice preferences",
    "Choose your typing preferences, theme, language, keyboard reference and data controls.",
    false,
  ),
  "/auth": page(
    "Sign in or create an account",
    "Sign in to use optional account sync. Guest typing practice is available without an account.",
    false,
  ),
  "/ranked": page(
    "Server-issued typing challenge",
    "Request an authenticated typing challenge. Results remain provisional until the configured server accepts their replay.",
    false,
  ),
  "/race": page(
    "Typing races",
    "Practice with a labelled local opponent or use authenticated human rooms when the backend is available.",
    false,
  ),
  "/leaderboard": page(
    "Verified comparison rankings",
    "Browse results accepted by the configured server within matching typing rules and settings.",
    false,
  ),
  "/offline": page(
    "Offline practice",
    "See what works without a connection and manage this device’s public app download.",
    false,
  ),
};
export function getRouteSeo(pathname: string): PageSeo {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
  if (Object.hasOwn(PUBLIC_SEO_ROUTES, path)) return PUBLIC_SEO_ROUTES[path];
  if (Object.hasOwn(PRIVATE_PAGES, path)) return PRIVATE_PAGES[path];
  if (/^\/race\/[^/]+$/.test(path))
    return page(
      "Private race room",
      "An authenticated typing room. Room details are not intended for search indexing.",
      false,
    );
  return page(
    "Page not found",
    "This page is unavailable. Return to typing practice or explore the touch typing guide.",
    false,
  );
}
export function canonicalUrl(pathname: string, origin: string): string | null {
  const metadata = getRouteSeo(pathname);
  if (!metadata.indexable) return null;
  try {
    const parsed = new URL(origin);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    )
      return null;
    const path =
      metadata.canonicalPath ??
      (pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/");
    return new URL(path, parsed.origin).href;
  } catch {
    return null;
  }
}
function setMeta(
  documentValue: Document,
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let element = documentValue.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!element) {
    element = documentValue.createElement("meta");
    element.setAttribute(attribute, key);
    documentValue.head.append(element);
  }
  element.content = content;
}
/** Route metadata follows the current origin; no invented deployment domain or private query values. */
export function applyRouteSeo(
  pathname: string,
  origin: string,
  documentValue: Document = document,
): void {
  const metadata = getRouteSeo(pathname);
  const canonical = canonicalUrl(pathname, origin);
  documentValue.title = metadata.title;
  setMeta(documentValue, "name", "description", metadata.description);
  setMeta(
    documentValue,
    "name",
    "robots",
    metadata.indexable ? "index,follow" : "noindex,nofollow",
  );
  setMeta(documentValue, "property", "og:title", metadata.title);
  setMeta(documentValue, "property", "og:description", metadata.description);
  setMeta(documentValue, "property", "og:type", "website");
  setMeta(documentValue, "name", "twitter:title", metadata.title);
  setMeta(documentValue, "name", "twitter:description", metadata.description);
  const image = new URL("/og-sparowtype.png", origin).href;
  setMeta(documentValue, "property", "og:image", image);
  setMeta(documentValue, "property", "og:image:width", "1200");
  setMeta(documentValue, "property", "og:image:height", "630");
  setMeta(documentValue, "name", "twitter:image", image);
  let schema = documentValue.head.querySelector<HTMLScriptElement>('script[data-sparowtype-schema]');
  if (canonical) {
    if (!schema) { schema = documentValue.createElement("script"); schema.type = "application/ld+json"; schema.dataset.sparowtypeSchema = "true"; documentValue.head.append(schema); }
    schema.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "WebApplication", name: "SparowType", url: canonical, applicationCategory: "EducationalApplication", operatingSystem: "Web", description: metadata.description, image });
  } else schema?.remove();
  let link = documentValue.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (canonical) {
    if (!link) {
      link = documentValue.createElement("link");
      link.rel = "canonical";
      documentValue.head.append(link);
    }
    link.href = canonical;
    setMeta(documentValue, "property", "og:url", canonical);
  } else {
    link?.remove();
    documentValue.head.querySelector('meta[property="og:url"]')?.remove();
  }
}
