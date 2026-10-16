# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> five consecutive live-worker reloads close each prior worker and final skip closes the last worker
- Location: e2e\opening-worker.spec.ts:295:1

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
- generic [ref=f4e4]:
  - banner [ref=f4e5]:
    - link "Skip to content" [ref=f4e6] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=f4e7]:
      - link "SparowType home" [ref=f4e8] [cursor=pointer]:
        - /url: /
        - generic [ref=f4e9]:
          - generic [ref=f4e10]: Sparow
          - generic [ref=f4e11]: Type
      - navigation "Main navigation" [ref=f4e12]:
        - link "Test" [ref=f4e13] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=f4e16] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=f4e20] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=f4e30] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=f4e33] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=f4e40] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=f4e43]:
        - button "Switch to light theme" [ref=f4e44]
        - button "Open command palette" [ref=f4e51]
        - link "Settings" [ref=f4e54] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=f4e58] [cursor=pointer]:
          - /url: /auth
  - main [ref=f4e63]:
    - heading "Typing practice" [level=1] [ref=f4e64]
    - region "Test configuration" [ref=f4e65]:
      - generic [ref=f4e66]:
        - group "Test mode" [ref=f4e67]:
          - button "Time" [pressed] [ref=f4e68]
          - button "Words" [ref=f4e72]
          - button "Quote" [ref=f4e75]
          - button "Code" [ref=f4e79]
          - button "Custom" [ref=f4e84]
          - button "Zen" [ref=f4e88]
        - group "Test duration" [ref=f4e91]:
          - button "15 seconds" [ref=f4e92]:
            - text: "15"
            - generic [ref=f4e93]: seconds
          - button "30 seconds" [pressed] [ref=f4e94]:
            - text: "30"
            - generic [ref=f4e95]: seconds
          - button "60 seconds" [ref=f4e96]:
            - text: "60"
            - generic [ref=f4e97]: seconds
          - button "120 seconds" [ref=f4e98]:
            - text: "120"
            - generic [ref=f4e99]: seconds
      - generic [ref=f4e100]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=f4e101]:
          - checkbox "Precision mode · stop on errors" [ref=f4e102]
          - text: Precision mode · stop on errors
        - generic [ref=f4e103]:
          - text: Language
          - combobox "Language" [ref=f4e104]:
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
        - button "punctuation" [ref=f4e106]
        - button "# numbers" [ref=f4e108]
    - region "Typing session" [ref=f4e109]:
      - generic [ref=f4e110]:
        - generic [ref=f4e111]:
          - generic [ref=f4e112]:
            - generic [ref=f4e113]: 30s
            - generic [ref=f4e114]: remaining
          - generic [ref=f4e115]: —wpm
          - generic [ref=f4e116]: —acc %
        - generic [ref=f4e117]: Ready when you are
      - generic [ref=f4e119]:
        - generic [ref=f4e121]:
          - generic [ref=f4e122]:
            - generic [ref=f4e123]: h
            - generic [ref=f4e124]: a
            - generic [ref=f4e125]: p
            - generic [ref=f4e126]: p
            - generic [ref=f4e127]: "y"
          - generic [ref=f4e129]:
            - generic [ref=f4e130]: i
            - generic [ref=f4e131]: "n"
          - generic [ref=f4e133]:
            - generic [ref=f4e134]: r
            - generic [ref=f4e135]: a
            - generic [ref=f4e136]: t
            - generic [ref=f4e137]: i
            - generic [ref=f4e138]: o
          - generic [ref=f4e140]:
            - generic [ref=f4e141]: o
            - generic [ref=f4e142]: f
            - generic [ref=f4e143]: f
          - generic [ref=f4e145]:
            - generic [ref=f4e146]: w
            - generic [ref=f4e147]: o
            - generic [ref=f4e148]: m
            - generic [ref=f4e149]: a
            - generic [ref=f4e150]: "n"
          - generic [ref=f4e152]:
            - generic [ref=f4e153]: s
            - generic [ref=f4e154]: e
            - generic [ref=f4e155]: e
          - generic [ref=f4e157]:
            - generic [ref=f4e158]: s
            - generic [ref=f4e159]: o
            - generic [ref=f4e160]: m
            - generic [ref=f4e161]: e
          - generic [ref=f4e163]:
            - generic [ref=f4e164]: s
            - generic [ref=f4e165]: p
            - generic [ref=f4e166]: e
            - generic [ref=f4e167]: a
            - generic [ref=f4e168]: k
          - generic [ref=f4e170]:
            - generic [ref=f4e171]: f
            - generic [ref=f4e172]: a
            - generic [ref=f4e173]: c
            - generic [ref=f4e174]: e
          - generic [ref=f4e176]:
            - generic [ref=f4e177]: l
            - generic [ref=f4e178]: e
            - generic [ref=f4e179]: a
            - generic [ref=f4e180]: r
            - generic [ref=f4e181]: "n"
          - generic [ref=f4e183]:
            - generic [ref=f4e184]: g
            - generic [ref=f4e185]: r
            - generic [ref=f4e186]: o
            - generic [ref=f4e187]: w
          - generic [ref=f4e189]:
            - generic [ref=f4e190]: s
            - generic [ref=f4e191]: a
            - generic [ref=f4e192]: i
            - generic [ref=f4e193]: d
          - generic [ref=f4e195]:
            - generic [ref=f4e196]: s
            - generic [ref=f4e197]: a
            - generic [ref=f4e198]: i
            - generic [ref=f4e199]: d
          - generic [ref=f4e201]:
            - generic [ref=f4e202]: m
            - generic [ref=f4e203]: o
            - generic [ref=f4e204]: r
            - generic [ref=f4e205]: e
          - generic [ref=f4e207]:
            - generic [ref=f4e208]: t
            - generic [ref=f4e209]: h
            - generic [ref=f4e210]: e
            - generic [ref=f4e211]: "n"
          - generic [ref=f4e213]:
            - generic [ref=f4e214]: s
            - generic [ref=f4e215]: o
            - generic [ref=f4e216]: r
            - generic [ref=f4e217]: t
          - generic [ref=f4e219]:
            - generic [ref=f4e220]: s
            - generic [ref=f4e221]: l
            - generic [ref=f4e222]: o
            - generic [ref=f4e223]: w
          - generic [ref=f4e225]:
            - generic [ref=f4e226]: p
            - generic [ref=f4e227]: l
            - generic [ref=f4e228]: a
            - generic [ref=f4e229]: c
            - generic [ref=f4e230]: e
          - generic [ref=f4e232]:
            - generic [ref=f4e233]: s
            - generic [ref=f4e234]: e
            - generic [ref=f4e235]: "n"
            - generic [ref=f4e236]: t
          - generic [ref=f4e238]:
            - generic [ref=f4e239]: s
            - generic [ref=f4e240]: t
            - generic [ref=f4e241]: a
            - generic [ref=f4e242]: r
            - generic [ref=f4e243]: e
          - generic [ref=f4e245]:
            - generic [ref=f4e246]: c
            - generic [ref=f4e247]: o
            - generic [ref=f4e248]: d
            - generic [ref=f4e249]: e
          - generic [ref=f4e251]:
            - generic [ref=f4e252]: s
            - generic [ref=f4e253]: p
            - generic [ref=f4e254]: e
            - generic [ref=f4e255]: e
            - generic [ref=f4e256]: d
          - generic [ref=f4e258]:
            - generic [ref=f4e259]: b
            - generic [ref=f4e260]: l
            - generic [ref=f4e261]: u
            - generic [ref=f4e262]: e
          - generic [ref=f4e264]:
            - generic [ref=f4e265]: d
            - generic [ref=f4e266]: o
            - generic [ref=f4e267]: o
            - generic [ref=f4e268]: r
          - generic [ref=f4e270]:
            - generic [ref=f4e271]: r
            - generic [ref=f4e272]: e
            - generic [ref=f4e273]: d
          - generic [ref=f4e275]:
            - generic [ref=f4e276]: v
            - generic [ref=f4e277]: i
            - generic [ref=f4e278]: e
            - generic [ref=f4e279]: w
          - generic [ref=f4e281]:
            - generic [ref=f4e282]: e
            - generic [ref=f4e283]: a
            - generic [ref=f4e284]: r
            - generic [ref=f4e285]: l
            - generic [ref=f4e286]: "y"
          - generic [ref=f4e288]:
            - generic [ref=f4e289]: e
            - generic [ref=f4e290]: a
            - generic [ref=f4e291]: r
            - generic [ref=f4e292]: l
            - generic [ref=f4e293]: "y"
          - generic [ref=f4e295]:
            - generic [ref=f4e296]: r
            - generic [ref=f4e297]: e
            - generic [ref=f4e298]: d
          - generic [ref=f4e300]:
            - generic [ref=f4e301]: v
            - generic [ref=f4e302]: o
            - generic [ref=f4e303]: i
            - generic [ref=f4e304]: c
            - generic [ref=f4e305]: e
          - generic [ref=f4e307]:
            - generic [ref=f4e308]: u
            - generic [ref=f4e309]: "n"
            - generic [ref=f4e310]: d
            - generic [ref=f4e311]: e
            - generic [ref=f4e312]: r
          - generic [ref=f4e314]:
            - generic [ref=f4e315]: s
            - generic [ref=f4e316]: p
            - generic [ref=f4e317]: r
            - generic [ref=f4e318]: i
            - generic [ref=f4e319]: "n"
            - generic [ref=f4e320]: g
          - generic [ref=f4e322]:
            - generic [ref=f4e323]: d
            - generic [ref=f4e324]: a
            - generic [ref=f4e325]: r
            - generic [ref=f4e326]: k
          - generic [ref=f4e328]:
            - generic [ref=f4e329]: f
            - generic [ref=f4e330]: o
            - generic [ref=f4e331]: o
            - generic [ref=f4e332]: d
          - generic [ref=f4e334]:
            - generic [ref=f4e335]: c
            - generic [ref=f4e336]: o
            - generic [ref=f4e337]: d
            - generic [ref=f4e338]: e
          - generic [ref=f4e340]:
            - generic [ref=f4e341]: "n"
            - generic [ref=f4e342]: o
            - generic [ref=f4e343]: t
            - generic [ref=f4e344]: i
            - generic [ref=f4e345]: o
            - generic [ref=f4e346]: "n"
          - generic [ref=f4e348]:
            - generic [ref=f4e349]: l
            - generic [ref=f4e350]: e
            - generic [ref=f4e351]: f
            - generic [ref=f4e352]: t
          - generic [ref=f4e354]:
            - generic [ref=f4e355]: c
            - generic [ref=f4e356]: l
            - generic [ref=f4e357]: e
            - generic [ref=f4e358]: a
            - generic [ref=f4e359]: "n"
          - generic [ref=f4e361]:
            - generic [ref=f4e362]: a
            - generic [ref=f4e363]: t
          - generic [ref=f4e365]:
            - generic [ref=f4e366]: t
            - generic [ref=f4e367]: h
            - generic [ref=f4e368]: o
            - generic [ref=f4e369]: u
            - generic [ref=f4e370]: g
            - generic [ref=f4e371]: h
          - generic [ref=f4e373]:
            - generic [ref=f4e374]: s
            - generic [ref=f4e375]: a
            - generic [ref=f4e376]: m
            - generic [ref=f4e377]: e
          - generic [ref=f4e379]:
            - generic [ref=f4e380]: k
            - generic [ref=f4e381]: e
            - generic [ref=f4e382]: e
            - generic [ref=f4e383]: p
          - generic [ref=f4e385]:
            - generic [ref=f4e386]: t
            - generic [ref=f4e387]: o
            - generic [ref=f4e388]: "n"
          - generic [ref=f4e390]:
            - generic [ref=f4e391]: t
            - generic [ref=f4e392]: h
            - generic [ref=f4e393]: e
            - generic [ref=f4e394]: "n"
          - generic [ref=f4e396]:
            - generic [ref=f4e397]: d
            - generic [ref=f4e398]: r
            - generic [ref=f4e399]: a
            - generic [ref=f4e400]: w
          - generic [ref=f4e402]:
            - generic [ref=f4e403]: p
            - generic [ref=f4e404]: i
            - generic [ref=f4e405]: "n"
            - generic [ref=f4e406]: k
          - generic [ref=f4e408]:
            - generic [ref=f4e409]: f
            - generic [ref=f4e410]: a
            - generic [ref=f4e411]: s
            - generic [ref=f4e412]: t
          - generic [ref=f4e414]:
            - generic [ref=f4e415]: g
            - generic [ref=f4e416]: o
            - generic [ref=f4e417]: o
            - generic [ref=f4e418]: d
          - generic [ref=f4e420]:
            - generic [ref=f4e421]: "n"
            - generic [ref=f4e422]: e
            - generic [ref=f4e423]: x
            - generic [ref=f4e424]: t
          - generic [ref=f4e426]:
            - generic [ref=f4e427]: s
            - generic [ref=f4e428]: t
            - generic [ref=f4e429]: o
            - generic [ref=f4e430]: p
          - generic [ref=f4e432]:
            - generic [ref=f4e433]: u
            - generic [ref=f4e434]: s
          - generic [ref=f4e436]:
            - generic [ref=f4e437]: t
            - generic [ref=f4e438]: h
            - generic [ref=f4e439]: i
            - generic [ref=f4e440]: "n"
            - generic [ref=f4e441]: g
          - generic [ref=f4e443]:
            - generic [ref=f4e444]: s
            - generic [ref=f4e445]: i
            - generic [ref=f4e446]: l
            - generic [ref=f4e447]: v
            - generic [ref=f4e448]: e
            - generic [ref=f4e449]: r
          - generic [ref=f4e451]:
            - generic [ref=f4e452]: a
            - generic [ref=f4e453]: "n"
            - generic [ref=f4e454]: t
          - generic [ref=f4e456]:
            - generic [ref=f4e457]: h
            - generic [ref=f4e458]: e
            - generic [ref=f4e459]: a
            - generic [ref=f4e460]: d
          - generic [ref=f4e462]:
            - generic [ref=f4e463]: o
            - generic [ref=f4e464]: u
            - generic [ref=f4e465]: r
          - generic [ref=f4e467]:
            - generic [ref=f4e468]: s
            - generic [ref=f4e469]: a
            - generic [ref=f4e470]: v
            - generic [ref=f4e471]: e
          - generic [ref=f4e473]:
            - generic [ref=f4e474]: e
            - generic [ref=f4e475]: r
            - generic [ref=f4e476]: a
          - generic [ref=f4e478]:
            - generic [ref=f4e479]: e
            - generic [ref=f4e480]: r
            - generic [ref=f4e481]: a
          - generic [ref=f4e483]:
            - generic [ref=f4e484]: p
            - generic [ref=f4e485]: a
            - generic [ref=f4e486]: i
            - generic [ref=f4e487]: r
          - generic [ref=f4e489]:
            - generic [ref=f4e490]: f
            - generic [ref=f4e491]: i
            - generic [ref=f4e492]: r
            - generic [ref=f4e493]: s
            - generic [ref=f4e494]: t
          - generic [ref=f4e496]:
            - generic [ref=f4e497]: t
            - generic [ref=f4e498]: h
            - generic [ref=f4e499]: o
            - generic [ref=f4e500]: u
            - generic [ref=f4e501]: g
            - generic [ref=f4e502]: h
          - generic [ref=f4e504]:
            - generic [ref=f4e505]: r
            - generic [ref=f4e506]: a
            - generic [ref=f4e507]: c
            - generic [ref=f4e508]: e
          - generic [ref=f4e510]:
            - generic [ref=f4e511]: f
            - generic [ref=f4e512]: a
            - generic [ref=f4e513]: c
            - generic [ref=f4e514]: e
          - generic [ref=f4e516]:
            - generic [ref=f4e517]: l
            - generic [ref=f4e518]: i
            - generic [ref=f4e519]: "n"
            - generic [ref=f4e520]: e
          - generic [ref=f4e522]:
            - generic [ref=f4e523]: q
            - generic [ref=f4e524]: u
            - generic [ref=f4e525]: i
            - generic [ref=f4e526]: e
            - generic [ref=f4e527]: t
          - generic [ref=f4e529]:
            - generic [ref=f4e530]: s
            - generic [ref=f4e531]: e
            - generic [ref=f4e532]: v
            - generic [ref=f4e533]: e
            - generic [ref=f4e534]: "n"
          - generic [ref=f4e536]:
            - generic [ref=f4e537]: s
            - generic [ref=f4e538]: o
          - generic [ref=f4e540]:
            - generic [ref=f4e541]: h
            - generic [ref=f4e542]: a
            - generic [ref=f4e543]: "n"
            - generic [ref=f4e544]: d
          - generic [ref=f4e546]:
            - generic [ref=f4e547]: t
            - generic [ref=f4e548]: h
            - generic [ref=f4e549]: a
            - generic [ref=f4e550]: "n"
            - generic [ref=f4e551]: k
          - generic [ref=f4e553]:
            - generic [ref=f4e554]: o
            - generic [ref=f4e555]: p
            - generic [ref=f4e556]: e
            - generic [ref=f4e557]: "n"
          - generic [ref=f4e559]:
            - generic [ref=f4e560]: h
            - generic [ref=f4e561]: i
            - generic [ref=f4e562]: g
            - generic [ref=f4e563]: h
          - generic [ref=f4e565]:
            - generic [ref=f4e566]: j
            - generic [ref=f4e567]: o
            - generic [ref=f4e568]: i
            - generic [ref=f4e569]: "n"
          - generic [ref=f4e571]:
            - generic [ref=f4e572]: f
            - generic [ref=f4e573]: o
            - generic [ref=f4e574]: r
          - generic [ref=f4e576]:
            - generic [ref=f4e577]: m
            - generic [ref=f4e578]: a
            - generic [ref=f4e579]: i
            - generic [ref=f4e580]: "n"
          - generic [ref=f4e582]:
            - generic [ref=f4e583]: t
            - generic [ref=f4e584]: o
            - generic [ref=f4e585]: w
            - generic [ref=f4e586]: "n"
          - generic [ref=f4e588]:
            - generic [ref=f4e589]: "n"
            - generic [ref=f4e590]: e
            - generic [ref=f4e591]: a
            - generic [ref=f4e592]: r
          - generic [ref=f4e594]:
            - generic [ref=f4e595]: s
            - generic [ref=f4e596]: e
            - generic [ref=f4e597]: a
          - generic [ref=f4e599]:
            - generic [ref=f4e600]: i
            - generic [ref=f4e601]: t
          - generic [ref=f4e603]:
            - generic [ref=f4e604]: m
            - generic [ref=f4e605]: u
            - generic [ref=f4e606]: c
            - generic [ref=f4e607]: h
          - generic [ref=f4e609]:
            - generic [ref=f4e610]: w
            - generic [ref=f4e611]: o
            - generic [ref=f4e612]: m
            - generic [ref=f4e613]: a
            - generic [ref=f4e614]: "n"
          - generic [ref=f4e616]:
            - generic [ref=f4e617]: p
            - generic [ref=f4e618]: a
            - generic [ref=f4e619]: t
            - generic [ref=f4e620]: h
          - generic [ref=f4e622]:
            - generic [ref=f4e623]: o
            - generic [ref=f4e624]: t
            - generic [ref=f4e625]: h
            - generic [ref=f4e626]: e
            - generic [ref=f4e627]: r
          - generic [ref=f4e629]:
            - generic [ref=f4e630]: b
            - generic [ref=f4e631]: o
            - generic [ref=f4e632]: o
            - generic [ref=f4e633]: k
          - generic [ref=f4e635]:
            - generic [ref=f4e636]: s
            - generic [ref=f4e637]: o
            - generic [ref=f4e638]: u
            - generic [ref=f4e639]: t
            - generic [ref=f4e640]: h
          - generic [ref=f4e642]:
            - generic [ref=f4e643]: p
            - generic [ref=f4e644]: a
            - generic [ref=f4e645]: i
            - generic [ref=f4e646]: r
          - generic [ref=f4e648]:
            - generic [ref=f4e649]: s
            - generic [ref=f4e650]: e
            - generic [ref=f4e651]: "n"
            - generic [ref=f4e652]: d
          - generic [ref=f4e654]:
            - generic [ref=f4e655]: t
            - generic [ref=f4e656]: i
            - generic [ref=f4e657]: e
            - generic [ref=f4e658]: r
          - generic [ref=f4e660]:
            - generic [ref=f4e661]: t
            - generic [ref=f4e662]: e
            - generic [ref=f4e663]: a
          - generic [ref=f4e665]:
            - generic [ref=f4e666]: h
            - generic [ref=f4e667]: e
            - generic [ref=f4e668]: r
          - generic [ref=f4e670]:
            - generic [ref=f4e671]: f
            - generic [ref=f4e672]: i
            - generic [ref=f4e673]: r
            - generic [ref=f4e674]: e
          - generic [ref=f4e676]:
            - generic [ref=f4e677]: "y"
            - generic [ref=f4e678]: e
            - generic [ref=f4e679]: t
          - generic [ref=f4e681]:
            - generic [ref=f4e682]: s
            - generic [ref=f4e683]: e
            - generic [ref=f4e684]: a
            - generic [ref=f4e685]: t
          - generic [ref=f4e687]:
            - generic [ref=f4e688]: s
            - generic [ref=f4e689]: "n"
            - generic [ref=f4e690]: o
            - generic [ref=f4e691]: w
          - generic [ref=f4e693]:
            - generic [ref=f4e694]: v
            - generic [ref=f4e695]: o
            - generic [ref=f4e696]: i
            - generic [ref=f4e697]: c
            - generic [ref=f4e698]: e
          - generic [ref=f4e700]:
            - generic [ref=f4e701]: e
            - generic [ref=f4e702]: a
            - generic [ref=f4e703]: r
            - generic [ref=f4e704]: l
            - generic [ref=f4e705]: "y"
          - generic [ref=f4e707]:
            - generic [ref=f4e708]: t
            - generic [ref=f4e709]: e
            - generic [ref=f4e710]: e
            - generic [ref=f4e711]: "n"
          - generic [ref=f4e713]:
            - generic [ref=f4e714]: w
            - generic [ref=f4e715]: h
            - generic [ref=f4e716]: e
            - generic [ref=f4e717]: "n"
          - generic [ref=f4e719]:
            - generic [ref=f4e720]: t
            - generic [ref=f4e721]: h
            - generic [ref=f4e722]: a
            - generic [ref=f4e723]: "n"
          - generic [ref=f4e725]:
            - generic [ref=f4e726]: v
            - generic [ref=f4e727]: o
            - generic [ref=f4e728]: i
            - generic [ref=f4e729]: c
            - generic [ref=f4e730]: e
          - generic [ref=f4e732]:
            - generic [ref=f4e733]: f
            - generic [ref=f4e734]: o
            - generic [ref=f4e735]: r
            - generic [ref=f4e736]: g
            - generic [ref=f4e737]: e
          - generic [ref=f4e739]:
            - generic [ref=f4e740]: a
            - generic [ref=f4e741]: "n"
            - generic [ref=f4e742]: t
          - generic [ref=f4e744]:
            - generic [ref=f4e745]: j
            - generic [ref=f4e746]: o
            - generic [ref=f4e747]: k
            - generic [ref=f4e748]: e
          - generic [ref=f4e750]:
            - generic [ref=f4e751]: e
            - generic [ref=f4e752]: a
            - generic [ref=f4e753]: s
            - generic [ref=f4e754]: e
          - generic [ref=f4e756]:
            - generic [ref=f4e757]: e
            - generic [ref=f4e758]: v
            - generic [ref=f4e759]: e
            - generic [ref=f4e760]: "n"
          - generic [ref=f4e762]:
            - generic [ref=f4e763]: s
            - generic [ref=f4e764]: m
            - generic [ref=f4e765]: a
            - generic [ref=f4e766]: l
            - generic [ref=f4e767]: l
          - generic [ref=f4e769]:
            - generic [ref=f4e770]: t
            - generic [ref=f4e771]: o
            - generic [ref=f4e772]: o
          - generic [ref=f4e774]:
            - generic [ref=f4e775]: g
            - generic [ref=f4e776]: u
            - generic [ref=f4e777]: i
            - generic [ref=f4e778]: d
            - generic [ref=f4e779]: e
          - generic [ref=f4e781]:
            - generic [ref=f4e782]: s
            - generic [ref=f4e783]: e
            - generic [ref=f4e784]: c
            - generic [ref=f4e785]: o
            - generic [ref=f4e786]: "n"
            - generic [ref=f4e787]: d
          - generic [ref=f4e789]:
            - generic [ref=f4e790]: s
            - generic [ref=f4e791]: t
            - generic [ref=f4e792]: r
            - generic [ref=f4e793]: e
            - generic [ref=f4e794]: e
            - generic [ref=f4e795]: t
          - generic [ref=f4e797]:
            - generic [ref=f4e798]: t
            - generic [ref=f4e799]: a
            - generic [ref=f4e800]: s
            - generic [ref=f4e801]: k
          - generic [ref=f4e803]:
            - generic [ref=f4e804]: v
            - generic [ref=f4e805]: e
            - generic [ref=f4e806]: r
            - generic [ref=f4e807]: "y"
          - generic [ref=f4e809]:
            - generic [ref=f4e810]: t
            - generic [ref=f4e811]: h
            - generic [ref=f4e812]: a
            - generic [ref=f4e813]: "n"
          - generic [ref=f4e815]:
            - generic [ref=f4e816]: p
            - generic [ref=f4e817]: r
            - generic [ref=f4e818]: e
            - generic [ref=f4e819]: t
            - generic [ref=f4e820]: t
            - generic [ref=f4e821]: "y"
          - generic [ref=f4e823]:
            - generic [ref=f4e824]: b
            - generic [ref=f4e825]: r
            - generic [ref=f4e826]: o
            - generic [ref=f4e827]: w
            - generic [ref=f4e828]: "n"
          - generic [ref=f4e830]:
            - generic [ref=f4e831]: c
            - generic [ref=f4e832]: o
            - generic [ref=f4e833]: p
            - generic [ref=f4e834]: "y"
          - generic [ref=f4e836]:
            - generic [ref=f4e837]: m
            - generic [ref=f4e838]: u
            - generic [ref=f4e839]: s
            - generic [ref=f4e840]: t
          - generic [ref=f4e842]:
            - generic [ref=f4e843]: j
            - generic [ref=f4e844]: o
            - generic [ref=f4e845]: k
            - generic [ref=f4e846]: e
          - generic [ref=f4e848]:
            - generic [ref=f4e849]: p
            - generic [ref=f4e850]: o
            - generic [ref=f4e851]: i
            - generic [ref=f4e852]: "n"
            - generic [ref=f4e853]: t
          - generic [ref=f4e855]:
            - generic [ref=f4e856]: g
            - generic [ref=f4e857]: r
            - generic [ref=f4e858]: e
            - generic [ref=f4e859]: a
            - generic [ref=f4e860]: t
        - paragraph [ref=f4e861]: "Practice passage: happy in ratio off woman see some speak face learn grow said said more then sort slow place sent stare code speed blue door red view early early red voice under spring dark food code notion left clean at though same keep ton then draw pink fast good next stop us thing silver ant head our save era era pair first though race face line quiet seven so hand thank open high join for main town near sea it much woman path other book south pair send tier tea her fire yet seat snow voice early teen when than voice forge ant joke ease even small too guide second street task very than pretty brown copy must joke point great"
        - textbox "Typing input" [active] [ref=f4e862]
      - generic [ref=f4e864]:
        - paragraph [ref=f4e865]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=f4e866]
      - generic [ref=f4e867]:
        - paragraph [ref=f4e868]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=f4e869]:
          - button "Restart with new text" [ref=f4e870]
          - button "Show accessible text editor" [ref=f4e874]
          - button "Finish" [disabled] [ref=f4e878]
      - status [ref=f4e881]: Ready to type
  - contentinfo [ref=f4e882]:
    - generic [ref=f4e883]:
      - generic [ref=f4e884]:
        - generic [ref=f4e885]:
          - generic [ref=f4e886]: Sparow
          - generic [ref=f4e887]: Type
        - text: Find your rhythm.
      - generic [ref=f4e888]:
        - link "About & metrics" [ref=f4e889] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=f4e890] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=f4e891] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=f4e892] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=f4e893] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=f4e894] [cursor=pointer]:
          - /url: /offline
        - generic [ref=f4e895]: SparowType © 2026
