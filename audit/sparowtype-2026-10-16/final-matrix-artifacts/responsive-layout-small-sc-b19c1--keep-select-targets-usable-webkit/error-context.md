# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> small-screen test controls wrap in all six modes and keep select targets usable
- Location: e2e\responsive-layout.spec.ts:93:1

# Error details

```
Error: http://127.0.0.1:4173/

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 274
Received:    293
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "Skip to content" [ref=e5]:
      - /url: "#main-content"
    - generic [ref=e6]:
      - link "SparowType home" [ref=e7]:
        - /url: /
        - generic [ref=e13]: SparowType
      - generic [ref=e14]:
        - button "Switch to light theme" [ref=e15]
        - link "Settings" [ref=e22]:
          - /url: /settings
        - link "Sign in" [ref=e26]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e30]:
      - link "Test" [ref=e31]:
        - /url: /
      - link "Learn" [ref=e34]:
        - /url: /learn
      - link "Race" [ref=e38]:
        - /url: /race
      - link "Stats" [ref=e48]:
        - /url: /stats
      - link "Rankings" [ref=e51]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e58]:
        - /url: /keyboard-lab
  - main [ref=e61]:
    - heading "Typing practice" [level=1] [ref=e62]
    - region "Test configuration" [ref=e63]:
      - generic [ref=e64]:
        - group "Test mode" [ref=e65]:
          - button "Time" [pressed] [ref=e66]
          - button "Words" [ref=e70]
          - button "Quote" [ref=e73]
          - button "Code" [ref=e77]
          - button "Custom" [ref=e82]
          - button "Zen" [ref=e86]
        - group "Test duration" [ref=e89]:
          - button "15 seconds" [ref=e90]:
            - text: "15"
            - generic [ref=e91]: seconds
          - button "30 seconds" [pressed] [ref=e92]:
            - text: "30"
            - generic [ref=e93]: seconds
          - button "60 seconds" [ref=e94]:
            - text: "60"
            - generic [ref=e95]: seconds
          - button "120 seconds" [ref=e96]:
            - text: "120"
            - generic [ref=e97]: seconds
      - generic [ref=e98]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e99]:
          - checkbox "Precision mode · stop on errors" [ref=e100]
          - text: Precision mode · stop on errors
        - generic [ref=e101]:
          - text: Language
          - combobox "Language" [ref=e102]:
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
        - button "punctuation" [ref=e103]
        - button "# numbers" [ref=e105]
    - region "Typing session" [ref=e106]:
      - generic [ref=e108]:
        - generic [ref=e109]:
          - generic [ref=e110]: 30s
          - generic [ref=e111]: remaining
        - generic [ref=e112]: —wpm
      - generic [ref=e114]:
        - generic [ref=e116]:
          - generic [ref=e117]:
            - generic [ref=e118]: m
            - generic [ref=e119]: a
            - generic [ref=e120]: d
            - generic [ref=e121]: e
          - generic [ref=e123]:
            - generic [ref=e124]: i
            - generic [ref=e125]: "n"
            - generic [ref=e126]: "n"
            - generic [ref=e127]: a
            - generic [ref=e128]: t
            - generic [ref=e129]: e
          - generic [ref=e131]:
            - generic [ref=e132]: t
            - generic [ref=e133]: h
            - generic [ref=e134]: e
            - generic [ref=e135]: r
            - generic [ref=e136]: e
          - generic [ref=e138]:
            - generic [ref=e139]: t
            - generic [ref=e140]: i
            - generic [ref=e141]: m
            - generic [ref=e142]: e
          - generic [ref=e144]:
            - generic [ref=e145]: s
            - generic [ref=e146]: t
            - generic [ref=e147]: u
            - generic [ref=e148]: d
            - generic [ref=e149]: "y"
          - generic [ref=e151]:
            - generic [ref=e152]: t
            - generic [ref=e153]: h
            - generic [ref=e154]: i
            - generic [ref=e155]: "n"
            - generic [ref=e156]: g
          - generic [ref=e158]:
            - generic [ref=e159]: s
            - generic [ref=e160]: h
            - generic [ref=e161]: o
            - generic [ref=e162]: r
            - generic [ref=e163]: t
          - generic [ref=e165]:
            - generic [ref=e166]: p
            - generic [ref=e167]: r
            - generic [ref=e168]: e
            - generic [ref=e169]: t
            - generic [ref=e170]: t
            - generic [ref=e171]: "y"
          - generic [ref=e173]:
            - generic [ref=e174]: m
            - generic [ref=e175]: e
          - generic [ref=e177]:
            - generic [ref=e178]: e
            - generic [ref=e179]: a
            - generic [ref=e180]: c
            - generic [ref=e181]: h
          - generic [ref=e183]:
            - generic [ref=e184]: f
            - generic [ref=e185]: i
            - generic [ref=e186]: "n"
            - generic [ref=e187]: d
          - generic [ref=e189]:
            - generic [ref=e190]: w
            - generic [ref=e191]: o
            - generic [ref=e192]: r
            - generic [ref=e193]: k
          - generic [ref=e195]:
            - generic [ref=e196]: s
            - generic [ref=e197]: t
            - generic [ref=e198]: r
            - generic [ref=e199]: o
            - generic [ref=e200]: "n"
            - generic [ref=e201]: g
          - generic [ref=e203]:
            - generic [ref=e204]: f
            - generic [ref=e205]: r
            - generic [ref=e206]: o
            - generic [ref=e207]: m
          - generic [ref=e209]:
            - generic [ref=e210]: t
            - generic [ref=e211]: h
            - generic [ref=e212]: e
            - generic [ref=e213]: s
            - generic [ref=e214]: e
          - generic [ref=e216]:
            - generic [ref=e217]: l
            - generic [ref=e218]: i
            - generic [ref=e219]: "n"
            - generic [ref=e220]: e
          - generic [ref=e222]:
            - generic [ref=e223]: h
            - generic [ref=e224]: e
            - generic [ref=e225]: a
            - generic [ref=e226]: d
          - generic [ref=e228]:
            - generic [ref=e229]: f
            - generic [ref=e230]: o
            - generic [ref=e231]: r
            - generic [ref=e232]: m
          - generic [ref=e234]:
            - generic [ref=e235]: f
            - generic [ref=e236]: a
            - generic [ref=e237]: s
            - generic [ref=e238]: t
          - generic [ref=e240]:
            - generic [ref=e241]: e
            - generic [ref=e242]: "y"
            - generic [ref=e243]: e
          - generic [ref=e245]:
            - generic [ref=e246]: t
            - generic [ref=e247]: a
            - generic [ref=e248]: "n"
          - generic [ref=e250]:
            - generic [ref=e251]: "n"
            - generic [ref=e252]: e
            - generic [ref=e253]: o
            - generic [ref=e254]: "n"
          - generic [ref=e256]:
            - generic [ref=e257]: o
            - generic [ref=e258]: a
            - generic [ref=e259]: t
          - generic [ref=e261]:
            - generic [ref=e262]: t
            - generic [ref=e263]: h
            - generic [ref=e264]: e
          - generic [ref=e266]:
            - generic [ref=e267]: "y"
            - generic [ref=e268]: o
            - generic [ref=e269]: u
            - generic [ref=e270]: r
          - generic [ref=e272]:
            - generic [ref=e273]: s
            - generic [ref=e274]: h
            - generic [ref=e275]: i
            - generic [ref=e276]: p
          - generic [ref=e278]:
            - generic [ref=e279]: "n"
            - generic [ref=e280]: o
            - generic [ref=e281]: t
            - generic [ref=e282]: i
            - generic [ref=e283]: o
            - generic [ref=e284]: "n"
          - generic [ref=e286]:
            - generic [ref=e287]: g
            - generic [ref=e288]: r
            - generic [ref=e289]: e
            - generic [ref=e290]: a
            - generic [ref=e291]: t
          - generic [ref=e293]:
            - generic [ref=e294]: s
            - generic [ref=e295]: u
            - generic [ref=e296]: "n"
          - generic [ref=e298]:
            - generic [ref=e299]: "n"
            - generic [ref=e300]: o
            - generic [ref=e301]: t
            - generic [ref=e302]: i
            - generic [ref=e303]: o
            - generic [ref=e304]: "n"
          - generic [ref=e306]:
            - generic [ref=e307]: l
            - generic [ref=e308]: a
            - generic [ref=e309]: "n"
            - generic [ref=e310]: d
          - generic [ref=e312]:
            - generic [ref=e313]: p
            - generic [ref=e314]: a
            - generic [ref=e315]: i
            - generic [ref=e316]: r
          - generic [ref=e318]:
            - generic [ref=e319]: l
            - generic [ref=e320]: a
            - generic [ref=e321]: "n"
            - generic [ref=e322]: e
          - generic [ref=e324]:
            - generic [ref=e325]: c
            - generic [ref=e326]: l
            - generic [ref=e327]: e
            - generic [ref=e328]: a
            - generic [ref=e329]: r
          - generic [ref=e331]:
            - generic [ref=e332]: r
            - generic [ref=e333]: a
            - generic [ref=e334]: c
            - generic [ref=e335]: e
          - generic [ref=e337]:
            - generic [ref=e338]: t
            - generic [ref=e339]: h
            - generic [ref=e340]: i
            - generic [ref=e341]: s
          - generic [ref=e343]:
            - generic [ref=e344]: d
            - generic [ref=e345]: a
            - generic [ref=e346]: "y"
          - generic [ref=e348]:
            - generic [ref=e349]: s
            - generic [ref=e350]: o
            - generic [ref=e351]: u
            - generic [ref=e352]: "n"
            - generic [ref=e353]: d
          - generic [ref=e355]:
            - generic [ref=e356]: w
            - generic [ref=e357]: h
            - generic [ref=e358]: e
            - generic [ref=e359]: r
            - generic [ref=e360]: e
          - generic [ref=e362]:
            - generic [ref=e363]: f
            - generic [ref=e364]: a
            - generic [ref=e365]: s
            - generic [ref=e366]: t
          - generic [ref=e368]:
            - generic [ref=e369]: w
            - generic [ref=e370]: h
            - generic [ref=e371]: i
            - generic [ref=e372]: c
            - generic [ref=e373]: h
          - generic [ref=e375]:
            - generic [ref=e376]: "n"
            - generic [ref=e377]: o
            - generic [ref=e378]: r
            - generic [ref=e379]: t
            - generic [ref=e380]: h
          - generic [ref=e382]:
            - generic [ref=e383]: g
            - generic [ref=e384]: r
            - generic [ref=e385]: o
            - generic [ref=e386]: u
            - generic [ref=e387]: p
          - generic [ref=e389]:
            - generic [ref=e390]: e
            - generic [ref=e391]: a
            - generic [ref=e392]: s
            - generic [ref=e393]: t
          - generic [ref=e395]:
            - generic [ref=e396]: "n"
            - generic [ref=e397]: o
            - generic [ref=e398]: r
            - generic [ref=e399]: t
            - generic [ref=e400]: h
          - generic [ref=e402]:
            - generic [ref=e403]: t
            - generic [ref=e404]: w
            - generic [ref=e405]: o
          - generic [ref=e407]:
            - generic [ref=e408]: d
            - generic [ref=e409]: a
            - generic [ref=e410]: "y"
          - generic [ref=e412]:
            - generic [ref=e413]: "n"
            - generic [ref=e414]: i
            - generic [ref=e415]: c
            - generic [ref=e416]: e
          - generic [ref=e418]:
            - generic [ref=e419]: t
            - generic [ref=e420]: o
            - generic [ref=e421]: w
            - generic [ref=e422]: "n"
          - generic [ref=e424]:
            - generic [ref=e425]: s
            - generic [ref=e426]: p
            - generic [ref=e427]: e
            - generic [ref=e428]: e
            - generic [ref=e429]: d
          - generic [ref=e431]:
            - generic [ref=e432]: o
            - generic [ref=e433]: t
            - generic [ref=e434]: h
            - generic [ref=e435]: e
            - generic [ref=e436]: r
          - generic [ref=e438]:
            - generic [ref=e439]: w
            - generic [ref=e440]: a
            - generic [ref=e441]: "n"
            - generic [ref=e442]: t
          - generic [ref=e444]:
            - generic [ref=e445]: b
            - generic [ref=e446]: r
            - generic [ref=e447]: i
            - generic [ref=e448]: "n"
            - generic [ref=e449]: g
          - generic [ref=e451]:
            - generic [ref=e452]: c
            - generic [ref=e453]: l
            - generic [ref=e454]: o
            - generic [ref=e455]: s
            - generic [ref=e456]: e
          - generic [ref=e458]:
            - generic [ref=e459]: w
            - generic [ref=e460]: h
            - generic [ref=e461]: o
          - generic [ref=e463]:
            - generic [ref=e464]: w
            - generic [ref=e465]: o
            - generic [ref=e466]: r
            - generic [ref=e467]: d
          - generic [ref=e469]:
            - generic [ref=e470]: "n"
            - generic [ref=e471]: o
            - generic [ref=e472]: r
            - generic [ref=e473]: t
            - generic [ref=e474]: h
          - generic [ref=e476]:
            - generic [ref=e477]: g
            - generic [ref=e478]: r
            - generic [ref=e479]: e
            - generic [ref=e480]: a
            - generic [ref=e481]: t
          - generic [ref=e483]:
            - generic [ref=e484]: t
            - generic [ref=e485]: u
            - generic [ref=e486]: r
            - generic [ref=e487]: "n"
          - generic [ref=e489]:
            - generic [ref=e490]: s
            - generic [ref=e491]: e
            - generic [ref=e492]: c
            - generic [ref=e493]: o
            - generic [ref=e494]: "n"
            - generic [ref=e495]: d
          - generic [ref=e497]:
            - generic [ref=e498]: s
            - generic [ref=e499]: t
            - generic [ref=e500]: a
            - generic [ref=e501]: t
            - generic [ref=e502]: e
          - generic [ref=e504]:
            - generic [ref=e505]: h
            - generic [ref=e506]: e
          - generic [ref=e508]:
            - generic [ref=e509]: a
            - generic [ref=e510]: r
            - generic [ref=e511]: e
          - generic [ref=e513]:
            - generic [ref=e514]: w
            - generic [ref=e515]: i
            - generic [ref=e516]: d
            - generic [ref=e517]: e
          - generic [ref=e519]:
            - generic [ref=e520]: f
            - generic [ref=e521]: l
            - generic [ref=e522]: o
            - generic [ref=e523]: w
          - generic [ref=e525]:
            - generic [ref=e526]: b
            - generic [ref=e527]: r
            - generic [ref=e528]: o
            - generic [ref=e529]: w
            - generic [ref=e530]: "n"
          - generic [ref=e532]:
            - generic [ref=e533]: p
            - generic [ref=e534]: l
            - generic [ref=e535]: a
            - generic [ref=e536]: "y"
          - generic [ref=e538]:
            - generic [ref=e539]: c
            - generic [ref=e540]: l
            - generic [ref=e541]: e
            - generic [ref=e542]: a
            - generic [ref=e543]: r
          - generic [ref=e545]:
            - generic [ref=e546]: a
            - generic [ref=e547]: t
          - generic [ref=e549]:
            - generic [ref=e550]: h
            - generic [ref=e551]: e
            - generic [ref=e552]: r
            - generic [ref=e553]: e
          - generic [ref=e555]:
            - generic [ref=e556]: c
            - generic [ref=e557]: l
            - generic [ref=e558]: o
            - generic [ref=e559]: s
            - generic [ref=e560]: e
          - generic [ref=e562]:
            - generic [ref=e563]: d
            - generic [ref=e564]: a
            - generic [ref=e565]: r
            - generic [ref=e566]: k
          - generic [ref=e568]:
            - generic [ref=e569]: g
            - generic [ref=e570]: a
            - generic [ref=e571]: m
            - generic [ref=e572]: e
          - generic [ref=e574]:
            - generic [ref=e575]: l
            - generic [ref=e576]: e
            - generic [ref=e577]: t
          - generic [ref=e579]:
            - generic [ref=e580]: l
            - generic [ref=e581]: e
            - generic [ref=e582]: f
            - generic [ref=e583]: t
          - generic [ref=e585]:
            - generic [ref=e586]: s
            - generic [ref=e587]: a
            - generic [ref=e588]: m
            - generic [ref=e589]: e
          - generic [ref=e591]:
            - generic [ref=e592]: w
            - generic [ref=e593]: a
            - generic [ref=e594]: t
            - generic [ref=e595]: c
            - generic [ref=e596]: h
          - generic [ref=e598]:
            - generic [ref=e599]: p
            - generic [ref=e600]: a
            - generic [ref=e601]: p
            - generic [ref=e602]: e
            - generic [ref=e603]: r
          - generic [ref=e605]:
            - generic [ref=e606]: f
            - generic [ref=e607]: u
            - generic [ref=e608]: l
            - generic [ref=e609]: l
          - generic [ref=e611]:
            - generic [ref=e612]: l
            - generic [ref=e613]: e
            - generic [ref=e614]: a
            - generic [ref=e615]: r
            - generic [ref=e616]: "n"
          - generic [ref=e618]:
            - generic [ref=e619]: f
            - generic [ref=e620]: o
            - generic [ref=e621]: c
            - generic [ref=e622]: u
            - generic [ref=e623]: s
          - generic [ref=e625]:
            - generic [ref=e626]: t
            - generic [ref=e627]: h
            - generic [ref=e628]: i
            - generic [ref=e629]: "n"
            - generic [ref=e630]: g
          - generic [ref=e632]:
            - generic [ref=e633]: "n"
            - generic [ref=e634]: e
            - generic [ref=e635]: t
          - generic [ref=e637]:
            - generic [ref=e638]: s
            - generic [ref=e639]: h
            - generic [ref=e640]: o
            - generic [ref=e641]: w
          - generic [ref=e643]:
            - generic [ref=e644]: p
            - generic [ref=e645]: i
            - generic [ref=e646]: "n"
            - generic [ref=e647]: k
          - generic [ref=e649]:
            - generic [ref=e650]: m
            - generic [ref=e651]: a
            - generic [ref=e652]: i
            - generic [ref=e653]: "n"
          - generic [ref=e655]:
            - generic [ref=e656]: s
            - generic [ref=e657]: o
            - generic [ref=e658]: o
            - generic [ref=e659]: t
          - generic [ref=e661]:
            - generic [ref=e662]: l
            - generic [ref=e663]: a
            - generic [ref=e664]: r
            - generic [ref=e665]: g
            - generic [ref=e666]: e
          - generic [ref=e668]:
            - generic [ref=e669]: m
            - generic [ref=e670]: e
          - generic [ref=e672]:
            - generic [ref=e673]: g
            - generic [ref=e674]: r
            - generic [ref=e675]: a
            - generic [ref=e676]: s
            - generic [ref=e677]: s
          - generic [ref=e679]:
            - generic [ref=e680]: t
            - generic [ref=e681]: w
            - generic [ref=e682]: o
          - generic [ref=e684]:
            - generic [ref=e685]: g
            - generic [ref=e686]: a
            - generic [ref=e687]: m
            - generic [ref=e688]: e
          - generic [ref=e690]:
            - generic [ref=e691]: r
            - generic [ref=e692]: e
            - generic [ref=e693]: t
            - generic [ref=e694]: i
            - generic [ref=e695]: "n"
            - generic [ref=e696]: a
          - generic [ref=e698]:
            - generic [ref=e699]: i
            - generic [ref=e700]: "n"
          - generic [ref=e702]:
            - generic [ref=e703]: h
            - generic [ref=e704]: e
            - generic [ref=e705]: r
          - generic [ref=e707]:
            - generic [ref=e708]: m
            - generic [ref=e709]: a
            - generic [ref=e710]: k
            - generic [ref=e711]: e
          - generic [ref=e713]:
            - generic [ref=e714]: s
            - generic [ref=e715]: h
            - generic [ref=e716]: a
            - generic [ref=e717]: p
            - generic [ref=e718]: e
          - generic [ref=e720]:
            - generic [ref=e721]: s
            - generic [ref=e722]: t
            - generic [ref=e723]: u
            - generic [ref=e724]: d
            - generic [ref=e725]: "y"
          - generic [ref=e727]:
            - generic [ref=e728]: w
            - generic [ref=e729]: o
            - generic [ref=e730]: m
            - generic [ref=e731]: a
            - generic [ref=e732]: "n"
          - generic [ref=e734]:
            - generic [ref=e735]: a
            - generic [ref=e736]: t
            - generic [ref=e737]: t
            - generic [ref=e738]: e
            - generic [ref=e739]: "n"
            - generic [ref=e740]: t
            - generic [ref=e741]: i
            - generic [ref=e742]: o
            - generic [ref=e743]: "n"
          - generic [ref=e745]:
            - generic [ref=e746]: m
            - generic [ref=e747]: a
            - generic [ref=e748]: "y"
          - generic [ref=e750]:
            - generic [ref=e751]: w
            - generic [ref=e752]: o
            - generic [ref=e753]: r
            - generic [ref=e754]: l
            - generic [ref=e755]: d
          - generic [ref=e757]:
            - generic [ref=e758]: p
            - generic [ref=e759]: r
            - generic [ref=e760]: a
            - generic [ref=e761]: c
            - generic [ref=e762]: t
            - generic [ref=e763]: i
            - generic [ref=e764]: c
            - generic [ref=e765]: e
          - generic [ref=e767]:
            - generic [ref=e768]: z
            - generic [ref=e769]: o
            - generic [ref=e770]: "n"
            - generic [ref=e771]: e
          - generic [ref=e773]:
            - generic [ref=e774]: o
            - generic [ref=e775]: u
            - generic [ref=e776]: t
          - generic [ref=e778]:
            - generic [ref=e779]: w
            - generic [ref=e780]: a
            - generic [ref=e781]: "y"
          - generic [ref=e783]:
            - generic [ref=e784]: t
            - generic [ref=e785]: a
            - generic [ref=e786]: l
            - generic [ref=e787]: l
          - generic [ref=e789]:
            - generic [ref=e790]: s
            - generic [ref=e791]: e
            - generic [ref=e792]: a
            - generic [ref=e793]: t
          - generic [ref=e795]: a
          - generic [ref=e798]:
            - generic [ref=e799]: l
            - generic [ref=e800]: i
            - generic [ref=e801]: "n"
            - generic [ref=e802]: e
          - generic [ref=e804]:
            - generic [ref=e805]: w
            - generic [ref=e806]: a
            - generic [ref=e807]: "y"
          - generic [ref=e809]:
            - generic [ref=e810]: h
            - generic [ref=e811]: o
            - generic [ref=e812]: w
          - generic [ref=e814]:
            - generic [ref=e815]: s
            - generic [ref=e816]: t
            - generic [ref=e817]: a
            - generic [ref=e818]: i
            - generic [ref=e819]: r
          - generic [ref=e821]:
            - generic [ref=e822]: f
            - generic [ref=e823]: i
            - generic [ref=e824]: "n"
            - generic [ref=e825]: e
          - generic [ref=e827]:
            - generic [ref=e828]: s
            - generic [ref=e829]: e
            - generic [ref=e830]: a
          - generic [ref=e832]:
            - generic [ref=e833]: a
            - generic [ref=e834]: t
          - generic [ref=e836]:
            - generic [ref=e837]: o
            - generic [ref=e838]: u
            - generic [ref=e839]: r
          - generic [ref=e841]:
            - generic [ref=e842]: m
            - generic [ref=e843]: o
            - generic [ref=e844]: s
            - generic [ref=e845]: t
          - generic [ref=e847]:
            - generic [ref=e848]: g
            - generic [ref=e849]: r
            - generic [ref=e850]: o
            - generic [ref=e851]: u
            - generic [ref=e852]: "n"
            - generic [ref=e853]: d
          - generic [ref=e855]:
            - generic [ref=e856]: s
            - generic [ref=e857]: e
            - generic [ref=e858]: e
        - paragraph [ref=e859]: "Practice passage: made innate there time study thing short pretty me each find work strong from these line head form fast eye tan neon oat the your ship notion great sun notion land pair lane clear race this day sound where fast which north group east north two day nice town speed other want bring close who word north great turn second state he are wide flow brown play clear at here close dark game let left same watch paper full learn focus thing net show pink main soot large me grass two game retina in her make shape study woman attention may world practice zone out way tall seat a line way how stair fine sea at our most ground see"
        - textbox "Typing input" [active] [ref=e860]
      - generic [ref=e862]:
        - paragraph [ref=e863]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e864]
      - generic [ref=e865]:
        - paragraph [ref=e866]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e867]:
          - button "Restart with new text" [ref=e868]
          - button "Show accessible text editor" [ref=e872]
          - button "Finish" [disabled] [ref=e876]
      - status [ref=e879]: Ready to type
  - contentinfo [ref=e880]:
    - generic [ref=e881]:
      - generic [ref=e882]: Find your rhythm. Let it fly.
      - generic [ref=e888]:
        - link "About & metrics" [ref=e889]:
          - /url: /about
        - link "Preferences & data" [ref=e890]:
          - /url: /settings
        - generic [ref=e891]: SparowType © 2026
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { completeCorrectedCat, focusTyping } from "./helpers";
  3   | 
  4   | async function expectPageFits(page: Page) {
  5   |   await page.locator("#main-content").waitFor();
  6   |   await page.waitForFunction(
  7   |     () => document.fonts.status === "loaded" && document.fonts.check('400 16px "Inter Variable"', "SparowType"),
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
> 22  |   expect(dimensions.document, page.url()).toBeLessThanOrEqual(dimensions.viewport + 1);
      |                                           ^ Error: http://127.0.0.1:4173/
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
  46  |     ["sparow-dark", "Sparow dark", "dark"],
  47  |     ["sparow-light", "Sparow light", "light"],
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
  105 |       expect(Math.round(rect!.height)).toBeGreaterThanOrEqual(44);
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
```