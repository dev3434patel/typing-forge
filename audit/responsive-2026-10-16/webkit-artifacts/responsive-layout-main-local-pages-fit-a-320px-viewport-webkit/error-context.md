# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> main local pages fit a 320px viewport
- Location: e2e\responsive-layout.spec.ts:26:3

# Error details

```
Error: http://127.0.0.1:4173/

expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
-   "body": 273,
+   "body": 272,
    "document": 273,
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
            - generic [ref=e109]: r
            - generic [ref=e110]: e
            - generic [ref=e111]: "n"
            - generic [ref=e112]: t
          - generic [ref=e114]:
            - generic [ref=e115]: f
            - generic [ref=e116]: o
            - generic [ref=e117]: o
            - generic [ref=e118]: t
          - generic [ref=e120]:
            - generic [ref=e121]: d
            - generic [ref=e122]: o
            - generic [ref=e123]: o
            - generic [ref=e124]: r
          - generic [ref=e126]:
            - generic [ref=e127]: m
            - generic [ref=e128]: e
            - generic [ref=e129]: a
            - generic [ref=e130]: "n"
          - generic [ref=e132]:
            - generic [ref=e133]: a
            - generic [ref=e134]: "n"
          - generic [ref=e136]:
            - generic [ref=e137]: l
            - generic [ref=e138]: o
            - generic [ref=e139]: v
            - generic [ref=e140]: e
          - generic [ref=e142]:
            - generic [ref=e143]: "n"
            - generic [ref=e144]: e
            - generic [ref=e145]: s
            - generic [ref=e146]: t
          - generic [ref=e148]:
            - generic [ref=e149]: s
            - generic [ref=e150]: e
            - generic [ref=e151]: e
          - generic [ref=e153]:
            - generic [ref=e154]: s
            - generic [ref=e155]: t
            - generic [ref=e156]: o
            - generic [ref=e157]: p
          - generic [ref=e159]:
            - generic [ref=e160]: w
            - generic [ref=e161]: h
            - generic [ref=e162]: i
            - generic [ref=e163]: t
            - generic [ref=e164]: e
          - generic [ref=e166]:
            - generic [ref=e167]: m
            - generic [ref=e168]: o
            - generic [ref=e169]: r
            - generic [ref=e170]: e
          - generic [ref=e172]:
            - generic [ref=e173]: f
            - generic [ref=e174]: o
            - generic [ref=e175]: c
            - generic [ref=e176]: u
            - generic [ref=e177]: s
          - generic [ref=e179]:
            - generic [ref=e180]: f
            - generic [ref=e181]: u
            - generic [ref=e182]: l
            - generic [ref=e183]: l
          - generic [ref=e185]:
            - generic [ref=e186]: s
            - generic [ref=e187]: o
          - generic [ref=e189]:
            - generic [ref=e190]: r
            - generic [ref=e191]: e
            - generic [ref=e192]: d
          - generic [ref=e194]:
            - generic [ref=e195]: a
            - generic [ref=e196]: "n"
          - generic [ref=e198]:
            - generic [ref=e199]: s
            - generic [ref=e200]: t
            - generic [ref=e201]: i
            - generic [ref=e202]: l
            - generic [ref=e203]: l
          - generic [ref=e205]:
            - generic [ref=e206]: f
            - generic [ref=e207]: a
            - generic [ref=e208]: r
          - generic [ref=e210]:
            - generic [ref=e211]: "y"
            - generic [ref=e212]: e
            - generic [ref=e213]: l
            - generic [ref=e214]: l
            - generic [ref=e215]: o
            - generic [ref=e216]: w
          - generic [ref=e218]:
            - generic [ref=e219]: m
            - generic [ref=e220]: a
            - generic [ref=e221]: p
          - generic [ref=e223]:
            - generic [ref=e224]: h
            - generic [ref=e225]: a
            - generic [ref=e226]: r
            - generic [ref=e227]: d
          - generic [ref=e229]:
            - generic [ref=e230]: d
            - generic [ref=e231]: r
            - generic [ref=e232]: a
            - generic [ref=e233]: w
          - generic [ref=e235]:
            - generic [ref=e236]: t
            - generic [ref=e237]: h
            - generic [ref=e238]: r
            - generic [ref=e239]: e
            - generic [ref=e240]: e
          - generic [ref=e242]:
            - generic [ref=e243]: t
            - generic [ref=e244]: h
            - generic [ref=e245]: e
            - generic [ref=e246]: s
            - generic [ref=e247]: e
          - generic [ref=e249]:
            - generic [ref=e250]: s
            - generic [ref=e251]: o
            - generic [ref=e252]: u
            - generic [ref=e253]: "n"
            - generic [ref=e254]: d
          - generic [ref=e256]:
            - generic [ref=e257]: t
            - generic [ref=e258]: i
            - generic [ref=e259]: r
            - generic [ref=e260]: e
          - generic [ref=e262]:
            - generic [ref=e263]: w
            - generic [ref=e264]: h
            - generic [ref=e265]: "y"
          - generic [ref=e267]:
            - generic [ref=e268]: g
            - generic [ref=e269]: a
            - generic [ref=e270]: m
            - generic [ref=e271]: e
          - generic [ref=e273]:
            - generic [ref=e274]: o
            - generic [ref=e275]: p
            - generic [ref=e276]: e
            - generic [ref=e277]: "n"
          - generic [ref=e279]:
            - generic [ref=e280]: "y"
            - generic [ref=e281]: e
            - generic [ref=e282]: l
            - generic [ref=e283]: l
            - generic [ref=e284]: o
            - generic [ref=e285]: w
          - generic [ref=e287]:
            - generic [ref=e288]: w
            - generic [ref=e289]: a
            - generic [ref=e290]: t
            - generic [ref=e291]: e
            - generic [ref=e292]: r
          - generic [ref=e294]:
            - generic [ref=e295]: s
            - generic [ref=e296]: u
            - generic [ref=e297]: "n"
          - generic [ref=e299]:
            - generic [ref=e300]: s
            - generic [ref=e301]: t
            - generic [ref=e302]: e
            - generic [ref=e303]: p
          - generic [ref=e305]:
            - generic [ref=e306]: m
            - generic [ref=e307]: i
            - generic [ref=e308]: "n"
            - generic [ref=e309]: e
          - generic [ref=e311]:
            - generic [ref=e312]: o
            - generic [ref=e313]: u
            - generic [ref=e314]: r
          - generic [ref=e316]:
            - generic [ref=e317]: t
            - generic [ref=e318]: e
            - generic [ref=e319]: "n"
            - generic [ref=e320]: t
          - generic [ref=e322]:
            - generic [ref=e323]: s
            - generic [ref=e324]: t
            - generic [ref=e325]: u
            - generic [ref=e326]: d
            - generic [ref=e327]: "y"
          - generic [ref=e329]:
            - generic [ref=e330]: u
            - generic [ref=e331]: "n"
            - generic [ref=e332]: d
            - generic [ref=e333]: e
            - generic [ref=e334]: r
          - generic [ref=e336]:
            - generic [ref=e337]: h
            - generic [ref=e338]: a
            - generic [ref=e339]: p
            - generic [ref=e340]: p
            - generic [ref=e341]: "y"
          - generic [ref=e343]:
            - generic [ref=e344]: m
            - generic [ref=e345]: a
            - generic [ref=e346]: d
            - generic [ref=e347]: e
          - generic [ref=e349]:
            - generic [ref=e350]: g
            - generic [ref=e351]: i
            - generic [ref=e352]: v
            - generic [ref=e353]: e
          - generic [ref=e355]:
            - generic [ref=e356]: t
            - generic [ref=e357]: i
            - generic [ref=e358]: r
            - generic [ref=e359]: e
          - generic [ref=e361]:
            - generic [ref=e362]: f
            - generic [ref=e363]: r
            - generic [ref=e364]: e
            - generic [ref=e365]: e
          - generic [ref=e367]:
            - generic [ref=e368]: "n"
            - generic [ref=e369]: o
            - generic [ref=e370]: t
            - generic [ref=e371]: i
            - generic [ref=e372]: o
            - generic [ref=e373]: "n"
          - generic [ref=e375]:
            - generic [ref=e376]: s
            - generic [ref=e377]: e
            - generic [ref=e378]: "n"
            - generic [ref=e379]: d
          - generic [ref=e381]:
            - generic [ref=e382]: w
            - generic [ref=e383]: r
            - generic [ref=e384]: i
            - generic [ref=e385]: t
            - generic [ref=e386]: e
          - generic [ref=e388]:
            - generic [ref=e389]: o
            - generic [ref=e390]: f
            - generic [ref=e391]: f
          - generic [ref=e393]:
            - generic [ref=e394]: s
            - generic [ref=e395]: t
            - generic [ref=e396]: o
            - generic [ref=e397]: r
            - generic [ref=e398]: "y"
          - generic [ref=e400]:
            - generic [ref=e401]: f
            - generic [ref=e402]: i
            - generic [ref=e403]: "n"
            - generic [ref=e404]: d
          - generic [ref=e406]:
            - generic [ref=e407]: p
            - generic [ref=e408]: e
            - generic [ref=e409]: o
            - generic [ref=e410]: p
            - generic [ref=e411]: l
            - generic [ref=e412]: e
          - generic [ref=e414]:
            - generic [ref=e415]: l
            - generic [ref=e416]: a
            - generic [ref=e417]: r
            - generic [ref=e418]: g
            - generic [ref=e419]: e
          - generic [ref=e421]:
            - generic [ref=e422]: i
            - generic [ref=e423]: d
            - generic [ref=e424]: e
            - generic [ref=e425]: a
          - generic [ref=e427]:
            - generic [ref=e428]: r
            - generic [ref=e429]: o
            - generic [ref=e430]: u
            - generic [ref=e431]: "n"
            - generic [ref=e432]: d
          - generic [ref=e434]:
            - generic [ref=e435]: w
            - generic [ref=e436]: h
            - generic [ref=e437]: "y"
          - generic [ref=e439]:
            - generic [ref=e440]: e
            - generic [ref=e441]: a
            - generic [ref=e442]: r
            - generic [ref=e443]: t
            - generic [ref=e444]: h
          - generic [ref=e446]:
            - generic [ref=e447]: h
            - generic [ref=e448]: e
            - generic [ref=e449]: a
            - generic [ref=e450]: d
          - generic [ref=e452]:
            - generic [ref=e453]: i
            - generic [ref=e454]: "n"
          - generic [ref=e456]:
            - generic [ref=e457]: f
            - generic [ref=e458]: r
            - generic [ref=e459]: e
            - generic [ref=e460]: e
          - generic [ref=e462]:
            - generic [ref=e463]: k
            - generic [ref=e464]: e
            - generic [ref=e465]: e
            - generic [ref=e466]: "n"
          - generic [ref=e468]:
            - generic [ref=e469]: k
            - generic [ref=e470]: i
            - generic [ref=e471]: t
            - generic [ref=e472]: e
          - generic [ref=e474]:
            - generic [ref=e475]: s
            - generic [ref=e476]: e
            - generic [ref=e477]: a
          - generic [ref=e479]:
            - generic [ref=e480]: "n"
            - generic [ref=e481]: o
            - generic [ref=e482]: "n"
            - generic [ref=e483]: e
          - generic [ref=e485]:
            - generic [ref=e486]: e
            - generic [ref=e487]: a
            - generic [ref=e488]: c
            - generic [ref=e489]: h
          - generic [ref=e491]:
            - generic [ref=e492]: c
            - generic [ref=e493]: a
            - generic [ref=e494]: l
            - generic [ref=e495]: m
          - generic [ref=e497]:
            - generic [ref=e498]: s
            - generic [ref=e499]: h
            - generic [ref=e500]: e
          - generic [ref=e502]:
            - generic [ref=e503]: l
            - generic [ref=e504]: e
            - generic [ref=e505]: t
          - generic [ref=e507]:
            - generic [ref=e508]: s
            - generic [ref=e509]: t
            - generic [ref=e510]: a
            - generic [ref=e511]: r
            - generic [ref=e512]: t
          - generic [ref=e514]:
            - generic [ref=e515]: s
            - generic [ref=e516]: t
            - generic [ref=e517]: e
            - generic [ref=e518]: p
          - generic [ref=e520]:
            - generic [ref=e521]: l
            - generic [ref=e522]: a
            - generic [ref=e523]: t
            - generic [ref=e524]: e
            - generic [ref=e525]: r
          - generic [ref=e527]:
            - generic [ref=e528]: s
            - generic [ref=e529]: e
            - generic [ref=e530]: "n"
            - generic [ref=e531]: t
          - generic [ref=e533]:
            - generic [ref=e534]: "n"
            - generic [ref=e535]: o
            - generic [ref=e536]: t
          - generic [ref=e538]:
            - generic [ref=e539]: h
            - generic [ref=e540]: e
          - generic [ref=e542]:
            - generic [ref=e543]: a
            - generic [ref=e544]: r
            - generic [ref=e545]: e
          - generic [ref=e547]:
            - generic [ref=e548]: t
            - generic [ref=e549]: o
            - generic [ref=e550]: "n"
            - generic [ref=e551]: e
          - generic [ref=e553]:
            - generic [ref=e554]: h
            - generic [ref=e555]: e
          - generic [ref=e557]:
            - generic [ref=e558]: s
            - generic [ref=e559]: u
            - generic [ref=e560]: r
            - generic [ref=e561]: e
          - generic [ref=e563]:
            - generic [ref=e564]: t
            - generic [ref=e565]: h
            - generic [ref=e566]: e
            - generic [ref=e567]: "n"
          - generic [ref=e569]:
            - generic [ref=e570]: r
            - generic [ref=e571]: e
            - generic [ref=e572]: d
          - generic [ref=e574]:
            - generic [ref=e575]: w
            - generic [ref=e576]: a
            - generic [ref=e577]: "n"
            - generic [ref=e578]: t
          - generic [ref=e580]:
            - generic [ref=e581]: "n"
            - generic [ref=e582]: a
            - generic [ref=e583]: t
            - generic [ref=e584]: u
            - generic [ref=e585]: r
            - generic [ref=e586]: e
          - generic [ref=e588]:
            - generic [ref=e589]: v
            - generic [ref=e590]: e
            - generic [ref=e591]: r
            - generic [ref=e592]: "y"
          - generic [ref=e594]:
            - generic [ref=e595]: p
            - generic [ref=e596]: a
            - generic [ref=e597]: t
            - generic [ref=e598]: h
          - generic [ref=e600]:
            - generic [ref=e601]: w
            - generic [ref=e602]: h
            - generic [ref=e603]: o
          - generic [ref=e605]:
            - generic [ref=e606]: m
            - generic [ref=e607]: u
            - generic [ref=e608]: s
            - generic [ref=e609]: t
          - generic [ref=e611]:
            - generic [ref=e612]: p
            - generic [ref=e613]: a
            - generic [ref=e614]: i
            - generic [ref=e615]: r
          - generic [ref=e617]:
            - generic [ref=e618]: v
            - generic [ref=e619]: i
            - generic [ref=e620]: e
            - generic [ref=e621]: w
          - generic [ref=e623]:
            - generic [ref=e624]: g
            - generic [ref=e625]: r
            - generic [ref=e626]: e
            - generic [ref=e627]: a
            - generic [ref=e628]: t
          - generic [ref=e630]:
            - generic [ref=e631]: t
            - generic [ref=e632]: i
            - generic [ref=e633]: e
            - generic [ref=e634]: r
          - generic [ref=e636]:
            - generic [ref=e637]: s
            - generic [ref=e638]: p
            - generic [ref=e639]: a
            - generic [ref=e640]: c
            - generic [ref=e641]: e
          - generic [ref=e643]:
            - generic [ref=e644]: "n"
            - generic [ref=e645]: o
            - generic [ref=e646]: "n"
            - generic [ref=e647]: e
          - generic [ref=e649]:
            - generic [ref=e650]: c
            - generic [ref=e651]: l
            - generic [ref=e652]: o
            - generic [ref=e653]: s
            - generic [ref=e654]: e
          - generic [ref=e656]:
            - generic [ref=e657]: s
            - generic [ref=e658]: t
            - generic [ref=e659]: a
            - generic [ref=e660]: r
            - generic [ref=e661]: e
          - generic [ref=e663]:
            - generic [ref=e664]: s
            - generic [ref=e665]: m
            - generic [ref=e666]: a
            - generic [ref=e667]: l
            - generic [ref=e668]: l
          - generic [ref=e670]:
            - generic [ref=e671]: t
            - generic [ref=e672]: e
            - generic [ref=e673]: "n"
          - generic [ref=e675]:
            - generic [ref=e676]: t
            - generic [ref=e677]: h
            - generic [ref=e678]: o
            - generic [ref=e679]: u
            - generic [ref=e680]: g
            - generic [ref=e681]: h
            - generic [ref=e682]: t
          - generic [ref=e684]:
            - generic [ref=e685]: l
            - generic [ref=e686]: e
            - generic [ref=e687]: a
            - generic [ref=e688]: r
            - generic [ref=e689]: "n"
          - generic [ref=e691]:
            - generic [ref=e692]: s
            - generic [ref=e693]: e
            - generic [ref=e694]: "n"
            - generic [ref=e695]: t
          - generic [ref=e697]:
            - generic [ref=e698]: s
            - generic [ref=e699]: h
            - generic [ref=e700]: o
            - generic [ref=e701]: r
            - generic [ref=e702]: e
          - generic [ref=e704]:
            - generic [ref=e705]: s
            - generic [ref=e706]: e
            - generic [ref=e707]: "n"
            - generic [ref=e708]: t
          - generic [ref=e710]:
            - generic [ref=e711]: "n"
            - generic [ref=e712]: a
            - generic [ref=e713]: m
            - generic [ref=e714]: e
          - generic [ref=e716]:
            - generic [ref=e717]: s
            - generic [ref=e718]: h
            - generic [ref=e719]: i
            - generic [ref=e720]: "n"
            - generic [ref=e721]: e
          - generic [ref=e723]:
            - generic [ref=e724]: o
            - generic [ref=e725]: f
            - generic [ref=e726]: t
            - generic [ref=e727]: e
            - generic [ref=e728]: "n"
          - generic [ref=e730]:
            - generic [ref=e731]: b
            - generic [ref=e732]: u
            - generic [ref=e733]: i
            - generic [ref=e734]: l
            - generic [ref=e735]: d
          - generic [ref=e737]:
            - generic [ref=e738]: a
            - generic [ref=e739]: t
          - generic [ref=e741]:
            - generic [ref=e742]: w
            - generic [ref=e743]: o
            - generic [ref=e744]: m
            - generic [ref=e745]: a
            - generic [ref=e746]: "n"
          - generic [ref=e748]:
            - generic [ref=e749]: e
            - generic [ref=e750]: r
            - generic [ref=e751]: a
          - generic [ref=e753]:
            - generic [ref=e754]: a
            - generic [ref=e755]: i
            - generic [ref=e756]: r
          - generic [ref=e758]:
            - generic [ref=e759]: w
            - generic [ref=e760]: o
            - generic [ref=e761]: o
            - generic [ref=e762]: d
          - generic [ref=e764]:
            - generic [ref=e765]: l
            - generic [ref=e766]: a
            - generic [ref=e767]: r
            - generic [ref=e768]: g
            - generic [ref=e769]: e
          - generic [ref=e771]:
            - generic [ref=e772]: w
            - generic [ref=e773]: a
            - generic [ref=e774]: "n"
            - generic [ref=e775]: t
          - generic [ref=e777]:
            - generic [ref=e778]: d
            - generic [ref=e779]: a
            - generic [ref=e780]: r
            - generic [ref=e781]: k
          - generic [ref=e783]:
            - generic [ref=e784]: p
            - generic [ref=e785]: a
            - generic [ref=e786]: i
            - generic [ref=e787]: "n"
            - generic [ref=e788]: t
          - generic [ref=e790]:
            - generic [ref=e791]: f
            - generic [ref=e792]: e
            - generic [ref=e793]: e
            - generic [ref=e794]: l
          - generic [ref=e796]:
            - generic [ref=e797]: s
            - generic [ref=e798]: p
            - generic [ref=e799]: e
            - generic [ref=e800]: e
            - generic [ref=e801]: d
          - generic [ref=e803]:
            - generic [ref=e804]: f
            - generic [ref=e805]: o
            - generic [ref=e806]: o
            - generic [ref=e807]: t
          - generic [ref=e809]:
            - generic [ref=e810]: t
            - generic [ref=e811]: o
            - generic [ref=e812]: e
          - generic [ref=e814]:
            - generic [ref=e815]: s
            - generic [ref=e816]: l
            - generic [ref=e817]: o
            - generic [ref=e818]: w
          - generic [ref=e820]:
            - generic [ref=e821]: e
            - generic [ref=e822]: v
            - generic [ref=e823]: e
            - generic [ref=e824]: "n"
          - generic [ref=e826]:
            - generic [ref=e827]: w
            - generic [ref=e828]: a
            - generic [ref=e829]: t
            - generic [ref=e830]: e
            - generic [ref=e831]: r
          - generic [ref=e833]:
            - generic [ref=e834]: r
            - generic [ref=e835]: o
            - generic [ref=e836]: a
            - generic [ref=e837]: d
        - paragraph [ref=e838]: "Practice passage: rent foot door mean an love nest see stop white more focus full so red an still far yellow map hard draw three these sound tire why game open yellow water sun step mine our tent study under happy made give tire free notion send write off story find people large idea round why earth head in free keen kite sea none each calm she let start step later sent not he are tone he sure then red want nature very path who must pair view great tier space none close stare small ten thought learn sent shore sent name shine often build at woman era air wood large want dark paint feel speed foot toe slow even water road"
        - textbox "Typing input" [active] [ref=e839]
      - generic [ref=e841]:
        - paragraph [ref=e842]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e843]
      - generic [ref=e844]:
        - paragraph [ref=e845]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e846]:
          - button "Restart with new text" [ref=e847]
          - button "Show accessible text editor" [ref=e851]
          - button "Finish" [disabled] [ref=e855]
      - status [ref=e858]: Ready to type
  - contentinfo [ref=e859]:
    - generic [ref=e860]:
      - generic [ref=e861]: A little practice. Lasting progress.
      - generic [ref=e864]:
        - link "About & metrics" [ref=e865]:
          - /url: /about
        - link "Preferences & data" [ref=e866]:
          - /url: /settings
        - generic [ref=e867]: Typing Forge © 2026
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