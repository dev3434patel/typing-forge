# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> actual worker WebGL context loss after live frames recovers with a fresh canvas and keeps practice usable
- Location: e2e\opening-worker.spec.ts:804:1

# Error details

```
Error: Timeout 5000ms exceeded while waiting on the predicate
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
            - generic [ref=e123]: a
            - generic [ref=e124]: "n"
            - generic [ref=e125]: t
          - generic [ref=e127]:
            - generic [ref=e128]: s
            - generic [ref=e129]: t
            - generic [ref=e130]: o
            - generic [ref=e131]: p
          - generic [ref=e133]:
            - generic [ref=e134]: p
            - generic [ref=e135]: a
            - generic [ref=e136]: i
            - generic [ref=e137]: r
          - generic [ref=e139]:
            - generic [ref=e140]: h
            - generic [ref=e141]: a
            - generic [ref=e142]: s
          - generic [ref=e144]:
            - generic [ref=e145]: o
            - generic [ref=e146]: r
          - generic [ref=e148]:
            - generic [ref=e149]: u
            - generic [ref=e150]: p
          - generic [ref=e152]:
            - generic [ref=e153]: s
            - generic [ref=e154]: i
            - generic [ref=e155]: d
            - generic [ref=e156]: e
          - generic [ref=e158]:
            - generic [ref=e159]: o
            - generic [ref=e160]: l
            - generic [ref=e161]: d
          - generic [ref=e163]:
            - generic [ref=e164]: p
            - generic [ref=e165]: e
            - generic [ref=e166]: r
            - generic [ref=e167]: s
            - generic [ref=e168]: o
            - generic [ref=e169]: "n"
          - generic [ref=e171]:
            - generic [ref=e172]: s
            - generic [ref=e173]: u
            - generic [ref=e174]: r
            - generic [ref=e175]: e
          - generic [ref=e177]:
            - generic [ref=e178]: r
            - generic [ref=e179]: e
            - generic [ref=e180]: a
            - generic [ref=e181]: d
            - generic [ref=e182]: "y"
          - generic [ref=e184]:
            - generic [ref=e185]: t
            - generic [ref=e186]: a
            - generic [ref=e187]: s
            - generic [ref=e188]: t
            - generic [ref=e189]: e
          - generic [ref=e191]:
            - generic [ref=e192]: b
            - generic [ref=e193]: r
            - generic [ref=e194]: i
            - generic [ref=e195]: "n"
            - generic [ref=e196]: g
          - generic [ref=e198]:
            - generic [ref=e199]: o
            - generic [ref=e200]: r
            - generic [ref=e201]: d
            - generic [ref=e202]: e
            - generic [ref=e203]: r
          - generic [ref=e205]:
            - generic [ref=e206]: l
            - generic [ref=e207]: i
            - generic [ref=e208]: t
            - generic [ref=e209]: t
            - generic [ref=e210]: l
            - generic [ref=e211]: e
          - generic [ref=e213]:
            - generic [ref=e214]: j
            - generic [ref=e215]: o
            - generic [ref=e216]: i
            - generic [ref=e217]: "n"
          - generic [ref=e219]:
            - generic [ref=e220]: s
            - generic [ref=e221]: m
            - generic [ref=e222]: i
            - generic [ref=e223]: l
            - generic [ref=e224]: e
          - generic [ref=e226]:
            - generic [ref=e227]: f
            - generic [ref=e228]: e
            - generic [ref=e229]: w
          - generic [ref=e231]:
            - generic [ref=e232]: t
            - generic [ref=e233]: a
            - generic [ref=e234]: s
            - generic [ref=e235]: k
          - generic [ref=e237]:
            - generic [ref=e238]: m
            - generic [ref=e239]: u
            - generic [ref=e240]: s
            - generic [ref=e241]: t
          - generic [ref=e243]:
            - generic [ref=e244]: r
            - generic [ref=e245]: o
            - generic [ref=e246]: a
            - generic [ref=e247]: d
          - generic [ref=e249]:
            - generic [ref=e250]: e
            - generic [ref=e251]: a
            - generic [ref=e252]: r
            - generic [ref=e253]: t
            - generic [ref=e254]: h
          - generic [ref=e256]:
            - generic [ref=e257]: t
            - generic [ref=e258]: o
            - generic [ref=e259]: p
          - generic [ref=e261]:
            - generic [ref=e262]: r
            - generic [ref=e263]: e
            - generic [ref=e264]: s
            - generic [ref=e265]: t
          - generic [ref=e267]:
            - generic [ref=e268]: "y"
            - generic [ref=e269]: o
            - generic [ref=e270]: u
          - generic [ref=e272]:
            - generic [ref=e273]: f
            - generic [ref=e274]: i
            - generic [ref=e275]: "n"
            - generic [ref=e276]: d
          - generic [ref=e278]:
            - generic [ref=e279]: t
            - generic [ref=e280]: a
            - generic [ref=e281]: "n"
          - generic [ref=e283]:
            - generic [ref=e284]: t
            - generic [ref=e285]: a
            - generic [ref=e286]: s
            - generic [ref=e287]: t
            - generic [ref=e288]: e
          - generic [ref=e290]:
            - generic [ref=e291]: b
            - generic [ref=e292]: a
            - generic [ref=e293]: c
            - generic [ref=e294]: k
          - generic [ref=e296]:
            - generic [ref=e297]: f
            - generic [ref=e298]: u
            - generic [ref=e299]: l
            - generic [ref=e300]: l
          - generic [ref=e302]:
            - generic [ref=e303]: a
            - generic [ref=e304]: r
            - generic [ref=e305]: e
          - generic [ref=e307]:
            - generic [ref=e308]: s
            - generic [ref=e309]: o
            - generic [ref=e310]: o
            - generic [ref=e311]: t
          - generic [ref=e313]:
            - generic [ref=e314]: r
            - generic [ref=e315]: a
            - generic [ref=e316]: c
            - generic [ref=e317]: e
          - generic [ref=e319]:
            - generic [ref=e320]: z
            - generic [ref=e321]: i
            - generic [ref=e322]: "n"
            - generic [ref=e323]: c
          - generic [ref=e325]:
            - generic [ref=e326]: j
            - generic [ref=e327]: u
            - generic [ref=e328]: m
            - generic [ref=e329]: p
          - generic [ref=e331]:
            - generic [ref=e332]: t
            - generic [ref=e333]: e
            - generic [ref=e334]: a
          - generic [ref=e336]:
            - generic [ref=e337]: o
            - generic [ref=e338]: "n"
          - generic [ref=e340]:
            - generic [ref=e341]: m
            - generic [ref=e342]: u
            - generic [ref=e343]: c
            - generic [ref=e344]: h
          - generic [ref=e346]:
            - generic [ref=e347]: s
            - generic [ref=e348]: o
          - generic [ref=e350]:
            - generic [ref=e351]: t
            - generic [ref=e352]: e
            - generic [ref=e353]: e
            - generic [ref=e354]: "n"
          - generic [ref=e356]:
            - generic [ref=e357]: s
            - generic [ref=e358]: h
            - generic [ref=e359]: i
            - generic [ref=e360]: "n"
            - generic [ref=e361]: e
          - generic [ref=e363]:
            - generic [ref=e364]: p
            - generic [ref=e365]: a
            - generic [ref=e366]: g
            - generic [ref=e367]: e
          - generic [ref=e369]:
            - generic [ref=e370]: "y"
            - generic [ref=e371]: o
            - generic [ref=e372]: u
            - generic [ref=e373]: r
          - generic [ref=e375]:
            - generic [ref=e376]: l
            - generic [ref=e377]: o
            - generic [ref=e378]: "n"
            - generic [ref=e379]: g
          - generic [ref=e381]:
            - generic [ref=e382]: m
            - generic [ref=e383]: a
            - generic [ref=e384]: p
          - generic [ref=e386]:
            - generic [ref=e387]: h
            - generic [ref=e388]: e
            - generic [ref=e389]: r
            - generic [ref=e390]: e
          - generic [ref=e392]:
            - generic [ref=e393]: f
            - generic [ref=e394]: e
            - generic [ref=e395]: e
            - generic [ref=e396]: l
          - generic [ref=e398]:
            - generic [ref=e399]: l
            - generic [ref=e400]: a
            - generic [ref=e401]: t
            - generic [ref=e402]: e
          - generic [ref=e404]:
            - generic [ref=e405]: i
            - generic [ref=e406]: t
          - generic [ref=e408]:
            - generic [ref=e409]: l
            - generic [ref=e410]: e
            - generic [ref=e411]: a
            - generic [ref=e412]: "n"
          - generic [ref=e414]:
            - generic [ref=e415]: m
            - generic [ref=e416]: a
            - generic [ref=e417]: p
          - generic [ref=e419]:
            - generic [ref=e420]: r
            - generic [ref=e421]: a
            - generic [ref=e422]: c
            - generic [ref=e423]: e
          - generic [ref=e425]:
            - generic [ref=e426]: w
            - generic [ref=e427]: i
            - generic [ref=e428]: "n"
            - generic [ref=e429]: d
          - generic [ref=e431]:
            - generic [ref=e432]: p
            - generic [ref=e433]: a
            - generic [ref=e434]: g
            - generic [ref=e435]: e
          - generic [ref=e437]:
            - generic [ref=e438]: e
            - generic [ref=e439]: a
            - generic [ref=e440]: t
          - generic [ref=e442]:
            - generic [ref=e443]: o
            - generic [ref=e444]: w
            - generic [ref=e445]: "n"
          - generic [ref=e447]:
            - generic [ref=e448]: s
            - generic [ref=e449]: a
            - generic [ref=e450]: "n"
            - generic [ref=e451]: e
          - generic [ref=e453]:
            - generic [ref=e454]: o
            - generic [ref=e455]: v
            - generic [ref=e456]: e
            - generic [ref=e457]: r
          - generic [ref=e459]:
            - generic [ref=e460]: "n"
            - generic [ref=e461]: e
            - generic [ref=e462]: w
          - generic [ref=e464]:
            - generic [ref=e465]: s
            - generic [ref=e466]: o
            - generic [ref=e467]: r
            - generic [ref=e468]: t
          - generic [ref=e470]:
            - generic [ref=e471]: s
            - generic [ref=e472]: p
            - generic [ref=e473]: a
            - generic [ref=e474]: c
            - generic [ref=e475]: e
          - generic [ref=e477]:
            - generic [ref=e478]: k
            - generic [ref=e479]: e
            - generic [ref=e480]: e
            - generic [ref=e481]: "n"
          - generic [ref=e483]:
            - generic [ref=e484]: r
            - generic [ref=e485]: a
            - generic [ref=e486]: t
            - generic [ref=e487]: i
            - generic [ref=e488]: o
            - generic [ref=e489]: "n"
          - generic [ref=e491]:
            - generic [ref=e492]: s
            - generic [ref=e493]: p
            - generic [ref=e494]: e
            - generic [ref=e495]: e
            - generic [ref=e496]: d
          - generic [ref=e498]:
            - generic [ref=e499]: e
            - generic [ref=e500]: a
            - generic [ref=e501]: r
            - generic [ref=e502]: "n"
          - generic [ref=e504]:
            - generic [ref=e505]: g
            - generic [ref=e506]: r
            - generic [ref=e507]: o
            - generic [ref=e508]: w
          - generic [ref=e510]:
            - generic [ref=e511]: "n"
            - generic [ref=e512]: i
            - generic [ref=e513]: "n"
            - generic [ref=e514]: e
          - generic [ref=e516]:
            - generic [ref=e517]: r
            - generic [ref=e518]: i
            - generic [ref=e519]: g
            - generic [ref=e520]: h
            - generic [ref=e521]: t
          - generic [ref=e523]:
            - generic [ref=e524]: j
            - generic [ref=e525]: u
            - generic [ref=e526]: m
            - generic [ref=e527]: p
          - generic [ref=e529]:
            - generic [ref=e530]: f
            - generic [ref=e531]: i
            - generic [ref=e532]: r
            - generic [ref=e533]: e
          - generic [ref=e535]:
            - generic [ref=e536]: t
            - generic [ref=e537]: h
            - generic [ref=e538]: a
            - generic [ref=e539]: "n"
            - generic [ref=e540]: k
          - generic [ref=e542]:
            - generic [ref=e543]: b
            - generic [ref=e544]: u
            - generic [ref=e545]: i
            - generic [ref=e546]: l
            - generic [ref=e547]: d
          - generic [ref=e549]:
            - generic [ref=e550]: r
            - generic [ref=e551]: a
            - generic [ref=e552]: c
            - generic [ref=e553]: e
          - generic [ref=e555]:
            - generic [ref=e556]: "y"
            - generic [ref=e557]: e
            - generic [ref=e558]: t
          - generic [ref=e560]:
            - generic [ref=e561]: "n"
            - generic [ref=e562]: i
            - generic [ref=e563]: "n"
            - generic [ref=e564]: e
          - generic [ref=e566]:
            - generic [ref=e567]: p
            - generic [ref=e568]: a
            - generic [ref=e569]: t
            - generic [ref=e570]: h
          - generic [ref=e572]:
            - generic [ref=e573]: u
            - generic [ref=e574]: "n"
            - generic [ref=e575]: d
            - generic [ref=e576]: e
            - generic [ref=e577]: r
          - generic [ref=e579]:
            - generic [ref=e580]: s
            - generic [ref=e581]: h
            - generic [ref=e582]: a
            - generic [ref=e583]: r
            - generic [ref=e584]: e
          - generic [ref=e586]:
            - generic [ref=e587]: t
            - generic [ref=e588]: h
            - generic [ref=e589]: a
            - generic [ref=e590]: "n"
            - generic [ref=e591]: k
          - generic [ref=e593]:
            - generic [ref=e594]: s
            - generic [ref=e595]: h
            - generic [ref=e596]: o
            - generic [ref=e597]: w
          - generic [ref=e599]:
            - generic [ref=e600]: s
            - generic [ref=e601]: m
            - generic [ref=e602]: i
            - generic [ref=e603]: l
            - generic [ref=e604]: e
          - generic [ref=e606]:
            - generic [ref=e607]: "n"
            - generic [ref=e608]: e
            - generic [ref=e609]: x
            - generic [ref=e610]: t
          - generic [ref=e612]:
            - generic [ref=e613]: c
            - generic [ref=e614]: a
            - generic [ref=e615]: "n"
          - generic [ref=e617]:
            - generic [ref=e618]: o
            - generic [ref=e619]: "n"
            - generic [ref=e620]: l
            - generic [ref=e621]: "y"
          - generic [ref=e623]:
            - generic [ref=e624]: "n"
            - generic [ref=e625]: e
            - generic [ref=e626]: s
            - generic [ref=e627]: t
          - generic [ref=e629]:
            - generic [ref=e630]: s
            - generic [ref=e631]: o
            - generic [ref=e632]: u
            - generic [ref=e633]: "n"
            - generic [ref=e634]: d
          - generic [ref=e636]:
            - generic [ref=e637]: l
            - generic [ref=e638]: a
            - generic [ref=e639]: t
            - generic [ref=e640]: e
            - generic [ref=e641]: r
          - generic [ref=e643]:
            - generic [ref=e644]: s
            - generic [ref=e645]: a
            - generic [ref=e646]: "y"
          - generic [ref=e648]:
            - generic [ref=e649]: a
            - generic [ref=e650]: "n"
            - generic [ref=e651]: t
            - generic [ref=e652]: e
          - generic [ref=e654]:
            - generic [ref=e655]: s
            - generic [ref=e656]: t
            - generic [ref=e657]: r
            - generic [ref=e658]: e
            - generic [ref=e659]: e
            - generic [ref=e660]: t
          - generic [ref=e662]:
            - generic [ref=e663]: z
            - generic [ref=e664]: i
            - generic [ref=e665]: "n"
            - generic [ref=e666]: c
          - generic [ref=e668]:
            - generic [ref=e669]: b
            - generic [ref=e670]: u
            - generic [ref=e671]: i
            - generic [ref=e672]: l
            - generic [ref=e673]: d
          - generic [ref=e675]:
            - generic [ref=e676]: t
            - generic [ref=e677]: h
            - generic [ref=e678]: e
            - generic [ref=e679]: i
            - generic [ref=e680]: r
          - generic [ref=e682]:
            - generic [ref=e683]: f
            - generic [ref=e684]: a
            - generic [ref=e685]: r
          - generic [ref=e687]:
            - generic [ref=e688]: t
            - generic [ref=e689]: h
            - generic [ref=e690]: e
            - generic [ref=e691]: i
            - generic [ref=e692]: r
          - generic [ref=e694]:
            - generic [ref=e695]: w
            - generic [ref=e696]: a
            - generic [ref=e697]: i
            - generic [ref=e698]: t
          - generic [ref=e700]:
            - generic [ref=e701]: f
            - generic [ref=e702]: o
            - generic [ref=e703]: c
            - generic [ref=e704]: u
            - generic [ref=e705]: s
          - generic [ref=e707]:
            - generic [ref=e708]: i
            - generic [ref=e709]: t
          - generic [ref=e711]:
            - generic [ref=e712]: t
            - generic [ref=e713]: a
            - generic [ref=e714]: l
            - generic [ref=e715]: k
          - generic [ref=e717]:
            - generic [ref=e718]: "y"
            - generic [ref=e719]: e
            - generic [ref=e720]: s
          - generic [ref=e722]:
            - generic [ref=e723]: t
            - generic [ref=e724]: u
            - generic [ref=e725]: r
            - generic [ref=e726]: "n"
          - generic [ref=e728]:
            - generic [ref=e729]: r
            - generic [ref=e730]: e
            - generic [ref=e731]: t
            - generic [ref=e732]: a
            - generic [ref=e733]: i
            - generic [ref=e734]: "n"
          - generic [ref=e736]:
            - generic [ref=e737]: s
            - generic [ref=e738]: e
            - generic [ref=e739]: t
          - generic [ref=e741]:
            - generic [ref=e742]: s
            - generic [ref=e743]: a
            - generic [ref=e744]: m
            - generic [ref=e745]: e
          - generic [ref=e747]:
            - generic [ref=e748]: t
            - generic [ref=e749]: a
            - generic [ref=e750]: s
            - generic [ref=e751]: k
          - generic [ref=e753]:
            - generic [ref=e754]: r
            - generic [ref=e755]: o
            - generic [ref=e756]: u
            - generic [ref=e757]: "n"
            - generic [ref=e758]: d
          - generic [ref=e760]:
            - generic [ref=e761]: w
            - generic [ref=e762]: i
            - generic [ref=e763]: "n"
            - generic [ref=e764]: d
          - generic [ref=e766]:
            - generic [ref=e767]: p
            - generic [ref=e768]: l
            - generic [ref=e769]: a
            - generic [ref=e770]: c
            - generic [ref=e771]: e
          - generic [ref=e773]:
            - generic [ref=e774]: f
            - generic [ref=e775]: a
            - generic [ref=e776]: i
            - generic [ref=e777]: r
          - generic [ref=e779]:
            - generic [ref=e780]: g
            - generic [ref=e781]: r
            - generic [ref=e782]: o
            - generic [ref=e783]: w
          - generic [ref=e785]:
            - generic [ref=e786]: s
            - generic [ref=e787]: h
            - generic [ref=e788]: a
            - generic [ref=e789]: r
            - generic [ref=e790]: e
          - generic [ref=e792]:
            - generic [ref=e793]: c
            - generic [ref=e794]: o
            - generic [ref=e795]: p
            - generic [ref=e796]: "y"
          - generic [ref=e798]:
            - generic [ref=e799]: s
            - generic [ref=e800]: o
            - generic [ref=e801]: u
            - generic [ref=e802]: t
            - generic [ref=e803]: h
          - generic [ref=e805]:
            - generic [ref=e806]: w
            - generic [ref=e807]: a
            - generic [ref=e808]: l
            - generic [ref=e809]: k
          - generic [ref=e811]:
            - generic [ref=e812]: "n"
            - generic [ref=e813]: o
            - generic [ref=e814]: "n"
            - generic [ref=e815]: e
          - generic [ref=e817]:
            - generic [ref=e818]: o
            - generic [ref=e819]: p
            - generic [ref=e820]: e
            - generic [ref=e821]: "n"
          - generic [ref=e823]:
            - generic [ref=e824]: t
            - generic [ref=e825]: h
            - generic [ref=e826]: o
            - generic [ref=e827]: s
            - generic [ref=e828]: e
          - generic [ref=e830]:
            - generic [ref=e831]: h
            - generic [ref=e832]: a
            - generic [ref=e833]: p
            - generic [ref=e834]: p
            - generic [ref=e835]: "y"
          - generic [ref=e837]:
            - generic [ref=e838]: z
            - generic [ref=e839]: o
            - generic [ref=e840]: "n"
            - generic [ref=e841]: e
          - generic [ref=e843]:
            - generic [ref=e844]: t
            - generic [ref=e845]: o
            - generic [ref=e846]: "n"
            - generic [ref=e847]: e
        - paragraph [ref=e848]: "Practice passage: ant stop pair has or up side old person sure ready taste bring order little join smile few task must road earth top rest you find tan taste back full are soot race zinc jump tea on much so teen shine page your long map here feel late it lean map race wind page eat own sane over new sort space keen ration speed earn grow nine right jump fire thank build race yet nine path under share thank show smile next can only nest sound later say ante street zinc build their far their wait focus it talk yes turn retain set same task round wind place fair grow share copy south walk none open those happy zone tone"
        - textbox "Typing input" [active] [ref=e849]
      - generic [ref=e851]:
        - paragraph [ref=e852]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e853]
      - generic [ref=e854]:
        - paragraph [ref=e855]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e856]:
          - button "Restart with new text" [ref=e857]
          - button "Show accessible text editor" [ref=e861]
          - button "Finish" [disabled] [ref=e865]
      - status [ref=e868]: Ready to type
  - contentinfo [ref=e869]:
    - generic [ref=e870]:
      - generic [ref=e871]:
        - generic [ref=e872]:
          - generic [ref=e873]: Sparow
          - generic [ref=e874]: Type
        - text: Find your rhythm.
      - generic [ref=e875]:
        - link "About & metrics" [ref=e876] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e877] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e878] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e879] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e880] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e881] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e882]: SparowType © 2026
```

