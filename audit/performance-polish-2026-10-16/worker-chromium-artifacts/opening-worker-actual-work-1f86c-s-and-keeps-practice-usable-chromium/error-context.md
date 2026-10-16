# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> actual worker WebGL context loss recovers with a fresh canvas and keeps practice usable
- Location: e2e\opening-worker.spec.ts:363:1

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
            - generic [ref=e123]: s
            - generic [ref=e124]: p
            - generic [ref=e125]: e
            - generic [ref=e126]: e
            - generic [ref=e127]: d
          - generic [ref=e129]:
            - generic [ref=e130]: t
            - generic [ref=e131]: h
            - generic [ref=e132]: i
            - generic [ref=e133]: "n"
            - generic [ref=e134]: k
          - generic [ref=e136]:
            - generic [ref=e137]: f
            - generic [ref=e138]: o
            - generic [ref=e139]: o
            - generic [ref=e140]: t
          - generic [ref=e142]:
            - generic [ref=e143]: w
            - generic [ref=e144]: o
            - generic [ref=e145]: r
            - generic [ref=e146]: k
          - generic [ref=e148]:
            - generic [ref=e149]: r
            - generic [ref=e150]: e
            - generic [ref=e151]: d
          - generic [ref=e153]:
            - generic [ref=e154]: t
            - generic [ref=e155]: e
            - generic [ref=e156]: l
            - generic [ref=e157]: l
          - generic [ref=e159]:
            - generic [ref=e160]: u
            - generic [ref=e161]: s
            - generic [ref=e162]: e
          - generic [ref=e164]:
            - generic [ref=e165]: r
            - generic [ref=e166]: a
            - generic [ref=e167]: t
            - generic [ref=e168]: e
          - generic [ref=e170]:
            - generic [ref=e171]: g
            - generic [ref=e172]: r
            - generic [ref=e173]: o
            - generic [ref=e174]: u
            - generic [ref=e175]: p
          - generic [ref=e177]:
            - generic [ref=e178]: "n"
            - generic [ref=e179]: o
            - generic [ref=e180]: t
            - generic [ref=e181]: e
          - generic [ref=e183]:
            - generic [ref=e184]: w
            - generic [ref=e185]: o
            - generic [ref=e186]: m
            - generic [ref=e187]: a
            - generic [ref=e188]: "n"
          - generic [ref=e190]:
            - generic [ref=e191]: j
            - generic [ref=e192]: o
            - generic [ref=e193]: i
            - generic [ref=e194]: "n"
          - generic [ref=e196]:
            - generic [ref=e197]: b
            - generic [ref=e198]: o
            - generic [ref=e199]: o
            - generic [ref=e200]: k
          - generic [ref=e202]:
            - generic [ref=e203]: t
            - generic [ref=e204]: e
            - generic [ref=e205]: a
            - generic [ref=e206]: r
          - generic [ref=e208]:
            - generic [ref=e209]: t
            - generic [ref=e210]: u
            - generic [ref=e211]: r
            - generic [ref=e212]: "n"
          - generic [ref=e214]:
            - generic [ref=e215]: t
            - generic [ref=e216]: o
          - generic [ref=e218]:
            - generic [ref=e219]: g
            - generic [ref=e220]: r
            - generic [ref=e221]: a
            - generic [ref=e222]: "n"
            - generic [ref=e223]: d
          - generic [ref=e225]:
            - generic [ref=e226]: b
            - generic [ref=e227]: l
            - generic [ref=e228]: u
            - generic [ref=e229]: e
          - generic [ref=e231]:
            - generic [ref=e232]: "n"
            - generic [ref=e233]: o
            - generic [ref=e234]: r
            - generic [ref=e235]: t
            - generic [ref=e236]: h
          - generic [ref=e238]:
            - generic [ref=e239]: s
            - generic [ref=e240]: o
            - generic [ref=e241]: u
            - generic [ref=e242]: "n"
            - generic [ref=e243]: d
          - generic [ref=e245]:
            - generic [ref=e246]: w
            - generic [ref=e247]: h
            - generic [ref=e248]: a
            - generic [ref=e249]: t
          - generic [ref=e251]:
            - generic [ref=e252]: t
            - generic [ref=e253]: w
            - generic [ref=e254]: o
          - generic [ref=e256]:
            - generic [ref=e257]: m
            - generic [ref=e258]: a
            - generic [ref=e259]: "n"
            - generic [ref=e260]: "y"
          - generic [ref=e262]:
            - generic [ref=e263]: b
            - generic [ref=e264]: l
            - generic [ref=e265]: u
            - generic [ref=e266]: e
          - generic [ref=e268]:
            - generic [ref=e269]: o
            - generic [ref=e270]: "n"
          - generic [ref=e272]:
            - generic [ref=e273]: s
            - generic [ref=e274]: o
            - generic [ref=e275]: m
            - generic [ref=e276]: e
          - generic [ref=e278]:
            - generic [ref=e279]: r
            - generic [ref=e280]: o
            - generic [ref=e281]: o
            - generic [ref=e282]: m
          - generic [ref=e284]:
            - generic [ref=e285]: w
            - generic [ref=e286]: i
            - generic [ref=e287]: t
            - generic [ref=e288]: h
          - generic [ref=e290]:
            - generic [ref=e291]: h
            - generic [ref=e292]: e
            - generic [ref=e293]: a
            - generic [ref=e294]: r
            - generic [ref=e295]: t
          - generic [ref=e297]:
            - generic [ref=e298]: t
            - generic [ref=e299]: a
            - generic [ref=e300]: s
            - generic [ref=e301]: t
            - generic [ref=e302]: e
          - generic [ref=e304]:
            - generic [ref=e305]: o
            - generic [ref=e306]: u
            - generic [ref=e307]: t
          - generic [ref=e309]:
            - generic [ref=e310]: l
            - generic [ref=e311]: o
            - generic [ref=e312]: v
            - generic [ref=e313]: e
          - generic [ref=e315]:
            - generic [ref=e316]: f
            - generic [ref=e317]: o
            - generic [ref=e318]: c
            - generic [ref=e319]: u
            - generic [ref=e320]: s
          - generic [ref=e322]:
            - generic [ref=e323]: s
            - generic [ref=e324]: t
            - generic [ref=e325]: a
            - generic [ref=e326]: r
            - generic [ref=e327]: t
          - generic [ref=e329]:
            - generic [ref=e330]: w
            - generic [ref=e331]: a
            - generic [ref=e332]: t
            - generic [ref=e333]: c
            - generic [ref=e334]: h
          - generic [ref=e336]:
            - generic [ref=e337]: m
            - generic [ref=e338]: o
            - generic [ref=e339]: r
            - generic [ref=e340]: e
          - generic [ref=e342]:
            - generic [ref=e343]: p
            - generic [ref=e344]: r
            - generic [ref=e345]: e
            - generic [ref=e346]: t
            - generic [ref=e347]: t
            - generic [ref=e348]: "y"
          - generic [ref=e350]:
            - generic [ref=e351]: t
            - generic [ref=e352]: h
            - generic [ref=e353]: r
            - generic [ref=e354]: e
            - generic [ref=e355]: e
          - generic [ref=e357]:
            - generic [ref=e358]: w
            - generic [ref=e359]: h
            - generic [ref=e360]: i
            - generic [ref=e361]: c
            - generic [ref=e362]: h
          - generic [ref=e364]:
            - generic [ref=e365]: z
            - generic [ref=e366]: o
            - generic [ref=e367]: "n"
            - generic [ref=e368]: e
          - generic [ref=e370]:
            - generic [ref=e371]: d
            - generic [ref=e372]: r
            - generic [ref=e373]: a
            - generic [ref=e374]: w
          - generic [ref=e376]:
            - generic [ref=e377]: p
            - generic [ref=e378]: e
            - generic [ref=e379]: r
            - generic [ref=e380]: s
            - generic [ref=e381]: o
            - generic [ref=e382]: "n"
          - generic [ref=e384]:
            - generic [ref=e385]: "n"
            - generic [ref=e386]: e
            - generic [ref=e387]: w
          - generic [ref=e389]:
            - generic [ref=e390]: o
            - generic [ref=e391]: p
            - generic [ref=e392]: e
            - generic [ref=e393]: "n"
          - generic [ref=e395]:
            - generic [ref=e396]: w
            - generic [ref=e397]: a
            - generic [ref=e398]: r
            - generic [ref=e399]: m
          - generic [ref=e401]:
            - generic [ref=e402]: a
            - generic [ref=e403]: r
            - generic [ref=e404]: e
          - generic [ref=e406]:
            - generic [ref=e407]: "n"
            - generic [ref=e408]: e
            - generic [ref=e409]: e
            - generic [ref=e410]: d
          - generic [ref=e412]:
            - generic [ref=e413]: p
            - generic [ref=e414]: a
            - generic [ref=e415]: i
            - generic [ref=e416]: "n"
            - generic [ref=e417]: t
          - generic [ref=e419]:
            - generic [ref=e420]: w
            - generic [ref=e421]: r
            - generic [ref=e422]: i
            - generic [ref=e423]: t
            - generic [ref=e424]: e
          - generic [ref=e426]:
            - generic [ref=e427]: m
            - generic [ref=e428]: a
            - generic [ref=e429]: k
            - generic [ref=e430]: e
          - generic [ref=e432]:
            - generic [ref=e433]: a
            - generic [ref=e434]: "n"
            - generic [ref=e435]: t
          - generic [ref=e437]:
            - generic [ref=e438]: a
            - generic [ref=e439]: r
            - generic [ref=e440]: e
          - generic [ref=e442]:
            - generic [ref=e443]: m
            - generic [ref=e444]: e
            - generic [ref=e445]: e
            - generic [ref=e446]: t
          - generic [ref=e448]:
            - generic [ref=e449]: "n"
            - generic [ref=e450]: o
            - generic [ref=e451]: t
            - generic [ref=e452]: i
            - generic [ref=e453]: o
            - generic [ref=e454]: "n"
          - generic [ref=e456]:
            - generic [ref=e457]: r
            - generic [ref=e458]: o
            - generic [ref=e459]: o
            - generic [ref=e460]: t
          - generic [ref=e462]:
            - generic [ref=e463]: "y"
            - generic [ref=e464]: e
            - generic [ref=e465]: l
            - generic [ref=e466]: l
            - generic [ref=e467]: o
            - generic [ref=e468]: w
          - generic [ref=e470]:
            - generic [ref=e471]: s
            - generic [ref=e472]: o
            - generic [ref=e473]: u
            - generic [ref=e474]: t
            - generic [ref=e475]: h
          - generic [ref=e477]:
            - generic [ref=e478]: s
            - generic [ref=e479]: t
            - generic [ref=e480]: u
            - generic [ref=e481]: d
            - generic [ref=e482]: "y"
          - generic [ref=e484]:
            - generic [ref=e485]: "n"
            - generic [ref=e486]: u
            - generic [ref=e487]: m
            - generic [ref=e488]: b
            - generic [ref=e489]: e
            - generic [ref=e490]: r
          - generic [ref=e492]:
            - generic [ref=e493]: e
            - generic [ref=e494]: r
            - generic [ref=e495]: a
          - generic [ref=e497]:
            - generic [ref=e498]: l
            - generic [ref=e499]: o
            - generic [ref=e500]: "n"
            - generic [ref=e501]: g
          - generic [ref=e503]:
            - generic [ref=e504]: c
            - generic [ref=e505]: o
            - generic [ref=e506]: l
            - generic [ref=e507]: d
          - generic [ref=e509]:
            - generic [ref=e510]: t
            - generic [ref=e511]: a
            - generic [ref=e512]: s
            - generic [ref=e513]: k
          - generic [ref=e515]:
            - generic [ref=e516]: w
            - generic [ref=e517]: e
            - generic [ref=e518]: l
            - generic [ref=e519]: l
          - generic [ref=e521]:
            - generic [ref=e522]: m
            - generic [ref=e523]: a
            - generic [ref=e524]: d
            - generic [ref=e525]: e
          - generic [ref=e527]:
            - generic [ref=e528]: i
            - generic [ref=e529]: d
            - generic [ref=e530]: e
            - generic [ref=e531]: a
          - generic [ref=e533]:
            - generic [ref=e534]: p
            - generic [ref=e535]: a
            - generic [ref=e536]: t
            - generic [ref=e537]: h
          - generic [ref=e539]: a
          - generic [ref=e542]:
            - generic [ref=e543]: p
            - generic [ref=e544]: o
            - generic [ref=e545]: i
            - generic [ref=e546]: "n"
            - generic [ref=e547]: t
          - generic [ref=e549]:
            - generic [ref=e550]: u
            - generic [ref=e551]: p
          - generic [ref=e553]:
            - generic [ref=e554]: a
            - generic [ref=e555]: "n"
            - generic [ref=e556]: t
          - generic [ref=e558]:
            - generic [ref=e559]: t
            - generic [ref=e560]: e
            - generic [ref=e561]: s
            - generic [ref=e562]: t
          - generic [ref=e564]:
            - generic [ref=e565]: f
            - generic [ref=e566]: i
            - generic [ref=e567]: r
            - generic [ref=e568]: e
          - generic [ref=e570]:
            - generic [ref=e571]: u
            - generic [ref=e572]: "n"
            - generic [ref=e573]: d
            - generic [ref=e574]: e
            - generic [ref=e575]: r
          - generic [ref=e577]:
            - generic [ref=e578]: w
            - generic [ref=e579]: e
            - generic [ref=e580]: e
            - generic [ref=e581]: k
          - generic [ref=e583]:
            - generic [ref=e584]: m
            - generic [ref=e585]: u
            - generic [ref=e586]: c
            - generic [ref=e587]: h
          - generic [ref=e589]:
            - generic [ref=e590]: j
            - generic [ref=e591]: o
            - generic [ref=e592]: i
            - generic [ref=e593]: "n"
          - generic [ref=e595]:
            - generic [ref=e596]: r
            - generic [ref=e597]: a
            - generic [ref=e598]: t
            - generic [ref=e599]: i
            - generic [ref=e600]: o
            - generic [ref=e601]: "n"
          - generic [ref=e603]:
            - generic [ref=e604]: s
            - generic [ref=e605]: a
            - generic [ref=e606]: "y"
          - generic [ref=e608]:
            - generic [ref=e609]: s
            - generic [ref=e610]: o
            - generic [ref=e611]: r
            - generic [ref=e612]: t
          - generic [ref=e614]:
            - generic [ref=e615]: h
            - generic [ref=e616]: o
            - generic [ref=e617]: p
            - generic [ref=e618]: e
          - generic [ref=e620]:
            - generic [ref=e621]: a
            - generic [ref=e622]: r
            - generic [ref=e623]: i
            - generic [ref=e624]: s
            - generic [ref=e625]: e
          - generic [ref=e627]:
            - generic [ref=e628]: w
            - generic [ref=e629]: h
            - generic [ref=e630]: e
            - generic [ref=e631]: "n"
          - generic [ref=e633]:
            - generic [ref=e634]: r
            - generic [ref=e635]: e
            - generic [ref=e636]: a
            - generic [ref=e637]: d
            - generic [ref=e638]: "y"
          - generic [ref=e640]:
            - generic [ref=e641]: g
            - generic [ref=e642]: r
            - generic [ref=e643]: o
            - generic [ref=e644]: u
            - generic [ref=e645]: p
          - generic [ref=e647]:
            - generic [ref=e648]: d
            - generic [ref=e649]: o
            - generic [ref=e650]: o
            - generic [ref=e651]: r
          - generic [ref=e653]:
            - generic [ref=e654]: m
            - generic [ref=e655]: u
            - generic [ref=e656]: c
            - generic [ref=e657]: h
          - generic [ref=e659]:
            - generic [ref=e660]: a
            - generic [ref=e661]: "n"
            - generic [ref=e662]: t
            - generic [ref=e663]: e
          - generic [ref=e665]:
            - generic [ref=e666]: g
            - generic [ref=e667]: i
            - generic [ref=e668]: v
            - generic [ref=e669]: e
          - generic [ref=e671]:
            - generic [ref=e672]: s
            - generic [ref=e673]: t
            - generic [ref=e674]: r
            - generic [ref=e675]: e
            - generic [ref=e676]: e
            - generic [ref=e677]: t
          - generic [ref=e679]:
            - generic [ref=e680]: "n"
            - generic [ref=e681]: u
            - generic [ref=e682]: m
            - generic [ref=e683]: b
            - generic [ref=e684]: e
            - generic [ref=e685]: r
          - generic [ref=e687]:
            - generic [ref=e688]: s
            - generic [ref=e689]: t
            - generic [ref=e690]: o
            - generic [ref=e691]: r
            - generic [ref=e692]: e
          - generic [ref=e694]:
            - generic [ref=e695]: c
            - generic [ref=e696]: a
            - generic [ref=e697]: r
            - generic [ref=e698]: e
          - generic [ref=e700]:
            - generic [ref=e701]: j
            - generic [ref=e702]: o
            - generic [ref=e703]: "y"
          - generic [ref=e705]:
            - generic [ref=e706]: g
            - generic [ref=e707]: o
          - generic [ref=e709]:
            - generic [ref=e710]: r
            - generic [ref=e711]: a
            - generic [ref=e712]: c
            - generic [ref=e713]: e
          - generic [ref=e715]:
            - generic [ref=e716]: t
            - generic [ref=e717]: i
            - generic [ref=e718]: r
            - generic [ref=e719]: e
          - generic [ref=e721]:
            - generic [ref=e722]: s
            - generic [ref=e723]: t
            - generic [ref=e724]: a
            - generic [ref=e725]: i
            - generic [ref=e726]: r
          - generic [ref=e728]:
            - generic [ref=e729]: t
            - generic [ref=e730]: e
            - generic [ref=e731]: l
            - generic [ref=e732]: l
          - generic [ref=e734]:
            - generic [ref=e735]: j
            - generic [ref=e736]: o
            - generic [ref=e737]: k
            - generic [ref=e738]: e
          - generic [ref=e740]:
            - generic [ref=e741]: s
            - generic [ref=e742]: a
            - generic [ref=e743]: "n"
            - generic [ref=e744]: e
          - generic [ref=e746]:
            - generic [ref=e747]: s
            - generic [ref=e748]: t
            - generic [ref=e749]: o
            - generic [ref=e750]: p
          - generic [ref=e752]:
            - generic [ref=e753]: s
            - generic [ref=e754]: h
            - generic [ref=e755]: o
            - generic [ref=e756]: r
            - generic [ref=e757]: t
          - generic [ref=e759]:
            - generic [ref=e760]: l
            - generic [ref=e761]: o
            - generic [ref=e762]: w
          - generic [ref=e764]:
            - generic [ref=e765]: t
            - generic [ref=e766]: o
            - generic [ref=e767]: "n"
          - generic [ref=e769]:
            - generic [ref=e770]: c
            - generic [ref=e771]: a
            - generic [ref=e772]: r
            - generic [ref=e773]: e
          - generic [ref=e775]:
            - generic [ref=e776]: e
            - generic [ref=e777]: a
            - generic [ref=e778]: r
            - generic [ref=e779]: l
            - generic [ref=e780]: "y"
          - generic [ref=e782]:
            - generic [ref=e783]: z
            - generic [ref=e784]: i
            - generic [ref=e785]: "n"
            - generic [ref=e786]: c
          - generic [ref=e788]:
            - generic [ref=e789]: k
            - generic [ref=e790]: i
            - generic [ref=e791]: "n"
            - generic [ref=e792]: d
          - generic [ref=e794]:
            - generic [ref=e795]: s
            - generic [ref=e796]: t
            - generic [ref=e797]: a
            - generic [ref=e798]: r
            - generic [ref=e799]: e
          - generic [ref=e801]:
            - generic [ref=e802]: t
            - generic [ref=e803]: h
            - generic [ref=e804]: i
            - generic [ref=e805]: "n"
            - generic [ref=e806]: k
          - generic [ref=e808]:
            - generic [ref=e809]: w
            - generic [ref=e810]: i
            - generic [ref=e811]: t
            - generic [ref=e812]: h
          - generic [ref=e814]:
            - generic [ref=e815]: h
            - generic [ref=e816]: e
            - generic [ref=e817]: l
            - generic [ref=e818]: p
          - generic [ref=e820]:
            - generic [ref=e821]: t
            - generic [ref=e822]: e
            - generic [ref=e823]: l
            - generic [ref=e824]: l
          - generic [ref=e826]:
            - generic [ref=e827]: w
            - generic [ref=e828]: e
            - generic [ref=e829]: s
            - generic [ref=e830]: t
          - generic [ref=e832]:
            - generic [ref=e833]: t
            - generic [ref=e834]: h
            - generic [ref=e835]: o
            - generic [ref=e836]: s
            - generic [ref=e837]: e
          - generic [ref=e839]:
            - generic [ref=e840]: o
            - generic [ref=e841]: f
            - generic [ref=e842]: t
            - generic [ref=e843]: e
            - generic [ref=e844]: "n"
          - generic [ref=e846]:
            - generic [ref=e847]: l
            - generic [ref=e848]: a
            - generic [ref=e849]: s
            - generic [ref=e850]: t
          - generic [ref=e852]:
            - generic [ref=e853]: p
            - generic [ref=e854]: l
            - generic [ref=e855]: a
            - generic [ref=e856]: "y"
          - generic [ref=e858]:
            - generic [ref=e859]: m
            - generic [ref=e860]: e
        - paragraph [ref=e861]: "Practice passage: speed think foot work red tell use rate group note woman join book tear turn to grand blue north sound what two many blue on some room with heart taste out love focus start watch more pretty three which zone draw person new open warm are need paint write make ant are meet notion root yellow south study number era long cold task well made idea path a point up ant test fire under week much join ration say sort hope arise when ready group door much ante give street number store care joy go race tire stair tell joke sane stop short low ton care early zinc kind stare think with help tell west those often last play me"
        - textbox "Typing input" [active] [ref=e862]
      - generic [ref=e864]:
        - paragraph [ref=e865]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e866]
      - generic [ref=e867]:
        - paragraph [ref=e868]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e869]:
          - button "Restart with new text" [ref=e870]
          - button "Show accessible text editor" [ref=e874]
          - button "Finish" [disabled] [ref=e878]
      - status [ref=e881]: Ready to type
  - contentinfo [ref=e882]:
    - generic [ref=e883]:
      - generic [ref=e884]:
        - generic [ref=e885]:
          - generic [ref=e886]: Sparow
          - generic [ref=e887]: Type
        - text: Find your rhythm.
      - generic [ref=e888]:
        - link "About & metrics" [ref=e889] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e890] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e891] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e892] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e893] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e894] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e895]: SparowType © 2026
