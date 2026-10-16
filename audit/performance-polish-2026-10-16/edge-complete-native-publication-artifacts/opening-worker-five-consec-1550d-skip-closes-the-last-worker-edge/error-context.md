# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> five consecutive live-worker reloads close each prior worker and final skip closes the last worker
- Location: e2e\opening-worker.spec.ts:529:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

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
        - button "Switch to light theme" [ref=e44]
        - button "Open command palette" [ref=e51]
        - link "Settings" [ref=e54] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=e58] [cursor=pointer]:
          - /url: /auth
  - main [ref=e63]:
    - heading "Typing practice" [level=1] [ref=e64]
    - region "Test configuration" [ref=e65]:
      - generic [ref=e66]:
        - group "Test mode" [ref=e67]:
          - button "Time" [pressed] [ref=e68]
          - button "Words" [ref=e72]
          - button "Quote" [ref=e75]
          - button "Code" [ref=e79]
          - button "Custom" [ref=e84]
          - button "Zen" [ref=e88]
        - group "Test duration" [ref=e91]:
          - button "15 seconds" [ref=e92]:
            - text: "15"
            - generic [ref=e93]: seconds
          - button "30 seconds" [pressed] [ref=e94]:
            - text: "30"
            - generic [ref=e95]: seconds
          - button "60 seconds" [ref=e96]:
            - text: "60"
            - generic [ref=e97]: seconds
          - button "120 seconds" [ref=e98]:
            - text: "120"
            - generic [ref=e99]: seconds
      - generic [ref=e100]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e101]:
          - checkbox "Precision mode · stop on errors" [ref=e102]
          - text: Precision mode · stop on errors
        - generic [ref=e103]:
          - text: Language
          - combobox "Language" [ref=e104]:
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
        - button "punctuation" [ref=e106]
        - button "# numbers" [ref=e108]
    - region "Typing session" [ref=e109]:
      - generic [ref=e110]:
        - generic [ref=e111]:
          - generic [ref=e112]:
            - generic [ref=e113]: 30s
            - generic [ref=e114]: remaining
          - generic [ref=e115]: —wpm
          - generic [ref=e116]: —acc %
        - generic [ref=e117]: Ready when you are
      - generic [ref=e119]:
        - generic [ref=e121]:
          - generic [ref=e122]:
            - generic [ref=e123]: w
            - generic [ref=e124]: o
            - generic [ref=e125]: r
            - generic [ref=e126]: k
          - generic [ref=e128]:
            - generic [ref=e129]: e
            - generic [ref=e130]: v
            - generic [ref=e131]: e
            - generic [ref=e132]: r
            - generic [ref=e133]: "y"
          - generic [ref=e135]:
            - generic [ref=e136]: r
            - generic [ref=e137]: o
            - generic [ref=e138]: o
            - generic [ref=e139]: m
          - generic [ref=e141]:
            - generic [ref=e142]: s
            - generic [ref=e143]: p
            - generic [ref=e144]: e
            - generic [ref=e145]: a
            - generic [ref=e146]: k
          - generic [ref=e148]:
            - generic [ref=e149]: "y"
            - generic [ref=e150]: o
            - generic [ref=e151]: u
          - generic [ref=e153]:
            - generic [ref=e154]: d
            - generic [ref=e155]: a
            - generic [ref=e156]: r
            - generic [ref=e157]: k
          - generic [ref=e159]:
            - generic [ref=e160]: o
            - generic [ref=e161]: r
          - generic [ref=e163]:
            - generic [ref=e164]: m
            - generic [ref=e165]: a
            - generic [ref=e166]: "y"
          - generic [ref=e168]:
            - generic [ref=e169]: c
            - generic [ref=e170]: a
            - generic [ref=e171]: "n"
          - generic [ref=e173]:
            - generic [ref=e174]: t
            - generic [ref=e175]: e
            - generic [ref=e176]: e
            - generic [ref=e177]: "n"
          - generic [ref=e179]:
            - generic [ref=e180]: m
            - generic [ref=e181]: a
            - generic [ref=e182]: "n"
            - generic [ref=e183]: "y"
          - generic [ref=e185]:
            - generic [ref=e186]: l
            - generic [ref=e187]: e
            - generic [ref=e188]: t
            - generic [ref=e189]: t
            - generic [ref=e190]: e
            - generic [ref=e191]: r
          - generic [ref=e193]:
            - generic [ref=e194]: q
            - generic [ref=e195]: u
            - generic [ref=e196]: i
            - generic [ref=e197]: e
            - generic [ref=e198]: t
          - generic [ref=e200]:
            - generic [ref=e201]: t
            - generic [ref=e202]: i
            - generic [ref=e203]: r
            - generic [ref=e204]: e
          - generic [ref=e206]:
            - generic [ref=e207]: t
            - generic [ref=e208]: h
            - generic [ref=e209]: e
            - generic [ref=e210]: i
            - generic [ref=e211]: r
          - generic [ref=e213]:
            - generic [ref=e214]: w
            - generic [ref=e215]: o
            - generic [ref=e216]: r
            - generic [ref=e217]: k
          - generic [ref=e219]:
            - generic [ref=e220]: p
            - generic [ref=e221]: o
            - generic [ref=e222]: e
            - generic [ref=e223]: m
          - generic [ref=e225]:
            - generic [ref=e226]: s
            - generic [ref=e227]: o
            - generic [ref=e228]: o
            - generic [ref=e229]: t
          - generic [ref=e231]:
            - generic [ref=e232]: c
            - generic [ref=e233]: o
            - generic [ref=e234]: l
            - generic [ref=e235]: d
          - generic [ref=e237]:
            - generic [ref=e238]: t
            - generic [ref=e239]: e
            - generic [ref=e240]: r
            - generic [ref=e241]: r
            - generic [ref=e242]: a
            - generic [ref=e243]: i
            - generic [ref=e244]: "n"
          - generic [ref=e246]:
            - generic [ref=e247]: p
            - generic [ref=e248]: a
            - generic [ref=e249]: r
            - generic [ref=e250]: k
          - generic [ref=e252]:
            - generic [ref=e253]: t
            - generic [ref=e254]: i
            - generic [ref=e255]: e
          - generic [ref=e257]:
            - generic [ref=e258]: m
            - generic [ref=e259]: o
            - generic [ref=e260]: v
            - generic [ref=e261]: e
          - generic [ref=e263]:
            - generic [ref=e264]: t
            - generic [ref=e265]: e
            - generic [ref=e266]: a
            - generic [ref=e267]: r
          - generic [ref=e269]:
            - generic [ref=e270]: e
            - generic [ref=e271]: a
            - generic [ref=e272]: c
            - generic [ref=e273]: h
          - generic [ref=e275]:
            - generic [ref=e276]: l
            - generic [ref=e277]: a
            - generic [ref=e278]: "n"
            - generic [ref=e279]: d
          - generic [ref=e281]:
            - generic [ref=e282]: b
            - generic [ref=e283]: o
            - generic [ref=e284]: o
            - generic [ref=e285]: k
          - generic [ref=e287]:
            - generic [ref=e288]: f
            - generic [ref=e289]: u
            - generic [ref=e290]: "n"
          - generic [ref=e292]:
            - generic [ref=e293]: u
            - generic [ref=e294]: p
          - generic [ref=e296]:
            - generic [ref=e297]: s
            - generic [ref=e298]: u
            - generic [ref=e299]: m
            - generic [ref=e300]: m
            - generic [ref=e301]: e
            - generic [ref=e302]: r
          - generic [ref=e304]:
            - generic [ref=e305]: p
            - generic [ref=e306]: r
            - generic [ref=e307]: a
            - generic [ref=e308]: c
            - generic [ref=e309]: t
            - generic [ref=e310]: i
            - generic [ref=e311]: c
            - generic [ref=e312]: e
          - generic [ref=e314]:
            - generic [ref=e315]: s
            - generic [ref=e316]: t
            - generic [ref=e317]: o
            - generic [ref=e318]: r
            - generic [ref=e319]: e
          - generic [ref=e321]:
            - generic [ref=e322]: t
            - generic [ref=e323]: h
            - generic [ref=e324]: r
            - generic [ref=e325]: o
            - generic [ref=e326]: u
            - generic [ref=e327]: g
            - generic [ref=e328]: h
          - generic [ref=e330]:
            - generic [ref=e331]: l
            - generic [ref=e332]: a
            - generic [ref=e333]: s
            - generic [ref=e334]: t
          - generic [ref=e336]:
            - generic [ref=e337]: t
            - generic [ref=e338]: h
            - generic [ref=e339]: e
            - generic [ref=e340]: s
            - generic [ref=e341]: e
          - generic [ref=e343]:
            - generic [ref=e344]: g
            - generic [ref=e345]: r
            - generic [ref=e346]: o
            - generic [ref=e347]: u
            - generic [ref=e348]: "n"
            - generic [ref=e349]: d
          - generic [ref=e351]:
            - generic [ref=e352]: b
            - generic [ref=e353]: a
            - generic [ref=e354]: c
            - generic [ref=e355]: k
          - generic [ref=e357]:
            - generic [ref=e358]: q
            - generic [ref=e359]: u
            - generic [ref=e360]: i
            - generic [ref=e361]: t
            - generic [ref=e362]: e
          - generic [ref=e364]:
            - generic [ref=e365]: s
            - generic [ref=e366]: o
            - generic [ref=e367]: r
            - generic [ref=e368]: e
          - generic [ref=e370]:
            - generic [ref=e371]: s
            - generic [ref=e372]: e
            - generic [ref=e373]: e
            - generic [ref=e374]: "n"
          - generic [ref=e376]:
            - generic [ref=e377]: c
            - generic [ref=e378]: l
            - generic [ref=e379]: e
            - generic [ref=e380]: a
            - generic [ref=e381]: r
          - generic [ref=e383]:
            - generic [ref=e384]: a
            - generic [ref=e385]: t
          - generic [ref=e387]:
            - generic [ref=e388]: t
            - generic [ref=e389]: h
            - generic [ref=e390]: o
            - generic [ref=e391]: u
            - generic [ref=e392]: g
            - generic [ref=e393]: h
            - generic [ref=e394]: t
          - generic [ref=e396]:
            - generic [ref=e397]: h
            - generic [ref=e398]: a
            - generic [ref=e399]: r
            - generic [ref=e400]: d
          - generic [ref=e402]:
            - generic [ref=e403]: t
            - generic [ref=e404]: e
            - generic [ref=e405]: "n"
            - generic [ref=e406]: t
          - generic [ref=e408]:
            - generic [ref=e409]: s
            - generic [ref=e410]: e
            - generic [ref=e411]: a
          - generic [ref=e413]:
            - generic [ref=e414]: a
            - generic [ref=e415]: "n"
            - generic [ref=e416]: t
          - generic [ref=e418]:
            - generic [ref=e419]: l
            - generic [ref=e420]: e
            - generic [ref=e421]: a
            - generic [ref=e422]: r
            - generic [ref=e423]: "n"
          - generic [ref=e425]:
            - generic [ref=e426]: s
            - generic [ref=e427]: i
            - generic [ref=e428]: l
            - generic [ref=e429]: v
            - generic [ref=e430]: e
            - generic [ref=e431]: r
          - generic [ref=e433]:
            - generic [ref=e434]: s
            - generic [ref=e435]: k
            - generic [ref=e436]: "y"
          - generic [ref=e438]:
            - generic [ref=e439]: l
            - generic [ref=e440]: a
            - generic [ref=e441]: "n"
            - generic [ref=e442]: e
          - generic [ref=e444]:
            - generic [ref=e445]: w
            - generic [ref=e446]: o
            - generic [ref=e447]: o
            - generic [ref=e448]: d
          - generic [ref=e450]:
            - generic [ref=e451]: l
            - generic [ref=e452]: o
            - generic [ref=e453]: "n"
            - generic [ref=e454]: g
          - generic [ref=e456]:
            - generic [ref=e457]: i
            - generic [ref=e458]: r
            - generic [ref=e459]: o
            - generic [ref=e460]: "n"
          - generic [ref=e462]:
            - generic [ref=e463]: g
            - generic [ref=e464]: r
            - generic [ref=e465]: e
            - generic [ref=e466]: e
            - generic [ref=e467]: "n"
          - generic [ref=e469]:
            - generic [ref=e470]: w
            - generic [ref=e471]: o
            - generic [ref=e472]: r
            - generic [ref=e473]: d
          - generic [ref=e475]:
            - generic [ref=e476]: h
            - generic [ref=e477]: i
            - generic [ref=e478]: l
            - generic [ref=e479]: l
          - generic [ref=e481]:
            - generic [ref=e482]: g
            - generic [ref=e483]: l
            - generic [ref=e484]: a
            - generic [ref=e485]: s
            - generic [ref=e486]: s
          - generic [ref=e488]:
            - generic [ref=e489]: w
            - generic [ref=e490]: h
            - generic [ref=e491]: "y"
          - generic [ref=e493]:
            - generic [ref=e494]: c
            - generic [ref=e495]: o
            - generic [ref=e496]: l
            - generic [ref=e497]: d
          - generic [ref=e499]:
            - generic [ref=e500]: r
            - generic [ref=e501]: e
            - generic [ref=e502]: s
            - generic [ref=e503]: t
          - generic [ref=e505]:
            - generic [ref=e506]: l
            - generic [ref=e507]: a
            - generic [ref=e508]: "n"
            - generic [ref=e509]: e
          - generic [ref=e511]:
            - generic [ref=e512]: a
            - generic [ref=e513]: s
          - generic [ref=e515]:
            - generic [ref=e516]: f
            - generic [ref=e517]: o
            - generic [ref=e518]: r
            - generic [ref=e519]: g
            - generic [ref=e520]: e
          - generic [ref=e522]:
            - generic [ref=e523]: "n"
            - generic [ref=e524]: e
            - generic [ref=e525]: e
            - generic [ref=e526]: d
          - generic [ref=e528]:
            - generic [ref=e529]: b
            - generic [ref=e530]: l
            - generic [ref=e531]: a
            - generic [ref=e532]: c
            - generic [ref=e533]: k
          - generic [ref=e535]:
            - generic [ref=e536]: i
            - generic [ref=e537]: "n"
            - generic [ref=e538]: t
            - generic [ref=e539]: o
          - generic [ref=e541]:
            - generic [ref=e542]: g
            - generic [ref=e543]: o
          - generic [ref=e545]:
            - generic [ref=e546]: s
            - generic [ref=e547]: p
            - generic [ref=e548]: a
            - generic [ref=e549]: c
            - generic [ref=e550]: e
          - generic [ref=e552]:
            - generic [ref=e553]: p
            - generic [ref=e554]: o
            - generic [ref=e555]: e
            - generic [ref=e556]: m
          - generic [ref=e558]:
            - generic [ref=e559]: p
            - generic [ref=e560]: u
            - generic [ref=e561]: t
          - generic [ref=e563]:
            - generic [ref=e564]: s
            - generic [ref=e565]: p
            - generic [ref=e566]: e
            - generic [ref=e567]: e
            - generic [ref=e568]: d
          - generic [ref=e570]:
            - generic [ref=e571]: p
            - generic [ref=e572]: l
            - generic [ref=e573]: a
            - generic [ref=e574]: i
            - generic [ref=e575]: "n"
          - generic [ref=e577]:
            - generic [ref=e578]: p
            - generic [ref=e579]: r
            - generic [ref=e580]: e
            - generic [ref=e581]: t
            - generic [ref=e582]: t
            - generic [ref=e583]: "y"
          - generic [ref=e585]:
            - generic [ref=e586]: e
            - generic [ref=e587]: a
            - generic [ref=e588]: s
            - generic [ref=e589]: t
          - generic [ref=e591]:
            - generic [ref=e592]: t
            - generic [ref=e593]: r
            - generic [ref=e594]: a
            - generic [ref=e595]: i
            - generic [ref=e596]: "n"
          - generic [ref=e598]:
            - generic [ref=e599]: p
            - generic [ref=e600]: o
            - generic [ref=e601]: e
            - generic [ref=e602]: m
          - generic [ref=e604]:
            - generic [ref=e605]: c
            - generic [ref=e606]: a
            - generic [ref=e607]: l
            - generic [ref=e608]: m
          - generic [ref=e610]:
            - generic [ref=e611]: t
            - generic [ref=e612]: a
            - generic [ref=e613]: s
            - generic [ref=e614]: t
            - generic [ref=e615]: e
          - generic [ref=e617]:
            - generic [ref=e618]: a
            - generic [ref=e619]: "n"
            - generic [ref=e620]: t
          - generic [ref=e622]:
            - generic [ref=e623]: w
            - generic [ref=e624]: o
            - generic [ref=e625]: r
            - generic [ref=e626]: d
          - generic [ref=e628]:
            - generic [ref=e629]: r
            - generic [ref=e630]: e
            - generic [ref=e631]: t
            - generic [ref=e632]: a
            - generic [ref=e633]: i
            - generic [ref=e634]: "n"
          - generic [ref=e636]: i
          - generic [ref=e639]:
            - generic [ref=e640]: m
            - generic [ref=e641]: a
            - generic [ref=e642]: k
            - generic [ref=e643]: e
          - generic [ref=e645]:
            - generic [ref=e646]: r
            - generic [ref=e647]: o
            - generic [ref=e648]: o
            - generic [ref=e649]: m
          - generic [ref=e651]:
            - generic [ref=e652]: w
            - generic [ref=e653]: h
            - generic [ref=e654]: i
            - generic [ref=e655]: c
            - generic [ref=e656]: h
          - generic [ref=e658]:
            - generic [ref=e659]: h
            - generic [ref=e660]: o
            - generic [ref=e661]: m
            - generic [ref=e662]: e
          - generic [ref=e664]:
            - generic [ref=e665]: c
            - generic [ref=e666]: a
            - generic [ref=e667]: r
            - generic [ref=e668]: e
          - generic [ref=e670]:
            - generic [ref=e671]: p
            - generic [ref=e672]: o
            - generic [ref=e673]: w
            - generic [ref=e674]: e
            - generic [ref=e675]: r
          - generic [ref=e677]:
            - generic [ref=e678]: m
            - generic [ref=e679]: o
            - generic [ref=e680]: s
            - generic [ref=e681]: t
          - generic [ref=e683]:
            - generic [ref=e684]: h
            - generic [ref=e685]: o
            - generic [ref=e686]: w
          - generic [ref=e688]:
            - generic [ref=e689]: e
            - generic [ref=e690]: "n"
            - generic [ref=e691]: d
          - generic [ref=e693]:
            - generic [ref=e694]: f
            - generic [ref=e695]: i
            - generic [ref=e696]: "n"
            - generic [ref=e697]: d
          - generic [ref=e699]:
            - generic [ref=e700]: s
            - generic [ref=e701]: o
          - generic [ref=e703]:
            - generic [ref=e704]: o
            - generic [ref=e705]: "n"
            - generic [ref=e706]: i
            - generic [ref=e707]: o
            - generic [ref=e708]: "n"
          - generic [ref=e710]:
            - generic [ref=e711]: f
            - generic [ref=e712]: i
            - generic [ref=e713]: v
            - generic [ref=e714]: e
          - generic [ref=e716]:
            - generic [ref=e717]: s
            - generic [ref=e718]: l
            - generic [ref=e719]: o
            - generic [ref=e720]: w
          - generic [ref=e722]:
            - generic [ref=e723]: p
            - generic [ref=e724]: a
            - generic [ref=e725]: t
            - generic [ref=e726]: h
          - generic [ref=e728]:
            - generic [ref=e729]: a
            - generic [ref=e730]: r
            - generic [ref=e731]: i
            - generic [ref=e732]: s
            - generic [ref=e733]: e
          - generic [ref=e735]:
            - generic [ref=e736]: s
            - generic [ref=e737]: i
            - generic [ref=e738]: d
            - generic [ref=e739]: e
          - generic [ref=e741]:
            - generic [ref=e742]: w
            - generic [ref=e743]: h
            - generic [ref=e744]: i
            - generic [ref=e745]: t
            - generic [ref=e746]: e
          - generic [ref=e748]:
            - generic [ref=e749]: m
            - generic [ref=e750]: i
            - generic [ref=e751]: "n"
            - generic [ref=e752]: e
          - generic [ref=e754]:
            - generic [ref=e755]: d
            - generic [ref=e756]: r
            - generic [ref=e757]: e
            - generic [ref=e758]: a
            - generic [ref=e759]: m
          - generic [ref=e761]:
            - generic [ref=e762]: t
            - generic [ref=e763]: a
            - generic [ref=e764]: l
            - generic [ref=e765]: l
          - generic [ref=e767]:
            - generic [ref=e768]: s
            - generic [ref=e769]: o
            - generic [ref=e770]: r
            - generic [ref=e771]: t
          - generic [ref=e773]:
            - generic [ref=e774]: m
            - generic [ref=e775]: e
            - generic [ref=e776]: e
            - generic [ref=e777]: t
          - generic [ref=e779]:
            - generic [ref=e780]: t
            - generic [ref=e781]: i
            - generic [ref=e782]: m
            - generic [ref=e783]: e
          - generic [ref=e785]:
            - generic [ref=e786]: w
            - generic [ref=e787]: a
            - generic [ref=e788]: t
            - generic [ref=e789]: c
            - generic [ref=e790]: h
          - generic [ref=e792]:
            - generic [ref=e793]: z
            - generic [ref=e794]: o
            - generic [ref=e795]: "n"
            - generic [ref=e796]: e
          - generic [ref=e798]:
            - generic [ref=e799]: w
            - generic [ref=e800]: h
            - generic [ref=e801]: o
          - generic [ref=e803]:
            - generic [ref=e804]: o
            - generic [ref=e805]: u
            - generic [ref=e806]: r
          - generic [ref=e808]:
            - generic [ref=e809]: h
            - generic [ref=e810]: e
            - generic [ref=e811]: r
          - generic [ref=e813]:
            - generic [ref=e814]: w
            - generic [ref=e815]: i
            - generic [ref=e816]: "n"
            - generic [ref=e817]: d
            - generic [ref=e818]: o
            - generic [ref=e819]: w
          - generic [ref=e821]:
            - generic [ref=e822]: t
            - generic [ref=e823]: h
            - generic [ref=e824]: i
            - generic [ref=e825]: s
          - generic [ref=e827]:
            - generic [ref=e828]: t
            - generic [ref=e829]: e
            - generic [ref=e830]: r
            - generic [ref=e831]: r
            - generic [ref=e832]: a
            - generic [ref=e833]: i
            - generic [ref=e834]: "n"
          - generic [ref=e836]:
            - generic [ref=e837]: o
            - generic [ref=e838]: p
            - generic [ref=e839]: e
            - generic [ref=e840]: "n"
          - generic [ref=e842]:
            - generic [ref=e843]: l
            - generic [ref=e844]: o
            - generic [ref=e845]: v
            - generic [ref=e846]: e
          - generic [ref=e848]:
            - generic [ref=e849]: w
            - generic [ref=e850]: h
            - generic [ref=e851]: a
            - generic [ref=e852]: t
          - generic [ref=e854]:
            - generic [ref=e855]: s
            - generic [ref=e856]: m
            - generic [ref=e857]: a
            - generic [ref=e858]: l
            - generic [ref=e859]: l
          - generic [ref=e861]:
            - generic [ref=e862]: t
            - generic [ref=e863]: i
            - generic [ref=e864]: r
            - generic [ref=e865]: e
        - paragraph [ref=e866]: "Practice passage: work every room speak you dark or may can teen many letter quiet tire their work poem soot cold terrain park tie move tear each land book fun up summer practice store through last these ground back quite sore seen clear at thought hard tent sea ant learn silver sky lane wood long iron green word hill glass why cold rest lane as forge need black into go space poem put speed plain pretty east train poem calm taste ant word retain i make room which home care power most how end find so onion five slow path arise side white mine dream tall sort meet time watch zone who our her window this terrain open love what small tire"
        - textbox "Typing input" [active] [ref=e867]
      - generic [ref=e869]:
        - paragraph [ref=e870]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e871]
      - generic [ref=e872]:
        - paragraph [ref=e873]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e874]:
          - button "Restart with new text" [ref=e875]
          - button "Show accessible text editor" [ref=e879]
          - button "Finish" [disabled] [ref=e883]
      - status [ref=e886]: Ready to type
  - contentinfo [ref=e887]:
    - generic [ref=e888]:
      - generic [ref=e889]:
        - generic [ref=e890]:
          - generic [ref=e891]: Sparow
          - generic [ref=e892]: Type
        - text: Find your rhythm.
      - generic [ref=e893]:
        - link "About & metrics" [ref=e894] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e895] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e896] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e897] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e898] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e899] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e900]: SparowType © 2026
