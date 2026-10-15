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
Received: "37"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByTestId('opponent-caret') with timeout 5000ms
  - waiting for getByTestId('opponent-caret')
    2 × locator resolved to <span data-position="1" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "1"
    - locator resolved to <span data-position="2" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "2"
    - locator resolved to <span data-position="3" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "3"
    2 × locator resolved to <span data-position="4" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
      - unexpected value "4"
    - locator resolved to <span data-position="8" aria-hidden="true" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "8"
    - locator resolved to <span aria-hidden="true" data-position="13" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "13"
    - locator resolved to <span aria-hidden="true" data-position="18" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "18"
    - locator resolved to <span aria-hidden="true" data-position="24" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "24"
    - locator resolved to <span aria-hidden="true" data-position="28" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "28"
    - locator resolved to <span aria-hidden="true" data-position="34" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "34"
    - locator resolved to <span aria-hidden="true" data-position="37" data-in-view="true" class="opponent-caret" data-testid="opponent-caret"></span>
    - unexpected value "37"

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
        - generic [ref=e19]: typingforge.
      - navigation "Main navigation" [ref=e20]:
        - link "Test" [ref=e21] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=e32] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=e37] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=e47] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=e53] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e61] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=e72]:
        - button "Open command palette" [ref=e73]
        - link "Settings" [ref=e76] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=e82] [cursor=pointer]:
          - /url: /auth
  - main [ref=e87]:
    - generic [ref=e88]:
      - generic [ref=e89]:
        - paragraph [ref=e90]: A little friendly competition
        - heading "Find your racing rhythm." [level=1] [ref=e91]
        - paragraph [ref=e92]: Share a track with a friend, or warm up against a local bot.
      - button "Leave race" [ref=e93]
    - generic [ref=e98]:
      - generic [ref=e99]:
        - generic [ref=e100]:
          - generic [ref=e101]:
            - generic [ref=e102]: You
            - generic [ref=e108]: 0wpm
          - paragraph [ref=e110]: 0% correct target characters
        - generic [ref=e111]:
          - generic [ref=e112]:
            - generic [ref=e113]:
              - text: Pro opponent
              - generic [ref=e121]: local bot
            - generic [ref=e122]: 94wpm
          - paragraph [ref=e125]: 9% correct target characters
      - region "Typing session" [ref=e126]:
        - generic [ref=e127]:
          - generic [ref=e128]:
            - generic [ref=e129]:
              - generic [ref=e130]: 25s
              - generic [ref=e131]: remaining
            - generic [ref=e132]: 0wpm
            - generic [ref=e133]: —acc %
          - generic [ref=e134]: Find your rhythm
        - generic [ref=e135]:
          - generic [ref=e136]: You
          - generic [ref=e138]: Bot pace
          - generic [ref=e140]: 94 wpm
          - generic [ref=e141]: 45 characters ahead
        - generic [ref=e143]:
          - generic [ref=e145]:
            - generic [ref=e146]:
              - generic [ref=e147]: i
              - generic [ref=e148]: "n"
            - generic [ref=e150]:
              - generic [ref=e151]: f
              - generic [ref=e152]: u
              - generic [ref=e153]: l
              - generic [ref=e154]: l
            - generic [ref=e156]:
              - generic [ref=e157]: f
              - generic [ref=e158]: a
              - generic [ref=e159]: r
            - generic [ref=e161]:
              - generic [ref=e162]: g
              - generic [ref=e163]: r
              - generic [ref=e164]: e
              - generic [ref=e165]: a
              - generic [ref=e166]: t
            - generic [ref=e168]:
              - generic [ref=e169]: "y"
              - generic [ref=e170]: o
              - generic [ref=e171]: u
            - generic [ref=e173]:
              - generic [ref=e174]: l
              - generic [ref=e175]: e
              - generic [ref=e176]: t
            - generic [ref=e178]:
              - generic [ref=e179]: w
              - generic [ref=e180]: a
              - generic [ref=e181]: r
              - generic [ref=e182]: m
            - generic [ref=e184]:
              - generic [ref=e185]: p
              - generic [ref=e186]: a
              - generic [ref=e187]: r
              - generic [ref=e188]: k
            - generic [ref=e190]:
              - generic [ref=e191]: s
              - generic [ref=e192]: t
              - generic [ref=e193]: u
              - generic [ref=e194]: d
              - generic [ref=e195]: "y"
            - generic [ref=e197]:
              - generic [ref=e198]: e
              - generic [ref=e199]: a
              - generic [ref=e200]: c
              - generic [ref=e201]: h
            - generic [ref=e203]:
              - generic [ref=e204]: r
              - generic [ref=e205]: e
              - generic [ref=e206]: t
              - generic [ref=e207]: a
              - generic [ref=e208]: i
              - generic [ref=e209]: "n"
            - generic [ref=e211]:
              - generic [ref=e212]: s
              - generic [ref=e213]: p
              - generic [ref=e214]: r
              - generic [ref=e215]: i
              - generic [ref=e216]: "n"
              - generic [ref=e217]: g
            - generic [ref=e219]:
              - generic [ref=e220]: s
              - generic [ref=e221]: h
              - generic [ref=e222]: a
              - generic [ref=e223]: p
              - generic [ref=e224]: e
            - generic [ref=e226]:
              - generic [ref=e227]: l
              - generic [ref=e228]: a
              - generic [ref=e229]: t
              - generic [ref=e230]: e
              - generic [ref=e231]: r
            - generic [ref=e233]:
              - generic [ref=e234]: w
              - generic [ref=e235]: i
              - generic [ref=e236]: t
              - generic [ref=e237]: h
            - generic [ref=e239]:
              - generic [ref=e240]: h
              - generic [ref=e241]: e
              - generic [ref=e242]: r
              - generic [ref=e243]: e
            - generic [ref=e245]:
              - generic [ref=e246]: r
              - generic [ref=e247]: o
              - generic [ref=e248]: o
              - generic [ref=e249]: t
            - generic [ref=e251]:
              - generic [ref=e252]: "n"
              - generic [ref=e253]: e
              - generic [ref=e254]: a
              - generic [ref=e255]: r
            - generic [ref=e257]:
              - generic [ref=e258]: r
              - generic [ref=e259]: o
              - generic [ref=e260]: o
              - generic [ref=e261]: m
            - generic [ref=e263]:
              - generic [ref=e264]: c
              - generic [ref=e265]: l
              - generic [ref=e266]: o
              - generic [ref=e267]: s
              - generic [ref=e268]: e
            - generic [ref=e270]:
              - generic [ref=e271]: h
              - generic [ref=e272]: o
              - generic [ref=e273]: w
            - generic [ref=e275]:
              - generic [ref=e276]: s
              - generic [ref=e277]: m
              - generic [ref=e278]: i
              - generic [ref=e279]: l
              - generic [ref=e280]: e
            - generic [ref=e282]:
              - generic [ref=e283]: h
              - generic [ref=e284]: i
              - generic [ref=e285]: l
              - generic [ref=e286]: l
            - generic [ref=e288]:
              - generic [ref=e289]: m
              - generic [ref=e290]: o
              - generic [ref=e291]: v
              - generic [ref=e292]: e
            - generic [ref=e294]:
              - generic [ref=e295]: l
              - generic [ref=e296]: e
              - generic [ref=e297]: a
              - generic [ref=e298]: "n"
            - generic [ref=e300]:
              - generic [ref=e301]: l
              - generic [ref=e302]: o
              - generic [ref=e303]: v
              - generic [ref=e304]: e
            - generic [ref=e306]:
              - generic [ref=e307]: w
              - generic [ref=e308]: h
              - generic [ref=e309]: e
              - generic [ref=e310]: r
              - generic [ref=e311]: e
            - generic [ref=e313]:
              - generic [ref=e314]: h
              - generic [ref=e315]: i
              - generic [ref=e316]: s
            - generic [ref=e318]: a
            - generic [ref=e321]:
              - generic [ref=e322]: b
              - generic [ref=e323]: o
              - generic [ref=e324]: o
              - generic [ref=e325]: k
            - generic [ref=e327]:
              - generic [ref=e328]: a
              - generic [ref=e329]: r
              - generic [ref=e330]: i
              - generic [ref=e331]: s
              - generic [ref=e332]: e
            - generic [ref=e334]:
              - generic [ref=e335]: p
              - generic [ref=e336]: o
              - generic [ref=e337]: w
              - generic [ref=e338]: e
              - generic [ref=e339]: r
            - generic [ref=e341]:
              - generic [ref=e342]: g
              - generic [ref=e343]: a
              - generic [ref=e344]: m
              - generic [ref=e345]: e
            - generic [ref=e347]:
              - generic [ref=e348]: t
              - generic [ref=e349]: u
              - generic [ref=e350]: r
              - generic [ref=e351]: "n"
            - generic [ref=e353]:
              - generic [ref=e354]: s
              - generic [ref=e355]: h
              - generic [ref=e356]: o
              - generic [ref=e357]: r
              - generic [ref=e358]: e
            - generic [ref=e360]:
              - generic [ref=e361]: e
              - generic [ref=e362]: a
              - generic [ref=e363]: r
              - generic [ref=e364]: l
              - generic [ref=e365]: "y"
            - generic [ref=e367]:
              - generic [ref=e368]: "y"
              - generic [ref=e369]: e
              - generic [ref=e370]: s
            - generic [ref=e372]:
              - generic [ref=e373]: o
              - generic [ref=e374]: v
              - generic [ref=e375]: e
              - generic [ref=e376]: r
            - generic [ref=e378]:
              - generic [ref=e379]: c
              - generic [ref=e380]: a
              - generic [ref=e381]: r
              - generic [ref=e382]: e
            - generic [ref=e384]:
              - generic [ref=e385]: s
              - generic [ref=e386]: l
              - generic [ref=e387]: o
              - generic [ref=e388]: w
            - generic [ref=e390]:
              - generic [ref=e391]: l
              - generic [ref=e392]: a
              - generic [ref=e393]: t
              - generic [ref=e394]: e
              - generic [ref=e395]: r
            - generic [ref=e397]:
              - generic [ref=e398]: p
              - generic [ref=e399]: o
              - generic [ref=e400]: i
              - generic [ref=e401]: "n"
              - generic [ref=e402]: t
            - generic [ref=e404]:
              - generic [ref=e405]: d
              - generic [ref=e406]: e
              - generic [ref=e407]: e
              - generic [ref=e408]: p
            - generic [ref=e410]: i
            - generic [ref=e413]:
              - generic [ref=e414]: s
              - generic [ref=e415]: t
              - generic [ref=e416]: a
              - generic [ref=e417]: "n"
              - generic [ref=e418]: d
            - generic [ref=e420]:
              - generic [ref=e421]: l
              - generic [ref=e422]: e
              - generic [ref=e423]: t
            - generic [ref=e425]:
              - generic [ref=e426]: a
              - generic [ref=e427]: "n"
            - generic [ref=e429]:
              - generic [ref=e430]: u
              - generic [ref=e431]: p
            - generic [ref=e433]:
              - generic [ref=e434]: t
              - generic [ref=e435]: r
              - generic [ref=e436]: e
              - generic [ref=e437]: e
            - generic [ref=e439]:
              - generic [ref=e440]: c
              - generic [ref=e441]: o
              - generic [ref=e442]: d
              - generic [ref=e443]: e
            - generic [ref=e445]:
              - generic [ref=e446]: t
              - generic [ref=e447]: e
              - generic [ref=e448]: s
              - generic [ref=e449]: t
            - generic [ref=e451]:
              - generic [ref=e452]: m
              - generic [ref=e453]: a
              - generic [ref=e454]: d
              - generic [ref=e455]: e
            - generic [ref=e457]:
              - generic [ref=e458]: s
              - generic [ref=e459]: o
            - generic [ref=e461]:
              - generic [ref=e462]: s
              - generic [ref=e463]: o
            - generic [ref=e465]:
              - generic [ref=e466]: t
              - generic [ref=e467]: h
              - generic [ref=e468]: e
              - generic [ref=e469]: s
              - generic [ref=e470]: e
            - generic [ref=e472]:
              - generic [ref=e473]: s
              - generic [ref=e474]: a
              - generic [ref=e475]: v
              - generic [ref=e476]: e
            - generic [ref=e478]:
              - generic [ref=e479]: "y"
              - generic [ref=e480]: e
              - generic [ref=e481]: a
              - generic [ref=e482]: r
            - generic [ref=e484]:
              - generic [ref=e485]: "n"
              - generic [ref=e486]: e
              - generic [ref=e487]: o
              - generic [ref=e488]: "n"
            - generic [ref=e490]:
              - generic [ref=e491]: j
              - generic [ref=e492]: u
              - generic [ref=e493]: s
              - generic [ref=e494]: t
            - generic [ref=e496]:
              - generic [ref=e497]: p
              - generic [ref=e498]: l
              - generic [ref=e499]: a
              - generic [ref=e500]: "y"
            - generic [ref=e502]:
              - generic [ref=e503]: h
              - generic [ref=e504]: e
              - generic [ref=e505]: a
              - generic [ref=e506]: r
              - generic [ref=e507]: t
            - generic [ref=e509]:
              - generic [ref=e510]: t
              - generic [ref=e511]: h
              - generic [ref=e512]: o
              - generic [ref=e513]: s
              - generic [ref=e514]: e
            - generic [ref=e516]:
              - generic [ref=e517]: r
              - generic [ref=e518]: o
              - generic [ref=e519]: u
              - generic [ref=e520]: "n"
              - generic [ref=e521]: d
            - generic [ref=e523]:
              - generic [ref=e524]: s
              - generic [ref=e525]: u
              - generic [ref=e526]: m
              - generic [ref=e527]: m
              - generic [ref=e528]: e
              - generic [ref=e529]: r
            - generic [ref=e531]:
              - generic [ref=e532]: t
              - generic [ref=e533]: h
              - generic [ref=e534]: e
              - generic [ref=e535]: "n"
            - generic [ref=e537]:
              - generic [ref=e538]: f
              - generic [ref=e539]: o
              - generic [ref=e540]: o
              - generic [ref=e541]: d
            - generic [ref=e543]:
              - generic [ref=e544]: "n"
              - generic [ref=e545]: a
              - generic [ref=e546]: t
              - generic [ref=e547]: i
              - generic [ref=e548]: o
              - generic [ref=e549]: "n"
            - generic [ref=e551]:
              - generic [ref=e552]: w
              - generic [ref=e553]: e
              - generic [ref=e554]: l
              - generic [ref=e555]: l
            - generic [ref=e557]:
              - generic [ref=e558]: s
              - generic [ref=e559]: p
              - generic [ref=e560]: a
              - generic [ref=e561]: c
              - generic [ref=e562]: e
            - generic [ref=e564]:
              - generic [ref=e565]: r
              - generic [ref=e566]: a
              - generic [ref=e567]: t
              - generic [ref=e568]: e
            - generic [ref=e570]:
              - generic [ref=e571]: s
              - generic [ref=e572]: e
              - generic [ref=e573]: v
              - generic [ref=e574]: e
              - generic [ref=e575]: "n"
            - generic [ref=e577]:
              - generic [ref=e578]: "n"
              - generic [ref=e579]: o
              - generic [ref=e580]: w
            - generic [ref=e582]:
              - generic [ref=e583]: "n"
              - generic [ref=e584]: e
              - generic [ref=e585]: a
              - generic [ref=e586]: t
            - generic [ref=e588]:
              - generic [ref=e589]: g
              - generic [ref=e590]: u
              - generic [ref=e591]: i
              - generic [ref=e592]: d
              - generic [ref=e593]: e
            - generic [ref=e595]:
              - generic [ref=e596]: t
              - generic [ref=e597]: o
              - generic [ref=e598]: g
              - generic [ref=e599]: e
              - generic [ref=e600]: t
              - generic [ref=e601]: h
              - generic [ref=e602]: e
              - generic [ref=e603]: r
            - generic [ref=e605]:
              - generic [ref=e606]: t
              - generic [ref=e607]: e
              - generic [ref=e608]: a
              - generic [ref=e609]: m
            - generic [ref=e611]:
              - generic [ref=e612]: g
              - generic [ref=e613]: a
              - generic [ref=e614]: m
              - generic [ref=e615]: e
            - generic [ref=e617]:
              - generic [ref=e618]: o
              - generic [ref=e619]: t
              - generic [ref=e620]: h
              - generic [ref=e621]: e
              - generic [ref=e622]: r
            - generic [ref=e624]:
              - generic [ref=e625]: f
              - generic [ref=e626]: o
              - generic [ref=e627]: r
            - generic [ref=e629]:
              - generic [ref=e630]: s
              - generic [ref=e631]: e
              - generic [ref=e632]: v
              - generic [ref=e633]: e
              - generic [ref=e634]: "n"
            - generic [ref=e636]:
              - generic [ref=e637]: s
              - generic [ref=e638]: e
              - generic [ref=e639]: a
            - generic [ref=e641]:
              - generic [ref=e642]: d
              - generic [ref=e643]: r
              - generic [ref=e644]: a
              - generic [ref=e645]: w
            - generic [ref=e647]:
              - generic [ref=e648]: s
              - generic [ref=e649]: t
              - generic [ref=e650]: o
              - generic [ref=e651]: r
              - generic [ref=e652]: e
            - generic [ref=e654]:
              - generic [ref=e655]: s
              - generic [ref=e656]: a
              - generic [ref=e657]: "n"
              - generic [ref=e658]: e
            - generic [ref=e660]:
              - generic [ref=e661]: s
              - generic [ref=e662]: "n"
              - generic [ref=e663]: o
              - generic [ref=e664]: w
            - generic [ref=e666]:
              - generic [ref=e667]: t
              - generic [ref=e668]: i
              - generic [ref=e669]: e
            - generic [ref=e671]:
              - generic [ref=e672]: s
              - generic [ref=e673]: t
              - generic [ref=e674]: o
              - generic [ref=e675]: p
            - generic [ref=e677]:
              - generic [ref=e678]: r
              - generic [ref=e679]: a
              - generic [ref=e680]: c
              - generic [ref=e681]: e
            - generic [ref=e683]:
              - generic [ref=e684]: t
              - generic [ref=e685]: e
              - generic [ref=e686]: a
              - generic [ref=e687]: r
            - generic [ref=e689]:
              - generic [ref=e690]: h
              - generic [ref=e691]: o
              - generic [ref=e692]: u
              - generic [ref=e693]: s
              - generic [ref=e694]: e
            - generic [ref=e696]:
              - generic [ref=e697]: s
              - generic [ref=e698]: u
              - generic [ref=e699]: m
              - generic [ref=e700]: m
              - generic [ref=e701]: e
              - generic [ref=e702]: r
            - generic [ref=e704]:
              - generic [ref=e705]: t
              - generic [ref=e706]: i
              - generic [ref=e707]: e
              - generic [ref=e708]: r
            - generic [ref=e710]:
              - generic [ref=e711]: w
              - generic [ref=e712]: i
              - generic [ref=e713]: "n"
              - generic [ref=e714]: d
              - generic [ref=e715]: o
              - generic [ref=e716]: w
            - generic [ref=e718]:
              - generic [ref=e719]: w
              - generic [ref=e720]: i
              - generic [ref=e721]: d
              - generic [ref=e722]: e
            - generic [ref=e724]:
              - generic [ref=e725]: o
              - generic [ref=e726]: "n"
            - generic [ref=e728]:
              - generic [ref=e729]: s
              - generic [ref=e730]: o
            - generic [ref=e732]:
              - generic [ref=e733]: h
              - generic [ref=e734]: i
              - generic [ref=e735]: g
              - generic [ref=e736]: h
            - generic [ref=e738]:
              - generic [ref=e739]: s
              - generic [ref=e740]: o
              - generic [ref=e741]: f
              - generic [ref=e742]: t
            - generic [ref=e744]:
              - generic [ref=e745]: d
              - generic [ref=e746]: o
              - generic [ref=e747]: w
              - generic [ref=e748]: "n"
            - generic [ref=e750]:
              - generic [ref=e751]: h
              - generic [ref=e752]: e
              - generic [ref=e753]: a
              - generic [ref=e754]: r
              - generic [ref=e755]: t
          - paragraph [ref=e756]: "Practice passage: in full far great you let warm park study each retain spring shape later with here root near room close how smile hill move lean love where his a book arise power game turn shore early yes over care slow later point deep i stand let an up tree code test made so so these save year neon just play heart those round summer then food nation well space rate seven now neat guide together team game other for seven sea draw store sane snow tie stop race tear house summer tier window wide on so high soft down heart"
          - textbox "Typing input" [active] [ref=e757]
        - generic [ref=e759]:
          - paragraph [ref=e760]: Type the text above. Wrong letters stay visible; Backspace corrects.
          - status [ref=e761]
        - generic [ref=e762]:
          - paragraph [ref=e763]: Shared clock · Ctrl+Enter finishes · Tab → Enter restarts
          - generic [ref=e764]:
            - button "Restart with new text" [ref=e765]
            - button "Show accessible text editor" [ref=e769]
            - button "Finish" [ref=e773]
        - status [ref=e777]: Test running
  - contentinfo [ref=e778]:
    - generic [ref=e779]:
      - generic [ref=e780]: A little practice. Lasting progress.
      - generic [ref=e791]:
        - link "About & metrics" [ref=e792] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e793] [cursor=pointer]:
          - /url: /settings
        - generic [ref=e794]: Typing Forge © 2026
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