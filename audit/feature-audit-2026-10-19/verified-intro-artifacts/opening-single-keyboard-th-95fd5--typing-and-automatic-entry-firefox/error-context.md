# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-single-keyboard.spec.ts >> the normal-clock production worker shows the creative 3D keyboard through wordmark typing and automatic entry
- Location: e2e\opening-single-keyboard.spec.ts:240:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
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
      - navigation "Main navigation" [ref=e12]:
        - link "Test" [ref=e13] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=e24] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=e29] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=e39] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=e45] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e53] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=e64]:
        - button "Switch to light theme" [ref=e65]
        - button "Open command palette" [ref=e76]
        - link "Settings" [ref=e79] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=e85] [cursor=pointer]:
          - /url: /auth
  - main [ref=e90]:
    - heading "Typing practice" [level=1] [ref=e91]
    - region "Test configuration" [ref=e92]:
      - generic [ref=e93]:
        - group "Test mode" [ref=e94]:
          - button "Time" [pressed] [ref=e95]
          - button "Words" [ref=e99]
          - button "Quote" [ref=e104]
          - button "Code" [ref=e108]
          - button "Custom" [ref=e113]
          - button "Zen" [ref=e120]
        - group "Test duration" [ref=e127]:
          - button "15 seconds" [ref=e128]:
            - text: "15"
            - generic [ref=e129]: seconds
          - button "30 seconds" [pressed] [ref=e130]:
            - text: "30"
            - generic [ref=e131]: seconds
          - button "60 seconds" [ref=e132]:
            - text: "60"
            - generic [ref=e133]: seconds
          - button "120 seconds" [ref=e134]:
            - text: "120"
            - generic [ref=e135]: seconds
      - generic [ref=e136]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e137]:
          - checkbox "Precision mode · stop on errors" [ref=e138]
          - text: Precision mode · stop on errors
        - generic [ref=e139]:
          - text: Language
          - combobox "Language" [ref=e140]:
            - option "English" [selected]
            - option "Español"
            - option "Français"
            - option "Deutsch"
            - option "Português"
            - option "Italiano"
            - option "Русский"
            - option "हिन्दी"
            - option "العربية"
            - option "Gujarati transliteration (Latin)"
        - button "punctuation" [ref=e142]
        - button "# numbers" [ref=e146]
    - region "Typing session" [ref=e147]:
      - generic [ref=e148]:
        - generic [ref=e149]:
          - generic [ref=e150]:
            - generic [ref=e151]: 30s
            - generic [ref=e152]: remaining
          - generic [ref=e153]: —wpm
          - generic [ref=e154]: —acc %
        - generic [ref=e155]: Ready when you are
      - generic [ref=e157]:
        - generic [ref=e159]:
          - generic [ref=e160]:
            - generic [ref=e161]: j
            - generic [ref=e162]: o
            - generic [ref=e163]: "y"
          - generic [ref=e165]:
            - generic [ref=e166]: h
            - generic [ref=e167]: i
            - generic [ref=e168]: l
            - generic [ref=e169]: l
          - generic [ref=e171]:
            - generic [ref=e172]: t
            - generic [ref=e173]: o
            - generic [ref=e174]: e
          - generic [ref=e176]:
            - generic [ref=e177]: q
            - generic [ref=e178]: u
            - generic [ref=e179]: e
            - generic [ref=e180]: s
            - generic [ref=e181]: t
            - generic [ref=e182]: i
            - generic [ref=e183]: o
            - generic [ref=e184]: "n"
          - generic [ref=e186]:
            - generic [ref=e187]: s
            - generic [ref=e188]: o
            - generic [ref=e189]: r
            - generic [ref=e190]: t
          - generic [ref=e192]:
            - generic [ref=e193]: o
            - generic [ref=e194]: u
            - generic [ref=e195]: r
          - generic [ref=e197]:
            - generic [ref=e198]: t
            - generic [ref=e199]: i
            - generic [ref=e200]: e
          - generic [ref=e202]:
            - generic [ref=e203]: s
            - generic [ref=e204]: k
            - generic [ref=e205]: "y"
          - generic [ref=e207]:
            - generic [ref=e208]: r
            - generic [ref=e209]: a
            - generic [ref=e210]: c
            - generic [ref=e211]: e
          - generic [ref=e213]:
            - generic [ref=e214]: r
            - generic [ref=e215]: o
            - generic [ref=e216]: u
            - generic [ref=e217]: "n"
            - generic [ref=e218]: d
          - generic [ref=e220]:
            - generic [ref=e221]: e
            - generic [ref=e222]: v
            - generic [ref=e223]: e
            - generic [ref=e224]: "n"
          - generic [ref=e226]:
            - generic [ref=e227]: s
            - generic [ref=e228]: e
            - generic [ref=e229]: e
            - generic [ref=e230]: d
          - generic [ref=e232]:
            - generic [ref=e233]: o
            - generic [ref=e234]: r
          - generic [ref=e236]:
            - generic [ref=e237]: f
            - generic [ref=e238]: e
            - generic [ref=e239]: e
            - generic [ref=e240]: l
          - generic [ref=e242]:
            - generic [ref=e243]: l
            - generic [ref=e244]: e
            - generic [ref=e245]: a
            - generic [ref=e246]: "n"
          - generic [ref=e248]:
            - generic [ref=e249]: t
            - generic [ref=e250]: o
            - generic [ref=e251]: e
          - generic [ref=e253]:
            - generic [ref=e254]: s
            - generic [ref=e255]: p
            - generic [ref=e256]: r
            - generic [ref=e257]: i
            - generic [ref=e258]: "n"
            - generic [ref=e259]: g
          - generic [ref=e261]:
            - generic [ref=e262]: "n"
            - generic [ref=e263]: e
            - generic [ref=e264]: o
            - generic [ref=e265]: "n"
          - generic [ref=e267]:
            - generic [ref=e268]: q
            - generic [ref=e269]: u
            - generic [ref=e270]: e
            - generic [ref=e271]: e
            - generic [ref=e272]: "n"
          - generic [ref=e274]:
            - generic [ref=e275]: w
            - generic [ref=e276]: h
            - generic [ref=e277]: a
            - generic [ref=e278]: t
          - generic [ref=e280]:
            - generic [ref=e281]: h
            - generic [ref=e282]: o
            - generic [ref=e283]: l
            - generic [ref=e284]: d
          - generic [ref=e286]:
            - generic [ref=e287]: a
            - generic [ref=e288]: "n"
            - generic [ref=e289]: t
          - generic [ref=e291]:
            - generic [ref=e292]: s
            - generic [ref=e293]: e
            - generic [ref=e294]: "n"
            - generic [ref=e295]: t
          - generic [ref=e297]:
            - generic [ref=e298]: j
            - generic [ref=e299]: o
            - generic [ref=e300]: "y"
          - generic [ref=e302]:
            - generic [ref=e303]: s
            - generic [ref=e304]: a
            - generic [ref=e305]: "n"
            - generic [ref=e306]: e
          - generic [ref=e308]:
            - generic [ref=e309]: t
            - generic [ref=e310]: h
            - generic [ref=e311]: r
            - generic [ref=e312]: o
            - generic [ref=e313]: u
            - generic [ref=e314]: g
            - generic [ref=e315]: h
          - generic [ref=e317]:
            - generic [ref=e318]: m
            - generic [ref=e319]: u
            - generic [ref=e320]: s
            - generic [ref=e321]: t
          - generic [ref=e323]:
            - generic [ref=e324]: t
            - generic [ref=e325]: o
            - generic [ref=e326]: "n"
          - generic [ref=e328]:
            - generic [ref=e329]: s
            - generic [ref=e330]: e
            - generic [ref=e331]: a
            - generic [ref=e332]: t
          - generic [ref=e334]:
            - generic [ref=e335]: t
            - generic [ref=e336]: e
            - generic [ref=e337]: l
            - generic [ref=e338]: l
          - generic [ref=e340]:
            - generic [ref=e341]: c
            - generic [ref=e342]: l
            - generic [ref=e343]: o
            - generic [ref=e344]: s
            - generic [ref=e345]: e
          - generic [ref=e347]:
            - generic [ref=e348]: b
            - generic [ref=e349]: u
            - generic [ref=e350]: i
            - generic [ref=e351]: l
            - generic [ref=e352]: d
          - generic [ref=e354]:
            - generic [ref=e355]: m
            - generic [ref=e356]: a
            - generic [ref=e357]: k
            - generic [ref=e358]: e
          - generic [ref=e360]:
            - generic [ref=e361]: s
            - generic [ref=e362]: e
            - generic [ref=e363]: a
            - generic [ref=e364]: t
          - generic [ref=e366]:
            - generic [ref=e367]: h
            - generic [ref=e368]: a
            - generic [ref=e369]: s
          - generic [ref=e371]:
            - generic [ref=e372]: f
            - generic [ref=e373]: r
            - generic [ref=e374]: e
            - generic [ref=e375]: e
          - generic [ref=e377]:
            - generic [ref=e378]: i
            - generic [ref=e379]: f
          - generic [ref=e381]:
            - generic [ref=e382]: v
            - generic [ref=e383]: o
            - generic [ref=e384]: i
            - generic [ref=e385]: c
            - generic [ref=e386]: e
          - generic [ref=e388]:
            - generic [ref=e389]: p
            - generic [ref=e390]: a
            - generic [ref=e391]: p
            - generic [ref=e392]: e
            - generic [ref=e393]: r
          - generic [ref=e395]:
            - generic [ref=e396]: s
            - generic [ref=e397]: e
            - generic [ref=e398]: e
            - generic [ref=e399]: "n"
          - generic [ref=e401]:
            - generic [ref=e402]: w
            - generic [ref=e403]: a
            - generic [ref=e404]: i
            - generic [ref=e405]: t
          - generic [ref=e407]:
            - generic [ref=e408]: s
            - generic [ref=e409]: k
            - generic [ref=e410]: "y"
          - generic [ref=e412]:
            - generic [ref=e413]: m
            - generic [ref=e414]: e
            - generic [ref=e415]: e
            - generic [ref=e416]: t
          - generic [ref=e418]:
            - generic [ref=e419]: b
            - generic [ref=e420]: l
            - generic [ref=e421]: u
            - generic [ref=e422]: e
          - generic [ref=e424]:
            - generic [ref=e425]: "y"
            - generic [ref=e426]: o
            - generic [ref=e427]: u
          - generic [ref=e429]:
            - generic [ref=e430]: g
            - generic [ref=e431]: a
            - generic [ref=e432]: m
            - generic [ref=e433]: e
          - generic [ref=e435]:
            - generic [ref=e436]: a
            - generic [ref=e437]: t
            - generic [ref=e438]: t
            - generic [ref=e439]: e
            - generic [ref=e440]: "n"
            - generic [ref=e441]: t
            - generic [ref=e442]: i
            - generic [ref=e443]: o
            - generic [ref=e444]: "n"
          - generic [ref=e446]:
            - generic [ref=e447]: t
            - generic [ref=e448]: h
            - generic [ref=e449]: a
            - generic [ref=e450]: "n"
            - generic [ref=e451]: k
          - generic [ref=e453]:
            - generic [ref=e454]: g
            - generic [ref=e455]: r
            - generic [ref=e456]: o
            - generic [ref=e457]: u
            - generic [ref=e458]: "n"
            - generic [ref=e459]: d
          - generic [ref=e461]:
            - generic [ref=e462]: f
            - generic [ref=e463]: a
            - generic [ref=e464]: s
            - generic [ref=e465]: t
          - generic [ref=e467]:
            - generic [ref=e468]: s
            - generic [ref=e469]: h
            - generic [ref=e470]: o
            - generic [ref=e471]: w
          - generic [ref=e473]:
            - generic [ref=e474]: l
            - generic [ref=e475]: e
            - generic [ref=e476]: t
          - generic [ref=e478]:
            - generic [ref=e479]: s
            - generic [ref=e480]: p
            - generic [ref=e481]: e
            - generic [ref=e482]: e
            - generic [ref=e483]: d
          - generic [ref=e485]:
            - generic [ref=e486]: w
            - generic [ref=e487]: h
            - generic [ref=e488]: a
            - generic [ref=e489]: t
          - generic [ref=e491]:
            - generic [ref=e492]: h
            - generic [ref=e493]: o
            - generic [ref=e494]: u
            - generic [ref=e495]: s
            - generic [ref=e496]: e
          - generic [ref=e498]:
            - generic [ref=e499]: l
            - generic [ref=e500]: a
            - generic [ref=e501]: t
            - generic [ref=e502]: e
          - generic [ref=e504]:
            - generic [ref=e505]: g
            - generic [ref=e506]: o
          - generic [ref=e508]:
            - generic [ref=e509]: h
            - generic [ref=e510]: e
            - generic [ref=e511]: l
            - generic [ref=e512]: p
          - generic [ref=e514]:
            - generic [ref=e515]: c
            - generic [ref=e516]: o
            - generic [ref=e517]: l
            - generic [ref=e518]: d
          - generic [ref=e520]:
            - generic [ref=e521]: l
            - generic [ref=e522]: o
            - generic [ref=e523]: o
            - generic [ref=e524]: k
          - generic [ref=e526]:
            - generic [ref=e527]: p
            - generic [ref=e528]: a
            - generic [ref=e529]: p
            - generic [ref=e530]: e
            - generic [ref=e531]: r
          - generic [ref=e533]:
            - generic [ref=e534]: h
            - generic [ref=e535]: o
            - generic [ref=e536]: w
          - generic [ref=e538]:
            - generic [ref=e539]: p
            - generic [ref=e540]: l
            - generic [ref=e541]: a
            - generic [ref=e542]: i
            - generic [ref=e543]: "n"
          - generic [ref=e545]:
            - generic [ref=e546]: t
            - generic [ref=e547]: e
            - generic [ref=e548]: s
            - generic [ref=e549]: t
          - generic [ref=e551]:
            - generic [ref=e552]: e
            - generic [ref=e553]: v
            - generic [ref=e554]: e
            - generic [ref=e555]: "n"
          - generic [ref=e557]:
            - generic [ref=e558]: w
            - generic [ref=e559]: i
            - generic [ref=e560]: "n"
            - generic [ref=e561]: d
            - generic [ref=e562]: o
            - generic [ref=e563]: w
          - generic [ref=e565]:
            - generic [ref=e566]: b
            - generic [ref=e567]: l
            - generic [ref=e568]: a
            - generic [ref=e569]: c
            - generic [ref=e570]: k
          - generic [ref=e572]:
            - generic [ref=e573]: e
            - generic [ref=e574]: "n"
            - generic [ref=e575]: d
          - generic [ref=e577]:
            - generic [ref=e578]: h
            - generic [ref=e579]: e
            - generic [ref=e580]: l
            - generic [ref=e581]: p
          - generic [ref=e583]:
            - generic [ref=e584]: "n"
            - generic [ref=e585]: a
            - generic [ref=e586]: t
            - generic [ref=e587]: i
            - generic [ref=e588]: o
            - generic [ref=e589]: "n"
          - generic [ref=e591]:
            - generic [ref=e592]: q
            - generic [ref=e593]: u
            - generic [ref=e594]: e
            - generic [ref=e595]: e
            - generic [ref=e596]: "n"
          - generic [ref=e598]:
            - generic [ref=e599]: p
            - generic [ref=e600]: l
            - generic [ref=e601]: a
            - generic [ref=e602]: "y"
          - generic [ref=e604]:
            - generic [ref=e605]: i
            - generic [ref=e606]: f
          - generic [ref=e608]:
            - generic [ref=e609]: r
            - generic [ref=e610]: e
            - generic [ref=e611]: d
          - generic [ref=e613]:
            - generic [ref=e614]: m
            - generic [ref=e615]: a
            - generic [ref=e616]: "y"
          - generic [ref=e618]:
            - generic [ref=e619]: "n"
            - generic [ref=e620]: e
            - generic [ref=e621]: v
            - generic [ref=e622]: e
            - generic [ref=e623]: r
          - generic [ref=e625]:
            - generic [ref=e626]: f
            - generic [ref=e627]: i
            - generic [ref=e628]: r
            - generic [ref=e629]: s
            - generic [ref=e630]: t
          - generic [ref=e632]:
            - generic [ref=e633]: f
            - generic [ref=e634]: o
            - generic [ref=e635]: r
          - generic [ref=e637]:
            - generic [ref=e638]: s
            - generic [ref=e639]: i
            - generic [ref=e640]: d
            - generic [ref=e641]: e
          - generic [ref=e643]:
            - generic [ref=e644]: t
            - generic [ref=e645]: e
            - generic [ref=e646]: s
            - generic [ref=e647]: t
          - generic [ref=e649]:
            - generic [ref=e650]: d
            - generic [ref=e651]: r
            - generic [ref=e652]: a
            - generic [ref=e653]: w
          - generic [ref=e655]:
            - generic [ref=e656]: r
            - generic [ref=e657]: a
            - generic [ref=e658]: c
            - generic [ref=e659]: e
          - generic [ref=e661]:
            - generic [ref=e662]: e
            - generic [ref=e663]: a
            - generic [ref=e664]: r
            - generic [ref=e665]: t
            - generic [ref=e666]: h
          - generic [ref=e668]:
            - generic [ref=e669]: s
            - generic [ref=e670]: e
            - generic [ref=e671]: "n"
            - generic [ref=e672]: t
          - generic [ref=e674]:
            - generic [ref=e675]: o
            - generic [ref=e676]: "n"
            - generic [ref=e677]: i
            - generic [ref=e678]: o
            - generic [ref=e679]: "n"
          - generic [ref=e681]:
            - generic [ref=e682]: b
            - generic [ref=e683]: r
            - generic [ref=e684]: o
            - generic [ref=e685]: w
            - generic [ref=e686]: "n"
          - generic [ref=e688]:
            - generic [ref=e689]: g
            - generic [ref=e690]: i
            - generic [ref=e691]: v
            - generic [ref=e692]: e
          - generic [ref=e694]:
            - generic [ref=e695]: o
            - generic [ref=e696]: f
            - generic [ref=e697]: t
            - generic [ref=e698]: e
            - generic [ref=e699]: "n"
          - generic [ref=e701]:
            - generic [ref=e702]: e
            - generic [ref=e703]: a
            - generic [ref=e704]: s
            - generic [ref=e705]: e
          - generic [ref=e707]:
            - generic [ref=e708]: t
            - generic [ref=e709]: h
            - generic [ref=e710]: e
            - generic [ref=e711]: i
            - generic [ref=e712]: r
          - generic [ref=e714]:
            - generic [ref=e715]: h
            - generic [ref=e716]: e
            - generic [ref=e717]: r
          - generic [ref=e719]:
            - generic [ref=e720]: k
            - generic [ref=e721]: "n"
            - generic [ref=e722]: o
            - generic [ref=e723]: w
          - generic [ref=e725]:
            - generic [ref=e726]: q
            - generic [ref=e727]: u
            - generic [ref=e728]: i
            - generic [ref=e729]: t
            - generic [ref=e730]: e
          - generic [ref=e732]:
            - generic [ref=e733]: e
            - generic [ref=e734]: a
            - generic [ref=e735]: s
            - generic [ref=e736]: e
          - generic [ref=e738]:
            - generic [ref=e739]: a
            - generic [ref=e740]: "n"
            - generic [ref=e741]: t
          - generic [ref=e743]:
            - generic [ref=e744]: s
            - generic [ref=e745]: o
          - generic [ref=e747]:
            - generic [ref=e748]: p
            - generic [ref=e749]: o
            - generic [ref=e750]: w
            - generic [ref=e751]: e
            - generic [ref=e752]: r
          - generic [ref=e754]:
            - generic [ref=e755]: i
            - generic [ref=e756]: "n"
            - generic [ref=e757]: t
            - generic [ref=e758]: o
          - generic [ref=e760]:
            - generic [ref=e761]: g
            - generic [ref=e762]: l
            - generic [ref=e763]: a
            - generic [ref=e764]: s
            - generic [ref=e765]: s
          - generic [ref=e767]:
            - generic [ref=e768]: g
            - generic [ref=e769]: r
            - generic [ref=e770]: o
            - generic [ref=e771]: w
          - generic [ref=e773]:
            - generic [ref=e774]: a
            - generic [ref=e775]: i
            - generic [ref=e776]: r
          - generic [ref=e778]:
            - generic [ref=e779]: s
            - generic [ref=e780]: t
            - generic [ref=e781]: a
            - generic [ref=e782]: r
            - generic [ref=e783]: t
          - generic [ref=e785]:
            - generic [ref=e786]: p
            - generic [ref=e787]: e
            - generic [ref=e788]: o
            - generic [ref=e789]: p
            - generic [ref=e790]: l
            - generic [ref=e791]: e
          - generic [ref=e793]:
            - generic [ref=e794]: t
            - generic [ref=e795]: i
            - generic [ref=e796]: e
            - generic [ref=e797]: r
          - generic [ref=e799]:
            - generic [ref=e800]: p
            - generic [ref=e801]: o
            - generic [ref=e802]: e
            - generic [ref=e803]: m
          - generic [ref=e805]:
            - generic [ref=e806]: s
            - generic [ref=e807]: u
            - generic [ref=e808]: "n"
          - generic [ref=e810]:
            - generic [ref=e811]: o
            - generic [ref=e812]: p
            - generic [ref=e813]: e
            - generic [ref=e814]: "n"
          - generic [ref=e816]:
            - generic [ref=e817]: "n"
            - generic [ref=e818]: u
            - generic [ref=e819]: m
            - generic [ref=e820]: b
            - generic [ref=e821]: e
            - generic [ref=e822]: r
          - generic [ref=e824]:
            - generic [ref=e825]: w
            - generic [ref=e826]: h
            - generic [ref=e827]: o
          - generic [ref=e829]:
            - generic [ref=e830]: c
            - generic [ref=e831]: o
            - generic [ref=e832]: m
            - generic [ref=e833]: e
          - generic [ref=e835]:
            - generic [ref=e836]: m
            - generic [ref=e837]: e
            - generic [ref=e838]: e
            - generic [ref=e839]: t
          - generic [ref=e841]:
            - generic [ref=e842]: s
            - generic [ref=e843]: h
            - generic [ref=e844]: i
            - generic [ref=e845]: "n"
            - generic [ref=e846]: e
          - generic [ref=e848]:
            - generic [ref=e849]: k
            - generic [ref=e850]: "n"
            - generic [ref=e851]: o
            - generic [ref=e852]: w
          - generic [ref=e854]:
            - generic [ref=e855]: b
            - generic [ref=e856]: u
            - generic [ref=e857]: i
            - generic [ref=e858]: l
            - generic [ref=e859]: d
          - generic [ref=e861]:
            - generic [ref=e862]: t
            - generic [ref=e863]: h
            - generic [ref=e864]: r
            - generic [ref=e865]: o
            - generic [ref=e866]: u
            - generic [ref=e867]: g
            - generic [ref=e868]: h
          - generic [ref=e870]:
            - generic [ref=e871]: l
            - generic [ref=e872]: i
            - generic [ref=e873]: "n"
            - generic [ref=e874]: e
          - generic [ref=e876]:
            - generic [ref=e877]: t
            - generic [ref=e878]: h
            - generic [ref=e879]: a
            - generic [ref=e880]: t
          - generic [ref=e882]:
            - generic [ref=e883]: b
            - generic [ref=e884]: r
            - generic [ref=e885]: i
            - generic [ref=e886]: "n"
            - generic [ref=e887]: g
          - generic [ref=e889]:
            - generic [ref=e890]: s
            - generic [ref=e891]: e
            - generic [ref=e892]: "n"
            - generic [ref=e893]: t
          - generic [ref=e895]:
            - generic [ref=e896]: f
            - generic [ref=e897]: e
            - generic [ref=e898]: w
        - paragraph [ref=e899]: "Practice passage: joy hill toe question sort our tie sky race round even seed or feel lean toe spring neon queen what hold ant sent joy sane through must ton seat tell close build make seat has free if voice paper seen wait sky meet blue you game attention thank ground fast show let speed what house late go help cold look paper how plain test even window black end help nation queen play if red may never first for side test draw race earth sent onion brown give often ease their her know quite ease ant so power into glass grow air start people tier poem sun open number who come meet shine know build through line that bring sent few"
        - textbox "Typing input" [active] [ref=e900]
      - generic [ref=e902]:
        - paragraph [ref=e903]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e904]
      - generic [ref=e905]:
        - paragraph [ref=e906]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
        - generic [ref=e907]:
          - button "Restart with new text" [ref=e908]
          - button "Show accessible text editor" [ref=e912]
          - button "Finish" [disabled] [ref=e916]
      - status [ref=e920]: Ready to type
  - contentinfo [ref=e921]:
    - generic [ref=e922]:
      - generic [ref=e923]:
        - generic [ref=e924]:
          - generic [ref=e925]: Sparow
          - generic [ref=e926]: Type
        - text: Find your rhythm.
      - generic [ref=e927]:
        - link "About & metrics" [ref=e928] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e929] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e930] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e931] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e932] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e933] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e934]: SparowType © 2026
