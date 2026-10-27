export const DEPLOYMENT_TARGETS = ["php", "vercel", "github-pages"];

export function normalizeBasePath(value = "/") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\?#%]/.test(value)
  )
    throw new Error(
      "The application base must be an absolute URL pathname, such as / or /repository/.",
    );
  const parts = value.split("/").filter(Boolean);
  if (
    parts.some(
      (part) =>
        !/^[A-Za-z0-9._~-]+$/.test(part) || part === "." || part === "..",
    )
  )
    throw new Error(
      "The application base contains an unsupported or traversing path segment.",
    );
  return parts.length ? `/${parts.join("/")}/` : "/";
}

export function resolveDeploymentConfig(environment = {}) {
  const target = environment.SPAROWTYPE_DEPLOY_TARGET || "php";
  if (!DEPLOYMENT_TARGETS.includes(target))
    throw new Error("Unknown SparowType deployment target.");
  const base = normalizeBasePath(environment.SPAROWTYPE_BASE_PATH || "/");
  const frontendOnly = target !== "php";
  const siteUrl = environment.SPAROWTYPE_SITE_URL || "";
  if (siteUrl) {
    const parsed = new URL(siteUrl);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== base
    )
      throw new Error(
        "The public site URL must match the application base, without credentials, query or fragment.",
      );
  }
  return {
    target,
    base,
    frontendOnly,
    // A static build must never inherit an API URL from a developer's .env.
    apiBase: frontendOnly
      ? "disabled"
      : environment.VITE_API_BASE_URL?.trim() || "/api",
    siteUrl,
  };
}

export function resolvePagesLocation(repository, siteUrl = "") {
  if (siteUrl) {
    const url = new URL(siteUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error(
        "The Pages site URL must be an HTTPS URL without credentials, query or fragment.",
      );
    const base = normalizeBasePath(url.pathname);
    return { base, siteUrl: url.origin + base };
  }
  if (
    typeof repository !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+$/.test(repository)
  )
    throw new Error(
      "GitHub Pages requires --repository owner/repository, GITHUB_REPOSITORY, or --site-url.",
    );
  const [owner, name] = repository.split("/");
  const base =
    name.toLowerCase() === `${owner.toLowerCase()}.github.io`
      ? "/"
      : normalizeBasePath(`/${name}/`);
  return { base, siteUrl: `https://${owner.toLowerCase()}.github.io${base}` };
}
