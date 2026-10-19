# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: php-account-flow.spec.ts >> real PHP account signup, replay upload, independent-device history/preferences and account deletion
- Location: e2e\php-account-flow.spec.ts:6:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - region "Notifications (F8)":
      - list [ref=e5]:
        - listitem [ref=e6]:
          - generic [ref=e7]:
            - generic [ref=e8]: Account created!
            - generic [ref=e9]: Your account is ready. Your practice will now sync to this account.
          - button [ref=e10]
    - generic [ref=e15]:
      - banner [ref=e16]:
        - link "Skip to content" [ref=e17]:
          - /url: "#main-content"
        - generic [ref=e18]:
          - link "SparowType home" [ref=e19]:
            - /url: /
            - generic [ref=e20]:
              - generic [ref=e21]: Sparow
              - generic [ref=e22]: Type
          - generic [ref=e23]:
            - button "Switch to light theme" [ref=e24]
            - button "Open command palette" [ref=e31]
            - link "Settings" [ref=e34]:
              - /url: /settings
            - link "Account" [ref=e38]:
              - /url: /profile
        - navigation "Mobile navigation" [ref=e43]:
          - link "Test" [ref=e44]:
            - /url: /
          - link "Learn" [ref=e47]:
            - /url: /learn
          - link "Race" [ref=e51]:
            - /url: /race
          - link "Stats" [ref=e61]:
            - /url: /stats
          - link "Rankings" [ref=e64]:
            - /url: /leaderboard
          - link "Keyboard Lab" [ref=e71]:
            - /url: /keyboard-lab
      - main [ref=e74]:
        - heading "Typing practice" [level=1] [ref=e75]
        - region "Test configuration" [ref=e76]:
          - generic [ref=e77]:
            - group "Test mode" [ref=e78]:
              - button "Time" [pressed] [ref=e79]
              - button "Words" [ref=e83]
              - button "Quote" [ref=e86]
              - button "Code" [ref=e90]
              - button "Custom" [ref=e95]
              - button "Zen" [ref=e99]
            - group "Test duration" [ref=e102]:
              - button "15 seconds" [ref=e103]:
                - text: "15"
                - generic [ref=e104]: seconds
              - button "30 seconds" [pressed] [ref=e105]:
                - text: "30"
                - generic [ref=e106]: seconds
              - button "60 seconds" [ref=e107]:
                - text: "60"
                - generic [ref=e108]: seconds
              - button "120 seconds" [ref=e109]:
                - text: "120"
                - generic [ref=e110]: seconds
          - generic [ref=e111]:
            - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e112]:
              - checkbox "Precision mode · stop on errors" [ref=e113]
              - text: Precision mode · stop on errors
            - generic [ref=e114]:
              - text: Language
              - combobox "Language" [ref=e115]:
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
            - button "punctuation" [ref=e117]
            - button "# numbers" [ref=e119]
        - region "Typing session" [ref=e120]:
          - generic [ref=e121]:
            - generic [ref=e122]:
              - generic [ref=e123]:
                - generic [ref=e124]: 30s
                - generic [ref=e125]: remaining
              - generic [ref=e126]: —wpm
              - generic [ref=e127]: —acc %
            - generic [ref=e128]: Ready when you are
          - generic [ref=e130]:
            - generic [ref=e132]:
              - generic [ref=e133]:
                - generic [ref=e134]: s
                - generic [ref=e135]: k
                - generic [ref=e136]: "y"
              - generic [ref=e138]:
                - generic [ref=e139]: t
                - generic [ref=e140]: h
                - generic [ref=e141]: i
                - generic [ref=e142]: "n"
                - generic [ref=e143]: k
              - generic [ref=e145]:
                - generic [ref=e146]: g
                - generic [ref=e147]: r
                - generic [ref=e148]: o
                - generic [ref=e149]: u
                - generic [ref=e150]: "n"
                - generic [ref=e151]: d
              - generic [ref=e153]:
                - generic [ref=e154]: v
                - generic [ref=e155]: i
                - generic [ref=e156]: e
                - generic [ref=e157]: w
              - generic [ref=e159]:
                - generic [ref=e160]: o
                - generic [ref=e161]: r
              - generic [ref=e163]:
                - generic [ref=e164]: e
                - generic [ref=e165]: v
                - generic [ref=e166]: e
                - generic [ref=e167]: r
                - generic [ref=e168]: "y"
              - generic [ref=e170]:
                - generic [ref=e171]: l
                - generic [ref=e172]: a
                - generic [ref=e173]: s
                - generic [ref=e174]: t
              - generic [ref=e176]:
                - generic [ref=e177]: m
                - generic [ref=e178]: o
                - generic [ref=e179]: v
                - generic [ref=e180]: e
              - generic [ref=e182]:
                - generic [ref=e183]: h
                - generic [ref=e184]: e
                - generic [ref=e185]: a
                - generic [ref=e186]: r
                - generic [ref=e187]: t
              - generic [ref=e189]:
                - generic [ref=e190]: g
                - generic [ref=e191]: l
                - generic [ref=e192]: a
                - generic [ref=e193]: s
                - generic [ref=e194]: s
              - generic [ref=e196]:
                - generic [ref=e197]: s
                - generic [ref=e198]: e
                - generic [ref=e199]: c
                - generic [ref=e200]: o
                - generic [ref=e201]: "n"
                - generic [ref=e202]: d
              - generic [ref=e204]:
                - generic [ref=e205]: o
                - generic [ref=e206]: f
                - generic [ref=e207]: f
              - generic [ref=e209]:
                - generic [ref=e210]: p
                - generic [ref=e211]: a
                - generic [ref=e212]: p
                - generic [ref=e213]: e
                - generic [ref=e214]: r
              - generic [ref=e216]:
                - generic [ref=e217]: k
                - generic [ref=e218]: e
                - generic [ref=e219]: e
                - generic [ref=e220]: "n"
              - generic [ref=e222]:
                - generic [ref=e223]: h
                - generic [ref=e224]: i
                - generic [ref=e225]: g
                - generic [ref=e226]: h
              - generic [ref=e228]:
                - generic [ref=e229]: o
                - generic [ref=e230]: w
                - generic [ref=e231]: "n"
              - generic [ref=e233]:
                - generic [ref=e234]: t
                - generic [ref=e235]: a
                - generic [ref=e236]: l
                - generic [ref=e237]: l
              - generic [ref=e239]:
                - generic [ref=e240]: r
                - generic [ref=e241]: a
                - generic [ref=e242]: c
                - generic [ref=e243]: e
              - generic [ref=e245]:
                - generic [ref=e246]: t
                - generic [ref=e247]: h
                - generic [ref=e248]: r
                - generic [ref=e249]: e
                - generic [ref=e250]: e
              - generic [ref=e252]:
                - generic [ref=e253]: p
                - generic [ref=e254]: o
                - generic [ref=e255]: i
                - generic [ref=e256]: "n"
                - generic [ref=e257]: t
              - generic [ref=e259]:
                - generic [ref=e260]: g
                - generic [ref=e261]: r
                - generic [ref=e262]: e
                - generic [ref=e263]: e
                - generic [ref=e264]: "n"
              - generic [ref=e266]:
                - generic [ref=e267]: w
                - generic [ref=e268]: i
                - generic [ref=e269]: d
                - generic [ref=e270]: e
              - generic [ref=e272]:
                - generic [ref=e273]: m
                - generic [ref=e274]: a
                - generic [ref=e275]: d
                - generic [ref=e276]: e
              - generic [ref=e278]:
                - generic [ref=e279]: s
                - generic [ref=e280]: l
                - generic [ref=e281]: o
                - generic [ref=e282]: w
              - generic [ref=e284]:
                - generic [ref=e285]: t
                - generic [ref=e286]: h
                - generic [ref=e287]: e
                - generic [ref=e288]: r
                - generic [ref=e289]: e
              - generic [ref=e291]:
                - generic [ref=e292]: k
                - generic [ref=e293]: e
                - generic [ref=e294]: "y"
              - generic [ref=e296]:
                - generic [ref=e297]: c
                - generic [ref=e298]: o
                - generic [ref=e299]: d
                - generic [ref=e300]: e
              - generic [ref=e302]:
                - generic [ref=e303]: "y"
                - generic [ref=e304]: o
                - generic [ref=e305]: u
              - generic [ref=e307]:
                - generic [ref=e308]: p
                - generic [ref=e309]: o
                - generic [ref=e310]: i
                - generic [ref=e311]: "n"
                - generic [ref=e312]: t
              - generic [ref=e314]:
                - generic [ref=e315]: k
                - generic [ref=e316]: e
                - generic [ref=e317]: e
                - generic [ref=e318]: "n"
              - generic [ref=e320]:
                - generic [ref=e321]: w
                - generic [ref=e322]: a
                - generic [ref=e323]: "n"
                - generic [ref=e324]: t
              - generic [ref=e326]:
                - generic [ref=e327]: h
                - generic [ref=e328]: i
                - generic [ref=e329]: g
                - generic [ref=e330]: h
              - generic [ref=e332]:
                - generic [ref=e333]: h
                - generic [ref=e334]: i
                - generic [ref=e335]: g
                - generic [ref=e336]: h
              - generic [ref=e338]:
                - generic [ref=e339]: m
                - generic [ref=e340]: e
                - generic [ref=e341]: a
                - generic [ref=e342]: "n"
              - generic [ref=e344]:
                - generic [ref=e345]: c
                - generic [ref=e346]: a
                - generic [ref=e347]: r
                - generic [ref=e348]: e
              - generic [ref=e350]:
                - generic [ref=e351]: w
                - generic [ref=e352]: r
                - generic [ref=e353]: i
                - generic [ref=e354]: t
                - generic [ref=e355]: e
              - generic [ref=e357]:
                - generic [ref=e358]: q
                - generic [ref=e359]: u
                - generic [ref=e360]: i
                - generic [ref=e361]: e
                - generic [ref=e362]: t
              - generic [ref=e364]:
                - generic [ref=e365]: r
                - generic [ref=e366]: e
                - generic [ref=e367]: t
                - generic [ref=e368]: i
                - generic [ref=e369]: "n"
                - generic [ref=e370]: a
              - generic [ref=e372]:
                - generic [ref=e373]: w
                - generic [ref=e374]: h
                - generic [ref=e375]: i
                - generic [ref=e376]: c
                - generic [ref=e377]: h
              - generic [ref=e379]:
                - generic [ref=e380]: t
                - generic [ref=e381]: h
                - generic [ref=e382]: o
                - generic [ref=e383]: u
                - generic [ref=e384]: g
                - generic [ref=e385]: h
                - generic [ref=e386]: t
              - generic [ref=e388]:
                - generic [ref=e389]: h
                - generic [ref=e390]: a
                - generic [ref=e391]: s
              - generic [ref=e393]:
                - generic [ref=e394]: "n"
                - generic [ref=e395]: e
                - generic [ref=e396]: w
              - generic [ref=e398]:
                - generic [ref=e399]: "n"
                - generic [ref=e400]: a
                - generic [ref=e401]: t
                - generic [ref=e402]: i
                - generic [ref=e403]: o
                - generic [ref=e404]: "n"
              - generic [ref=e406]:
                - generic [ref=e407]: c
                - generic [ref=e408]: l
                - generic [ref=e409]: e
                - generic [ref=e410]: a
                - generic [ref=e411]: "n"
              - generic [ref=e413]:
                - generic [ref=e414]: o
                - generic [ref=e415]: a
                - generic [ref=e416]: t
              - generic [ref=e418]:
                - generic [ref=e419]: t
                - generic [ref=e420]: h
                - generic [ref=e421]: a
                - generic [ref=e422]: t
              - generic [ref=e424]:
                - generic [ref=e425]: f
                - generic [ref=e426]: u
                - generic [ref=e427]: "n"
              - generic [ref=e429]:
                - generic [ref=e430]: t
                - generic [ref=e431]: h
                - generic [ref=e432]: e
                - generic [ref=e433]: "n"
              - generic [ref=e435]:
                - generic [ref=e436]: g
                - generic [ref=e437]: r
                - generic [ref=e438]: o
                - generic [ref=e439]: u
                - generic [ref=e440]: "n"
                - generic [ref=e441]: d
              - generic [ref=e443]:
                - generic [ref=e444]: b
                - generic [ref=e445]: r
                - generic [ref=e446]: i
                - generic [ref=e447]: g
                - generic [ref=e448]: h
                - generic [ref=e449]: t
              - generic [ref=e451]:
                - generic [ref=e452]: "y"
                - generic [ref=e453]: e
                - generic [ref=e454]: a
                - generic [ref=e455]: r
              - generic [ref=e457]:
                - generic [ref=e458]: p
                - generic [ref=e459]: o
                - generic [ref=e460]: i
                - generic [ref=e461]: "n"
                - generic [ref=e462]: t
              - generic [ref=e464]:
                - generic [ref=e465]: g
                - generic [ref=e466]: r
                - generic [ref=e467]: e
                - generic [ref=e468]: a
                - generic [ref=e469]: t
              - generic [ref=e471]:
                - generic [ref=e472]: o
                - generic [ref=e473]: t
                - generic [ref=e474]: h
                - generic [ref=e475]: e
                - generic [ref=e476]: r
              - generic [ref=e478]:
                - generic [ref=e479]: l
                - generic [ref=e480]: e
                - generic [ref=e481]: a
                - generic [ref=e482]: "n"
              - generic [ref=e484]:
                - generic [ref=e485]: w
                - generic [ref=e486]: r
                - generic [ref=e487]: i
                - generic [ref=e488]: t
                - generic [ref=e489]: e
              - generic [ref=e491]:
                - generic [ref=e492]: "n"
                - generic [ref=e493]: a
                - generic [ref=e494]: m
                - generic [ref=e495]: e
              - generic [ref=e497]:
                - generic [ref=e498]: e
                - generic [ref=e499]: a
                - generic [ref=e500]: s
                - generic [ref=e501]: t
              - generic [ref=e503]:
                - generic [ref=e504]: "y"
                - generic [ref=e505]: e
                - generic [ref=e506]: t
              - generic [ref=e508]:
                - generic [ref=e509]: h
                - generic [ref=e510]: o
                - generic [ref=e511]: l
                - generic [ref=e512]: d
              - generic [ref=e514]:
                - generic [ref=e515]: "n"
                - generic [ref=e516]: e
                - generic [ref=e517]: a
                - generic [ref=e518]: t
              - generic [ref=e520]:
                - generic [ref=e521]: s
                - generic [ref=e522]: h
                - generic [ref=e523]: o
                - generic [ref=e524]: w
              - generic [ref=e526]:
                - generic [ref=e527]: q
                - generic [ref=e528]: u
                - generic [ref=e529]: e
                - generic [ref=e530]: e
                - generic [ref=e531]: "n"
              - generic [ref=e533]:
                - generic [ref=e534]: r
                - generic [ref=e535]: e
                - generic [ref=e536]: a
                - generic [ref=e537]: d
              - generic [ref=e539]:
                - generic [ref=e540]: c
                - generic [ref=e541]: o
                - generic [ref=e542]: d
                - generic [ref=e543]: e
              - generic [ref=e545]:
                - generic [ref=e546]: p
                - generic [ref=e547]: l
                - generic [ref=e548]: e
                - generic [ref=e549]: a
                - generic [ref=e550]: s
                - generic [ref=e551]: e
              - generic [ref=e553]:
                - generic [ref=e554]: c
                - generic [ref=e555]: o
                - generic [ref=e556]: d
                - generic [ref=e557]: e
              - generic [ref=e559]:
                - generic [ref=e560]: i
                - generic [ref=e561]: "n"
                - generic [ref=e562]: "n"
                - generic [ref=e563]: a
                - generic [ref=e564]: t
                - generic [ref=e565]: e
              - generic [ref=e567]:
                - generic [ref=e568]: w
                - generic [ref=e569]: o
                - generic [ref=e570]: r
                - generic [ref=e571]: d
              - generic [ref=e573]:
                - generic [ref=e574]: t
                - generic [ref=e575]: e
                - generic [ref=e576]: "n"
              - generic [ref=e578]:
                - generic [ref=e579]: s
                - generic [ref=e580]: i
                - generic [ref=e581]: x
              - generic [ref=e583]:
                - generic [ref=e584]: c
                - generic [ref=e585]: o
                - generic [ref=e586]: l
                - generic [ref=e587]: d
              - generic [ref=e589]:
                - generic [ref=e590]: t
                - generic [ref=e591]: h
                - generic [ref=e592]: e
                - generic [ref=e593]: "n"
              - generic [ref=e595]:
                - generic [ref=e596]: m
                - generic [ref=e597]: "y"
              - generic [ref=e599]:
                - generic [ref=e600]: e
                - generic [ref=e601]: a
                - generic [ref=e602]: r
              - generic [ref=e604]:
                - generic [ref=e605]: w
                - generic [ref=e606]: i
                - generic [ref=e607]: d
                - generic [ref=e608]: e
              - generic [ref=e610]:
                - generic [ref=e611]: t
                - generic [ref=e612]: a
                - generic [ref=e613]: s
                - generic [ref=e614]: k
              - generic [ref=e616]:
                - generic [ref=e617]: t
                - generic [ref=e618]: a
                - generic [ref=e619]: l
                - generic [ref=e620]: l
              - generic [ref=e622]:
                - generic [ref=e623]: s
                - generic [ref=e624]: a
                - generic [ref=e625]: v
                - generic [ref=e626]: e
              - generic [ref=e628]:
                - generic [ref=e629]: h
                - generic [ref=e630]: i
                - generic [ref=e631]: g
                - generic [ref=e632]: h
              - generic [ref=e634]:
                - generic [ref=e635]: t
                - generic [ref=e636]: i
                - generic [ref=e637]: "n"
              - generic [ref=e639]:
                - generic [ref=e640]: z
                - generic [ref=e641]: o
                - generic [ref=e642]: "n"
                - generic [ref=e643]: e
              - generic [ref=e645]:
                - generic [ref=e646]: l
                - generic [ref=e647]: i
                - generic [ref=e648]: "n"
                - generic [ref=e649]: e
              - generic [ref=e651]:
                - generic [ref=e652]: t
                - generic [ref=e653]: r
                - generic [ref=e654]: "y"
              - generic [ref=e656]:
                - generic [ref=e657]: w
                - generic [ref=e658]: e
                - generic [ref=e659]: l
                - generic [ref=e660]: l
              - generic [ref=e662]:
                - generic [ref=e663]: o
                - generic [ref=e664]: v
                - generic [ref=e665]: e
                - generic [ref=e666]: r
              - generic [ref=e668]:
                - generic [ref=e669]: r
                - generic [ref=e670]: e
                - generic [ref=e671]: "n"
                - generic [ref=e672]: t
              - generic [ref=e674]:
                - generic [ref=e675]: p
                - generic [ref=e676]: e
                - generic [ref=e677]: r
                - generic [ref=e678]: s
                - generic [ref=e679]: o
                - generic [ref=e680]: "n"
              - generic [ref=e682]:
                - generic [ref=e683]: s
                - generic [ref=e684]: t
                - generic [ref=e685]: o
                - generic [ref=e686]: p
              - generic [ref=e688]:
                - generic [ref=e689]: s
                - generic [ref=e690]: e
                - generic [ref=e691]: e
                - generic [ref=e692]: d
              - generic [ref=e694]:
                - generic [ref=e695]: g
                - generic [ref=e696]: o
                - generic [ref=e697]: l
                - generic [ref=e698]: d
              - generic [ref=e700]:
                - generic [ref=e701]: s
                - generic [ref=e702]: h
                - generic [ref=e703]: a
                - generic [ref=e704]: p
                - generic [ref=e705]: e
              - generic [ref=e707]:
                - generic [ref=e708]: s
                - generic [ref=e709]: p
                - generic [ref=e710]: a
                - generic [ref=e711]: c
                - generic [ref=e712]: e
              - generic [ref=e714]:
                - generic [ref=e715]: r
                - generic [ref=e716]: o
                - generic [ref=e717]: o
                - generic [ref=e718]: m
              - generic [ref=e720]:
                - generic [ref=e721]: j
                - generic [ref=e722]: o
                - generic [ref=e723]: "y"
              - generic [ref=e725]:
                - generic [ref=e726]: t
                - generic [ref=e727]: h
                - generic [ref=e728]: o
                - generic [ref=e729]: s
                - generic [ref=e730]: e
              - generic [ref=e732]:
                - generic [ref=e733]: l
                - generic [ref=e734]: o
                - generic [ref=e735]: w
              - generic [ref=e737]:
                - generic [ref=e738]: g
                - generic [ref=e739]: r
                - generic [ref=e740]: o
                - generic [ref=e741]: w
              - generic [ref=e743]:
                - generic [ref=e744]: a
                - generic [ref=e745]: "n"
                - generic [ref=e746]: t
                - generic [ref=e747]: e
              - generic [ref=e749]:
                - generic [ref=e750]: "n"
                - generic [ref=e751]: e
                - generic [ref=e752]: v
                - generic [ref=e753]: e
                - generic [ref=e754]: r
              - generic [ref=e756]:
                - generic [ref=e757]: s
                - generic [ref=e758]: i
                - generic [ref=e759]: m
                - generic [ref=e760]: p
                - generic [ref=e761]: l
                - generic [ref=e762]: e
              - generic [ref=e764]:
                - generic [ref=e765]: s
                - generic [ref=e766]: e
                - generic [ref=e767]: e
                - generic [ref=e768]: d
              - generic [ref=e770]:
                - generic [ref=e771]: "n"
                - generic [ref=e772]: e
                - generic [ref=e773]: o
                - generic [ref=e774]: "n"
              - generic [ref=e776]:
                - generic [ref=e777]: s
                - generic [ref=e778]: o
                - generic [ref=e779]: m
                - generic [ref=e780]: e
              - generic [ref=e782]:
                - generic [ref=e783]: e
                - generic [ref=e784]: v
                - generic [ref=e785]: e
                - generic [ref=e786]: r
                - generic [ref=e787]: "y"
              - generic [ref=e789]:
                - generic [ref=e790]: "n"
                - generic [ref=e791]: o
                - generic [ref=e792]: t
              - generic [ref=e794]:
                - generic [ref=e795]: t
                - generic [ref=e796]: e
                - generic [ref=e797]: s
                - generic [ref=e798]: t
              - generic [ref=e800]:
                - generic [ref=e801]: g
                - generic [ref=e802]: u
                - generic [ref=e803]: i
                - generic [ref=e804]: d
                - generic [ref=e805]: e
              - generic [ref=e807]:
                - generic [ref=e808]: m
                - generic [ref=e809]: e
              - generic [ref=e811]:
                - generic [ref=e812]: g
                - generic [ref=e813]: o
                - generic [ref=e814]: o
                - generic [ref=e815]: d
              - generic [ref=e817]:
                - generic [ref=e818]: s
                - generic [ref=e819]: a
                - generic [ref=e820]: m
                - generic [ref=e821]: e
              - generic [ref=e823]:
                - generic [ref=e824]: w
                - generic [ref=e825]: h
                - generic [ref=e826]: i
                - generic [ref=e827]: t
                - generic [ref=e828]: e
              - generic [ref=e830]:
                - generic [ref=e831]: w
                - generic [ref=e832]: a
                - generic [ref=e833]: "n"
                - generic [ref=e834]: t
              - generic [ref=e836]:
                - generic [ref=e837]: p
                - generic [ref=e838]: a
                - generic [ref=e839]: g
                - generic [ref=e840]: e
              - generic [ref=e842]:
                - generic [ref=e843]: k
                - generic [ref=e844]: i
                - generic [ref=e845]: "n"
                - generic [ref=e846]: d
              - generic [ref=e848]:
                - generic [ref=e849]: "n"
                - generic [ref=e850]: i
                - generic [ref=e851]: g
                - generic [ref=e852]: h
                - generic [ref=e853]: t
              - generic [ref=e855]:
                - generic [ref=e856]: l
                - generic [ref=e857]: a
                - generic [ref=e858]: t
                - generic [ref=e859]: e
                - generic [ref=e860]: r
              - generic [ref=e862]:
                - generic [ref=e863]: l
                - generic [ref=e864]: o
                - generic [ref=e865]: o
                - generic [ref=e866]: k
              - generic [ref=e868]:
                - generic [ref=e869]: s
                - generic [ref=e870]: o
                - generic [ref=e871]: f
                - generic [ref=e872]: t
              - generic [ref=e874]:
                - generic [ref=e875]: s
                - generic [ref=e876]: a
                - generic [ref=e877]: "y"
            - paragraph [ref=e878]: "Practice passage: sky think ground view or every last move heart glass second off paper keen high own tall race three point green wide made slow there key code you point keen want high high mean care write quiet retina which thought has new nation clean oat that fun then ground bright year point great other lean write name east yet hold neat show queen read code please code innate word ten six cold then my ear wide task tall save high tin zone line try well over rent person stop seed gold shape space room joy those low grow ante never simple seed neon some every not test guide me good same white want page kind night later look soft say"
            - textbox "Typing input" [active] [ref=e879]
          - generic [ref=e881]:
            - paragraph [ref=e882]: Type the text above. Wrong letters stay visible; Backspace corrects.
            - status [ref=e883]
          - generic [ref=e884]:
            - paragraph [ref=e885]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
            - generic [ref=e886]:
              - button "Restart with new text" [ref=e887]
              - button "Show accessible text editor" [ref=e891]
              - button "Finish" [disabled] [ref=e895]
          - status [ref=e898]: Ready to type
      - contentinfo [ref=e899]:
        - generic [ref=e900]:
          - generic [ref=e901]:
            - generic [ref=e902]:
              - generic [ref=e903]: Sparow
              - generic [ref=e904]: Type
            - text: Find your rhythm.
          - generic [ref=e905]:
            - link "About & metrics" [ref=e906]:
              - /url: /about
            - link "Preferences & data" [ref=e907]:
              - /url: /settings
            - link "Touch typing guide" [ref=e908]:
              - /url: /touch-typing
            - link "Privacy" [ref=e909]:
              - /url: /privacy
            - link "Terms" [ref=e910]:
              - /url: /terms
            - link "Offline" [ref=e911]:
              - /url: /offline
            - generic [ref=e912]: SparowType © 2026
  - status [ref=e913]: Notification Account created!Your account is ready. Your practice will now sync to this account.