# Test source

```ts
  463 |     expect(initialScene.drawCalls).toBeGreaterThan(0);
  464 |     for (let reload = 1; reload <= 5; reload++) {
  465 |       await page.reload({ waitUntil: "domcontentloaded" });
  466 |       await expect(page.getByTestId("opening-experience")).toHaveAttribute(
  467 |         "data-mode",
  468 |         "full",
  469 |       );
  470 |       // These are real rapid reloads, including pending GPU preparation. The
  471 |       // independent quality case and initial document prove full PBR readiness;
  472 |       // cancellation must still close each native owner before the next one.
  473 |       await firstWorkerInitialized(page);
  474 |       await expect.poll(() => closed.length).toBe(reload);
  475 |       expect(
  476 |         page.workers().filter((worker) => workerEntry.test(worker.url())),
  477 |       ).toHaveLength(1);
  478 |       expect(live.size).toBe(1);
  479 |       expect(maximumLive).toBe(1);
  480 |       cycles.push({
  481 |         reload,
  482 |         records: await records(page),
  483 |         priorWorkersClosed: closed.length,
  484 |         liveWorkers: live.size,
  485 |       });
  486 |     }
  487 |     await page.keyboard.press("Escape");
  488 |     await expectWorkerClosed(page, "watchdog-allowed");
  489 |     expect(closed).toHaveLength(6);
  490 |     expect(live.size).toBe(0);
  491 |     expect(maximumLive).toBe(1);
  492 |     await readyPractice(page);
  493 |   } finally {
  494 |     info.annotations.push({
  495 |       type: "limitation",
  496 |       description:
  497 |         "Five actual reloads and native worker closure/ownership are finite lifecycle evidence, not a universal heap/GPU-memory leak guarantee.",
  498 |     });
  499 |     await info.attach("five-native-worker-reload-cycles", {
  500 |       body: JSON.stringify(
  501 |         { initial, cycles, started, closed, maximumLive },
  502 |         null,
  503 |         2,
  504 |       ),
  505 |       contentType: "application/json",
  506 |     });
  507 |   }
  508 | });
  509 | 
  510 | test("skipping while the native worker entry is blocked terminates startup and preserves the first typing key", async ({
  511 |   page,
  512 | }, info) => {
  513 |   await observeNativeWorker(page, info);
  514 |   let release = () => {};
  515 |   const gate = new Promise<void>((resolve) => {
  516 |     release = resolve;
  517 |   });
  518 |   await page.context().route(workerEntry, async (route) => {
  519 |     await gate;
  520 |     await route.continue().catch(() => undefined); // Cancellation is expected after termination.
  521 |   });
  522 |   try {
  523 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  524 |     await expect
  525 |       .poll(async () =>
  526 |         (await records(page))[0]?.sent.some(
  527 |           (receipt) => receipt.type === "initialize",
  528 |         ),
  529 |       )
  530 |       .toBe(true);
  531 |     expect(
  532 |       (await records(page))[0].received.some(
  533 |         (receipt) => receipt.type === "ready",
  534 |       ),
  535 |     ).toBe(false);
  536 |     await page.keyboard.press("Escape");
  537 |     await expectWorkerClosed(page, "watchdog-allowed");
  538 |     const input = await readyPractice(page);
  539 |     await input.pressSequentially("x");
  540 |     await expect(input).toHaveValue("x");
  541 |   } finally {
  542 |     release();
  543 |   }
  544 | });
  545 | 
  546 | async function expectRecoveredDocumentScene(page: Page) {
  547 |   const opening = page.getByTestId("opening-experience");
  548 |   const canvas = page.locator(".awakening-canvas");
  549 |   await expect(opening).toHaveAttribute("data-renderer", "webgl");
  550 |   await expect
  551 |     .poll(async () => {
  552 |       const raw = await canvas.getAttribute("data-scene");
  553 |       const scene = raw
  554 |         ? (JSON.parse(raw) as KeyboardSceneDiagnostics)
  555 |         : undefined;
  556 |       return (
  557 |         scene?.thread === "main-thread" &&
  558 |         scene.keyCount === 61 &&
  559 |         scene.frames > 0 &&
  560 |         scene.drawCalls > 0
  561 |       );
  562 |     })
> 563 |     .toBe(true);
      |      ^ Error: Timeout 5000ms exceeded while waiting on the predicate
  564 |   await expect(canvas).toHaveCount(1);
  565 |   await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  566 |   await page.keyboard.press("Escape");
  567 |   await readyPractice(page);
  568 | }
  569 | 
  570 | test("a native worker transport failure replaces the transferred canvas with the complete real document renderer", async ({
  571 |   page,
  572 | }, info) => {
  573 |   await observeNativeWorker(page, info);
  574 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  575 |   await firstWorkerReady(page);
  576 |   await page.evaluate(() =>
  577 |     (window as AuditedWindow).openingWorkerAudit!.workers[0].dispatchEvent(
  578 |       new ErrorEvent("error", { message: "Injected worker transport failure" }),
  579 |     ),
  580 |   );
  581 |   await expectRecoveredDocumentScene(page);
  582 | });
  583 | 
  584 | async function nativeContextLoss(
  585 |   page: Page,
  586 |   info: TestInfo,
  587 |   phase: "preparation" | "live",
  588 | ) {
  589 |   if (phase === "live") await observeNativeFallbackAnimations(page);
  590 |   await observeNativeWorker(page, info);
  591 |   await page.context().route(workerEntry, async (route) => {
  592 |     const response = await route.fetch();
  593 |     const body = await response.text();
  594 |     const injection = `
  595 | const originalOffscreenContext = OffscreenCanvas.prototype.getContext;
  596 | let contextForNativeLoss;
  597 | function requestNativeContextLoss() {
  598 |   if (!contextForNativeLoss) return;
  599 |   postMessage({type:"test-native-context-loss-requested"});
  600 |   contextForNativeLoss.loseContext();
  601 | }
  602 | OffscreenCanvas.prototype.getContext = function (...args) {
  603 |   const context = Reflect.apply(originalOffscreenContext, this, args);
  604 |   if (args[0] === "webgl2" && context) {
  605 |     const extension = context.getExtension("WEBGL_lose_context");
  606 |     postMessage({type:"test-context-loss-capability",supported:Boolean(extension)});
  607 |     contextForNativeLoss = extension;
  608 |     if (extension && ${JSON.stringify(phase)} === "preparation")
  609 |       setTimeout(requestNativeContextLoss, 100);
  610 |   }
  611 |   return context;
  612 | };
  613 | addEventListener("message", ({data}) => {
  614 |   if (data.type === "test-request-native-context-loss") requestAnimationFrame(() => {
  615 |     postMessage({type:"test-live-animation-frame"});
  616 |     requestNativeContextLoss();
  617 |   });
  618 | });
  619 | `;
  620 |     await route.fulfill({ response, body: injection + body });
  621 |   });
  622 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  623 |   await expect
  624 |     .poll(async () =>
  625 |       (await records(page))[0]?.received.some(
  626 |         (receipt) => receipt.type === "test-context-loss-capability",
  627 |       ),
  628 |     )
  629 |     .toBe(true);
  630 |   const available = (await records(page))[0].received.find(
  631 |     (receipt) => receipt.type === "test-context-loss-capability",
  632 |   )?.supported;
  633 |   test.skip(
  634 |     !available,
  635 |     "UNVERIFIED: this native worker has no WEBGL_lose_context extension.",
  636 |   );
  637 |   if (phase === "live") {
  638 |     await firstWorkerReady(page);
  639 |     const ready = (await records(page))[0].received.find(
  640 |       (receipt) => receipt.type === "ready",
  641 |     )?.diagnostics;
  642 |     if (!ready)
  643 |       throw new Error("No native worker readiness receipt before live loss");
  644 |     expect(ready.frames).toBeGreaterThan(0);
  645 |     expect(ready.drawCalls).toBeGreaterThan(0);
  646 |     await expect
  647 |       .poll(() =>
  648 |         page.evaluate(
  649 |           () =>
  650 |             new Set(
  651 |               (window as AuditedWindow)
  652 |                 .fallbackAnimationAudit!.actions.filter(
  653 |                   (item) =>
  654 |                     item.action === "pause" &&
  655 |                     item.name === "awakening-key-dissolve",
  656 |                 )
  657 |                 .map((item) => item.id),
  658 |             ).size,
  659 |         ),
  660 |       )
  661 |       .toBe(61);
  662 |     // Diagnostics are batched every20 frames. Use a real worker RAF receipt to
  663 |     // establish live loss without waiting for that unrelated FPS sample window.
```