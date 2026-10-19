# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: input-guardrails.spec.ts >> ordinary-clock cold startup and reload reach editable practice without timer instrumentation
- Location: e2e\input-guardrails.spec.ts:184:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 304
```

# Page snapshot

```yaml
- generic [ref=f1e4]:
  - banner [ref=f1e5]:
    - link "Skip to content" [ref=f1e6] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=f1e7]:
      - link "SparowType home" [ref=f1e8] [cursor=pointer]:
        - /url: /
        - generic [ref=f1e9]:
          - generic [ref=f1e10]: Sparow
          - generic [ref=f1e11]: Type
      - navigation "Main navigation" [ref=f1e12]:
        - link "Test" [ref=f1e13] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=f1e24] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=f1e29] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=f1e39] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=f1e45] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=f1e53] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=f1e64]:
        - button "Switch to light theme" [ref=f1e65]
        - button "Open command palette" [ref=f1e76]
        - link "Settings" [ref=f1e79] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=f1e85] [cursor=pointer]:
          - /url: /auth
  - main [ref=f1e90]:
    - heading "Typing practice" [level=1] [ref=f1e91]
    - region "Test configuration" [ref=f1e92]:
      - generic [ref=f1e93]:
        - group "Test mode" [ref=f1e94]:
          - button "Time" [pressed] [ref=f1e95]
          - button "Words" [ref=f1e99]
          - button "Quote" [ref=f1e104]
          - button "Code" [ref=f1e108]
          - button "Custom" [ref=f1e113]
          - button "Zen" [ref=f1e120]
        - group "Test duration" [ref=f1e127]:
          - button "15 seconds" [ref=f1e128]:
            - text: "15"
            - generic [ref=f1e129]: seconds
          - button "30 seconds" [pressed] [ref=f1e130]:
            - text: "30"
            - generic [ref=f1e131]: seconds
          - button "60 seconds" [ref=f1e132]:
            - text: "60"
            - generic [ref=f1e133]: seconds
          - button "120 seconds" [ref=f1e134]:
            - text: "120"
            - generic [ref=f1e135]: seconds
      - generic [ref=f1e136]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=f1e137]:
          - checkbox "Precision mode · stop on errors" [ref=f1e138]
          - text: Precision mode · stop on errors
        - generic [ref=f1e139]:
          - text: Language
          - combobox "Language" [ref=f1e140]:
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
        - button "punctuation" [ref=f1e142]
        - button "# numbers" [ref=f1e146]
    - region "Typing session" [ref=f1e147]:
      - generic [ref=f1e148]:
        - generic [ref=f1e149]:
          - generic [ref=f1e150]:
            - generic [ref=f1e151]: 30s
            - generic [ref=f1e152]: remaining
          - generic [ref=f1e153]: —wpm
          - generic [ref=f1e154]: —acc %
        - generic [ref=f1e155]: Ready when you are
      - generic [ref=f1e157]:
        - generic [ref=f1e159]:
          - generic [ref=f1e160]:
            - generic [ref=f1e161]: r
            - generic [ref=f1e162]: e
            - generic [ref=f1e163]: t
            - generic [ref=f1e164]: a
            - generic [ref=f1e165]: i
            - generic [ref=f1e166]: "n"
          - generic [ref=f1e168]:
            - generic [ref=f1e169]: s
            - generic [ref=f1e170]: a
            - generic [ref=f1e171]: "y"
          - generic [ref=f1e173]:
            - generic [ref=f1e174]: t
            - generic [ref=f1e175]: o
            - generic [ref=f1e176]: "n"
            - generic [ref=f1e177]: e
          - generic [ref=f1e179]:
            - generic [ref=f1e180]: u
            - generic [ref=f1e181]: s
          - generic [ref=f1e183]:
            - generic [ref=f1e184]: w
            - generic [ref=f1e185]: a
            - generic [ref=f1e186]: t
            - generic [ref=f1e187]: e
            - generic [ref=f1e188]: r
          - generic [ref=f1e190]:
            - generic [ref=f1e191]: t
            - generic [ref=f1e192]: a
            - generic [ref=f1e193]: "n"
          - generic [ref=f1e195]:
            - generic [ref=f1e196]: h
            - generic [ref=f1e197]: o
            - generic [ref=f1e198]: m
            - generic [ref=f1e199]: e
          - generic [ref=f1e201]:
            - generic [ref=f1e202]: w
            - generic [ref=f1e203]: r
            - generic [ref=f1e204]: i
            - generic [ref=f1e205]: t
            - generic [ref=f1e206]: e
          - generic [ref=f1e208]:
            - generic [ref=f1e209]: p
            - generic [ref=f1e210]: l
            - generic [ref=f1e211]: e
            - generic [ref=f1e212]: a
            - generic [ref=f1e213]: s
            - generic [ref=f1e214]: e
          - generic [ref=f1e216]:
            - generic [ref=f1e217]: f
            - generic [ref=f1e218]: o
            - generic [ref=f1e219]: c
            - generic [ref=f1e220]: u
            - generic [ref=f1e221]: s
          - generic [ref=f1e223]:
            - generic [ref=f1e224]: a
            - generic [ref=f1e225]: "n"
            - generic [ref=f1e226]: t
            - generic [ref=f1e227]: e
          - generic [ref=f1e229]:
            - generic [ref=f1e230]: f
            - generic [ref=f1e231]: o
            - generic [ref=f1e232]: r
            - generic [ref=f1e233]: m
          - generic [ref=f1e235]:
            - generic [ref=f1e236]: g
            - generic [ref=f1e237]: u
            - generic [ref=f1e238]: i
            - generic [ref=f1e239]: d
            - generic [ref=f1e240]: e
          - generic [ref=f1e242]:
            - generic [ref=f1e243]: p
            - generic [ref=f1e244]: a
            - generic [ref=f1e245]: r
            - generic [ref=f1e246]: t
          - generic [ref=f1e248]: a
          - generic [ref=f1e251]:
            - generic [ref=f1e252]: l
            - generic [ref=f1e253]: i
            - generic [ref=f1e254]: f
            - generic [ref=f1e255]: e
          - generic [ref=f1e257]:
            - generic [ref=f1e258]: l
            - generic [ref=f1e259]: o
            - generic [ref=f1e260]: w
          - generic [ref=f1e262]:
            - generic [ref=f1e263]: t
            - generic [ref=f1e264]: i
            - generic [ref=f1e265]: r
            - generic [ref=f1e266]: e
          - generic [ref=f1e268]:
            - generic [ref=f1e269]: w
            - generic [ref=f1e270]: h
            - generic [ref=f1e271]: e
            - generic [ref=f1e272]: "n"
          - generic [ref=f1e274]:
            - generic [ref=f1e275]: t
            - generic [ref=f1e276]: r
            - generic [ref=f1e277]: e
            - generic [ref=f1e278]: e
          - generic [ref=f1e280]:
            - generic [ref=f1e281]: s
            - generic [ref=f1e282]: h
            - generic [ref=f1e283]: i
            - generic [ref=f1e284]: p
          - generic [ref=f1e286]:
            - generic [ref=f1e287]: l
            - generic [ref=f1e288]: i
            - generic [ref=f1e289]: g
            - generic [ref=f1e290]: h
            - generic [ref=f1e291]: t
          - generic [ref=f1e293]:
            - generic [ref=f1e294]: b
            - generic [ref=f1e295]: r
            - generic [ref=f1e296]: o
            - generic [ref=f1e297]: w
            - generic [ref=f1e298]: "n"
          - generic [ref=f1e300]:
            - generic [ref=f1e301]: k
            - generic [ref=f1e302]: e
            - generic [ref=f1e303]: e
            - generic [ref=f1e304]: p
          - generic [ref=f1e306]:
            - generic [ref=f1e307]: j
            - generic [ref=f1e308]: u
            - generic [ref=f1e309]: s
            - generic [ref=f1e310]: t
          - generic [ref=f1e312]:
            - generic [ref=f1e313]: f
            - generic [ref=f1e314]: i
            - generic [ref=f1e315]: v
            - generic [ref=f1e316]: e
          - generic [ref=f1e318]:
            - generic [ref=f1e319]: "n"
            - generic [ref=f1e320]: a
            - generic [ref=f1e321]: m
            - generic [ref=f1e322]: e
          - generic [ref=f1e324]:
            - generic [ref=f1e325]: h
            - generic [ref=f1e326]: e
            - generic [ref=f1e327]: a
            - generic [ref=f1e328]: r
            - generic [ref=f1e329]: t
          - generic [ref=f1e331]:
            - generic [ref=f1e332]: s
            - generic [ref=f1e333]: o
            - generic [ref=f1e334]: r
            - generic [ref=f1e335]: e
          - generic [ref=f1e337]:
            - generic [ref=f1e338]: p
            - generic [ref=f1e339]: i
            - generic [ref=f1e340]: "n"
            - generic [ref=f1e341]: k
          - generic [ref=f1e343]:
            - generic [ref=f1e344]: c
            - generic [ref=f1e345]: a
            - generic [ref=f1e346]: "n"
          - generic [ref=f1e348]:
            - generic [ref=f1e349]: s
            - generic [ref=f1e350]: p
            - generic [ref=f1e351]: a
            - generic [ref=f1e352]: c
            - generic [ref=f1e353]: e
          - generic [ref=f1e355]:
            - generic [ref=f1e356]: o
            - generic [ref=f1e357]: u
            - generic [ref=f1e358]: r
          - generic [ref=f1e360]:
            - generic [ref=f1e361]: s
            - generic [ref=f1e362]: a
            - generic [ref=f1e363]: m
            - generic [ref=f1e364]: e
          - generic [ref=f1e366]:
            - generic [ref=f1e367]: "y"
            - generic [ref=f1e368]: o
            - generic [ref=f1e369]: u
            - generic [ref=f1e370]: r
          - generic [ref=f1e372]:
            - generic [ref=f1e373]: i
            - generic [ref=f1e374]: t
          - generic [ref=f1e376]:
            - generic [ref=f1e377]: d
            - generic [ref=f1e378]: r
            - generic [ref=f1e379]: e
            - generic [ref=f1e380]: a
            - generic [ref=f1e381]: m
          - generic [ref=f1e383]:
            - generic [ref=f1e384]: l
            - generic [ref=f1e385]: e
            - generic [ref=f1e386]: t
          - generic [ref=f1e388]:
            - generic [ref=f1e389]: v
            - generic [ref=f1e390]: o
            - generic [ref=f1e391]: i
            - generic [ref=f1e392]: c
            - generic [ref=f1e393]: e
          - generic [ref=f1e395]:
            - generic [ref=f1e396]: s
            - generic [ref=f1e397]: t
            - generic [ref=f1e398]: e
            - generic [ref=f1e399]: p
          - generic [ref=f1e401]:
            - generic [ref=f1e402]: t
            - generic [ref=f1e403]: a
            - generic [ref=f1e404]: s
            - generic [ref=f1e405]: k
          - generic [ref=f1e407]:
            - generic [ref=f1e408]: m
            - generic [ref=f1e409]: a
            - generic [ref=f1e410]: p
          - generic [ref=f1e412]:
            - generic [ref=f1e413]: w
            - generic [ref=f1e414]: o
            - generic [ref=f1e415]: o
            - generic [ref=f1e416]: d
          - generic [ref=f1e418]:
            - generic [ref=f1e419]: m
            - generic [ref=f1e420]: a
            - generic [ref=f1e421]: "n"
            - generic [ref=f1e422]: "y"
          - generic [ref=f1e424]:
            - generic [ref=f1e425]: a
            - generic [ref=f1e426]: i
            - generic [ref=f1e427]: r
          - generic [ref=f1e429]:
            - generic [ref=f1e430]: t
            - generic [ref=f1e431]: e
            - generic [ref=f1e432]: a
          - generic [ref=f1e434]:
            - generic [ref=f1e435]: c
            - generic [ref=f1e436]: a
            - generic [ref=f1e437]: l
            - generic [ref=f1e438]: m
          - generic [ref=f1e440]:
            - generic [ref=f1e441]: l
            - generic [ref=f1e442]: i
            - generic [ref=f1e443]: f
            - generic [ref=f1e444]: e
          - generic [ref=f1e446]:
            - generic [ref=f1e447]: u
            - generic [ref=f1e448]: s
            - generic [ref=f1e449]: e
          - generic [ref=f1e451]:
            - generic [ref=f1e452]: o
            - generic [ref=f1e453]: "n"
            - generic [ref=f1e454]: l
            - generic [ref=f1e455]: "y"
          - generic [ref=f1e457]:
            - generic [ref=f1e458]: v
            - generic [ref=f1e459]: e
            - generic [ref=f1e460]: r
            - generic [ref=f1e461]: "y"
          - generic [ref=f1e463]:
            - generic [ref=f1e464]: m
            - generic [ref=f1e465]: a
            - generic [ref=f1e466]: k
            - generic [ref=f1e467]: e
          - generic [ref=f1e469]:
            - generic [ref=f1e470]: r
            - generic [ref=f1e471]: a
            - generic [ref=f1e472]: t
            - generic [ref=f1e473]: i
            - generic [ref=f1e474]: o
          - generic [ref=f1e476]:
            - generic [ref=f1e477]: m
            - generic [ref=f1e478]: i
            - generic [ref=f1e479]: "n"
            - generic [ref=f1e480]: e
          - generic [ref=f1e482]:
            - generic [ref=f1e483]: g
            - generic [ref=f1e484]: o
            - generic [ref=f1e485]: o
            - generic [ref=f1e486]: d
          - generic [ref=f1e488]:
            - generic [ref=f1e489]: s
            - generic [ref=f1e490]: t
            - generic [ref=f1e491]: o
            - generic [ref=f1e492]: r
            - generic [ref=f1e493]: e
          - generic [ref=f1e495]:
            - generic [ref=f1e496]: v
            - generic [ref=f1e497]: o
            - generic [ref=f1e498]: i
            - generic [ref=f1e499]: c
            - generic [ref=f1e500]: e
          - generic [ref=f1e502]:
            - generic [ref=f1e503]: s
            - generic [ref=f1e504]: a
            - generic [ref=f1e505]: "y"
          - generic [ref=f1e507]:
            - generic [ref=f1e508]: t
            - generic [ref=f1e509]: h
            - generic [ref=f1e510]: o
            - generic [ref=f1e511]: u
            - generic [ref=f1e512]: g
            - generic [ref=f1e513]: h
          - generic [ref=f1e515]:
            - generic [ref=f1e516]: g
            - generic [ref=f1e517]: o
            - generic [ref=f1e518]: l
            - generic [ref=f1e519]: d
          - generic [ref=f1e521]:
            - generic [ref=f1e522]: u
            - generic [ref=f1e523]: s
            - generic [ref=f1e524]: e
          - generic [ref=f1e526]:
            - generic [ref=f1e527]: o
            - generic [ref=f1e528]: w
            - generic [ref=f1e529]: "n"
          - generic [ref=f1e531]:
            - generic [ref=f1e532]: s
            - generic [ref=f1e533]: o
          - generic [ref=f1e535]:
            - generic [ref=f1e536]: j
            - generic [ref=f1e537]: o
            - generic [ref=f1e538]: "y"
          - generic [ref=f1e540]:
            - generic [ref=f1e541]: r
            - generic [ref=f1e542]: a
            - generic [ref=f1e543]: c
            - generic [ref=f1e544]: e
          - generic [ref=f1e546]:
            - generic [ref=f1e547]: c
            - generic [ref=f1e548]: l
            - generic [ref=f1e549]: o
            - generic [ref=f1e550]: s
            - generic [ref=f1e551]: e
          - generic [ref=f1e553]:
            - generic [ref=f1e554]: t
            - generic [ref=f1e555]: o
            - generic [ref=f1e556]: "n"
            - generic [ref=f1e557]: e
          - generic [ref=f1e559]:
            - generic [ref=f1e560]: f
            - generic [ref=f1e561]: o
            - generic [ref=f1e562]: r
            - generic [ref=f1e563]: m
          - generic [ref=f1e565]:
            - generic [ref=f1e566]: h
            - generic [ref=f1e567]: o
            - generic [ref=f1e568]: w
          - generic [ref=f1e570]:
            - generic [ref=f1e571]: e
            - generic [ref=f1e572]: a
            - generic [ref=f1e573]: r
            - generic [ref=f1e574]: t
            - generic [ref=f1e575]: h
          - generic [ref=f1e577]:
            - generic [ref=f1e578]: w
            - generic [ref=f1e579]: o
            - generic [ref=f1e580]: r
            - generic [ref=f1e581]: l
            - generic [ref=f1e582]: d
          - generic [ref=f1e584]:
            - generic [ref=f1e585]: l
            - generic [ref=f1e586]: e
            - generic [ref=f1e587]: t
            - generic [ref=f1e588]: t
            - generic [ref=f1e589]: e
            - generic [ref=f1e590]: r
          - generic [ref=f1e592]:
            - generic [ref=f1e593]: w
            - generic [ref=f1e594]: i
            - generic [ref=f1e595]: d
            - generic [ref=f1e596]: e
          - generic [ref=f1e598]:
            - generic [ref=f1e599]: i
            - generic [ref=f1e600]: "n"
            - generic [ref=f1e601]: t
            - generic [ref=f1e602]: o
          - generic [ref=f1e604]:
            - generic [ref=f1e605]: s
            - generic [ref=f1e606]: a
            - generic [ref=f1e607]: "y"
          - generic [ref=f1e609]:
            - generic [ref=f1e610]: s
            - generic [ref=f1e611]: t
            - generic [ref=f1e612]: o
            - generic [ref=f1e613]: r
            - generic [ref=f1e614]: "y"
          - generic [ref=f1e616]:
            - generic [ref=f1e617]: s
            - generic [ref=f1e618]: e
            - generic [ref=f1e619]: "n"
            - generic [ref=f1e620]: t
          - generic [ref=f1e622]:
            - generic [ref=f1e623]: "n"
            - generic [ref=f1e624]: e
            - generic [ref=f1e625]: o
            - generic [ref=f1e626]: "n"
          - generic [ref=f1e628]:
            - generic [ref=f1e629]: o
            - generic [ref=f1e630]: w
            - generic [ref=f1e631]: "n"
          - generic [ref=f1e633]:
            - generic [ref=f1e634]: f
            - generic [ref=f1e635]: u
            - generic [ref=f1e636]: l
            - generic [ref=f1e637]: l
          - generic [ref=f1e639]:
            - generic [ref=f1e640]: s
            - generic [ref=f1e641]: t
            - generic [ref=f1e642]: o
            - generic [ref=f1e643]: r
            - generic [ref=f1e644]: e
          - generic [ref=f1e646]:
            - generic [ref=f1e647]: w
            - generic [ref=f1e648]: r
            - generic [ref=f1e649]: i
            - generic [ref=f1e650]: t
            - generic [ref=f1e651]: e
          - generic [ref=f1e653]:
            - generic [ref=f1e654]: s
            - generic [ref=f1e655]: e
            - generic [ref=f1e656]: e
          - generic [ref=f1e658]:
            - generic [ref=f1e659]: l
            - generic [ref=f1e660]: i
            - generic [ref=f1e661]: "n"
            - generic [ref=f1e662]: e
          - generic [ref=f1e664]:
            - generic [ref=f1e665]: o
            - generic [ref=f1e666]: r
          - generic [ref=f1e668]:
            - generic [ref=f1e669]: p
            - generic [ref=f1e670]: a
            - generic [ref=f1e671]: g
            - generic [ref=f1e672]: e
          - generic [ref=f1e674]:
            - generic [ref=f1e675]: t
            - generic [ref=f1e676]: r
            - generic [ref=f1e677]: e
            - generic [ref=f1e678]: e
          - generic [ref=f1e680]:
            - generic [ref=f1e681]: r
            - generic [ref=f1e682]: e
            - generic [ref=f1e683]: a
            - generic [ref=f1e684]: d
          - generic [ref=f1e686]:
            - generic [ref=f1e687]: s
            - generic [ref=f1e688]: e
            - generic [ref=f1e689]: e
            - generic [ref=f1e690]: "n"
          - generic [ref=f1e692]:
            - generic [ref=f1e693]: o
            - generic [ref=f1e694]: f
            - generic [ref=f1e695]: f
          - generic [ref=f1e697]:
            - generic [ref=f1e698]: "n"
            - generic [ref=f1e699]: u
            - generic [ref=f1e700]: m
            - generic [ref=f1e701]: b
            - generic [ref=f1e702]: e
            - generic [ref=f1e703]: r
          - generic [ref=f1e705]:
            - generic [ref=f1e706]: s
            - generic [ref=f1e707]: u
            - generic [ref=f1e708]: m
            - generic [ref=f1e709]: m
            - generic [ref=f1e710]: e
            - generic [ref=f1e711]: r
          - generic [ref=f1e713]:
            - generic [ref=f1e714]: "n"
            - generic [ref=f1e715]: i
            - generic [ref=f1e716]: g
            - generic [ref=f1e717]: h
            - generic [ref=f1e718]: t
          - generic [ref=f1e720]:
            - generic [ref=f1e721]: t
            - generic [ref=f1e722]: h
            - generic [ref=f1e723]: o
            - generic [ref=f1e724]: u
            - generic [ref=f1e725]: g
            - generic [ref=f1e726]: h
          - generic [ref=f1e728]:
            - generic [ref=f1e729]: t
            - generic [ref=f1e730]: h
            - generic [ref=f1e731]: a
            - generic [ref=f1e732]: "n"
            - generic [ref=f1e733]: k
          - generic [ref=f1e735]:
            - generic [ref=f1e736]: s
            - generic [ref=f1e737]: a
            - generic [ref=f1e738]: v
            - generic [ref=f1e739]: e
          - generic [ref=f1e741]:
            - generic [ref=f1e742]: t
            - generic [ref=f1e743]: e
            - generic [ref=f1e744]: a
          - generic [ref=f1e746]:
            - generic [ref=f1e747]: l
            - generic [ref=f1e748]: a
            - generic [ref=f1e749]: t
            - generic [ref=f1e750]: e
            - generic [ref=f1e751]: r
          - generic [ref=f1e753]:
            - generic [ref=f1e754]: r
            - generic [ref=f1e755]: a
            - generic [ref=f1e756]: t
            - generic [ref=f1e757]: e
          - generic [ref=f1e759]:
            - generic [ref=f1e760]: l
            - generic [ref=f1e761]: o
            - generic [ref=f1e762]: w
          - generic [ref=f1e764]:
            - generic [ref=f1e765]: h
            - generic [ref=f1e766]: o
            - generic [ref=f1e767]: u
            - generic [ref=f1e768]: s
            - generic [ref=f1e769]: e
          - generic [ref=f1e771]:
            - generic [ref=f1e772]: e
            - generic [ref=f1e773]: a
            - generic [ref=f1e774]: r
            - generic [ref=f1e775]: t
            - generic [ref=f1e776]: h
          - generic [ref=f1e778]:
            - generic [ref=f1e779]: p
            - generic [ref=f1e780]: a
            - generic [ref=f1e781]: i
            - generic [ref=f1e782]: r
          - generic [ref=f1e784]:
            - generic [ref=f1e785]: a
            - generic [ref=f1e786]: s
          - generic [ref=f1e788]:
            - generic [ref=f1e789]: t
            - generic [ref=f1e790]: o
          - generic [ref=f1e792]:
            - generic [ref=f1e793]: t
            - generic [ref=f1e794]: r
            - generic [ref=f1e795]: "y"
          - generic [ref=f1e797]:
            - generic [ref=f1e798]: p
            - generic [ref=f1e799]: o
            - generic [ref=f1e800]: w
            - generic [ref=f1e801]: e
            - generic [ref=f1e802]: r
          - generic [ref=f1e804]:
            - generic [ref=f1e805]: a
            - generic [ref=f1e806]: s
          - generic [ref=f1e808]:
            - generic [ref=f1e809]: "n"
            - generic [ref=f1e810]: e
            - generic [ref=f1e811]: t
          - generic [ref=f1e813]:
            - generic [ref=f1e814]: p
            - generic [ref=f1e815]: i
            - generic [ref=f1e816]: "n"
            - generic [ref=f1e817]: k
          - generic [ref=f1e819]:
            - generic [ref=f1e820]: f
            - generic [ref=f1e821]: a
            - generic [ref=f1e822]: i
            - generic [ref=f1e823]: r
          - generic [ref=f1e825]:
            - generic [ref=f1e826]: t
            - generic [ref=f1e827]: r
            - generic [ref=f1e828]: u
            - generic [ref=f1e829]: e
          - generic [ref=f1e831]:
            - generic [ref=f1e832]: "y"
            - generic [ref=f1e833]: e
            - generic [ref=f1e834]: t
          - generic [ref=f1e836]:
            - generic [ref=f1e837]: s
            - generic [ref=f1e838]: k
            - generic [ref=f1e839]: "y"
          - generic [ref=f1e841]:
            - generic [ref=f1e842]: t
            - generic [ref=f1e843]: u
            - generic [ref=f1e844]: r
            - generic [ref=f1e845]: "n"
          - generic [ref=f1e847]:
            - generic [ref=f1e848]: w
            - generic [ref=f1e849]: a
            - generic [ref=f1e850]: l
            - generic [ref=f1e851]: k
          - generic [ref=f1e853]:
            - generic [ref=f1e854]: s
            - generic [ref=f1e855]: i
            - generic [ref=f1e856]: l
            - generic [ref=f1e857]: v
            - generic [ref=f1e858]: e
            - generic [ref=f1e859]: r
          - generic [ref=f1e861]:
            - generic [ref=f1e862]: t
            - generic [ref=f1e863]: e
            - generic [ref=f1e864]: a
          - generic [ref=f1e866]:
            - generic [ref=f1e867]: l
            - generic [ref=f1e868]: e
            - generic [ref=f1e869]: t
          - generic [ref=f1e871]:
            - generic [ref=f1e872]: s
            - generic [ref=f1e873]: a
            - generic [ref=f1e874]: m
            - generic [ref=f1e875]: e
        - paragraph [ref=f1e876]: "Practice passage: retain say tone us water tan home write please focus ante form guide part a life low tire when tree ship light brown keep just five name heart sore pink can space our same your it dream let voice step task map wood many air tea calm life use only very make ratio mine good store voice say though gold use own so joy race close tone form how earth world letter wide into say story sent neon own full store write see line or page tree read seen off number summer night though thank save tea later rate low house earth pair as to try power as net pink fair true yet sky turn walk silver tea let same"
        - textbox "Typing input" [active] [ref=f1e877]
      - generic [ref=f1e879]:
        - paragraph [ref=f1e880]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=f1e881]
      - generic [ref=f1e882]:
        - paragraph [ref=f1e883]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
        - generic [ref=f1e884]:
          - button "Restart with new text" [ref=f1e885]
          - button "Show accessible text editor" [ref=f1e889]
          - button "Finish" [disabled] [ref=f1e893]
      - status [ref=f1e897]: Ready to type
  - contentinfo [ref=f1e898]:
    - generic [ref=f1e899]:
      - generic [ref=f1e900]:
        - generic [ref=f1e901]:
          - generic [ref=f1e902]: Sparow
          - generic [ref=f1e903]: Type
        - text: Find your rhythm.
      - generic [ref=f1e904]:
        - link "About & metrics" [ref=f1e905] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=f1e906] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=f1e907] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=f1e908] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=f1e909] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=f1e910] [cursor=pointer]:
          - /url: /offline
        - generic [ref=f1e911]: SparowType © 2026
