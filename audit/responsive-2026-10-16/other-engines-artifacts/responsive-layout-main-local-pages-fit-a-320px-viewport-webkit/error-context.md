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
            - generic [ref=e109]: l
            - generic [ref=e110]: i
            - generic [ref=e111]: g
            - generic [ref=e112]: h
            - generic [ref=e113]: t
          - generic [ref=e115]:
            - generic [ref=e116]: d
            - generic [ref=e117]: r
            - generic [ref=e118]: a
            - generic [ref=e119]: w
          - generic [ref=e121]:
            - generic [ref=e122]: c
            - generic [ref=e123]: l
            - generic [ref=e124]: e
            - generic [ref=e125]: a
            - generic [ref=e126]: "n"
          - generic [ref=e128]:
            - generic [ref=e129]: p
            - generic [ref=e130]: a
            - generic [ref=e131]: g
            - generic [ref=e132]: e
          - generic [ref=e134]:
            - generic [ref=e135]: s
            - generic [ref=e136]: a
            - generic [ref=e137]: "y"
          - generic [ref=e139]:
            - generic [ref=e140]: e
            - generic [ref=e141]: "y"
            - generic [ref=e142]: e
          - generic [ref=e144]:
            - generic [ref=e145]: "y"
            - generic [ref=e146]: o
            - generic [ref=e147]: u
            - generic [ref=e148]: r
          - generic [ref=e150]:
            - generic [ref=e151]: m
            - generic [ref=e152]: a
            - generic [ref=e153]: d
            - generic [ref=e154]: e
          - generic [ref=e156]:
            - generic [ref=e157]: p
            - generic [ref=e158]: a
            - generic [ref=e159]: i
            - generic [ref=e160]: "n"
            - generic [ref=e161]: t
          - generic [ref=e163]:
            - generic [ref=e164]: h
            - generic [ref=e165]: a
            - generic [ref=e166]: r
            - generic [ref=e167]: d
          - generic [ref=e169]:
            - generic [ref=e170]: s
            - generic [ref=e171]: p
            - generic [ref=e172]: e
            - generic [ref=e173]: a
            - generic [ref=e174]: k
          - generic [ref=e176]:
            - generic [ref=e177]: f
            - generic [ref=e178]: o
            - generic [ref=e179]: r
            - generic [ref=e180]: g
            - generic [ref=e181]: e
          - generic [ref=e183]:
            - generic [ref=e184]: r
            - generic [ref=e185]: e
            - generic [ref=e186]: d
          - generic [ref=e188]:
            - generic [ref=e189]: o
            - generic [ref=e190]: a
            - generic [ref=e191]: t
          - generic [ref=e193]:
            - generic [ref=e194]: j
            - generic [ref=e195]: u
            - generic [ref=e196]: m
            - generic [ref=e197]: p
          - generic [ref=e199]:
            - generic [ref=e200]: s
            - generic [ref=e201]: a
            - generic [ref=e202]: v
            - generic [ref=e203]: e
          - generic [ref=e205]:
            - generic [ref=e206]: a
            - generic [ref=e207]: "n"
            - generic [ref=e208]: t
          - generic [ref=e210]:
            - generic [ref=e211]: s
            - generic [ref=e212]: p
            - generic [ref=e213]: r
            - generic [ref=e214]: i
            - generic [ref=e215]: "n"
            - generic [ref=e216]: g
          - generic [ref=e218]:
            - generic [ref=e219]: l
            - generic [ref=e220]: i
            - generic [ref=e221]: "n"
            - generic [ref=e222]: e
          - generic [ref=e224]:
            - generic [ref=e225]: s
            - generic [ref=e226]: t
            - generic [ref=e227]: o
            - generic [ref=e228]: r
            - generic [ref=e229]: "y"
          - generic [ref=e231]:
            - generic [ref=e232]: w
            - generic [ref=e233]: o
            - generic [ref=e234]: r
            - generic [ref=e235]: l
            - generic [ref=e236]: d
          - generic [ref=e238]:
            - generic [ref=e239]: h
            - generic [ref=e240]: a
            - generic [ref=e241]: r
            - generic [ref=e242]: d
          - generic [ref=e244]:
            - generic [ref=e245]: a
            - generic [ref=e246]: t
            - generic [ref=e247]: t
            - generic [ref=e248]: e
            - generic [ref=e249]: "n"
            - generic [ref=e250]: t
            - generic [ref=e251]: i
            - generic [ref=e252]: o
            - generic [ref=e253]: "n"
          - generic [ref=e255]:
            - generic [ref=e256]: t
            - generic [ref=e257]: r
            - generic [ref=e258]: u
            - generic [ref=e259]: e
          - generic [ref=e261]:
            - generic [ref=e262]: f
            - generic [ref=e263]: i
            - generic [ref=e264]: r
            - generic [ref=e265]: s
            - generic [ref=e266]: t
          - generic [ref=e268]:
            - generic [ref=e269]: l
            - generic [ref=e270]: i
            - generic [ref=e271]: "n"
            - generic [ref=e272]: e
          - generic [ref=e274]:
            - generic [ref=e275]: p
            - generic [ref=e276]: i
            - generic [ref=e277]: "n"
            - generic [ref=e278]: k
          - generic [ref=e280]:
            - generic [ref=e281]: q
            - generic [ref=e282]: u
            - generic [ref=e283]: i
            - generic [ref=e284]: c
            - generic [ref=e285]: k
          - generic [ref=e287]:
            - generic [ref=e288]: z
            - generic [ref=e289]: o
            - generic [ref=e290]: "n"
            - generic [ref=e291]: e
          - generic [ref=e293]:
            - generic [ref=e294]: e
            - generic [ref=e295]: "n"
            - generic [ref=e296]: d
          - generic [ref=e298]:
            - generic [ref=e299]: g
            - generic [ref=e300]: o
            - generic [ref=e301]: l
            - generic [ref=e302]: d
          - generic [ref=e304]:
            - generic [ref=e305]: s
            - generic [ref=e306]: h
            - generic [ref=e307]: o
            - generic [ref=e308]: r
            - generic [ref=e309]: t
          - generic [ref=e311]:
            - generic [ref=e312]: t
            - generic [ref=e313]: i
            - generic [ref=e314]: e
            - generic [ref=e315]: r
          - generic [ref=e317]:
            - generic [ref=e318]: o
            - generic [ref=e319]: r
          - generic [ref=e321]:
            - generic [ref=e322]: o
            - generic [ref=e323]: u
            - generic [ref=e324]: t
          - generic [ref=e326]:
            - generic [ref=e327]: h
            - generic [ref=e328]: o
            - generic [ref=e329]: p
            - generic [ref=e330]: e
          - generic [ref=e332]:
            - generic [ref=e333]: w
            - generic [ref=e334]: i
            - generic [ref=e335]: t
            - generic [ref=e336]: h
          - generic [ref=e338]:
            - generic [ref=e339]: z
            - generic [ref=e340]: i
            - generic [ref=e341]: "n"
            - generic [ref=e342]: c
          - generic [ref=e344]:
            - generic [ref=e345]: t
            - generic [ref=e346]: i
            - generic [ref=e347]: "n"
          - generic [ref=e349]:
            - generic [ref=e350]: s
            - generic [ref=e351]: t
            - generic [ref=e352]: a
            - generic [ref=e353]: "n"
            - generic [ref=e354]: d
          - generic [ref=e356]:
            - generic [ref=e357]: w
            - generic [ref=e358]: h
            - generic [ref=e359]: a
            - generic [ref=e360]: t
          - generic [ref=e362]:
            - generic [ref=e363]: m
            - generic [ref=e364]: o
            - generic [ref=e365]: s
            - generic [ref=e366]: t
          - generic [ref=e368]:
            - generic [ref=e369]: t
            - generic [ref=e370]: h
            - generic [ref=e371]: e
            - generic [ref=e372]: r
            - generic [ref=e373]: e
          - generic [ref=e375]:
            - generic [ref=e376]: t
            - generic [ref=e377]: e
            - generic [ref=e378]: a
            - generic [ref=e379]: r
          - generic [ref=e381]:
            - generic [ref=e382]: t
            - generic [ref=e383]: o
            - generic [ref=e384]: p
          - generic [ref=e386]:
            - generic [ref=e387]: r
            - generic [ref=e388]: o
            - generic [ref=e389]: o
            - generic [ref=e390]: t
          - generic [ref=e392]:
            - generic [ref=e393]: s
            - generic [ref=e394]: i
            - generic [ref=e395]: l
            - generic [ref=e396]: v
            - generic [ref=e397]: e
            - generic [ref=e398]: r
          - generic [ref=e400]:
            - generic [ref=e401]: p
            - generic [ref=e402]: a
            - generic [ref=e403]: i
            - generic [ref=e404]: r
          - generic [ref=e406]:
            - generic [ref=e407]: d
            - generic [ref=e408]: r
            - generic [ref=e409]: e
            - generic [ref=e410]: a
            - generic [ref=e411]: m
          - generic [ref=e413]:
            - generic [ref=e414]: f
            - generic [ref=e415]: i
            - generic [ref=e416]: r
            - generic [ref=e417]: e
          - generic [ref=e419]:
            - generic [ref=e420]: w
            - generic [ref=e421]: o
            - generic [ref=e422]: r
            - generic [ref=e423]: k
          - generic [ref=e425]:
            - generic [ref=e426]: o
            - generic [ref=e427]: u
            - generic [ref=e428]: r
          - generic [ref=e430]:
            - generic [ref=e431]: r
            - generic [ref=e432]: o
            - generic [ref=e433]: s
            - generic [ref=e434]: e
          - generic [ref=e436]:
            - generic [ref=e437]: c
            - generic [ref=e438]: o
            - generic [ref=e439]: l
            - generic [ref=e440]: d
          - generic [ref=e442]:
            - generic [ref=e443]: t
            - generic [ref=e444]: e
            - generic [ref=e445]: s
            - generic [ref=e446]: t
          - generic [ref=e448]:
            - generic [ref=e449]: "y"
            - generic [ref=e450]: e
            - generic [ref=e451]: a
            - generic [ref=e452]: r
          - generic [ref=e454]:
            - generic [ref=e455]: l
            - generic [ref=e456]: i
            - generic [ref=e457]: t
            - generic [ref=e458]: t
            - generic [ref=e459]: l
            - generic [ref=e460]: e
          - generic [ref=e462]:
            - generic [ref=e463]: f
            - generic [ref=e464]: u
            - generic [ref=e465]: "n"
          - generic [ref=e467]:
            - generic [ref=e468]: g
            - generic [ref=e469]: o
          - generic [ref=e471]:
            - generic [ref=e472]: s
            - generic [ref=e473]: t
            - generic [ref=e474]: i
            - generic [ref=e475]: l
            - generic [ref=e476]: l
          - generic [ref=e478]:
            - generic [ref=e479]: f
            - generic [ref=e480]: o
            - generic [ref=e481]: c
            - generic [ref=e482]: u
            - generic [ref=e483]: s
          - generic [ref=e485]:
            - generic [ref=e486]: q
            - generic [ref=e487]: u
            - generic [ref=e488]: i
            - generic [ref=e489]: c
            - generic [ref=e490]: k
          - generic [ref=e492]:
            - generic [ref=e493]: b
            - generic [ref=e494]: l
            - generic [ref=e495]: u
            - generic [ref=e496]: e
          - generic [ref=e498]:
            - generic [ref=e499]: "n"
            - generic [ref=e500]: i
            - generic [ref=e501]: g
            - generic [ref=e502]: h
            - generic [ref=e503]: t
          - generic [ref=e505]:
            - generic [ref=e506]: h
            - generic [ref=e507]: a
            - generic [ref=e508]: r
            - generic [ref=e509]: d
          - generic [ref=e511]:
            - generic [ref=e512]: t
            - generic [ref=e513]: a
            - generic [ref=e514]: k
            - generic [ref=e515]: e
          - generic [ref=e517]:
            - generic [ref=e518]: d
            - generic [ref=e519]: r
            - generic [ref=e520]: e
            - generic [ref=e521]: a
            - generic [ref=e522]: m
          - generic [ref=e524]:
            - generic [ref=e525]: m
            - generic [ref=e526]: i
            - generic [ref=e527]: "n"
            - generic [ref=e528]: e
          - generic [ref=e530]:
            - generic [ref=e531]: z
            - generic [ref=e532]: o
            - generic [ref=e533]: "n"
            - generic [ref=e534]: e
          - generic [ref=e536]:
            - generic [ref=e537]: w
            - generic [ref=e538]: h
            - generic [ref=e539]: e
            - generic [ref=e540]: r
            - generic [ref=e541]: e
          - generic [ref=e543]:
            - generic [ref=e544]: l
            - generic [ref=e545]: i
            - generic [ref=e546]: g
            - generic [ref=e547]: h
            - generic [ref=e548]: t
          - generic [ref=e550]:
            - generic [ref=e551]: h
            - generic [ref=e552]: a
            - generic [ref=e553]: r
            - generic [ref=e554]: d
          - generic [ref=e556]:
            - generic [ref=e557]: "n"
            - generic [ref=e558]: a
            - generic [ref=e559]: t
            - generic [ref=e560]: u
            - generic [ref=e561]: r
            - generic [ref=e562]: e
          - generic [ref=e564]:
            - generic [ref=e565]: d
            - generic [ref=e566]: a
            - generic [ref=e567]: "y"
          - generic [ref=e569]:
            - generic [ref=e570]: i
            - generic [ref=e571]: "n"
          - generic [ref=e573]:
            - generic [ref=e574]: t
            - generic [ref=e575]: a
            - generic [ref=e576]: s
            - generic [ref=e577]: t
            - generic [ref=e578]: e
          - generic [ref=e580]:
            - generic [ref=e581]: q
            - generic [ref=e582]: u
            - generic [ref=e583]: i
            - generic [ref=e584]: c
            - generic [ref=e585]: k
          - generic [ref=e587]:
            - generic [ref=e588]: o
            - generic [ref=e589]: "n"
            - generic [ref=e590]: i
            - generic [ref=e591]: o
            - generic [ref=e592]: "n"
          - generic [ref=e594]:
            - generic [ref=e595]: d
            - generic [ref=e596]: e
            - generic [ref=e597]: e
            - generic [ref=e598]: p
          - generic [ref=e600]:
            - generic [ref=e601]: w
            - generic [ref=e602]: h
            - generic [ref=e603]: e
            - generic [ref=e604]: "n"
          - generic [ref=e606]:
            - generic [ref=e607]: s
            - generic [ref=e608]: i
            - generic [ref=e609]: d
            - generic [ref=e610]: e
          - generic [ref=e612]:
            - generic [ref=e613]: i
            - generic [ref=e614]: d
            - generic [ref=e615]: e
            - generic [ref=e616]: a
          - generic [ref=e618]:
            - generic [ref=e619]: l
            - generic [ref=e620]: o
            - generic [ref=e621]: o
            - generic [ref=e622]: k
          - generic [ref=e624]:
            - generic [ref=e625]: h
            - generic [ref=e626]: e
            - generic [ref=e627]: a
            - generic [ref=e628]: d
          - generic [ref=e630]:
            - generic [ref=e631]: g
            - generic [ref=e632]: r
            - generic [ref=e633]: a
            - generic [ref=e634]: s
            - generic [ref=e635]: s
          - generic [ref=e637]:
            - generic [ref=e638]: c
            - generic [ref=e639]: l
            - generic [ref=e640]: e
            - generic [ref=e641]: a
            - generic [ref=e642]: r
          - generic [ref=e644]:
            - generic [ref=e645]: f
            - generic [ref=e646]: o
            - generic [ref=e647]: c
            - generic [ref=e648]: u
            - generic [ref=e649]: s
          - generic [ref=e651]:
            - generic [ref=e652]: g
            - generic [ref=e653]: u
            - generic [ref=e654]: i
            - generic [ref=e655]: d
            - generic [ref=e656]: e
          - generic [ref=e658]:
            - generic [ref=e659]: p
            - generic [ref=e660]: i
            - generic [ref=e661]: "n"
            - generic [ref=e662]: k
          - generic [ref=e664]:
            - generic [ref=e665]: w
            - generic [ref=e666]: r
            - generic [ref=e667]: i
            - generic [ref=e668]: t
            - generic [ref=e669]: e
          - generic [ref=e671]:
            - generic [ref=e672]: w
            - generic [ref=e673]: i
            - generic [ref=e674]: "n"
            - generic [ref=e675]: d
          - generic [ref=e677]:
            - generic [ref=e678]: r
            - generic [ref=e679]: e
            - generic [ref=e680]: "n"
            - generic [ref=e681]: t
          - generic [ref=e683]:
            - generic [ref=e684]: s
            - generic [ref=e685]: m
            - generic [ref=e686]: a
            - generic [ref=e687]: l
            - generic [ref=e688]: l
          - generic [ref=e690]:
            - generic [ref=e691]: "n"
            - generic [ref=e692]: i
            - generic [ref=e693]: "n"
            - generic [ref=e694]: e
          - generic [ref=e696]:
            - generic [ref=e697]: s
            - generic [ref=e698]: e
            - generic [ref=e699]: "n"
            - generic [ref=e700]: t
          - generic [ref=e702]:
            - generic [ref=e703]: e
            - generic [ref=e704]: "y"
            - generic [ref=e705]: e
          - generic [ref=e707]:
            - generic [ref=e708]: t
            - generic [ref=e709]: e
            - generic [ref=e710]: a
            - generic [ref=e711]: r
          - generic [ref=e713]:
            - generic [ref=e714]: p
            - generic [ref=e715]: l
            - generic [ref=e716]: a
            - generic [ref=e717]: "y"
          - generic [ref=e719]:
            - generic [ref=e720]: w
            - generic [ref=e721]: i
            - generic [ref=e722]: "n"
            - generic [ref=e723]: d
          - generic [ref=e725]:
            - generic [ref=e726]: f
            - generic [ref=e727]: a
            - generic [ref=e728]: c
            - generic [ref=e729]: e
          - generic [ref=e731]:
            - generic [ref=e732]: i
            - generic [ref=e733]: s
          - generic [ref=e735]:
            - generic [ref=e736]: g
            - generic [ref=e737]: u
            - generic [ref=e738]: i
            - generic [ref=e739]: d
            - generic [ref=e740]: e
          - generic [ref=e742]:
            - generic [ref=e743]: p
            - generic [ref=e744]: a
            - generic [ref=e745]: i
            - generic [ref=e746]: r
          - generic [ref=e748]:
            - generic [ref=e749]: t
            - generic [ref=e750]: o
            - generic [ref=e751]: g
            - generic [ref=e752]: e
            - generic [ref=e753]: t
            - generic [ref=e754]: h
            - generic [ref=e755]: e
            - generic [ref=e756]: r
          - generic [ref=e758]:
            - generic [ref=e759]: s
            - generic [ref=e760]: o
            - generic [ref=e761]: u
            - generic [ref=e762]: t
            - generic [ref=e763]: h
          - generic [ref=e765]:
            - generic [ref=e766]: u
            - generic [ref=e767]: p
          - generic [ref=e769]:
            - generic [ref=e770]: r
            - generic [ref=e771]: a
            - generic [ref=e772]: t
            - generic [ref=e773]: i
            - generic [ref=e774]: o
          - generic [ref=e776]:
            - generic [ref=e777]: s
            - generic [ref=e778]: a
            - generic [ref=e779]: "n"
            - generic [ref=e780]: e
          - generic [ref=e782]:
            - generic [ref=e783]: s
            - generic [ref=e784]: c
            - generic [ref=e785]: h
            - generic [ref=e786]: o
            - generic [ref=e787]: o
            - generic [ref=e788]: l
          - generic [ref=e790]:
            - generic [ref=e791]: s
            - generic [ref=e792]: u
            - generic [ref=e793]: r
            - generic [ref=e794]: e
          - generic [ref=e796]:
            - generic [ref=e797]: w
            - generic [ref=e798]: a
            - generic [ref=e799]: "n"
            - generic [ref=e800]: t
          - generic [ref=e802]:
            - generic [ref=e803]: e
            - generic [ref=e804]: a
            - generic [ref=e805]: r
            - generic [ref=e806]: "n"
          - generic [ref=e808]:
            - generic [ref=e809]: i
            - generic [ref=e810]: r
            - generic [ref=e811]: o
            - generic [ref=e812]: "n"
          - generic [ref=e814]:
            - generic [ref=e815]: r
            - generic [ref=e816]: o
            - generic [ref=e817]: o
            - generic [ref=e818]: m
          - generic [ref=e820]:
            - generic [ref=e821]: m
            - generic [ref=e822]: a
            - generic [ref=e823]: i
            - generic [ref=e824]: "n"
          - generic [ref=e826]:
            - generic [ref=e827]: i
            - generic [ref=e828]: f
          - generic [ref=e830]:
            - generic [ref=e831]: "y"
            - generic [ref=e832]: e
            - generic [ref=e833]: a
            - generic [ref=e834]: r
          - generic [ref=e836]:
            - generic [ref=e837]: e
            - generic [ref=e838]: a
            - generic [ref=e839]: r
          - generic [ref=e841]:
            - generic [ref=e842]: g
            - generic [ref=e843]: r
            - generic [ref=e844]: o
            - generic [ref=e845]: w
          - generic [ref=e847]:
            - generic [ref=e848]: c
            - generic [ref=e849]: a
            - generic [ref=e850]: l
            - generic [ref=e851]: m
        - paragraph [ref=e852]: "Practice passage: light draw clean page say eye your made paint hard speak forge red oat jump save ant spring line story world hard attention true first line pink quick zone end gold short tier or out hope with zinc tin stand what most there tear top root silver pair dream fire work our rose cold test year little fun go still focus quick blue night hard take dream mine zone where light hard nature day in taste quick onion deep when side idea look head grass clear focus guide pink write wind rent small nine sent eye tear play wind face is guide pair together south up ratio sane school sure want earn iron room main if year ear grow calm"
        - textbox "Typing input" [active] [ref=e853]
      - generic [ref=e855]:
        - paragraph [ref=e856]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e857]
      - generic [ref=e858]:
        - paragraph [ref=e859]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e860]:
          - button "Restart with new text" [ref=e861]
          - button "Show accessible text editor" [ref=e865]
          - button "Finish" [disabled] [ref=e869]
      - status [ref=e872]: Ready to type
  - contentinfo [ref=e873]:
    - generic [ref=e874]:
      - generic [ref=e875]: A little practice. Lasting progress.
      - generic [ref=e878]:
        - link "About & metrics" [ref=e879]:
          - /url: /about
        - link "Preferences & data" [ref=e880]:
          - /url: /settings
        - generic [ref=e881]: Typing Forge © 2026
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