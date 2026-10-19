# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-identity.spec.ts >> same-account auth refresh preserves the unsaved handle without requesting the profile again
- Location: e2e\profile-identity.spec.ts:65:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 3
Received:   3

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - link "Skip to content" [ref=e6]:
      - /url: "#main-content"
    - generic [ref=e7]:
      - link "SparowType home" [ref=e8]:
        - /url: /
        - generic [ref=e9]:
          - generic [ref=e10]: Sparow
          - generic [ref=e11]: Type
      - generic [ref=e12]:
        - button "Switch to light theme" [ref=e13]
        - button "Open command palette" [ref=e20]
        - link "Settings" [ref=e23]:
          - /url: /settings
        - link "Sign in" [ref=e27]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e32]:
      - link "Test" [ref=e33]:
        - /url: /
      - link "Learn" [ref=e36]:
        - /url: /learn
      - link "Race" [ref=e40]:
        - /url: /race
      - link "Stats" [ref=e50]:
        - /url: /stats
      - link "Rankings" [ref=e53]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e60]:
        - /url: /keyboard-lab
  - main [ref=e63]:
    - generic [ref=e64]:
      - generic [ref=e70]:
        - paragraph [ref=e71]: Your SparowType profile
        - heading "Guest workspace" [level=1] [ref=e72]
        - paragraph [ref=e73]: 0 saved sessions · 0.0 minutes practiced
      - link "Sign in" [ref=e74]:
        - /url: /auth
    - generic [ref=e78]:
      - generic [ref=e79]:
        - generic [ref=e80]:
          - heading "Public identity" [level=2] [ref=e81]
          - paragraph [ref=e82]: A handle appears in human rooms and eligible rankings. Your email is private.
          - generic [ref=e83]: Handle
          - textbox "Handle" [disabled] [ref=e84]:
            - /placeholder: Sign in to choose a handle
          - paragraph [ref=e85]: 3–24 lowercase letters, numbers or underscores.
          - button "Save handle" [disabled] [ref=e86]
        - generic [ref=e87]:
          - heading "Your data, your choice" [level=2] [ref=e88]
          - paragraph [ref=e92]: Raw replay evidence and private text expire after 90 days. Summaries and public-corpus learning data, including expected and typed keys with timing, can remain until you delete the session or account. Cloud storage of private passages needs separate consent for each session.
          - button "Export this workspace" [disabled] [ref=e93]
          - link "Practice & appearance settings" [ref=e97]:
            - /url: /settings
          - paragraph [ref=e101]: "Workspace: guest · durable browser storage"
      - generic [ref=e102]:
        - generic [ref=e103]:
          - heading "Personal bests by comparison" [level=2] [ref=e104]
          - paragraph [ref=e105]: V3 metrics only. Repeated content, languages and durations are separate comparisons.
          - paragraph [ref=e106]: Complete a V3 session to set your first personal best.
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e109]:
              - heading "Your saved sessions" [level=2] [ref=e110]
              - paragraph [ref=e111]: Deletion also reconciles cloud comparisons and learning evidence.
            - link "View progress" [ref=e112]:
              - /url: /stats
          - paragraph [ref=e113]: No sessions saved in this workspace yet.
    - generic [ref=e114]:
      - heading "Reset guest workspace" [level=2] [ref=e115]
      - paragraph [ref=e116]: Remove guest history and learning evidence from this device. Other signed-in workspaces are preserved. Export your history first if you want a copy.
      - generic [ref=e117]: Type DELETE to enable this action
      - generic [ref=e118]:
        - textbox "Type DELETE to enable this action" [ref=e119]
        - button "Reset guest workspace" [disabled] [ref=e120]
  - contentinfo [ref=e121]:
    - generic [ref=e122]:
      - generic [ref=e123]:
        - generic [ref=e124]:
          - generic [ref=e125]: Sparow
          - generic [ref=e126]: Type
        - text: Find your rhythm.
      - generic [ref=e127]:
        - link "About & metrics" [ref=e128]:
          - /url: /about
        - link "Preferences & data" [ref=e129]:
          - /url: /settings
        - link "Touch typing guide" [ref=e130]:
          - /url: /touch-typing
        - link "Privacy" [ref=e131]:
          - /url: /privacy
        - link "Terms" [ref=e132]:
          - /url: /terms
        - link "Offline" [ref=e133]:
          - /url: /offline
        - generic [ref=e134]: SparowType © 2026
