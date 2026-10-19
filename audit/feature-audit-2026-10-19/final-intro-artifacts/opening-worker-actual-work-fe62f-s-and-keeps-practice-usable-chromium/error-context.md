# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> actual worker WebGL context loss during preparation recovers with a fresh canvas and keeps practice usable
- Location: e2e\opening-worker.spec.ts:985:1

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
            - generic [ref=e123]: t
            - generic [ref=e124]: e
            - generic [ref=e125]: r
            - generic [ref=e126]: r
            - generic [ref=e127]: a
            - generic [ref=e128]: i
            - generic [ref=e129]: "n"
          - generic [ref=e131]:
            - generic [ref=e132]: l
            - generic [ref=e133]: a
            - generic [ref=e134]: r
            - generic [ref=e135]: g
            - generic [ref=e136]: e
          - generic [ref=e138]:
            - generic [ref=e139]: d
            - generic [ref=e140]: a
            - generic [ref=e141]: "y"
          - generic [ref=e143]:
            - generic [ref=e144]: w
            - generic [ref=e145]: o
            - generic [ref=e146]: r
            - generic [ref=e147]: l
            - generic [ref=e148]: d
          - generic [ref=e150]:
            - generic [ref=e151]: p
            - generic [ref=e152]: l
            - generic [ref=e153]: a
            - generic [ref=e154]: "n"
          - generic [ref=e156]:
            - generic [ref=e157]: u
            - generic [ref=e158]: s
            - generic [ref=e159]: e
          - generic [ref=e161]:
            - generic [ref=e162]: s
            - generic [ref=e163]: a
            - generic [ref=e164]: "y"
          - generic [ref=e166]:
            - generic [ref=e167]: b
            - generic [ref=e168]: u
            - generic [ref=e169]: i
            - generic [ref=e170]: l
            - generic [ref=e171]: d
          - generic [ref=e173]:
            - generic [ref=e174]: s
            - generic [ref=e175]: t
            - generic [ref=e176]: e
            - generic [ref=e177]: p
          - generic [ref=e179]:
            - generic [ref=e180]: t
            - generic [ref=e181]: r
            - generic [ref=e182]: e
            - generic [ref=e183]: e
          - generic [ref=e185]:
            - generic [ref=e186]: s
            - generic [ref=e187]: a
            - generic [ref=e188]: f
            - generic [ref=e189]: e
          - generic [ref=e191]:
            - generic [ref=e192]: s
            - generic [ref=e193]: h
            - generic [ref=e194]: o
            - generic [ref=e195]: r
            - generic [ref=e196]: e
          - generic [ref=e198]:
            - generic [ref=e199]: s
            - generic [ref=e200]: t
            - generic [ref=e201]: r
            - generic [ref=e202]: e
            - generic [ref=e203]: e
            - generic [ref=e204]: t
          - generic [ref=e206]:
            - generic [ref=e207]: r
            - generic [ref=e208]: a
            - generic [ref=e209]: i
            - generic [ref=e210]: s
            - generic [ref=e211]: e
          - generic [ref=e213]:
            - generic [ref=e214]: w
            - generic [ref=e215]: o
            - generic [ref=e216]: m
            - generic [ref=e217]: a
            - generic [ref=e218]: "n"
          - generic [ref=e220]:
            - generic [ref=e221]: c
            - generic [ref=e222]: a
            - generic [ref=e223]: l
            - generic [ref=e224]: m
          - generic [ref=e226]:
            - generic [ref=e227]: s
            - generic [ref=e228]: o
            - generic [ref=e229]: f
            - generic [ref=e230]: t
          - generic [ref=e232]:
            - generic [ref=e233]: e
            - generic [ref=e234]: a
            - generic [ref=e235]: r
            - generic [ref=e236]: l
            - generic [ref=e237]: "y"
          - generic [ref=e239]:
            - generic [ref=e240]: "n"
            - generic [ref=e241]: i
            - generic [ref=e242]: c
            - generic [ref=e243]: e
          - generic [ref=e245]:
            - generic [ref=e246]: q
            - generic [ref=e247]: u
            - generic [ref=e248]: e
            - generic [ref=e249]: e
            - generic [ref=e250]: "n"
          - generic [ref=e252]:
            - generic [ref=e253]: v
            - generic [ref=e254]: i
            - generic [ref=e255]: e
            - generic [ref=e256]: w
          - generic [ref=e258]:
            - generic [ref=e259]: s
            - generic [ref=e260]: t
            - generic [ref=e261]: r
            - generic [ref=e262]: o
            - generic [ref=e263]: "n"
            - generic [ref=e264]: g
          - generic [ref=e266]:
            - generic [ref=e267]: a
            - generic [ref=e268]: "n"
          - generic [ref=e270]:
            - generic [ref=e271]: w
            - generic [ref=e272]: i
            - generic [ref=e273]: d
            - generic [ref=e274]: e
          - generic [ref=e276]:
            - generic [ref=e277]: s
            - generic [ref=e278]: o
            - generic [ref=e279]: m
            - generic [ref=e280]: e
          - generic [ref=e282]:
            - generic [ref=e283]: c
            - generic [ref=e284]: o
            - generic [ref=e285]: d
            - generic [ref=e286]: e
          - generic [ref=e288]:
            - generic [ref=e289]: "y"
            - generic [ref=e290]: e
            - generic [ref=e291]: a
            - generic [ref=e292]: r
          - generic [ref=e294]:
            - generic [ref=e295]: q
            - generic [ref=e296]: u
            - generic [ref=e297]: e
            - generic [ref=e298]: s
            - generic [ref=e299]: t
            - generic [ref=e300]: i
            - generic [ref=e301]: o
            - generic [ref=e302]: "n"
          - generic [ref=e304]:
            - generic [ref=e305]: f
            - generic [ref=e306]: o
            - generic [ref=e307]: o
            - generic [ref=e308]: t
          - generic [ref=e310]:
            - generic [ref=e311]: g
            - generic [ref=e312]: u
            - generic [ref=e313]: i
            - generic [ref=e314]: d
            - generic [ref=e315]: e
          - generic [ref=e317]:
            - generic [ref=e318]: f
            - generic [ref=e319]: o
            - generic [ref=e320]: r
          - generic [ref=e322]:
            - generic [ref=e323]: l
            - generic [ref=e324]: a
            - generic [ref=e325]: "n"
            - generic [ref=e326]: d
          - generic [ref=e328]:
            - generic [ref=e329]: d
            - generic [ref=e330]: o
            - generic [ref=e331]: w
            - generic [ref=e332]: "n"
          - generic [ref=e334]:
            - generic [ref=e335]: o
            - generic [ref=e336]: "n"
            - generic [ref=e337]: l
            - generic [ref=e338]: "y"
          - generic [ref=e340]:
            - generic [ref=e341]: m
            - generic [ref=e342]: a
            - generic [ref=e343]: p
          - generic [ref=e345]:
            - generic [ref=e346]: h
            - generic [ref=e347]: a
            - generic [ref=e348]: s
          - generic [ref=e350]:
            - generic [ref=e351]: s
            - generic [ref=e352]: e
            - generic [ref=e353]: a
            - generic [ref=e354]: t
          - generic [ref=e356]:
            - generic [ref=e357]: t
            - generic [ref=e358]: a
            - generic [ref=e359]: s
            - generic [ref=e360]: t
            - generic [ref=e361]: e
          - generic [ref=e363]:
            - generic [ref=e364]: h
            - generic [ref=e365]: o
            - generic [ref=e366]: w
          - generic [ref=e368]:
            - generic [ref=e369]: w
            - generic [ref=e370]: a
            - generic [ref=e371]: i
            - generic [ref=e372]: t
          - generic [ref=e374]:
            - generic [ref=e375]: p
            - generic [ref=e376]: o
            - generic [ref=e377]: i
            - generic [ref=e378]: "n"
            - generic [ref=e379]: t
          - generic [ref=e381]:
            - generic [ref=e382]: i
            - generic [ref=e383]: "n"
          - generic [ref=e385]:
            - generic [ref=e386]: f
            - generic [ref=e387]: l
            - generic [ref=e388]: o
            - generic [ref=e389]: w
          - generic [ref=e391]:
            - generic [ref=e392]: t
            - generic [ref=e393]: h
            - generic [ref=e394]: i
            - generic [ref=e395]: "n"
            - generic [ref=e396]: g
          - generic [ref=e398]:
            - generic [ref=e399]: "n"
            - generic [ref=e400]: e
            - generic [ref=e401]: v
            - generic [ref=e402]: e
            - generic [ref=e403]: r
          - generic [ref=e405]:
            - generic [ref=e406]: t
            - generic [ref=e407]: h
            - generic [ref=e408]: o
            - generic [ref=e409]: u
            - generic [ref=e410]: g
            - generic [ref=e411]: h
            - generic [ref=e412]: t
          - generic [ref=e414]:
            - generic [ref=e415]: s
            - generic [ref=e416]: i
            - generic [ref=e417]: d
            - generic [ref=e418]: e
          - generic [ref=e420]:
            - generic [ref=e421]: "n"
            - generic [ref=e422]: a
            - generic [ref=e423]: t
            - generic [ref=e424]: i
            - generic [ref=e425]: o
            - generic [ref=e426]: "n"
          - generic [ref=e428]:
            - generic [ref=e429]: g
            - generic [ref=e430]: a
            - generic [ref=e431]: m
            - generic [ref=e432]: e
          - generic [ref=e434]:
            - generic [ref=e435]: z
            - generic [ref=e436]: i
            - generic [ref=e437]: "n"
            - generic [ref=e438]: c
          - generic [ref=e440]:
            - generic [ref=e441]: v
            - generic [ref=e442]: o
            - generic [ref=e443]: i
            - generic [ref=e444]: c
            - generic [ref=e445]: e
          - generic [ref=e447]:
            - generic [ref=e448]: d
            - generic [ref=e449]: o
            - generic [ref=e450]: w
            - generic [ref=e451]: "n"
          - generic [ref=e453]:
            - generic [ref=e454]: h
            - generic [ref=e455]: e
            - generic [ref=e456]: r
            - generic [ref=e457]: e
          - generic [ref=e459]:
            - generic [ref=e460]: w
            - generic [ref=e461]: a
            - generic [ref=e462]: "y"
          - generic [ref=e464]:
            - generic [ref=e465]: e
            - generic [ref=e466]: a
            - generic [ref=e467]: r
          - generic [ref=e469]:
            - generic [ref=e470]: t
            - generic [ref=e471]: o
            - generic [ref=e472]: g
            - generic [ref=e473]: e
            - generic [ref=e474]: t
            - generic [ref=e475]: h
            - generic [ref=e476]: e
            - generic [ref=e477]: r
          - generic [ref=e479]:
            - generic [ref=e480]: s
            - generic [ref=e481]: t
            - generic [ref=e482]: a
            - generic [ref=e483]: r
          - generic [ref=e485]:
            - generic [ref=e486]: l
            - generic [ref=e487]: o
            - generic [ref=e488]: v
            - generic [ref=e489]: e
          - generic [ref=e491]:
            - generic [ref=e492]: m
            - generic [ref=e493]: a
            - generic [ref=e494]: "n"
            - generic [ref=e495]: "y"
          - generic [ref=e497]:
            - generic [ref=e498]: u
            - generic [ref=e499]: "n"
            - generic [ref=e500]: d
            - generic [ref=e501]: e
            - generic [ref=e502]: r
          - generic [ref=e504]:
            - generic [ref=e505]: e
            - generic [ref=e506]: a
            - generic [ref=e507]: s
            - generic [ref=e508]: t
          - generic [ref=e510]:
            - generic [ref=e511]: g
            - generic [ref=e512]: r
            - generic [ref=e513]: a
            - generic [ref=e514]: "n"
            - generic [ref=e515]: d
          - generic [ref=e517]:
            - generic [ref=e518]: k
            - generic [ref=e519]: e
            - generic [ref=e520]: "y"
          - generic [ref=e522]:
            - generic [ref=e523]: m
            - generic [ref=e524]: a
            - generic [ref=e525]: i
            - generic [ref=e526]: "n"
          - generic [ref=e528]:
            - generic [ref=e529]: b
            - generic [ref=e530]: r
            - generic [ref=e531]: i
            - generic [ref=e532]: g
            - generic [ref=e533]: h
            - generic [ref=e534]: t
          - generic [ref=e536]:
            - generic [ref=e537]: e
            - generic [ref=e538]: r
            - generic [ref=e539]: a
          - generic [ref=e541]:
            - generic [ref=e542]: l
            - generic [ref=e543]: i
            - generic [ref=e544]: t
            - generic [ref=e545]: t
            - generic [ref=e546]: l
            - generic [ref=e547]: e
          - generic [ref=e549]:
            - generic [ref=e550]: b
            - generic [ref=e551]: r
            - generic [ref=e552]: i
            - generic [ref=e553]: g
            - generic [ref=e554]: h
            - generic [ref=e555]: t
          - generic [ref=e557]:
            - generic [ref=e558]: s
            - generic [ref=e559]: l
            - generic [ref=e560]: o
            - generic [ref=e561]: w
          - generic [ref=e563]:
            - generic [ref=e564]: t
            - generic [ref=e565]: h
            - generic [ref=e566]: e
          - generic [ref=e568]:
            - generic [ref=e569]: s
            - generic [ref=e570]: o
          - generic [ref=e572]:
            - generic [ref=e573]: f
            - generic [ref=e574]: i
            - generic [ref=e575]: v
            - generic [ref=e576]: e
          - generic [ref=e578]:
            - generic [ref=e579]: d
            - generic [ref=e580]: r
            - generic [ref=e581]: e
            - generic [ref=e582]: a
            - generic [ref=e583]: m
          - generic [ref=e585]:
            - generic [ref=e586]: r
            - generic [ref=e587]: o
            - generic [ref=e588]: a
            - generic [ref=e589]: d
          - generic [ref=e591]:
            - generic [ref=e592]: d
            - generic [ref=e593]: r
            - generic [ref=e594]: e
            - generic [ref=e595]: a
            - generic [ref=e596]: m
          - generic [ref=e598]:
            - generic [ref=e599]: l
            - generic [ref=e600]: i
            - generic [ref=e601]: t
            - generic [ref=e602]: t
            - generic [ref=e603]: l
            - generic [ref=e604]: e
          - generic [ref=e606]:
            - generic [ref=e607]: "n"
            - generic [ref=e608]: e
            - generic [ref=e609]: x
            - generic [ref=e610]: t
          - generic [ref=e612]:
            - generic [ref=e613]: "n"
            - generic [ref=e614]: e
            - generic [ref=e615]: w
          - generic [ref=e617]:
            - generic [ref=e618]: c
            - generic [ref=e619]: a
            - generic [ref=e620]: r
            - generic [ref=e621]: e
          - generic [ref=e623]:
            - generic [ref=e624]: a
            - generic [ref=e625]: i
            - generic [ref=e626]: r
          - generic [ref=e628]:
            - generic [ref=e629]: m
            - generic [ref=e630]: a
            - generic [ref=e631]: "n"
            - generic [ref=e632]: "y"
          - generic [ref=e634]:
            - generic [ref=e635]: e
            - generic [ref=e636]: r
            - generic [ref=e637]: a
          - generic [ref=e639]:
            - generic [ref=e640]: w
            - generic [ref=e641]: e
            - generic [ref=e642]: l
            - generic [ref=e643]: l
          - generic [ref=e645]:
            - generic [ref=e646]: w
            - generic [ref=e647]: e
            - generic [ref=e648]: l
            - generic [ref=e649]: l
          - generic [ref=e651]:
            - generic [ref=e652]: g
            - generic [ref=e653]: r
            - generic [ref=e654]: a
            - generic [ref=e655]: "n"
            - generic [ref=e656]: d
          - generic [ref=e658]:
            - generic [ref=e659]: c
            - generic [ref=e660]: o
            - generic [ref=e661]: d
            - generic [ref=e662]: e
          - generic [ref=e664]:
            - generic [ref=e665]: h
            - generic [ref=e666]: o
            - generic [ref=e667]: w
          - generic [ref=e669]:
            - generic [ref=e670]: s
            - generic [ref=e671]: h
            - generic [ref=e672]: a
            - generic [ref=e673]: p
            - generic [ref=e674]: e
          - generic [ref=e676]:
            - generic [ref=e677]: "n"
            - generic [ref=e678]: e
            - generic [ref=e679]: e
            - generic [ref=e680]: d
          - generic [ref=e682]:
            - generic [ref=e683]: g
            - generic [ref=e684]: r
            - generic [ref=e685]: e
            - generic [ref=e686]: e
            - generic [ref=e687]: "n"
          - generic [ref=e689]:
            - generic [ref=e690]: s
            - generic [ref=e691]: p
            - generic [ref=e692]: a
            - generic [ref=e693]: c
            - generic [ref=e694]: e
          - generic [ref=e696]:
            - generic [ref=e697]: l
            - generic [ref=e698]: e
            - generic [ref=e699]: a
            - generic [ref=e700]: r
            - generic [ref=e701]: "n"
          - generic [ref=e703]:
            - generic [ref=e704]: "n"
            - generic [ref=e705]: e
            - generic [ref=e706]: e
            - generic [ref=e707]: d
          - generic [ref=e709]:
            - generic [ref=e710]: o
            - generic [ref=e711]: "n"
            - generic [ref=e712]: i
            - generic [ref=e713]: o
            - generic [ref=e714]: "n"
          - generic [ref=e716]:
            - generic [ref=e717]: a
            - generic [ref=e718]: s
          - generic [ref=e720]:
            - generic [ref=e721]: t
            - generic [ref=e722]: e
            - generic [ref=e723]: l
            - generic [ref=e724]: l
          - generic [ref=e726]:
            - generic [ref=e727]: r
            - generic [ref=e728]: e
            - generic [ref=e729]: t
            - generic [ref=e730]: i
            - generic [ref=e731]: "n"
            - generic [ref=e732]: a
          - generic [ref=e734]:
            - generic [ref=e735]: d
            - generic [ref=e736]: r
            - generic [ref=e737]: a
            - generic [ref=e738]: w
          - generic [ref=e740]:
            - generic [ref=e741]: t
            - generic [ref=e742]: e
            - generic [ref=e743]: a
            - generic [ref=e744]: m
          - generic [ref=e746]:
            - generic [ref=e747]: e
            - generic [ref=e748]: a
            - generic [ref=e749]: s
            - generic [ref=e750]: e
          - generic [ref=e752]:
            - generic [ref=e753]: f
            - generic [ref=e754]: a
            - generic [ref=e755]: i
            - generic [ref=e756]: r
          - generic [ref=e758]:
            - generic [ref=e759]: i
            - generic [ref=e760]: r
            - generic [ref=e761]: o
            - generic [ref=e762]: "n"
          - generic [ref=e764]:
            - generic [ref=e765]: f
            - generic [ref=e766]: i
            - generic [ref=e767]: "n"
            - generic [ref=e768]: d
          - generic [ref=e770]:
            - generic [ref=e771]: f
            - generic [ref=e772]: i
            - generic [ref=e773]: r
            - generic [ref=e774]: e
          - generic [ref=e776]:
            - generic [ref=e777]: e
            - generic [ref=e778]: r
            - generic [ref=e779]: a
          - generic [ref=e781]:
            - generic [ref=e782]: e
            - generic [ref=e783]: a
            - generic [ref=e784]: r
            - generic [ref=e785]: t
            - generic [ref=e786]: h
          - generic [ref=e788]:
            - generic [ref=e789]: t
            - generic [ref=e790]: i
            - generic [ref=e791]: r
            - generic [ref=e792]: e
          - generic [ref=e794]:
            - generic [ref=e795]: w
            - generic [ref=e796]: o
            - generic [ref=e797]: r
            - generic [ref=e798]: d
          - generic [ref=e800]:
            - generic [ref=e801]: g
            - generic [ref=e802]: o
            - generic [ref=e803]: l
            - generic [ref=e804]: d
          - generic [ref=e806]:
            - generic [ref=e807]: r
            - generic [ref=e808]: e
            - generic [ref=e809]: a
            - generic [ref=e810]: d
          - generic [ref=e812]:
            - generic [ref=e813]: p
            - generic [ref=e814]: o
            - generic [ref=e815]: e
            - generic [ref=e816]: m
          - generic [ref=e818]:
            - generic [ref=e819]: a
            - generic [ref=e820]: t
            - generic [ref=e821]: t
            - generic [ref=e822]: e
            - generic [ref=e823]: "n"
            - generic [ref=e824]: t
            - generic [ref=e825]: i
            - generic [ref=e826]: o
            - generic [ref=e827]: "n"
          - generic [ref=e829]:
            - generic [ref=e830]: f
            - generic [ref=e831]: a
            - generic [ref=e832]: r
          - generic [ref=e834]:
            - generic [ref=e835]: s
            - generic [ref=e836]: p
            - generic [ref=e837]: a
            - generic [ref=e838]: c
            - generic [ref=e839]: e
          - generic [ref=e841]:
            - generic [ref=e842]: h
            - generic [ref=e843]: e
          - generic [ref=e845]:
            - generic [ref=e846]: w
            - generic [ref=e847]: e
            - generic [ref=e848]: s
            - generic [ref=e849]: t
          - generic [ref=e851]:
            - generic [ref=e852]: l
            - generic [ref=e853]: i
            - generic [ref=e854]: g
            - generic [ref=e855]: h
            - generic [ref=e856]: t
          - generic [ref=e858]:
            - generic [ref=e859]: w
            - generic [ref=e860]: h
            - generic [ref=e861]: o
          - generic [ref=e863]:
            - generic [ref=e864]: m
            - generic [ref=e865]: a
            - generic [ref=e866]: "y"
          - generic [ref=e868]:
            - generic [ref=e869]: s
            - generic [ref=e870]: o
            - generic [ref=e871]: f
            - generic [ref=e872]: t
        - paragraph [ref=e873]: "Practice passage: terrain large day world plan use say build step tree safe shore street raise woman calm soft early nice queen view strong an wide some code year question foot guide for land down only map has seat taste how wait point in flow thing never thought side nation game zinc voice down here way ear together star love many under east grand key main bright era little bright slow the so five dream road dream little next new care air many era well well grand code how shape need green space learn need onion as tell retina draw team ease fair iron find fire era earth tire word gold read poem attention far space he west light who may soft"
        - textbox "Typing input" [active] [ref=e874]
      - generic [ref=e876]:
        - paragraph [ref=e877]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e878]
      - generic [ref=e879]:
        - paragraph [ref=e880]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
        - generic [ref=e881]:
          - button "Restart with new text" [ref=e882]
          - button "Show accessible text editor" [ref=e886]
          - button "Finish" [disabled] [ref=e890]
      - status [ref=e893]: Ready to type
  - contentinfo [ref=e894]:
    - generic [ref=e895]:
      - generic [ref=e896]:
        - generic [ref=e897]:
          - generic [ref=e898]: Sparow
          - generic [ref=e899]: Type
        - text: Find your rhythm.
      - generic [ref=e900]:
        - link "About & metrics" [ref=e901] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e902] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e903] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e904] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e905] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e906] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e907]: SparowType © 2026
