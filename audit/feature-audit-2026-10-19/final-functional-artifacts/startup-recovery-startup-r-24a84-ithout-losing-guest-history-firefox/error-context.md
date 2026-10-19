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
      - link "Skip to content" [ref=e6] [cursor=pointer]:
        - /url: "#main-content"
      - generic [ref=e7]:
        - link "SparowType home" [ref=e8] [cursor=pointer]:
          - /url: /
          - generic [ref=e9]:
            - generic [ref=e10]: Sparow
            - generic [ref=e11]: Type
        - generic [ref=e12]:
          - button "Switch to light theme" [ref=e13]
          - link "Settings" [ref=e24] [cursor=pointer]:
            - /url: /settings
          - link "Sign in" [ref=e30] [cursor=pointer]:
            - /url: /auth
      - navigation "Mobile navigation" [ref=e34]:
        - link "Test" [ref=e35] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=e46] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=e51] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=e61] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=e67] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e75] [cursor=pointer]:
          - /url: /keyboard-lab
    - main [ref=e86]:
      - region "Session results" [active] [ref=e87]:
        - generic [ref=e89]:
          - paragraph [ref=e90]: Session complete
          - paragraph [ref=e91]: custom · English · qwerty · forge-v3
        - generic [ref=e92]:
          - generic [ref=e93]:
            - paragraph [ref=e94]: Words per minute
            - generic [ref=e95]: "109"
            - paragraph [ref=e96]: credited word speed
          - generic [ref=e97]:
            - paragraph [ref=e98]: Input accuracy
            - generic [ref=e99]: 75.0%
            - paragraph [ref=e100]: 3 / 4 insertion attempts
        - region "Speed and error timeline" [ref=e101]:
          - generic [ref=e102]:
            - heading "Your rhythm" [level=2] [ref=e103]
            - generic [ref=e104]:
              - generic [ref=e105]: ● WPM
              - button "● Raw" [pressed] [ref=e106]
              - button "● Errors" [pressed] [ref=e107]
          - generic [ref=e110]:
            - img [ref=e111]:
              - generic [ref=e119]: 0.3s
              - generic [ref=e124]:
                - generic [ref=e125]: "0"
                - generic [ref=e127]: "30"
                - generic [ref=e129]: "60"
                - generic [ref=e131]: "90"
                - generic [ref=e133]: "120"
            - generic:
              - generic:
                - paragraph: 0.3 seconds
                - list:
                  - listitem: "Errors : 1.0"
                  - listitem: "WPM : 109.1"
                  - listitem: "Raw WPM : 109.1"
          - group [ref=e150]:
            - generic "View accessible chart data" [ref=e151] [cursor=pointer]
        - generic [ref=e152]:
          - generic [ref=e153]:
            - paragraph [ref=e154]: Correct-character WPM
            - paragraph [ref=e155]: "109"
            - group [ref=e156]:
              - generic "How it’s measured" [ref=e157] [cursor=pointer]
          - generic [ref=e158]:
            - paragraph [ref=e159]: Raw WPM
            - paragraph [ref=e160]: "109"
            - group [ref=e161]:
              - generic "How it’s measured" [ref=e162] [cursor=pointer]
          - generic [ref=e163]:
            - paragraph [ref=e164]: Attempt rate
            - paragraph [ref=e165]: "145"
            - group [ref=e166]:
              - generic "How it’s measured" [ref=e167] [cursor=pointer]
          - generic [ref=e168]:
            - paragraph [ref=e169]: Consistency
            - paragraph [ref=e170]: —
            - group [ref=e171]:
              - generic "How it’s measured" [ref=e172] [cursor=pointer]
          - generic [ref=e173]:
            - paragraph [ref=e174]: 5s burst
            - paragraph [ref=e175]: —
            - group [ref=e176]:
              - generic "How it’s measured" [ref=e177] [cursor=pointer]
          - generic [ref=e178]:
            - paragraph [ref=e179]: Final accuracy
            - paragraph [ref=e180]: 100%
            - group [ref=e181]:
              - generic "How it’s measured" [ref=e182] [cursor=pointer]
          - generic [ref=e183]:
            - paragraph [ref=e184]: Duration
            - paragraph [ref=e185]: 0.3s
            - group [ref=e186]:
              - generic "How it’s measured" [ref=e187] [cursor=pointer]
        - region "Score explanation" [ref=e188]:
          - generic [ref=e189]:
            - generic [ref=e190]:
              - heading "Every number, explained" [level=2] [ref=e191]
              - paragraph [ref=e192]: Accuracy of your attempts and correctness of the final text answer different questions. Displayed values are rounded; exports retain precision.
            - link "Check your keyboard →" [ref=e193] [cursor=pointer]:
              - /url: /keyboard-lab
          - generic [ref=e194]:
            - generic [ref=e195]:
              - term [ref=e196]: Input accuracy
              - definition [ref=e197]: 3 correct ÷ 4 insertion attempts × 100 = 75.0%
            - generic [ref=e198]:
              - term [ref=e199]: Final text accuracy
              - definition [ref=e200]: 3 correct ÷ 3 processed positions × 100 = 100.0%
            - generic [ref=e201]:
              - term [ref=e202]: Credited WPM
              - definition [ref=e203]: 3 credited characters ÷ 5 ÷ 0.0055 minutes = 109.1 WPM
            - generic [ref=e204]:
              - term [ref=e205]: Raw WPM
              - definition [ref=e206]: 3 retained characters ÷ 5 ÷ 0.0055 minutes = 109.1 WPM
            - generic [ref=e207]:
              - term [ref=e208]: Attempt rate
              - definition [ref=e209]: 4 inserted characters ÷ 5 ÷ 0.0055 minutes = 145.5 WPM
          - paragraph [ref=e210]: 1 incorrect insertion attempts remain in input accuracy even after corrections. Final text has 0 incorrect, 0 extra and 0 missed positions. 0 untouched future positions are excluded. Deletions are separate actions.
          - paragraph [ref=e211]: WPM credits eligible words, not raw speed multiplied by accuracy. Character totals and insertion attempts can differ after edits or word skips. Consistency describes your rhythm under Forge’s formula; it is not an accuracy score or directly interchangeable with another site’s consistency.
          - button "Inspect session evidence" [ref=e212]
        - generic [ref=e213]:
          - generic [ref=e214]:
            - heading "Characters, accounted for" [level=2] [ref=e215]
            - generic [ref=e216]:
              - generic [ref=e217]:
                - text: "3"
                - generic [ref=e218]: correct
              - generic [ref=e219]:
                - text: "0"
                - generic [ref=e220]: incorrect
              - generic [ref=e221]:
                - text: "0"
                - generic [ref=e222]: extra
              - generic [ref=e223]:
                - text: "0"
                - generic [ref=e224]: missed
            - paragraph [ref=e225]: 0 untyped · 1 deletion actions · 1 deleted characters
          - generic [ref=e226]:
            - heading "Practice insight" [level=2] [ref=e227]
            - paragraph [ref=e228]: 1 incorrect insertion attempt remains in your input accuracy. 1 character was removed while editing.
            - link "Build accuracy with a focused lesson" [ref=e229] [cursor=pointer]:
              - /url: /learn?keys=a&source=e54fbc35-9d05-40e1-93a1-048702ada1b7&language=en&layout=qwerty&retest=%2F%3Fretest%3De54fbc35-9d05-40e1-93a1-048702ada1b7
        - group [ref=e233]:
          - generic "Final-text keyboard map Measured final characters only. Untyped keys have no color." [ref=e234] [cursor=pointer]:
            - text: Final-text keyboard map
            - generic [ref=e235]: Measured final characters only. Untyped keys have no color.
        - group [ref=e236]:
          - generic "Session details & comparison eligibility" [ref=e237] [cursor=pointer]
        - status [ref=e240]:
          - generic [ref=e243]: Private content saved on this device. Cloud storage requires your consent.
        - generic [ref=e244]:
          - generic [ref=e245]:
            - button "Next test" [ref=e246]
            - button "Repeat passage" [ref=e250]
          - generic [ref=e251]:
            - button "Share image" [ref=e252]
            - button "Export JSON" [ref=e257]
        - paragraph [ref=e258]: Tab → Enter starts the next test.
        - status
    - contentinfo [ref=e259]:
      - generic [ref=e260]:
        - generic [ref=e261]:
          - generic [ref=e262]:
            - generic [ref=e263]: Sparow
            - generic [ref=e264]: Type
          - text: Find your rhythm.
        - generic [ref=e265]:
          - link "About & metrics" [ref=e266] [cursor=pointer]:
            - /url: /about
          - link "Preferences & data" [ref=e267] [cursor=pointer]:
            - /url: /settings
          - link "Touch typing guide" [ref=e268] [cursor=pointer]:
            - /url: /touch-typing
          - link "Privacy" [ref=e269] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=e270] [cursor=pointer]:
            - /url: /terms
          - link "Offline" [ref=e271] [cursor=pointer]:
            - /url: /offline
          - generic [ref=e272]: SparowType © 2026
  - generic [aria-hidden] [ref=e273]: "0"
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