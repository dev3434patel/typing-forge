# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> small-screen test controls wrap in all six modes and keep select targets usable
- Location: e2e\responsive-layout.spec.ts:93:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 44
Received:    43.99090576171875
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
            - generic [ref=e110]: i
            - generic [ref=e111]: m
            - generic [ref=e112]: p
            - generic [ref=e113]: l
            - generic [ref=e114]: e
          - generic [ref=e116]:
            - generic [ref=e117]: l
            - generic [ref=e118]: a
            - generic [ref=e119]: "n"
            - generic [ref=e120]: e
          - generic [ref=e122]:
            - generic [ref=e123]: f
            - generic [ref=e124]: o
            - generic [ref=e125]: o
            - generic [ref=e126]: d
          - generic [ref=e128]:
            - generic [ref=e129]: h
            - generic [ref=e130]: o
            - generic [ref=e131]: l
            - generic [ref=e132]: d
          - generic [ref=e134]:
            - generic [ref=e135]: t
            - generic [ref=e136]: h
            - generic [ref=e137]: i
            - generic [ref=e138]: "n"
            - generic [ref=e139]: g
          - generic [ref=e141]:
            - generic [ref=e142]: r
            - generic [ref=e143]: i
            - generic [ref=e144]: g
            - generic [ref=e145]: h
            - generic [ref=e146]: t
          - generic [ref=e148]:
            - generic [ref=e149]: f
            - generic [ref=e150]: a
            - generic [ref=e151]: r
          - generic [ref=e153]:
            - generic [ref=e154]: "n"
            - generic [ref=e155]: e
            - generic [ref=e156]: v
            - generic [ref=e157]: e
            - generic [ref=e158]: r
          - generic [ref=e160]:
            - generic [ref=e161]: b
            - generic [ref=e162]: r
            - generic [ref=e163]: i
            - generic [ref=e164]: "n"
            - generic [ref=e165]: g
          - generic [ref=e167]:
            - generic [ref=e168]: b
            - generic [ref=e169]: l
            - generic [ref=e170]: a
            - generic [ref=e171]: c
            - generic [ref=e172]: k
          - generic [ref=e174]:
            - generic [ref=e175]: w
            - generic [ref=e176]: a
            - generic [ref=e177]: t
            - generic [ref=e178]: c
            - generic [ref=e179]: h
          - generic [ref=e181]:
            - generic [ref=e182]: t
            - generic [ref=e183]: h
            - generic [ref=e184]: r
            - generic [ref=e185]: o
            - generic [ref=e186]: u
            - generic [ref=e187]: g
            - generic [ref=e188]: h
          - generic [ref=e190]:
            - generic [ref=e191]: o
            - generic [ref=e192]: "n"
            - generic [ref=e193]: i
            - generic [ref=e194]: o
            - generic [ref=e195]: "n"
          - generic [ref=e197]:
            - generic [ref=e198]: e
            - generic [ref=e199]: r
            - generic [ref=e200]: a
          - generic [ref=e202]:
            - generic [ref=e203]: "n"
            - generic [ref=e204]: o
            - generic [ref=e205]: r
            - generic [ref=e206]: t
            - generic [ref=e207]: h
          - generic [ref=e209]:
            - generic [ref=e210]: h
            - generic [ref=e211]: o
            - generic [ref=e212]: m
            - generic [ref=e213]: e
          - generic [ref=e215]:
            - generic [ref=e216]: t
            - generic [ref=e217]: u
            - generic [ref=e218]: r
            - generic [ref=e219]: "n"
          - generic [ref=e221]:
            - generic [ref=e222]: s
            - generic [ref=e223]: t
            - generic [ref=e224]: o
            - generic [ref=e225]: r
            - generic [ref=e226]: "y"
          - generic [ref=e228]:
            - generic [ref=e229]: s
            - generic [ref=e230]: o
            - generic [ref=e231]: u
            - generic [ref=e232]: "n"
            - generic [ref=e233]: d
          - generic [ref=e235]:
            - generic [ref=e236]: h
            - generic [ref=e237]: o
            - generic [ref=e238]: l
            - generic [ref=e239]: d
          - generic [ref=e241]:
            - generic [ref=e242]: k
            - generic [ref=e243]: e
            - generic [ref=e244]: e
            - generic [ref=e245]: "n"
          - generic [ref=e247]:
            - generic [ref=e248]: e
            - generic [ref=e249]: a
            - generic [ref=e250]: r
          - generic [ref=e252]:
            - generic [ref=e253]: r
            - generic [ref=e254]: e
            - generic [ref=e255]: "n"
            - generic [ref=e256]: t
          - generic [ref=e258]:
            - generic [ref=e259]: k
            - generic [ref=e260]: i
            - generic [ref=e261]: "n"
            - generic [ref=e262]: d
          - generic [ref=e264]:
            - generic [ref=e265]: o
            - generic [ref=e266]: f
            - generic [ref=e267]: f
          - generic [ref=e269]:
            - generic [ref=e270]: t
            - generic [ref=e271]: a
            - generic [ref=e272]: l
            - generic [ref=e273]: k
          - generic [ref=e275]:
            - generic [ref=e276]: r
            - generic [ref=e277]: o
            - generic [ref=e278]: o
            - generic [ref=e279]: t
          - generic [ref=e281]:
            - generic [ref=e282]: s
            - generic [ref=e283]: o
            - generic [ref=e284]: r
            - generic [ref=e285]: t
          - generic [ref=e287]:
            - generic [ref=e288]: p
            - generic [ref=e289]: o
            - generic [ref=e290]: i
            - generic [ref=e291]: "n"
            - generic [ref=e292]: t
          - generic [ref=e294]:
            - generic [ref=e295]: "y"
            - generic [ref=e296]: e
            - generic [ref=e297]: s
          - generic [ref=e299]:
            - generic [ref=e300]: "n"
            - generic [ref=e301]: o
            - generic [ref=e302]: r
            - generic [ref=e303]: t
            - generic [ref=e304]: h
          - generic [ref=e306]:
            - generic [ref=e307]: w
            - generic [ref=e308]: i
            - generic [ref=e309]: d
            - generic [ref=e310]: e
          - generic [ref=e312]:
            - generic [ref=e313]: s
            - generic [ref=e314]: p
            - generic [ref=e315]: r
            - generic [ref=e316]: i
            - generic [ref=e317]: "n"
            - generic [ref=e318]: g
          - generic [ref=e320]:
            - generic [ref=e321]: f
            - generic [ref=e322]: a
            - generic [ref=e323]: r
          - generic [ref=e325]:
            - generic [ref=e326]: w
            - generic [ref=e327]: i
            - generic [ref=e328]: t
            - generic [ref=e329]: h
          - generic [ref=e331]:
            - generic [ref=e332]: w
            - generic [ref=e333]: o
            - generic [ref=e334]: r
            - generic [ref=e335]: d
          - generic [ref=e337]: i
          - generic [ref=e340]:
            - generic [ref=e341]: f
            - generic [ref=e342]: u
            - generic [ref=e343]: l
            - generic [ref=e344]: l
          - generic [ref=e346]:
            - generic [ref=e347]: t
            - generic [ref=e348]: h
            - generic [ref=e349]: i
            - generic [ref=e350]: "n"
            - generic [ref=e351]: k
          - generic [ref=e353]:
            - generic [ref=e354]: f
            - generic [ref=e355]: o
            - generic [ref=e356]: o
            - generic [ref=e357]: d
          - generic [ref=e359]:
            - generic [ref=e360]: t
            - generic [ref=e361]: o
            - generic [ref=e362]: g
            - generic [ref=e363]: e
            - generic [ref=e364]: t
            - generic [ref=e365]: h
            - generic [ref=e366]: e
            - generic [ref=e367]: r
          - generic [ref=e369]:
            - generic [ref=e370]: i
            - generic [ref=e371]: s
          - generic [ref=e373]:
            - generic [ref=e374]: p
            - generic [ref=e375]: u
            - generic [ref=e376]: t
          - generic [ref=e378]:
            - generic [ref=e379]: e
            - generic [ref=e380]: "y"
            - generic [ref=e381]: e
          - generic [ref=e383]:
            - generic [ref=e384]: r
            - generic [ref=e385]: o
            - generic [ref=e386]: a
            - generic [ref=e387]: d
          - generic [ref=e389]:
            - generic [ref=e390]: a
            - generic [ref=e391]: "n"
            - generic [ref=e392]: t
            - generic [ref=e393]: e
          - generic [ref=e395]:
            - generic [ref=e396]: t
            - generic [ref=e397]: o
            - generic [ref=e398]: e
          - generic [ref=e400]:
            - generic [ref=e401]: k
            - generic [ref=e402]: e
            - generic [ref=e403]: e
            - generic [ref=e404]: p
          - generic [ref=e406]:
            - generic [ref=e407]: t
            - generic [ref=e408]: a
            - generic [ref=e409]: l
            - generic [ref=e410]: k
          - generic [ref=e412]:
            - generic [ref=e413]: p
            - generic [ref=e414]: o
            - generic [ref=e415]: e
            - generic [ref=e416]: m
          - generic [ref=e418]:
            - generic [ref=e419]: l
            - generic [ref=e420]: a
            - generic [ref=e421]: t
            - generic [ref=e422]: e
            - generic [ref=e423]: r
          - generic [ref=e425]:
            - generic [ref=e426]: s
            - generic [ref=e427]: h
            - generic [ref=e428]: a
            - generic [ref=e429]: p
            - generic [ref=e430]: e
          - generic [ref=e432]:
            - generic [ref=e433]: p
            - generic [ref=e434]: u
            - generic [ref=e435]: t
          - generic [ref=e437]:
            - generic [ref=e438]: a
            - generic [ref=e439]: "n"
          - generic [ref=e441]:
            - generic [ref=e442]: t
            - generic [ref=e443]: o
            - generic [ref=e444]: e
          - generic [ref=e446]:
            - generic [ref=e447]: s
            - generic [ref=e448]: t
            - generic [ref=e449]: a
            - generic [ref=e450]: r
            - generic [ref=e451]: e
          - generic [ref=e453]:
            - generic [ref=e454]: s
            - generic [ref=e455]: i
            - generic [ref=e456]: m
            - generic [ref=e457]: p
            - generic [ref=e458]: l
            - generic [ref=e459]: e
          - generic [ref=e461]:
            - generic [ref=e462]: t
            - generic [ref=e463]: i
            - generic [ref=e464]: e
            - generic [ref=e465]: r
          - generic [ref=e467]:
            - generic [ref=e468]: t
            - generic [ref=e469]: h
            - generic [ref=e470]: o
            - generic [ref=e471]: u
            - generic [ref=e472]: g
            - generic [ref=e473]: h
          - generic [ref=e475]:
            - generic [ref=e476]: g
            - generic [ref=e477]: r
            - generic [ref=e478]: o
            - generic [ref=e479]: u
            - generic [ref=e480]: "n"
            - generic [ref=e481]: d
          - generic [ref=e483]:
            - generic [ref=e484]: s
            - generic [ref=e485]: a
            - generic [ref=e486]: "n"
            - generic [ref=e487]: e
          - generic [ref=e489]:
            - generic [ref=e490]: s
            - generic [ref=e491]: t
            - generic [ref=e492]: r
            - generic [ref=e493]: e
            - generic [ref=e494]: e
            - generic [ref=e495]: t
          - generic [ref=e497]:
            - generic [ref=e498]: v
            - generic [ref=e499]: i
            - generic [ref=e500]: e
            - generic [ref=e501]: w
          - generic [ref=e503]:
            - generic [ref=e504]: s
            - generic [ref=e505]: m
            - generic [ref=e506]: i
            - generic [ref=e507]: l
            - generic [ref=e508]: e
          - generic [ref=e510]:
            - generic [ref=e511]: r
            - generic [ref=e512]: e
            - generic [ref=e513]: a
            - generic [ref=e514]: d
          - generic [ref=e516]:
            - generic [ref=e517]: r
            - generic [ref=e518]: a
            - generic [ref=e519]: t
            - generic [ref=e520]: i
            - generic [ref=e521]: o
          - generic [ref=e523]:
            - generic [ref=e524]: r
            - generic [ref=e525]: a
            - generic [ref=e526]: i
            - generic [ref=e527]: "n"
          - generic [ref=e529]:
            - generic [ref=e530]: m
            - generic [ref=e531]: u
            - generic [ref=e532]: s
            - generic [ref=e533]: t
          - generic [ref=e535]:
            - generic [ref=e536]: "y"
            - generic [ref=e537]: e
            - generic [ref=e538]: l
            - generic [ref=e539]: l
            - generic [ref=e540]: o
            - generic [ref=e541]: w
          - generic [ref=e543]:
            - generic [ref=e544]: s
            - generic [ref=e545]: c
            - generic [ref=e546]: h
            - generic [ref=e547]: o
            - generic [ref=e548]: o
            - generic [ref=e549]: l
          - generic [ref=e551]:
            - generic [ref=e552]: p
            - generic [ref=e553]: e
            - generic [ref=e554]: o
            - generic [ref=e555]: p
            - generic [ref=e556]: l
            - generic [ref=e557]: e
          - generic [ref=e559]:
            - generic [ref=e560]: m
            - generic [ref=e561]: u
            - generic [ref=e562]: s
            - generic [ref=e563]: t
          - generic [ref=e565]:
            - generic [ref=e566]: d
            - generic [ref=e567]: o
            - generic [ref=e568]: o
            - generic [ref=e569]: r
          - generic [ref=e571]:
            - generic [ref=e572]: e
            - generic [ref=e573]: a
            - generic [ref=e574]: r
            - generic [ref=e575]: l
            - generic [ref=e576]: "y"
          - generic [ref=e578]:
            - generic [ref=e579]: p
            - generic [ref=e580]: a
            - generic [ref=e581]: r
            - generic [ref=e582]: k
          - generic [ref=e584]:
            - generic [ref=e585]: h
            - generic [ref=e586]: o
            - generic [ref=e587]: u
            - generic [ref=e588]: s
            - generic [ref=e589]: e
          - generic [ref=e591]:
            - generic [ref=e592]: "n"
            - generic [ref=e593]: e
            - generic [ref=e594]: s
            - generic [ref=e595]: t
          - generic [ref=e597]:
            - generic [ref=e598]: a
            - generic [ref=e599]: r
            - generic [ref=e600]: i
            - generic [ref=e601]: s
            - generic [ref=e602]: e
          - generic [ref=e604]:
            - generic [ref=e605]: h
            - generic [ref=e606]: a
            - generic [ref=e607]: p
            - generic [ref=e608]: p
            - generic [ref=e609]: "y"
          - generic [ref=e611]:
            - generic [ref=e612]: f
            - generic [ref=e613]: a
            - generic [ref=e614]: i
            - generic [ref=e615]: r
          - generic [ref=e617]:
            - generic [ref=e618]: i
            - generic [ref=e619]: s
          - generic [ref=e621]:
            - generic [ref=e622]: g
            - generic [ref=e623]: o
            - generic [ref=e624]: o
            - generic [ref=e625]: d
          - generic [ref=e627]:
            - generic [ref=e628]: c
            - generic [ref=e629]: l
            - generic [ref=e630]: e
            - generic [ref=e631]: a
            - generic [ref=e632]: r
          - generic [ref=e634]:
            - generic [ref=e635]: c
            - generic [ref=e636]: o
            - generic [ref=e637]: p
            - generic [ref=e638]: "y"
          - generic [ref=e640]:
            - generic [ref=e641]: s
            - generic [ref=e642]: p
            - generic [ref=e643]: e
            - generic [ref=e644]: e
            - generic [ref=e645]: d
          - generic [ref=e647]:
            - generic [ref=e648]: g
            - generic [ref=e649]: r
            - generic [ref=e650]: o
            - generic [ref=e651]: w
          - generic [ref=e653]:
            - generic [ref=e654]: p
            - generic [ref=e655]: a
            - generic [ref=e656]: t
            - generic [ref=e657]: h
          - generic [ref=e659]:
            - generic [ref=e660]: t
            - generic [ref=e661]: e
            - generic [ref=e662]: "n"
            - generic [ref=e663]: t
          - generic [ref=e665]:
            - generic [ref=e666]: l
            - generic [ref=e667]: e
            - generic [ref=e668]: f
            - generic [ref=e669]: t
          - generic [ref=e671]:
            - generic [ref=e672]: "n"
            - generic [ref=e673]: o
            - generic [ref=e674]: t
          - generic [ref=e676]:
            - generic [ref=e677]: t
            - generic [ref=e678]: i
            - generic [ref=e679]: r
            - generic [ref=e680]: e
          - generic [ref=e682]:
            - generic [ref=e683]: f
            - generic [ref=e684]: a
            - generic [ref=e685]: r
          - generic [ref=e687]:
            - generic [ref=e688]: w
            - generic [ref=e689]: i
            - generic [ref=e690]: "n"
            - generic [ref=e691]: d
          - generic [ref=e693]:
            - generic [ref=e694]: g
            - generic [ref=e695]: i
            - generic [ref=e696]: v
            - generic [ref=e697]: e
          - generic [ref=e699]:
            - generic [ref=e700]: o
            - generic [ref=e701]: r
            - generic [ref=e702]: d
            - generic [ref=e703]: e
            - generic [ref=e704]: r
          - generic [ref=e706]:
            - generic [ref=e707]: e
            - generic [ref=e708]: a
            - generic [ref=e709]: t
          - generic [ref=e711]:
            - generic [ref=e712]: t
            - generic [ref=e713]: e
            - generic [ref=e714]: a
          - generic [ref=e716]:
            - generic [ref=e717]: m
            - generic [ref=e718]: e
            - generic [ref=e719]: e
            - generic [ref=e720]: t
          - generic [ref=e722]:
            - generic [ref=e723]: t
            - generic [ref=e724]: e
            - generic [ref=e725]: a
            - generic [ref=e726]: r
          - generic [ref=e728]:
            - generic [ref=e729]: u
            - generic [ref=e730]: "n"
            - generic [ref=e731]: d
            - generic [ref=e732]: e
            - generic [ref=e733]: r
          - generic [ref=e735]:
            - generic [ref=e736]: t
            - generic [ref=e737]: i
            - generic [ref=e738]: "n"
          - generic [ref=e740]:
            - generic [ref=e741]: s
            - generic [ref=e742]: e
            - generic [ref=e743]: e
          - generic [ref=e745]:
            - generic [ref=e746]: s
            - generic [ref=e747]: o
            - generic [ref=e748]: u
            - generic [ref=e749]: t
            - generic [ref=e750]: h
          - generic [ref=e752]:
            - generic [ref=e753]: p
            - generic [ref=e754]: u
            - generic [ref=e755]: t
          - generic [ref=e757]:
            - generic [ref=e758]: r
            - generic [ref=e759]: a
            - generic [ref=e760]: i
            - generic [ref=e761]: s
            - generic [ref=e762]: e
          - generic [ref=e764]:
            - generic [ref=e765]: w
            - generic [ref=e766]: h
            - generic [ref=e767]: e
            - generic [ref=e768]: "n"
          - generic [ref=e770]:
            - generic [ref=e771]: s
            - generic [ref=e772]: o
            - generic [ref=e773]: u
            - generic [ref=e774]: t
            - generic [ref=e775]: h
          - generic [ref=e777]:
            - generic [ref=e778]: h
            - generic [ref=e779]: e
          - generic [ref=e781]:
            - generic [ref=e782]: o
            - generic [ref=e783]: "n"
            - generic [ref=e784]: i
            - generic [ref=e785]: o
            - generic [ref=e786]: "n"
          - generic [ref=e788]:
            - generic [ref=e789]: h
            - generic [ref=e790]: a
            - generic [ref=e791]: r
            - generic [ref=e792]: d
          - generic [ref=e794]:
            - generic [ref=e795]: o
            - generic [ref=e796]: u
            - generic [ref=e797]: t
          - generic [ref=e799]:
            - generic [ref=e800]: w
            - generic [ref=e801]: h
            - generic [ref=e802]: o
          - generic [ref=e804]:
            - generic [ref=e805]: "n"
            - generic [ref=e806]: e
            - generic [ref=e807]: e
            - generic [ref=e808]: d
          - generic [ref=e810]:
            - generic [ref=e811]: s
            - generic [ref=e812]: c
            - generic [ref=e813]: h
            - generic [ref=e814]: o
            - generic [ref=e815]: o
            - generic [ref=e816]: l
          - generic [ref=e818]:
            - generic [ref=e819]: s
            - generic [ref=e820]: h
            - generic [ref=e821]: o
            - generic [ref=e822]: r
            - generic [ref=e823]: e
          - generic [ref=e825]:
            - generic [ref=e826]: o
            - generic [ref=e827]: v
            - generic [ref=e828]: e
            - generic [ref=e829]: r
          - generic [ref=e831]:
            - generic [ref=e832]: s
            - generic [ref=e833]: u
            - generic [ref=e834]: "n"
          - generic [ref=e836]:
            - generic [ref=e837]: r
            - generic [ref=e838]: o
            - generic [ref=e839]: a
            - generic [ref=e840]: d
          - generic [ref=e842]:
            - generic [ref=e843]: o
            - generic [ref=e844]: p
            - generic [ref=e845]: e
            - generic [ref=e846]: "n"
          - generic [ref=e848]:
            - generic [ref=e849]: t
            - generic [ref=e850]: a
            - generic [ref=e851]: l
            - generic [ref=e852]: k
        - paragraph [ref=e853]: "Practice passage: simple lane food hold thing right far never bring black watch through onion era north home turn story sound hold keen ear rent kind off talk root sort point yes north wide spring far with word i full think food together is put eye road ante toe keep talk poem later shape put an toe stare simple tier though ground sane street view smile read ratio rain must yellow school people must door early park house nest arise happy fair is good clear copy speed grow path tent left not tire far wind give order eat tea meet tear under tin see south put raise when south he onion hard out who need school shore over sun road open talk"
        - textbox "Typing input" [active] [ref=e854]
      - generic [ref=e856]:
        - paragraph [ref=e857]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e858]
      - generic [ref=e859]:
        - paragraph [ref=e860]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e861]:
          - button "Restart with new text" [ref=e862]
          - button "Show accessible text editor" [ref=e866]
          - button "Finish" [disabled] [ref=e870]
      - status [ref=e873]: Ready to type
  - contentinfo [ref=e874]:
    - generic [ref=e875]:
      - generic [ref=e876]: A little practice. Lasting progress.
      - generic [ref=e879]:
        - link "About & metrics" [ref=e880]:
          - /url: /about
        - link "Preferences & data" [ref=e881]:
          - /url: /settings
        - generic [ref=e882]: Typing Forge © 2026
