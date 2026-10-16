import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPwaDownload,
  getPwaState,
  hasOfflineApp,
  isPublicAppCache,
} from "../pwa";

afterEach(() => vi.unstubAllGlobals());
function cacheFixture(entries: Record<string, string[]>) {
  const values = new Map(Object.entries(entries));
  return {
    keys: vi.fn(async () => [...values.keys()]),
    open: vi.fn(async (name: string) => ({
      match: vi.fn(async (path: string) =>
        values.get(name)?.includes(path)
          ? new Response("public file")
          : undefined,
      ),
    })),
    delete: vi.fn(async (name: string) => values.delete(name)),
    values,
  };
}
describe("public offline download controls", () => {
  it("recognizes only the dedicated public cache namespace", () => {
    expect(isPublicAppCache("sparowtype-public-v1-buildhash")).toBe(true);
    expect(isPublicAppCache("another-app-private")).toBe(false);
    expect(isPublicAppCache("typingforge-sessions")).toBe(false);
  });
  it("requires both generic shell and recovery page before saying a download exists", async () => {
    const incomplete = cacheFixture({
      "sparowtype-public-v1-build": ["/index.html"],
    });
    expect(await hasOfflineApp(incomplete as unknown as CacheStorage)).toBe(
      false,
    );
    const complete = cacheFixture({
      "sparowtype-public-v1-build": ["/index.html", "/_offline-recovery.html"],
    });
    expect(await hasOfflineApp(complete as unknown as CacheStorage)).toBe(true);
  });
  it("does not treat another cache containing similar filenames as an app download", async () => {
    const fixture = cacheFixture({
      "another-app-private": ["/index.html", "/_offline-recovery.html"],
    });
    expect(await hasOfflineApp(fixture as unknown as CacheStorage)).toBe(false);
    expect(fixture.open).not.toHaveBeenCalled();
  });
  it("reports unavailable storage as unprepared rather than throwing or inventing readiness", async () => {
    expect(await hasOfflineApp(undefined)).toBe(false);
    expect(
      await hasOfflineApp({
        keys: async () => {
          throw new Error("blocked");
        },
      } as unknown as CacheStorage),
    ).toBe(false);
  });
  it("clears only public app files without accessing history, preferences or other app caches", async () => {
    const fixture = cacheFixture({
      "sparowtype-public-v1-first": ["/index.html"],
      "sparowtype-public-v1-next": ["/_offline-recovery.html"],
      "another-app-private": ["private"],
    });
    const historyClear = vi.fn();
    vi.stubGlobal("caches", fixture);
    vi.stubGlobal("indexedDB", { deleteDatabase: historyClear });
    vi.stubGlobal("localStorage", {
      clear: historyClear,
      removeItem: historyClear,
    });
    await clearPwaDownload();
    expect([...fixture.values.keys()]).toEqual(["another-app-private"]);
    expect(historyClear).not.toHaveBeenCalled();
    expect(getPwaState()).toMatchObject({
      phase: "idle",
      updateAvailable: false,
    });
  });
});
