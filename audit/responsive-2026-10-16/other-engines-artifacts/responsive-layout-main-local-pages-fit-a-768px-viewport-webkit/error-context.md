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
            - generic [ref=e116]: w
            - generic [ref=e117]: e
            - generic [ref=e118]: l
            - generic [ref=e119]: l
          - generic [ref=e121]:
            - generic [ref=e122]: l
            - generic [ref=e123]: a
            - generic [ref=e124]: t
            - generic [ref=e125]: e
          - generic [ref=e127]:
            - generic [ref=e128]: t
            - generic [ref=e129]: h
            - generic [ref=e130]: e
          - generic [ref=e132]:
            - generic [ref=e133]: e
            - generic [ref=e134]: a
            - generic [ref=e135]: r
            - generic [ref=e136]: l
            - generic [ref=e137]: "y"
          - generic [ref=e139]:
            - generic [ref=e140]: r
            - generic [ref=e141]: o
            - generic [ref=e142]: u
            - generic [ref=e143]: "n"
            - generic [ref=e144]: d
          - generic [ref=e146]:
            - generic [ref=e147]: g
            - generic [ref=e148]: r
            - generic [ref=e149]: o
            - generic [ref=e150]: w
          - generic [ref=e152]:
            - generic [ref=e153]: w
            - generic [ref=e154]: h
            - generic [ref=e155]: "y"
          - generic [ref=e157]:
            - generic [ref=e158]: j
            - generic [ref=e159]: o
            - generic [ref=e160]: k
            - generic [ref=e161]: e
          - generic [ref=e163]:
            - generic [ref=e164]: a
            - generic [ref=e165]: r
            - generic [ref=e166]: e
          - generic [ref=e168]:
            - generic [ref=e169]: b
            - generic [ref=e170]: o
            - generic [ref=e171]: o
            - generic [ref=e172]: k
          - generic [ref=e174]:
            - generic [ref=e175]: a
            - generic [ref=e176]: r
            - generic [ref=e177]: i
            - generic [ref=e178]: s
            - generic [ref=e179]: e
          - generic [ref=e181]:
            - generic [ref=e182]: s
            - generic [ref=e183]: o
            - generic [ref=e184]: m
            - generic [ref=e185]: e
          - generic [ref=e187]:
            - generic [ref=e188]: g
            - generic [ref=e189]: u
            - generic [ref=e190]: i
            - generic [ref=e191]: d
            - generic [ref=e192]: e
          - generic [ref=e194]:
            - generic [ref=e195]: d
            - generic [ref=e196]: r
            - generic [ref=e197]: a
            - generic [ref=e198]: w
          - generic [ref=e200]:
            - generic [ref=e201]: g
            - generic [ref=e202]: r
            - generic [ref=e203]: e
            - generic [ref=e204]: e
            - generic [ref=e205]: "n"
          - generic [ref=e207]:
            - generic [ref=e208]: "n"
            - generic [ref=e209]: o
            - generic [ref=e210]: r
            - generic [ref=e211]: t
            - generic [ref=e212]: h
          - generic [ref=e214]:
            - generic [ref=e215]: v
            - generic [ref=e216]: i
            - generic [ref=e217]: e
            - generic [ref=e218]: w
          - generic [ref=e220]:
            - generic [ref=e221]: g
            - generic [ref=e222]: a
            - generic [ref=e223]: m
            - generic [ref=e224]: e
          - generic [ref=e226]:
            - generic [ref=e227]: w
            - generic [ref=e228]: i
            - generic [ref=e229]: "n"
            - generic [ref=e230]: d
            - generic [ref=e231]: o
            - generic [ref=e232]: w
          - generic [ref=e234]:
            - generic [ref=e235]: t
            - generic [ref=e236]: h
            - generic [ref=e237]: a
            - generic [ref=e238]: "n"
          - generic [ref=e240]:
            - generic [ref=e241]: t
            - generic [ref=e242]: a
            - generic [ref=e243]: "n"
          - generic [ref=e245]:
            - generic [ref=e246]: s
            - generic [ref=e247]: a
            - generic [ref=e248]: f
            - generic [ref=e249]: e
          - generic [ref=e251]:
            - generic [ref=e252]: s
            - generic [ref=e253]: k
            - generic [ref=e254]: "y"
          - generic [ref=e256]:
            - generic [ref=e257]: s
            - generic [ref=e258]: t
            - generic [ref=e259]: a
            - generic [ref=e260]: r
          - generic [ref=e262]:
            - generic [ref=e263]: b
            - generic [ref=e264]: r
            - generic [ref=e265]: i
            - generic [ref=e266]: "n"
            - generic [ref=e267]: g
          - generic [ref=e269]:
            - generic [ref=e270]: t
            - generic [ref=e271]: h
            - generic [ref=e272]: e
            - generic [ref=e273]: "n"
          - generic [ref=e275]:
            - generic [ref=e276]: h
            - generic [ref=e277]: a
            - generic [ref=e278]: s
          - generic [ref=e280]:
            - generic [ref=e281]: t
            - generic [ref=e282]: h
            - generic [ref=e283]: a
            - generic [ref=e284]: t
          - generic [ref=e286]:
            - generic [ref=e287]: w
            - generic [ref=e288]: e
            - generic [ref=e289]: e
            - generic [ref=e290]: k
          - generic [ref=e292]:
            - generic [ref=e293]: "n"
            - generic [ref=e294]: e
            - generic [ref=e295]: s
            - generic [ref=e296]: t
          - generic [ref=e298]:
            - generic [ref=e299]: s
            - generic [ref=e300]: k
            - generic [ref=e301]: "y"
          - generic [ref=e303]:
            - generic [ref=e304]: b
            - generic [ref=e305]: r
            - generic [ref=e306]: i
            - generic [ref=e307]: g
            - generic [ref=e308]: h
            - generic [ref=e309]: t
          - generic [ref=e311]:
            - generic [ref=e312]: w
            - generic [ref=e313]: i
            - generic [ref=e314]: d
            - generic [ref=e315]: e
          - generic [ref=e317]:
            - generic [ref=e318]: s
            - generic [ref=e319]: p
            - generic [ref=e320]: a
            - generic [ref=e321]: c
            - generic [ref=e322]: e
          - generic [ref=e324]:
            - generic [ref=e325]: "y"
            - generic [ref=e326]: e
            - generic [ref=e327]: a
            - generic [ref=e328]: r
          - generic [ref=e330]:
            - generic [ref=e331]: "n"
            - generic [ref=e332]: e
            - generic [ref=e333]: s
            - generic [ref=e334]: t
          - generic [ref=e336]:
            - generic [ref=e337]: w
            - generic [ref=e338]: i
            - generic [ref=e339]: s
            - generic [ref=e340]: h
          - generic [ref=e342]:
            - generic [ref=e343]: s
            - generic [ref=e344]: a
            - generic [ref=e345]: m
            - generic [ref=e346]: e
          - generic [ref=e348]:
            - generic [ref=e349]: r
            - generic [ref=e350]: i
            - generic [ref=e351]: o
            - generic [ref=e352]: t
          - generic [ref=e354]:
            - generic [ref=e355]: l
            - generic [ref=e356]: o
            - generic [ref=e357]: v
            - generic [ref=e358]: e
          - generic [ref=e360]:
            - generic [ref=e361]: p
            - generic [ref=e362]: l
            - generic [ref=e363]: e
            - generic [ref=e364]: a
            - generic [ref=e365]: s
            - generic [ref=e366]: e
          - generic [ref=e368]:
            - generic [ref=e369]: a
            - generic [ref=e370]: "n"
            - generic [ref=e371]: t
            - generic [ref=e372]: e
          - generic [ref=e374]:
            - generic [ref=e375]: "y"
            - generic [ref=e376]: o
            - generic [ref=e377]: u
            - generic [ref=e378]: r
          - generic [ref=e380]:
            - generic [ref=e381]: w
            - generic [ref=e382]: e
            - generic [ref=e383]: l
            - generic [ref=e384]: l
          - generic [ref=e386]:
            - generic [ref=e387]: s
            - generic [ref=e388]: u
            - generic [ref=e389]: "n"
          - generic [ref=e391]:
            - generic [ref=e392]: f
            - generic [ref=e393]: i
            - generic [ref=e394]: "n"
            - generic [ref=e395]: e
          - generic [ref=e397]:
            - generic [ref=e398]: t
            - generic [ref=e399]: e
            - generic [ref=e400]: "n"
          - generic [ref=e402]:
            - generic [ref=e403]: r
            - generic [ref=e404]: o
            - generic [ref=e405]: o
            - generic [ref=e406]: t
          - generic [ref=e408]:
            - generic [ref=e409]: w
            - generic [ref=e410]: h
            - generic [ref=e411]: e
            - generic [ref=e412]: "n"
          - generic [ref=e414]:
            - generic [ref=e415]: t
            - generic [ref=e416]: w
            - generic [ref=e417]: o
          - generic [ref=e419]:
            - generic [ref=e420]: p
            - generic [ref=e421]: a
            - generic [ref=e422]: r
            - generic [ref=e423]: t
          - generic [ref=e425]:
            - generic [ref=e426]: w
            - generic [ref=e427]: h
            - generic [ref=e428]: "y"
          - generic [ref=e430]:
            - generic [ref=e431]: h
            - generic [ref=e432]: o
            - generic [ref=e433]: p
            - generic [ref=e434]: e
          - generic [ref=e436]:
            - generic [ref=e437]: e
            - generic [ref=e438]: a
            - generic [ref=e439]: c
            - generic [ref=e440]: h
          - generic [ref=e442]:
            - generic [ref=e443]: "y"
            - generic [ref=e444]: e
            - generic [ref=e445]: l
            - generic [ref=e446]: l
            - generic [ref=e447]: o
            - generic [ref=e448]: w
          - generic [ref=e450]:
            - generic [ref=e451]: p
            - generic [ref=e452]: a
            - generic [ref=e453]: t
            - generic [ref=e454]: h
          - generic [ref=e456]:
            - generic [ref=e457]: "y"
            - generic [ref=e458]: o
            - generic [ref=e459]: u
            - generic [ref=e460]: r
          - generic [ref=e462]:
            - generic [ref=e463]: t
            - generic [ref=e464]: e
            - generic [ref=e465]: a
            - generic [ref=e466]: r
          - generic [ref=e468]:
            - generic [ref=e469]: k
            - generic [ref=e470]: e
            - generic [ref=e471]: "y"
          - generic [ref=e473]:
            - generic [ref=e474]: s
            - generic [ref=e475]: t
            - generic [ref=e476]: o
            - generic [ref=e477]: "n"
            - generic [ref=e478]: e
          - generic [ref=e480]:
            - generic [ref=e481]: t
            - generic [ref=e482]: a
            - generic [ref=e483]: "n"
          - generic [ref=e485]:
            - generic [ref=e486]: s
            - generic [ref=e487]: t
            - generic [ref=e488]: u
            - generic [ref=e489]: d
            - generic [ref=e490]: "y"
          - generic [ref=e492]:
            - generic [ref=e493]: f
            - generic [ref=e494]: l
            - generic [ref=e495]: o
            - generic [ref=e496]: w
          - generic [ref=e498]:
            - generic [ref=e499]: m
            - generic [ref=e500]: a
            - generic [ref=e501]: "y"
          - generic [ref=e503]:
            - generic [ref=e504]: m
            - generic [ref=e505]: a
            - generic [ref=e506]: i
            - generic [ref=e507]: "n"
          - generic [ref=e509]:
            - generic [ref=e510]: a
            - generic [ref=e511]: r
            - generic [ref=e512]: e
          - generic [ref=e514]:
            - generic [ref=e515]: t
            - generic [ref=e516]: e
            - generic [ref=e517]: a
            - generic [ref=e518]: m
          - generic [ref=e520]:
            - generic [ref=e521]: s
            - generic [ref=e522]: o
            - generic [ref=e523]: o
            - generic [ref=e524]: t
          - generic [ref=e526]:
            - generic [ref=e527]: u
            - generic [ref=e528]: s
          - generic [ref=e530]:
            - generic [ref=e531]: "n"
            - generic [ref=e532]: o
            - generic [ref=e533]: r
            - generic [ref=e534]: t
            - generic [ref=e535]: h
          - generic [ref=e537]:
            - generic [ref=e538]: r
            - generic [ref=e539]: u
            - generic [ref=e540]: "n"
          - generic [ref=e542]:
            - generic [ref=e543]: s
            - generic [ref=e544]: i
            - generic [ref=e545]: x
          - generic [ref=e547]:
            - generic [ref=e548]: f
            - generic [ref=e549]: a
            - generic [ref=e550]: s
            - generic [ref=e551]: t
          - generic [ref=e553]:
            - generic [ref=e554]: t
            - generic [ref=e555]: h
            - generic [ref=e556]: r
            - generic [ref=e557]: o
            - generic [ref=e558]: u
            - generic [ref=e559]: g
            - generic [ref=e560]: h
          - generic [ref=e562]:
            - generic [ref=e563]: p
            - generic [ref=e564]: a
            - generic [ref=e565]: r
            - generic [ref=e566]: t
          - generic [ref=e568]:
            - generic [ref=e569]: w
            - generic [ref=e570]: i
            - generic [ref=e571]: "n"
            - generic [ref=e572]: d
          - generic [ref=e574]:
            - generic [ref=e575]: s
            - generic [ref=e576]: o
            - generic [ref=e577]: r
            - generic [ref=e578]: t
          - generic [ref=e580]:
            - generic [ref=e581]: g
            - generic [ref=e582]: o
            - generic [ref=e583]: o
            - generic [ref=e584]: d
          - generic [ref=e586]:
            - generic [ref=e587]: l
            - generic [ref=e588]: i
            - generic [ref=e589]: g
            - generic [ref=e590]: h
            - generic [ref=e591]: t
          - generic [ref=e593]:
            - generic [ref=e594]: e
            - generic [ref=e595]: a
            - generic [ref=e596]: r
            - generic [ref=e597]: "n"
          - generic [ref=e599]:
            - generic [ref=e600]: h
            - generic [ref=e601]: o
            - generic [ref=e602]: u
            - generic [ref=e603]: s
            - generic [ref=e604]: e
          - generic [ref=e606]:
            - generic [ref=e607]: c
            - generic [ref=e608]: o
            - generic [ref=e609]: m
            - generic [ref=e610]: e
          - generic [ref=e612]:
            - generic [ref=e613]: s
            - generic [ref=e614]: a
            - generic [ref=e615]: "y"
          - generic [ref=e617]:
            - generic [ref=e618]: s
            - generic [ref=e619]: t
            - generic [ref=e620]: o
            - generic [ref=e621]: r
            - generic [ref=e622]: "y"
          - generic [ref=e624]:
            - generic [ref=e625]: t
            - generic [ref=e626]: r
            - generic [ref=e627]: a
            - generic [ref=e628]: i
            - generic [ref=e629]: "n"
          - generic [ref=e631]:
            - generic [ref=e632]: w
            - generic [ref=e633]: o
            - generic [ref=e634]: r
            - generic [ref=e635]: l
            - generic [ref=e636]: d
          - generic [ref=e638]:
            - generic [ref=e639]: e
            - generic [ref=e640]: "y"
            - generic [ref=e641]: e
          - generic [ref=e643]:
            - generic [ref=e644]: t
            - generic [ref=e645]: h
            - generic [ref=e646]: a
            - generic [ref=e647]: "n"
          - generic [ref=e649]:
            - generic [ref=e650]: "n"
            - generic [ref=e651]: o
          - generic [ref=e653]:
            - generic [ref=e654]: o
            - generic [ref=e655]: r
          - generic [ref=e657]:
            - generic [ref=e658]: s
            - generic [ref=e659]: t
            - generic [ref=e660]: o
            - generic [ref=e661]: r
            - generic [ref=e662]: "y"
          - generic [ref=e664]:
            - generic [ref=e665]: m
            - generic [ref=e666]: o
            - generic [ref=e667]: r
            - generic [ref=e668]: e
          - generic [ref=e670]:
            - generic [ref=e671]: p
            - generic [ref=e672]: a
            - generic [ref=e673]: r
            - generic [ref=e674]: k
          - generic [ref=e676]:
            - generic [ref=e677]: "y"
            - generic [ref=e678]: e
            - generic [ref=e679]: s
          - generic [ref=e681]:
            - generic [ref=e682]: p
            - generic [ref=e683]: i
            - generic [ref=e684]: "n"
            - generic [ref=e685]: k
          - generic [ref=e687]:
            - generic [ref=e688]: s
            - generic [ref=e689]: m
            - generic [ref=e690]: i
            - generic [ref=e691]: l
            - generic [ref=e692]: e
          - generic [ref=e694]:
            - generic [ref=e695]: t
            - generic [ref=e696]: r
            - generic [ref=e697]: e
            - generic [ref=e698]: e
          - generic [ref=e700]:
            - generic [ref=e701]: f
            - generic [ref=e702]: i
            - generic [ref=e703]: "n"
            - generic [ref=e704]: d
          - generic [ref=e706]:
            - generic [ref=e707]: p
            - generic [ref=e708]: a
            - generic [ref=e709]: p
            - generic [ref=e710]: e
            - generic [ref=e711]: r
          - generic [ref=e713]:
            - generic [ref=e714]: t
            - generic [ref=e715]: o
            - generic [ref=e716]: "n"
          - generic [ref=e718]:
            - generic [ref=e719]: f
            - generic [ref=e720]: o
            - generic [ref=e721]: o
            - generic [ref=e722]: d
          - generic [ref=e724]:
            - generic [ref=e725]: i
            - generic [ref=e726]: "n"
            - generic [ref=e727]: "n"
            - generic [ref=e728]: a
            - generic [ref=e729]: t
            - generic [ref=e730]: e
          - generic [ref=e732]:
            - generic [ref=e733]: f
            - generic [ref=e734]: a
            - generic [ref=e735]: s
            - generic [ref=e736]: t
          - generic [ref=e738]:
            - generic [ref=e739]: f
            - generic [ref=e740]: l
            - generic [ref=e741]: o
            - generic [ref=e742]: w
          - generic [ref=e744]:
            - generic [ref=e745]: t
            - generic [ref=e746]: e
            - generic [ref=e747]: e
            - generic [ref=e748]: "n"
          - generic [ref=e750]:
            - generic [ref=e751]: t
            - generic [ref=e752]: h
            - generic [ref=e753]: e
            - generic [ref=e754]: i
            - generic [ref=e755]: r
          - generic [ref=e757]:
            - generic [ref=e758]: t
            - generic [ref=e759]: e
            - generic [ref=e760]: "n"
          - generic [ref=e762]:
            - generic [ref=e763]: g
            - generic [ref=e764]: o
          - generic [ref=e766]:
            - generic [ref=e767]: s
            - generic [ref=e768]: m
            - generic [ref=e769]: i
            - generic [ref=e770]: l
            - generic [ref=e771]: e
          - generic [ref=e773]:
            - generic [ref=e774]: d
            - generic [ref=e775]: a
            - generic [ref=e776]: "y"
          - generic [ref=e778]:
            - generic [ref=e779]: t
            - generic [ref=e780]: i
            - generic [ref=e781]: e
          - generic [ref=e783]:
            - generic [ref=e784]: h
            - generic [ref=e785]: i
            - generic [ref=e786]: s
          - generic [ref=e788]:
            - generic [ref=e789]: s
            - generic [ref=e790]: e
            - generic [ref=e791]: e
            - generic [ref=e792]: d
          - generic [ref=e794]:
            - generic [ref=e795]: t
            - generic [ref=e796]: o
            - generic [ref=e797]: w
            - generic [ref=e798]: "n"
          - generic [ref=e800]:
            - generic [ref=e801]: w
            - generic [ref=e802]: e
            - generic [ref=e803]: s
            - generic [ref=e804]: t
          - generic [ref=e806]:
            - generic [ref=e807]: s
            - generic [ref=e808]: o
            - generic [ref=e809]: m
            - generic [ref=e810]: e
          - generic [ref=e812]:
            - generic [ref=e813]: p
            - generic [ref=e814]: a
            - generic [ref=e815]: t
            - generic [ref=e816]: h
          - generic [ref=e818]:
            - generic [ref=e819]: s
            - generic [ref=e820]: t
            - generic [ref=e821]: a
            - generic [ref=e822]: t
            - generic [ref=e823]: e
          - generic [ref=e825]:
            - generic [ref=e826]: t
            - generic [ref=e827]: h
            - generic [ref=e828]: i
            - generic [ref=e829]: "n"
            - generic [ref=e830]: g
          - generic [ref=e832]:
            - generic [ref=e833]: l
            - generic [ref=e834]: i
            - generic [ref=e835]: g
            - generic [ref=e836]: h
            - generic [ref=e837]: t
        - paragraph [ref=e838]: "Practice passage: well late the early round grow why joke are book arise some guide draw green north view game window than tan safe sky star bring then has that week nest sky bright wide space year nest wish same riot love please ante your well sun fine ten root when two part why hope each yellow path your tear key stone tan study flow may main are team soot us north run six fast through part wind sort good light earn house come say story train world eye than no or story more park yes pink smile tree find paper ton food innate fast flow teen their ten go smile day tie his seed town west some path state thing light"
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