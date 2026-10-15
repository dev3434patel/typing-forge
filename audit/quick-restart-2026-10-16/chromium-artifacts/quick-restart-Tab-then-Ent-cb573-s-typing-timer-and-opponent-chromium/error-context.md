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
Received: "25"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByTestId('opponent-caret') with timeout 5000ms
  - waiting for getByTestId('opponent-caret')
    2 × locator resolved to <span data-position="2" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "2"
    - locator resolved to <span data-position="1" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "1"
    - locator resolved to <span data-position="2" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "2"
    - locator resolved to <span data-position="3" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "3"
    - locator resolved to <span data-position="7" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "7"
    - locator resolved to <span aria-hidden="true" data-position="10" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "10"
    - locator resolved to <span aria-hidden="true" data-position="15" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "15"
    - locator resolved to <span aria-hidden="true" data-position="17" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "17"
    2 × locator resolved to <span aria-hidden="true" data-position="19" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "19"
    - locator resolved to <span aria-hidden="true" data-position="20" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "20"
    - locator resolved to <span aria-hidden="true" data-position="25" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "25"

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
            - generic [ref=e86]: 61wpm
          - paragraph [ref=e89]: 5% correct target characters
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
          - generic [ref=e104]: 61 wpm
          - generic [ref=e105]: 28 characters ahead
        - generic [ref=e107]:
          - generic [ref=e109]:
            - generic [ref=e110]:
              - generic [ref=e111]: b
              - generic [ref=e112]: l
              - generic [ref=e113]: u
              - generic [ref=e114]: e
            - generic [ref=e116]:
              - generic [ref=e117]: r
              - generic [ref=e118]: o
              - generic [ref=e119]: o
              - generic [ref=e120]: t
            - generic [ref=e122]:
              - generic [ref=e123]: "n"
              - generic [ref=e124]: u
              - generic [ref=e125]: m
              - generic [ref=e126]: b
              - generic [ref=e127]: e
              - generic [ref=e128]: r
            - generic [ref=e130]:
              - generic [ref=e131]: "n"
              - generic [ref=e132]: e
              - generic [ref=e133]: x
              - generic [ref=e134]: t
            - generic [ref=e136]:
              - generic [ref=e137]: o
              - generic [ref=e138]: u
              - generic [ref=e139]: r
            - generic [ref=e141]:
              - generic [ref=e142]: r
              - generic [ref=e143]: o
              - generic [ref=e144]: a
              - generic [ref=e145]: d
            - generic [ref=e147]:
              - generic [ref=e148]: w
              - generic [ref=e149]: a
              - generic [ref=e150]: l
              - generic [ref=e151]: k
            - generic [ref=e153]:
              - generic [ref=e154]: s
              - generic [ref=e155]: a
              - generic [ref=e156]: "y"
            - generic [ref=e158]:
              - generic [ref=e159]: v
              - generic [ref=e160]: e
              - generic [ref=e161]: r
              - generic [ref=e162]: "y"
            - generic [ref=e164]:
              - generic [ref=e165]: d
              - generic [ref=e166]: e
              - generic [ref=e167]: a
              - generic [ref=e168]: r
            - generic [ref=e170]:
              - generic [ref=e171]: w
              - generic [ref=e172]: h
              - generic [ref=e173]: "y"
            - generic [ref=e175]:
              - generic [ref=e176]: "n"
              - generic [ref=e177]: e
              - generic [ref=e178]: x
              - generic [ref=e179]: t
            - generic [ref=e181]:
              - generic [ref=e182]: w
              - generic [ref=e183]: h
              - generic [ref=e184]: i
              - generic [ref=e185]: c
              - generic [ref=e186]: h
            - generic [ref=e188]:
              - generic [ref=e189]: m
              - generic [ref=e190]: e
            - generic [ref=e192]:
              - generic [ref=e193]: h
              - generic [ref=e194]: e
              - generic [ref=e195]: r
              - generic [ref=e196]: e
            - generic [ref=e198]:
              - generic [ref=e199]: l
              - generic [ref=e200]: a
              - generic [ref=e201]: s
              - generic [ref=e202]: t
            - generic [ref=e204]:
              - generic [ref=e205]: t
              - generic [ref=e206]: h
              - generic [ref=e207]: r
              - generic [ref=e208]: e
              - generic [ref=e209]: e
            - generic [ref=e211]:
              - generic [ref=e212]: f
              - generic [ref=e213]: i
              - generic [ref=e214]: r
              - generic [ref=e215]: s
              - generic [ref=e216]: t
            - generic [ref=e218]:
              - generic [ref=e219]: q
              - generic [ref=e220]: u
              - generic [ref=e221]: i
              - generic [ref=e222]: e
              - generic [ref=e223]: t
            - generic [ref=e225]:
              - generic [ref=e226]: w
              - generic [ref=e227]: a
              - generic [ref=e228]: t
              - generic [ref=e229]: e
              - generic [ref=e230]: r
            - generic [ref=e232]:
              - generic [ref=e233]: l
              - generic [ref=e234]: a
              - generic [ref=e235]: r
              - generic [ref=e236]: g
              - generic [ref=e237]: e
            - generic [ref=e239]:
              - generic [ref=e240]: h
              - generic [ref=e241]: a
              - generic [ref=e242]: "n"
              - generic [ref=e243]: d
            - generic [ref=e245]:
              - generic [ref=e246]: h
              - generic [ref=e247]: e
              - generic [ref=e248]: l
              - generic [ref=e249]: p
            - generic [ref=e251]:
              - generic [ref=e252]: r
              - generic [ref=e253]: o
              - generic [ref=e254]: s
              - generic [ref=e255]: e
            - generic [ref=e257]:
              - generic [ref=e258]: a
              - generic [ref=e259]: t
              - generic [ref=e260]: t
              - generic [ref=e261]: e
              - generic [ref=e262]: "n"
              - generic [ref=e263]: t
              - generic [ref=e264]: i
              - generic [ref=e265]: o
              - generic [ref=e266]: "n"
            - generic [ref=e268]:
              - generic [ref=e269]: s
              - generic [ref=e270]: e
              - generic [ref=e271]: v
              - generic [ref=e272]: e
              - generic [ref=e273]: "n"
            - generic [ref=e275]:
              - generic [ref=e276]: f
              - generic [ref=e277]: u
              - generic [ref=e278]: l
              - generic [ref=e279]: l
            - generic [ref=e281]:
              - generic [ref=e282]: s
              - generic [ref=e283]: t
              - generic [ref=e284]: a
              - generic [ref=e285]: r
              - generic [ref=e286]: e
            - generic [ref=e288]:
              - generic [ref=e289]: e
              - generic [ref=e290]: "n"
              - generic [ref=e291]: d
            - generic [ref=e293]:
              - generic [ref=e294]: b
              - generic [ref=e295]: l
              - generic [ref=e296]: u
              - generic [ref=e297]: e
            - generic [ref=e299]:
              - generic [ref=e300]: r
              - generic [ref=e301]: e
              - generic [ref=e302]: a
              - generic [ref=e303]: d
            - generic [ref=e305]:
              - generic [ref=e306]: w
              - generic [ref=e307]: h
              - generic [ref=e308]: i
              - generic [ref=e309]: t
              - generic [ref=e310]: e
            - generic [ref=e312]:
              - generic [ref=e313]: i
              - generic [ref=e314]: "n"
              - generic [ref=e315]: t
              - generic [ref=e316]: o
            - generic [ref=e318]:
              - generic [ref=e319]: t
              - generic [ref=e320]: o
              - generic [ref=e321]: w
              - generic [ref=e322]: "n"
            - generic [ref=e324]:
              - generic [ref=e325]: s
              - generic [ref=e326]: t
              - generic [ref=e327]: a
              - generic [ref=e328]: i
              - generic [ref=e329]: r
            - generic [ref=e331]:
              - generic [ref=e332]: f
              - generic [ref=e333]: i
              - generic [ref=e334]: v
              - generic [ref=e335]: e
            - generic [ref=e337]:
              - generic [ref=e338]: p
              - generic [ref=e339]: a
              - generic [ref=e340]: p
              - generic [ref=e341]: e
              - generic [ref=e342]: r
            - generic [ref=e344]:
              - generic [ref=e345]: s
              - generic [ref=e346]: o
              - generic [ref=e347]: r
              - generic [ref=e348]: e
            - generic [ref=e350]:
              - generic [ref=e351]: w
              - generic [ref=e352]: e
              - generic [ref=e353]: l
              - generic [ref=e354]: l
            - generic [ref=e356]:
              - generic [ref=e357]: "n"
              - generic [ref=e358]: a
              - generic [ref=e359]: m
              - generic [ref=e360]: e
            - generic [ref=e362]:
              - generic [ref=e363]: k
              - generic [ref=e364]: e
              - generic [ref=e365]: e
              - generic [ref=e366]: "n"
            - generic [ref=e368]:
              - generic [ref=e369]: h
              - generic [ref=e370]: e
              - generic [ref=e371]: a
              - generic [ref=e372]: d
            - generic [ref=e374]:
              - generic [ref=e375]: o
              - generic [ref=e376]: f
              - generic [ref=e377]: t
              - generic [ref=e378]: e
              - generic [ref=e379]: "n"
            - generic [ref=e381]:
              - generic [ref=e382]: w
              - generic [ref=e383]: o
              - generic [ref=e384]: o
              - generic [ref=e385]: d
            - generic [ref=e387]:
              - generic [ref=e388]: p
              - generic [ref=e389]: a
              - generic [ref=e390]: r
              - generic [ref=e391]: k
            - generic [ref=e393]: a
            - generic [ref=e396]:
              - generic [ref=e397]: d
              - generic [ref=e398]: r
              - generic [ref=e399]: e
              - generic [ref=e400]: a
              - generic [ref=e401]: m
            - generic [ref=e403]:
              - generic [ref=e404]: m
              - generic [ref=e405]: e
            - generic [ref=e407]:
              - generic [ref=e408]: s
              - generic [ref=e409]: "n"
              - generic [ref=e410]: o
              - generic [ref=e411]: w
            - generic [ref=e413]:
              - generic [ref=e414]: w
              - generic [ref=e415]: a
              - generic [ref=e416]: l
              - generic [ref=e417]: k
            - generic [ref=e419]:
              - generic [ref=e420]: g
              - generic [ref=e421]: l
              - generic [ref=e422]: a
              - generic [ref=e423]: s
              - generic [ref=e424]: s
            - generic [ref=e426]:
              - generic [ref=e427]: t
              - generic [ref=e428]: h
              - generic [ref=e429]: a
              - generic [ref=e430]: "n"
            - generic [ref=e432]:
              - generic [ref=e433]: s
              - generic [ref=e434]: t
              - generic [ref=e435]: o
              - generic [ref=e436]: r
              - generic [ref=e437]: e
            - generic [ref=e439]:
              - generic [ref=e440]: o
              - generic [ref=e441]: "n"
              - generic [ref=e442]: i
              - generic [ref=e443]: o
              - generic [ref=e444]: "n"
            - generic [ref=e446]:
              - generic [ref=e447]: v
              - generic [ref=e448]: o
              - generic [ref=e449]: i
              - generic [ref=e450]: c
              - generic [ref=e451]: e
            - generic [ref=e453]:
              - generic [ref=e454]: "y"
              - generic [ref=e455]: e
              - generic [ref=e456]: t
            - generic [ref=e458]:
              - generic [ref=e459]: s
              - generic [ref=e460]: i
              - generic [ref=e461]: l
              - generic [ref=e462]: v
              - generic [ref=e463]: e
              - generic [ref=e464]: r
            - generic [ref=e466]:
              - generic [ref=e467]: t
              - generic [ref=e468]: h
              - generic [ref=e469]: r
              - generic [ref=e470]: e
              - generic [ref=e471]: e
            - generic [ref=e473]:
              - generic [ref=e474]: p
              - generic [ref=e475]: r
              - generic [ref=e476]: a
              - generic [ref=e477]: c
              - generic [ref=e478]: t
              - generic [ref=e479]: i
              - generic [ref=e480]: c
              - generic [ref=e481]: e
            - generic [ref=e483]:
              - generic [ref=e484]: "n"
              - generic [ref=e485]: o
            - generic [ref=e487]:
              - generic [ref=e488]: m
              - generic [ref=e489]: a
              - generic [ref=e490]: d
              - generic [ref=e491]: e
            - generic [ref=e493]:
              - generic [ref=e494]: w
              - generic [ref=e495]: h
              - generic [ref=e496]: e
              - generic [ref=e497]: r
              - generic [ref=e498]: e
            - generic [ref=e500]:
              - generic [ref=e501]: t
              - generic [ref=e502]: h
              - generic [ref=e503]: a
              - generic [ref=e504]: t
            - generic [ref=e506]:
              - generic [ref=e507]: h
              - generic [ref=e508]: i
              - generic [ref=e509]: g
              - generic [ref=e510]: h
            - generic [ref=e512]:
              - generic [ref=e513]: "n"
              - generic [ref=e514]: o
              - generic [ref=e515]: t
            - generic [ref=e517]:
              - generic [ref=e518]: "n"
              - generic [ref=e519]: o
            - generic [ref=e521]:
              - generic [ref=e522]: t
              - generic [ref=e523]: o
              - generic [ref=e524]: e
            - generic [ref=e526]:
              - generic [ref=e527]: t
              - generic [ref=e528]: e
              - generic [ref=e529]: a
            - generic [ref=e531]:
              - generic [ref=e532]: r
              - generic [ref=e533]: a
              - generic [ref=e534]: t
              - generic [ref=e535]: i
              - generic [ref=e536]: o
              - generic [ref=e537]: "n"
            - generic [ref=e539]:
              - generic [ref=e540]: j
              - generic [ref=e541]: u
              - generic [ref=e542]: m
              - generic [ref=e543]: p
            - generic [ref=e545]:
              - generic [ref=e546]: "n"
              - generic [ref=e547]: e
              - generic [ref=e548]: o
              - generic [ref=e549]: "n"
            - generic [ref=e551]:
              - generic [ref=e552]: e
              - generic [ref=e553]: a
              - generic [ref=e554]: c
              - generic [ref=e555]: h
            - generic [ref=e557]:
              - generic [ref=e558]: f
              - generic [ref=e559]: a
              - generic [ref=e560]: i
              - generic [ref=e561]: r
            - generic [ref=e563]:
              - generic [ref=e564]: z
              - generic [ref=e565]: i
              - generic [ref=e566]: "n"
              - generic [ref=e567]: c
            - generic [ref=e569]:
              - generic [ref=e570]: f
              - generic [ref=e571]: e
              - generic [ref=e572]: e
              - generic [ref=e573]: l
            - generic [ref=e575]:
              - generic [ref=e576]: b
              - generic [ref=e577]: r
              - generic [ref=e578]: i
              - generic [ref=e579]: g
              - generic [ref=e580]: h
              - generic [ref=e581]: t
            - generic [ref=e583]:
              - generic [ref=e584]: j
              - generic [ref=e585]: u
              - generic [ref=e586]: s
              - generic [ref=e587]: t
            - generic [ref=e589]:
              - generic [ref=e590]: t
              - generic [ref=e591]: h
              - generic [ref=e592]: i
              - generic [ref=e593]: s
            - generic [ref=e595]:
              - generic [ref=e596]: e
              - generic [ref=e597]: a
              - generic [ref=e598]: r
              - generic [ref=e599]: t
              - generic [ref=e600]: h
            - generic [ref=e602]:
              - generic [ref=e603]: s
              - generic [ref=e604]: a
              - generic [ref=e605]: "y"
            - generic [ref=e607]:
              - generic [ref=e608]: t
              - generic [ref=e609]: h
              - generic [ref=e610]: a
              - generic [ref=e611]: "n"
            - generic [ref=e613]:
              - generic [ref=e614]: s
              - generic [ref=e615]: e
              - generic [ref=e616]: c
              - generic [ref=e617]: o
              - generic [ref=e618]: "n"
              - generic [ref=e619]: d
            - generic [ref=e621]:
              - generic [ref=e622]: g
              - generic [ref=e623]: a
              - generic [ref=e624]: m
              - generic [ref=e625]: e
            - generic [ref=e627]:
              - generic [ref=e628]: e
              - generic [ref=e629]: a
              - generic [ref=e630]: s
              - generic [ref=e631]: t
            - generic [ref=e633]:
              - generic [ref=e634]: g
              - generic [ref=e635]: r
              - generic [ref=e636]: o
              - generic [ref=e637]: u
              - generic [ref=e638]: p
            - generic [ref=e640]:
              - generic [ref=e641]: r
              - generic [ref=e642]: e
              - generic [ref=e643]: t
              - generic [ref=e644]: i
              - generic [ref=e645]: "n"
              - generic [ref=e646]: a
            - generic [ref=e648]:
              - generic [ref=e649]: r
              - generic [ref=e650]: e
              - generic [ref=e651]: "n"
              - generic [ref=e652]: t
            - generic [ref=e654]:
              - generic [ref=e655]: l
              - generic [ref=e656]: e
              - generic [ref=e657]: a
              - generic [ref=e658]: "n"
            - generic [ref=e660]:
              - generic [ref=e661]: h
              - generic [ref=e662]: i
              - generic [ref=e663]: s
            - generic [ref=e665]:
              - generic [ref=e666]: w
              - generic [ref=e667]: i
              - generic [ref=e668]: d
              - generic [ref=e669]: e
            - generic [ref=e671]:
              - generic [ref=e672]: s
              - generic [ref=e673]: u
              - generic [ref=e674]: m
              - generic [ref=e675]: m
              - generic [ref=e676]: e
              - generic [ref=e677]: r
            - generic [ref=e679]:
              - generic [ref=e680]: l
              - generic [ref=e681]: e
              - generic [ref=e682]: t
            - generic [ref=e684]:
              - generic [ref=e685]: w
              - generic [ref=e686]: h
              - generic [ref=e687]: e
              - generic [ref=e688]: "n"
            - generic [ref=e690]:
              - generic [ref=e691]: t
              - generic [ref=e692]: e
              - generic [ref=e693]: r
              - generic [ref=e694]: r
              - generic [ref=e695]: a
              - generic [ref=e696]: i
              - generic [ref=e697]: "n"
            - generic [ref=e699]:
              - generic [ref=e700]: s
              - generic [ref=e701]: a
              - generic [ref=e702]: m
              - generic [ref=e703]: e
            - generic [ref=e705]:
              - generic [ref=e706]: m
              - generic [ref=e707]: o
              - generic [ref=e708]: v
              - generic [ref=e709]: e
            - generic [ref=e711]:
              - generic [ref=e712]: t
              - generic [ref=e713]: r
              - generic [ref=e714]: e
              - generic [ref=e715]: e
            - generic [ref=e717]:
              - generic [ref=e718]: g
              - generic [ref=e719]: u
              - generic [ref=e720]: i
              - generic [ref=e721]: d
              - generic [ref=e722]: e
            - generic [ref=e724]:
              - generic [ref=e725]: o
              - generic [ref=e726]: p
              - generic [ref=e727]: e
              - generic [ref=e728]: "n"
            - generic [ref=e730]:
              - generic [ref=e731]: h
              - generic [ref=e732]: a
              - generic [ref=e733]: "n"
              - generic [ref=e734]: d
          - paragraph [ref=e735]: "Practice passage: blue root number next our road walk say very dear why next which me here last three first quiet water large hand help rose attention seven full stare end blue read white into town stair five paper sore well name keen head often wood park a dream me snow walk glass than store onion voice yet silver three practice no made where that high not no toe tea ration jump neon each fair zinc feel bright just this earth say than second game east group retina rent lean his wide summer let when terrain same move tree guide open hand"
          - textbox "Typing input" [active] [ref=e736]
        - generic [ref=e738]:
          - paragraph [ref=e739]: Type the text above. Wrong letters stay visible; Backspace corrects.
          - status [ref=e740]
        - generic [ref=e741]:
          - paragraph [ref=e742]: Shared clock · Ctrl+Enter finishes · Tab → Enter restarts
          - generic [ref=e743]:
            - button "Restart with new text" [ref=e744]
            - button "Show accessible text editor" [ref=e748]
            - button "Finish" [ref=e752]
        - status [ref=e755]: Test running
  - contentinfo [ref=e756]:
    - generic [ref=e757]:
      - generic [ref=e758]: A little practice. Lasting progress.
      - generic [ref=e761]:
        - link "About & metrics" [ref=e762] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e763] [cursor=pointer]:
          - /url: /settings
        - generic [ref=e764]: Typing Forge © 2026
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