```

# Test source

```ts
  5   |   await page.locator("#main-content").waitFor();
  6   |   await page.waitForFunction(
  7   |     () => document.fonts.status === "loaded" && document.fonts.check('400 16px "Inter Variable"', "Typing Forge"),
  8   |     undefined,
  9   |     { timeout: 10_000 },
  10  |   );
  11  |   const dimensions = await page.evaluate(() => ({
  12  |     viewport: document.documentElement.clientWidth,
  13  |     document: document.documentElement.scrollWidth,
  14  |     body: document.body.scrollWidth,
  15  |     offenders: Array.from(document.querySelectorAll("main, header, footer"))
  16  |       .filter((element) => {
  17  |         const rect = element.getBoundingClientRect();
  18  |         return rect.left < -1 || rect.right > innerWidth + 1;
  19  |       })
  20  |       .map((element) => element.tagName),
  21  |   }));
  22  |   expect(dimensions.document, page.url()).toBeLessThanOrEqual(dimensions.viewport + 1);
  23  |   expect(dimensions.body, page.url()).toBeLessThanOrEqual(dimensions.viewport + 1);
  24  |   expect(dimensions.offenders, page.url()).toEqual([]);
  25  | }
  26  | 
  27  | for (const width of [320, 390, 768, 1440]) {
  28  |   test(`main local pages fit a ${width}px viewport`, async ({ page }) => {
  29  |     test.setTimeout(90_000);
  30  |     await page.setViewportSize({ width, height: 900 });
  31  |     for (const route of [
  32  |       "/", "/learn", "/race", "/stats", "/settings", "/keyboard-lab",
  33  |       "/leaderboard", "/ranked", "/profile", "/auth", "/about",
  34  |     ]) {
  35  |       await test.step(route, async () => {
  36  |         await page.goto(route, { waitUntil: "domcontentloaded" });
  37  |         await expectPageFits(page);
  38  |       });
  39  |     }
  40  |   });
  41  | }
  42  | 
  43  | test("every theme provides opaque, readable native language options", async ({ page }) => {
  44  |   test.setTimeout(180_000);
  45  |   for (const [id, name, scheme] of [
  46  |     ["forge-dark", "Forge dark", "dark"],
  47  |     ["forge-light", "Forge light", "light"],
  48  |     ["graphite", "Graphite", "dark"],
  49  |     ["midnight-blue", "Midnight blue", "dark"],
  50  |     ["ember", "Ember", "dark"],
  51  |     ["mono-ink", "Mono ink", "dark"],
  52  |     ["paper", "Paper", "light"],
  53  |     ["aurora", "Aurora", "dark"],
  54  |   ]) {
  55  |     await page.goto("/settings", { waitUntil: "domcontentloaded" });
  56  |     await page.getByRole("button", { name, exact: false }).click();
  57  |     await expect(page.locator("html")).toHaveAttribute("data-theme", id);
  58  |     await page.goto("/", { waitUntil: "domcontentloaded" });
  59  |     const select = page.getByRole("combobox", { name: "Language", exact: true });
  60  |     await expect(select).toBeVisible();
  61  |     const menu = await select.evaluate((element) => {
  62  |       const control = element as HTMLSelectElement;
  63  |       const option = getComputedStyle(control.options[1]);
  64  |       const components = (color: string) => color.match(/[\d.]+/g)!.map(Number);
  65  |       const luminance = (color: string) => components(color).slice(0, 3)
  66  |         .map((value) => value / 255)
  67  |         .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  68  |         .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  69  |       const foreground = luminance(option.color);
  70  |       const background = luminance(option.backgroundColor);
  71  |       return {
  72  |         scheme: getComputedStyle(control).colorScheme,
  73  |         background: components(option.backgroundColor),
  74  |         contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
  75  |       };
  76  |     });
  77  |     expect(menu.scheme, name).toBe(scheme);
  78  |     expect(menu.background[3] ?? 1, name).toBe(1);
  79  |     expect(menu.contrast, name).toBeGreaterThanOrEqual(4.5);
  80  |   }
  81  |   // Native keyboard selection still changes the content and survives reload.
  82  |   const select = page.getByRole("combobox", { name: "Language", exact: true });
  83  |   await select.focus();
  84  |   await select.press("Home");
  85  |   await select.press("ArrowDown");
  86  |   await select.press("Enter");
  87  |   await expect(select).toHaveValue("es");
  88  |   await page.reload({ waitUntil: "domcontentloaded" });
  89  |   await page.locator("#main-content").waitFor();
  90  |   await expect(select).toHaveValue("es");
  91  | });
  92  | 
  93  | test("small-screen test controls wrap in all six modes and keep select targets usable", async ({ page }, info) => {
  94  |   test.setTimeout(90_000);
  95  |   await page.setViewportSize({ width: 320, height: 568 });
  96  |   await page.goto("/", { waitUntil: "domcontentloaded" });
  97  |   for (const mode of ["Time", "Words", "Quote", "Code", "Custom", "Zen"]) {
  98  |     await page.getByRole("group", { name: "Test mode", exact: true })
  99  |       .getByRole("button", { name: mode, exact: true }).click();
  100 |     await expectPageFits(page);
  101 |     const toolbar = page.getByRole("region", { name: "Test configuration" });
  102 |     for (const control of await toolbar.locator("button, select").all()) {
  103 |       const rect = await control.boundingBox();
  104 |       expect(rect).not.toBeNull();
> 105 |       expect(rect!.height).toBeGreaterThanOrEqual(44);
      |                            ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  106 |       expect(rect!.x).toBeGreaterThanOrEqual(0);
  107 |       expect(rect!.x + rect!.width).toBeLessThanOrEqual(321);
  108 |     }
  109 |     if (mode === "Code") {
  110 |       await page.getByRole("combobox", { name: "Code language" }).selectOption("python");
  111 |       await page.screenshot({ path: `audit/responsive-2026-10-16/code-320-${info.project.name}.png`, fullPage: true });
  112 |     }
  113 |   }
  114 |   await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("gu-Latn");
  115 |   await expectPageFits(page);
  116 | });
  117 | 
  118 | test("narrow results retain the whole keyboard map and expanded evidence", async ({ page }, info) => {
  119 |   test.setTimeout(90_000);
  120 |   await page.setViewportSize({ width: 320, height: 760 });
  121 |   await completeCorrectedCat(page);
  122 |   await expectPageFits(page);
  123 |   const map = page.locator("details").filter({
  124 |     has: page.locator("summary", { hasText: "Final-text keyboard map" }),
  125 |   });
  126 |   await map.locator("summary").click();
  127 |   const keysFit = await map.evaluate((element) => {
  128 |     const parent = element.getBoundingClientRect();
  129 |     return Array.from(element.querySelectorAll("span[title]"))
  130 |       .filter((key) => key.getBoundingClientRect().width > 0)
  131 |       .every((key) => {
  132 |         const rect = key.getBoundingClientRect();
  133 |         return rect.left >= parent.left && rect.right <= parent.right;
  134 |       });
  135 |   });
  136 |   expect(keysFit).toBe(true);
  137 |   const speed = await page.getByText("Words per minute", { exact: true }).locator("..").boundingBox();
  138 |   const accuracy = await page.getByText("Input accuracy", { exact: true }).first().locator("..").boundingBox();
  139 |   expect(speed!.y + speed!.height).toBeLessThanOrEqual(accuracy!.y);
  140 |   await page.getByRole("button", { name: "Inspect session evidence", exact: true }).click();
  141 |   const table = page.getByRole("region", { name: "Word credit table", exact: true });
  142 |   await table.focus();
  143 |   await expect(table).toBeFocused();
  144 |   expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  145 |   await page.getByRole("button", { name: "Replay edits", exact: true }).click();
  146 |   await page.getByRole("slider", { name: "Replay position", exact: true }).press("End");
  147 |   await page.getByText("Recorded edit events", { exact: true }).click();
  148 |   const events = page.getByRole("region", { name: "Recorded edit event table", exact: true });
  149 |   await events.focus();
  150 |   await expect(events).toBeFocused();
  151 |   await page.getByText("Session details & comparison eligibility", { exact: false }).click();
  152 |   await expectPageFits(page);
  153 |   await page.screenshot({ path: `audit/responsive-2026-10-16/results-320-${info.project.name}.png`, fullPage: true });
  154 | });
  155 | 
  156 | test("race and learning remain usable after landscape and narrow resize", async ({ page }) => {
  157 |   test.setTimeout(90_000);
  158 |   await page.setViewportSize({ width: 568, height: 320 });
  159 |   await page.goto("/race", { waitUntil: "domcontentloaded" });
  160 |   await page.getByRole("button", { name: "Start bot practice", exact: true }).click();
  161 |   const input = await focusTyping(page);
  162 |   await input.pressSequentially("test");
  163 |   await page.setViewportSize({ width: 320, height: 568 });
  164 |   await expectPageFits(page);
  165 |   await expect(page.getByTestId("opponent-caret")).toBeVisible();
  166 |   await input.press("Tab");
  167 |   await page.getByRole("button", { name: "Restart with new text" }).press("Enter");
  168 |   await expect(input).toBeFocused();
  169 |   await expect(input).toHaveValue("");
  170 |   await page.goto("/learn?language=en&layout=qwertz", { waitUntil: "domcontentloaded" });
  171 |   const keyboard = page.getByRole("img", { name: /^QWERTZ logical keyboard/ });
  172 |   await expect(keyboard).toBeVisible();
  173 |   expect(await keyboard.evaluate((element) => {
  174 |     const frame = element.getBoundingClientRect();
  175 |     return Array.from(element.querySelectorAll(".learn-keyboard-row")).every((row) => {
  176 |       const keys = Array.from(row.querySelectorAll(".learn-key"))
  177 |         .map((key) => key.getBoundingClientRect());
  178 |       return keys.every((key) => key.left >= frame.left - 1 &&
  179 |         key.right <= frame.right + 1 && Math.abs(key.top - keys[0].top) < 1);
  180 |     });
  181 |   })).toBe(true);
  182 |   for (const name of ["Correction policy", "Input method"]) {
  183 |     const control = page.getByRole("combobox", { name, exact: true });
  184 |     expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  185 |   }
  186 |   await expectPageFits(page);
  187 |   await page.getByRole("combobox", { name: "Correction policy", exact: true }).selectOption("stop");
  188 |   await page.getByText("Learning progress & evidence", { exact: false }).click();
  189 |   await expectPageFits(page);
  190 | });
  191 | 
```