```

# Test source

```ts
  25  | const workerEntry = /\/keyboard-render[.-]worker[^/]*\.(?:js|ts)(?:\?.*)?$/;
  26  | 
  27  | async function observeNativeWorker(page: Page, info: TestInfo) {
  28  |   info.annotations.push({
  29  |     type: "browser-runtime-version",
  30  |     description: page.context().browser()?.version() ?? "UNAVAILABLE",
  31  |   });
  32  |   const supported = await page.evaluate(
  33  |     () =>
  34  |       typeof Worker === "function" &&
  35  |       typeof OffscreenCanvas === "function" &&
  36  |       typeof HTMLCanvasElement.prototype.transferControlToOffscreen ===
  37  |         "function",
  38  |   );
  39  |   test.skip(
  40  |     !supported,
  41  |     "UNVERIFIED: this runner has no native transferable-canvas worker API. Document fallback is covered independently.",
  42  |   );
  43  |   info.annotations.push({
  44  |     type: "scope",
  45  |     description:
  46  |       "Native Worker and OffscreenCanvas, normal clocks; no renderer mock or document-renderer override.",
  47  |   });
  48  |   await page.addInitScript(() => {
  49  |     const audit = { records: [] as WorkerRecord[], workers: [] as Worker[] };
  50  |     (window as AuditedWindow).openingWorkerAudit = audit;
  51  |     const NativeWorker = window.Worker;
  52  |     const instrumented = new Proxy(NativeWorker, {
  53  |       construct(target, args) {
  54  |         const worker = Reflect.construct(target, args) as Worker;
  55  |         if (
  56  |           (args[1] as WorkerOptions | undefined)?.name !==
  57  |           "SparowType keyboard renderer"
  58  |         )
  59  |           return worker;
  60  |         const record: WorkerRecord = {
  61  |           url: String(args[0]),
  62  |           sent: [],
  63  |           received: [],
  64  |           terminated: 0,
  65  |           terminatedAtMs: null,
  66  |         };
  67  |         audit.records.push(record);
  68  |         audit.workers.push(worker);
  69  |         worker.postMessage = new Proxy(worker.postMessage, {
  70  |           apply(method, receiver, argumentsList) {
  71  |             const data = argumentsList[0] as WorkerReceipt;
  72  |             record.sent.push({
  73  |               type: data.type,
  74  |               atMs: performance.now(),
  75  |               ...(data.viewport ? { viewport: data.viewport } : {}),
  76  |               ...(data.type === "initialize"
  77  |                 ? { lowPower: data.lowPower, finePointer: data.finePointer }
  78  |                 : {}),
  79  |             });
  80  |             return Reflect.apply(method, receiver, argumentsList);
  81  |           },
  82  |         });
  83  |         worker.terminate = new Proxy(worker.terminate, {
  84  |           apply(method, receiver, argumentsList) {
  85  |             record.terminated++;
  86  |             record.terminatedAtMs = performance.now();
  87  |             return Reflect.apply(method, receiver, argumentsList);
  88  |           },
  89  |         });
  90  |         worker.addEventListener(
  91  |           "message",
  92  |           ({ data }: MessageEvent<WorkerReceipt>) => {
  93  |             if (
  94  |               ["ready", "diagnostics", "failure", "disposed"].includes(
  95  |                 data.type,
  96  |               ) ||
  97  |               data.type.startsWith("test-")
  98  |             )
  99  |               record.received.push({ ...data, atMs: performance.now() });
  100 |           },
  101 |         );
  102 |         return worker;
  103 |       },
  104 |     });
  105 |     Object.defineProperty(window, "Worker", {
  106 |       configurable: true,
  107 |       writable: true,
  108 |       value: instrumented,
  109 |     });
  110 |   });
  111 | }
  112 | 
  113 | async function records(page: Page) {
  114 |   return page.evaluate(
  115 |     () => (window as AuditedWindow).openingWorkerAudit?.records ?? [],
  116 |   );
  117 | }
  118 | async function firstWorkerReady(page: Page) {
  119 |   await expect
  120 |     .poll(async () =>
  121 |       (await records(page))[0]?.received.some(
  122 |         (receipt) => receipt.type === "ready",
  123 |       ),
  124 |     )
> 125 |     .toBe(true);
      |      ^ Error: expect(received).toBe(expected) // Object.is equality
  126 | }
  127 | async function readyPractice(page: Page) {
  128 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  129 |   const input = page.getByRole("textbox", {
  130 |     name: "Typing input",
  131 |     exact: true,
  132 |   });
  133 |   await expect(input).toBeVisible();
  134 |   await expect(input).toHaveValue("");
  135 |   await expect(
  136 |     page.getByRole("region", { name: "Typing session", exact: true }),
  137 |   ).toHaveAttribute("data-status", "ready");
  138 |   return input;
  139 | }
  140 | async function expectWorkerClosed(
  141 |   page: Page,
  142 |   policy: "acknowledged" | "watchdog-allowed" = "acknowledged",
  143 | ) {
  144 |   await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  145 |   await expect
  146 |     .poll(
  147 |       () =>
  148 |         page.workers().filter((worker) => workerEntry.test(worker.url()))
  149 |           .length,
  150 |     )
  151 |     .toBe(0);
  152 |   const [record] = await records(page);
  153 |   const dispose = record.sent.find((receipt) => receipt.type === "dispose");
  154 |   if (dispose?.atMs === undefined || record.terminatedAtMs === null)
  155 |     throw new Error(
  156 |       "No monotonic dispose/terminate receipts for native worker",
  157 |     );
  158 |   const acknowledged =
  159 |     record.received.some((receipt) => receipt.type === "disposed") &&
  160 |     record.received.some((receipt) => receipt.diagnostics?.disposed);
  161 |   const elapsedMs = record.terminatedAtMs - dispose.atMs;
  162 |   let path = "acknowledged-disposal";
  163 |   if (policy === "acknowledged" || acknowledged) {
  164 |     expect(acknowledged).toBe(true);
  165 |   } else {
  166 |     // A busy GPU worker gets a200ms disposal grace period before termination.
  167 |     // Require measured watchdog timing and actual native closure. A missing
  168 |     // acknowledgement alone never establishes successful explicit disposal.
  169 |     expect(elapsedMs).toBeGreaterThanOrEqual(190);
  170 |     expect(elapsedMs).toBeLessThanOrEqual(1000);
  171 |     path = "watchdog-termination-no-disposal-acknowledgement";
  172 |   }
  173 |   await test.info().attach("native-worker-shutdown", {
  174 |     body: JSON.stringify({
  175 |       path,
  176 |       policy,
  177 |       disposeAtMs: dispose.atMs,
  178 |       terminatedAtMs: record.terminatedAtMs,
  179 |       elapsedMs,
  180 |       terminated: record.terminated,
  181 |       liveNativeWorkers: page
  182 |         .workers()
  183 |         .filter((worker) => workerEntry.test(worker.url())).length,
  184 |     }),
  185 |     contentType: "application/json",
  186 |   });
  187 | }
  188 | 
  189 | test.afterEach(async ({ page }, info) => {
  190 |   if (page.isClosed()) return;
  191 |   const observed = await records(page).catch(() => []);
  192 |   await info.attach("native-worker-receipts", {
  193 |     body: JSON.stringify(observed, null, 2),
  194 |     contentType: "application/json",
  195 |   });
  196 | });
  197 | 
  198 | test("default native worker draws the complete keyboard while document tasks, resize and skip remain responsive", async ({
  199 |   page,
  200 | }, info) => {
  201 |   await observeNativeWorker(page, info);
  202 |   await page.addInitScript(() => {
  203 |     Object.defineProperty(navigator, "hardwareConcurrency", {
  204 |       configurable: true,
  205 |       get: () => 8,
  206 |     });
  207 |     Object.defineProperty(navigator, "deviceMemory", {
  208 |       configurable: true,
  209 |       get: () => 8,
  210 |     });
  211 |   });
  212 |   await page.emulateMedia({ reducedMotion: "no-preference" });
  213 |   await page.setViewportSize({ width: 1280, height: 800 });
  214 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  215 |   await firstWorkerReady(page);
  216 |   await expect
  217 |     .poll(async () =>
  218 |       (await records(page))[0]?.received.some(
  219 |         (receipt) =>
  220 |           receipt.diagnostics?.thread === "worker" &&
  221 |           receipt.diagnostics.frames > 0 &&
  222 |           receipt.diagnostics.drawCalls > 0,
  223 |       ),
  224 |     )
  225 |     .toBe(true);
```