```

# Test source

```ts
  315 |     await page.keyboard.press("Escape");
  316 |     await expectWorkerClosed(page, false);
  317 |     const input = await readyPractice(page);
  318 |     await input.pressSequentially("x");
  319 |     await expect(input).toHaveValue("x");
  320 |   } finally {
  321 |     release();
  322 |   }
  323 | });
  324 | 
  325 | async function expectRecoveredDocumentScene(page: Page) {
  326 |   const opening = page.getByTestId("opening-experience");
  327 |   const canvas = page.locator(".awakening-canvas");
  328 |   await expect(opening).toHaveAttribute("data-renderer", "webgl");
  329 |   await expect
  330 |     .poll(async () => {
  331 |       const raw = await canvas.getAttribute("data-scene");
  332 |       const scene = raw
  333 |         ? (JSON.parse(raw) as KeyboardSceneDiagnostics)
  334 |         : undefined;
  335 |       return (
  336 |         scene?.thread === "main-thread" &&
  337 |         scene.keyCount === 61 &&
  338 |         scene.frames > 0 &&
  339 |         scene.drawCalls > 0
  340 |       );
  341 |     })
  342 |     .toBe(true);
  343 |   await expect(canvas).toHaveCount(1);
  344 |   await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  345 |   await page.keyboard.press("Escape");
  346 |   await readyPractice(page);
  347 | }
  348 | 
  349 | test("a native worker transport failure replaces the transferred canvas with the complete real document renderer", async ({
  350 |   page,
  351 | }, info) => {
  352 |   await observeNativeWorker(page, info);
  353 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  354 |   await firstWorkerReady(page);
  355 |   await page.evaluate(() =>
  356 |     (window as AuditedWindow).openingWorkerAudit!.workers[0].dispatchEvent(
  357 |       new ErrorEvent("error", { message: "Injected worker transport failure" }),
  358 |     ),
  359 |   );
  360 |   await expectRecoveredDocumentScene(page);
  361 | });
  362 | 
  363 | test("actual worker WebGL context loss recovers with a fresh canvas and keeps practice usable", async ({
  364 |   page,
  365 | }, info) => {
  366 |   await observeNativeWorker(page, info);
  367 |   await page.context().route(workerEntry, async (route) => {
  368 |     const response = await route.fetch();
  369 |     const body = await response.text();
  370 |     const injection = `
  371 | const originalOffscreenContext = OffscreenCanvas.prototype.getContext;
  372 | OffscreenCanvas.prototype.getContext = function (...args) {
  373 |   const context = Reflect.apply(originalOffscreenContext, this, args);
  374 |   if (args[0] === "webgl2" && context) {
  375 |     const extension = context.getExtension("WEBGL_lose_context");
  376 |     postMessage({type:"test-context-loss-capability",supported:Boolean(extension)});
  377 |     if (extension) setTimeout(() => {
  378 |       postMessage({type:"test-native-context-loss-requested"});
  379 |       extension.loseContext();
  380 |     }, 100);
  381 |   }
  382 |   return context;
  383 | };
  384 | `;
  385 |     await route.fulfill({ response, body: injection + body });
  386 |   });
  387 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  388 |   await expect
  389 |     .poll(async () =>
  390 |       (await records(page))[0]?.received.some(
  391 |         (receipt) => receipt.type === "test-context-loss-capability",
  392 |       ),
  393 |     )
  394 |     .toBe(true);
  395 |   const available = (await records(page))[0].received.find(
  396 |     (receipt) => receipt.type === "test-context-loss-capability",
  397 |   )?.supported;
  398 |   test.skip(
  399 |     !available,
  400 |     "UNVERIFIED: this native worker has no WEBGL_lose_context extension.",
  401 |   );
  402 |   await expect
  403 |     .poll(async () =>
  404 |       (await records(page))[0]?.received.some(
  405 |         (receipt) => receipt.type === "test-native-context-loss-requested",
  406 |       ),
  407 |     )
  408 |     .toBe(true);
  409 |   await expect
  410 |     .poll(async () =>
  411 |       (await records(page))[0]?.received.some(
  412 |         (receipt) => receipt.diagnostics?.contextLost,
  413 |       ),
  414 |     )
> 415 |     .toBe(true);
      |      ^ Error: expect(received).toBe(expected) // Object.is equality
  416 |   await expectRecoveredDocumentScene(page);
  417 | });
  418 | 
```