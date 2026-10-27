import { afterEach, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import {
  normalizeBasePath,
  resolveDeploymentConfig,
  resolvePagesLocation,
} from "../../../build/deployment-config.mjs";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("explicit deployment contracts", () => {
  it("can be imported by a plain Node tool without Vite's import.meta.env", () => {
    const moduleUrl = new URL("../deployment.ts", import.meta.url).href;
    const script = `const value = await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify({base:value.APP_BASE_PATH,target:value.DEPLOYMENT_TARGET,static:value.FRONTEND_ONLY}));`;
    const result = spawnSync(process.execPath, ["--experimental-transform-types", "--input-type=module", "--eval", script], { encoding: "utf8", windowsHide: true });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ base: "/", target: "php", static: false });
  });
  it("retains the PHP root API by default", () => {
    expect(resolveDeploymentConfig()).toMatchObject({
      target: "php",
      base: "/",
      frontendOnly: false,
      apiBase: "/api",
    });
    expect(
      resolveDeploymentConfig({
        VITE_API_BASE_URL: "https://api.example.test/api",
      }).apiBase,
    ).toBe("https://api.example.test/api");
  });
  it.each(["vercel", "github-pages"])(
    "forcibly disables inherited API credentials/URLs in %s output",
    (target) => {
      expect(
        resolveDeploymentConfig({
          SPAROWTYPE_DEPLOY_TARGET: target,
          VITE_API_BASE_URL: "http://127.0.0.1:8081/api",
        }).apiBase,
      ).toBe("disabled");
    },
  );
  it("derives project, user and custom-domain Pages locations without a hardcoded account", () => {
    expect(resolvePagesLocation("Owner/project")).toEqual({
      base: "/project/",
      siteUrl: "https://owner.github.io/project/",
    });
    expect(resolvePagesLocation("Owner/owner.github.io")).toEqual({
      base: "/",
      siteUrl: "https://owner.github.io/",
    });
    expect(
      resolvePagesLocation(undefined, "https://typing.example.test/"),
    ).toEqual({ base: "/", siteUrl: "https://typing.example.test/" });
  });
  it.each([
    "https://host/",
    "//host/",
    "/../secret/",
    "/a/%2e%2e/",
    "/a?x=y",
    "/a\\b/",
  ])("rejects unsafe/ambiguous asset base %s", (value) => {
    expect(() => normalizeBasePath(value)).toThrow();
  });
  it("rejects mismatched canonical base and unsafe publication URLs", () => {
    expect(() =>
      resolveDeploymentConfig({
        SPAROWTYPE_BASE_PATH: "/project/",
        SPAROWTYPE_SITE_URL: "https://example.test/",
      }),
    ).toThrow();
    expect(() =>
      resolvePagesLocation(undefined, "https://name:secret@example.test/"),
    ).toThrow();
    expect(() => resolvePagesLocation("missing-owner")).toThrow();
  });
  it("keeps router, assets, origin-safe route detection and SEO inside the project path", async () => {
    vi.stubEnv("BASE_URL", "/project/");
    vi.stubEnv("VITE_DEPLOYMENT_TARGET", "github-pages");
    const deployment = await import("../deployment");
    expect(deployment.APP_ROUTER_BASENAME).toBe("/project");
    expect(deployment.appPath("/fonts/a.woff2")).toBe("/project/fonts/a.woff2");
    expect(deployment.localRoutePath("/project/lessons")).toBe("/lessons");
    expect(deployment.localRoutePath("/project")).toBe("/");
    expect(deployment.localRoutePath("/project-two/lessons")).toBeNull();
    const seo = await import("../seo");
    expect(
      seo.canonicalUrl("/typing-practice", "https://owner.github.io"),
    ).toBe("https://owner.github.io/project/learn/");
  });
  it("makes every static API request fail locally without a fetch or auth probe", async () => {
    vi.stubEnv("VITE_DEPLOYMENT_TARGET", "github-pages");
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:8081/api");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const api = await import("../../services/php-api");
    expect(api.isBackendConfigured).toBe(false);
    await expect(api.authService.getSession()).rejects.toMatchObject({
      code: "backend-unavailable",
    });
    await expect(
      api.accountApi.submit({}, false, "guest"),
    ).rejects.toMatchObject({ code: "backend-unavailable" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("does not treat another Pages installation's cache as this app's download", async () => {
    vi.stubEnv("BASE_URL", "/project/");
    const pwa = await import("../pwa");
    expect(pwa.isPublicAppCache("sparowtype-public-v1-rootbuild")).toBe(false);
    expect(
      pwa.isPublicAppCache("sparowtype-public-subpath-%2Fother%2F-build"),
    ).toBe(false);
    expect(
      pwa.isPublicAppCache("sparowtype-public-subpath-%2Fproject%2F-build"),
    ).toBe(true);
  });
});
