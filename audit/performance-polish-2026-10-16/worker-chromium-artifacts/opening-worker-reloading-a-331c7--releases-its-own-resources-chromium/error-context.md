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
Received: undefined

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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
            - generic [ref=f1e123]: "y"
            - generic [ref=f1e124]: e
            - generic [ref=f1e125]: l
            - generic [ref=f1e126]: l
            - generic [ref=f1e127]: o
            - generic [ref=f1e128]: w
          - generic [ref=f1e130]:
            - generic [ref=f1e131]: s
            - generic [ref=f1e132]: t
            - generic [ref=f1e133]: e
            - generic [ref=f1e134]: p
          - generic [ref=f1e136]:
            - generic [ref=f1e137]: s
            - generic [ref=f1e138]: a
            - generic [ref=f1e139]: v
            - generic [ref=f1e140]: e
          - generic [ref=f1e142]:
            - generic [ref=f1e143]: w
            - generic [ref=f1e144]: a
            - generic [ref=f1e145]: t
            - generic [ref=f1e146]: e
            - generic [ref=f1e147]: r
          - generic [ref=f1e149]:
            - generic [ref=f1e150]: p
            - generic [ref=f1e151]: a
            - generic [ref=f1e152]: t
            - generic [ref=f1e153]: h
          - generic [ref=f1e155]:
            - generic [ref=f1e156]: s
            - generic [ref=f1e157]: a
            - generic [ref=f1e158]: "y"
          - generic [ref=f1e160]:
            - generic [ref=f1e161]: t
            - generic [ref=f1e162]: h
            - generic [ref=f1e163]: e
            - generic [ref=f1e164]: i
            - generic [ref=f1e165]: r
          - generic [ref=f1e167]:
            - generic [ref=f1e168]: t
            - generic [ref=f1e169]: r
            - generic [ref=f1e170]: u
            - generic [ref=f1e171]: e
          - generic [ref=f1e173]:
            - generic [ref=f1e174]: o
            - generic [ref=f1e175]: "n"
            - generic [ref=f1e176]: l
            - generic [ref=f1e177]: "y"
          - generic [ref=f1e179]:
            - generic [ref=f1e180]: o
            - generic [ref=f1e181]: u
            - generic [ref=f1e182]: t
          - generic [ref=f1e184]:
            - generic [ref=f1e185]: w
            - generic [ref=f1e186]: e
            - generic [ref=f1e187]: l
            - generic [ref=f1e188]: l
          - generic [ref=f1e190]:
            - generic [ref=f1e191]: t
            - generic [ref=f1e192]: i
            - generic [ref=f1e193]: e
            - generic [ref=f1e194]: r
          - generic [ref=f1e196]:
            - generic [ref=f1e197]: "n"
            - generic [ref=f1e198]: i
            - generic [ref=f1e199]: c
            - generic [ref=f1e200]: e
          - generic [ref=f1e202]:
            - generic [ref=f1e203]: t
            - generic [ref=f1e204]: u
            - generic [ref=f1e205]: r
            - generic [ref=f1e206]: "n"
          - generic [ref=f1e208]:
            - generic [ref=f1e209]: p
            - generic [ref=f1e210]: l
            - generic [ref=f1e211]: e
            - generic [ref=f1e212]: a
            - generic [ref=f1e213]: s
            - generic [ref=f1e214]: e
          - generic [ref=f1e216]:
            - generic [ref=f1e217]: g
            - generic [ref=f1e218]: l
            - generic [ref=f1e219]: a
            - generic [ref=f1e220]: s
            - generic [ref=f1e221]: s
          - generic [ref=f1e223]:
            - generic [ref=f1e224]: c
            - generic [ref=f1e225]: o
            - generic [ref=f1e226]: d
            - generic [ref=f1e227]: e
          - generic [ref=f1e229]:
            - generic [ref=f1e230]: t
            - generic [ref=f1e231]: h
            - generic [ref=f1e232]: e
            - generic [ref=f1e233]: "n"
          - generic [ref=f1e235]:
            - generic [ref=f1e236]: d
            - generic [ref=f1e237]: o
            - generic [ref=f1e238]: o
            - generic [ref=f1e239]: r
          - generic [ref=f1e241]:
            - generic [ref=f1e242]: h
            - generic [ref=f1e243]: e
            - generic [ref=f1e244]: a
            - generic [ref=f1e245]: d
          - generic [ref=f1e247]:
            - generic [ref=f1e248]: l
            - generic [ref=f1e249]: o
            - generic [ref=f1e250]: v
            - generic [ref=f1e251]: e
          - generic [ref=f1e253]:
            - generic [ref=f1e254]: a
            - generic [ref=f1e255]: t
          - generic [ref=f1e257]:
            - generic [ref=f1e258]: c
            - generic [ref=f1e259]: l
            - generic [ref=f1e260]: e
            - generic [ref=f1e261]: a
            - generic [ref=f1e262]: "n"
          - generic [ref=f1e264]:
            - generic [ref=f1e265]: c
            - generic [ref=f1e266]: o
            - generic [ref=f1e267]: l
            - generic [ref=f1e268]: d
          - generic [ref=f1e270]:
            - generic [ref=f1e271]: p
            - generic [ref=f1e272]: a
            - generic [ref=f1e273]: g
            - generic [ref=f1e274]: e
          - generic [ref=f1e276]:
            - generic [ref=f1e277]: c
            - generic [ref=f1e278]: a
            - generic [ref=f1e279]: r
            - generic [ref=f1e280]: e
          - generic [ref=f1e282]:
            - generic [ref=f1e283]: s
            - generic [ref=f1e284]: i
            - generic [ref=f1e285]: d
            - generic [ref=f1e286]: e
          - generic [ref=f1e288]:
            - generic [ref=f1e289]: r
            - generic [ref=f1e290]: a
            - generic [ref=f1e291]: i
            - generic [ref=f1e292]: "n"
          - generic [ref=f1e294]:
            - generic [ref=f1e295]: w
            - generic [ref=f1e296]: a
            - generic [ref=f1e297]: "n"
            - generic [ref=f1e298]: t
          - generic [ref=f1e300]:
            - generic [ref=f1e301]: d
            - generic [ref=f1e302]: o
            - generic [ref=f1e303]: o
            - generic [ref=f1e304]: r
          - generic [ref=f1e306]:
            - generic [ref=f1e307]: s
            - generic [ref=f1e308]: o
            - generic [ref=f1e309]: r
            - generic [ref=f1e310]: t
          - generic [ref=f1e312]:
            - generic [ref=f1e313]: p
            - generic [ref=f1e314]: e
            - generic [ref=f1e315]: o
            - generic [ref=f1e316]: p
            - generic [ref=f1e317]: l
            - generic [ref=f1e318]: e
          - generic [ref=f1e320]:
            - generic [ref=f1e321]: e
            - generic [ref=f1e322]: a
            - generic [ref=f1e323]: s
            - generic [ref=f1e324]: t
          - generic [ref=f1e326]:
            - generic [ref=f1e327]: f
            - generic [ref=f1e328]: o
            - generic [ref=f1e329]: c
            - generic [ref=f1e330]: u
            - generic [ref=f1e331]: s
          - generic [ref=f1e333]:
            - generic [ref=f1e334]: f
            - generic [ref=f1e335]: o
            - generic [ref=f1e336]: o
            - generic [ref=f1e337]: t
          - generic [ref=f1e339]:
            - generic [ref=f1e340]: m
            - generic [ref=f1e341]: u
            - generic [ref=f1e342]: c
            - generic [ref=f1e343]: h
          - generic [ref=f1e345]:
            - generic [ref=f1e346]: t
            - generic [ref=f1e347]: h
            - generic [ref=f1e348]: o
            - generic [ref=f1e349]: u
            - generic [ref=f1e350]: g
            - generic [ref=f1e351]: h
          - generic [ref=f1e353]:
            - generic [ref=f1e354]: t
            - generic [ref=f1e355]: a
            - generic [ref=f1e356]: "n"
          - generic [ref=f1e358]: a
          - generic [ref=f1e361]:
            - generic [ref=f1e362]: f
            - generic [ref=f1e363]: e
            - generic [ref=f1e364]: e
            - generic [ref=f1e365]: l
          - generic [ref=f1e367]:
            - generic [ref=f1e368]: s
            - generic [ref=f1e369]: p
            - generic [ref=f1e370]: a
            - generic [ref=f1e371]: c
            - generic [ref=f1e372]: e
          - generic [ref=f1e374]:
            - generic [ref=f1e375]: l
            - generic [ref=f1e376]: a
            - generic [ref=f1e377]: r
            - generic [ref=f1e378]: g
            - generic [ref=f1e379]: e
          - generic [ref=f1e381]:
            - generic [ref=f1e382]: t
            - generic [ref=f1e383]: e
            - generic [ref=f1e384]: l
            - generic [ref=f1e385]: l
          - generic [ref=f1e387]:
            - generic [ref=f1e388]: l
            - generic [ref=f1e389]: o
            - generic [ref=f1e390]: w
          - generic [ref=f1e392]:
            - generic [ref=f1e393]: r
            - generic [ref=f1e394]: a
            - generic [ref=f1e395]: i
            - generic [ref=f1e396]: "n"
          - generic [ref=f1e398]:
            - generic [ref=f1e399]: s
            - generic [ref=f1e400]: h
            - generic [ref=f1e401]: e
          - generic [ref=f1e403]:
            - generic [ref=f1e404]: s
            - generic [ref=f1e405]: o
            - generic [ref=f1e406]: o
            - generic [ref=f1e407]: t
          - generic [ref=f1e409]:
            - generic [ref=f1e410]: b
            - generic [ref=f1e411]: o
            - generic [ref=f1e412]: o
            - generic [ref=f1e413]: k
          - generic [ref=f1e415]:
            - generic [ref=f1e416]: "n"
            - generic [ref=f1e417]: o
            - generic [ref=f1e418]: t
            - generic [ref=f1e419]: e
          - generic [ref=f1e421]:
            - generic [ref=f1e422]: w
            - generic [ref=f1e423]: i
            - generic [ref=f1e424]: t
            - generic [ref=f1e425]: h
          - generic [ref=f1e427]:
            - generic [ref=f1e428]: t
            - generic [ref=f1e429]: o
            - generic [ref=f1e430]: w
            - generic [ref=f1e431]: "n"
          - generic [ref=f1e433]:
            - generic [ref=f1e434]: s
            - generic [ref=f1e435]: e
            - generic [ref=f1e436]: a
            - generic [ref=f1e437]: t
          - generic [ref=f1e439]:
            - generic [ref=f1e440]: c
            - generic [ref=f1e441]: a
            - generic [ref=f1e442]: l
            - generic [ref=f1e443]: m
          - generic [ref=f1e445]:
            - generic [ref=f1e446]: u
            - generic [ref=f1e447]: "n"
            - generic [ref=f1e448]: d
            - generic [ref=f1e449]: e
            - generic [ref=f1e450]: r
          - generic [ref=f1e452]:
            - generic [ref=f1e453]: t
            - generic [ref=f1e454]: o
            - generic [ref=f1e455]: p
          - generic [ref=f1e457]:
            - generic [ref=f1e458]: s
            - generic [ref=f1e459]: t
            - generic [ref=f1e460]: i
            - generic [ref=f1e461]: l
            - generic [ref=f1e462]: l
          - generic [ref=f1e464]:
            - generic [ref=f1e465]: k
            - generic [ref=f1e466]: e
            - generic [ref=f1e467]: e
            - generic [ref=f1e468]: p
          - generic [ref=f1e470]:
            - generic [ref=f1e471]: p
            - generic [ref=f1e472]: o
            - generic [ref=f1e473]: e
            - generic [ref=f1e474]: m
          - generic [ref=f1e476]:
            - generic [ref=f1e477]: h
            - generic [ref=f1e478]: a
            - generic [ref=f1e479]: p
            - generic [ref=f1e480]: p
            - generic [ref=f1e481]: "y"
          - generic [ref=f1e483]:
            - generic [ref=f1e484]: t
            - generic [ref=f1e485]: e
            - generic [ref=f1e486]: a
          - generic [ref=f1e488]:
            - generic [ref=f1e489]: "y"
            - generic [ref=f1e490]: e
            - generic [ref=f1e491]: t
          - generic [ref=f1e493]:
            - generic [ref=f1e494]: a
            - generic [ref=f1e495]: i
            - generic [ref=f1e496]: r
          - generic [ref=f1e498]:
            - generic [ref=f1e499]: f
            - generic [ref=f1e500]: o
            - generic [ref=f1e501]: r
            - generic [ref=f1e502]: m
          - generic [ref=f1e504]:
            - generic [ref=f1e505]: t
            - generic [ref=f1e506]: i
            - generic [ref=f1e507]: e
            - generic [ref=f1e508]: r
          - generic [ref=f1e510]:
            - generic [ref=f1e511]: k
            - generic [ref=f1e512]: "n"
            - generic [ref=f1e513]: o
            - generic [ref=f1e514]: w
          - generic [ref=f1e516]:
            - generic [ref=f1e517]: "n"
            - generic [ref=f1e518]: e
            - generic [ref=f1e519]: s
            - generic [ref=f1e520]: t
          - generic [ref=f1e522]:
            - generic [ref=f1e523]: d
            - generic [ref=f1e524]: a
            - generic [ref=f1e525]: r
            - generic [ref=f1e526]: k
          - generic [ref=f1e528]:
            - generic [ref=f1e529]: "n"
            - generic [ref=f1e530]: e
            - generic [ref=f1e531]: w
          - generic [ref=f1e533]:
            - generic [ref=f1e534]: f
            - generic [ref=f1e535]: i
            - generic [ref=f1e536]: v
            - generic [ref=f1e537]: e
          - generic [ref=f1e539]:
            - generic [ref=f1e540]: t
            - generic [ref=f1e541]: e
            - generic [ref=f1e542]: a
            - generic [ref=f1e543]: r
          - generic [ref=f1e545]:
            - generic [ref=f1e546]: r
            - generic [ref=f1e547]: e
            - generic [ref=f1e548]: s
            - generic [ref=f1e549]: t
          - generic [ref=f1e551]:
            - generic [ref=f1e552]: h
            - generic [ref=f1e553]: o
            - generic [ref=f1e554]: u
            - generic [ref=f1e555]: s
            - generic [ref=f1e556]: e
          - generic [ref=f1e558]:
            - generic [ref=f1e559]: t
            - generic [ref=f1e560]: e
            - generic [ref=f1e561]: "n"
            - generic [ref=f1e562]: t
          - generic [ref=f1e564]:
            - generic [ref=f1e565]: a
            - generic [ref=f1e566]: r
            - generic [ref=f1e567]: i
            - generic [ref=f1e568]: s
            - generic [ref=f1e569]: e
          - generic [ref=f1e571]:
            - generic [ref=f1e572]: s
            - generic [ref=f1e573]: h
            - generic [ref=f1e574]: e
          - generic [ref=f1e576]:
            - generic [ref=f1e577]: g
            - generic [ref=f1e578]: r
            - generic [ref=f1e579]: a
            - generic [ref=f1e580]: "n"
            - generic [ref=f1e581]: d
          - generic [ref=f1e583]:
            - generic [ref=f1e584]: h
            - generic [ref=f1e585]: a
            - generic [ref=f1e586]: r
            - generic [ref=f1e587]: d
          - generic [ref=f1e589]:
            - generic [ref=f1e590]: o
            - generic [ref=f1e591]: "n"
          - generic [ref=f1e593]:
            - generic [ref=f1e594]: p
            - generic [ref=f1e595]: e
            - generic [ref=f1e596]: o
            - generic [ref=f1e597]: p
            - generic [ref=f1e598]: l
            - generic [ref=f1e599]: e
          - generic [ref=f1e601]:
            - generic [ref=f1e602]: j
            - generic [ref=f1e603]: u
            - generic [ref=f1e604]: m
            - generic [ref=f1e605]: p
          - generic [ref=f1e607]:
            - generic [ref=f1e608]: "n"
            - generic [ref=f1e609]: o
            - generic [ref=f1e610]: t
            - generic [ref=f1e611]: i
            - generic [ref=f1e612]: o
            - generic [ref=f1e613]: "n"
          - generic [ref=f1e615]:
            - generic [ref=f1e616]: r
            - generic [ref=f1e617]: u
            - generic [ref=f1e618]: "n"
          - generic [ref=f1e620]:
            - generic [ref=f1e621]: s
            - generic [ref=f1e622]: o
            - generic [ref=f1e623]: o
            - generic [ref=f1e624]: t
          - generic [ref=f1e626]:
            - generic [ref=f1e627]: "n"
            - generic [ref=f1e628]: e
            - generic [ref=f1e629]: o
            - generic [ref=f1e630]: "n"
          - generic [ref=f1e632]:
            - generic [ref=f1e633]: h
            - generic [ref=f1e634]: e
          - generic [ref=f1e636]:
            - generic [ref=f1e637]: s
            - generic [ref=f1e638]: o
            - generic [ref=f1e639]: u
            - generic [ref=f1e640]: "n"
            - generic [ref=f1e641]: d
          - generic [ref=f1e643]:
            - generic [ref=f1e644]: "n"
            - generic [ref=f1e645]: e
            - generic [ref=f1e646]: x
            - generic [ref=f1e647]: t
          - generic [ref=f1e649]:
            - generic [ref=f1e650]: p
            - generic [ref=f1e651]: l
            - generic [ref=f1e652]: a
            - generic [ref=f1e653]: c
            - generic [ref=f1e654]: e
          - generic [ref=f1e656]:
            - generic [ref=f1e657]: o
            - generic [ref=f1e658]: "n"
          - generic [ref=f1e660]:
            - generic [ref=f1e661]: p
            - generic [ref=f1e662]: o
            - generic [ref=f1e663]: i
            - generic [ref=f1e664]: "n"
            - generic [ref=f1e665]: t
          - generic [ref=f1e667]:
            - generic [ref=f1e668]: l
            - generic [ref=f1e669]: o
            - generic [ref=f1e670]: v
            - generic [ref=f1e671]: e
          - generic [ref=f1e673]:
            - generic [ref=f1e674]: s
            - generic [ref=f1e675]: i
            - generic [ref=f1e676]: l
            - generic [ref=f1e677]: v
            - generic [ref=f1e678]: e
            - generic [ref=f1e679]: r
          - generic [ref=f1e681]:
            - generic [ref=f1e682]: r
            - generic [ref=f1e683]: e
            - generic [ref=f1e684]: "n"
            - generic [ref=f1e685]: t
          - generic [ref=f1e687]:
            - generic [ref=f1e688]: h
            - generic [ref=f1e689]: i
            - generic [ref=f1e690]: s
          - generic [ref=f1e692]:
            - generic [ref=f1e693]: m
            - generic [ref=f1e694]: u
            - generic [ref=f1e695]: s
            - generic [ref=f1e696]: t
          - generic [ref=f1e698]:
            - generic [ref=f1e699]: s
            - generic [ref=f1e700]: k
            - generic [ref=f1e701]: "y"
          - generic [ref=f1e703]:
            - generic [ref=f1e704]: "y"
            - generic [ref=f1e705]: e
            - generic [ref=f1e706]: a
            - generic [ref=f1e707]: r
          - generic [ref=f1e709]:
            - generic [ref=f1e710]: t
            - generic [ref=f1e711]: i
            - generic [ref=f1e712]: r
            - generic [ref=f1e713]: e
          - generic [ref=f1e715]:
            - generic [ref=f1e716]: l
            - generic [ref=f1e717]: e
            - generic [ref=f1e718]: t
            - generic [ref=f1e719]: t
            - generic [ref=f1e720]: e
            - generic [ref=f1e721]: r
          - generic [ref=f1e723]:
            - generic [ref=f1e724]: "n"
            - generic [ref=f1e725]: e
            - generic [ref=f1e726]: s
            - generic [ref=f1e727]: t
          - generic [ref=f1e729]:
            - generic [ref=f1e730]: f
            - generic [ref=f1e731]: i
            - generic [ref=f1e732]: r
            - generic [ref=f1e733]: s
            - generic [ref=f1e734]: t
          - generic [ref=f1e736]:
            - generic [ref=f1e737]: r
            - generic [ref=f1e738]: e
            - generic [ref=f1e739]: d
          - generic [ref=f1e741]:
            - generic [ref=f1e742]: a
            - generic [ref=f1e743]: "n"
            - generic [ref=f1e744]: t
          - generic [ref=f1e746]:
            - generic [ref=f1e747]: c
            - generic [ref=f1e748]: l
            - generic [ref=f1e749]: o
            - generic [ref=f1e750]: s
            - generic [ref=f1e751]: e
          - generic [ref=f1e753]:
            - generic [ref=f1e754]: s
            - generic [ref=f1e755]: o
            - generic [ref=f1e756]: r
            - generic [ref=f1e757]: e
          - generic [ref=f1e759]:
            - generic [ref=f1e760]: b
            - generic [ref=f1e761]: r
            - generic [ref=f1e762]: i
            - generic [ref=f1e763]: g
            - generic [ref=f1e764]: h
            - generic [ref=f1e765]: t
          - generic [ref=f1e767]:
            - generic [ref=f1e768]: t
            - generic [ref=f1e769]: h
            - generic [ref=f1e770]: e
            - generic [ref=f1e771]: r
            - generic [ref=f1e772]: e
          - generic [ref=f1e774]:
            - generic [ref=f1e775]: l
            - generic [ref=f1e776]: a
            - generic [ref=f1e777]: k
            - generic [ref=f1e778]: e
          - generic [ref=f1e780]:
            - generic [ref=f1e781]: t
            - generic [ref=f1e782]: o
            - generic [ref=f1e783]: p
          - generic [ref=f1e785]:
            - generic [ref=f1e786]: w
            - generic [ref=f1e787]: h
            - generic [ref=f1e788]: "y"
          - generic [ref=f1e790]:
            - generic [ref=f1e791]: h
            - generic [ref=f1e792]: o
            - generic [ref=f1e793]: w
          - generic [ref=f1e795]:
            - generic [ref=f1e796]: t
            - generic [ref=f1e797]: h
            - generic [ref=f1e798]: e
            - generic [ref=f1e799]: i
            - generic [ref=f1e800]: r
          - generic [ref=f1e802]:
            - generic [ref=f1e803]: f
            - generic [ref=f1e804]: a
            - generic [ref=f1e805]: r
          - generic [ref=f1e807]:
            - generic [ref=f1e808]: "n"
            - generic [ref=f1e809]: e
            - generic [ref=f1e810]: o
            - generic [ref=f1e811]: "n"
          - generic [ref=f1e813]:
            - generic [ref=f1e814]: m
            - generic [ref=f1e815]: u
            - generic [ref=f1e816]: s
            - generic [ref=f1e817]: t
          - generic [ref=f1e819]:
            - generic [ref=f1e820]: c
            - generic [ref=f1e821]: a
            - generic [ref=f1e822]: "n"
          - generic [ref=f1e824]:
            - generic [ref=f1e825]: s
            - generic [ref=f1e826]: "n"
            - generic [ref=f1e827]: o
            - generic [ref=f1e828]: w
          - generic [ref=f1e830]:
            - generic [ref=f1e831]: s
            - generic [ref=f1e832]: e
            - generic [ref=f1e833]: e
            - generic [ref=f1e834]: "n"
          - generic [ref=f1e836]:
            - generic [ref=f1e837]: g
            - generic [ref=f1e838]: l
            - generic [ref=f1e839]: a
            - generic [ref=f1e840]: s
            - generic [ref=f1e841]: s
          - generic [ref=f1e843]:
            - generic [ref=f1e844]: r
            - generic [ref=f1e845]: a
            - generic [ref=f1e846]: i
            - generic [ref=f1e847]: "n"
        - paragraph [ref=f1e848]: "Practice passage: yellow step save water path say their true only out well tier nice turn please glass code then door head love at clean cold page care side rain want door sort people east focus foot much though tan a feel space large tell low rain she soot book note with town seat calm under top still keep poem happy tea yet air form tier know nest dark new five tear rest house tent arise she grand hard on people jump notion run soot neon he sound next place on point love silver rent his must sky year tire letter nest first red ant close sore bright there lake top why how their far neon must can snow seen glass rain"
        - textbox "Typing input" [active] [ref=f1e849]
      - generic [ref=f1e851]:
        - paragraph [ref=f1e852]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=f1e853]
      - generic [ref=f1e854]:
        - paragraph [ref=f1e855]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=f1e856]:
          - button "Restart with new text" [ref=f1e857]
          - button "Show accessible text editor" [ref=f1e861]
          - button "Finish" [disabled] [ref=f1e865]
      - status [ref=f1e868]: Ready to type
  - contentinfo [ref=f1e869]:
    - generic [ref=f1e870]:
      - generic [ref=f1e871]:
        - generic [ref=f1e872]:
          - generic [ref=f1e873]: Sparow
          - generic [ref=f1e874]: Type
        - text: Find your rhythm.
      - generic [ref=f1e875]:
        - link "About & metrics" [ref=f1e876] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=f1e877] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=f1e878] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=f1e879] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=f1e880] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=f1e881] [cursor=pointer]:
          - /url: /offline
        - generic [ref=f1e882]: SparowType © 2026
```

# Test source

```ts
  15  |   sent: WorkerReceipt[];
  16  |   received: WorkerReceipt[];
  17  |   terminated: number;
  18  | }
  19  | type AuditedWindow = Window & {
  20  |   openingWorkerAudit?: { records: WorkerRecord[]; workers: Worker[] };
  21  | };
  22  | const workerEntry = /\/keyboard-render[.-]worker[^/]*\.(?:js|ts)(?:\?.*)?$/;
  23  | 
  24  | async function observeNativeWorker(page: Page, info: TestInfo) {
  25  |   const supported = await page.evaluate(
  26  |     () =>
  27  |       typeof Worker === "function" &&
  28  |       typeof OffscreenCanvas === "function" &&
  29  |       typeof HTMLCanvasElement.prototype.transferControlToOffscreen ===
  30  |         "function",
  31  |   );
  32  |   test.skip(
  33  |     !supported,
  34  |     "UNVERIFIED: this runner has no native transferable-canvas worker API. Document fallback is covered independently.",
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
> 115 |     .toBe(true);
      |      ^ Error: expect(received).toBe(expected) // Object.is equality
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
  135 |     expect(record.received.some((receipt) => receipt.type === "disposed")).toBe(
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
```