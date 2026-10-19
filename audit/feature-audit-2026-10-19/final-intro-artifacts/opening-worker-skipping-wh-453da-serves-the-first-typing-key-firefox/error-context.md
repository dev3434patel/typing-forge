# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> skipping while the native worker entry is blocked terminates startup and preserves the first typing key
- Location: e2e\opening-worker.spec.ts:680:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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
            - generic [ref=e161]: p
            - generic [ref=e162]: a
            - generic [ref=e163]: t
            - generic [ref=e164]: h
          - generic [ref=e166]:
            - generic [ref=e167]: t
            - generic [ref=e168]: o
            - generic [ref=e169]: o
          - generic [ref=e171]:
            - generic [ref=e172]: r
            - generic [ref=e173]: e
            - generic [ref=e174]: d
          - generic [ref=e176]:
            - generic [ref=e177]: w
            - generic [ref=e178]: e
            - generic [ref=e179]: e
            - generic [ref=e180]: k
          - generic [ref=e182]:
            - generic [ref=e183]: g
            - generic [ref=e184]: r
            - generic [ref=e185]: e
            - generic [ref=e186]: a
            - generic [ref=e187]: t
          - generic [ref=e189]:
            - generic [ref=e190]: c
            - generic [ref=e191]: l
            - generic [ref=e192]: e
            - generic [ref=e193]: a
            - generic [ref=e194]: r
          - generic [ref=e196]:
            - generic [ref=e197]: o
            - generic [ref=e198]: a
            - generic [ref=e199]: t
          - generic [ref=e201]:
            - generic [ref=e202]: t
            - generic [ref=e203]: r
            - generic [ref=e204]: a
            - generic [ref=e205]: i
            - generic [ref=e206]: "n"
          - generic [ref=e208]:
            - generic [ref=e209]: s
            - generic [ref=e210]: t
            - generic [ref=e211]: e
            - generic [ref=e212]: p
          - generic [ref=e214]:
            - generic [ref=e215]: "n"
            - generic [ref=e216]: a
            - generic [ref=e217]: t
            - generic [ref=e218]: i
            - generic [ref=e219]: o
            - generic [ref=e220]: "n"
          - generic [ref=e222]:
            - generic [ref=e223]: r
            - generic [ref=e224]: a
            - generic [ref=e225]: c
            - generic [ref=e226]: e
          - generic [ref=e228]:
            - generic [ref=e229]: s
            - generic [ref=e230]: h
            - generic [ref=e231]: i
            - generic [ref=e232]: p
          - generic [ref=e234]:
            - generic [ref=e235]: f
            - generic [ref=e236]: i
            - generic [ref=e237]: "n"
            - generic [ref=e238]: e
          - generic [ref=e240]:
            - generic [ref=e241]: m
            - generic [ref=e242]: a
            - generic [ref=e243]: i
            - generic [ref=e244]: "n"
          - generic [ref=e246]:
            - generic [ref=e247]: s
            - generic [ref=e248]: h
            - generic [ref=e249]: o
            - generic [ref=e250]: r
            - generic [ref=e251]: t
          - generic [ref=e253]:
            - generic [ref=e254]: s
            - generic [ref=e255]: h
            - generic [ref=e256]: o
            - generic [ref=e257]: r
            - generic [ref=e258]: e
          - generic [ref=e260]:
            - generic [ref=e261]: p
            - generic [ref=e262]: l
            - generic [ref=e263]: e
            - generic [ref=e264]: a
            - generic [ref=e265]: s
            - generic [ref=e266]: e
          - generic [ref=e268]:
            - generic [ref=e269]: w
            - generic [ref=e270]: h
            - generic [ref=e271]: e
            - generic [ref=e272]: r
            - generic [ref=e273]: e
          - generic [ref=e275]:
            - generic [ref=e276]: t
            - generic [ref=e277]: o
          - generic [ref=e279]:
            - generic [ref=e280]: t
            - generic [ref=e281]: a
            - generic [ref=e282]: l
            - generic [ref=e283]: l
          - generic [ref=e285]:
            - generic [ref=e286]: s
            - generic [ref=e287]: p
            - generic [ref=e288]: r
            - generic [ref=e289]: i
            - generic [ref=e290]: "n"
            - generic [ref=e291]: g
          - generic [ref=e293]:
            - generic [ref=e294]: s
            - generic [ref=e295]: h
            - generic [ref=e296]: a
            - generic [ref=e297]: p
            - generic [ref=e298]: e
          - generic [ref=e300]:
            - generic [ref=e301]: w
            - generic [ref=e302]: a
            - generic [ref=e303]: r
            - generic [ref=e304]: m
          - generic [ref=e306]:
            - generic [ref=e307]: d
            - generic [ref=e308]: r
            - generic [ref=e309]: a
            - generic [ref=e310]: w
          - generic [ref=e312]:
            - generic [ref=e313]: "n"
            - generic [ref=e314]: o
            - generic [ref=e315]: t
          - generic [ref=e317]:
            - generic [ref=e318]: e
            - generic [ref=e319]: a
            - generic [ref=e320]: r
            - generic [ref=e321]: "n"
          - generic [ref=e323]:
            - generic [ref=e324]: w
            - generic [ref=e325]: h
            - generic [ref=e326]: "y"
          - generic [ref=e328]:
            - generic [ref=e329]: d
            - generic [ref=e330]: e
            - generic [ref=e331]: a
            - generic [ref=e332]: r
          - generic [ref=e334]:
            - generic [ref=e335]: t
            - generic [ref=e336]: e
            - generic [ref=e337]: r
            - generic [ref=e338]: r
            - generic [ref=e339]: a
            - generic [ref=e340]: i
            - generic [ref=e341]: "n"
          - generic [ref=e343]:
            - generic [ref=e344]: p
            - generic [ref=e345]: a
            - generic [ref=e346]: r
            - generic [ref=e347]: k
          - generic [ref=e349]:
            - generic [ref=e350]: "n"
            - generic [ref=e351]: o
            - generic [ref=e352]: r
            - generic [ref=e353]: t
            - generic [ref=e354]: h
          - generic [ref=e356]:
            - generic [ref=e357]: l
            - generic [ref=e358]: o
            - generic [ref=e359]: w
          - generic [ref=e361]:
            - generic [ref=e362]: s
            - generic [ref=e363]: k
            - generic [ref=e364]: "y"
          - generic [ref=e366]:
            - generic [ref=e367]: d
            - generic [ref=e368]: o
            - generic [ref=e369]: w
            - generic [ref=e370]: "n"
          - generic [ref=e372]:
            - generic [ref=e373]: s
            - generic [ref=e374]: a
            - generic [ref=e375]: i
            - generic [ref=e376]: d
          - generic [ref=e378]:
            - generic [ref=e379]: l
            - generic [ref=e380]: o
            - generic [ref=e381]: "n"
            - generic [ref=e382]: g
          - generic [ref=e384]:
            - generic [ref=e385]: g
            - generic [ref=e386]: i
            - generic [ref=e387]: v
            - generic [ref=e388]: e
          - generic [ref=e390]:
            - generic [ref=e391]: t
            - generic [ref=e392]: h
            - generic [ref=e393]: i
            - generic [ref=e394]: "n"
            - generic [ref=e395]: k
          - generic [ref=e397]:
            - generic [ref=e398]: w
            - generic [ref=e399]: a
            - generic [ref=e400]: i
            - generic [ref=e401]: t
          - generic [ref=e403]:
            - generic [ref=e404]: s
            - generic [ref=e405]: o
          - generic [ref=e407]:
            - generic [ref=e408]: t
            - generic [ref=e409]: h
            - generic [ref=e410]: a
            - generic [ref=e411]: t
          - generic [ref=e413]:
            - generic [ref=e414]: t
            - generic [ref=e415]: a
            - generic [ref=e416]: l
            - generic [ref=e417]: l
          - generic [ref=e419]:
            - generic [ref=e420]: w
            - generic [ref=e421]: a
            - generic [ref=e422]: "y"
          - generic [ref=e424]:
            - generic [ref=e425]: g
            - generic [ref=e426]: r
            - generic [ref=e427]: o
            - generic [ref=e428]: w
          - generic [ref=e430]:
            - generic [ref=e431]: t
            - generic [ref=e432]: h
            - generic [ref=e433]: e
            - generic [ref=e434]: "n"
          - generic [ref=e436]:
            - generic [ref=e437]: p
            - generic [ref=e438]: a
            - generic [ref=e439]: r
            - generic [ref=e440]: k
          - generic [ref=e442]:
            - generic [ref=e443]: w
            - generic [ref=e444]: e
            - generic [ref=e445]: e
            - generic [ref=e446]: k
          - generic [ref=e448]:
            - generic [ref=e449]: "n"
            - generic [ref=e450]: a
            - generic [ref=e451]: t
            - generic [ref=e452]: i
            - generic [ref=e453]: o
            - generic [ref=e454]: "n"
          - generic [ref=e456]:
            - generic [ref=e457]: s
            - generic [ref=e458]: c
            - generic [ref=e459]: h
            - generic [ref=e460]: o
            - generic [ref=e461]: o
            - generic [ref=e462]: l
          - generic [ref=e464]:
            - generic [ref=e465]: z
            - generic [ref=e466]: e
            - generic [ref=e467]: r
            - generic [ref=e468]: o
          - generic [ref=e470]:
            - generic [ref=e471]: o
            - generic [ref=e472]: r
          - generic [ref=e474]:
            - generic [ref=e475]: "n"
            - generic [ref=e476]: a
            - generic [ref=e477]: t
            - generic [ref=e478]: u
            - generic [ref=e479]: r
            - generic [ref=e480]: e
          - generic [ref=e482]:
            - generic [ref=e483]: w
            - generic [ref=e484]: i
            - generic [ref=e485]: "n"
            - generic [ref=e486]: d
          - generic [ref=e488]:
            - generic [ref=e489]: h
            - generic [ref=e490]: a
            - generic [ref=e491]: "n"
            - generic [ref=e492]: d
          - generic [ref=e494]:
            - generic [ref=e495]: m
            - generic [ref=e496]: e
            - generic [ref=e497]: a
            - generic [ref=e498]: "n"
          - generic [ref=e500]:
            - generic [ref=e501]: l
            - generic [ref=e502]: a
            - generic [ref=e503]: r
            - generic [ref=e504]: g
            - generic [ref=e505]: e
          - generic [ref=e507]:
            - generic [ref=e508]: h
            - generic [ref=e509]: e
            - generic [ref=e510]: a
            - generic [ref=e511]: d
          - generic [ref=e513]:
            - generic [ref=e514]: t
            - generic [ref=e515]: h
            - generic [ref=e516]: e
          - generic [ref=e518]:
            - generic [ref=e519]: "n"
            - generic [ref=e520]: o
            - generic [ref=e521]: t
          - generic [ref=e523]:
            - generic [ref=e524]: s
            - generic [ref=e525]: i
            - generic [ref=e526]: m
            - generic [ref=e527]: p
            - generic [ref=e528]: l
            - generic [ref=e529]: e
          - generic [ref=e531]:
            - generic [ref=e532]: m
            - generic [ref=e533]: a
            - generic [ref=e534]: "y"
          - generic [ref=e536]:
            - generic [ref=e537]: "n"
            - generic [ref=e538]: o
          - generic [ref=e540]:
            - generic [ref=e541]: "n"
            - generic [ref=e542]: i
            - generic [ref=e543]: g
            - generic [ref=e544]: h
            - generic [ref=e545]: t
          - generic [ref=e547]:
            - generic [ref=e548]: q
            - generic [ref=e549]: u
            - generic [ref=e550]: i
            - generic [ref=e551]: e
            - generic [ref=e552]: t
          - generic [ref=e554]:
            - generic [ref=e555]: o
            - generic [ref=e556]: l
            - generic [ref=e557]: d
          - generic [ref=e559]:
            - generic [ref=e560]: "y"
            - generic [ref=e561]: o
            - generic [ref=e562]: u
            - generic [ref=e563]: r
          - generic [ref=e565]:
            - generic [ref=e566]: r
            - generic [ref=e567]: e
            - generic [ref=e568]: t
            - generic [ref=e569]: a
            - generic [ref=e570]: i
            - generic [ref=e571]: "n"
          - generic [ref=e573]:
            - generic [ref=e574]: f
            - generic [ref=e575]: u
            - generic [ref=e576]: l
            - generic [ref=e577]: l
          - generic [ref=e579]:
            - generic [ref=e580]: "n"
            - generic [ref=e581]: e
            - generic [ref=e582]: x
            - generic [ref=e583]: t
          - generic [ref=e585]:
            - generic [ref=e586]: p
            - generic [ref=e587]: r
            - generic [ref=e588]: e
            - generic [ref=e589]: t
            - generic [ref=e590]: t
            - generic [ref=e591]: "y"
          - generic [ref=e593]:
            - generic [ref=e594]: "n"
            - generic [ref=e595]: o
            - generic [ref=e596]: t
          - generic [ref=e598]:
            - generic [ref=e599]: s
            - generic [ref=e600]: a
            - generic [ref=e601]: v
            - generic [ref=e602]: e
          - generic [ref=e604]:
            - generic [ref=e605]: s
            - generic [ref=e606]: l
            - generic [ref=e607]: o
            - generic [ref=e608]: w
          - generic [ref=e610]:
            - generic [ref=e611]: r
            - generic [ref=e612]: u
            - generic [ref=e613]: "n"
          - generic [ref=e615]:
            - generic [ref=e616]: s
            - generic [ref=e617]: a
            - generic [ref=e618]: m
            - generic [ref=e619]: e
          - generic [ref=e621]:
            - generic [ref=e622]: i
            - generic [ref=e623]: t
          - generic [ref=e625]:
            - generic [ref=e626]: f
            - generic [ref=e627]: i
            - generic [ref=e628]: "n"
            - generic [ref=e629]: e
          - generic [ref=e631]:
            - generic [ref=e632]: m
            - generic [ref=e633]: a
            - generic [ref=e634]: "n"
            - generic [ref=e635]: "y"
          - generic [ref=e637]:
            - generic [ref=e638]: "n"
            - generic [ref=e639]: o
            - generic [ref=e640]: "n"
            - generic [ref=e641]: e
          - generic [ref=e643]:
            - generic [ref=e644]: s
            - generic [ref=e645]: h
            - generic [ref=e646]: o
            - generic [ref=e647]: r
            - generic [ref=e648]: t
          - generic [ref=e650]:
            - generic [ref=e651]: w
            - generic [ref=e652]: e
            - generic [ref=e653]: s
            - generic [ref=e654]: t
          - generic [ref=e656]:
            - generic [ref=e657]: r
            - generic [ref=e658]: a
            - generic [ref=e659]: i
            - generic [ref=e660]: "n"
          - generic [ref=e662]:
            - generic [ref=e663]: s
            - generic [ref=e664]: a
            - generic [ref=e665]: "y"
          - generic [ref=e667]:
            - generic [ref=e668]: s
            - generic [ref=e669]: p
            - generic [ref=e670]: r
            - generic [ref=e671]: i
            - generic [ref=e672]: "n"
            - generic [ref=e673]: g
          - generic [ref=e675]:
            - generic [ref=e676]: s
            - generic [ref=e677]: p
            - generic [ref=e678]: e
            - generic [ref=e679]: a
            - generic [ref=e680]: k
          - generic [ref=e682]:
            - generic [ref=e683]: h
            - generic [ref=e684]: e
            - generic [ref=e685]: r
            - generic [ref=e686]: e
          - generic [ref=e688]:
            - generic [ref=e689]: r
            - generic [ref=e690]: i
            - generic [ref=e691]: g
            - generic [ref=e692]: h
            - generic [ref=e693]: t
          - generic [ref=e695]:
            - generic [ref=e696]: p
            - generic [ref=e697]: l
            - generic [ref=e698]: a
            - generic [ref=e699]: c
            - generic [ref=e700]: e
          - generic [ref=e702]:
            - generic [ref=e703]: f
            - generic [ref=e704]: i
            - generic [ref=e705]: r
            - generic [ref=e706]: s
            - generic [ref=e707]: t
          - generic [ref=e709]:
            - generic [ref=e710]: r
            - generic [ref=e711]: o
            - generic [ref=e712]: a
            - generic [ref=e713]: d
          - generic [ref=e715]:
            - generic [ref=e716]: h
            - generic [ref=e717]: i
            - generic [ref=e718]: g
            - generic [ref=e719]: h
          - generic [ref=e721]:
            - generic [ref=e722]: f
            - generic [ref=e723]: i
            - generic [ref=e724]: "n"
            - generic [ref=e725]: d
          - generic [ref=e727]:
            - generic [ref=e728]: t
            - generic [ref=e729]: r
            - generic [ref=e730]: u
            - generic [ref=e731]: e
          - generic [ref=e733]:
            - generic [ref=e734]: m
            - generic [ref=e735]: a
            - generic [ref=e736]: d
            - generic [ref=e737]: e
          - generic [ref=e739]:
            - generic [ref=e740]: f
            - generic [ref=e741]: u
            - generic [ref=e742]: "n"
          - generic [ref=e744]:
            - generic [ref=e745]: f
            - generic [ref=e746]: u
            - generic [ref=e747]: "n"
          - generic [ref=e749]:
            - generic [ref=e750]: t
            - generic [ref=e751]: e
            - generic [ref=e752]: a
            - generic [ref=e753]: m
          - generic [ref=e755]:
            - generic [ref=e756]: s
            - generic [ref=e757]: t
            - generic [ref=e758]: a
            - generic [ref=e759]: r
            - generic [ref=e760]: e
          - generic [ref=e762]:
            - generic [ref=e763]: f
            - generic [ref=e764]: o
            - generic [ref=e765]: o
            - generic [ref=e766]: d
          - generic [ref=e768]:
            - generic [ref=e769]: r
            - generic [ref=e770]: a
            - generic [ref=e771]: c
            - generic [ref=e772]: e
          - generic [ref=e774]:
            - generic [ref=e775]: t
            - generic [ref=e776]: o
            - generic [ref=e777]: p
          - generic [ref=e779]:
            - generic [ref=e780]: t
            - generic [ref=e781]: h
            - generic [ref=e782]: e
          - generic [ref=e784]:
            - generic [ref=e785]: s
            - generic [ref=e786]: e
            - generic [ref=e787]: e
          - generic [ref=e789]:
            - generic [ref=e790]: o
            - generic [ref=e791]: a
            - generic [ref=e792]: t
          - generic [ref=e794]:
            - generic [ref=e795]: m
            - generic [ref=e796]: a
            - generic [ref=e797]: k
            - generic [ref=e798]: e
          - generic [ref=e800]:
            - generic [ref=e801]: p
            - generic [ref=e802]: o
            - generic [ref=e803]: e
            - generic [ref=e804]: m
          - generic [ref=e806]:
            - generic [ref=e807]: o
            - generic [ref=e808]: u
            - generic [ref=e809]: t
          - generic [ref=e811]:
            - generic [ref=e812]: t
            - generic [ref=e813]: h
            - generic [ref=e814]: i
            - generic [ref=e815]: s
          - generic [ref=e817]:
            - generic [ref=e818]: b
            - generic [ref=e819]: l
            - generic [ref=e820]: a
            - generic [ref=e821]: c
            - generic [ref=e822]: k
          - generic [ref=e824]:
            - generic [ref=e825]: t
            - generic [ref=e826]: o
            - generic [ref=e827]: e
          - generic [ref=e829]:
            - generic [ref=e830]: s
            - generic [ref=e831]: h
            - generic [ref=e832]: a
            - generic [ref=e833]: p
            - generic [ref=e834]: e
          - generic [ref=e836]:
            - generic [ref=e837]: e
            - generic [ref=e838]: "y"
            - generic [ref=e839]: e
          - generic [ref=e841]:
            - generic [ref=e842]: s
            - generic [ref=e843]: t
            - generic [ref=e844]: a
            - generic [ref=e845]: t
            - generic [ref=e846]: e
          - generic [ref=e848]:
            - generic [ref=e849]: a
            - generic [ref=e850]: t
          - generic [ref=e852]:
            - generic [ref=e853]: s
            - generic [ref=e854]: e
            - generic [ref=e855]: "n"
            - generic [ref=e856]: d
          - generic [ref=e858]:
            - generic [ref=e859]: l
            - generic [ref=e860]: a
            - generic [ref=e861]: "n"
            - generic [ref=e862]: e
          - generic [ref=e864]:
            - generic [ref=e865]: m
            - generic [ref=e866]: "y"
          - generic [ref=e868]:
            - generic [ref=e869]: "n"
            - generic [ref=e870]: o
            - generic [ref=e871]: t
            - generic [ref=e872]: i
            - generic [ref=e873]: o
            - generic [ref=e874]: "n"
          - generic [ref=e876]:
            - generic [ref=e877]: l
            - generic [ref=e878]: a
            - generic [ref=e879]: s
            - generic [ref=e880]: t
          - generic [ref=e882]:
            - generic [ref=e883]: o
            - generic [ref=e884]: u
            - generic [ref=e885]: r
        - paragraph [ref=e886]: "Practice passage: path too red week great clear oat train step nation race ship fine main short shore please where to tall spring shape warm draw not earn why dear terrain park north low sky down said long give think wait so that tall way grow then park week nation school zero or nature wind hand mean large head the not simple may no night quiet old your retain full next pretty not save slow run same it fine many none short west rain say spring speak here right place first road high find true made fun fun team stare food race top the see oat make poem out this black toe shape eye state at send lane my notion last our"
        - textbox "Typing input" [active] [ref=e887]
      - generic [ref=e889]:
        - paragraph [ref=e890]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e891]
      - generic [ref=e892]:
        - paragraph [ref=e893]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
        - generic [ref=e894]:
          - button "Restart with new text" [ref=e895]
          - button "Show accessible text editor" [ref=e899]
          - button "Finish" [disabled] [ref=e903]
      - status [ref=e907]: Ready to type
  - contentinfo [ref=e908]:
    - generic [ref=e909]:
      - generic [ref=e910]:
        - generic [ref=e911]:
          - generic [ref=e912]: Sparow
          - generic [ref=e913]: Type
        - text: Find your rhythm.
      - generic [ref=e914]:
        - link "About & metrics" [ref=e915] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e916] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e917] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e918] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e919] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e920] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e921]: SparowType © 2026
