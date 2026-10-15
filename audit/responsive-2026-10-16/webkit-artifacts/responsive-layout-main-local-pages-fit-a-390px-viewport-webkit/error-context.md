# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> main local pages fit a 390px viewport
- Location: e2e\responsive-layout.spec.ts:26:3

# Error details

```
Error: http://127.0.0.1:4173/

expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
-   "body": 334,
+   "body": 333,
    "document": 334,
    "offenders": Array [],
  }
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
      - generic [ref=e12]:
        - link "Settings" [ref=e13]:
          - /url: /settings
        - link "Sign in" [ref=e17]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e21]:
      - link "Test" [ref=e22]:
        - /url: /
      - link "Learn" [ref=e25]:
        - /url: /learn
      - link "Race" [ref=e29]:
        - /url: /race
      - link "Stats" [ref=e39]:
        - /url: /stats
      - link "Rankings" [ref=e42]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e49]:
        - /url: /keyboard-lab
  - main [ref=e52]:
    - heading "Typing practice" [level=1] [ref=e53]
    - region "Test configuration" [ref=e54]:
      - generic [ref=e55]:
        - group "Test mode" [ref=e56]:
          - button "Time" [pressed] [ref=e57]
          - button "Words" [ref=e61]
          - button "Quote" [ref=e64]
          - button "Code" [ref=e68]
          - button "Custom" [ref=e73]
          - button "Zen" [ref=e77]
        - group "Test duration" [ref=e80]:
          - button "15 seconds" [ref=e81]:
            - text: "15"
            - generic [ref=e82]: seconds
          - button "30 seconds" [pressed] [ref=e83]:
            - text: "30"
            - generic [ref=e84]: seconds
          - button "60 seconds" [ref=e85]:
            - text: "60"
            - generic [ref=e86]: seconds
          - button "120 seconds" [ref=e87]:
            - text: "120"
            - generic [ref=e88]: seconds
      - generic [ref=e89]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e90]:
          - checkbox "Precision mode · stop on errors" [ref=e91]
          - text: Precision mode · stop on errors
        - generic [ref=e92]:
          - text: Language
          - combobox "Language" [ref=e93]:
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
        - button "punctuation" [ref=e94]
        - button "# numbers" [ref=e96]
    - region "Typing session" [ref=e97]:
      - generic [ref=e99]:
        - generic [ref=e100]:
          - generic [ref=e101]: 30s
          - generic [ref=e102]: remaining
        - generic [ref=e103]: —wpm
      - generic [ref=e105]:
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e109]: s
            - generic [ref=e110]: h
            - generic [ref=e111]: o
            - generic [ref=e112]: r
            - generic [ref=e113]: e
          - generic [ref=e115]:
            - generic [ref=e116]: p
            - generic [ref=e117]: r
            - generic [ref=e118]: a
            - generic [ref=e119]: c
            - generic [ref=e120]: t
            - generic [ref=e121]: i
            - generic [ref=e122]: c
            - generic [ref=e123]: e
          - generic [ref=e125]:
            - generic [ref=e126]: s
            - generic [ref=e127]: p
            - generic [ref=e128]: a
            - generic [ref=e129]: c
            - generic [ref=e130]: e
          - generic [ref=e132]:
            - generic [ref=e133]: e
            - generic [ref=e134]: v
            - generic [ref=e135]: e
            - generic [ref=e136]: "n"
          - generic [ref=e138]:
            - generic [ref=e139]: s
            - generic [ref=e140]: h
            - generic [ref=e141]: o
            - generic [ref=e142]: r
            - generic [ref=e143]: e
          - generic [ref=e145]:
            - generic [ref=e146]: g
            - generic [ref=e147]: l
            - generic [ref=e148]: a
            - generic [ref=e149]: s
            - generic [ref=e150]: s
          - generic [ref=e152]:
            - generic [ref=e153]: w
            - generic [ref=e154]: h
            - generic [ref=e155]: e
            - generic [ref=e156]: r
            - generic [ref=e157]: e
          - generic [ref=e159]:
            - generic [ref=e160]: p
            - generic [ref=e161]: a
            - generic [ref=e162]: r
            - generic [ref=e163]: k
          - generic [ref=e165]:
            - generic [ref=e166]: s
            - generic [ref=e167]: e
            - generic [ref=e168]: c
            - generic [ref=e169]: o
            - generic [ref=e170]: "n"
            - generic [ref=e171]: d
          - generic [ref=e173]: i
          - generic [ref=e176]:
            - generic [ref=e177]: s
            - generic [ref=e178]: e
            - generic [ref=e179]: t
          - generic [ref=e181]:
            - generic [ref=e182]: k
            - generic [ref=e183]: "n"
            - generic [ref=e184]: o
            - generic [ref=e185]: w
          - generic [ref=e187]:
            - generic [ref=e188]: g
            - generic [ref=e189]: o
          - generic [ref=e191]:
            - generic [ref=e192]: "n"
            - generic [ref=e193]: o
            - generic [ref=e194]: t
          - generic [ref=e196]:
            - generic [ref=e197]: s
            - generic [ref=e198]: e
            - generic [ref=e199]: a
            - generic [ref=e200]: t
          - generic [ref=e202]:
            - generic [ref=e203]: t
            - generic [ref=e204]: o
            - generic [ref=e205]: "n"
          - generic [ref=e207]:
            - generic [ref=e208]: k
            - generic [ref=e209]: e
            - generic [ref=e210]: e
            - generic [ref=e211]: p
          - generic [ref=e213]:
            - generic [ref=e214]: r
            - generic [ref=e215]: e
            - generic [ref=e216]: t
            - generic [ref=e217]: i
            - generic [ref=e218]: "n"
            - generic [ref=e219]: a
          - generic [ref=e221]:
            - generic [ref=e222]: t
            - generic [ref=e223]: o
            - generic [ref=e224]: p
          - generic [ref=e226]:
            - generic [ref=e227]: r
            - generic [ref=e228]: e
            - generic [ref=e229]: t
            - generic [ref=e230]: a
            - generic [ref=e231]: i
            - generic [ref=e232]: "n"
          - generic [ref=e234]:
            - generic [ref=e235]: m
            - generic [ref=e236]: a
            - generic [ref=e237]: "n"
            - generic [ref=e238]: "y"
          - generic [ref=e240]:
            - generic [ref=e241]: "n"
            - generic [ref=e242]: a
            - generic [ref=e243]: m
            - generic [ref=e244]: e
          - generic [ref=e246]:
            - generic [ref=e247]: r
            - generic [ref=e248]: e
            - generic [ref=e249]: t
            - generic [ref=e250]: i
            - generic [ref=e251]: "n"
            - generic [ref=e252]: a
          - generic [ref=e254]:
            - generic [ref=e255]: j
            - generic [ref=e256]: u
            - generic [ref=e257]: m
            - generic [ref=e258]: p
          - generic [ref=e260]:
            - generic [ref=e261]: r
            - generic [ref=e262]: e
            - generic [ref=e263]: a
            - generic [ref=e264]: d
            - generic [ref=e265]: "y"
          - generic [ref=e267]:
            - generic [ref=e268]: q
            - generic [ref=e269]: u
            - generic [ref=e270]: e
            - generic [ref=e271]: s
            - generic [ref=e272]: t
            - generic [ref=e273]: i
            - generic [ref=e274]: o
            - generic [ref=e275]: "n"
          - generic [ref=e277]:
            - generic [ref=e278]: s
            - generic [ref=e279]: t
            - generic [ref=e280]: e
            - generic [ref=e281]: p
          - generic [ref=e283]:
            - generic [ref=e284]: r
            - generic [ref=e285]: u
            - generic [ref=e286]: "n"
          - generic [ref=e288]:
            - generic [ref=e289]: l
            - generic [ref=e290]: e
            - generic [ref=e291]: f
            - generic [ref=e292]: t
          - generic [ref=e294]:
            - generic [ref=e295]: k
            - generic [ref=e296]: i
            - generic [ref=e297]: "n"
            - generic [ref=e298]: d
          - generic [ref=e300]:
            - generic [ref=e301]: c
            - generic [ref=e302]: o
            - generic [ref=e303]: l
            - generic [ref=e304]: d
          - generic [ref=e306]:
            - generic [ref=e307]: l
            - generic [ref=e308]: e
            - generic [ref=e309]: a
            - generic [ref=e310]: "n"
          - generic [ref=e312]:
            - generic [ref=e313]: t
            - generic [ref=e314]: h
            - generic [ref=e315]: i
            - generic [ref=e316]: "n"
            - generic [ref=e317]: g
          - generic [ref=e319]:
            - generic [ref=e320]: c
            - generic [ref=e321]: o
            - generic [ref=e322]: m
            - generic [ref=e323]: e
          - generic [ref=e325]:
            - generic [ref=e326]: s
            - generic [ref=e327]: o
          - generic [ref=e329]:
            - generic [ref=e330]: t
            - generic [ref=e331]: e
            - generic [ref=e332]: e
            - generic [ref=e333]: "n"
          - generic [ref=e335]:
            - generic [ref=e336]: q
            - generic [ref=e337]: u
            - generic [ref=e338]: e
            - generic [ref=e339]: s
            - generic [ref=e340]: t
            - generic [ref=e341]: i
            - generic [ref=e342]: o
            - generic [ref=e343]: "n"
          - generic [ref=e345]:
            - generic [ref=e346]: s
            - generic [ref=e347]: t
            - generic [ref=e348]: o
            - generic [ref=e349]: "n"
            - generic [ref=e350]: e
          - generic [ref=e352]:
            - generic [ref=e353]: l
            - generic [ref=e354]: i
            - generic [ref=e355]: g
            - generic [ref=e356]: h
            - generic [ref=e357]: t
          - generic [ref=e359]:
            - generic [ref=e360]: m
            - generic [ref=e361]: u
            - generic [ref=e362]: c
            - generic [ref=e363]: h
          - generic [ref=e365]:
            - generic [ref=e366]: r
            - generic [ref=e367]: e
            - generic [ref=e368]: "n"
            - generic [ref=e369]: t
          - generic [ref=e371]:
            - generic [ref=e372]: a
            - generic [ref=e373]: t
            - generic [ref=e374]: t
            - generic [ref=e375]: e
            - generic [ref=e376]: "n"
            - generic [ref=e377]: t
            - generic [ref=e378]: i
            - generic [ref=e379]: o
            - generic [ref=e380]: "n"
          - generic [ref=e382]:
            - generic [ref=e383]: t
            - generic [ref=e384]: h
            - generic [ref=e385]: e
            - generic [ref=e386]: "n"
          - generic [ref=e388]:
            - generic [ref=e389]: g
            - generic [ref=e390]: i
            - generic [ref=e391]: v
            - generic [ref=e392]: e
          - generic [ref=e394]:
            - generic [ref=e395]: b
            - generic [ref=e396]: r
            - generic [ref=e397]: o
            - generic [ref=e398]: w
            - generic [ref=e399]: "n"
          - generic [ref=e401]:
            - generic [ref=e402]: b
            - generic [ref=e403]: r
            - generic [ref=e404]: i
            - generic [ref=e405]: "n"
            - generic [ref=e406]: g
          - generic [ref=e408]:
            - generic [ref=e409]: p
            - generic [ref=e410]: l
            - generic [ref=e411]: a
            - generic [ref=e412]: "n"
          - generic [ref=e414]:
            - generic [ref=e415]: t
            - generic [ref=e416]: h
            - generic [ref=e417]: r
            - generic [ref=e418]: e
            - generic [ref=e419]: e
          - generic [ref=e421]:
            - generic [ref=e422]: h
            - generic [ref=e423]: i
            - generic [ref=e424]: s
          - generic [ref=e426]:
            - generic [ref=e427]: "n"
            - generic [ref=e428]: e
            - generic [ref=e429]: e
            - generic [ref=e430]: d
          - generic [ref=e432]:
            - generic [ref=e433]: r
            - generic [ref=e434]: e
            - generic [ref=e435]: t
            - generic [ref=e436]: i
            - generic [ref=e437]: "n"
            - generic [ref=e438]: a
          - generic [ref=e440]:
            - generic [ref=e441]: h
            - generic [ref=e442]: a
            - generic [ref=e443]: s
          - generic [ref=e445]:
            - generic [ref=e446]: h
            - generic [ref=e447]: e
            - generic [ref=e448]: a
            - generic [ref=e449]: r
            - generic [ref=e450]: t
          - generic [ref=e452]:
            - generic [ref=e453]: d
            - generic [ref=e454]: e
            - generic [ref=e455]: e
            - generic [ref=e456]: p
          - generic [ref=e458]:
            - generic [ref=e459]: o
            - generic [ref=e460]: v
            - generic [ref=e461]: e
            - generic [ref=e462]: r
          - generic [ref=e464]:
            - generic [ref=e465]: w
            - generic [ref=e466]: h
            - generic [ref=e467]: a
            - generic [ref=e468]: t
          - generic [ref=e470]: a
          - generic [ref=e473]:
            - generic [ref=e474]: o
            - generic [ref=e475]: f
            - generic [ref=e476]: t
            - generic [ref=e477]: e
            - generic [ref=e478]: "n"
          - generic [ref=e480]:
            - generic [ref=e481]: h
            - generic [ref=e482]: e
          - generic [ref=e484]:
            - generic [ref=e485]: e
            - generic [ref=e486]: a
            - generic [ref=e487]: r
            - generic [ref=e488]: t
            - generic [ref=e489]: h
          - generic [ref=e491]:
            - generic [ref=e492]: h
            - generic [ref=e493]: e
            - generic [ref=e494]: a
            - generic [ref=e495]: r
            - generic [ref=e496]: t
          - generic [ref=e498]:
            - generic [ref=e499]: s
            - generic [ref=e500]: m
            - generic [ref=e501]: a
            - generic [ref=e502]: l
            - generic [ref=e503]: l
          - generic [ref=e505]:
            - generic [ref=e506]: w
            - generic [ref=e507]: o
            - generic [ref=e508]: r
            - generic [ref=e509]: d
          - generic [ref=e511]:
            - generic [ref=e512]: l
            - generic [ref=e513]: e
            - generic [ref=e514]: a
            - generic [ref=e515]: r
            - generic [ref=e516]: "n"
          - generic [ref=e518]:
            - generic [ref=e519]: t
            - generic [ref=e520]: h
            - generic [ref=e521]: o
            - generic [ref=e522]: u
            - generic [ref=e523]: g
            - generic [ref=e524]: h
          - generic [ref=e526]:
            - generic [ref=e527]: r
            - generic [ref=e528]: e
            - generic [ref=e529]: a
            - generic [ref=e530]: d
          - generic [ref=e532]:
            - generic [ref=e533]: m
            - generic [ref=e534]: e
          - generic [ref=e536]:
            - generic [ref=e537]: "n"
            - generic [ref=e538]: a
            - generic [ref=e539]: t
            - generic [ref=e540]: u
            - generic [ref=e541]: r
            - generic [ref=e542]: e
          - generic [ref=e544]:
            - generic [ref=e545]: g
            - generic [ref=e546]: o
          - generic [ref=e548]:
            - generic [ref=e549]: g
            - generic [ref=e550]: o
            - generic [ref=e551]: l
            - generic [ref=e552]: d
          - generic [ref=e554]:
            - generic [ref=e555]: s
            - generic [ref=e556]: i
            - generic [ref=e557]: d
            - generic [ref=e558]: e
          - generic [ref=e560]:
            - generic [ref=e561]: s
            - generic [ref=e562]: o
            - generic [ref=e563]: u
            - generic [ref=e564]: t
            - generic [ref=e565]: h
          - generic [ref=e567]:
            - generic [ref=e568]: f
            - generic [ref=e569]: e
            - generic [ref=e570]: e
            - generic [ref=e571]: l
          - generic [ref=e573]:
            - generic [ref=e574]: o
            - generic [ref=e575]: u
            - generic [ref=e576]: t
          - generic [ref=e578]:
            - generic [ref=e579]: r
            - generic [ref=e580]: a
            - generic [ref=e581]: i
            - generic [ref=e582]: s
            - generic [ref=e583]: e
          - generic [ref=e585]:
            - generic [ref=e586]: t
            - generic [ref=e587]: h
            - generic [ref=e588]: o
            - generic [ref=e589]: u
            - generic [ref=e590]: g
            - generic [ref=e591]: h
            - generic [ref=e592]: t
          - generic [ref=e594]:
            - generic [ref=e595]: c
            - generic [ref=e596]: o
            - generic [ref=e597]: m
            - generic [ref=e598]: e
          - generic [ref=e600]:
            - generic [ref=e601]: f
            - generic [ref=e602]: i
            - generic [ref=e603]: v
            - generic [ref=e604]: e
          - generic [ref=e606]:
            - generic [ref=e607]: m
            - generic [ref=e608]: u
            - generic [ref=e609]: c
            - generic [ref=e610]: h
          - generic [ref=e612]:
            - generic [ref=e613]: h
            - generic [ref=e614]: o
            - generic [ref=e615]: w
          - generic [ref=e617]:
            - generic [ref=e618]: s
            - generic [ref=e619]: h
            - generic [ref=e620]: a
            - generic [ref=e621]: r
            - generic [ref=e622]: e
          - generic [ref=e624]:
            - generic [ref=e625]: w
            - generic [ref=e626]: i
            - generic [ref=e627]: t
            - generic [ref=e628]: h
          - generic [ref=e630]:
            - generic [ref=e631]: r
            - generic [ref=e632]: a
            - generic [ref=e633]: t
            - generic [ref=e634]: e
          - generic [ref=e636]:
            - generic [ref=e637]: k
            - generic [ref=e638]: "n"
            - generic [ref=e639]: o
            - generic [ref=e640]: w
          - generic [ref=e642]:
            - generic [ref=e643]: s
            - generic [ref=e644]: h
            - generic [ref=e645]: a
            - generic [ref=e646]: r
            - generic [ref=e647]: e
          - generic [ref=e649]:
            - generic [ref=e650]: s
            - generic [ref=e651]: "n"
            - generic [ref=e652]: o
            - generic [ref=e653]: w
          - generic [ref=e655]:
            - generic [ref=e656]: r
            - generic [ref=e657]: a
            - generic [ref=e658]: c
            - generic [ref=e659]: e
          - generic [ref=e661]:
            - generic [ref=e662]: s
            - generic [ref=e663]: h
            - generic [ref=e664]: o
            - generic [ref=e665]: w
          - generic [ref=e667]:
            - generic [ref=e668]: c
            - generic [ref=e669]: a
            - generic [ref=e670]: "n"
          - generic [ref=e672]:
            - generic [ref=e673]: "n"
            - generic [ref=e674]: o
          - generic [ref=e676]:
            - generic [ref=e677]: p
            - generic [ref=e678]: a
            - generic [ref=e679]: i
            - generic [ref=e680]: "n"
            - generic [ref=e681]: t
          - generic [ref=e683]:
            - generic [ref=e684]: v
            - generic [ref=e685]: e
            - generic [ref=e686]: r
            - generic [ref=e687]: "y"
          - generic [ref=e689]:
            - generic [ref=e690]: "y"
            - generic [ref=e691]: o
            - generic [ref=e692]: u
            - generic [ref=e693]: "n"
            - generic [ref=e694]: g
          - generic [ref=e696]:
            - generic [ref=e697]: s
            - generic [ref=e698]: o
            - generic [ref=e699]: o
            - generic [ref=e700]: t
          - generic [ref=e702]:
            - generic [ref=e703]: "n"
            - generic [ref=e704]: e
            - generic [ref=e705]: a
            - generic [ref=e706]: r
          - generic [ref=e708]:
            - generic [ref=e709]: s
            - generic [ref=e710]: h
            - generic [ref=e711]: e
          - generic [ref=e713]:
            - generic [ref=e714]: h
            - generic [ref=e715]: e
          - generic [ref=e717]:
            - generic [ref=e718]: t
            - generic [ref=e719]: w
            - generic [ref=e720]: o
          - generic [ref=e722]:
            - generic [ref=e723]: k
            - generic [ref=e724]: "n"
            - generic [ref=e725]: o
            - generic [ref=e726]: w
          - generic [ref=e728]:
            - generic [ref=e729]: s
            - generic [ref=e730]: a
            - generic [ref=e731]: v
            - generic [ref=e732]: e
          - generic [ref=e734]:
            - generic [ref=e735]: "n"
            - generic [ref=e736]: e
            - generic [ref=e737]: a
            - generic [ref=e738]: t
          - generic [ref=e740]:
            - generic [ref=e741]: u
            - generic [ref=e742]: "n"
            - generic [ref=e743]: d
            - generic [ref=e744]: e
            - generic [ref=e745]: r
          - generic [ref=e747]:
            - generic [ref=e748]: w
            - generic [ref=e749]: o
            - generic [ref=e750]: r
            - generic [ref=e751]: k
          - generic [ref=e753]:
            - generic [ref=e754]: "n"
            - generic [ref=e755]: o
            - generic [ref=e756]: "n"
            - generic [ref=e757]: e
          - generic [ref=e759]:
            - generic [ref=e760]: "n"
            - generic [ref=e761]: e
            - generic [ref=e762]: s
            - generic [ref=e763]: t
          - generic [ref=e765]:
            - generic [ref=e766]: r
            - generic [ref=e767]: e
            - generic [ref=e768]: a
            - generic [ref=e769]: d
            - generic [ref=e770]: "y"
          - generic [ref=e772]:
            - generic [ref=e773]: f
            - generic [ref=e774]: i
            - generic [ref=e775]: v
            - generic [ref=e776]: e
          - generic [ref=e778]:
            - generic [ref=e779]: h
            - generic [ref=e780]: o
            - generic [ref=e781]: m
            - generic [ref=e782]: e
          - generic [ref=e784]:
            - generic [ref=e785]: p
            - generic [ref=e786]: e
            - generic [ref=e787]: o
            - generic [ref=e788]: p
            - generic [ref=e789]: l
            - generic [ref=e790]: e
          - generic [ref=e792]:
            - generic [ref=e793]: w
            - generic [ref=e794]: o
            - generic [ref=e795]: r
            - generic [ref=e796]: l
            - generic [ref=e797]: d
          - generic [ref=e799]:
            - generic [ref=e800]: "n"
            - generic [ref=e801]: e
            - generic [ref=e802]: a
            - generic [ref=e803]: r
          - generic [ref=e805]:
            - generic [ref=e806]: g
            - generic [ref=e807]: o
            - generic [ref=e808]: o
            - generic [ref=e809]: d
          - generic [ref=e811]:
            - generic [ref=e812]: g
            - generic [ref=e813]: o
            - generic [ref=e814]: o
            - generic [ref=e815]: d
          - generic [ref=e817]:
            - generic [ref=e818]: c
            - generic [ref=e819]: o
            - generic [ref=e820]: l
            - generic [ref=e821]: d
          - generic [ref=e823]:
            - generic [ref=e824]: m
            - generic [ref=e825]: e
          - generic [ref=e827]:
            - generic [ref=e828]: t
            - generic [ref=e829]: h
            - generic [ref=e830]: e
            - generic [ref=e831]: "n"
          - generic [ref=e833]:
            - generic [ref=e834]: v
            - generic [ref=e835]: o
            - generic [ref=e836]: i
            - generic [ref=e837]: c
            - generic [ref=e838]: e
          - generic [ref=e840]:
            - generic [ref=e841]: o
            - generic [ref=e842]: f
            - generic [ref=e843]: f
          - generic [ref=e845]:
            - generic [ref=e846]: "y"
            - generic [ref=e847]: o
            - generic [ref=e848]: u
            - generic [ref=e849]: r
          - generic [ref=e851]:
            - generic [ref=e852]: "n"
            - generic [ref=e853]: o
            - generic [ref=e854]: w
        - paragraph [ref=e855]: "Practice passage: shore practice space even shore glass where park second i set know go not seat ton keep retina top retain many name retina jump ready question step run left kind cold lean thing come so teen question stone light much rent attention then give brown bring plan three his need retina has heart deep over what a often he earth heart small word learn though read me nature go gold side south feel out raise thought come five much how share with rate know share snow race show can no paint very young soot near she he two know save neat under work none nest ready five home people world near good good cold me then voice off your now"
        - textbox "Typing input" [active] [ref=e856]
      - generic [ref=e858]:
        - paragraph [ref=e859]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e860]
      - generic [ref=e861]:
        - paragraph [ref=e862]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e863]:
          - button "Restart with new text" [ref=e864]
          - button "Show accessible text editor" [ref=e868]
          - button "Finish" [disabled] [ref=e872]
      - status [ref=e875]: Ready to type
  - contentinfo [ref=e876]:
    - generic [ref=e877]:
      - generic [ref=e878]: A little practice. Lasting progress.
      - generic [ref=e881]:
        - link "About & metrics" [ref=e882]:
          - /url: /about
        - link "Preferences & data" [ref=e883]:
          - /url: /settings
        - generic [ref=e884]: Typing Forge © 2026
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { completeCorrectedCat, focusTyping } from "./helpers";
  3   | 
  4   | async function expectPageFits(page: Page) {
  5   |   await page.locator("#main-content").waitFor();
  6   |   await page.evaluate(async () => { await document.fonts.ready; });
  7   |   const dimensions = await page.evaluate(() => ({
  8   |     viewport: document.documentElement.clientWidth,
  9   |     document: document.documentElement.scrollWidth,
  10  |     body: document.body.scrollWidth,
  11  |     offenders: Array.from(document.querySelectorAll("main, header, footer"))
  12  |       .filter((element) => {
  13  |         const rect = element.getBoundingClientRect();
  14  |         return rect.left < -1 || rect.right > innerWidth + 1;
  15  |       })
  16  |       .map((element) => element.tagName),
  17  |   }));
> 18  |   expect(dimensions, await page.url()).toMatchObject({
      |                                        ^ Error: http://127.0.0.1:4173/
  19  |     document: dimensions.viewport,
  20  |     body: dimensions.viewport,
  21  |     offenders: [],
  22  |   });
  23  | }
  24  | 
  25  | for (const width of [320, 390, 768, 1440]) {
  26  |   test(`main local pages fit a ${width}px viewport`, async ({ page }) => {
  27  |     test.setTimeout(90_000);
  28  |     await page.setViewportSize({ width, height: 900 });
  29  |     for (const route of [
  30  |       "/", "/learn", "/race", "/stats", "/settings", "/keyboard-lab",
  31  |       "/leaderboard", "/ranked", "/profile", "/auth", "/about",
  32  |     ]) {
  33  |       await test.step(route, async () => {
  34  |         await page.goto(route);
  35  |         await expectPageFits(page);
  36  |       });
  37  |     }
  38  |   });
  39  | }
  40  | 
  41  | test("every theme provides opaque, readable native language options", async ({ page }) => {
  42  |   test.setTimeout(180_000);
  43  |   for (const [id, name, scheme] of [
  44  |     ["forge-dark", "Forge dark", "dark"],
  45  |     ["forge-light", "Forge light", "light"],
  46  |     ["graphite", "Graphite", "dark"],
  47  |     ["midnight-blue", "Midnight blue", "dark"],
  48  |     ["ember", "Ember", "dark"],
  49  |     ["mono-ink", "Mono ink", "dark"],
  50  |     ["paper", "Paper", "light"],
  51  |     ["aurora", "Aurora", "dark"],
  52  |   ]) {
  53  |     await page.goto("/settings");
  54  |     await page.getByRole("button", { name, exact: false }).click();
  55  |     await expect(page.locator("html")).toHaveAttribute("data-theme", id);
  56  |     await page.goto("/");
  57  |     const select = page.getByRole("combobox", { name: "Language", exact: true });
  58  |     await expect(select).toBeVisible();
  59  |     const menu = await select.evaluate((element) => {
  60  |       const control = element as HTMLSelectElement;
  61  |       const option = getComputedStyle(control.options[1]);
  62  |       const components = (color: string) => color.match(/[\d.]+/g)!.map(Number);
  63  |       const luminance = (color: string) => components(color).slice(0, 3)
  64  |         .map((value) => value / 255)
  65  |         .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  66  |         .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  67  |       const foreground = luminance(option.color);
  68  |       const background = luminance(option.backgroundColor);
  69  |       return {
  70  |         scheme: getComputedStyle(control).colorScheme,
  71  |         background: components(option.backgroundColor),
  72  |         contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
  73  |       };
  74  |     });
  75  |     expect(menu.scheme, name).toBe(scheme);
  76  |     expect(menu.background[3] ?? 1, name).toBe(1);
  77  |     expect(menu.contrast, name).toBeGreaterThanOrEqual(4.5);
  78  |   }
  79  |   // Native keyboard selection still changes the content and survives reload.
  80  |   const select = page.getByRole("combobox", { name: "Language", exact: true });
  81  |   await select.focus();
  82  |   await select.press("Home");
  83  |   await select.press("ArrowDown");
  84  |   await select.press("Enter");
  85  |   await expect(select).toHaveValue("es");
  86  |   await page.reload();
  87  |   await expect(select).toHaveValue("es");
  88  | });
  89  | 
  90  | test("small-screen test controls wrap in all six modes and keep select targets usable", async ({ page }, info) => {
  91  |   test.setTimeout(90_000);
  92  |   await page.setViewportSize({ width: 320, height: 568 });
  93  |   await page.goto("/");
  94  |   for (const mode of ["Time", "Words", "Quote", "Code", "Custom", "Zen"]) {
  95  |     await page.getByRole("group", { name: "Test mode", exact: true })
  96  |       .getByRole("button", { name: mode, exact: true }).click();
  97  |     await expectPageFits(page);
  98  |     const toolbar = page.getByRole("region", { name: "Test configuration" });
  99  |     for (const control of await toolbar.locator("button, select").all()) {
  100 |       const rect = await control.boundingBox();
  101 |       expect(rect).not.toBeNull();
  102 |       expect(rect!.height).toBeGreaterThanOrEqual(44);
  103 |       expect(rect!.x).toBeGreaterThanOrEqual(0);
  104 |       expect(rect!.x + rect!.width).toBeLessThanOrEqual(321);
  105 |     }
  106 |     if (mode === "Code") {
  107 |       await page.getByRole("combobox", { name: "Code language" }).selectOption("python");
  108 |       await page.screenshot({ path: `audit/responsive-2026-10-16/code-320-${info.project.name}.png`, fullPage: true });
  109 |     }
  110 |   }
  111 |   await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("gu-Latn");
  112 |   await expectPageFits(page);
  113 | });
  114 | 
  115 | test("narrow results retain the whole keyboard map and expanded evidence", async ({ page }, info) => {
  116 |   test.setTimeout(90_000);
  117 |   await page.setViewportSize({ width: 320, height: 760 });
  118 |   await completeCorrectedCat(page);
```