```

# Test source

```ts
  804 |     !available,
  805 |     "UNVERIFIED: this native worker has no WEBGL_lose_context extension.",
  806 |   );
  807 |   if (phase === "live") {
  808 |     await firstWorkerReady(page);
  809 |     const ready = (await records(page))[0].received.find(
  810 |       (receipt) => receipt.type === "ready",
  811 |     )?.diagnostics;
  812 |     if (!ready)
  813 |       throw new Error("No native worker readiness receipt before live loss");
  814 |     expect(ready.frames).toBeGreaterThan(0);
  815 |     expect(ready.drawCalls).toBeGreaterThan(0);
  816 |     await expect
  817 |       .poll(() =>
  818 |         page.evaluate(
  819 |           () =>
  820 |             new Set(
  821 |               (window as AuditedWindow)
  822 |                 .fallbackAnimationAudit!.actions.filter(
  823 |                   (item) =>
  824 |                     item.action === "pause" &&
  825 |                     item.name === "awakening-key-dissolve",
  826 |                 )
  827 |                 .map((item) => item.id),
  828 |             ).size,
  829 |         ),
  830 |       )
  831 |       .toBe(61);
  832 |     // Diagnostics are batched every20 frames. Use a real worker RAF receipt to
  833 |     // establish live loss without waiting for that unrelated FPS sample window.
  834 |     const pausedSnapshots = await page.evaluate(async () => {
  835 |       // These are native document frames, not an advanced/faked clock. Let a
  836 |       // pending native pause settle, then prove the hidden phase stays fixed.
  837 |       await new Promise<void>((resolve) =>
  838 |         requestAnimationFrame(() => resolve()),
  839 |       );
  840 |       const before = (window as AuditedWindow).fallbackAnimationAudit!.sample();
  841 |       await new Promise<void>((resolve) =>
  842 |         requestAnimationFrame(() => resolve()),
  843 |       );
  844 |       const after = (window as AuditedWindow).fallbackAnimationAudit!.sample();
  845 |       (window as AuditedWindow).openingWorkerAudit!.workers[0].postMessage({
  846 |         type: "test-request-native-context-loss",
  847 |       });
  848 |       return { before, after };
  849 |     });
  850 |     await info.attach("native-hidden-fallback-phase", {
  851 |       body: JSON.stringify(pausedSnapshots),
  852 |       contentType: "application/json",
  853 |     });
  854 |     expect(pausedSnapshots.before).toHaveLength(61);
  855 |     expect(pausedSnapshots.after).toHaveLength(61);
  856 |     // Keep all five predicates for all 61 native samples, but report them in one
  857 |     // assertion. Hundreds of traced expect calls can consume the remaining
  858 |     // fixed 4.2s intro interval before the strict recovery draw is observed.
  859 |     const pausedPhaseErrors = pausedSnapshots.before.flatMap((before) => {
  860 |       const after = pausedSnapshots.after.find((item) => item.id === before.id);
  861 |       if (!after) return [`animation ${before.id}: missing second native sample`];
  862 |       const errors: string[] = [];
  863 |       if (before.state !== "paused") errors.push("first sample is not paused");
  864 |       if (after.state !== "paused") errors.push("second sample is not paused");
  865 |       if (before.renderer !== "webgl") errors.push("fallback is not hidden");
  866 |       if (
  867 |         typeof before.currentTime !== "number" ||
  868 |         typeof after.currentTime !== "number" ||
  869 |         !Number.isFinite(before.currentTime) ||
  870 |         !Number.isFinite(after.currentTime) ||
  871 |         Math.abs(after.currentTime - before.currentTime) >= 0.05
  872 |       )
  873 |         errors.push("native paused phase changed (one-decimal tolerance)");
  874 |       if (
  875 |         typeof before.timelineTime !== "number" ||
  876 |         typeof after.timelineTime !== "number" ||
  877 |         !(after.timelineTime > before.timelineTime)
  878 |       )
  879 |         errors.push("native document timeline did not advance");
  880 |       return errors.map((error) => `animation ${before.id}: ${error}`);
  881 |     });
  882 |     expect(pausedPhaseErrors).toEqual([]);
  883 |     await expect
  884 |       .poll(async () =>
  885 |         (await records(page))[0]?.received.some(
  886 |           (receipt) => receipt.type === "test-live-animation-frame",
  887 |         ),
  888 |       )
  889 |       .toBe(true);
  890 |   }
  891 |   await expect
  892 |     .poll(async () =>
  893 |       (await records(page))[0]?.received.some(
  894 |         (receipt) => receipt.type === "test-native-context-loss-requested",
  895 |       ),
  896 |     )
  897 |     .toBe(true);
  898 |   await expect
  899 |     .poll(async () =>
  900 |       (await records(page))[0]?.received.some(
  901 |         (receipt) => receipt.diagnostics?.contextLost,
  902 |       ),
  903 |     )