```

# Test source

```ts
  147 |       const effect = animation.effect as KeyframeEffect | null;
  148 |       const target = effect?.target;
  149 |       if (
  150 |         !(target instanceof Element) ||
  151 |         !target.closest(".awakening-fallback")
  152 |       )
  153 |         return null;
  154 |       if (!ids.has(animation)) ids.set(animation, ++nextId);
  155 |       if (animation.timeline && !timelines.has(animation.timeline))
  156 |         timelines.set(animation.timeline, ++nextTimeline);
  157 |       const end = effect?.getComputedTiming().endTime;
  158 |       return {
  159 |         id: ids.get(animation)!,
  160 |         name: animation.animationName,
  161 |         currentTime:
  162 |           typeof animation.currentTime === "number"
  163 |             ? animation.currentTime
  164 |             : null,
  165 |         timelineTime:
  166 |           typeof animation.timeline?.currentTime === "number"
  167 |             ? animation.timeline.currentTime
  168 |             : null,
  169 |         timelineId: animation.timeline ? timelines.get(animation.timeline)! : 0,
  170 |         rate: animation.playbackRate,
  171 |         endTime: typeof end === "number" && Number.isFinite(end) ? end : null,
  172 |         state: animation.playState,
  173 |         renderer:
  174 |           target
  175 |             .closest('[data-testid="opening-experience"]')
  176 |             ?.getAttribute("data-renderer") ?? null,
  177 |       };
  178 |     };
  179 |     for (const action of ["pause", "play", "finish"] as const) {
  180 |       const native = Animation.prototype[action];
  181 |       Animation.prototype[action] = function (...args) {
  182 |         const result = Reflect.apply(native, this, args);
  183 |         const measured = sample(this);
  184 |         if (measured)
  185 |           actions.push({ ...measured, action, atMs: performance.now() });
  186 |         return result;
  187 |       };
  188 |     }
  189 |     (window as AuditedWindow).fallbackAnimationAudit = {
  190 |       actions,
  191 |       sample: () =>
  192 |         Array.from(
  193 |           document
  194 |             .querySelector(".awakening-fallback")
  195 |             ?.getAnimations({ subtree: true }) || [],
  196 |         )
  197 |           .map(sample)
  198 |           .filter(
  199 |             (item): item is FallbackAnimationSample =>
  200 |               item !== null && item.name === "awakening-key-dissolve",
  201 |           ),
  202 |     };
  203 |   });
  204 | }
  205 | async function firstWorkerReady(page: Page) {
  206 |   await expect
  207 |     .poll(async () =>
  208 |       (await records(page))[0]?.received.some(
  209 |         (receipt) => receipt.type === "ready",
  210 |       ),
  211 |     )
  212 |     .toBe(true);
  213 | }
  214 | async function firstWorkerInitialized(page: Page) {
  215 |   await expect
  216 |     .poll(async () =>
  217 |       (await records(page))[0]?.sent.some(
  218 |         (receipt) => receipt.type === "initialize",
  219 |       ),
  220 |     )
  221 |     .toBe(true);
  222 | }
  223 | async function readyPractice(page: Page) {
  224 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  225 |   const input = page.getByRole("textbox", {
  226 |     name: "Typing input",
  227 |     exact: true,
  228 |   });
  229 |   await expect(input).toBeVisible();
  230 |   await expect(input).toHaveValue("");
  231 |   await expect(
  232 |     page.getByRole("region", { name: "Typing session", exact: true }),
  233 |   ).toHaveAttribute("data-status", "ready");
  234 |   return input;
  235 | }
  236 | async function expectWorkerClosed(
  237 |   page: Page,
  238 |   policy: "acknowledged" | "watchdog-allowed" = "acknowledged",
  239 | ) {
  240 |   await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  241 |   await expect
  242 |     .poll(
  243 |       () =>
  244 |         page.workers().filter((worker) => workerEntry.test(worker.url()))
  245 |           .length,
  246 |     )
> 247 |     .toBe(0);
      |      ^ Error: expect(received).toBe(expected) // Object.is equality
  248 |   const [record] = await records(page);
  249 |   const dispose = record.sent.find((receipt) => receipt.type === "dispose");
  250 |   if (dispose?.atMs === undefined || record.terminatedAtMs === null)
  251 |     throw new Error(
  252 |       "No monotonic dispose/terminate receipts for native worker",
  253 |     );
  254 |   const acknowledged =
  255 |     record.received.some((receipt) => receipt.type === "disposed") &&
  256 |     record.received.some((receipt) => receipt.diagnostics?.disposed);
  257 |   const elapsedMs = record.terminatedAtMs - dispose.atMs;
  258 |   let path = "acknowledged-disposal";
  259 |   if (policy === "acknowledged" || acknowledged) {
  260 |     expect(acknowledged).toBe(true);
  261 |   } else {
  262 |     // A busy GPU worker gets a200ms disposal grace period before termination.
  263 |     // Require measured watchdog timing and actual native closure. A missing
  264 |     // acknowledgement alone never establishes successful explicit disposal.
  265 |     expect(elapsedMs).toBeGreaterThanOrEqual(190);
  266 |     expect(elapsedMs).toBeLessThanOrEqual(1000);
  267 |     path = "watchdog-termination-no-disposal-acknowledgement";
  268 |   }
  269 |   await test.info().attach("native-worker-shutdown", {
  270 |     body: JSON.stringify({
  271 |       path,
  272 |       policy,
  273 |       disposeAtMs: dispose.atMs,
  274 |       terminatedAtMs: record.terminatedAtMs,
  275 |       elapsedMs,
  276 |       terminated: record.terminated,
  277 |       liveNativeWorkers: page
  278 |         .workers()
  279 |         .filter((worker) => workerEntry.test(worker.url())).length,
  280 |     }),
  281 |     contentType: "application/json",
  282 |   });
  283 | }
  284 | 
  285 | test.afterEach(async ({ page }, info) => {
  286 |   if (page.isClosed()) return;
  287 |   const observed = await records(page).catch(() => []);
  288 |   await info.attach("native-worker-receipts", {
  289 |     body: JSON.stringify(observed, null, 2),
  290 |     contentType: "application/json",
  291 |   });
  292 |   const animationActions = await page
  293 |     .evaluate(() => (window as AuditedWindow).fallbackAnimationAudit?.actions)
  294 |     .catch(() => undefined);
  295 |   if (animationActions)
  296 |     await info.attach("native-fallback-animation-actions", {
  297 |       body: JSON.stringify(animationActions),
  298 |       contentType: "application/json",
  299 |     });
  300 | });
  301 | 
  302 | test("default native worker draws the complete keyboard while document tasks, resize and skip remain responsive", async ({
  303 |   page,
  304 | }, info) => {
  305 |   await observeNativeWorker(page, info);
  306 |   await page.addInitScript(() => {
  307 |     Object.defineProperty(navigator, "hardwareConcurrency", {
  308 |       configurable: true,
  309 |       get: () => 8,
  310 |     });
  311 |     Object.defineProperty(navigator, "deviceMemory", {
  312 |       configurable: true,
  313 |       get: () => 8,
  314 |     });
  315 |   });
  316 |   await page.emulateMedia({ reducedMotion: "no-preference" });
  317 |   await page.setViewportSize({ width: 1280, height: 800 });
  318 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  319 |   await firstWorkerReady(page);
  320 |   await expect
  321 |     .poll(async () =>
  322 |       (await records(page))[0]?.received.some(
  323 |         (receipt) =>
  324 |           receipt.diagnostics?.thread === "worker" &&
  325 |           receipt.diagnostics.frames > 0 &&
  326 |           receipt.diagnostics.drawCalls > 0,
  327 |       ),
  328 |     )
  329 |     .toBe(true);
  330 |   const [record] = await records(page);
  331 |   const scene = [...record.received]
  332 |     .reverse()
  333 |     .find((receipt) => receipt.diagnostics?.frames)?.diagnostics;
  334 |   if (!scene) throw new Error("No real worker draw diagnostics were received");
  335 |   expect(scene).toMatchObject({
  336 |     thread: "worker",
  337 |     keyCount: 61,
  338 |     keycapMeshes: 1,
  339 |     tier: "desktop",
  340 |     bloom: true,
  341 |     environment: true,
  342 |     environmentIntensity: 0.35,
  343 |     contextLost: false,
  344 |     disposed: false,
  345 |   });
  346 |   expect(scene.cameraElevationDegrees).toBeGreaterThanOrEqual(28);
  347 |   expect(scene.cameraElevationDegrees).toBeLessThanOrEqual(42);
```