```

# Test source

```ts
  1  | import { test, expect, type Page, type Route } from "@playwright/test";
  2  | import { phpApiBase } from "./php-api-fixture";
  3  | 
  4  | const owner = "a1111111-1111-4111-8111-111111111111";
  5  | const initialHandle = "profile_fixture";
  6  | 
  7  | async function installIdentityFixture(page: Page, appUrl: string, profile: (route: Route) => Promise<void>) {
  8  |   const api = phpApiBase(appUrl);
  9  |   const calls = { sessions: 0, profiles: 0, savedHandles: [] as string[] };
  10 |   await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  11 |   await page.route(`${api.href}**`, async route => {
  12 |     const request = route.request();
  13 |     const url = new URL(request.url());
  14 |     const path = url.pathname.slice(api.pathname.length - 1);
  15 |     if (path === "/auth/session") {
  16 |       calls.sessions++;
  17 |       await route.fulfill({ json: { user: { id: owner, email: "profile@fixture.invalid", handle: initialHandle, created_at: "2026-10-19T00:00:00Z" }, csrfToken: `profile-csrf-${calls.sessions}` } });
  18 |     } else if (path === "/profile" && request.method() === "GET") {
  19 |       calls.profiles++;
  20 |       await profile(route);
  21 |     } else if (path === "/profile" && request.method() === "POST") {
  22 |       const body = request.postDataJSON() as { expectedOwner: string; handle: string };
  23 |       expect(body.expectedOwner).toBe(owner);
  24 |       calls.savedHandles.push(body.handle);
  25 |       await route.fulfill({ json: { id: owner, handle: body.handle } });
  26 |     } else {
  27 |       const body = path === "/preferences" ? { preferences: {}, version: 0 }
  28 |         : path === "/data/version" ? { ownerId: owner, version: 0 }
  29 |           : path.startsWith("/sessions") ? { ownerId: owner, sessions: [], learningEvidence: [], version: 0, hasMore: false }
  30 |             : {};
  31 |       await route.fulfill({ json: body });
  32 |     }
  33 |   });
  34 |   return { api, calls };
  35 | }
  36 | 
  37 | test("a delayed initial profile response keeps the handle unavailable until its identity is loaded", async ({ page, baseURL }) => {
  38 |   let releaseProfile!: () => void;
  39 |   const profileGate = new Promise<void>(resolve => { releaseProfile = resolve; });
  40 |   const { calls } = await installIdentityFixture(page, baseURL!, async route => {
  41 |     await profileGate;
  42 |     await route.fulfill({ json: { id: owner, handle: initialHandle } });
  43 |   });
  44 |   try {
  45 |     await page.goto("/profile");
  46 |     await expect.poll(() => calls.profiles).toBe(1);
  47 |     const handle = page.getByRole("textbox", { name: "Handle", exact: true });
  48 |     const save = page.getByRole("button", { name: "Save handle", exact: true });
  49 |     await expect(handle).toBeDisabled();
  50 |     await expect(save).toBeDisabled();
  51 |     await expect(page.getByRole("status").filter({ hasText: "Loading public identity…" })).toBeVisible();
  52 |     releaseProfile();
  53 |     await expect(handle).toBeEnabled();
  54 |     await expect(handle).toHaveValue(initialHandle);
  55 |     await handle.fill("delayed_identity_draft");
  56 |     await save.click();
  57 |     await expect(page.getByRole("status").filter({ hasText: "Your public handle is saved." })).toBeVisible();
  58 |     expect(calls.savedHandles).toEqual(["delayed_identity_draft"]);
  59 |     expect(calls.profiles).toBe(1);
  60 |   } finally {
  61 |     releaseProfile();
  62 |   }
  63 | });
  64 | 
  65 | test("same-account auth refresh preserves the unsaved handle without requesting the profile again", async ({ page, baseURL }) => {
  66 |   const { api, calls } = await installIdentityFixture(page, baseURL!, route => route.fulfill({ json: { id: owner, handle: initialHandle } }));
  67 |   await page.goto("/profile");
  68 |   const handle = page.getByRole("textbox", { name: "Handle", exact: true });
  69 |   await expect(handle).toHaveValue(initialHandle);
  70 |   await handle.fill("same_account_draft");
  71 |   const beforeRefresh = calls.sessions;
  72 |   const refreshed = page.waitForResponse(response => response.url() === `${api.href}auth/session`);
  73 |   await page.evaluate(() => window.dispatchEvent(new StorageEvent("storage", { key: "sparowtype:auth-changed", newValue: "same-account-refresh" })));
  74 |   await refreshed;
> 75 |   await expect.poll(() => calls.sessions).toBeGreaterThan(beforeRefresh);
     |                                           ^ Error: expect(received).toBeGreaterThan(expected)
  76 |   // Cross the rendering/effect boundary after the auth response has published.
  77 |   await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  78 |   await expect(handle).toHaveValue("same_account_draft");
  79 |   await page.getByRole("button", { name: "Save handle", exact: true }).click();
  80 |   await expect(page.getByRole("status").filter({ hasText: "Your public handle is saved." })).toBeVisible();
  81 |   expect(calls.savedHandles).toEqual(["same_account_draft"]);
  82 |   expect(calls.profiles).toBe(1);
  83 | });
  84 | 
  85 | test("an initial profile fetch error remains visible and releases handle editing", async ({ page, baseURL }) => {
  86 |   const { calls } = await installIdentityFixture(page, baseURL!, route => route.fulfill({ status: 503, json: { error: { code: "identity-unavailable", message: "Public identity unavailable in this fixture." } } }));
  87 |   await page.goto("/profile");
  88 |   await expect(page.getByRole("status").filter({ hasText: "Public identity unavailable in this fixture." })).toBeVisible();
  89 |   const handle = page.getByRole("textbox", { name: "Handle", exact: true });
  90 |   await expect(handle).toBeEnabled();
  91 |   await expect(page.getByRole("status").filter({ hasText: "Loading public identity…" })).toHaveCount(0);
  92 |   await handle.fill("recovered_identity");
  93 |   await page.getByRole("button", { name: "Save handle", exact: true }).click();
  94 |   await expect(page.getByRole("status").filter({ hasText: "Your public handle is saved." })).toBeVisible();
  95 |   expect(calls.savedHandles).toEqual(["recovered_identity"]);
  96 | });
  97 | 
```