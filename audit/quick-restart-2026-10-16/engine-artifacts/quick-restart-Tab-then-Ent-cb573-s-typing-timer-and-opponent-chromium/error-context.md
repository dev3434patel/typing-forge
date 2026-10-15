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
Received: "31"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByTestId('opponent-caret') with timeout 5000ms
  - waiting for getByTestId('opponent-caret')
    2 × locator resolved to <span data-position="1" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "1"
    - locator resolved to <span data-position="2" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "2"
    2 × locator resolved to <span data-position="3" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "3"
    - locator resolved to <span data-position="7" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "7"
    - locator resolved to <span aria-hidden="true" data-position="13" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "13"
    - locator resolved to <span aria-hidden="true" data-position="17" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "17"
    - locator resolved to <span aria-hidden="true" data-position="21" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "21"
    - locator resolved to <span aria-hidden="true" data-position="23" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "23"
    - locator resolved to <span aria-hidden="true" data-position="24" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "24"
    - locator resolved to <span aria-hidden="true" data-position="28" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "28"
    2 × locator resolved to <span aria-hidden="true" data-position="31" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "31"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "Skip to content" [ref=e5] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e6]:
      - link "Typing Forge home" [ref=e7] [cursor=pointer]:
        - /url: /
        - generic [ref=e11]: typingforge.
      - navigation "Main navigation" [ref=e12]:
        - link "Test" [ref=e13] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=e16] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=e20] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=e30] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=e33] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e40] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=e43]:
        - button "Open command palette" [ref=e44]
        - link "Settings" [ref=e47] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=e51] [cursor=pointer]:
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
            - generic [ref=e86]: 74wpm
          - paragraph [ref=e89]: 7% correct target characters
      - region "Typing session" [ref=e90]:
        - generic [ref=e91]:
          - generic [ref=e92]:
            - generic [ref=e93]:
              - generic [ref=e94]: 24s
              - generic [ref=e95]: remaining
            - generic [ref=e96]: 0wpm
            - generic [ref=e97]: —acc %
          - generic [ref=e98]: Find your rhythm
        - generic [ref=e99]:
          - generic [ref=e100]: You
          - generic [ref=e102]: Bot pace
          - generic [ref=e104]: 74 wpm
          - generic [ref=e105]: 37 characters ahead
        - generic [ref=e107]:
          - generic [ref=e109]:
            - generic [ref=e110]:
              - generic [ref=e111]: t
              - generic [ref=e112]: e
              - generic [ref=e113]: "n"
              - generic [ref=e114]: t
            - generic [ref=e116]:
              - generic [ref=e117]: s
              - generic [ref=e118]: p
              - generic [ref=e119]: a
              - generic [ref=e120]: c
              - generic [ref=e121]: e
            - generic [ref=e123]:
              - generic [ref=e124]: "n"
              - generic [ref=e125]: a
              - generic [ref=e126]: t
              - generic [ref=e127]: u
              - generic [ref=e128]: r
              - generic [ref=e129]: e
            - generic [ref=e131]:
              - generic [ref=e132]: k
              - generic [ref=e133]: i
              - generic [ref=e134]: "n"
              - generic [ref=e135]: d
            - generic [ref=e137]:
              - generic [ref=e138]: l
              - generic [ref=e139]: a
              - generic [ref=e140]: "n"
              - generic [ref=e141]: d
            - generic [ref=e143]:
              - generic [ref=e144]: s
              - generic [ref=e145]: t
              - generic [ref=e146]: o
              - generic [ref=e147]: p
            - generic [ref=e149]:
              - generic [ref=e150]: l
              - generic [ref=e151]: a
              - generic [ref=e152]: s
              - generic [ref=e153]: t
            - generic [ref=e155]:
              - generic [ref=e156]: w
              - generic [ref=e157]: e
              - generic [ref=e158]: s
              - generic [ref=e159]: t
            - generic [ref=e161]:
              - generic [ref=e162]: t
              - generic [ref=e163]: i
              - generic [ref=e164]: e
              - generic [ref=e165]: r
            - generic [ref=e167]:
              - generic [ref=e168]: t
              - generic [ref=e169]: i
              - generic [ref=e170]: m
              - generic [ref=e171]: e
            - generic [ref=e173]:
              - generic [ref=e174]: w
              - generic [ref=e175]: i
              - generic [ref=e176]: d
              - generic [ref=e177]: e
            - generic [ref=e179]:
              - generic [ref=e180]: l
              - generic [ref=e181]: o
              - generic [ref=e182]: o
              - generic [ref=e183]: k
            - generic [ref=e185]:
              - generic [ref=e186]: g
              - generic [ref=e187]: r
              - generic [ref=e188]: e
              - generic [ref=e189]: e
              - generic [ref=e190]: "n"
            - generic [ref=e192]:
              - generic [ref=e193]: h
              - generic [ref=e194]: e
              - generic [ref=e195]: l
              - generic [ref=e196]: p
            - generic [ref=e198]:
              - generic [ref=e199]: t
              - generic [ref=e200]: o
              - generic [ref=e201]: "n"
              - generic [ref=e202]: e
            - generic [ref=e204]:
              - generic [ref=e205]: m
              - generic [ref=e206]: i
              - generic [ref=e207]: "n"
              - generic [ref=e208]: e
            - generic [ref=e210]:
              - generic [ref=e211]: d
              - generic [ref=e212]: a
              - generic [ref=e213]: r
              - generic [ref=e214]: k
            - generic [ref=e216]:
              - generic [ref=e217]: "n"
              - generic [ref=e218]: e
              - generic [ref=e219]: v
              - generic [ref=e220]: e
              - generic [ref=e221]: r
            - generic [ref=e223]:
              - generic [ref=e224]: e
              - generic [ref=e225]: "y"
              - generic [ref=e226]: e
            - generic [ref=e228]:
              - generic [ref=e229]: t
              - generic [ref=e230]: i
              - generic [ref=e231]: e
            - generic [ref=e233]:
              - generic [ref=e234]: w
              - generic [ref=e235]: h
              - generic [ref=e236]: e
              - generic [ref=e237]: r
              - generic [ref=e238]: e
            - generic [ref=e240]:
              - generic [ref=e241]: c
              - generic [ref=e242]: l
              - generic [ref=e243]: e
              - generic [ref=e244]: a
              - generic [ref=e245]: r
            - generic [ref=e247]:
              - generic [ref=e248]: s
              - generic [ref=e249]: o
              - generic [ref=e250]: u
              - generic [ref=e251]: "n"
              - generic [ref=e252]: d
            - generic [ref=e254]:
              - generic [ref=e255]: f
              - generic [ref=e256]: r
              - generic [ref=e257]: o
              - generic [ref=e258]: m
            - generic [ref=e260]:
              - generic [ref=e261]: b
              - generic [ref=e262]: r
              - generic [ref=e263]: i
              - generic [ref=e264]: g
              - generic [ref=e265]: h
              - generic [ref=e266]: t
            - generic [ref=e268]:
              - generic [ref=e269]: p
              - generic [ref=e270]: u
              - generic [ref=e271]: t
            - generic [ref=e273]:
              - generic [ref=e274]: q
              - generic [ref=e275]: u
              - generic [ref=e276]: i
              - generic [ref=e277]: t
              - generic [ref=e278]: e
            - generic [ref=e280]:
              - generic [ref=e281]: s
              - generic [ref=e282]: t
              - generic [ref=e283]: a
              - generic [ref=e284]: i
              - generic [ref=e285]: r
            - generic [ref=e287]:
              - generic [ref=e288]: f
              - generic [ref=e289]: o
              - generic [ref=e290]: o
              - generic [ref=e291]: t
            - generic [ref=e293]:
              - generic [ref=e294]: f
              - generic [ref=e295]: i
              - generic [ref=e296]: v
              - generic [ref=e297]: e
            - generic [ref=e299]:
              - generic [ref=e300]: l
              - generic [ref=e301]: o
              - generic [ref=e302]: o
              - generic [ref=e303]: k
            - generic [ref=e305]:
              - generic [ref=e306]: r
              - generic [ref=e307]: e
              - generic [ref=e308]: a
              - generic [ref=e309]: d
            - generic [ref=e311]:
              - generic [ref=e312]: l
              - generic [ref=e313]: o
              - generic [ref=e314]: "n"
              - generic [ref=e315]: g
            - generic [ref=e317]:
              - generic [ref=e318]: w
              - generic [ref=e319]: i
              - generic [ref=e320]: "n"
              - generic [ref=e321]: d
              - generic [ref=e322]: o
              - generic [ref=e323]: w
            - generic [ref=e325]:
              - generic [ref=e326]: t
              - generic [ref=e327]: h
              - generic [ref=e328]: i
              - generic [ref=e329]: "n"
              - generic [ref=e330]: k
            - generic [ref=e332]:
              - generic [ref=e333]: a
              - generic [ref=e334]: "n"
            - generic [ref=e336]:
              - generic [ref=e337]: h
              - generic [ref=e338]: e
              - generic [ref=e339]: r
            - generic [ref=e341]:
              - generic [ref=e342]: s
              - generic [ref=e343]: c
              - generic [ref=e344]: h
              - generic [ref=e345]: o
              - generic [ref=e346]: o
              - generic [ref=e347]: l
            - generic [ref=e349]:
              - generic [ref=e350]: s
              - generic [ref=e351]: u
              - generic [ref=e352]: r
              - generic [ref=e353]: e
            - generic [ref=e355]:
              - generic [ref=e356]: f
              - generic [ref=e357]: i
              - generic [ref=e358]: v
              - generic [ref=e359]: e
            - generic [ref=e361]:
              - generic [ref=e362]: t
              - generic [ref=e363]: h
              - generic [ref=e364]: a
              - generic [ref=e365]: "n"
            - generic [ref=e367]:
              - generic [ref=e368]: c
              - generic [ref=e369]: o
              - generic [ref=e370]: l
              - generic [ref=e371]: d
            - generic [ref=e373]:
              - generic [ref=e374]: h
              - generic [ref=e375]: a
              - generic [ref=e376]: "n"
              - generic [ref=e377]: d
            - generic [ref=e379]:
              - generic [ref=e380]: "n"
              - generic [ref=e381]: e
              - generic [ref=e382]: a
              - generic [ref=e383]: t
            - generic [ref=e385]:
              - generic [ref=e386]: z
              - generic [ref=e387]: e
              - generic [ref=e388]: r
              - generic [ref=e389]: o
            - generic [ref=e391]:
              - generic [ref=e392]: q
              - generic [ref=e393]: u
              - generic [ref=e394]: i
              - generic [ref=e395]: c
              - generic [ref=e396]: k
            - generic [ref=e398]:
              - generic [ref=e399]: l
              - generic [ref=e400]: e
              - generic [ref=e401]: a
              - generic [ref=e402]: "n"
            - generic [ref=e404]:
              - generic [ref=e405]: m
              - generic [ref=e406]: a
              - generic [ref=e407]: "y"
            - generic [ref=e409]:
              - generic [ref=e410]: m
              - generic [ref=e411]: a
              - generic [ref=e412]: k
              - generic [ref=e413]: e
            - generic [ref=e415]:
              - generic [ref=e416]: m
              - generic [ref=e417]: a
              - generic [ref=e418]: "y"
            - generic [ref=e420]:
              - generic [ref=e421]: o
              - generic [ref=e422]: u
              - generic [ref=e423]: t
            - generic [ref=e425]:
              - generic [ref=e426]: e
              - generic [ref=e427]: a
              - generic [ref=e428]: r
            - generic [ref=e430]:
              - generic [ref=e431]: m
              - generic [ref=e432]: u
              - generic [ref=e433]: c
              - generic [ref=e434]: h
            - generic [ref=e436]:
              - generic [ref=e437]: t
              - generic [ref=e438]: o
              - generic [ref=e439]: p
            - generic [ref=e441]:
              - generic [ref=e442]: w
              - generic [ref=e443]: e
              - generic [ref=e444]: l
              - generic [ref=e445]: l
            - generic [ref=e447]:
              - generic [ref=e448]: p
              - generic [ref=e449]: a
              - generic [ref=e450]: i
              - generic [ref=e451]: r
            - generic [ref=e453]:
              - generic [ref=e454]: t
              - generic [ref=e455]: h
              - generic [ref=e456]: e
              - generic [ref=e457]: r
              - generic [ref=e458]: e
            - generic [ref=e460]:
              - generic [ref=e461]: u
              - generic [ref=e462]: "n"
              - generic [ref=e463]: d
              - generic [ref=e464]: e
              - generic [ref=e465]: r
            - generic [ref=e467]:
              - generic [ref=e468]: p
              - generic [ref=e469]: a
              - generic [ref=e470]: g
              - generic [ref=e471]: e
            - generic [ref=e473]:
              - generic [ref=e474]: r
              - generic [ref=e475]: e
              - generic [ref=e476]: a
              - generic [ref=e477]: d
            - generic [ref=e479]:
              - generic [ref=e480]: p
              - generic [ref=e481]: i
              - generic [ref=e482]: "n"
              - generic [ref=e483]: k
            - generic [ref=e485]:
              - generic [ref=e486]: i
              - generic [ref=e487]: f
            - generic [ref=e489]:
              - generic [ref=e490]: d
              - generic [ref=e491]: r
              - generic [ref=e492]: e
              - generic [ref=e493]: a
              - generic [ref=e494]: m
            - generic [ref=e496]:
              - generic [ref=e497]: a
              - generic [ref=e498]: t
            - generic [ref=e500]:
              - generic [ref=e501]: f
              - generic [ref=e502]: a
              - generic [ref=e503]: s
              - generic [ref=e504]: t
            - generic [ref=e506]:
              - generic [ref=e507]: b
              - generic [ref=e508]: l
              - generic [ref=e509]: u
              - generic [ref=e510]: e
            - generic [ref=e512]:
              - generic [ref=e513]: d
              - generic [ref=e514]: o
              - generic [ref=e515]: w
              - generic [ref=e516]: "n"
            - generic [ref=e518]:
              - generic [ref=e519]: s
              - generic [ref=e520]: m
              - generic [ref=e521]: a
              - generic [ref=e522]: l
              - generic [ref=e523]: l
            - generic [ref=e525]:
              - generic [ref=e526]: c
              - generic [ref=e527]: a
              - generic [ref=e528]: "n"
            - generic [ref=e530]: i
            - generic [ref=e533]:
              - generic [ref=e534]: m
              - generic [ref=e535]: e
              - generic [ref=e536]: e
              - generic [ref=e537]: t
            - generic [ref=e539]:
              - generic [ref=e540]: s
              - generic [ref=e541]: p
              - generic [ref=e542]: e
              - generic [ref=e543]: e
              - generic [ref=e544]: d
            - generic [ref=e546]:
              - generic [ref=e547]: b
              - generic [ref=e548]: l
              - generic [ref=e549]: a
              - generic [ref=e550]: c
              - generic [ref=e551]: k
            - generic [ref=e553]:
              - generic [ref=e554]: s
              - generic [ref=e555]: p
              - generic [ref=e556]: a
              - generic [ref=e557]: c
              - generic [ref=e558]: e
            - generic [ref=e560]:
              - generic [ref=e561]: j
              - generic [ref=e562]: u
              - generic [ref=e563]: m
              - generic [ref=e564]: p
            - generic [ref=e566]:
              - generic [ref=e567]: "y"
              - generic [ref=e568]: e
              - generic [ref=e569]: a
              - generic [ref=e570]: r
            - generic [ref=e572]:
              - generic [ref=e573]: g
              - generic [ref=e574]: r
              - generic [ref=e575]: o
              - generic [ref=e576]: u
              - generic [ref=e577]: "n"
              - generic [ref=e578]: d
            - generic [ref=e580]:
              - generic [ref=e581]: o
              - generic [ref=e582]: w
              - generic [ref=e583]: "n"
            - generic [ref=e585]:
              - generic [ref=e586]: w
              - generic [ref=e587]: i
              - generic [ref=e588]: t
              - generic [ref=e589]: h
            - generic [ref=e591]:
              - generic [ref=e592]: s
              - generic [ref=e593]: l
              - generic [ref=e594]: o
              - generic [ref=e595]: w
            - generic [ref=e597]:
              - generic [ref=e598]: s
              - generic [ref=e599]: o
            - generic [ref=e601]:
              - generic [ref=e602]: c
              - generic [ref=e603]: o
              - generic [ref=e604]: d
              - generic [ref=e605]: e
            - generic [ref=e607]:
              - generic [ref=e608]: e
              - generic [ref=e609]: "y"
              - generic [ref=e610]: e
            - generic [ref=e612]:
              - generic [ref=e613]: i
              - generic [ref=e614]: t
            - generic [ref=e616]:
              - generic [ref=e617]: w
              - generic [ref=e618]: a
              - generic [ref=e619]: "y"
            - generic [ref=e621]:
              - generic [ref=e622]: l
              - generic [ref=e623]: a
              - generic [ref=e624]: "n"
              - generic [ref=e625]: d
            - generic [ref=e627]:
              - generic [ref=e628]: s
              - generic [ref=e629]: t
              - generic [ref=e630]: o
              - generic [ref=e631]: p
            - generic [ref=e633]:
              - generic [ref=e634]: t
              - generic [ref=e635]: o
              - generic [ref=e636]: "n"
            - generic [ref=e638]:
              - generic [ref=e639]: b
              - generic [ref=e640]: u
              - generic [ref=e641]: i
              - generic [ref=e642]: l
              - generic [ref=e643]: d
            - generic [ref=e645]:
              - generic [ref=e646]: o
              - generic [ref=e647]: f
              - generic [ref=e648]: f
            - generic [ref=e650]:
              - generic [ref=e651]: d
              - generic [ref=e652]: r
              - generic [ref=e653]: e
              - generic [ref=e654]: a
              - generic [ref=e655]: m
            - generic [ref=e657]:
              - generic [ref=e658]: a
              - generic [ref=e659]: r
              - generic [ref=e660]: e
            - generic [ref=e662]:
              - generic [ref=e663]: t
              - generic [ref=e664]: r
              - generic [ref=e665]: u
              - generic [ref=e666]: e
            - generic [ref=e668]:
              - generic [ref=e669]: j
              - generic [ref=e670]: o
              - generic [ref=e671]: k
              - generic [ref=e672]: e
            - generic [ref=e674]:
              - generic [ref=e675]: s
              - generic [ref=e676]: e
              - generic [ref=e677]: v
              - generic [ref=e678]: e
              - generic [ref=e679]: "n"
            - generic [ref=e681]:
              - generic [ref=e682]: "n"
              - generic [ref=e683]: e
              - generic [ref=e684]: v
              - generic [ref=e685]: e
              - generic [ref=e686]: r
            - generic [ref=e688]:
              - generic [ref=e689]: s
              - generic [ref=e690]: a
              - generic [ref=e691]: m
              - generic [ref=e692]: e
            - generic [ref=e694]:
              - generic [ref=e695]: d
              - generic [ref=e696]: a
              - generic [ref=e697]: r
              - generic [ref=e698]: k
            - generic [ref=e700]:
              - generic [ref=e701]: t
              - generic [ref=e702]: r
              - generic [ref=e703]: e
              - generic [ref=e704]: e
            - generic [ref=e706]:
              - generic [ref=e707]: p
              - generic [ref=e708]: e
              - generic [ref=e709]: o
              - generic [ref=e710]: p
              - generic [ref=e711]: l
              - generic [ref=e712]: e
          - paragraph [ref=e713]: "Practice passage: tent space nature kind land stop last west tier time wide look green help tone mine dark never eye tie where clear sound from bright put quite stair foot five look read long window think an her school sure five than cold hand neat zero quick lean may make may out ear much top well pair there under page read pink if dream at fast blue down small can i meet speed black space jump year ground own with slow so code eye it way land stop ton build off dream are true joke seven never same dark tree people"
          - textbox "Typing input" [active] [ref=e714]
        - generic [ref=e716]:
          - paragraph [ref=e717]: Type the text above. Wrong letters stay visible; Backspace corrects.
          - status [ref=e718]
        - generic [ref=e719]:
          - paragraph [ref=e720]: Shared clock · Ctrl+Enter finishes · Tab → Enter restarts
          - generic [ref=e721]:
            - button "Restart with new text" [ref=e722]
            - button "Show accessible text editor" [ref=e726]
            - button "Finish" [ref=e730]
        - status [ref=e733]: Test running
  - contentinfo [ref=e734]:
    - generic [ref=e735]:
      - generic [ref=e736]: A little practice. Lasting progress.
      - generic [ref=e739]:
        - link "About & metrics" [ref=e740] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e741] [cursor=pointer]:
          - /url: /settings
        - generic [ref=e742]: Typing Forge © 2026
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
  57  |     await expect(page.getByText("Pro opponent", { exact: true })).toBeVisible();
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
  99  |   await expect(page.getByText("Pro opponent", { exact: true })).toBeVisible();
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