```

# Test source

```ts
  93  | });
  94  | 
  95  | test("supported typing audio creates one context on input and disposes it on navigation", async ({ page }) => {
  96  |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  97  |   const supported = await page.evaluate(() => typeof AudioContext === "function");
  98  |   test.skip(!supported, "UNVERIFIED: this browser runner exposes no standard AudioContext API; this is not a native Safari capability claim.");
  99  |   await page.addInitScript(() => {
  100 |     const tracked = window as Window & {
  101 |       audioContexts: number;
  102 |       disposedAudioContexts: number;
  103 |       audioConstructorInstalled: boolean;
  104 |     };
  105 |     tracked.audioContexts = 0;
  106 |     tracked.disposedAudioContexts = 0;
  107 |     const instrumented = new Proxy(window.AudioContext, {
  108 |       construct(target, args) {
  109 |         tracked.audioContexts++;
  110 |         const context = Reflect.construct(target, args) as AudioContext;
  111 |         const close = context.close.bind(context);
  112 |         context.close = () => { tracked.disposedAudioContexts++; return close(); };
  113 |         return context;
  114 |       },
  115 |     });
  116 |     Object.defineProperty(window, "AudioContext", { configurable: true, writable: true, value: instrumented });
  117 |     tracked.audioConstructorInstalled = window.AudioContext === instrumented && AudioContext === instrumented;
  118 |   });
  119 |   await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  120 |   await page.getByRole("combobox", { name: "Sound pack", exact: true }).selectOption("mechanical");
  121 |   const input = await customPractice(page, "cat dog");
  122 |   await page.waitForFunction(() => (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
  123 |     .some((resource) => resource.name.includes("keyboard-audio") && resource.responseEnd > 0));
  124 |   // Download completion alone does not establish dynamic-import evaluation.
  125 |   await page.evaluate(async () => {
  126 |     const resource = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
  127 |       .find((entry) => entry.name.includes("keyboard-audio") && entry.responseEnd > 0)!;
  128 |     await import(resource.name);
  129 |   });
  130 |   expect(await page.evaluate(() => (window as Window & { audioConstructorInstalled: boolean }).audioConstructorInstalled)).toBe(true);
  131 |   expect(await page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(0);
  132 |   await input.pressSequentially("cat");
  133 |   await expect.poll(() => page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(1);
  134 |   await page.getByRole("link", { name: "Settings", exact: true }).click();
  135 |   await expect(page.getByRole("heading", { name: "Your practice, your space.", exact: true })).toBeVisible();
  136 |   await expect.poll(() => page.evaluate(() => (window as Window & { disposedAudioContexts: number }).disposedAudioContexts)).toBe(1);
  137 | });
  138 | 
  139 | test("unavailable browser audio is explained without clearing the saved sound preference", async ({ page }) => {
  140 |   await page.addInitScript(() => Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined }));
  141 |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  142 |   const notice = page.getByRole("status").filter({ hasText: "Typing sound is unavailable in this browser." });
  143 |   await expect(notice).toBeVisible();
  144 |   await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  145 |   await page.reload({ waitUntil: "domcontentloaded" });
  146 |   await expect(notice).toBeVisible();
  147 |   await expect(page.getByRole("checkbox", { name: "Typing sound", exact: true })).toBeChecked();
  148 | });
  149 | 
  150 | test("idle practice has no 100ms interval and the active deadline still persists exactly", async ({ page }) => {
  151 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  152 |   await expect(page.getByRole("group", { name: "Test duration", exact: true })).toBeVisible();
  153 |   await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  154 |   // Bootstrap and first-paint scheduling use the ordinary browser clock. The
  155 |   // deterministic test clock begins only after a real idle workspace exists.
  156 |   await page.clock.install();
  157 |   await page.evaluate(() => {
  158 |     const tracked = window as Window & { practiceIntervals: number };
  159 |     tracked.practiceIntervals = 0;
  160 |     const interval = window.setInterval.bind(window);
  161 |     window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  162 |       if (timeout === 100) tracked.practiceIntervals++;
  163 |       return interval(handler, timeout, ...args);
  164 |     }) as typeof window.setInterval;
  165 |   });
  166 |   await page.getByRole("group", { name: "Test duration", exact: true }).getByRole("button", { name: "15 seconds", exact: true }).click();
  167 |   const input = await focusTyping(page);
  168 |   const first = (await page.getByTestId("typing-target").innerText()).slice(0, 1);
  169 |   await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  170 |   await page.clock.fastForward(60_000);
  171 |   await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  172 |   expect(await page.evaluate(() => (window as Window & { practiceIntervals: number }).practiceIntervals)).toBe(0);
  173 |   await input.press(first);
  174 |   await page.clock.fastForward(16_000);
  175 |   await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  176 |   const result = await exportedResult(page);
  177 |   expect(result.elapsedMs).toBe(15_000);
  178 |   expect(result.metrics.insertionAttempts).toBe(1);
  179 |   await expect(page.getByRole("status").filter({ hasText: /saved.*device|saved.*locally|local.*saved/i })).toBeVisible();
  180 |   await page.goto("/stats", { waitUntil: "domcontentloaded" });
  181 |   await expect(page.getByRole("table", { name: "Completed sessions, most recent first", exact: true }).getByRole("row").nth(1)).toContainText("15.0s");
  182 | });
  183 | 
  184 | test("ordinary-clock cold startup and reload reach editable practice without timer instrumentation", async ({ page }, info) => {
  185 |   const errors: string[] = [];
  186 |   page.on("pageerror", (error) => errors.push(error.message));
  187 |   const receipts: unknown[] = [];
  188 |   for (const attempt of ["cold", "reload"] as const) {
  189 |     const startedAt = Date.now();
  190 |     const response = attempt === "cold"
  191 |       ? await page.goto("/", { waitUntil: "domcontentloaded" })
  192 |       : await page.reload({ waitUntil: "domcontentloaded" });
> 193 |     expect(response?.status()).toBe(200);
      |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  194 |     await expect(page.getByRole("group", { name: "Test duration", exact: true })).toBeVisible();
  195 |     const session = page.getByRole("region", { name: "Typing session", exact: true });
  196 |     await expect(session).toHaveAttribute("data-status", "ready");
  197 |     await expect(page.getByRole("status").filter({ hasText: "Preparing your typing workspace…" })).toBeHidden();
  198 |     const input = await focusTyping(page);
  199 |     const first = (await page.getByTestId("typing-target").innerText()).slice(0, 1);
  200 |     await input.press(first);
  201 |     await expect(input).toHaveValue(first);
  202 |     await expect(session).toHaveAttribute("data-status", "running");
  203 |     receipts.push({
  204 |       attempt,
  205 |       readyAndInputElapsedMs: Date.now() - startedAt,
  206 |       ...await page.evaluate(() => ({
  207 |         clock: "ordinary browser clock; Playwright clock is not installed",
  208 |         timeOrigin: performance.timeOrigin,
  209 |         performanceNow: performance.now(),
  210 |         navigationType: (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type,
  211 |       })),
  212 |     });
  213 |   }
  214 |   await info.attach("ordinary-clock-workspace-startup", {
  215 |     body: JSON.stringify({ receipts, pageErrors: errors }, null, 2),
  216 |     contentType: "application/json",
  217 |   });
  218 |   expect(errors).toEqual([]);
  219 | });
  220 | 
```