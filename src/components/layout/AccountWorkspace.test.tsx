import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountWorkspace } from "./AccountWorkspace";

const state = vi.hoisted(() => ({
  loading: true, backend: true, pathname: "/", user: null as { id: string } | null,
  mountedChildren: 0,
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: state.user, loading: state.loading }) }));
vi.mock("@/services/php-api", () => ({ get isBackendConfigured() { return state.backend; } }));
vi.mock("react-router-dom", async importActual => ({
  ...await importActual<typeof import("react-router-dom")>(),
  useLocation: () => ({ pathname: state.pathname }),
}));

function InteractiveChild() {
  state.mountedChildren++;
  return <input aria-label="Owner-scoped practice" />;
}
const render = () => renderToStaticMarkup(<AccountWorkspace><InteractiveChild /></AccountWorkspace>);

beforeEach(() => Object.assign(state, { loading: true, backend: true, pathname: "/", user: null, mountedChildren: 0 }));

describe("initial account ownership preparation", () => {
  it.each([
    "/", "/typing-test", "/learn", "/typing-practice", "/practice",
    "/lessons", "/games", "/race", "/race/ABC123", "/stats", "/profile",
    "/settings", "/ranked", "/keyboard-lab", "/LEARN/", "/%6cearn",
    "/arcade", "/arcade/word-invaders", "/progression", "/studio", "/classroom",
    "/friends", "/arena", "/arena/ABCD1234",
  ])("does not mount interactive %s before a configured cookie session resolves", pathname => {
    state.pathname = pathname;
    const html = render();
    expect(html).toContain('id="workspace-preparation"');
    expect(html).not.toContain('id="main-content"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Checking your account and preparing this workspace…");
    expect(html).not.toContain("Owner-scoped practice");
    expect(state.mountedChildren).toBe(0);
  });
  it.each(["/auth", "/about", "/privacy", "/terms", "/offline", "/touch-typing", "/leaderboard", "/missing-page", "/%E0%A4%A"])("keeps public %s available while account bootstrap is pending", pathname => {
    state.pathname = pathname;
    expect(render()).toContain("Owner-scoped practice");
    expect(state.mountedChildren).toBe(1);
  });
  it.each(["/", "/learn", "/lessons", "/games", "/race", "/keyboard-lab"])("mounts frontend-only %s immediately even if the provider still reports loading", pathname => {
    state.pathname = pathname;
    state.backend = false;
    expect(render()).toContain("Owner-scoped practice");
    expect(state.mountedChildren).toBe(1);
  });
  it.each([null, { id: "resolved-account" }])("mounts the resolved guest/account with its original owner-remount key", user => {
    state.loading = false;
    state.user = user;
    const element = AccountWorkspace({ children: <InteractiveChild /> });
    expect(element.key).toBe(user?.id ?? "guest");
    expect(renderToStaticMarkup(element)).toContain("Owner-scoped practice");
    expect(state.mountedChildren).toBe(1);
  });
});