```

# Test source

```ts
  1   | import { expect, test, type BrowserContext, type Page } from "@playwright/test";
  2   | import { randomUUID } from "node:crypto";
  3   | import { phpApiBase } from "./php-api-fixture";
  4   | import { focusTyping } from "./helpers";
  5   | 
  6   | test("real PHP account signup, replay upload, independent-device history/preferences and account deletion", async ({ page, browser, baseURL }) => {
  7   |   test.skip(process.env.PHP_E2E_ACCEPTANCE !== "1", "Enable PHP_E2E_ACCEPTANCE=1 only against the intended local/staging PHP and MySQL acceptance database. This creates and deletes its own dedicated account.");
  8   |   test.setTimeout(90000);
  9   |   const api = phpApiBase(baseURL!);
  10  |   const email = `sparowtype-${randomUUID()}@example.test`;
  11  |   const password = `Acceptance!${randomUUID()}`;
  12  |   let owner: string | null = null;
  13  |   let second: BrowserContext | null = null;
  14  |   let current: Page = page;
  15  |   const session = async (target: Page) => {
  16  |     const response = await target.request.get(new URL("auth/session", api).href);
  17  |     expect(response.ok()).toBe(true);
  18  |     return response.json() as Promise<{ user: { id: string; email: string } | null; csrfToken: string }>;
  19  |   };
  20  |   const signIn = async (target: Page) => {
  21  |     await target.goto("/auth");
  22  |     await target.getByLabel("Email", { exact: true }).fill(email);
  23  |     await target.getByLabel("Password", { exact: true }).fill(password);
  24  |     await target.getByRole("button", { name: "Sign In", exact: true }).click();
  25  |     await expect(target).toHaveURL("/");
  26  |     await expect(target.getByRole("link", { name: "Account", exact: true })).toBeVisible();
  27  |   };
  28  |   try {
  29  |     await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  30  |     await page.goto("/auth");
  31  |     await page.getByRole("button", { name: "Don't have an account? Sign up", exact: true }).click();
  32  |     await page.getByLabel("Email", { exact: true }).fill(email);
  33  |     await page.getByLabel("Password", { exact: true }).fill(password);
  34  |     await page.getByRole("button", { name: "Create Account", exact: true }).click();
  35  |     await expect(page).toHaveURL("/");
  36  |     const signedIn = await session(page);
  37  |     expect(signedIn.user?.email).toBe(email);
  38  |     owner = signedIn.user!.id;
  39  |     const cookies = await page.context().cookies();
> 40  |     expect(cookies.some(cookie => cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
      |                                                                                  ^ Error: expect(received).toBe(expected) // Object.is equality
  41  | 
  42  |     await page.getByRole("group", { name: "Test mode", exact: true }).getByRole("button", { name: "Words", exact: true }).click();
  43  |     await page.getByRole("button", { name: /10\s*words/i }).click();
  44  |     const input = await focusTyping(page);
  45  |     const passage = (await page.getByTestId("typing-target").textContent())!;
  46  |     expect(passage.length).toBeGreaterThan(5);
  47  |     const wrong = passage[1] === "x" ? "z" : "x";
  48  |     await input.pressSequentially(passage[0] + wrong, { delay: 70 });
  49  |     await input.press("Backspace");
  50  |     await input.pressSequentially(passage.slice(1), { delay: 70 });
  51  |     await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  52  |     await expect(page.getByText("Saved to your account.", { exact: true })).toBeVisible({ timeout: 20000 });
  53  |     const historyResponse = await page.request.get(new URL(`sessions?expectedOwner=${owner}&limit=500&offset=0`, api).href);
  54  |     expect(historyResponse.ok()).toBe(true);
  55  |     const history = await historyResponse.json();
  56  |     expect(history.sessions).toHaveLength(1);
  57  |     expect(history.sessions[0].metrics.incorrectAttempts).toBe(1);
  58  |     expect(history.sessions[0].metrics.inputAccuracy).toBeCloseTo(100 * passage.length / (passage.length + 1));
  59  | 
  60  |     await page.goto("/settings");
  61  |     await page.getByRole("button", { name: "Aa bb Paper", exact: true }).click();
  62  |     await page.getByRole("combobox", { name: "Keyboard layout", exact: true }).selectOption("dvorak");
  63  |     await expect(page.getByText("Preferences saved to your account.", { exact: true })).toBeVisible({ timeout: 10000 });
  64  |     await page.goto("/profile");
  65  |     await page.getByRole("textbox", { name: "Handle", exact: true }).fill(`qa_${randomUUID().replaceAll("-", "").slice(0, 16)}`);
  66  |     await page.getByRole("button", { name: "Save handle", exact: true }).click();
  67  |     await expect(page.getByRole("status")).toContainText("Your public handle is saved.");
  68  |     await page.getByRole("button", { name: "Sign out", exact: true }).click();
  69  |     await expect(page.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();
  70  | 
  71  |     // A new context has no originating IndexedDB, preference storage or cookies.
  72  |     second = await browser.newContext({ baseURL });
  73  |     await second.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  74  |     current = await second.newPage();
  75  |     await signIn(current);
  76  |     await current.goto("/profile");
  77  |     await expect(current.getByText("1 saved sessions", { exact: false })).toBeVisible({ timeout: 10000 });
  78  |     await current.goto("/settings");
  79  |     await expect(current.locator("html")).toHaveAttribute("data-theme", "paper");
  80  |     await expect(current.getByRole("combobox", { name: "Keyboard layout", exact: true })).toHaveValue("dvorak");
  81  |     await current.goto("/profile");
  82  |     await current.getByLabel("Type DELETE to enable this action", { exact: true }).fill("DELETE");
  83  |     await current.getByRole("button", { name: "Permanently delete account", exact: true }).click();
  84  |     await expect(current.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();
  85  |     expect((await session(current)).user).toBeNull();
  86  |     owner = null;
  87  |   } finally {
  88  |     // Cleanup is restricted to the unique account created by this test.
  89  |     if (owner) {
  90  |       const state = await session(current);
  91  |       if (state.user?.id === owner) {
  92  |         const removed = await current.request.post(new URL("account/delete", api).href, {
  93  |           headers: { "X-CSRF-Token": state.csrfToken }, data: { confirmation: "DELETE MY ACCOUNT", expectedOwner: owner },
  94  |         });
  95  |         expect(removed.ok(), "Dedicated acceptance account cleanup").toBe(true);
  96  |       }
  97  |     }
  98  |     await second?.close();
  99  |   }
  100 | });
  101 | 
```