> 904 |     .toBe(true);
      |      ^ Error: expect(received).toBe(expected) // Object.is equality
  905 |   if (phase === "live") {
  906 |     const readActions = () =>
  907 |       page.evaluate(
  908 |         () => (window as AuditedWindow).fallbackAnimationAudit!.actions,
  909 |       );
  910 |     await expect
  911 |       .poll(async () => {
  912 |         const actions = await readActions();
  913 |         return new Set(
  914 |           actions
  915 |             .filter(
  916 |               (item) =>
  917 |                 item.name === "awakening-key-dissolve" &&
  918 |                 (item.action === "play" || item.action === "finish") &&
  919 |                 item.renderer === "fallback",
  920 |             )
  921 |             .map((item) => item.id),
  922 |         ).size;
  923 |       })
  924 |       .toBe(61);
  925 |     const actions = await readActions();
  926 |     const pauses = actions.filter(
  927 |       (item, index) =>
  928 |         item.action === "pause" &&
  929 |         item.name === "awakening-key-dissolve" &&
  930 |         !actions
  931 |           .slice(0, index)
  932 |           .some(
  933 |             (earlier) => earlier.id === item.id && earlier.action === "pause",
  934 |           ),
  935 |     );
  936 |     const checked = pauses.map((pause) => {
  937 |       const resume = actions.find(
  938 |         (item) =>
  939 |           item.id === pause.id &&
  940 |           item.atMs >= pause.atMs &&
  941 |           (item.action === "play" || item.action === "finish"),
  942 |       );
  943 |       if (
  944 |         !resume ||
  945 |         pause.currentTime === null ||
  946 |         pause.timelineTime === null ||
  947 |         resume.timelineTime === null
  948 |       )
  949 |         return {
  950 |           id: pause.id,
  951 |           error: "missing finite native pause/resume phase",
  952 |         };
  953 |       const elapsed = Math.max(0, resume.timelineTime - pause.timelineTime);
  954 |       const expected = pause.currentTime + elapsed * pause.rate;
  955 |       const finished =
  956 |         pause.rate > 0 && pause.endTime !== null && expected >= pause.endTime;
  957 |       const expectedTime = finished ? pause.endTime! : expected;
  958 |       return {
  959 |         id: pause.id,
  960 |         pause,
  961 |         resume,
  962 |         elapsed,
  963 |         expectedTime,
  964 |         error:
  965 |           resume.timelineId !== pause.timelineId ||
  966 |           resume.rate !== pause.rate ||
  967 |           resume.renderer !== "fallback" ||
  968 |           resume.currentTime === null ||
  969 |           Math.abs(resume.currentTime - expectedTime) > 40 ||
  970 |           resume.action !== (finished ? "finish" : "play")
  971 |             ? "native fallback did not catch up on its original timeline"
  972 |             : null,
  973 |       };
  974 |     });
  975 |     await info.attach("native-fallback-resume-phase", {
  976 |       body: JSON.stringify(checked),
  977 |       contentType: "application/json",
  978 |     });
  979 |     expect(checked).toHaveLength(61);
  980 |     expect(checked.filter((item) => item.error)).toEqual([]);
  981 |   }
  982 |   await expectRecoveredDocumentScene(page);
  983 | }
  984 | 
  985 | test("actual worker WebGL context loss during preparation recovers with a fresh canvas and keeps practice usable", async ({
  986 |   page,
  987 | }, info) => {
  988 |   await nativeContextLoss(page, info, "preparation");
  989 | });
  990 | 
  991 | test("actual worker WebGL context loss after live frames recovers with a fresh canvas and keeps practice usable", async ({
  992 |   page,
  993 | }, info) => {
  994 |   await nativeContextLoss(page, info, "live");
  995 | });
  996 | 
```