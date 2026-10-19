# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: startup-recovery.spec.ts >> startup recovers from real workspace script and stylesheet failures at 320px without losing guest history
- Location: e2e\startup-recovery.spec.ts:103:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForResponse: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e1]:
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
          - link "Settings" [ref=e20]:
            - /url: /settings
          - link "Sign in" [ref=e24]:
            - /url: /auth
      - navigation "Mobile navigation" [ref=e28]:
        - link "Test" [ref=e29]:
          - /url: /
        - link "Learn" [ref=e32]:
          - /url: /learn
        - link "Race" [ref=e36]:
          - /url: /race
        - link "Stats" [ref=e46]:
          - /url: /stats
        - link "Rankings" [ref=e49]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e56]:
          - /url: /keyboard-lab
    - main [ref=e59]:
      - region "Session results" [active] [ref=e60]:
        - generic [ref=e62]:
          - paragraph [ref=e63]: Session complete
          - paragraph [ref=e64]: custom · English · qwerty · forge-v3
        - generic [ref=e65]:
          - generic [ref=e66]:
            - paragraph [ref=e67]: Words per minute
            - generic [ref=e68]: "88"
            - paragraph [ref=e69]: credited word speed
          - generic [ref=e70]:
            - paragraph [ref=e71]: Input accuracy
            - generic [ref=e72]: 75.0%
            - paragraph [ref=e73]: 3 / 4 insertion attempts
        - region "Speed and error timeline" [ref=e74]:
          - generic [ref=e75]:
            - heading "Your rhythm" [level=2] [ref=e76]
            - generic [ref=e77]:
              - generic [ref=e78]: ● WPM
              - button "● Raw" [pressed] [ref=e79]
              - button "● Errors" [pressed] [ref=e80]
          - img [ref=e84]:
            - generic [ref=e87]: 0.4s
            - generic [ref=e92]:
              - generic [ref=e93]: "0"
              - generic [ref=e95]: "25"
              - generic [ref=e97]: "50"
              - generic [ref=e99]: "75"
              - generic [ref=e101]: "100"
          - group [ref=e114]:
            - generic "View accessible chart data" [ref=e115] [cursor=pointer]
        - generic [ref=e116]:
          - generic [ref=e117]:
            - paragraph [ref=e118]: Correct-character WPM
            - paragraph [ref=e119]: "88"
            - group [ref=e120]:
              - generic "How it’s measured" [ref=e121] [cursor=pointer]
          - generic [ref=e122]:
            - paragraph [ref=e123]: Raw WPM
            - paragraph [ref=e124]: "88"
            - group [ref=e125]:
              - generic "How it’s measured" [ref=e126] [cursor=pointer]
          - generic [ref=e127]:
            - paragraph [ref=e128]: Attempt rate
            - paragraph [ref=e129]: "117"
            - group [ref=e130]:
              - generic "How it’s measured" [ref=e131] [cursor=pointer]
          - generic [ref=e132]:
            - paragraph [ref=e133]: Consistency
            - paragraph [ref=e134]: —
            - group [ref=e135]:
              - generic "How it’s measured" [ref=e136] [cursor=pointer]
          - generic [ref=e137]:
            - paragraph [ref=e138]: 5s burst
            - paragraph [ref=e139]: —
            - group [ref=e140]:
              - generic "How it’s measured" [ref=e141] [cursor=pointer]
          - generic [ref=e142]:
            - paragraph [ref=e143]: Final accuracy
            - paragraph [ref=e144]: 100%
            - group [ref=e145]:
              - generic "How it’s measured" [ref=e146] [cursor=pointer]
          - generic [ref=e147]:
            - paragraph [ref=e148]: Duration
            - paragraph [ref=e149]: 0.4s
            - group [ref=e150]:
              - generic "How it’s measured" [ref=e151] [cursor=pointer]
        - region "Score explanation" [ref=e152]:
          - generic [ref=e153]:
            - generic [ref=e154]:
              - heading "Every number, explained" [level=2] [ref=e155]
              - paragraph [ref=e156]: Accuracy of your attempts and correctness of the final text answer different questions. Displayed values are rounded; exports retain precision.
            - link "Check your keyboard →" [ref=e157]:
              - /url: /keyboard-lab
          - generic [ref=e158]:
            - generic [ref=e159]:
              - term [ref=e160]: Input accuracy
              - definition [ref=e161]: 3 correct ÷ 4 insertion attempts × 100 = 75.0%
            - generic [ref=e162]:
              - term [ref=e163]: Final text accuracy
              - definition [ref=e164]: 3 correct ÷ 3 processed positions × 100 = 100.0%
            - generic [ref=e165]:
              - term [ref=e166]: Credited WPM
              - definition [ref=e167]: 3 credited characters ÷ 5 ÷ 0.00683333 minutes = 87.8 WPM
            - generic [ref=e168]:
              - term [ref=e169]: Raw WPM
              - definition [ref=e170]: 3 retained characters ÷ 5 ÷ 0.00683333 minutes = 87.8 WPM
            - generic [ref=e171]:
              - term [ref=e172]: Attempt rate
              - definition [ref=e173]: 4 inserted characters ÷ 5 ÷ 0.00683333 minutes = 117.1 WPM
          - paragraph [ref=e174]: 1 incorrect insertion attempts remain in input accuracy even after corrections. Final text has 0 incorrect, 0 extra and 0 missed positions. 0 untouched future positions are excluded. Deletions are separate actions.
          - paragraph [ref=e175]: WPM credits eligible words, not raw speed multiplied by accuracy. Character totals and insertion attempts can differ after edits or word skips. Consistency describes your rhythm under Forge’s formula; it is not an accuracy score or directly interchangeable with another site’s consistency.
          - button "Inspect session evidence" [ref=e176]
        - generic [ref=e177]:
          - generic [ref=e178]:
            - heading "Characters, accounted for" [level=2] [ref=e179]
            - generic [ref=e180]:
              - generic [ref=e181]:
                - text: "3"
                - generic [ref=e182]: correct
              - generic [ref=e183]:
                - text: "0"
                - generic [ref=e184]: incorrect
              - generic [ref=e185]:
                - text: "0"
                - generic [ref=e186]: extra
              - generic [ref=e187]:
                - text: "0"
                - generic [ref=e188]: missed
            - paragraph [ref=e189]: 0 untyped · 1 deletion actions · 1 deleted characters
          - generic [ref=e190]:
            - heading "Practice insight" [level=2] [ref=e191]
            - paragraph [ref=e192]: 1 incorrect insertion attempt remains in your input accuracy. 1 character was removed while editing.
            - link "Build accuracy with a focused lesson" [ref=e193]:
              - /url: /learn?keys=a&source=77dc5ad8-0736-41b8-b0ca-5fddc517d287&language=en&layout=qwerty&retest=%2F%3Fretest%3D77dc5ad8-0736-41b8-b0ca-5fddc517d287
        - group [ref=e196]:
          - generic "Final-text keyboard map Measured final characters only. Untyped keys have no color." [ref=e197] [cursor=pointer]:
            - text: Final-text keyboard map
            - generic [ref=e198]: Measured final characters only. Untyped keys have no color.
        - group [ref=e199]:
          - generic "Session details & comparison eligibility" [ref=e200] [cursor=pointer]
        - status [ref=e203]:
          - generic [ref=e206]: Private content saved on this device. Cloud storage requires your consent.
        - generic [ref=e207]:
          - generic [ref=e208]:
            - button "Next test" [ref=e209]
            - button "Repeat passage" [ref=e213]
          - generic [ref=e214]:
            - button "Share image" [ref=e215]
            - button "Export JSON" [ref=e219]
        - paragraph [ref=e220]: Tab → Enter starts the next test.
        - status
    - contentinfo [ref=e221]:
      - generic [ref=e222]:
        - generic [ref=e223]:
          - generic [ref=e224]:
            - generic [ref=e225]: Sparow
            - generic [ref=e226]: Type
          - text: Find your rhythm.
        - generic [ref=e227]:
          - link "About & metrics" [ref=e228]:
            - /url: /about
          - link "Preferences & data" [ref=e229]:
            - /url: /settings
          - link "Touch typing guide" [ref=e230]:
            - /url: /touch-typing
          - link "Privacy" [ref=e231]:
            - /url: /privacy
          - link "Terms" [ref=e232]:
            - /url: /terms
          - link "Offline" [ref=e233]:
            - /url: /offline
          - generic [ref=e234]: SparowType © 2026
  - generic [aria-hidden] [ref=e235]: "0"