```

# Test source

```ts
  112 |             if (
  113 |               ["ready", "diagnostics", "failure", "disposed"].includes(
  114 |                 data.type,
  115 |               ) ||
  116 |               data.type.startsWith("test-")
  117 |             )
  118 |               record.received.push({ ...data, atMs: performance.now() });
  119 |           },
  120 |         );
  121 |         return worker;
  122 |       },
  123 |     });
  124 |     Object.defineProperty(window, "Worker", {
  125 |       configurable: true,
  126 |       writable: true,
  127 |       value: instrumented,
  128 |     });
  129 |   });
  130 | }
  131 | 
  132 | async function records(page: Page) {
  133 |   return page.evaluate(
  134 |     () => (window as AuditedWindow).openingWorkerAudit?.records ?? [],
  135 |   );
  136 | }
  137 | 
  138 | async function observeNativeFallbackAnimations(page: Page) {
  139 |   await page.addInitScript(() => {
  140 |     const ids = new WeakMap<Animation, number>();
  141 |     const timelines = new WeakMap<AnimationTimeline, number>();
  142 |     let nextId = 0;
  143 |     let nextTimeline = 0;
  144 |     const actions: FallbackAnimationAction[] = [];
  145 |     const sample = (animation: Animation): FallbackAnimationSample | null => {
  146 |       if (!(animation instanceof CSSAnimation)) return null;
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
> 212 |     .toBe(true);
      |      ^ Error: expect(received).toBe(expected) // Object.is equality
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
  247 |     .toBe(0);
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
```