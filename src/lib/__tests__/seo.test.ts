import { describe, expect, it } from "vitest";
import { canonicalUrl, getRouteSeo, PUBLIC_SEO_ROUTES } from "../seo";
describe("public and private route metadata", () => {
  it("gives public intent pages distinct titles and descriptions", () => {
    const values = Object.values(PUBLIC_SEO_ROUTES);
    expect(new Set(values.map((value) => value.title)).size).toBe(
      values.length,
    );
    expect(new Set(values.map((value) => value.description)).size).toBe(
      values.length,
    );
  });
  it.each([
    "/profile",
    "/stats",
    "/settings",
    "/auth",
    "/ranked",
    "/leaderboard",
    "/race",
    "/race/room-private-id",
    "/offline",
    "/unknown",
  ])("does not index or canonicalize private/operational path %s", (path) => {
    expect(getRouteSeo(path).indexable).toBe(false);
    expect(canonicalUrl(path, "https://example.test")).toBeNull();
  });
  it("canonicalizes aliases to existing public workspaces", () => {
    expect(canonicalUrl("/typing-test", "https://example.test")).toBe(
      "https://example.test/",
    );
    expect(canonicalUrl("/typing-practice", "https://example.test")).toBe(
      "https://example.test/learn",
    );
    expect(canonicalUrl("/practice", "https://example.test")).toBe(
      "https://example.test/learn",
    );
  });
  it("uses the supplied actual origin and removes trailing route slashes", () => {
    expect(canonicalUrl("/touch-typing/", "http://127.0.0.1:4173")).toBe(
      "http://127.0.0.1:4173/touch-typing",
    );
    expect(
      canonicalUrl("/about", "https://example.test/ignored?secret=value"),
    ).toBe("https://example.test/about");
  });
  it.each([
    "not a URL",
    "javascript:alert(1)",
    "file:///private",
    "https://name:secret@example.test",
  ])("rejects an unsafe or invalid canonical origin %s", (origin) => {
    expect(canonicalUrl("/", origin)).toBeNull();
  });
  it("never reflects arbitrary private paths or query values into metadata", () => {
    const metadata = getRouteSeo("/unknown/private-token?secret=yes");
    expect(JSON.stringify(metadata)).not.toContain("private-token");
    expect(getRouteSeo("constructor").indexable).toBe(false);
  });
});