```

# Test source

```ts
  37  |     name: "Reload SparowType",
  38  |     exact: true,
  39  |   });
  40  |   await expect(reload).toBeVisible();
  41  |   const measured = await main.evaluate((element) => {
  42  |     const rect = element.getBoundingClientRect();
  43  |     const style = getComputedStyle(element);
  44  |     const button = element.querySelector("button")!;
  45  |     const buttonRect = button.getBoundingClientRect();
  46  |     const buttonStyle = getComputedStyle(button);
  47  |     const paragraphStyle = getComputedStyle(
  48  |       element.querySelector("p:last-of-type")!,
  49  |     );
  50  |     return {
  51  |       viewport: innerWidth,
  52  |       scrollWidth: document.documentElement.scrollWidth,
  53  |       main: { left: rect.left, right: rect.right, width: rect.width },
  54  |       button: {
  55  |         left: buttonRect.left,
  56  |         right: buttonRect.right,
  57  |         width: buttonRect.width,
  58  |         height: buttonRect.height,
  59  |       },
  60  |       fontSize: parseFloat(style.fontSize),
  61  |       lineHeight: parseFloat(style.lineHeight),
  62  |       foreground: style.color,
  63  |       background: style.backgroundColor,
  64  |       paragraph: paragraphStyle.color,
  65  |       buttonForeground: buttonStyle.color,
  66  |       buttonBackground: buttonStyle.backgroundColor,
  67  |     };
  68  |   });
  69  |   expect(measured.scrollWidth).toBeLessThanOrEqual(measured.viewport + 1);
  70  |   expect(measured.main.left).toBeGreaterThanOrEqual(0);
  71  |   expect(measured.main.right).toBeLessThanOrEqual(measured.viewport + 1);
  72  |   expect(measured.button.left).toBeGreaterThanOrEqual(0);
  73  |   expect(measured.button.right).toBeLessThanOrEqual(measured.viewport + 1);
  74  |   expect(measured.button.height).toBeGreaterThanOrEqual(44);
  75  |   expect(measured.button.width).toBeGreaterThanOrEqual(44);
  76  |   expect(measured.fontSize).toBeGreaterThanOrEqual(16);
  77  |   expect(measured.lineHeight).toBeGreaterThanOrEqual(24);
  78  |   expect(measured.background).not.toBe("rgba(0, 0, 0, 0)");
  79  |   expect(
  80  |     contrast(measured.foreground, measured.background),
  81  |   ).toBeGreaterThanOrEqual(4.5);
  82  |   expect(
  83  |     contrast(measured.paragraph, measured.background),
  84  |   ).toBeGreaterThanOrEqual(4.5);
  85  |   expect(
  86  |     contrast(measured.buttonForeground, measured.buttonBackground),
  87  |   ).toBeGreaterThanOrEqual(4.5);
  88  |   await page.keyboard.press("Tab");
  89  |   await expect(reload).toBeFocused();
  90  |   await expect(reload).toHaveCSS("outline-style", "solid");
  91  |   await expect(reload).toHaveCSS("outline-width", "2px");
  92  |   await info.attach(`${phase}-recovery-geometry`, {
  93  |     body: JSON.stringify(measured),
  94  |     contentType: "application/json",
  95  |   });
  96  |   await info.attach(`${phase}-recovery-320px`, {
  97  |     body: await page.screenshot(),
  98  |     contentType: "image/png",
  99  |   });
  100 |   return reload;
  101 | }
  102 | 
  103 | test("startup recovers from real workspace script and stylesheet failures at 320px without losing guest history", async ({
  104 |   page,
  105 |   context,
  106 | }, info) => {
  107 |   await context.addInitScript(() =>
  108 |     localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  109 |   );
  110 |   await completeCorrectedCat(page);
  111 |   await expect(
  112 |     page
  113 |       .getByRole("status")
  114 |       .filter({ hasText: /saved.*device|saved.*locally|local.*saved/i }),
  115 |   ).toBeVisible();
  116 | 
  117 |   // A missing stylesheet can reject Vite's preload before App.js is requested.
  118 |   // Exercise each asset separately on a fresh document, without fabricated fetches.
  119 |   for (const extension of ["css", "js"] as const) {
  120 |     const fresh = await context.newPage();
  121 |     const asset = new RegExp(`/assets/App-[^/]+\\.${extension}(?:\\?.*)?$`);
  122 |     const blocked: string[] = [];
  123 |     await fresh.route(asset, async (route) => {
  124 |       blocked.push(route.request().url());
  125 |       await route.abort("failed");
  126 |     });
  127 |     try {
  128 |       await fresh.goto("/", { waitUntil: "domcontentloaded" });
  129 |       const reload = await inspectRecovery(fresh, info, extension);
  130 |       expect(blocked.length).toBeGreaterThan(0);
  131 |       expect(blocked.every((url) => asset.test(url))).toBe(true);
  132 |       await info.attach(`${extension}-actual-blocked-workspace-assets`, {
  133 |         body: JSON.stringify(blocked),
  134 |         contentType: "application/json",
  135 |       });
  136 |       await fresh.unroute(asset);
> 137 |       const loaded = fresh.waitForResponse(
      |                            ^ Error: page.waitForResponse: Test timeout of 30000ms exceeded.
  138 |         (response) => asset.test(response.url()) && response.status() === 200,
  139 |       );
  140 |       await reload.click();
  141 |       await loaded;
  142 |       const input = await focusTyping(fresh);
  143 |       await expect(input).toHaveValue("");
  144 |       await expect(
  145 |         fresh.getByRole("region", { name: "Typing session", exact: true }),
  146 |       ).toHaveAttribute("data-status", "ready");
  147 |       await fresh.goto("/stats", { waitUntil: "domcontentloaded" });
  148 |       const rows = fresh
  149 |         .getByRole("table", {
  150 |           name: "Completed sessions, most recent first",
  151 |           exact: true,
  152 |         })
  153 |         .getByRole("row");
  154 |       await expect(rows).toHaveCount(2);
  155 |       await expect(rows.nth(1)).toContainText("75.0%");
  156 |     } finally {
  157 |       await fresh.close();
  158 |     }
  159 |   }
  160 | });
  161 | 
```