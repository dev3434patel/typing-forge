# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> reloading a live native worker closes the old worker and a fresh opening releases its own resources
- Location: e2e\opening-worker.spec.ts:257:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
        - link "Learn" [ref=f1e16] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=f1e20] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=f1e30] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=f1e33] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=f1e40] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=f1e43]:
        - button "Switch to light theme" [ref=f1e44]
        - button "Open command palette" [ref=f1e51]
        - link "Settings" [ref=f1e54] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=f1e58] [cursor=pointer]:
          - /url: /auth
  - main [ref=f1e63]:
    - heading "Typing practice" [level=1] [ref=f1e64]
    - region "Test configuration" [ref=f1e65]:
      - generic [ref=f1e66]:
        - group "Test mode" [ref=f1e67]:
          - button "Time" [pressed] [ref=f1e68]
          - button "Words" [ref=f1e72]
          - button "Quote" [ref=f1e75]
          - button "Code" [ref=f1e79]
          - button "Custom" [ref=f1e84]
          - button "Zen" [ref=f1e88]
        - group "Test duration" [ref=f1e91]:
          - button "15 seconds" [ref=f1e92]:
            - text: "15"
            - generic [ref=f1e93]: seconds
          - button "30 seconds" [pressed] [ref=f1e94]:
            - text: "30"
            - generic [ref=f1e95]: seconds
          - button "60 seconds" [ref=f1e96]:
            - text: "60"
            - generic [ref=f1e97]: seconds
          - button "120 seconds" [ref=f1e98]:
            - text: "120"
            - generic [ref=f1e99]: seconds
      - generic [ref=f1e100]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=f1e101]:
          - checkbox "Precision mode · stop on errors" [ref=f1e102]
          - text: Precision mode · stop on errors
        - generic [ref=f1e103]:
          - text: Language
          - combobox "Language" [ref=f1e104]:
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
        - button "punctuation" [ref=f1e106]
        - button "# numbers" [ref=f1e108]
    - region "Typing session" [ref=f1e109]:
      - generic [ref=f1e110]:
        - generic [ref=f1e111]:
          - generic [ref=f1e112]:
            - generic [ref=f1e113]: 30s
            - generic [ref=f1e114]: remaining
          - generic [ref=f1e115]: —wpm
          - generic [ref=f1e116]: —acc %
        - generic [ref=f1e117]: Ready when you are
      - generic [ref=f1e119]:
        - generic [ref=f1e121]:
          - generic [ref=f1e122]:
            - generic [ref=f1e123]: "n"
            - generic [ref=f1e124]: e
            - generic [ref=f1e125]: x
            - generic [ref=f1e126]: t
          - generic [ref=f1e128]:
            - generic [ref=f1e129]: "n"
            - generic [ref=f1e130]: a
            - generic [ref=f1e131]: t
            - generic [ref=f1e132]: i
            - generic [ref=f1e133]: o
            - generic [ref=f1e134]: "n"
          - generic [ref=f1e136]:
            - generic [ref=f1e137]: o
            - generic [ref=f1e138]: v
            - generic [ref=f1e139]: e
            - generic [ref=f1e140]: r
          - generic [ref=f1e142]:
            - generic [ref=f1e143]: j
            - generic [ref=f1e144]: o
            - generic [ref=f1e145]: i
            - generic [ref=f1e146]: "n"
          - generic [ref=f1e148]:
            - generic [ref=f1e149]: b
            - generic [ref=f1e150]: r
            - generic [ref=f1e151]: i
            - generic [ref=f1e152]: "n"
            - generic [ref=f1e153]: g
          - generic [ref=f1e155]:
            - generic [ref=f1e156]: t
            - generic [ref=f1e157]: o
            - generic [ref=f1e158]: e
          - generic [ref=f1e160]:
            - generic [ref=f1e161]: w
            - generic [ref=f1e162]: h
            - generic [ref=f1e163]: i
            - generic [ref=f1e164]: t
            - generic [ref=f1e165]: e
          - generic [ref=f1e167]:
            - generic [ref=f1e168]: s
            - generic [ref=f1e169]: a
            - generic [ref=f1e170]: i
            - generic [ref=f1e171]: d
          - generic [ref=f1e173]:
            - generic [ref=f1e174]: r
            - generic [ref=f1e175]: a
            - generic [ref=f1e176]: t
            - generic [ref=f1e177]: e
          - generic [ref=f1e179]:
            - generic [ref=f1e180]: k
            - generic [ref=f1e181]: e
            - generic [ref=f1e182]: e
            - generic [ref=f1e183]: p
          - generic [ref=f1e185]:
            - generic [ref=f1e186]: p
            - generic [ref=f1e187]: a
            - generic [ref=f1e188]: r
            - generic [ref=f1e189]: k
          - generic [ref=f1e191]:
            - generic [ref=f1e192]: l
            - generic [ref=f1e193]: e
            - generic [ref=f1e194]: f
            - generic [ref=f1e195]: t
          - generic [ref=f1e197]:
            - generic [ref=f1e198]: p
            - generic [ref=f1e199]: a
            - generic [ref=f1e200]: t
            - generic [ref=f1e201]: h
          - generic [ref=f1e203]:
            - generic [ref=f1e204]: d
            - generic [ref=f1e205]: e
            - generic [ref=f1e206]: a
            - generic [ref=f1e207]: r
          - generic [ref=f1e209]:
            - generic [ref=f1e210]: t
            - generic [ref=f1e211]: o
            - generic [ref=f1e212]: "n"
            - generic [ref=f1e213]: e
          - generic [ref=f1e215]:
            - generic [ref=f1e216]: v
            - generic [ref=f1e217]: e
            - generic [ref=f1e218]: r
            - generic [ref=f1e219]: "y"
          - generic [ref=f1e221]:
            - generic [ref=f1e222]: t
            - generic [ref=f1e223]: e
            - generic [ref=f1e224]: "n"
            - generic [ref=f1e225]: t
          - generic [ref=f1e227]:
            - generic [ref=f1e228]: s
            - generic [ref=f1e229]: o
          - generic [ref=f1e231]:
            - generic [ref=f1e232]: d
            - generic [ref=f1e233]: r
            - generic [ref=f1e234]: a
            - generic [ref=f1e235]: w
          - generic [ref=f1e237]:
            - generic [ref=f1e238]: r
            - generic [ref=f1e239]: e
            - generic [ref=f1e240]: a
            - generic [ref=f1e241]: d
            - generic [ref=f1e242]: "y"
          - generic [ref=f1e244]:
            - generic [ref=f1e245]: t
            - generic [ref=f1e246]: r
            - generic [ref=f1e247]: u
            - generic [ref=f1e248]: e
          - generic [ref=f1e250]:
            - generic [ref=f1e251]: t
            - generic [ref=f1e252]: e
            - generic [ref=f1e253]: "n"
            - generic [ref=f1e254]: t
          - generic [ref=f1e256]:
            - generic [ref=f1e257]: c
            - generic [ref=f1e258]: a
            - generic [ref=f1e259]: l
            - generic [ref=f1e260]: m
          - generic [ref=f1e262]:
            - generic [ref=f1e263]: b
            - generic [ref=f1e264]: l
            - generic [ref=f1e265]: a
            - generic [ref=f1e266]: c
            - generic [ref=f1e267]: k
          - generic [ref=f1e269]:
            - generic [ref=f1e270]: l
            - generic [ref=f1e271]: e
            - generic [ref=f1e272]: a
            - generic [ref=f1e273]: "n"
          - generic [ref=f1e275]:
            - generic [ref=f1e276]: p
            - generic [ref=f1e277]: e
            - generic [ref=f1e278]: r
            - generic [ref=f1e279]: s
            - generic [ref=f1e280]: o
            - generic [ref=f1e281]: "n"
          - generic [ref=f1e283]:
            - generic [ref=f1e284]: p
            - generic [ref=f1e285]: o
            - generic [ref=f1e286]: e
            - generic [ref=f1e287]: m
          - generic [ref=f1e289]:
            - generic [ref=f1e290]: t
            - generic [ref=f1e291]: a
            - generic [ref=f1e292]: "n"
          - generic [ref=f1e294]:
            - generic [ref=f1e295]: d
            - generic [ref=f1e296]: o
            - generic [ref=f1e297]: o
            - generic [ref=f1e298]: r
          - generic [ref=f1e300]:
            - generic [ref=f1e301]: q
            - generic [ref=f1e302]: u
            - generic [ref=f1e303]: i
            - generic [ref=f1e304]: c
            - generic [ref=f1e305]: k
          - generic [ref=f1e307]:
            - generic [ref=f1e308]: l
            - generic [ref=f1e309]: i
            - generic [ref=f1e310]: f
            - generic [ref=f1e311]: e
          - generic [ref=f1e313]:
            - generic [ref=f1e314]: a
            - generic [ref=f1e315]: "n"
            - generic [ref=f1e316]: t
            - generic [ref=f1e317]: e
          - generic [ref=f1e319]:
            - generic [ref=f1e320]: p
            - generic [ref=f1e321]: r
            - generic [ref=f1e322]: e
            - generic [ref=f1e323]: t
            - generic [ref=f1e324]: t
            - generic [ref=f1e325]: "y"
          - generic [ref=f1e327]:
            - generic [ref=f1e328]: t
            - generic [ref=f1e329]: o
            - generic [ref=f1e330]: p
          - generic [ref=f1e332]:
            - generic [ref=f1e333]: o
            - generic [ref=f1e334]: u
            - generic [ref=f1e335]: t
          - generic [ref=f1e337]:
            - generic [ref=f1e338]: p
            - generic [ref=f1e339]: e
            - generic [ref=f1e340]: o
            - generic [ref=f1e341]: p
            - generic [ref=f1e342]: l
            - generic [ref=f1e343]: e
          - generic [ref=f1e345]:
            - generic [ref=f1e346]: s
            - generic [ref=f1e347]: e
            - generic [ref=f1e348]: e
            - generic [ref=f1e349]: d
          - generic [ref=f1e351]:
            - generic [ref=f1e352]: s
            - generic [ref=f1e353]: a
            - generic [ref=f1e354]: v
            - generic [ref=f1e355]: e
          - generic [ref=f1e357]:
            - generic [ref=f1e358]: o
            - generic [ref=f1e359]: w
            - generic [ref=f1e360]: "n"
          - generic [ref=f1e362]:
            - generic [ref=f1e363]: s
            - generic [ref=f1e364]: h
            - generic [ref=f1e365]: o
            - generic [ref=f1e366]: w
          - generic [ref=f1e368]:
            - generic [ref=f1e369]: f
            - generic [ref=f1e370]: a
            - generic [ref=f1e371]: i
            - generic [ref=f1e372]: r
          - generic [ref=f1e374]:
            - generic [ref=f1e375]: s
            - generic [ref=f1e376]: p
            - generic [ref=f1e377]: e
            - generic [ref=f1e378]: a
            - generic [ref=f1e379]: k
          - generic [ref=f1e381]:
            - generic [ref=f1e382]: r
            - generic [ref=f1e383]: o
            - generic [ref=f1e384]: a
            - generic [ref=f1e385]: d
          - generic [ref=f1e387]:
            - generic [ref=f1e388]: p
            - generic [ref=f1e389]: a
            - generic [ref=f1e390]: i
            - generic [ref=f1e391]: r
          - generic [ref=f1e393]:
            - generic [ref=f1e394]: s
            - generic [ref=f1e395]: e
            - generic [ref=f1e396]: a
          - generic [ref=f1e398]:
            - generic [ref=f1e399]: s
            - generic [ref=f1e400]: t
            - generic [ref=f1e401]: o
            - generic [ref=f1e402]: "n"
            - generic [ref=f1e403]: e
          - generic [ref=f1e405]:
            - generic [ref=f1e406]: f
            - generic [ref=f1e407]: o
            - generic [ref=f1e408]: r
            - generic [ref=f1e409]: m
          - generic [ref=f1e411]:
            - generic [ref=f1e412]: "n"
            - generic [ref=f1e413]: o
            - generic [ref=f1e414]: t
            - generic [ref=f1e415]: i
            - generic [ref=f1e416]: o
            - generic [ref=f1e417]: "n"
          - generic [ref=f1e419]:
            - generic [ref=f1e420]: w
            - generic [ref=f1e421]: r
            - generic [ref=f1e422]: i
            - generic [ref=f1e423]: t
            - generic [ref=f1e424]: e
          - generic [ref=f1e426]:
            - generic [ref=f1e427]: c
            - generic [ref=f1e428]: l
            - generic [ref=f1e429]: e
            - generic [ref=f1e430]: a
            - generic [ref=f1e431]: "n"
          - generic [ref=f1e433]:
            - generic [ref=f1e434]: s
            - generic [ref=f1e435]: t
            - generic [ref=f1e436]: o
            - generic [ref=f1e437]: r
            - generic [ref=f1e438]: e
          - generic [ref=f1e440]:
            - generic [ref=f1e441]: e
            - generic [ref=f1e442]: v
            - generic [ref=f1e443]: e
            - generic [ref=f1e444]: "n"
          - generic [ref=f1e446]:
            - generic [ref=f1e447]: t
            - generic [ref=f1e448]: u
            - generic [ref=f1e449]: r
            - generic [ref=f1e450]: "n"
          - generic [ref=f1e452]:
            - generic [ref=f1e453]: p
            - generic [ref=f1e454]: l
            - generic [ref=f1e455]: a
            - generic [ref=f1e456]: c
            - generic [ref=f1e457]: e
          - generic [ref=f1e459]:
            - generic [ref=f1e460]: s
            - generic [ref=f1e461]: h
            - generic [ref=f1e462]: i
            - generic [ref=f1e463]: "n"
            - generic [ref=f1e464]: e
          - generic [ref=f1e466]:
            - generic [ref=f1e467]: u
            - generic [ref=f1e468]: p
          - generic [ref=f1e470]:
            - generic [ref=f1e471]: c
            - generic [ref=f1e472]: l
            - generic [ref=f1e473]: o
            - generic [ref=f1e474]: s
            - generic [ref=f1e475]: e
          - generic [ref=f1e477]:
            - generic [ref=f1e478]: t
            - generic [ref=f1e479]: o
            - generic [ref=f1e480]: e
          - generic [ref=f1e482]:
            - generic [ref=f1e483]: t
            - generic [ref=f1e484]: e
            - generic [ref=f1e485]: e
            - generic [ref=f1e486]: "n"
          - generic [ref=f1e488]:
            - generic [ref=f1e489]: r
            - generic [ref=f1e490]: e
            - generic [ref=f1e491]: s
            - generic [ref=f1e492]: t
          - generic [ref=f1e494]:
            - generic [ref=f1e495]: i
            - generic [ref=f1e496]: r
            - generic [ref=f1e497]: o
            - generic [ref=f1e498]: "n"
          - generic [ref=f1e500]:
            - generic [ref=f1e501]: r
            - generic [ref=f1e502]: e
            - generic [ref=f1e503]: a
            - generic [ref=f1e504]: d
            - generic [ref=f1e505]: "y"
          - generic [ref=f1e507]:
            - generic [ref=f1e508]: i
            - generic [ref=f1e509]: "n"
          - generic [ref=f1e511]:
            - generic [ref=f1e512]: r
            - generic [ref=f1e513]: o
            - generic [ref=f1e514]: o
            - generic [ref=f1e515]: m
          - generic [ref=f1e517]:
            - generic [ref=f1e518]: s
            - generic [ref=f1e519]: h
            - generic [ref=f1e520]: i
            - generic [ref=f1e521]: p
          - generic [ref=f1e523]:
            - generic [ref=f1e524]: t
            - generic [ref=f1e525]: e
            - generic [ref=f1e526]: a
            - generic [ref=f1e527]: r
          - generic [ref=f1e529]:
            - generic [ref=f1e530]: m
            - generic [ref=f1e531]: e
            - generic [ref=f1e532]: a
            - generic [ref=f1e533]: "n"
          - generic [ref=f1e535]:
            - generic [ref=f1e536]: a
            - generic [ref=f1e537]: i
            - generic [ref=f1e538]: r
          - generic [ref=f1e540]:
            - generic [ref=f1e541]: f
            - generic [ref=f1e542]: a
            - generic [ref=f1e543]: r
          - generic [ref=f1e545]:
            - generic [ref=f1e546]: p
            - generic [ref=f1e547]: a
            - generic [ref=f1e548]: g
            - generic [ref=f1e549]: e
          - generic [ref=f1e551]:
            - generic [ref=f1e552]: g
            - generic [ref=f1e553]: a
            - generic [ref=f1e554]: m
            - generic [ref=f1e555]: e
          - generic [ref=f1e557]:
            - generic [ref=f1e558]: p
            - generic [ref=f1e559]: e
            - generic [ref=f1e560]: o
            - generic [ref=f1e561]: p
            - generic [ref=f1e562]: l
            - generic [ref=f1e563]: e
          - generic [ref=f1e565]:
            - generic [ref=f1e566]: b
            - generic [ref=f1e567]: l
            - generic [ref=f1e568]: u
            - generic [ref=f1e569]: e
          - generic [ref=f1e571]:
            - generic [ref=f1e572]: s
            - generic [ref=f1e573]: h
            - generic [ref=f1e574]: a
            - generic [ref=f1e575]: r
            - generic [ref=f1e576]: e
          - generic [ref=f1e578]:
            - generic [ref=f1e579]: g
            - generic [ref=f1e580]: r
            - generic [ref=f1e581]: o
            - generic [ref=f1e582]: u
            - generic [ref=f1e583]: p
          - generic [ref=f1e585]:
            - generic [ref=f1e586]: f
            - generic [ref=f1e587]: a
            - generic [ref=f1e588]: i
            - generic [ref=f1e589]: r
          - generic [ref=f1e591]:
            - generic [ref=f1e592]: s
            - generic [ref=f1e593]: h
            - generic [ref=f1e594]: o
            - generic [ref=f1e595]: w
          - generic [ref=f1e597]:
            - generic [ref=f1e598]: v
            - generic [ref=f1e599]: i
            - generic [ref=f1e600]: e
            - generic [ref=f1e601]: w
          - generic [ref=f1e603]:
            - generic [ref=f1e604]: "n"
            - generic [ref=f1e605]: e
            - generic [ref=f1e606]: t
          - generic [ref=f1e608]:
            - generic [ref=f1e609]: "y"
            - generic [ref=f1e610]: o
            - generic [ref=f1e611]: u
          - generic [ref=f1e613]:
            - generic [ref=f1e614]: "n"
            - generic [ref=f1e615]: e
            - generic [ref=f1e616]: a
            - generic [ref=f1e617]: t
          - generic [ref=f1e619]:
            - generic [ref=f1e620]: l
            - generic [ref=f1e621]: o
            - generic [ref=f1e622]: w
          - generic [ref=f1e624]:
            - generic [ref=f1e625]: m
            - generic [ref=f1e626]: u
            - generic [ref=f1e627]: s
            - generic [ref=f1e628]: t
          - generic [ref=f1e630]:
            - generic [ref=f1e631]: s
            - generic [ref=f1e632]: t
            - generic [ref=f1e633]: a
            - generic [ref=f1e634]: r
          - generic [ref=f1e636]:
            - generic [ref=f1e637]: c
            - generic [ref=f1e638]: l
            - generic [ref=f1e639]: e
            - generic [ref=f1e640]: a
            - generic [ref=f1e641]: r
          - generic [ref=f1e643]:
            - generic [ref=f1e644]: l
            - generic [ref=f1e645]: e
            - generic [ref=f1e646]: t
          - generic [ref=f1e648]:
            - generic [ref=f1e649]: s
            - generic [ref=f1e650]: t
            - generic [ref=f1e651]: a
            - generic [ref=f1e652]: "n"
            - generic [ref=f1e653]: d
          - generic [ref=f1e655]:
            - generic [ref=f1e656]: m
            - generic [ref=f1e657]: a
            - generic [ref=f1e658]: "y"
          - generic [ref=f1e660]:
            - generic [ref=f1e661]: w
            - generic [ref=f1e662]: i
            - generic [ref=f1e663]: "n"
            - generic [ref=f1e664]: d
            - generic [ref=f1e665]: o
            - generic [ref=f1e666]: w
          - generic [ref=f1e668]:
            - generic [ref=f1e669]: s
            - generic [ref=f1e670]: t
            - generic [ref=f1e671]: u
            - generic [ref=f1e672]: d
            - generic [ref=f1e673]: "y"
          - generic [ref=f1e675]:
            - generic [ref=f1e676]: t
            - generic [ref=f1e677]: a
            - generic [ref=f1e678]: l
            - generic [ref=f1e679]: l
          - generic [ref=f1e681]:
            - generic [ref=f1e682]: u
            - generic [ref=f1e683]: s
          - generic [ref=f1e685]:
            - generic [ref=f1e686]: j
            - generic [ref=f1e687]: u
            - generic [ref=f1e688]: s
            - generic [ref=f1e689]: t
          - generic [ref=f1e691]:
            - generic [ref=f1e692]: t
            - generic [ref=f1e693]: i
            - generic [ref=f1e694]: r
            - generic [ref=f1e695]: e
          - generic [ref=f1e697]:
            - generic [ref=f1e698]: j
            - generic [ref=f1e699]: o
            - generic [ref=f1e700]: i
            - generic [ref=f1e701]: "n"
          - generic [ref=f1e703]:
            - generic [ref=f1e704]: w
            - generic [ref=f1e705]: a
            - generic [ref=f1e706]: "n"
            - generic [ref=f1e707]: t
          - generic [ref=f1e709]:
            - generic [ref=f1e710]: r
            - generic [ref=f1e711]: o
            - generic [ref=f1e712]: a
            - generic [ref=f1e713]: d
          - generic [ref=f1e715]:
            - generic [ref=f1e716]: s
            - generic [ref=f1e717]: t
            - generic [ref=f1e718]: o
            - generic [ref=f1e719]: "n"
            - generic [ref=f1e720]: e
          - generic [ref=f1e722]:
            - generic [ref=f1e723]: i
            - generic [ref=f1e724]: "n"
            - generic [ref=f1e725]: t
            - generic [ref=f1e726]: o
          - generic [ref=f1e728]:
            - generic [ref=f1e729]: m
            - generic [ref=f1e730]: "y"
          - generic [ref=f1e732]:
            - generic [ref=f1e733]: w
            - generic [ref=f1e734]: a
            - generic [ref=f1e735]: r
            - generic [ref=f1e736]: m
          - generic [ref=f1e738]:
            - generic [ref=f1e739]: g
            - generic [ref=f1e740]: r
            - generic [ref=f1e741]: a
            - generic [ref=f1e742]: "n"
            - generic [ref=f1e743]: d
          - generic [ref=f1e745]:
            - generic [ref=f1e746]: w
            - generic [ref=f1e747]: a
            - generic [ref=f1e748]: "y"
          - generic [ref=f1e750]:
            - generic [ref=f1e751]: p
            - generic [ref=f1e752]: l
            - generic [ref=f1e753]: e
            - generic [ref=f1e754]: a
            - generic [ref=f1e755]: s
            - generic [ref=f1e756]: e
          - generic [ref=f1e758]:
            - generic [ref=f1e759]: s
            - generic [ref=f1e760]: l
            - generic [ref=f1e761]: o
            - generic [ref=f1e762]: w
          - generic [ref=f1e764]:
            - generic [ref=f1e765]: r
            - generic [ref=f1e766]: u
            - generic [ref=f1e767]: "n"
          - generic [ref=f1e769]:
            - generic [ref=f1e770]: s
            - generic [ref=f1e771]: p
            - generic [ref=f1e772]: e
            - generic [ref=f1e773]: e
            - generic [ref=f1e774]: d
          - generic [ref=f1e776]:
            - generic [ref=f1e777]: h
            - generic [ref=f1e778]: e
            - generic [ref=f1e779]: a
            - generic [ref=f1e780]: d
          - generic [ref=f1e782]:
            - generic [ref=f1e783]: s
            - generic [ref=f1e784]: t
            - generic [ref=f1e785]: a
            - generic [ref=f1e786]: r
            - generic [ref=f1e787]: t
          - generic [ref=f1e789]:
            - generic [ref=f1e790]: f
            - generic [ref=f1e791]: i
            - generic [ref=f1e792]: v
            - generic [ref=f1e793]: e
          - generic [ref=f1e795]:
            - generic [ref=f1e796]: "y"
            - generic [ref=f1e797]: o
            - generic [ref=f1e798]: u
          - generic [ref=f1e800]:
            - generic [ref=f1e801]: w
            - generic [ref=f1e802]: h
            - generic [ref=f1e803]: e
            - generic [ref=f1e804]: r
            - generic [ref=f1e805]: e
          - generic [ref=f1e807]:
            - generic [ref=f1e808]: s
            - generic [ref=f1e809]: o
            - generic [ref=f1e810]: r
            - generic [ref=f1e811]: e
          - generic [ref=f1e813]:
            - generic [ref=f1e814]: f
            - generic [ref=f1e815]: e
            - generic [ref=f1e816]: w
          - generic [ref=f1e818]:
            - generic [ref=f1e819]: r
            - generic [ref=f1e820]: a
            - generic [ref=f1e821]: i
            - generic [ref=f1e822]: s
            - generic [ref=f1e823]: e
          - generic [ref=f1e825]:
            - generic [ref=f1e826]: p
            - generic [ref=f1e827]: u
            - generic [ref=f1e828]: t
          - generic [ref=f1e830]:
            - generic [ref=f1e831]: z
            - generic [ref=f1e832]: o
            - generic [ref=f1e833]: "n"
            - generic [ref=f1e834]: e
          - generic [ref=f1e836]:
            - generic [ref=f1e837]: e
            - generic [ref=f1e838]: a
            - generic [ref=f1e839]: s
            - generic [ref=f1e840]: e
          - generic [ref=f1e842]:
            - generic [ref=f1e843]: e
            - generic [ref=f1e844]: a
            - generic [ref=f1e845]: c
            - generic [ref=f1e846]: h
          - generic [ref=f1e848]:
            - generic [ref=f1e849]: r
            - generic [ref=f1e850]: e
            - generic [ref=f1e851]: t
            - generic [ref=f1e852]: a
            - generic [ref=f1e853]: i
            - generic [ref=f1e854]: "n"
        - paragraph [ref=f1e855]: "Practice passage: next nation over join bring toe white said rate keep park left path dear tone very tent so draw ready true tent calm black lean person poem tan door quick life ante pretty top out people seed save own show fair speak road pair sea stone form notion write clean store even turn place shine up close toe teen rest iron ready in room ship tear mean air far page game people blue share group fair show view net you neat low must star clear let stand may window study tall us just tire join want road stone into my warm grand way please slow run speed head start five you where sore few raise put zone ease each retain"
        - textbox "Typing input" [active] [ref=f1e856]
      - generic [ref=f1e858]:
        - paragraph [ref=f1e859]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=f1e860]
      - generic [ref=f1e861]:
        - paragraph [ref=f1e862]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=f1e863]:
          - button "Restart with new text" [ref=f1e864]
          - button "Show accessible text editor" [ref=f1e868]
          - button "Finish" [disabled] [ref=f1e872]
      - status [ref=f1e875]: Ready to type
  - contentinfo [ref=f1e876]:
    - generic [ref=f1e877]:
      - generic [ref=f1e878]:
        - generic [ref=f1e879]:
          - generic [ref=f1e880]: Sparow
          - generic [ref=f1e881]: Type
        - text: Find your rhythm.
      - generic [ref=f1e882]:
        - link "About & metrics" [ref=f1e883] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=f1e884] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=f1e885] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=f1e886] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=f1e887] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=f1e888] [cursor=pointer]:
          - /url: /offline
        - generic [ref=f1e889]: SparowType © 2026