```

# Test source

```ts
  283 |         if (receipt.startedAt !== null) {
  284 |           receipt.closedAt = performance.now();
  285 |           observer.disconnect();
  286 |         }
  287 |         return;
  288 |       }
  289 |       if (
  290 |         receipt.startedAt === null &&
  291 |         opening.getAttribute("data-mode") === "full" &&
  292 |         opening.getAttribute("data-presentation") === "playing"
  293 |       ) {
  294 |         receipt.startedAt = performance.now();
  295 |         window.setTimeout(() => {
  296 |           const current = document.querySelector(
  297 |             '[data-testid="opening-experience"]',
  298 |           );
  299 |           receipt.after2700 = {
  300 |             playing: current?.getAttribute("data-presentation") === "playing",
  301 |             closing: current?.getAttribute("data-closing") === "true",
  302 |             text:
  303 |               current?.querySelector(".awakening-title-typed")?.textContent ||
  304 |               "",
  305 |           };
  306 |         }, 2705);
  307 |       }
  308 |       if (receipt.startedAt === null) return;
  309 |       const text = opening.querySelector(".awakening-title-typed")?.textContent;
  310 |       if (text && text !== receipt.words.at(-1)?.text) {
  311 |         receipt.words.push({ text, atMs: performance.now() });
  312 |         if (text === "SparowType") {
  313 |           receipt.completedAt = performance.now();
  314 |           receipt.completedWhileOpen = opening.getAttribute('data-closing') === 'false';
  315 |         }
  316 |       }
  317 |     });
  318 |     observer.observe(document, {
  319 |       subtree: true,
  320 |       childList: true,
  321 |       characterData: true,
  322 |       attributes: true,
  323 |       attributeFilter: ["data-presentation", "data-closing"],
  324 |     });
  325 |   });
  326 |   const receipt = () =>
  327 |     page.evaluate(
  328 |       () =>
  329 |         (
  330 |           window as Window & {
  331 |             nativeKeyboardPresentation: NativePresentationReceipt;
  332 |           }
  333 |         ).nativeKeyboardPresentation,
  334 |     );
  335 |   try {
  336 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  337 |     const opening = page.getByTestId("opening-experience");
  338 |     await expect(opening).toHaveAttribute("data-mode", "full");
  339 |     await expect(opening).toHaveAttribute("data-presentation", "playing", {
  340 |       timeout: 7000,
  341 |     });
  342 |     await expect(opening).toHaveAttribute("data-renderer", "webgl");
  343 |     const diagnostics: KeyboardSceneDiagnostics = JSON.parse(
  344 |       (await opening.locator(".awakening-canvas").getAttribute("data-scene"))!,
  345 |     );
  346 |     expect(diagnostics).toMatchObject({
  347 |       renderer: "webgl2",
  348 |       thread: "worker",
  349 |       keyCount: 61,
  350 |       keycapMeshes: 1,
  351 |       tier: "desktop",
  352 |       bloom: true,
  353 |       environment: true,
  354 |       environmentIntensity: 0.35,
  355 |       degraded: false,
  356 |       contextLost: false,
  357 |       disposed: false,
  358 |     });
  359 |     expect(diagnostics.frames).toBeGreaterThan(0);
  360 |     expect(diagnostics.drawCalls).toBeGreaterThan(0);
  361 |     expect(diagnostics.cameraElevationDegrees).toBeGreaterThanOrEqual(28);
  362 |     expect(diagnostics.cameraElevationDegrees).toBeLessThanOrEqual(42);
  363 |     expect(
  364 |       page
  365 |         .workers()
  366 |         .some((worker) => /keyboard-render[.-]worker/.test(worker.url())),
  367 |     ).toBe(true);
  368 |     await expect(opening.locator(".awakening-fallback")).toHaveCSS(
  369 |       "visibility",
  370 |       "hidden",
  371 |     );
  372 |     await expect.poll(async () => (await receipt()).after2700).not.toBeNull();
  373 |     expect((await receipt()).after2700).toMatchObject({
  374 |       playing: true,
  375 |       closing: false,
  376 |     });
  377 |     await page.screenshot({
  378 |       path: info.outputPath("native-3d-wordmark-typing.png"),
  379 |     });
  380 |     // Capture the actual DOM milestone inside the browser. A screenshot/RPC can
  381 |     // consume the remaining presentation time on a busy host without a product defect.
  382 |     await expect.poll(async () => (await receipt()).completedAt).not.toBeNull();
> 383 |     expect((await receipt()).completedWhileOpen).toBe(true);
      |                                                  ^ Error: expect(received).toBe(expected) // Object.is equality
  384 |     if (await opening.count()) {
  385 |       await page.screenshot({ path: info.outputPath("native-3d-complete-wordmark.png") });
  386 |     }
  387 |     await expect(opening).toHaveCount(0);
  388 |     const observed = await receipt();
  389 |     expect(observed.startedAt).not.toBeNull();
  390 |     expect(observed.completedAt).not.toBeNull();
  391 |     expect(observed.closedAt).not.toBeNull();
  392 |     expect(observed.words[0].text).toBe("S");
  393 |     expect(observed.words.at(-1)?.text).toBe("SparowType");
  394 |     expect(observed.completedAt! - observed.startedAt!).toBeGreaterThan(2700);
  395 |     expect(observed.closedAt! - observed.startedAt!).toBeGreaterThan(4000);
  396 |     const input = page.getByRole("textbox", {
  397 |       name: "Typing input",
  398 |       exact: true,
  399 |     });
  400 |     await expect(input).toBeVisible();
  401 |     await expect(input).toHaveValue("");
  402 |     await input.pressSequentially("x");
  403 |     await expect(input).toHaveValue("x");
  404 |     await info.attach("native-full-quality-scene", {
  405 |       contentType: "application/json",
  406 |       body: JSON.stringify(diagnostics),
  407 |     });
  408 |   } finally {
  409 |     await info.attach("native-keyboard-wordmark-timeline", {
  410 |       contentType: "application/json",
  411 |       body: JSON.stringify(await receipt()),
  412 |     });
  413 |   }
  414 | });
  415 | 
```