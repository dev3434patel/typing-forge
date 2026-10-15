# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quick-restart.spec.ts >> Tab then Enter creates fresh random bot races and resets typing, timer and opponent
- Location: e2e\quick-restart.spec.ts:15:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByTestId('opponent-caret')
Expected: "0"
Received: "29"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByTestId('opponent-caret') with timeout 5000ms
  - waiting for getByTestId('opponent-caret')
    3 × locator resolved to <span data-position="2" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "2"
    2 × locator resolved to <span data-position="3" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "3"
    2 × locator resolved to <span data-position="7" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "7"
    - locator resolved to <span data-position="8" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "8"
    - locator resolved to <span aria-hidden="true" data-position="11" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "11"
    - locator resolved to <span aria-hidden="true" data-position="15" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "15"
    - locator resolved to <span aria-hidden="true" data-position="19" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "19"
    - locator resolved to <span aria-hidden="true" data-position="24" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "24"
    - locator resolved to <span aria-hidden="true" data-position="29" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "29"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "Skip to content" [ref=e5]:
      - /url: "#main-content"
    - generic [ref=e6]:
      - link "Typing Forge home" [ref=e7]:
        - /url: /
        - generic [ref=e11]: typingforge.
      - navigation "Main navigation" [ref=e12]:
        - link "Test" [ref=e13]:
          - /url: /
        - link "Learn" [ref=e16]:
          - /url: /learn
        - link "Race" [ref=e20]:
          - /url: /race
        - link "Stats" [ref=e30]:
          - /url: /stats
        - link "Rankings" [ref=e33]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e40]:
          - /url: /keyboard-lab
      - generic [ref=e43]:
        - button "Open command palette" [ref=e44]
        - link "Settings" [ref=e47]:
          - /url: /settings
        - link "Sign in" [ref=e51]:
          - /url: /auth
  - main [ref=e56]:
    - generic [ref=e57]:
      - generic [ref=e58]:
        - paragraph [ref=e59]: A little friendly competition
        - heading "Find your racing rhythm." [level=1] [ref=e60]
        - paragraph [ref=e61]: Share a track with a friend, or warm up against a local bot.
      - button "Leave race" [ref=e62]
    - generic [ref=e66]:
      - generic [ref=e67]:
        - generic [ref=e68]:
          - generic [ref=e69]:
            - generic [ref=e70]: You
            - generic [ref=e76]: 0wpm
          - paragraph [ref=e78]: 0% correct target characters
        - generic [ref=e79]:
          - generic [ref=e80]:
            - generic [ref=e81]:
              - text: Pro opponent
              - generic [ref=e85]: local bot
            - generic [ref=e86]: 71wpm
          - paragraph [ref=e89]: 7% correct target characters
      - region "Typing session" [ref=e90]:
        - generic [ref=e91]:
          - generic [ref=e92]:
            - generic [ref=e93]:
              - generic [ref=e94]: 25s
              - generic [ref=e95]: remaining
            - generic [ref=e96]: 0wpm
            - generic [ref=e97]: —acc %
          - generic [ref=e98]: Find your rhythm
        - generic [ref=e99]:
          - generic [ref=e100]: You
          - generic [ref=e102]: Bot pace
          - generic [ref=e104]: 71 wpm
          - generic [ref=e105]: 35 characters ahead
        - generic [ref=e107]:
          - generic [ref=e109]:
            - generic [ref=e110]:
              - generic [ref=e111]: z
              - generic [ref=e112]: i
              - generic [ref=e113]: "n"
              - generic [ref=e114]: c
            - generic [ref=e116]:
              - generic [ref=e117]: e
              - generic [ref=e118]: a
              - generic [ref=e119]: c
              - generic [ref=e120]: h
            - generic [ref=e122]:
              - generic [ref=e123]: "n"
              - generic [ref=e124]: o
              - generic [ref=e125]: t
            - generic [ref=e127]:
              - generic [ref=e128]: u
              - generic [ref=e129]: s
            - generic [ref=e131]:
              - generic [ref=e132]: f
              - generic [ref=e133]: o
              - generic [ref=e134]: o
              - generic [ref=e135]: t
            - generic [ref=e137]:
              - generic [ref=e138]: "n"
              - generic [ref=e139]: e
              - generic [ref=e140]: a
              - generic [ref=e141]: t
            - generic [ref=e143]:
              - generic [ref=e144]: s
              - generic [ref=e145]: o
              - generic [ref=e146]: o
              - generic [ref=e147]: t
            - generic [ref=e149]:
              - generic [ref=e150]: t
              - generic [ref=e151]: h
              - generic [ref=e152]: a
              - generic [ref=e153]: t
            - generic [ref=e155]:
              - generic [ref=e156]: f
              - generic [ref=e157]: o
              - generic [ref=e158]: o
              - generic [ref=e159]: t
            - generic [ref=e161]:
              - generic [ref=e162]: r
              - generic [ref=e163]: o
              - generic [ref=e164]: a
              - generic [ref=e165]: d
            - generic [ref=e167]:
              - generic [ref=e168]: t
              - generic [ref=e169]: a
              - generic [ref=e170]: s
              - generic [ref=e171]: t
              - generic [ref=e172]: e
            - generic [ref=e174]:
              - generic [ref=e175]: f
              - generic [ref=e176]: o
              - generic [ref=e177]: o
              - generic [ref=e178]: t
            - generic [ref=e180]:
              - generic [ref=e181]: p
              - generic [ref=e182]: a
              - generic [ref=e183]: t
              - generic [ref=e184]: h
            - generic [ref=e186]:
              - generic [ref=e187]: r
              - generic [ref=e188]: o
              - generic [ref=e189]: o
              - generic [ref=e190]: m
            - generic [ref=e192]:
              - generic [ref=e193]: r
              - generic [ref=e194]: u
              - generic [ref=e195]: "n"
            - generic [ref=e197]:
              - generic [ref=e198]: c
              - generic [ref=e199]: l
              - generic [ref=e200]: o
              - generic [ref=e201]: s
              - generic [ref=e202]: e
            - generic [ref=e204]:
              - generic [ref=e205]: w
              - generic [ref=e206]: a
              - generic [ref=e207]: r
              - generic [ref=e208]: m
            - generic [ref=e210]:
              - generic [ref=e211]: h
              - generic [ref=e212]: o
              - generic [ref=e213]: w
            - generic [ref=e215]:
              - generic [ref=e216]: l
              - generic [ref=e217]: i
              - generic [ref=e218]: "n"
              - generic [ref=e219]: e
            - generic [ref=e221]:
              - generic [ref=e222]: m
              - generic [ref=e223]: o
              - generic [ref=e224]: s
              - generic [ref=e225]: t
            - generic [ref=e227]:
              - generic [ref=e228]: e
              - generic [ref=e229]: r
              - generic [ref=e230]: a
            - generic [ref=e232]:
              - generic [ref=e233]: w
              - generic [ref=e234]: i
              - generic [ref=e235]: d
              - generic [ref=e236]: e
            - generic [ref=e238]:
              - generic [ref=e239]: m
              - generic [ref=e240]: "y"
            - generic [ref=e242]:
              - generic [ref=e243]: t
              - generic [ref=e244]: i
              - generic [ref=e245]: m
              - generic [ref=e246]: e
            - generic [ref=e248]:
              - generic [ref=e249]: "n"
              - generic [ref=e250]: a
              - generic [ref=e251]: t
              - generic [ref=e252]: i
              - generic [ref=e253]: o
              - generic [ref=e254]: "n"
            - generic [ref=e256]:
              - generic [ref=e257]: d
              - generic [ref=e258]: e
              - generic [ref=e259]: a
              - generic [ref=e260]: r
            - generic [ref=e262]:
              - generic [ref=e263]: h
              - generic [ref=e264]: a
              - generic [ref=e265]: "n"
              - generic [ref=e266]: d
            - generic [ref=e268]:
              - generic [ref=e269]: e
              - generic [ref=e270]: "n"
              - generic [ref=e271]: d
            - generic [ref=e273]:
              - generic [ref=e274]: p
              - generic [ref=e275]: e
              - generic [ref=e276]: o
              - generic [ref=e277]: p
              - generic [ref=e278]: l
              - generic [ref=e279]: e
            - generic [ref=e281]:
              - generic [ref=e282]: "n"
              - generic [ref=e283]: o
              - generic [ref=e284]: t
              - generic [ref=e285]: e
            - generic [ref=e287]:
              - generic [ref=e288]: h
              - generic [ref=e289]: e
              - generic [ref=e290]: l
              - generic [ref=e291]: p
            - generic [ref=e293]:
              - generic [ref=e294]: s
              - generic [ref=e295]: a
              - generic [ref=e296]: i
              - generic [ref=e297]: d
            - generic [ref=e299]:
              - generic [ref=e300]: s
              - generic [ref=e301]: t
              - generic [ref=e302]: a
              - generic [ref=e303]: r
              - generic [ref=e304]: t
            - generic [ref=e306]:
              - generic [ref=e307]: g
              - generic [ref=e308]: o
            - generic [ref=e310]:
              - generic [ref=e311]: t
              - generic [ref=e312]: i
              - generic [ref=e313]: "n"
            - generic [ref=e315]:
              - generic [ref=e316]: r
              - generic [ref=e317]: e
              - generic [ref=e318]: "n"
              - generic [ref=e319]: t
            - generic [ref=e321]:
              - generic [ref=e322]: w
              - generic [ref=e323]: i
              - generic [ref=e324]: "n"
              - generic [ref=e325]: d
              - generic [ref=e326]: o
              - generic [ref=e327]: w
            - generic [ref=e329]:
              - generic [ref=e330]: s
              - generic [ref=e331]: o
              - generic [ref=e332]: u
              - generic [ref=e333]: "n"
              - generic [ref=e334]: d
            - generic [ref=e336]:
              - generic [ref=e337]: s
              - generic [ref=e338]: e
              - generic [ref=e339]: a
              - generic [ref=e340]: t
            - generic [ref=e342]:
              - generic [ref=e343]: l
              - generic [ref=e344]: o
              - generic [ref=e345]: o
              - generic [ref=e346]: k
            - generic [ref=e348]:
              - generic [ref=e349]: p
              - generic [ref=e350]: o
              - generic [ref=e351]: e
              - generic [ref=e352]: m
            - generic [ref=e354]:
              - generic [ref=e355]: "n"
              - generic [ref=e356]: a
              - generic [ref=e357]: m
              - generic [ref=e358]: e
            - generic [ref=e360]:
              - generic [ref=e361]: s
              - generic [ref=e362]: o
            - generic [ref=e364]:
              - generic [ref=e365]: s
              - generic [ref=e366]: a
              - generic [ref=e367]: i
              - generic [ref=e368]: d
            - generic [ref=e370]:
              - generic [ref=e371]: d
              - generic [ref=e372]: e
              - generic [ref=e373]: a
              - generic [ref=e374]: r
            - generic [ref=e376]:
              - generic [ref=e377]: d
              - generic [ref=e378]: o
              - generic [ref=e379]: w
              - generic [ref=e380]: "n"
            - generic [ref=e382]:
              - generic [ref=e383]: r
              - generic [ref=e384]: o
              - generic [ref=e385]: o
              - generic [ref=e386]: m
            - generic [ref=e388]:
              - generic [ref=e389]: m
              - generic [ref=e390]: a
              - generic [ref=e391]: i
              - generic [ref=e392]: "n"
            - generic [ref=e394]:
              - generic [ref=e395]: c
              - generic [ref=e396]: o
              - generic [ref=e397]: p
              - generic [ref=e398]: "y"
            - generic [ref=e400]:
              - generic [ref=e401]: "y"
              - generic [ref=e402]: e
              - generic [ref=e403]: s
            - generic [ref=e405]:
              - generic [ref=e406]: p
              - generic [ref=e407]: o
              - generic [ref=e408]: w
              - generic [ref=e409]: e
              - generic [ref=e410]: r
            - generic [ref=e412]:
              - generic [ref=e413]: t
              - generic [ref=e414]: a
              - generic [ref=e415]: s
              - generic [ref=e416]: t
              - generic [ref=e417]: e
            - generic [ref=e419]:
              - generic [ref=e420]: m
              - generic [ref=e421]: u
              - generic [ref=e422]: s
              - generic [ref=e423]: t
            - generic [ref=e425]:
              - generic [ref=e426]: "n"
              - generic [ref=e427]: a
              - generic [ref=e428]: m
              - generic [ref=e429]: e
            - generic [ref=e431]:
              - generic [ref=e432]: s
              - generic [ref=e433]: o
              - generic [ref=e434]: f
              - generic [ref=e435]: t
            - generic [ref=e437]:
              - generic [ref=e438]: s
              - generic [ref=e439]: t
              - generic [ref=e440]: a
              - generic [ref=e441]: i
              - generic [ref=e442]: r
            - generic [ref=e444]:
              - generic [ref=e445]: q
              - generic [ref=e446]: u
              - generic [ref=e447]: i
              - generic [ref=e448]: e
              - generic [ref=e449]: t
            - generic [ref=e451]:
              - generic [ref=e452]: l
              - generic [ref=e453]: e
              - generic [ref=e454]: a
              - generic [ref=e455]: r
              - generic [ref=e456]: "n"
            - generic [ref=e458]:
              - generic [ref=e459]: l
              - generic [ref=e460]: i
              - generic [ref=e461]: t
              - generic [ref=e462]: t
              - generic [ref=e463]: l
              - generic [ref=e464]: e
            - generic [ref=e466]:
              - generic [ref=e467]: g
              - generic [ref=e468]: r
              - generic [ref=e469]: e
              - generic [ref=e470]: e
              - generic [ref=e471]: "n"
            - generic [ref=e473]:
              - generic [ref=e474]: o
              - generic [ref=e475]: l
              - generic [ref=e476]: d
            - generic [ref=e478]:
              - generic [ref=e479]: t
              - generic [ref=e480]: w
              - generic [ref=e481]: o
            - generic [ref=e483]:
              - generic [ref=e484]: o
              - generic [ref=e485]: r
            - generic [ref=e487]:
              - generic [ref=e488]: h
              - generic [ref=e489]: e
            - generic [ref=e491]:
              - generic [ref=e492]: f
              - generic [ref=e493]: o
              - generic [ref=e494]: o
              - generic [ref=e495]: t
            - generic [ref=e497]:
              - generic [ref=e498]: t
              - generic [ref=e499]: h
              - generic [ref=e500]: i
              - generic [ref=e501]: "n"
              - generic [ref=e502]: g
            - generic [ref=e504]:
              - generic [ref=e505]: f
              - generic [ref=e506]: o
              - generic [ref=e507]: r
              - generic [ref=e508]: g
              - generic [ref=e509]: e
            - generic [ref=e511]:
              - generic [ref=e512]: w
              - generic [ref=e513]: o
              - generic [ref=e514]: r
              - generic [ref=e515]: k
            - generic [ref=e517]:
              - generic [ref=e518]: a
              - generic [ref=e519]: t
            - generic [ref=e521]:
              - generic [ref=e522]: s
              - generic [ref=e523]: u
              - generic [ref=e524]: "n"
            - generic [ref=e526]:
              - generic [ref=e527]: j
              - generic [ref=e528]: u
              - generic [ref=e529]: s
              - generic [ref=e530]: t
            - generic [ref=e532]:
              - generic [ref=e533]: i
              - generic [ref=e534]: d
              - generic [ref=e535]: e
              - generic [ref=e536]: a
            - generic [ref=e538]:
              - generic [ref=e539]: l
              - generic [ref=e540]: o
              - generic [ref=e541]: w
            - generic [ref=e543]:
              - generic [ref=e544]: s
              - generic [ref=e545]: h
              - generic [ref=e546]: a
              - generic [ref=e547]: r
              - generic [ref=e548]: e
            - generic [ref=e550]:
              - generic [ref=e551]: s
              - generic [ref=e552]: a
              - generic [ref=e553]: m
              - generic [ref=e554]: e
            - generic [ref=e556]:
              - generic [ref=e557]: o
              - generic [ref=e558]: "n"
            - generic [ref=e560]:
              - generic [ref=e561]: e
              - generic [ref=e562]: a
              - generic [ref=e563]: r
              - generic [ref=e564]: l
              - generic [ref=e565]: "y"
            - generic [ref=e567]:
              - generic [ref=e568]: a
              - generic [ref=e569]: s
            - generic [ref=e571]:
              - generic [ref=e572]: l
              - generic [ref=e573]: e
              - generic [ref=e574]: t
            - generic [ref=e576]:
              - generic [ref=e577]: j
              - generic [ref=e578]: o
              - generic [ref=e579]: i
              - generic [ref=e580]: "n"
            - generic [ref=e582]:
              - generic [ref=e583]: "n"
              - generic [ref=e584]: a
              - generic [ref=e585]: t
              - generic [ref=e586]: i
              - generic [ref=e587]: o
              - generic [ref=e588]: "n"
            - generic [ref=e590]:
              - generic [ref=e591]: s
              - generic [ref=e592]: e
              - generic [ref=e593]: e
              - generic [ref=e594]: "n"
            - generic [ref=e596]:
              - generic [ref=e597]: g
              - generic [ref=e598]: r
              - generic [ref=e599]: o
              - generic [ref=e600]: u
              - generic [ref=e601]: p
            - generic [ref=e603]:
              - generic [ref=e604]: f
              - generic [ref=e605]: a
              - generic [ref=e606]: i
              - generic [ref=e607]: r
            - generic [ref=e609]:
              - generic [ref=e610]: a
              - generic [ref=e611]: "n"
            - generic [ref=e613]:
              - generic [ref=e614]: w
              - generic [ref=e615]: a
              - generic [ref=e616]: i
              - generic [ref=e617]: t
            - generic [ref=e619]:
              - generic [ref=e620]: a
              - generic [ref=e621]: "n"
            - generic [ref=e623]:
              - generic [ref=e624]: o
              - generic [ref=e625]: r
            - generic [ref=e627]:
              - generic [ref=e628]: o
              - generic [ref=e629]: "n"
              - generic [ref=e630]: e
            - generic [ref=e632]:
              - generic [ref=e633]: s
              - generic [ref=e634]: a
              - generic [ref=e635]: v
              - generic [ref=e636]: e
            - generic [ref=e638]: i
            - generic [ref=e641]:
              - generic [ref=e642]: i
              - generic [ref=e643]: f
            - generic [ref=e645]:
              - generic [ref=e646]: l
              - generic [ref=e647]: e
              - generic [ref=e648]: t
              - generic [ref=e649]: t
              - generic [ref=e650]: e
              - generic [ref=e651]: r
            - generic [ref=e653]:
              - generic [ref=e654]: w
              - generic [ref=e655]: a
              - generic [ref=e656]: r
              - generic [ref=e657]: m
            - generic [ref=e659]:
              - generic [ref=e660]: "n"
              - generic [ref=e661]: e
              - generic [ref=e662]: o
              - generic [ref=e663]: "n"
            - generic [ref=e665]:
              - generic [ref=e666]: s
              - generic [ref=e667]: h
              - generic [ref=e668]: o
              - generic [ref=e669]: w
            - generic [ref=e671]:
              - generic [ref=e672]: p
              - generic [ref=e673]: e
              - generic [ref=e674]: o
              - generic [ref=e675]: p
              - generic [ref=e676]: l
              - generic [ref=e677]: e
            - generic [ref=e679]:
              - generic [ref=e680]: s
              - generic [ref=e681]: t
              - generic [ref=e682]: o
              - generic [ref=e683]: "n"
              - generic [ref=e684]: e
            - generic [ref=e686]:
              - generic [ref=e687]: "y"
              - generic [ref=e688]: e
              - generic [ref=e689]: l
              - generic [ref=e690]: l
              - generic [ref=e691]: o
              - generic [ref=e692]: w
            - generic [ref=e694]:
              - generic [ref=e695]: s
              - generic [ref=e696]: u
              - generic [ref=e697]: r
              - generic [ref=e698]: e
          - paragraph [ref=e699]: "Practice passage: zinc each not us foot neat soot that foot road taste foot path room run close warm how line most era wide my time nation dear hand end people note help said start go tin rent window sound seat look poem name so said dear down room main copy yes power taste must name soft stair quiet learn little green old two or he foot thing forge work at sun just idea low share same on early as let join nation seen group fair an wait an or one save i if letter warm neon show people stone yellow sure"
          - textbox "Typing input" [active] [ref=e700]
        - generic [ref=e702]:
          - paragraph [ref=e703]: Type the text above. Wrong letters stay visible; Backspace corrects.
          - status [ref=e704]
        - generic [ref=e705]:
          - paragraph [ref=e706]: Shared clock · Ctrl+Enter finishes · Tab → Enter restarts
          - generic [ref=e707]:
            - button "Restart with new text" [ref=e708]
            - button "Show accessible text editor" [ref=e712]
            - button "Finish" [ref=e716]
        - status [ref=e719]: Test running
  - contentinfo [ref=e720]:
    - generic [ref=e721]:
      - generic [ref=e722]: A little practice. Lasting progress.
      - generic [ref=e725]:
        - link "About & metrics" [ref=e726]:
          - /url: /about
        - link "Preferences & data" [ref=e727]:
          - /url: /settings
        - generic [ref=e728]: Typing Forge © 2026
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { exportedResult, focusTyping } from "./helpers";
  3   | 
  4   | async function botPractice(page: Page) {
  5   |   await page.goto("/race");
  6   |   await page
  7   |     .getByRole("combobox", { name: "Difficulty", exact: true })
  8   |     .selectOption("pro");
  9   |   await page
  10  |     .getByRole("button", { name: "Start bot practice", exact: true })
  11  |     .click();
  12  |   return focusTyping(page);
  13  | }
  14  | 
  15  | test("Tab then Enter creates fresh random bot races and resets typing, timer and opponent", async ({
  16  |   page,
  17  | }, info) => {
  18  |   await page.clock.install();
  19  |   const input = await botPractice(page);
  20  |   const target = page.getByTestId("typing-target");
  21  |   const session = page.getByRole("region", {
  22  |     name: "Typing session",
  23  |     exact: true,
  24  |   });
  25  |   const marker = page.getByTestId("opponent-caret");
  26  |   const seen = new Set<string>();
  27  |   for (let attempt = 0; attempt < 2; attempt++) {
  28  |     const before = (await target.textContent())!;
  29  |     const id = await session.getAttribute("data-session-id");
  30  |     seen.add(before);
  31  |     await input.pressSequentially("xx");
  32  |     await page.clock.fastForward(5000);
  33  |     await expect
  34  |       .poll(async () => Number(await marker.getAttribute("data-position")))
  35  |       .toBeGreaterThan(0);
  36  |     const edited = await target.textContent();
  37  |     await input.press("Tab");
  38  |     const restart = page.getByRole("button", {
  39  |       name: "Restart with new text",
  40  |       exact: true,
  41  |     });
  42  |     await expect(restart).toBeFocused();
  43  |     await expect(target).toHaveText(edited!);
  44  |     await restart.press("Enter");
  45  |     await expect(session).not.toHaveAttribute("data-session-id", id!);
  46  |     await expect(input).toBeFocused();
  47  |     await expect(input).toHaveValue("");
  48  |     await expect(target.locator("[data-typed]")).toHaveCount(0);
  49  |     await expect(target.locator('[data-current="true"]')).toHaveAttribute(
  50  |       "data-slot-index",
  51  |       "0",
  52  |     );
> 53  |     await expect(marker).toHaveAttribute("data-position", "0");
      |                          ^ Error: expect(locator).toHaveAttribute(expected) failed
  54  |     await expect(page.getByTestId("race-pace-legend")).toContainText(
  55  |       "Alongside you",
  56  |     );
  57  |     await expect(page.getByText("Pro opponent", { exact: false })).toBeVisible();
  58  |     expect(seen.has((await target.textContent())!)).toBe(false);
  59  |     expect(await page.locator(".typing-hud .text-3xl").textContent()).toBe(
  60  |       "30s",
  61  |     );
  62  |   }
  63  |   const first = await target
  64  |     .locator('[data-slot-index="0"]')
  65  |     .getAttribute("data-expected");
  66  |   await input.pressSequentially(first!);
  67  |   await expect(input).toHaveValue(first!);
  68  |   await page.clock.fastForward(1000);
  69  |   await page.getByRole("button", { name: "Finish", exact: true }).click();
  70  |   const result = await exportedResult(page);
  71  |   expect(result.metrics.insertionAttempts).toBe(1);
  72  |   expect(result.events).toHaveLength(1);
  73  |   expect(result.configuration.initialTarget).not.toBe([...seen][0]);
  74  |   await page.screenshot({
  75  |     path: `audit/quick-restart-2026-10-16/result-${info.project.name}.png`,
  76  |     fullPage: true,
  77  |   });
  78  | });
  79  | 
  80  | test("bot results support Tab then Enter for a fresh race at the same difficulty", async ({
  81  |   page,
  82  | }) => {
  83  |   const input = await botPractice(page);
  84  |   const before = await page.getByTestId("typing-target").textContent();
  85  |   await input.pressSequentially("test");
  86  |   await input.press("ControlOrMeta+Enter");
  87  |   const results = page.getByRole("region", {
  88  |     name: "Session results",
  89  |     exact: true,
  90  |   });
  91  |   await expect(results).toBeFocused();
  92  |   await page.keyboard.press("Tab");
  93  |   const next = page.getByRole("button", { name: "Next test", exact: true });
  94  |   await expect(next).toBeFocused();
  95  |   await next.press("Enter");
  96  |   await expect(input).toBeFocused();
  97  |   await expect(input).toHaveValue("");
  98  |   await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
  99  |   await expect(page.getByText("Pro opponent", { exact: false })).toBeVisible();
  100 |   await expect(results).toHaveCount(0);
  101 | });
  102 | 
  103 | test("normal Test results use Tab then Enter for new random words", async ({
  104 |   page,
  105 | }) => {
  106 |   await page.goto("/");
  107 |   const input = await focusTyping(page);
  108 |   const before = await page.getByTestId("typing-target").textContent();
  109 |   await input.pressSequentially("test");
  110 |   await input.press("ControlOrMeta+Enter");
  111 |   await expect(
  112 |     page.getByRole("region", { name: "Session results", exact: true }),
  113 |   ).toBeFocused();
  114 |   await page.keyboard.press("Tab");
  115 |   await expect(
  116 |     page.getByRole("button", { name: "Next test", exact: true }),
  117 |   ).toBeFocused();
  118 |   await page.keyboard.press("Enter");
  119 |   await expect(input).toBeFocused();
  120 |   await expect(input).toHaveValue("");
  121 |   await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
  122 | });
  123 | 
  124 | test("Shift+Tab and further Tab navigation keep ordinary bot controls reachable", async ({
  125 |   page,
  126 | }) => {
  127 |   const input = await botPractice(page);
  128 |   const target = page.getByTestId("typing-target");
  129 |   const before = await target.textContent();
  130 |   const id = await page
  131 |     .getByRole("region", { name: "Typing session", exact: true })
  132 |     .getAttribute("data-session-id");
  133 |   await input.press("Shift+Tab");
  134 |   await expect(
  135 |     page.getByRole("button", { name: "Leave race", exact: true }),
  136 |   ).toBeFocused();
  137 |   await page.keyboard.press("Tab");
  138 |   await expect(input).toBeFocused();
  139 |   await input.press("Tab");
  140 |   await expect(
  141 |     page.getByRole("button", { name: "Restart with new text", exact: true }),
  142 |   ).toBeFocused();
  143 |   await page.keyboard.press("Tab");
  144 |   await expect(
  145 |     page.getByRole("button", {
  146 |       name: "Show accessible text editor",
  147 |       exact: true,
  148 |     }),
  149 |   ).toBeFocused();
  150 |   await expect(target).toHaveText(before!);
  151 |   await expect(
  152 |     page.getByRole("region", { name: "Typing session", exact: true }),
  153 |   ).toHaveAttribute("data-session-id", id!);
```