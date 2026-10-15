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
            - generic [ref=e110]: o
            - generic [ref=e111]: f
            - generic [ref=e112]: t
          - generic [ref=e114]:
            - generic [ref=e115]: c
            - generic [ref=e116]: o
            - generic [ref=e117]: l
            - generic [ref=e118]: d
          - generic [ref=e120]:
            - generic [ref=e121]: s
            - generic [ref=e122]: e
            - generic [ref=e123]: a
          - generic [ref=e125]:
            - generic [ref=e126]: s
            - generic [ref=e127]: e
            - generic [ref=e128]: e
          - generic [ref=e130]:
            - generic [ref=e131]: k
            - generic [ref=e132]: i
            - generic [ref=e133]: "n"
            - generic [ref=e134]: d
          - generic [ref=e136]:
            - generic [ref=e137]: w
            - generic [ref=e138]: h
            - generic [ref=e139]: "y"
          - generic [ref=e141]:
            - generic [ref=e142]: o
            - generic [ref=e143]: w
            - generic [ref=e144]: "n"
          - generic [ref=e146]:
            - generic [ref=e147]: s
            - generic [ref=e148]: p
            - generic [ref=e149]: e
            - generic [ref=e150]: a
            - generic [ref=e151]: k
          - generic [ref=e153]:
            - generic [ref=e154]: f
            - generic [ref=e155]: a
            - generic [ref=e156]: c
            - generic [ref=e157]: e
          - generic [ref=e159]:
            - generic [ref=e160]: s
            - generic [ref=e161]: o
          - generic [ref=e163]:
            - generic [ref=e164]: e
            - generic [ref=e165]: v
            - generic [ref=e166]: e
            - generic [ref=e167]: "n"
          - generic [ref=e169]:
            - generic [ref=e170]: t
            - generic [ref=e171]: i
            - generic [ref=e172]: e
            - generic [ref=e173]: r
          - generic [ref=e175]:
            - generic [ref=e176]: z
            - generic [ref=e177]: o
            - generic [ref=e178]: "n"
            - generic [ref=e179]: e
          - generic [ref=e181]:
            - generic [ref=e182]: j
            - generic [ref=e183]: u
            - generic [ref=e184]: s
            - generic [ref=e185]: t
          - generic [ref=e187]:
            - generic [ref=e188]: "n"
            - generic [ref=e189]: o
            - generic [ref=e190]: t
          - generic [ref=e192]:
            - generic [ref=e193]: r
            - generic [ref=e194]: i
            - generic [ref=e195]: o
            - generic [ref=e196]: t
          - generic [ref=e198]:
            - generic [ref=e199]: w
            - generic [ref=e200]: o
            - generic [ref=e201]: r
            - generic [ref=e202]: d
          - generic [ref=e204]:
            - generic [ref=e205]: c
            - generic [ref=e206]: o
            - generic [ref=e207]: m
            - generic [ref=e208]: e
          - generic [ref=e210]:
            - generic [ref=e211]: a
            - generic [ref=e212]: r
            - generic [ref=e213]: e
          - generic [ref=e215]:
            - generic [ref=e216]: a
            - generic [ref=e217]: t
          - generic [ref=e219]:
            - generic [ref=e220]: p
            - generic [ref=e221]: l
            - generic [ref=e222]: a
            - generic [ref=e223]: i
            - generic [ref=e224]: "n"
          - generic [ref=e226]:
            - generic [ref=e227]: s
            - generic [ref=e228]: a
            - generic [ref=e229]: "y"
          - generic [ref=e231]:
            - generic [ref=e232]: b
            - generic [ref=e233]: r
            - generic [ref=e234]: i
            - generic [ref=e235]: g
            - generic [ref=e236]: h
            - generic [ref=e237]: t
          - generic [ref=e239]:
            - generic [ref=e240]: o
            - generic [ref=e241]: u
            - generic [ref=e242]: t
          - generic [ref=e244]:
            - generic [ref=e245]: m
            - generic [ref=e246]: e
          - generic [ref=e248]:
            - generic [ref=e249]: "n"
            - generic [ref=e250]: i
            - generic [ref=e251]: g
            - generic [ref=e252]: h
            - generic [ref=e253]: t
          - generic [ref=e255]:
            - generic [ref=e256]: z
            - generic [ref=e257]: i
            - generic [ref=e258]: "n"
            - generic [ref=e259]: c
          - generic [ref=e261]:
            - generic [ref=e262]: p
            - generic [ref=e263]: a
            - generic [ref=e264]: i
            - generic [ref=e265]: r
          - generic [ref=e267]:
            - generic [ref=e268]: w
            - generic [ref=e269]: a
            - generic [ref=e270]: t
            - generic [ref=e271]: c
            - generic [ref=e272]: h
          - generic [ref=e274]:
            - generic [ref=e275]: f
            - generic [ref=e276]: a
            - generic [ref=e277]: s
            - generic [ref=e278]: t
          - generic [ref=e280]:
            - generic [ref=e281]: l
            - generic [ref=e282]: e
            - generic [ref=e283]: t
          - generic [ref=e285]:
            - generic [ref=e286]: s
            - generic [ref=e287]: h
            - generic [ref=e288]: a
            - generic [ref=e289]: p
            - generic [ref=e290]: e
          - generic [ref=e292]:
            - generic [ref=e293]: w
            - generic [ref=e294]: o
            - generic [ref=e295]: r
            - generic [ref=e296]: l
            - generic [ref=e297]: d
          - generic [ref=e299]:
            - generic [ref=e300]: b
            - generic [ref=e301]: r
            - generic [ref=e302]: i
            - generic [ref=e303]: "n"
            - generic [ref=e304]: g
          - generic [ref=e306]:
            - generic [ref=e307]: t
            - generic [ref=e308]: h
            - generic [ref=e309]: a
            - generic [ref=e310]: t
          - generic [ref=e312]:
            - generic [ref=e313]: s
            - generic [ref=e314]: e
            - generic [ref=e315]: c
            - generic [ref=e316]: o
            - generic [ref=e317]: "n"
            - generic [ref=e318]: d
          - generic [ref=e320]:
            - generic [ref=e321]: f
            - generic [ref=e322]: l
            - generic [ref=e323]: o
            - generic [ref=e324]: w
          - generic [ref=e326]:
            - generic [ref=e327]: f
            - generic [ref=e328]: r
            - generic [ref=e329]: e
            - generic [ref=e330]: e
          - generic [ref=e332]:
            - generic [ref=e333]: e
            - generic [ref=e334]: a
            - generic [ref=e335]: t
          - generic [ref=e337]:
            - generic [ref=e338]: t
            - generic [ref=e339]: h
            - generic [ref=e340]: e
            - generic [ref=e341]: r
            - generic [ref=e342]: e
          - generic [ref=e344]:
            - generic [ref=e345]: c
            - generic [ref=e346]: a
            - generic [ref=e347]: "n"
          - generic [ref=e349]:
            - generic [ref=e350]: l
            - generic [ref=e351]: a
            - generic [ref=e352]: "n"
            - generic [ref=e353]: d
          - generic [ref=e355]:
            - generic [ref=e356]: z
            - generic [ref=e357]: i
            - generic [ref=e358]: "n"
            - generic [ref=e359]: c
          - generic [ref=e361]:
            - generic [ref=e362]: e
            - generic [ref=e363]: a
            - generic [ref=e364]: r
            - generic [ref=e365]: l
            - generic [ref=e366]: "y"
          - generic [ref=e368]:
            - generic [ref=e369]: "n"
            - generic [ref=e370]: e
            - generic [ref=e371]: o
            - generic [ref=e372]: "n"
          - generic [ref=e374]:
            - generic [ref=e375]: h
            - generic [ref=e376]: e
            - generic [ref=e377]: r
            - generic [ref=e378]: e
          - generic [ref=e380]:
            - generic [ref=e381]: e
            - generic [ref=e382]: "n"
            - generic [ref=e383]: d
          - generic [ref=e385]:
            - generic [ref=e386]: t
            - generic [ref=e387]: e
            - generic [ref=e388]: r
            - generic [ref=e389]: r
            - generic [ref=e390]: a
            - generic [ref=e391]: i
            - generic [ref=e392]: "n"
          - generic [ref=e394]:
            - generic [ref=e395]: q
            - generic [ref=e396]: u
            - generic [ref=e397]: i
            - generic [ref=e398]: c
            - generic [ref=e399]: k
          - generic [ref=e401]:
            - generic [ref=e402]: t
            - generic [ref=e403]: i
            - generic [ref=e404]: m
            - generic [ref=e405]: e
          - generic [ref=e407]:
            - generic [ref=e408]: s
            - generic [ref=e409]: t
            - generic [ref=e410]: i
            - generic [ref=e411]: l
            - generic [ref=e412]: l
          - generic [ref=e414]:
            - generic [ref=e415]: "n"
            - generic [ref=e416]: o
            - generic [ref=e417]: w
          - generic [ref=e419]:
            - generic [ref=e420]: s
            - generic [ref=e421]: t
            - generic [ref=e422]: o
            - generic [ref=e423]: r
            - generic [ref=e424]: e
          - generic [ref=e426]:
            - generic [ref=e427]: l
            - generic [ref=e428]: o
            - generic [ref=e429]: "n"
            - generic [ref=e430]: g
          - generic [ref=e432]:
            - generic [ref=e433]: u
            - generic [ref=e434]: p
          - generic [ref=e436]:
            - generic [ref=e437]: c
            - generic [ref=e438]: a
            - generic [ref=e439]: "n"
          - generic [ref=e441]:
            - generic [ref=e442]: w
            - generic [ref=e443]: h
            - generic [ref=e444]: i
            - generic [ref=e445]: t
            - generic [ref=e446]: e
          - generic [ref=e448]:
            - generic [ref=e449]: k
            - generic [ref=e450]: e
            - generic [ref=e451]: e
            - generic [ref=e452]: "n"
          - generic [ref=e454]:
            - generic [ref=e455]: o
            - generic [ref=e456]: "n"
            - generic [ref=e457]: i
            - generic [ref=e458]: o
            - generic [ref=e459]: "n"
          - generic [ref=e461]:
            - generic [ref=e462]: p
            - generic [ref=e463]: o
            - generic [ref=e464]: w
            - generic [ref=e465]: e
            - generic [ref=e466]: r
          - generic [ref=e468]:
            - generic [ref=e469]: "n"
            - generic [ref=e470]: o
            - generic [ref=e471]: "n"
            - generic [ref=e472]: e
          - generic [ref=e474]:
            - generic [ref=e475]: v
            - generic [ref=e476]: i
            - generic [ref=e477]: e
            - generic [ref=e478]: w
          - generic [ref=e480]:
            - generic [ref=e481]: f
            - generic [ref=e482]: u
            - generic [ref=e483]: "n"
          - generic [ref=e485]:
            - generic [ref=e486]: s
            - generic [ref=e487]: e
            - generic [ref=e488]: "n"
            - generic [ref=e489]: t
          - generic [ref=e491]:
            - generic [ref=e492]: t
            - generic [ref=e493]: h
            - generic [ref=e494]: r
            - generic [ref=e495]: o
            - generic [ref=e496]: u
            - generic [ref=e497]: g
            - generic [ref=e498]: h
          - generic [ref=e500]:
            - generic [ref=e501]: o
            - generic [ref=e502]: a
            - generic [ref=e503]: t
          - generic [ref=e505]:
            - generic [ref=e506]: w
            - generic [ref=e507]: i
            - generic [ref=e508]: "n"
            - generic [ref=e509]: d
            - generic [ref=e510]: o
            - generic [ref=e511]: w
          - generic [ref=e513]:
            - generic [ref=e514]: l
            - generic [ref=e515]: e
            - generic [ref=e516]: t
            - generic [ref=e517]: t
            - generic [ref=e518]: e
            - generic [ref=e519]: r
          - generic [ref=e521]:
            - generic [ref=e522]: t
            - generic [ref=e523]: h
            - generic [ref=e524]: a
            - generic [ref=e525]: t
          - generic [ref=e527]:
            - generic [ref=e528]: "n"
            - generic [ref=e529]: e
            - generic [ref=e530]: s
            - generic [ref=e531]: t
          - generic [ref=e533]:
            - generic [ref=e534]: w
            - generic [ref=e535]: h
            - generic [ref=e536]: a
            - generic [ref=e537]: t
          - generic [ref=e539]:
            - generic [ref=e540]: "n"
            - generic [ref=e541]: a
            - generic [ref=e542]: t
            - generic [ref=e543]: i
            - generic [ref=e544]: o
            - generic [ref=e545]: "n"
          - generic [ref=e547]:
            - generic [ref=e548]: t
            - generic [ref=e549]: i
            - generic [ref=e550]: m
            - generic [ref=e551]: e
          - generic [ref=e553]:
            - generic [ref=e554]: t
            - generic [ref=e555]: a
            - generic [ref=e556]: l
            - generic [ref=e557]: k
          - generic [ref=e559]:
            - generic [ref=e560]: s
            - generic [ref=e561]: h
            - generic [ref=e562]: e
          - generic [ref=e564]:
            - generic [ref=e565]: t
            - generic [ref=e566]: r
            - generic [ref=e567]: u
            - generic [ref=e568]: e
          - generic [ref=e570]:
            - generic [ref=e571]: c
            - generic [ref=e572]: o
            - generic [ref=e573]: m
            - generic [ref=e574]: e
          - generic [ref=e576]:
            - generic [ref=e577]: k
            - generic [ref=e578]: "n"
            - generic [ref=e579]: o
            - generic [ref=e580]: w
          - generic [ref=e582]:
            - generic [ref=e583]: r
            - generic [ref=e584]: o
            - generic [ref=e585]: o
            - generic [ref=e586]: m
          - generic [ref=e588]:
            - generic [ref=e589]: c
            - generic [ref=e590]: a
            - generic [ref=e591]: "n"
          - generic [ref=e593]:
            - generic [ref=e594]: s
            - generic [ref=e595]: o
            - generic [ref=e596]: r
            - generic [ref=e597]: t
          - generic [ref=e599]:
            - generic [ref=e600]: t
            - generic [ref=e601]: r
            - generic [ref=e602]: a
            - generic [ref=e603]: i
            - generic [ref=e604]: "n"
          - generic [ref=e606]:
            - generic [ref=e607]: s
            - generic [ref=e608]: h
            - generic [ref=e609]: i
            - generic [ref=e610]: "n"
            - generic [ref=e611]: e
          - generic [ref=e613]:
            - generic [ref=e614]: e
            - generic [ref=e615]: v
            - generic [ref=e616]: e
            - generic [ref=e617]: r
            - generic [ref=e618]: "y"
          - generic [ref=e620]:
            - generic [ref=e621]: l
            - generic [ref=e622]: i
            - generic [ref=e623]: "n"
            - generic [ref=e624]: e
          - generic [ref=e626]:
            - generic [ref=e627]: e
            - generic [ref=e628]: v
            - generic [ref=e629]: e
            - generic [ref=e630]: "n"
          - generic [ref=e632]:
            - generic [ref=e633]: p
            - generic [ref=e634]: o
            - generic [ref=e635]: i
            - generic [ref=e636]: "n"
            - generic [ref=e637]: t
          - generic [ref=e639]:
            - generic [ref=e640]: s
            - generic [ref=e641]: a
            - generic [ref=e642]: m
            - generic [ref=e643]: e
          - generic [ref=e645]:
            - generic [ref=e646]: s
            - generic [ref=e647]: m
            - generic [ref=e648]: a
            - generic [ref=e649]: l
            - generic [ref=e650]: l
          - generic [ref=e652]:
            - generic [ref=e653]: p
            - generic [ref=e654]: l
            - generic [ref=e655]: a
            - generic [ref=e656]: i
            - generic [ref=e657]: "n"
          - generic [ref=e659]:
            - generic [ref=e660]: j
            - generic [ref=e661]: o
            - generic [ref=e662]: "y"
          - generic [ref=e664]:
            - generic [ref=e665]: s
            - generic [ref=e666]: u
            - generic [ref=e667]: r
            - generic [ref=e668]: e
          - generic [ref=e670]:
            - generic [ref=e671]: s
            - generic [ref=e672]: e
            - generic [ref=e673]: e
            - generic [ref=e674]: "n"
          - generic [ref=e676]:
            - generic [ref=e677]: s
            - generic [ref=e678]: p
            - generic [ref=e679]: e
            - generic [ref=e680]: a
            - generic [ref=e681]: k
          - generic [ref=e683]:
            - generic [ref=e684]: s
            - generic [ref=e685]: i
            - generic [ref=e686]: m
            - generic [ref=e687]: p
            - generic [ref=e688]: l
            - generic [ref=e689]: e
          - generic [ref=e691]:
            - generic [ref=e692]: "n"
            - generic [ref=e693]: a
            - generic [ref=e694]: t
            - generic [ref=e695]: u
            - generic [ref=e696]: r
            - generic [ref=e697]: e
          - generic [ref=e699]:
            - generic [ref=e700]: t
            - generic [ref=e701]: h
            - generic [ref=e702]: o
            - generic [ref=e703]: u
            - generic [ref=e704]: g
            - generic [ref=e705]: h
          - generic [ref=e707]:
            - generic [ref=e708]: f
            - generic [ref=e709]: i
            - generic [ref=e710]: "n"
            - generic [ref=e711]: e
          - generic [ref=e713]:
            - generic [ref=e714]: t
            - generic [ref=e715]: e
            - generic [ref=e716]: a
            - generic [ref=e717]: r
          - generic [ref=e719]:
            - generic [ref=e720]: e
            - generic [ref=e721]: a
            - generic [ref=e722]: s
            - generic [ref=e723]: e
          - generic [ref=e725]:
            - generic [ref=e726]: "n"
            - generic [ref=e727]: o
            - generic [ref=e728]: r
            - generic [ref=e729]: t
            - generic [ref=e730]: h
          - generic [ref=e732]:
            - generic [ref=e733]: u
            - generic [ref=e734]: "n"
            - generic [ref=e735]: d
            - generic [ref=e736]: e
            - generic [ref=e737]: r
          - generic [ref=e739]:
            - generic [ref=e740]: e
            - generic [ref=e741]: v
            - generic [ref=e742]: e
            - generic [ref=e743]: r
            - generic [ref=e744]: "y"
          - generic [ref=e746]:
            - generic [ref=e747]: t
            - generic [ref=e748]: a
            - generic [ref=e749]: "n"
          - generic [ref=e751]:
            - generic [ref=e752]: r
            - generic [ref=e753]: a
            - generic [ref=e754]: i
            - generic [ref=e755]: s
            - generic [ref=e756]: e
          - generic [ref=e758]:
            - generic [ref=e759]: l
            - generic [ref=e760]: o
            - generic [ref=e761]: w
          - generic [ref=e763]:
            - generic [ref=e764]: c
            - generic [ref=e765]: o
            - generic [ref=e766]: l
            - generic [ref=e767]: d
          - generic [ref=e769]:
            - generic [ref=e770]: t
            - generic [ref=e771]: h
            - generic [ref=e772]: i
            - generic [ref=e773]: "n"
            - generic [ref=e774]: k
          - generic [ref=e776]:
            - generic [ref=e777]: g
            - generic [ref=e778]: r
            - generic [ref=e779]: e
            - generic [ref=e780]: e
            - generic [ref=e781]: "n"
          - generic [ref=e783]:
            - generic [ref=e784]: o
            - generic [ref=e785]: p
            - generic [ref=e786]: e
            - generic [ref=e787]: "n"
          - generic [ref=e789]:
            - generic [ref=e790]: v
            - generic [ref=e791]: o
            - generic [ref=e792]: i
            - generic [ref=e793]: c
            - generic [ref=e794]: e
          - generic [ref=e796]:
            - generic [ref=e797]: u
            - generic [ref=e798]: s
          - generic [ref=e800]:
            - generic [ref=e801]: r
            - generic [ref=e802]: e
            - generic [ref=e803]: "n"
            - generic [ref=e804]: t
          - generic [ref=e806]:
            - generic [ref=e807]: t
            - generic [ref=e808]: i
            - generic [ref=e809]: "n"
          - generic [ref=e811]:
            - generic [ref=e812]: t
            - generic [ref=e813]: o
          - generic [ref=e815]:
            - generic [ref=e816]: s
            - generic [ref=e817]: c
            - generic [ref=e818]: h
            - generic [ref=e819]: o
            - generic [ref=e820]: o
            - generic [ref=e821]: l
          - generic [ref=e823]:
            - generic [ref=e824]: s
            - generic [ref=e825]: e
            - generic [ref=e826]: e
          - generic [ref=e828]:
            - generic [ref=e829]: l
            - generic [ref=e830]: o
            - generic [ref=e831]: "n"
            - generic [ref=e832]: g
          - generic [ref=e834]:
            - generic [ref=e835]: g
            - generic [ref=e836]: l
            - generic [ref=e837]: a
            - generic [ref=e838]: s
            - generic [ref=e839]: s
          - generic [ref=e841]:
            - generic [ref=e842]: s
            - generic [ref=e843]: e
            - generic [ref=e844]: e
            - generic [ref=e845]: d
        - paragraph [ref=e846]: "Practice passage: soft cold sea see kind why own speak face so even tier zone just not riot word come are at plain say bright out me night zinc pair watch fast let shape world bring that second flow free eat there can land zinc early neon here end terrain quick time still now store long up can white keen onion power none view fun sent through oat window letter that nest what nation time talk she true come know room can sort train shine every line even point same small plain joy sure seen speak simple nature though fine tear ease north under every tan raise low cold think green open voice us rent tin to school see long glass seed"
        - textbox "Typing input" [active] [ref=e847]
      - generic [ref=e849]:
        - paragraph [ref=e850]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e851]
      - generic [ref=e852]:
        - paragraph [ref=e853]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e854]:
          - button "Restart with new text" [ref=e855]
          - button "Show accessible text editor" [ref=e859]
          - button "Finish" [disabled] [ref=e863]
      - status [ref=e866]: Ready to type
  - contentinfo [ref=e867]:
    - generic [ref=e868]:
      - generic [ref=e869]: A little practice. Lasting progress.
      - generic [ref=e872]:
        - link "About & metrics" [ref=e873]:
          - /url: /about
        - link "Preferences & data" [ref=e874]:
          - /url: /settings
        - generic [ref=e875]: Typing Forge © 2026
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