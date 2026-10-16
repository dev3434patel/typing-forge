# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: font-readiness.spec.ts >> 320px route sequence records exact font loads and visible text families
- Location: audit\keyboard-awakens-2026-10-16\font-diagnostic\font-readiness.spec.ts:299:1

# Error details

```
Error: Required layout fonts did not become ready: {"status":"loaded","faces":[{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+460-52f, U+1c80-1c8a, U+20b4, U+2de0-2dff, U+a640-a69f, U+fe2e-fe2f"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+301, U+400-45f, U+490-491, U+4b0-4b1, U+2116"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+1f00-1fff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+370-377, U+37a-37f, U+384-38a, U+38c, U+38e-3a1, U+3a3-3ff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+102-103, U+110-111, U+128-129, U+168-169, U+1a0-1a1, U+1af-1b0, U+300-301, U+303-304, U+308-309, U+323, U+329, U+1ea0-1ef9, U+20ab"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+460-52f, U+1c80-1c8a, U+20b4, U+2de0-2dff, U+a640-a69f, U+fe2e-fe2f"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+301, U+400-45f, U+490-491, U+4b0-4b1, U+2116"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+370-377, U+37a-37f, U+384-38a, U+38c, U+38e-3a1, U+3a3-3ff"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+102-103, U+110-111, U+128-129, U+168-169, U+1a0-1a1, U+1af-1b0, U+300-301, U+303-304, U+308-309, U+323, U+329, U+1ea0-1ef9, U+20ab"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"Sora","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"Sora","status":"unloaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"Inter Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"},{"family":"Inter Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"},{"family":"Sora Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"}]}. Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
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
        - generic [ref=e8]:
          - generic [ref=e9]: Sparow
          - generic [ref=e10]: Type
      - generic [ref=e11]:
        - button "Switch to light theme" [ref=e12]
        - link "Settings" [ref=e19]:
          - /url: /settings
        - link "Sign in" [ref=e23]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e27]:
      - link "Test" [ref=e28]:
        - /url: /
      - link "Learn" [ref=e31]:
        - /url: /learn
      - link "Race" [ref=e35]:
        - /url: /race
      - link "Stats" [ref=e45]:
        - /url: /stats
      - link "Rankings" [ref=e48]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e55]:
        - /url: /keyboard-lab
  - main [ref=e58]:
    - heading "Typing practice" [level=1] [ref=e59]
    - region "Test configuration" [ref=e60]:
      - generic [ref=e61]:
        - group "Test mode" [ref=e62]:
          - button "Time" [pressed] [ref=e63]
          - button "Words" [ref=e67]
          - button "Quote" [ref=e70]
          - button "Code" [ref=e74]
          - button "Custom" [ref=e79]
          - button "Zen" [ref=e83]
        - group "Test duration" [ref=e86]:
          - button "15 seconds" [ref=e87]:
            - text: "15"
            - generic [ref=e88]: seconds
          - button "30 seconds" [pressed] [ref=e89]:
            - text: "30"
            - generic [ref=e90]: seconds
          - button "60 seconds" [ref=e91]:
            - text: "60"
            - generic [ref=e92]: seconds
          - button "120 seconds" [ref=e93]:
            - text: "120"
            - generic [ref=e94]: seconds
      - generic [ref=e95]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e96]:
          - checkbox "Precision mode · stop on errors" [ref=e97]
          - text: Precision mode · stop on errors
        - generic [ref=e98]:
          - text: Language
          - combobox "Language" [ref=e99]:
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
        - button "punctuation" [ref=e100]
        - button "# numbers" [ref=e102]
    - region "Typing session" [ref=e103]:
      - generic [ref=e105]:
        - generic [ref=e106]:
          - generic [ref=e107]: 30s
          - generic [ref=e108]: remaining
        - generic [ref=e109]: —wpm
      - generic [ref=e111]:
        - generic [ref=e113]:
          - generic [ref=e114]:
            - generic [ref=e115]: g
            - generic [ref=e116]: r
            - generic [ref=e117]: e
            - generic [ref=e118]: e
            - generic [ref=e119]: "n"
          - generic [ref=e121]:
            - generic [ref=e122]: k
            - generic [ref=e123]: e
            - generic [ref=e124]: "y"
          - generic [ref=e126]:
            - generic [ref=e127]: s
            - generic [ref=e128]: t
            - generic [ref=e129]: o
            - generic [ref=e130]: p
          - generic [ref=e132]:
            - generic [ref=e133]: c
            - generic [ref=e134]: a
            - generic [ref=e135]: l
            - generic [ref=e136]: m
          - generic [ref=e138]:
            - generic [ref=e139]: f
            - generic [ref=e140]: a
            - generic [ref=e141]: i
            - generic [ref=e142]: r
          - generic [ref=e144]:
            - generic [ref=e145]: s
            - generic [ref=e146]: i
            - generic [ref=e147]: x
          - generic [ref=e149]:
            - generic [ref=e150]: l
            - generic [ref=e151]: i
            - generic [ref=e152]: f
            - generic [ref=e153]: e
          - generic [ref=e155]:
            - generic [ref=e156]: s
            - generic [ref=e157]: t
            - generic [ref=e158]: a
            - generic [ref=e159]: t
            - generic [ref=e160]: e
          - generic [ref=e162]:
            - generic [ref=e163]: s
            - generic [ref=e164]: p
            - generic [ref=e165]: e
            - generic [ref=e166]: e
            - generic [ref=e167]: d
          - generic [ref=e169]:
            - generic [ref=e170]: e
            - generic [ref=e171]: a
            - generic [ref=e172]: s
            - generic [ref=e173]: t
          - generic [ref=e175]:
            - generic [ref=e176]: f
            - generic [ref=e177]: o
            - generic [ref=e178]: c
            - generic [ref=e179]: u
            - generic [ref=e180]: s
          - generic [ref=e182]:
            - generic [ref=e183]: t
            - generic [ref=e184]: r
            - generic [ref=e185]: "y"
          - generic [ref=e187]:
            - generic [ref=e188]: h
            - generic [ref=e189]: o
            - generic [ref=e190]: u
            - generic [ref=e191]: s
            - generic [ref=e192]: e
          - generic [ref=e194]:
            - generic [ref=e195]: "y"
            - generic [ref=e196]: e
            - generic [ref=e197]: s
          - generic [ref=e199]:
            - generic [ref=e200]: s
            - generic [ref=e201]: a
            - generic [ref=e202]: "y"
          - generic [ref=e204]:
            - generic [ref=e205]: s
            - generic [ref=e206]: p
            - generic [ref=e207]: a
            - generic [ref=e208]: c
            - generic [ref=e209]: e
          - generic [ref=e211]:
            - generic [ref=e212]: o
            - generic [ref=e213]: "n"
            - generic [ref=e214]: e
          - generic [ref=e216]:
            - generic [ref=e217]: s
            - generic [ref=e218]: t
            - generic [ref=e219]: r
            - generic [ref=e220]: o
            - generic [ref=e221]: "n"
            - generic [ref=e222]: g
          - generic [ref=e224]:
            - generic [ref=e225]: t
            - generic [ref=e226]: h
            - generic [ref=e227]: e
            - generic [ref=e228]: s
            - generic [ref=e229]: e
          - generic [ref=e231]:
            - generic [ref=e232]: r
            - generic [ref=e233]: e
            - generic [ref=e234]: a
            - generic [ref=e235]: d
            - generic [ref=e236]: "y"
          - generic [ref=e238]:
            - generic [ref=e239]: a
            - generic [ref=e240]: s
          - generic [ref=e242]:
            - generic [ref=e243]: v
            - generic [ref=e244]: o
            - generic [ref=e245]: i
            - generic [ref=e246]: c
            - generic [ref=e247]: e
          - generic [ref=e249]:
            - generic [ref=e250]: l
            - generic [ref=e251]: o
            - generic [ref=e252]: w
          - generic [ref=e254]:
            - generic [ref=e255]: w
            - generic [ref=e256]: h
            - generic [ref=e257]: "y"
          - generic [ref=e259]:
            - generic [ref=e260]: "n"
            - generic [ref=e261]: o
            - generic [ref=e262]: t
            - generic [ref=e263]: i
            - generic [ref=e264]: o
            - generic [ref=e265]: "n"
          - generic [ref=e267]:
            - generic [ref=e268]: l
            - generic [ref=e269]: i
            - generic [ref=e270]: t
            - generic [ref=e271]: t
            - generic [ref=e272]: l
            - generic [ref=e273]: e
          - generic [ref=e275]:
            - generic [ref=e276]: g
            - generic [ref=e277]: a
            - generic [ref=e278]: m
            - generic [ref=e279]: e
          - generic [ref=e281]:
            - generic [ref=e282]: q
            - generic [ref=e283]: u
            - generic [ref=e284]: e
            - generic [ref=e285]: e
            - generic [ref=e286]: "n"
          - generic [ref=e288]:
            - generic [ref=e289]: l
            - generic [ref=e290]: a
            - generic [ref=e291]: r
            - generic [ref=e292]: g
            - generic [ref=e293]: e
          - generic [ref=e295]:
            - generic [ref=e296]: r
            - generic [ref=e297]: o
            - generic [ref=e298]: o
            - generic [ref=e299]: t
          - generic [ref=e301]:
            - generic [ref=e302]: w
            - generic [ref=e303]: a
            - generic [ref=e304]: "y"
          - generic [ref=e306]:
            - generic [ref=e307]: t
            - generic [ref=e308]: h
            - generic [ref=e309]: a
            - generic [ref=e310]: t
          - generic [ref=e312]:
            - generic [ref=e313]: b
            - generic [ref=e314]: r
            - generic [ref=e315]: o
            - generic [ref=e316]: w
            - generic [ref=e317]: "n"
          - generic [ref=e319]:
            - generic [ref=e320]: b
            - generic [ref=e321]: l
            - generic [ref=e322]: a
            - generic [ref=e323]: c
            - generic [ref=e324]: k
          - generic [ref=e326]:
            - generic [ref=e327]: r
            - generic [ref=e328]: e
            - generic [ref=e329]: s
            - generic [ref=e330]: t
          - generic [ref=e332]:
            - generic [ref=e333]: e
            - generic [ref=e334]: a
            - generic [ref=e335]: r
            - generic [ref=e336]: "n"
          - generic [ref=e338]:
            - generic [ref=e339]: w
            - generic [ref=e340]: i
            - generic [ref=e341]: s
            - generic [ref=e342]: h
          - generic [ref=e344]:
            - generic [ref=e345]: "y"
            - generic [ref=e346]: e
            - generic [ref=e347]: t
          - generic [ref=e349]:
            - generic [ref=e350]: p
            - generic [ref=e351]: o
            - generic [ref=e352]: w
            - generic [ref=e353]: e
            - generic [ref=e354]: r
          - generic [ref=e356]:
            - generic [ref=e357]: c
            - generic [ref=e358]: a
            - generic [ref=e359]: l
            - generic [ref=e360]: m
          - generic [ref=e362]:
            - generic [ref=e363]: o
            - generic [ref=e364]: "n"
            - generic [ref=e365]: e
          - generic [ref=e367]:
            - generic [ref=e368]: g
            - generic [ref=e369]: r
            - generic [ref=e370]: o
            - generic [ref=e371]: u
            - generic [ref=e372]: "n"
            - generic [ref=e373]: d
          - generic [ref=e375]:
            - generic [ref=e376]: k
            - generic [ref=e377]: "n"
            - generic [ref=e378]: o
            - generic [ref=e379]: w
          - generic [ref=e381]:
            - generic [ref=e382]: d
            - generic [ref=e383]: r
            - generic [ref=e384]: a
            - generic [ref=e385]: w
          - generic [ref=e387]:
            - generic [ref=e388]: o
            - generic [ref=e389]: r
          - generic [ref=e391]:
            - generic [ref=e392]: s
            - generic [ref=e393]: a
            - generic [ref=e394]: "n"
            - generic [ref=e395]: e
          - generic [ref=e397]:
            - generic [ref=e398]: w
            - generic [ref=e399]: o
            - generic [ref=e400]: m
            - generic [ref=e401]: a
            - generic [ref=e402]: "n"
          - generic [ref=e404]:
            - generic [ref=e405]: b
            - generic [ref=e406]: o
            - generic [ref=e407]: o
            - generic [ref=e408]: k
          - generic [ref=e410]:
            - generic [ref=e411]: w
            - generic [ref=e412]: a
            - generic [ref=e413]: "y"
          - generic [ref=e415]:
            - generic [ref=e416]: s
            - generic [ref=e417]: t
            - generic [ref=e418]: a
            - generic [ref=e419]: r
            - generic [ref=e420]: e
          - generic [ref=e422]:
            - generic [ref=e423]: p
            - generic [ref=e424]: l
            - generic [ref=e425]: a
            - generic [ref=e426]: i
            - generic [ref=e427]: "n"
          - generic [ref=e429]:
            - generic [ref=e430]: s
            - generic [ref=e431]: o
            - generic [ref=e432]: f
            - generic [ref=e433]: t
          - generic [ref=e435]:
            - generic [ref=e436]: s
            - generic [ref=e437]: o
            - generic [ref=e438]: u
            - generic [ref=e439]: "n"
            - generic [ref=e440]: d
          - generic [ref=e442]:
            - generic [ref=e443]: v
            - generic [ref=e444]: i
            - generic [ref=e445]: e
            - generic [ref=e446]: w
          - generic [ref=e448]:
            - generic [ref=e449]: s
            - generic [ref=e450]: o
          - generic [ref=e452]:
            - generic [ref=e453]: d
            - generic [ref=e454]: r
            - generic [ref=e455]: e
            - generic [ref=e456]: a
            - generic [ref=e457]: m
          - generic [ref=e459]:
            - generic [ref=e460]: t
            - generic [ref=e461]: w
            - generic [ref=e462]: o
          - generic [ref=e464]:
            - generic [ref=e465]: l
            - generic [ref=e466]: e
            - generic [ref=e467]: f
            - generic [ref=e468]: t
          - generic [ref=e470]:
            - generic [ref=e471]: t
            - generic [ref=e472]: e
            - generic [ref=e473]: a
            - generic [ref=e474]: m
          - generic [ref=e476]:
            - generic [ref=e477]: j
            - generic [ref=e478]: o
            - generic [ref=e479]: k
            - generic [ref=e480]: e
          - generic [ref=e482]:
            - generic [ref=e483]: s
            - generic [ref=e484]: o
            - generic [ref=e485]: m
            - generic [ref=e486]: e
          - generic [ref=e488]:
            - generic [ref=e489]: "n"
            - generic [ref=e490]: o
            - generic [ref=e491]: t
            - generic [ref=e492]: e
          - generic [ref=e494]:
            - generic [ref=e495]: "y"
            - generic [ref=e496]: e
            - generic [ref=e497]: t
          - generic [ref=e499]:
            - generic [ref=e500]: s
            - generic [ref=e501]: e
            - generic [ref=e502]: a
          - generic [ref=e504]:
            - generic [ref=e505]: t
            - generic [ref=e506]: h
            - generic [ref=e507]: a
            - generic [ref=e508]: "n"
            - generic [ref=e509]: k
          - generic [ref=e511]:
            - generic [ref=e512]: p
            - generic [ref=e513]: l
            - generic [ref=e514]: a
            - generic [ref=e515]: "n"
          - generic [ref=e517]:
            - generic [ref=e518]: s
            - generic [ref=e519]: h
            - generic [ref=e520]: e
          - generic [ref=e522]:
            - generic [ref=e523]: "n"
            - generic [ref=e524]: o
            - generic [ref=e525]: r
            - generic [ref=e526]: t
            - generic [ref=e527]: h
          - generic [ref=e529]:
            - generic [ref=e530]: s
            - generic [ref=e531]: o
            - generic [ref=e532]: o
            - generic [ref=e533]: t
          - generic [ref=e535]:
            - generic [ref=e536]: m
            - generic [ref=e537]: a
            - generic [ref=e538]: k
            - generic [ref=e539]: e
          - generic [ref=e541]:
            - generic [ref=e542]: w
            - generic [ref=e543]: h
            - generic [ref=e544]: e
            - generic [ref=e545]: "n"
          - generic [ref=e547]:
            - generic [ref=e548]: c
            - generic [ref=e549]: o
            - generic [ref=e550]: m
            - generic [ref=e551]: e
          - generic [ref=e553]:
            - generic [ref=e554]: s
            - generic [ref=e555]: k
            - generic [ref=e556]: "y"
          - generic [ref=e558]:
            - generic [ref=e559]: w
            - generic [ref=e560]: a
            - generic [ref=e561]: l
            - generic [ref=e562]: k
          - generic [ref=e564]:
            - generic [ref=e565]: p
            - generic [ref=e566]: l
            - generic [ref=e567]: a
            - generic [ref=e568]: c
            - generic [ref=e569]: e
          - generic [ref=e571]:
            - generic [ref=e572]: g
            - generic [ref=e573]: r
            - generic [ref=e574]: a
            - generic [ref=e575]: "n"
            - generic [ref=e576]: d
          - generic [ref=e578]:
            - generic [ref=e579]: f
            - generic [ref=e580]: a
            - generic [ref=e581]: s
            - generic [ref=e582]: t
          - generic [ref=e584]:
            - generic [ref=e585]: "n"
            - generic [ref=e586]: e
            - generic [ref=e587]: s
            - generic [ref=e588]: t
          - generic [ref=e590]:
            - generic [ref=e591]: f
            - generic [ref=e592]: a
            - generic [ref=e593]: i
            - generic [ref=e594]: r
          - generic [ref=e596]:
            - generic [ref=e597]: s
            - generic [ref=e598]: m
            - generic [ref=e599]: a
            - generic [ref=e600]: l
            - generic [ref=e601]: l
          - generic [ref=e603]:
            - generic [ref=e604]: p
            - generic [ref=e605]: i
            - generic [ref=e606]: "n"
            - generic [ref=e607]: k
          - generic [ref=e609]:
            - generic [ref=e610]: w
            - generic [ref=e611]: h
            - generic [ref=e612]: e
            - generic [ref=e613]: r
            - generic [ref=e614]: e
          - generic [ref=e616]:
            - generic [ref=e617]: w
            - generic [ref=e618]: e
            - generic [ref=e619]: s
            - generic [ref=e620]: t
          - generic [ref=e622]:
            - generic [ref=e623]: "n"
            - generic [ref=e624]: e
            - generic [ref=e625]: a
            - generic [ref=e626]: r
          - generic [ref=e628]:
            - generic [ref=e629]: p
            - generic [ref=e630]: l
            - generic [ref=e631]: a
            - generic [ref=e632]: "n"
          - generic [ref=e634]:
            - generic [ref=e635]: o
            - generic [ref=e636]: f
            - generic [ref=e637]: t
            - generic [ref=e638]: e
            - generic [ref=e639]: "n"
          - generic [ref=e641]:
            - generic [ref=e642]: c
            - generic [ref=e643]: o
            - generic [ref=e644]: m
            - generic [ref=e645]: e
          - generic [ref=e647]:
            - generic [ref=e648]: s
            - generic [ref=e649]: o
            - generic [ref=e650]: u
            - generic [ref=e651]: t
            - generic [ref=e652]: h
          - generic [ref=e654]:
            - generic [ref=e655]: s
            - generic [ref=e656]: a
            - generic [ref=e657]: "n"
            - generic [ref=e658]: e
          - generic [ref=e660]:
            - generic [ref=e661]: c
            - generic [ref=e662]: a
            - generic [ref=e663]: l
            - generic [ref=e664]: m
          - generic [ref=e666]:
            - generic [ref=e667]: f
            - generic [ref=e668]: i
            - generic [ref=e669]: r
            - generic [ref=e670]: e
          - generic [ref=e672]:
            - generic [ref=e673]: s
            - generic [ref=e674]: h
            - generic [ref=e675]: e
          - generic [ref=e677]:
            - generic [ref=e678]: o
            - generic [ref=e679]: "n"
            - generic [ref=e680]: i
            - generic [ref=e681]: o
            - generic [ref=e682]: "n"
          - generic [ref=e684]:
            - generic [ref=e685]: p
            - generic [ref=e686]: l
            - generic [ref=e687]: e
            - generic [ref=e688]: a
            - generic [ref=e689]: s
            - generic [ref=e690]: e
          - generic [ref=e692]:
            - generic [ref=e693]: d
            - generic [ref=e694]: e
            - generic [ref=e695]: e
            - generic [ref=e696]: p
          - generic [ref=e698]:
            - generic [ref=e699]: s
            - generic [ref=e700]: o
          - generic [ref=e702]:
            - generic [ref=e703]: k
            - generic [ref=e704]: e
            - generic [ref=e705]: e
            - generic [ref=e706]: "n"
          - generic [ref=e708]:
            - generic [ref=e709]: e
            - generic [ref=e710]: a
            - generic [ref=e711]: s
            - generic [ref=e712]: e
          - generic [ref=e714]:
            - generic [ref=e715]: s
            - generic [ref=e716]: h
            - generic [ref=e717]: o
            - generic [ref=e718]: w
          - generic [ref=e720]:
            - generic [ref=e721]: t
            - generic [ref=e722]: a
            - generic [ref=e723]: "n"
          - generic [ref=e725]:
            - generic [ref=e726]: t
            - generic [ref=e727]: w
            - generic [ref=e728]: o
          - generic [ref=e730]:
            - generic [ref=e731]: r
            - generic [ref=e732]: e
            - generic [ref=e733]: a
            - generic [ref=e734]: d
            - generic [ref=e735]: "y"
          - generic [ref=e737]:
            - generic [ref=e738]: u
            - generic [ref=e739]: s
          - generic [ref=e741]:
            - generic [ref=e742]: s
            - generic [ref=e743]: i
            - generic [ref=e744]: x
          - generic [ref=e746]:
            - generic [ref=e747]: "n"
            - generic [ref=e748]: o
            - generic [ref=e749]: t
            - generic [ref=e750]: i
            - generic [ref=e751]: o
            - generic [ref=e752]: "n"
          - generic [ref=e754]:
            - generic [ref=e755]: r
            - generic [ref=e756]: i
            - generic [ref=e757]: o
            - generic [ref=e758]: t
          - generic [ref=e760]:
            - generic [ref=e761]: s
            - generic [ref=e762]: o
            - generic [ref=e763]: o
            - generic [ref=e764]: t
          - generic [ref=e766]:
            - generic [ref=e767]: t
            - generic [ref=e768]: w
            - generic [ref=e769]: o
          - generic [ref=e771]:
            - generic [ref=e772]: "n"
            - generic [ref=e773]: e
            - generic [ref=e774]: a
            - generic [ref=e775]: r
          - generic [ref=e777]:
            - generic [ref=e778]: t
            - generic [ref=e779]: h
            - generic [ref=e780]: a
            - generic [ref=e781]: "n"
            - generic [ref=e782]: k
          - generic [ref=e784]:
            - generic [ref=e785]: z
            - generic [ref=e786]: o
            - generic [ref=e787]: "n"
            - generic [ref=e788]: e
          - generic [ref=e790]:
            - generic [ref=e791]: f
            - generic [ref=e792]: o
            - generic [ref=e793]: r
          - generic [ref=e795]:
            - generic [ref=e796]: t
            - generic [ref=e797]: o
            - generic [ref=e798]: g
            - generic [ref=e799]: e
            - generic [ref=e800]: t
            - generic [ref=e801]: h
            - generic [ref=e802]: e
            - generic [ref=e803]: r
          - generic [ref=e805]:
            - generic [ref=e806]: j
            - generic [ref=e807]: u
            - generic [ref=e808]: m
            - generic [ref=e809]: p
          - generic [ref=e811]:
            - generic [ref=e812]: k
            - generic [ref=e813]: e
            - generic [ref=e814]: e
            - generic [ref=e815]: "n"
          - generic [ref=e817]:
            - generic [ref=e818]: l
            - generic [ref=e819]: e
            - generic [ref=e820]: a
            - generic [ref=e821]: "n"
          - generic [ref=e823]:
            - generic [ref=e824]: a
            - generic [ref=e825]: t
            - generic [ref=e826]: t
            - generic [ref=e827]: e
            - generic [ref=e828]: "n"
            - generic [ref=e829]: t
            - generic [ref=e830]: i
            - generic [ref=e831]: o
            - generic [ref=e832]: "n"
          - generic [ref=e834]:
            - generic [ref=e835]: t
            - generic [ref=e836]: e
            - generic [ref=e837]: r
            - generic [ref=e838]: r
            - generic [ref=e839]: a
            - generic [ref=e840]: i
            - generic [ref=e841]: "n"
          - generic [ref=e843]:
            - generic [ref=e844]: a
            - generic [ref=e845]: "n"
          - generic [ref=e847]:
            - generic [ref=e848]: "n"
            - generic [ref=e849]: o
            - generic [ref=e850]: t
            - generic [ref=e851]: i
            - generic [ref=e852]: o
            - generic [ref=e853]: "n"
        - paragraph [ref=e854]: "Practice passage: green key stop calm fair six life state speed east focus try house yes say space one strong these ready as voice low why notion little game queen large root way that brown black rest earn wish yet power calm one ground know draw or sane woman book way stare plain soft sound view so dream two left team joke some note yet sea thank plan she north soot make when come sky walk place grand fast nest fair small pink where west near plan often come south sane calm fire she onion please deep so keen ease show tan two ready us six notion riot soot two near thank zone for together jump keen lean attention terrain an notion"
        - textbox "Typing input" [active] [ref=e855]
      - generic [ref=e857]:
        - paragraph [ref=e858]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e859]
      - generic [ref=e860]:
        - paragraph [ref=e861]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e862]:
          - button "Restart with new text" [ref=e863]
          - button "Show accessible text editor" [ref=e867]
          - button "Finish" [disabled] [ref=e871]
      - status [ref=e874]: Ready to type
  - contentinfo [ref=e875]:
    - generic [ref=e876]:
      - generic [ref=e877]:
        - generic [ref=e878]:
          - generic [ref=e879]: Sparow
          - generic [ref=e880]: Type
        - text: Find your rhythm.
      - generic [ref=e881]:
        - link "About & metrics" [ref=e882]:
          - /url: /about
        - link "Preferences & data" [ref=e883]:
          - /url: /settings
        - link "Touch typing guide" [ref=e884]:
          - /url: /touch-typing
        - link "Privacy" [ref=e885]:
          - /url: /privacy
        - link "Terms" [ref=e886]:
          - /url: /terms
        - link "Offline" [ref=e887]:
          - /url: /offline
        - generic [ref=e888]: SparowType © 2026
```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | 
  3  | const layoutFonts = [
  4  |   {
  5  |     family: "Inter Variable",
  6  |     font: '400 16px "Inter Variable"',
  7  |     text: "SparowType",
  8  |   },
  9  |   { family: "Sora", font: '600 24px "Sora"', text: "Guest workspace" },
  10 |   {
  11 |     family: "JetBrains Mono Variable",
  12 |     font: '400 26px "JetBrains Mono Variable"',
  13 |     text: "typing practice",
  14 |   },
  15 | ];
  16 | 
  17 | /** Wait for the actual layout faces, rather than unrelated fonts in FontFaceSet.status. */
  18 | export async function waitForLayoutFonts(page: Page) {
  19 |   await page.evaluate((requests) => {
  20 |     for (const request of requests)
  21 |       void document.fonts
  22 |         .load(request.font, request.text)
  23 |         .catch(() => undefined);
  24 |   }, layoutFonts);
  25 |   try {
  26 |     await expect
  27 |       .poll(
  28 |         () =>
  29 |           page.evaluate(
  30 |             (requests) =>
  31 |               requests.every(
  32 |                 (request) =>
  33 |                   document.fonts.check(request.font, request.text) &&
  34 |                   Array.from(document.fonts).some(
  35 |                     (face) =>
  36 |                       face.family.replace(/["']/g, "") === request.family &&
  37 |                       face.status === "loaded",
  38 |                   ),
  39 |               ),
  40 |             layoutFonts,
  41 |           ),
  42 |         { timeout: 10_000 },
  43 |       )
  44 |       .toBe(true);
  45 |   } catch (error) {
  46 |     const evidence = await page.evaluate(() => ({
  47 |       status: document.fonts.status,
  48 |       faces: Array.from(document.fonts).map((face) => ({
  49 |         family: face.family,
  50 |         status: face.status,
  51 |         unicodeRange: face.unicodeRange,
  52 |       })),
  53 |     }));
> 54 |     throw new Error(
     |           ^ Error: Required layout fonts did not become ready: {"status":"loaded","faces":[{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+460-52f, U+1c80-1c8a, U+20b4, U+2de0-2dff, U+a640-a69f, U+fe2e-fe2f"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+301, U+400-45f, U+490-491, U+4b0-4b1, U+2116"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+1f00-1fff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+370-377, U+37a-37f, U+384-38a, U+38c, U+38e-3a1, U+3a3-3ff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+102-103, U+110-111, U+128-129, U+168-169, U+1a0-1a1, U+1af-1b0, U+300-301, U+303-304, U+308-309, U+323, U+329, U+1ea0-1ef9, U+20ab"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+460-52f, U+1c80-1c8a, U+20b4, U+2de0-2dff, U+a640-a69f, U+fe2e-fe2f"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+301, U+400-45f, U+490-491, U+4b0-4b1, U+2116"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+370-377, U+37a-37f, U+384-38a, U+38c, U+38e-3a1, U+3a3-3ff"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+102-103, U+110-111, U+128-129, U+168-169, U+1a0-1a1, U+1af-1b0, U+300-301, U+303-304, U+308-309, U+323, U+329, U+1ea0-1ef9, U+20ab"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"Sora","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"Sora","status":"unloaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"Inter Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"},{"family":"Inter Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"},{"family":"Sora Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"}]}. Error: expect(received).toBe(expected) // Object.is equality
  55 |       `Required layout fonts did not become ready: ${JSON.stringify(evidence)}. ${String(error)}`,
  56 |     );
  57 |   }
  58 | }
  59 | 
```