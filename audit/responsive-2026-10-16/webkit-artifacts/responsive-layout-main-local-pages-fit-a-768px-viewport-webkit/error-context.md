# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> main local pages fit a 768px viewport
- Location: e2e\responsive-layout.spec.ts:26:3

# Error details

```
Error: http://127.0.0.1:4173/

expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
-   "body": 664,
+   "body": 663,
    "document": 664,
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
        - button "Open command palette" [ref=e13]
        - link "Settings" [ref=e16]:
          - /url: /settings
        - link "Sign in" [ref=e20]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e25]:
      - link "Test" [ref=e26]:
        - /url: /
      - link "Learn" [ref=e29]:
        - /url: /learn
      - link "Race" [ref=e33]:
        - /url: /race
      - link "Stats" [ref=e43]:
        - /url: /stats
      - link "Rankings" [ref=e46]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e53]:
        - /url: /keyboard-lab
  - main [ref=e56]:
    - heading "Typing practice" [level=1] [ref=e57]
    - region "Test configuration" [ref=e58]:
      - generic [ref=e59]:
        - group "Test mode" [ref=e60]:
          - button "Time" [pressed] [ref=e61]
          - button "Words" [ref=e65]
          - button "Quote" [ref=e68]
          - button "Code" [ref=e72]
          - button "Custom" [ref=e77]
          - button "Zen" [ref=e81]
        - group "Test duration" [ref=e84]:
          - button "15 seconds" [ref=e85]:
            - text: "15"
            - generic [ref=e86]: seconds
          - button "30 seconds" [pressed] [ref=e87]:
            - text: "30"
            - generic [ref=e88]: seconds
          - button "60 seconds" [ref=e89]:
            - text: "60"
            - generic [ref=e90]: seconds
          - button "120 seconds" [ref=e91]:
            - text: "120"
            - generic [ref=e92]: seconds
      - generic [ref=e93]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e94]:
          - checkbox "Precision mode · stop on errors" [ref=e95]
          - text: Precision mode · stop on errors
        - generic [ref=e96]:
          - text: Language
          - combobox "Language" [ref=e97]:
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
        - button "punctuation" [ref=e99]
        - button "# numbers" [ref=e101]
    - region "Typing session" [ref=e102]:
      - generic [ref=e103]:
        - generic [ref=e104]:
          - generic [ref=e105]:
            - generic [ref=e106]: 30s
            - generic [ref=e107]: remaining
          - generic [ref=e108]: —wpm
          - generic [ref=e109]: —acc %
        - generic [ref=e110]: Ready when you are
      - generic [ref=e112]:
        - generic [ref=e114]:
          - generic [ref=e115]:
            - generic [ref=e116]: l
            - generic [ref=e117]: e
            - generic [ref=e118]: t
          - generic [ref=e120]:
            - generic [ref=e121]: l
            - generic [ref=e122]: i
            - generic [ref=e123]: "n"
            - generic [ref=e124]: e
          - generic [ref=e126]:
            - generic [ref=e127]: w
            - generic [ref=e128]: h
            - generic [ref=e129]: e
            - generic [ref=e130]: r
            - generic [ref=e131]: e
          - generic [ref=e133]:
            - generic [ref=e134]: s
            - generic [ref=e135]: p
            - generic [ref=e136]: e
            - generic [ref=e137]: e
            - generic [ref=e138]: d
          - generic [ref=e140]:
            - generic [ref=e141]: l
            - generic [ref=e142]: a
            - generic [ref=e143]: "n"
            - generic [ref=e144]: e
          - generic [ref=e146]:
            - generic [ref=e147]: m
            - generic [ref=e148]: e
          - generic [ref=e150]:
            - generic [ref=e151]: t
            - generic [ref=e152]: r
            - generic [ref=e153]: u
            - generic [ref=e154]: e
          - generic [ref=e156]:
            - generic [ref=e157]: l
            - generic [ref=e158]: e
            - generic [ref=e159]: t
          - generic [ref=e161]:
            - generic [ref=e162]: u
            - generic [ref=e163]: p
          - generic [ref=e165]:
            - generic [ref=e166]: t
            - generic [ref=e167]: r
            - generic [ref=e168]: u
            - generic [ref=e169]: e
          - generic [ref=e171]:
            - generic [ref=e172]: p
            - generic [ref=e173]: o
            - generic [ref=e174]: i
            - generic [ref=e175]: "n"
            - generic [ref=e176]: t
          - generic [ref=e178]:
            - generic [ref=e179]: f
            - generic [ref=e180]: i
            - generic [ref=e181]: "n"
            - generic [ref=e182]: e
          - generic [ref=e184]:
            - generic [ref=e185]: f
            - generic [ref=e186]: o
            - generic [ref=e187]: r
          - generic [ref=e189]:
            - generic [ref=e190]: r
            - generic [ref=e191]: a
            - generic [ref=e192]: t
            - generic [ref=e193]: i
            - generic [ref=e194]: o
            - generic [ref=e195]: "n"
          - generic [ref=e197]:
            - generic [ref=e198]: t
            - generic [ref=e199]: h
            - generic [ref=e200]: i
            - generic [ref=e201]: "n"
            - generic [ref=e202]: k
          - generic [ref=e204]:
            - generic [ref=e205]: s
            - generic [ref=e206]: t
            - generic [ref=e207]: r
            - generic [ref=e208]: e
            - generic [ref=e209]: e
            - generic [ref=e210]: t
          - generic [ref=e212]:
            - generic [ref=e213]: h
            - generic [ref=e214]: a
            - generic [ref=e215]: p
            - generic [ref=e216]: p
            - generic [ref=e217]: "y"
          - generic [ref=e219]:
            - generic [ref=e220]: h
            - generic [ref=e221]: e
            - generic [ref=e222]: a
            - generic [ref=e223]: d
          - generic [ref=e225]:
            - generic [ref=e226]: r
            - generic [ref=e227]: a
            - generic [ref=e228]: t
            - generic [ref=e229]: i
            - generic [ref=e230]: o
            - generic [ref=e231]: "n"
          - generic [ref=e233]:
            - generic [ref=e234]: h
            - generic [ref=e235]: a
            - generic [ref=e236]: p
            - generic [ref=e237]: p
            - generic [ref=e238]: "y"
          - generic [ref=e240]:
            - generic [ref=e241]: v
            - generic [ref=e242]: e
            - generic [ref=e243]: r
            - generic [ref=e244]: "y"
          - generic [ref=e246]:
            - generic [ref=e247]: "n"
            - generic [ref=e248]: a
            - generic [ref=e249]: t
            - generic [ref=e250]: i
            - generic [ref=e251]: o
            - generic [ref=e252]: "n"
          - generic [ref=e254]:
            - generic [ref=e255]: s
            - generic [ref=e256]: m
            - generic [ref=e257]: a
            - generic [ref=e258]: l
            - generic [ref=e259]: l
          - generic [ref=e261]:
            - generic [ref=e262]: r
            - generic [ref=e263]: a
            - generic [ref=e264]: c
            - generic [ref=e265]: e
          - generic [ref=e267]:
            - generic [ref=e268]: t
            - generic [ref=e269]: h
            - generic [ref=e270]: a
            - generic [ref=e271]: "n"
            - generic [ref=e272]: k
          - generic [ref=e274]:
            - generic [ref=e275]: s
            - generic [ref=e276]: t
            - generic [ref=e277]: a
            - generic [ref=e278]: t
            - generic [ref=e279]: e
          - generic [ref=e281]:
            - generic [ref=e282]: w
            - generic [ref=e283]: o
            - generic [ref=e284]: r
            - generic [ref=e285]: l
            - generic [ref=e286]: d
          - generic [ref=e288]:
            - generic [ref=e289]: g
            - generic [ref=e290]: r
            - generic [ref=e291]: a
            - generic [ref=e292]: "n"
            - generic [ref=e293]: d
          - generic [ref=e295]:
            - generic [ref=e296]: s
            - generic [ref=e297]: e
            - generic [ref=e298]: "n"
            - generic [ref=e299]: d
          - generic [ref=e301]:
            - generic [ref=e302]: t
            - generic [ref=e303]: h
            - generic [ref=e304]: r
            - generic [ref=e305]: e
            - generic [ref=e306]: e
          - generic [ref=e308]:
            - generic [ref=e309]: w
            - generic [ref=e310]: h
            - generic [ref=e311]: e
            - generic [ref=e312]: "n"
          - generic [ref=e314]:
            - generic [ref=e315]: s
            - generic [ref=e316]: t
            - generic [ref=e317]: o
            - generic [ref=e318]: "n"
            - generic [ref=e319]: e
          - generic [ref=e321]:
            - generic [ref=e322]: t
            - generic [ref=e323]: e
            - generic [ref=e324]: "n"
            - generic [ref=e325]: t
          - generic [ref=e327]:
            - generic [ref=e328]: t
            - generic [ref=e329]: a
            - generic [ref=e330]: "n"
          - generic [ref=e332]:
            - generic [ref=e333]: j
            - generic [ref=e334]: o
            - generic [ref=e335]: k
            - generic [ref=e336]: e
          - generic [ref=e338]:
            - generic [ref=e339]: s
            - generic [ref=e340]: t
            - generic [ref=e341]: o
            - generic [ref=e342]: r
            - generic [ref=e343]: "y"
          - generic [ref=e345]:
            - generic [ref=e346]: i
            - generic [ref=e347]: s
          - generic [ref=e349]:
            - generic [ref=e350]: o
            - generic [ref=e351]: t
            - generic [ref=e352]: h
            - generic [ref=e353]: e
            - generic [ref=e354]: r
          - generic [ref=e356]:
            - generic [ref=e357]: m
            - generic [ref=e358]: o
            - generic [ref=e359]: s
            - generic [ref=e360]: t
          - generic [ref=e362]:
            - generic [ref=e363]: w
            - generic [ref=e364]: h
            - generic [ref=e365]: e
            - generic [ref=e366]: r
            - generic [ref=e367]: e
          - generic [ref=e369]:
            - generic [ref=e370]: w
            - generic [ref=e371]: i
            - generic [ref=e372]: "n"
            - generic [ref=e373]: d
            - generic [ref=e374]: o
            - generic [ref=e375]: w
          - generic [ref=e377]:
            - generic [ref=e378]: r
            - generic [ref=e379]: e
            - generic [ref=e380]: t
            - generic [ref=e381]: a
            - generic [ref=e382]: i
            - generic [ref=e383]: "n"
          - generic [ref=e385]:
            - generic [ref=e386]: c
            - generic [ref=e387]: l
            - generic [ref=e388]: o
            - generic [ref=e389]: s
            - generic [ref=e390]: e
          - generic [ref=e392]:
            - generic [ref=e393]: m
            - generic [ref=e394]: a
            - generic [ref=e395]: d
            - generic [ref=e396]: e
          - generic [ref=e398]:
            - generic [ref=e399]: p
            - generic [ref=e400]: e
            - generic [ref=e401]: r
            - generic [ref=e402]: s
            - generic [ref=e403]: o
            - generic [ref=e404]: "n"
          - generic [ref=e406]:
            - generic [ref=e407]: o
            - generic [ref=e408]: w
            - generic [ref=e409]: "n"
          - generic [ref=e411]:
            - generic [ref=e412]: h
            - generic [ref=e413]: i
            - generic [ref=e414]: s
          - generic [ref=e416]:
            - generic [ref=e417]: o
            - generic [ref=e418]: v
            - generic [ref=e419]: e
            - generic [ref=e420]: r
          - generic [ref=e422]:
            - generic [ref=e423]: p
            - generic [ref=e424]: o
            - generic [ref=e425]: i
            - generic [ref=e426]: "n"
            - generic [ref=e427]: t
          - generic [ref=e429]:
            - generic [ref=e430]: w
            - generic [ref=e431]: a
            - generic [ref=e432]: t
            - generic [ref=e433]: e
            - generic [ref=e434]: r
          - generic [ref=e436]:
            - generic [ref=e437]: e
            - generic [ref=e438]: r
            - generic [ref=e439]: a
          - generic [ref=e441]:
            - generic [ref=e442]: "y"
            - generic [ref=e443]: o
            - generic [ref=e444]: u
            - generic [ref=e445]: "n"
            - generic [ref=e446]: g
          - generic [ref=e448]:
            - generic [ref=e449]: r
            - generic [ref=e450]: i
            - generic [ref=e451]: o
            - generic [ref=e452]: t
          - generic [ref=e454]:
            - generic [ref=e455]: s
            - generic [ref=e456]: i
            - generic [ref=e457]: m
            - generic [ref=e458]: p
            - generic [ref=e459]: l
            - generic [ref=e460]: e
          - generic [ref=e462]:
            - generic [ref=e463]: l
            - generic [ref=e464]: e
            - generic [ref=e465]: f
            - generic [ref=e466]: t
          - generic [ref=e468]:
            - generic [ref=e469]: w
            - generic [ref=e470]: h
            - generic [ref=e471]: i
            - generic [ref=e472]: t
            - generic [ref=e473]: e
          - generic [ref=e475]:
            - generic [ref=e476]: r
            - generic [ref=e477]: e
            - generic [ref=e478]: "n"
            - generic [ref=e479]: t
          - generic [ref=e481]:
            - generic [ref=e482]: h
            - generic [ref=e483]: e
            - generic [ref=e484]: a
            - generic [ref=e485]: r
            - generic [ref=e486]: t
          - generic [ref=e488]:
            - generic [ref=e489]: w
            - generic [ref=e490]: o
            - generic [ref=e491]: r
            - generic [ref=e492]: d
          - generic [ref=e494]:
            - generic [ref=e495]: s
            - generic [ref=e496]: k
            - generic [ref=e497]: "y"
          - generic [ref=e499]:
            - generic [ref=e500]: t
            - generic [ref=e501]: a
            - generic [ref=e502]: "n"
          - generic [ref=e504]:
            - generic [ref=e505]: w
            - generic [ref=e506]: h
            - generic [ref=e507]: "y"
          - generic [ref=e509]:
            - generic [ref=e510]: o
            - generic [ref=e511]: "n"
            - generic [ref=e512]: l
            - generic [ref=e513]: "y"
          - generic [ref=e515]:
            - generic [ref=e516]: w
            - generic [ref=e517]: a
            - generic [ref=e518]: l
            - generic [ref=e519]: k
          - generic [ref=e521]:
            - generic [ref=e522]: t
            - generic [ref=e523]: h
            - generic [ref=e524]: e
            - generic [ref=e525]: r
            - generic [ref=e526]: e
          - generic [ref=e528]:
            - generic [ref=e529]: l
            - generic [ref=e530]: o
            - generic [ref=e531]: w
          - generic [ref=e533]:
            - generic [ref=e534]: c
            - generic [ref=e535]: l
            - generic [ref=e536]: e
            - generic [ref=e537]: a
            - generic [ref=e538]: "n"
          - generic [ref=e540]:
            - generic [ref=e541]: s
            - generic [ref=e542]: h
            - generic [ref=e543]: i
            - generic [ref=e544]: p
          - generic [ref=e546]:
            - generic [ref=e547]: s
            - generic [ref=e548]: t
            - generic [ref=e549]: a
            - generic [ref=e550]: r
          - generic [ref=e552]:
            - generic [ref=e553]: s
            - generic [ref=e554]: h
            - generic [ref=e555]: o
            - generic [ref=e556]: w
          - generic [ref=e558]:
            - generic [ref=e559]: e
            - generic [ref=e560]: a
            - generic [ref=e561]: c
            - generic [ref=e562]: h
          - generic [ref=e564]:
            - generic [ref=e565]: r
            - generic [ref=e566]: e
            - generic [ref=e567]: d
          - generic [ref=e569]:
            - generic [ref=e570]: f
            - generic [ref=e571]: o
            - generic [ref=e572]: r
            - generic [ref=e573]: g
            - generic [ref=e574]: e
          - generic [ref=e576]:
            - generic [ref=e577]: "n"
            - generic [ref=e578]: e
            - generic [ref=e579]: o
            - generic [ref=e580]: "n"
          - generic [ref=e582]:
            - generic [ref=e583]: s
            - generic [ref=e584]: p
            - generic [ref=e585]: r
            - generic [ref=e586]: i
            - generic [ref=e587]: "n"
            - generic [ref=e588]: g
          - generic [ref=e590]:
            - generic [ref=e591]: "n"
            - generic [ref=e592]: a
            - generic [ref=e593]: m
            - generic [ref=e594]: e
          - generic [ref=e596]:
            - generic [ref=e597]: p
            - generic [ref=e598]: a
            - generic [ref=e599]: p
            - generic [ref=e600]: e
            - generic [ref=e601]: r
          - generic [ref=e603]:
            - generic [ref=e604]: r
            - generic [ref=e605]: a
            - generic [ref=e606]: c
            - generic [ref=e607]: e
          - generic [ref=e609]:
            - generic [ref=e610]: d
            - generic [ref=e611]: e
            - generic [ref=e612]: a
            - generic [ref=e613]: r
          - generic [ref=e615]:
            - generic [ref=e616]: w
            - generic [ref=e617]: h
            - generic [ref=e618]: e
            - generic [ref=e619]: "n"
          - generic [ref=e621]:
            - generic [ref=e622]: t
            - generic [ref=e623]: h
            - generic [ref=e624]: e
            - generic [ref=e625]: r
            - generic [ref=e626]: e
          - generic [ref=e628]:
            - generic [ref=e629]: "y"
            - generic [ref=e630]: e
            - generic [ref=e631]: t
          - generic [ref=e633]:
            - generic [ref=e634]: "n"
            - generic [ref=e635]: o
          - generic [ref=e637]:
            - generic [ref=e638]: "n"
            - generic [ref=e639]: i
            - generic [ref=e640]: g
            - generic [ref=e641]: h
            - generic [ref=e642]: t
          - generic [ref=e644]:
            - generic [ref=e645]: s
            - generic [ref=e646]: a
            - generic [ref=e647]: v
            - generic [ref=e648]: e
          - generic [ref=e650]:
            - generic [ref=e651]: d
            - generic [ref=e652]: o
            - generic [ref=e653]: w
            - generic [ref=e654]: "n"
          - generic [ref=e656]:
            - generic [ref=e657]: m
            - generic [ref=e658]: a
            - generic [ref=e659]: "n"
            - generic [ref=e660]: "y"
          - generic [ref=e662]:
            - generic [ref=e663]: d
            - generic [ref=e664]: r
            - generic [ref=e665]: a
            - generic [ref=e666]: w
          - generic [ref=e668]:
            - generic [ref=e669]: h
            - generic [ref=e670]: o
            - generic [ref=e671]: p
            - generic [ref=e672]: e
          - generic [ref=e674]:
            - generic [ref=e675]: r
            - generic [ref=e676]: o
            - generic [ref=e677]: o
            - generic [ref=e678]: t
          - generic [ref=e680]:
            - generic [ref=e681]: s
            - generic [ref=e682]: o
          - generic [ref=e684]:
            - generic [ref=e685]: p
            - generic [ref=e686]: l
            - generic [ref=e687]: a
            - generic [ref=e688]: i
            - generic [ref=e689]: "n"
          - generic [ref=e691]:
            - generic [ref=e692]: s
            - generic [ref=e693]: t
            - generic [ref=e694]: a
            - generic [ref=e695]: r
          - generic [ref=e697]:
            - generic [ref=e698]: r
            - generic [ref=e699]: e
            - generic [ref=e700]: s
            - generic [ref=e701]: t
          - generic [ref=e703]:
            - generic [ref=e704]: h
            - generic [ref=e705]: i
            - generic [ref=e706]: s
          - generic [ref=e708]:
            - generic [ref=e709]: b
            - generic [ref=e710]: r
            - generic [ref=e711]: o
            - generic [ref=e712]: w
            - generic [ref=e713]: "n"
          - generic [ref=e715]:
            - generic [ref=e716]: h
            - generic [ref=e717]: e
            - generic [ref=e718]: l
            - generic [ref=e719]: p
          - generic [ref=e721]:
            - generic [ref=e722]: f
            - generic [ref=e723]: o
            - generic [ref=e724]: r
          - generic [ref=e726]:
            - generic [ref=e727]: s
            - generic [ref=e728]: o
            - generic [ref=e729]: u
            - generic [ref=e730]: "n"
            - generic [ref=e731]: d
          - generic [ref=e733]:
            - generic [ref=e734]: t
            - generic [ref=e735]: h
            - generic [ref=e736]: i
            - generic [ref=e737]: "n"
            - generic [ref=e738]: k
          - generic [ref=e740]:
            - generic [ref=e741]: p
            - generic [ref=e742]: l
            - generic [ref=e743]: a
            - generic [ref=e744]: i
            - generic [ref=e745]: "n"
          - generic [ref=e747]:
            - generic [ref=e748]: h
            - generic [ref=e749]: o
            - generic [ref=e750]: l
            - generic [ref=e751]: d
          - generic [ref=e753]:
            - generic [ref=e754]: k
            - generic [ref=e755]: e
            - generic [ref=e756]: "y"
          - generic [ref=e758]:
            - generic [ref=e759]: g
            - generic [ref=e760]: r
            - generic [ref=e761]: a
            - generic [ref=e762]: s
            - generic [ref=e763]: s
          - generic [ref=e765]:
            - generic [ref=e766]: b
            - generic [ref=e767]: l
            - generic [ref=e768]: a
            - generic [ref=e769]: c
            - generic [ref=e770]: k
          - generic [ref=e772]:
            - generic [ref=e773]: s
            - generic [ref=e774]: t
            - generic [ref=e775]: a
            - generic [ref=e776]: i
            - generic [ref=e777]: r
          - generic [ref=e779]:
            - generic [ref=e780]: i
            - generic [ref=e781]: "n"
            - generic [ref=e782]: t
            - generic [ref=e783]: o
          - generic [ref=e785]:
            - generic [ref=e786]: t
            - generic [ref=e787]: e
            - generic [ref=e788]: a
            - generic [ref=e789]: m
          - generic [ref=e791]:
            - generic [ref=e792]: s
            - generic [ref=e793]: t
            - generic [ref=e794]: a
            - generic [ref=e795]: i
            - generic [ref=e796]: r
          - generic [ref=e798]:
            - generic [ref=e799]: s
            - generic [ref=e800]: o
            - generic [ref=e801]: u
            - generic [ref=e802]: t
            - generic [ref=e803]: h
          - generic [ref=e805]:
            - generic [ref=e806]: e
            - generic [ref=e807]: a
            - generic [ref=e808]: t
          - generic [ref=e810]:
            - generic [ref=e811]: e
            - generic [ref=e812]: "n"
            - generic [ref=e813]: d
          - generic [ref=e815]:
            - generic [ref=e816]: h
            - generic [ref=e817]: e
          - generic [ref=e819]:
            - generic [ref=e820]: r
            - generic [ref=e821]: a
            - generic [ref=e822]: t
            - generic [ref=e823]: e
          - generic [ref=e825]:
            - generic [ref=e826]: s
            - generic [ref=e827]: i
            - generic [ref=e828]: m
            - generic [ref=e829]: p
            - generic [ref=e830]: l
            - generic [ref=e831]: e
          - generic [ref=e833]:
            - generic [ref=e834]: "y"
            - generic [ref=e835]: o
            - generic [ref=e836]: u
            - generic [ref=e837]: "n"
            - generic [ref=e838]: g
          - generic [ref=e840]:
            - generic [ref=e841]: a
            - generic [ref=e842]: "n"
            - generic [ref=e843]: t
          - generic [ref=e845]:
            - generic [ref=e846]: s
            - generic [ref=e847]: t
            - generic [ref=e848]: a
            - generic [ref=e849]: r
            - generic [ref=e850]: e
          - generic [ref=e852]:
            - generic [ref=e853]: "n"
            - generic [ref=e854]: a
            - generic [ref=e855]: t
            - generic [ref=e856]: i
            - generic [ref=e857]: o
            - generic [ref=e858]: "n"
          - generic [ref=e860]:
            - generic [ref=e861]: h
            - generic [ref=e862]: e
        - paragraph [ref=e863]: "Practice passage: let line where speed lane me true let up true point fine for ration think street happy head ration happy very nation small race thank state world grand send three when stone tent tan joke story is other most where window retain close made person own his over point water era young riot simple left white rent heart word sky tan why only walk there low clean ship star show each red forge neon spring name paper race dear when there yet no night save down many draw hope root so plain star rest his brown help for sound think plain hold key grass black stair into team stair south eat end he rate simple young ant stare nation he"
        - textbox "Typing input" [active] [ref=e864]
      - generic [ref=e866]:
        - paragraph [ref=e867]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e868]
      - generic [ref=e869]:
        - paragraph [ref=e870]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e871]:
          - button "Restart with new text" [ref=e872]
          - button "Show accessible text editor" [ref=e876]
          - button "Finish" [disabled] [ref=e880]
      - status [ref=e883]: Ready to type
  - contentinfo [ref=e884]:
    - generic [ref=e885]:
      - generic [ref=e886]: A little practice. Lasting progress.
      - generic [ref=e889]:
        - link "About & metrics" [ref=e890]:
          - /url: /about
        - link "Preferences & data" [ref=e891]:
          - /url: /settings
        - generic [ref=e892]: Typing Forge © 2026
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