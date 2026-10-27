import { afterEach, describe, expect, it, vi } from "vitest";
import { createWorkspaceLoader, shouldWarmHomeWorkspace } from "./workspace-loader";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("independent application workspace loading", () => {
  it("does not request the application until preparation is actually requested", async () => {
    const application = { default: "application" };
    const importer = vi.fn().mockResolvedValue(application);
    const load = createWorkspaceLoader(importer);
    expect(importer).not.toHaveBeenCalled();
    await expect(load()).resolves.toBe(application);
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("shares one pending import between concurrent opening and React consumers", async () => {
    let resolve: (application: object) => void = () => {};
    const pending = new Promise<object>((complete) => { resolve = complete; });
    const importer = vi.fn(() => pending);
    const load = createWorkspaceLoader(importer);
    const opening = load();
    const react = load();
    expect(react).toBe(opening);
    expect(importer).toHaveBeenCalledTimes(1);
    const application = { default: "application" };
    resolve(application);
    await expect(opening).resolves.toBe(application);
    await expect(react).resolves.toBe(application);
  });

  it("retains the fulfilled import for later consumers without importing again", async () => {
    const application = { default: "application" };
    const importer = vi.fn().mockResolvedValue(application);
    const load = createWorkspaceLoader(importer);
    const first = load();
    await first;
    expect(load()).toBe(first);
    await expect(load()).resolves.toBe(application);
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("publishes the same rejection to current consumers and permits a fresh retry", async () => {
    const failure = new Error("Application request failed");
    const application = { default: "recovered application" };
    const importer = vi.fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(application);
    const load = createWorkspaceLoader(importer);
    const first = load();
    const concurrent = load();
    expect(concurrent).toBe(first);
    await expect(first).rejects.toBe(failure);
    await expect(concurrent).rejects.toBe(failure);
    const retry = load();
    expect(retry).not.toBe(first);
    await expect(retry).resolves.toBe(application);
    expect(load()).toBe(retry);
    expect(importer).toHaveBeenCalledTimes(2);
  });

  it("preserves concurrent preparation only for the actual home and test alias", () => {
    for (const path of ["/", "/typing-test", "/typing-test/"])
      expect(shouldWarmHomeWorkspace(path), path).toBe(true);
    for (const path of ["/auth", "/stats", "/learn", "/typing-test/example"])
      expect(shouldWarmHomeWorkspace(path), path).toBe(false);
  });

  it("selects home preparation inside a Pages base without warming unrelated installations", async () => {
    vi.stubEnv("BASE_URL", "/project/");
    vi.resetModules();
    const { shouldWarmHomeWorkspace: shouldWarm } = await import("./workspace-loader");
    for (const path of ["/project", "/project/", "/project/typing-test", "/project/typing-test/"])
      expect(shouldWarm(path), path).toBe(true);
    for (const path of ["/", "/auth", "/project/auth", "/project/stats", "/project-other/"])
      expect(shouldWarm(path), path).toBe(false);
  });
});