```

# Test source

```ts
  35  |   );
  36  |   info.annotations.push({
  37  |     type: "scope",
  38  |     description:
  39  |       "Native Worker and OffscreenCanvas, normal clocks; no renderer mock or document-renderer override.",
  40  |   });
  41  |   await page.addInitScript(() => {
  42  |     const audit = { records: [] as WorkerRecord[], workers: [] as Worker[] };
  43  |     (window as AuditedWindow).openingWorkerAudit = audit;
  44  |     const NativeWorker = window.Worker;
  45  |     const instrumented = new Proxy(NativeWorker, {
  46  |       construct(target, args) {
  47  |         const worker = Reflect.construct(target, args) as Worker;
  48  |         if (
  49  |           (args[1] as WorkerOptions | undefined)?.name !==
  50  |           "SparowType keyboard renderer"
  51  |         )
  52  |           return worker;
  53  |         const record: WorkerRecord = {
  54  |           url: String(args[0]),
  55  |           sent: [],
  56  |           received: [],
  57  |           terminated: 0,
  58  |         };
  59  |         audit.records.push(record);
  60  |         audit.workers.push(worker);
  61  |         worker.postMessage = new Proxy(worker.postMessage, {
  62  |           apply(method, receiver, argumentsList) {
  63  |             const data = argumentsList[0] as WorkerReceipt;
  64  |             record.sent.push({
  65  |               type: data.type,
  66  |               ...(data.viewport ? { viewport: data.viewport } : {}),
  67  |               ...(data.type === "initialize"
  68  |                 ? { lowPower: data.lowPower, finePointer: data.finePointer }
  69  |                 : {}),
  70  |             });
  71  |             return Reflect.apply(method, receiver, argumentsList);
  72  |           },
  73  |         });
  74  |         worker.terminate = new Proxy(worker.terminate, {
  75  |           apply(method, receiver, argumentsList) {
  76  |             record.terminated++;
  77  |             return Reflect.apply(method, receiver, argumentsList);
  78  |           },
  79  |         });
  80  |         worker.addEventListener(
  81  |           "message",
  82  |           ({ data }: MessageEvent<WorkerReceipt>) => {
  83  |             if (
  84  |               ["ready", "diagnostics", "failure", "disposed"].includes(
  85  |                 data.type,
  86  |               ) ||
  87  |               data.type.startsWith("test-")
  88  |             )
  89  |               record.received.push(data);
  90  |           },
  91  |         );
  92  |         return worker;
  93  |       },
  94  |     });
  95  |     Object.defineProperty(window, "Worker", {
  96  |       configurable: true,
  97  |       writable: true,
  98  |       value: instrumented,
  99  |     });
  100 |   });
  101 | }
  102 | 
  103 | async function records(page: Page) {
  104 |   return page.evaluate(
  105 |     () => (window as AuditedWindow).openingWorkerAudit?.records ?? [],
  106 |   );
  107 | }
  108 | async function firstWorkerReady(page: Page) {
  109 |   await expect
  110 |     .poll(async () =>
  111 |       (await records(page))[0]?.received.some(
  112 |         (receipt) => receipt.type === "ready",
  113 |       ),
  114 |     )
  115 |     .toBe(true);
  116 | }
  117 | async function readyPractice(page: Page) {
  118 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  119 |   const input = page.getByRole("textbox", {
  120 |     name: "Typing input",
  121 |     exact: true,
  122 |   });
  123 |   await expect(input).toBeVisible();
  124 |   await expect(input).toHaveValue("");
  125 |   await expect(
  126 |     page.getByRole("region", { name: "Typing session", exact: true }),
  127 |   ).toHaveAttribute("data-status", "ready");
  128 |   return input;
  129 | }
  130 | async function expectWorkerClosed(page: Page, requireAcknowledgement = true) {
  131 |   await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  132 |   const [record] = await records(page);
  133 |   expect(record.sent.some((receipt) => receipt.type === "dispose")).toBe(true);
  134 |   if (requireAcknowledgement) {
> 135 |     expect(record.received.some((receipt) => receipt.type === "disposed")).toBe(
      |                                                                            ^ Error: expect(received).toBe(expected) // Object.is equality
  136 |       true,
  137 |     );
  138 |     expect(
  139 |       record.received.some((receipt) => receipt.diagnostics?.disposed),
  140 |     ).toBe(true);
  141 |   }
  142 |   await expect
  143 |     .poll(
  144 |       () =>
  145 |         page.workers().filter((worker) => workerEntry.test(worker.url()))
  146 |           .length,
  147 |     )
  148 |     .toBe(0);
  149 | }
  150 | 
  151 | test.afterEach(async ({ page }, info) => {
  152 |   if (page.isClosed()) return;
  153 |   const observed = await records(page).catch(() => []);
  154 |   await info.attach("native-worker-receipts", {
  155 |     body: JSON.stringify(observed, null, 2),
  156 |     contentType: "application/json",
  157 |   });
  158 | });
  159 | 
  160 | test("default native worker draws the complete keyboard while document tasks, resize and skip remain responsive", async ({
  161 |   page,
  162 | }, info) => {
  163 |   await observeNativeWorker(page, info);
  164 |   await page.addInitScript(() => {
  165 |     Object.defineProperty(navigator, "hardwareConcurrency", {
  166 |       configurable: true,
  167 |       get: () => 8,
  168 |     });
  169 |     Object.defineProperty(navigator, "deviceMemory", {
  170 |       configurable: true,
  171 |       get: () => 8,
  172 |     });
  173 |   });
  174 |   await page.emulateMedia({ reducedMotion: "no-preference" });
  175 |   await page.setViewportSize({ width: 1280, height: 800 });
  176 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  177 |   await firstWorkerReady(page);
  178 |   await expect
  179 |     .poll(async () =>
  180 |       (await records(page))[0]?.received.some(
  181 |         (receipt) =>
  182 |           receipt.diagnostics?.thread === "worker" &&
  183 |           receipt.diagnostics.frames > 0 &&
  184 |           receipt.diagnostics.drawCalls > 0,
  185 |       ),
  186 |     )
  187 |     .toBe(true);
  188 |   const [record] = await records(page);
  189 |   const scene = [...record.received]
  190 |     .reverse()
  191 |     .find((receipt) => receipt.diagnostics?.frames)?.diagnostics;
  192 |   if (!scene) throw new Error("No real worker draw diagnostics were received");
  193 |   expect(scene).toMatchObject({
  194 |     thread: "worker",
  195 |     keyCount: 61,
  196 |     keycapMeshes: 1,
  197 |     tier: "desktop",
  198 |     bloom: true,
  199 |     environment: true,
  200 |     environmentIntensity: 0.35,
  201 |     contextLost: false,
  202 |     disposed: false,
  203 |   });
  204 |   expect(scene.cameraElevationDegrees).toBeGreaterThanOrEqual(28);
  205 |   expect(scene.cameraElevationDegrees).toBeLessThanOrEqual(42);
  206 |   expect(
  207 |     record.sent.find((receipt) => receipt.type === "initialize"),
  208 |   ).toMatchObject({ lowPower: false, finePointer: true });
  209 |   const responsiveness = await page.evaluate(async () => {
  210 |     const started = performance.now();
  211 |     await new Promise<void>((resolve) => setTimeout(resolve, 0));
  212 |     const timerAtMs = performance.now() - started;
  213 |     await new Promise<void>((resolve) =>
  214 |       requestAnimationFrame(() => resolve()),
  215 |     );
  216 |     return {
  217 |       timerAtMs,
  218 |       frameAtMs: performance.now() - started,
  219 |       openingPresent: Boolean(
  220 |         document.querySelector('[data-testid="opening-experience"]'),
  221 |       ),
  222 |     };
  223 |   });
  224 |   expect(responsiveness.openingPresent).toBe(true);
  225 |   await info.attach("document-task-and-paint-during-worker", {
  226 |     body: JSON.stringify(responsiveness),
  227 |     contentType: "application/json",
  228 |   });
  229 |   await page.setViewportSize({ width: 390, height: 844 });
  230 |   const canvas = page.locator(".awakening-canvas");
  231 |   const viewport = await canvas.evaluate((element) => ({
  232 |     width: Math.round(element.clientWidth),
  233 |     height: Math.round(element.clientHeight),
  234 |   }));
  235 |   await expect
```