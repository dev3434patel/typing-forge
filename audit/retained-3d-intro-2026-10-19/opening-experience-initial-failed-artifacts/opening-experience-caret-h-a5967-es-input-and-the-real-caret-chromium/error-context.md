# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-experience.spec.ts >> caret handoff late chunk preserves input and the real caret
- Location: e2e\opening-experience.spec.ts:230:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForResponse: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for response /\/assets\/caret-handoff[^/]*\.js/
============================================================
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
    - region "Typing session" [ref=e65]:
      - generic [ref=e66]:
        - generic [ref=e67]:
          - generic [ref=e68]:
            - generic [ref=e69]: 30s
            - generic [ref=e70]: remaining
          - generic [ref=e71]: —wpm
          - generic [ref=e72]: 0acc %
        - generic [ref=e73]: Find your rhythm
      - generic [ref=e75]:
        - generic [ref=e77]:
          - generic [ref=e78]:
            - generic [ref=e79]:
              - text: x
              - generic [aria-hidden]: r
            - generic [ref=e80]: e
            - generic [ref=e81]: s
            - generic [ref=e82]: t
          - generic [ref=e84]:
            - generic [ref=e85]: b
            - generic [ref=e86]: o
            - generic [ref=e87]: o
            - generic [ref=e88]: k
          - generic [ref=e90]:
            - generic [ref=e91]: "n"
            - generic [ref=e92]: a
            - generic [ref=e93]: m
            - generic [ref=e94]: e
          - generic [ref=e96]:
            - generic [ref=e97]: h
            - generic [ref=e98]: o
            - generic [ref=e99]: p
            - generic [ref=e100]: e
          - generic [ref=e102]:
            - generic [ref=e103]: w
            - generic [ref=e104]: a
            - generic [ref=e105]: "n"
            - generic [ref=e106]: t
          - generic [ref=e108]:
            - generic [ref=e109]: w
            - generic [ref=e110]: o
            - generic [ref=e111]: r
            - generic [ref=e112]: k
          - generic [ref=e114]:
            - generic [ref=e115]: p
            - generic [ref=e116]: l
            - generic [ref=e117]: e
            - generic [ref=e118]: a
            - generic [ref=e119]: s
            - generic [ref=e120]: e
          - generic [ref=e122]:
            - generic [ref=e123]: t
            - generic [ref=e124]: i
            - generic [ref=e125]: r
            - generic [ref=e126]: e
          - generic [ref=e128]:
            - generic [ref=e129]: q
            - generic [ref=e130]: u
            - generic [ref=e131]: e
            - generic [ref=e132]: s
            - generic [ref=e133]: t
            - generic [ref=e134]: i
            - generic [ref=e135]: o
            - generic [ref=e136]: "n"
          - generic [ref=e138]:
            - generic [ref=e139]: w
            - generic [ref=e140]: r
            - generic [ref=e141]: i
            - generic [ref=e142]: t
            - generic [ref=e143]: e
          - generic [ref=e145]:
            - generic [ref=e146]: w
            - generic [ref=e147]: h
            - generic [ref=e148]: "y"
          - generic [ref=e150]:
            - generic [ref=e151]: v
            - generic [ref=e152]: e
            - generic [ref=e153]: r
            - generic [ref=e154]: "y"
          - generic [ref=e156]:
            - generic [ref=e157]: s
            - generic [ref=e158]: p
            - generic [ref=e159]: a
            - generic [ref=e160]: c
            - generic [ref=e161]: e
          - generic [ref=e163]:
            - generic [ref=e164]: e
            - generic [ref=e165]: a
            - generic [ref=e166]: c
            - generic [ref=e167]: h
          - generic [ref=e169]:
            - generic [ref=e170]: d
            - generic [ref=e171]: r
            - generic [ref=e172]: a
            - generic [ref=e173]: w
          - generic [ref=e175]:
            - generic [ref=e176]: t
            - generic [ref=e177]: o
            - generic [ref=e178]: w
            - generic [ref=e179]: "n"
          - generic [ref=e181]:
            - generic [ref=e182]: s
            - generic [ref=e183]: i
            - generic [ref=e184]: m
            - generic [ref=e185]: p
            - generic [ref=e186]: l
            - generic [ref=e187]: e
          - generic [ref=e189]:
            - generic [ref=e190]: p
            - generic [ref=e191]: a
            - generic [ref=e192]: p
            - generic [ref=e193]: e
            - generic [ref=e194]: r
          - generic [ref=e196]:
            - generic [ref=e197]: m
            - generic [ref=e198]: e
            - generic [ref=e199]: a
            - generic [ref=e200]: "n"
          - generic [ref=e202]:
            - generic [ref=e203]: t
            - generic [ref=e204]: e
            - generic [ref=e205]: s
            - generic [ref=e206]: t
          - generic [ref=e208]:
            - generic [ref=e209]: s
            - generic [ref=e210]: e
            - generic [ref=e211]: t
          - generic [ref=e213]:
            - generic [ref=e214]: w
            - generic [ref=e215]: i
            - generic [ref=e216]: t
            - generic [ref=e217]: h
          - generic [ref=e219]:
            - generic [ref=e220]: e
            - generic [ref=e221]: "n"
            - generic [ref=e222]: d
          - generic [ref=e224]:
            - generic [ref=e225]: t
            - generic [ref=e226]: r
            - generic [ref=e227]: a
            - generic [ref=e228]: i
            - generic [ref=e229]: "n"
          - generic [ref=e231]:
            - generic [ref=e232]: t
            - generic [ref=e233]: e
            - generic [ref=e234]: a
          - generic [ref=e236]:
            - generic [ref=e237]: "y"
            - generic [ref=e238]: o
            - generic [ref=e239]: u
            - generic [ref=e240]: r
          - generic [ref=e242]:
            - generic [ref=e243]: h
            - generic [ref=e244]: i
            - generic [ref=e245]: s
          - generic [ref=e247]:
            - generic [ref=e248]: s
            - generic [ref=e249]: p
            - generic [ref=e250]: e
            - generic [ref=e251]: e
            - generic [ref=e252]: d
          - generic [ref=e254]:
            - generic [ref=e255]: p
            - generic [ref=e256]: o
            - generic [ref=e257]: i
            - generic [ref=e258]: "n"
            - generic [ref=e259]: t
          - generic [ref=e261]:
            - generic [ref=e262]: h
            - generic [ref=e263]: i
            - generic [ref=e264]: g
            - generic [ref=e265]: h
          - generic [ref=e267]:
            - generic [ref=e268]: "y"
            - generic [ref=e269]: e
            - generic [ref=e270]: s
          - generic [ref=e272]:
            - generic [ref=e273]: k
            - generic [ref=e274]: i
            - generic [ref=e275]: t
            - generic [ref=e276]: e
          - generic [ref=e278]:
            - generic [ref=e279]: g
            - generic [ref=e280]: r
            - generic [ref=e281]: e
            - generic [ref=e282]: a
            - generic [ref=e283]: t
          - generic [ref=e285]:
            - generic [ref=e286]: s
            - generic [ref=e287]: e
            - generic [ref=e288]: e
          - generic [ref=e290]:
            - generic [ref=e291]: t
            - generic [ref=e292]: h
            - generic [ref=e293]: r
            - generic [ref=e294]: e
            - generic [ref=e295]: e
          - generic [ref=e297]:
            - generic [ref=e298]: o
            - generic [ref=e299]: r
            - generic [ref=e300]: d
            - generic [ref=e301]: e
            - generic [ref=e302]: r
          - generic [ref=e304]:
            - generic [ref=e305]: s
            - generic [ref=e306]: h
            - generic [ref=e307]: o
            - generic [ref=e308]: r
            - generic [ref=e309]: e
          - generic [ref=e311]:
            - generic [ref=e312]: h
            - generic [ref=e313]: i
            - generic [ref=e314]: l
            - generic [ref=e315]: l
          - generic [ref=e317]:
            - generic [ref=e318]: s
            - generic [ref=e319]: e
            - generic [ref=e320]: "n"
            - generic [ref=e321]: d
          - generic [ref=e323]:
            - generic [ref=e324]: p
            - generic [ref=e325]: a
            - generic [ref=e326]: i
            - generic [ref=e327]: "n"
            - generic [ref=e328]: t
          - generic [ref=e330]:
            - generic [ref=e331]: w
            - generic [ref=e332]: i
            - generic [ref=e333]: t
            - generic [ref=e334]: h
          - generic [ref=e336]:
            - generic [ref=e337]: m
            - generic [ref=e338]: e
          - generic [ref=e340]:
            - generic [ref=e341]: t
            - generic [ref=e342]: h
            - generic [ref=e343]: e
            - generic [ref=e344]: s
            - generic [ref=e345]: e
          - generic [ref=e347]:
            - generic [ref=e348]: s
            - generic [ref=e349]: h
            - generic [ref=e350]: e
          - generic [ref=e352]:
            - generic [ref=e353]: m
            - generic [ref=e354]: a
            - generic [ref=e355]: k
            - generic [ref=e356]: e
          - generic [ref=e358]:
            - generic [ref=e359]: e
            - generic [ref=e360]: r
            - generic [ref=e361]: a
          - generic [ref=e363]:
            - generic [ref=e364]: "n"
            - generic [ref=e365]: e
            - generic [ref=e366]: w
          - generic [ref=e368]:
            - generic [ref=e369]: w
            - generic [ref=e370]: o
            - generic [ref=e371]: r
            - generic [ref=e372]: d
          - generic [ref=e374]:
            - generic [ref=e375]: "n"
            - generic [ref=e376]: u
            - generic [ref=e377]: m
            - generic [ref=e378]: b
            - generic [ref=e379]: e
            - generic [ref=e380]: r
          - generic [ref=e382]:
            - generic [ref=e383]: a
            - generic [ref=e384]: "n"
            - generic [ref=e385]: t
          - generic [ref=e387]:
            - generic [ref=e388]: h
            - generic [ref=e389]: a
            - generic [ref=e390]: p
            - generic [ref=e391]: p
            - generic [ref=e392]: "y"
          - generic [ref=e394]:
            - generic [ref=e395]: s
            - generic [ref=e396]: t
            - generic [ref=e397]: r
            - generic [ref=e398]: e
            - generic [ref=e399]: e
            - generic [ref=e400]: t
          - generic [ref=e402]:
            - generic [ref=e403]: i
            - generic [ref=e404]: s
          - generic [ref=e406]:
            - generic [ref=e407]: g
            - generic [ref=e408]: i
            - generic [ref=e409]: v
            - generic [ref=e410]: e
          - generic [ref=e412]:
            - generic [ref=e413]: m
            - generic [ref=e414]: a
            - generic [ref=e415]: i
            - generic [ref=e416]: "n"
          - generic [ref=e418]:
            - generic [ref=e419]: r
            - generic [ref=e420]: o
            - generic [ref=e421]: o
            - generic [ref=e422]: t
          - generic [ref=e424]:
            - generic [ref=e425]: l
            - generic [ref=e426]: o
            - generic [ref=e427]: v
            - generic [ref=e428]: e
          - generic [ref=e430]:
            - generic [ref=e431]: u
            - generic [ref=e432]: s
            - generic [ref=e433]: e
          - generic [ref=e435]:
            - generic [ref=e436]: t
            - generic [ref=e437]: r
            - generic [ref=e438]: u
            - generic [ref=e439]: e
          - generic [ref=e441]:
            - generic [ref=e442]: t
            - generic [ref=e443]: e
            - generic [ref=e444]: a
            - generic [ref=e445]: r
          - generic [ref=e447]:
            - generic [ref=e448]: j
            - generic [ref=e449]: o
            - generic [ref=e450]: k
            - generic [ref=e451]: e
          - generic [ref=e453]:
            - generic [ref=e454]: s
            - generic [ref=e455]: c
            - generic [ref=e456]: h
            - generic [ref=e457]: o
            - generic [ref=e458]: o
            - generic [ref=e459]: l
          - generic [ref=e461]:
            - generic [ref=e462]: t
            - generic [ref=e463]: w
            - generic [ref=e464]: o
          - generic [ref=e466]:
            - generic [ref=e467]: r
            - generic [ref=e468]: o
            - generic [ref=e469]: o
            - generic [ref=e470]: t
          - generic [ref=e472]:
            - generic [ref=e473]: r
            - generic [ref=e474]: a
            - generic [ref=e475]: t
            - generic [ref=e476]: i
            - generic [ref=e477]: o
          - generic [ref=e479]:
            - generic [ref=e480]: f
            - generic [ref=e481]: r
            - generic [ref=e482]: o
            - generic [ref=e483]: m
          - generic [ref=e485]:
            - generic [ref=e486]: g
            - generic [ref=e487]: r
            - generic [ref=e488]: a
            - generic [ref=e489]: "n"
            - generic [ref=e490]: d
          - generic [ref=e492]:
            - generic [ref=e493]: w
            - generic [ref=e494]: a
            - generic [ref=e495]: "n"
            - generic [ref=e496]: t
          - generic [ref=e498]:
            - generic [ref=e499]: s
            - generic [ref=e500]: t
            - generic [ref=e501]: e
            - generic [ref=e502]: p
          - generic [ref=e504]:
            - generic [ref=e505]: s
            - generic [ref=e506]: a
            - generic [ref=e507]: m
            - generic [ref=e508]: e
          - generic [ref=e510]:
            - generic [ref=e511]: w
            - generic [ref=e512]: a
            - generic [ref=e513]: l
            - generic [ref=e514]: k
          - generic [ref=e516]:
            - generic [ref=e517]: p
            - generic [ref=e518]: a
            - generic [ref=e519]: i
            - generic [ref=e520]: "n"
            - generic [ref=e521]: t
          - generic [ref=e523]:
            - generic [ref=e524]: f
            - generic [ref=e525]: a
            - generic [ref=e526]: r
          - generic [ref=e528]:
            - generic [ref=e529]: j
            - generic [ref=e530]: u
            - generic [ref=e531]: s
            - generic [ref=e532]: t
          - generic [ref=e534]:
            - generic [ref=e535]: m
            - generic [ref=e536]: i
            - generic [ref=e537]: "n"
            - generic [ref=e538]: e
          - generic [ref=e540]:
            - generic [ref=e541]: f
            - generic [ref=e542]: l
            - generic [ref=e543]: o
            - generic [ref=e544]: w
          - generic [ref=e546]:
            - generic [ref=e547]: p
            - generic [ref=e548]: l
            - generic [ref=e549]: a
            - generic [ref=e550]: c
            - generic [ref=e551]: e
          - generic [ref=e553]:
            - generic [ref=e554]: k
            - generic [ref=e555]: "n"
            - generic [ref=e556]: o
            - generic [ref=e557]: w
          - generic [ref=e559]:
            - generic [ref=e560]: f
            - generic [ref=e561]: i
            - generic [ref=e562]: "n"
            - generic [ref=e563]: d
          - generic [ref=e565]:
            - generic [ref=e566]: w
            - generic [ref=e567]: i
            - generic [ref=e568]: "n"
            - generic [ref=e569]: d
          - generic [ref=e571]:
            - generic [ref=e572]: f
            - generic [ref=e573]: i
            - generic [ref=e574]: r
            - generic [ref=e575]: e
          - generic [ref=e577]:
            - generic [ref=e578]: t
            - generic [ref=e579]: h
            - generic [ref=e580]: i
            - generic [ref=e581]: "n"
            - generic [ref=e582]: g
          - generic [ref=e584]:
            - generic [ref=e585]: l
            - generic [ref=e586]: e
            - generic [ref=e587]: a
            - generic [ref=e588]: r
            - generic [ref=e589]: "n"
          - generic [ref=e591]:
            - generic [ref=e592]: s
            - generic [ref=e593]: t
            - generic [ref=e594]: o
            - generic [ref=e595]: "n"
            - generic [ref=e596]: e
          - generic [ref=e598]:
            - generic [ref=e599]: m
            - generic [ref=e600]: o
            - generic [ref=e601]: v
            - generic [ref=e602]: e
          - generic [ref=e604]:
            - generic [ref=e605]: l
            - generic [ref=e606]: a
            - generic [ref=e607]: t
            - generic [ref=e608]: e
            - generic [ref=e609]: r
          - generic [ref=e611]:
            - generic [ref=e612]: d
            - generic [ref=e613]: e
            - generic [ref=e614]: e
            - generic [ref=e615]: p
          - generic [ref=e617]:
            - generic [ref=e618]: p
            - generic [ref=e619]: r
            - generic [ref=e620]: e
            - generic [ref=e621]: t
            - generic [ref=e622]: t
            - generic [ref=e623]: "y"
          - generic [ref=e625]:
            - generic [ref=e626]: "n"
            - generic [ref=e627]: u
            - generic [ref=e628]: m
            - generic [ref=e629]: b
            - generic [ref=e630]: e
            - generic [ref=e631]: r
          - generic [ref=e633]:
            - generic [ref=e634]: t
            - generic [ref=e635]: h
            - generic [ref=e636]: a
            - generic [ref=e637]: "n"
            - generic [ref=e638]: k
          - generic [ref=e640]:
            - generic [ref=e641]: d
            - generic [ref=e642]: r
            - generic [ref=e643]: a
            - generic [ref=e644]: w
          - generic [ref=e646]:
            - generic [ref=e647]: t
            - generic [ref=e648]: i
            - generic [ref=e649]: r
            - generic [ref=e650]: e
          - generic [ref=e652]:
            - generic [ref=e653]: p
            - generic [ref=e654]: r
            - generic [ref=e655]: e
            - generic [ref=e656]: t
            - generic [ref=e657]: t
            - generic [ref=e658]: "y"
          - generic [ref=e660]:
            - generic [ref=e661]: s
            - generic [ref=e662]: o
            - generic [ref=e663]: r
            - generic [ref=e664]: t
          - generic [ref=e666]:
            - generic [ref=e667]: i
            - generic [ref=e668]: f
          - generic [ref=e670]:
            - generic [ref=e671]: a
            - generic [ref=e672]: "n"
            - generic [ref=e673]: t
          - generic [ref=e675]:
            - generic [ref=e676]: w
            - generic [ref=e677]: i
            - generic [ref=e678]: d
            - generic [ref=e679]: e
          - generic [ref=e681]:
            - generic [ref=e682]: z
            - generic [ref=e683]: i
            - generic [ref=e684]: "n"
            - generic [ref=e685]: c
          - generic [ref=e687]:
            - generic [ref=e688]: m
            - generic [ref=e689]: e
          - generic [ref=e691]:
            - generic [ref=e692]: w
            - generic [ref=e693]: h
            - generic [ref=e694]: i
            - generic [ref=e695]: t
            - generic [ref=e696]: e
          - generic [ref=e698]:
            - generic [ref=e699]: p
            - generic [ref=e700]: a
            - generic [ref=e701]: i
            - generic [ref=e702]: "n"
            - generic [ref=e703]: t
          - generic [ref=e705]:
            - generic [ref=e706]: f
            - generic [ref=e707]: i
            - generic [ref=e708]: r
            - generic [ref=e709]: e
          - generic [ref=e711]:
            - generic [ref=e712]: a
            - generic [ref=e713]: s
          - generic [ref=e715]:
            - generic [ref=e716]: t
            - generic [ref=e717]: h
            - generic [ref=e718]: r
            - generic [ref=e719]: e
            - generic [ref=e720]: e
          - generic [ref=e722]:
            - generic [ref=e723]: t
            - generic [ref=e724]: o
            - generic [ref=e725]: o
          - generic [ref=e727]:
            - generic [ref=e728]: t
            - generic [ref=e729]: a
            - generic [ref=e730]: s
            - generic [ref=e731]: t
            - generic [ref=e732]: e
          - generic [ref=e734]:
            - generic [ref=e735]: t
            - generic [ref=e736]: h
            - generic [ref=e737]: o
            - generic [ref=e738]: u
            - generic [ref=e739]: g
            - generic [ref=e740]: h
            - generic [ref=e741]: t
          - generic [ref=e743]:
            - generic [ref=e744]: g
            - generic [ref=e745]: l
            - generic [ref=e746]: a
            - generic [ref=e747]: s
            - generic [ref=e748]: s
          - generic [ref=e750]:
            - generic [ref=e751]: k
            - generic [ref=e752]: e
            - generic [ref=e753]: "y"
          - generic [ref=e755]:
            - generic [ref=e756]: p
            - generic [ref=e757]: u
            - generic [ref=e758]: t
          - generic [ref=e760]:
            - generic [ref=e761]: p
            - generic [ref=e762]: a
            - generic [ref=e763]: r
            - generic [ref=e764]: k
          - generic [ref=e766]:
            - generic [ref=e767]: l
            - generic [ref=e768]: a
            - generic [ref=e769]: "n"
            - generic [ref=e770]: d
          - generic [ref=e772]:
            - generic [ref=e773]: h
            - generic [ref=e774]: o
            - generic [ref=e775]: w
          - generic [ref=e777]:
            - generic [ref=e778]: e
            - generic [ref=e779]: "n"
            - generic [ref=e780]: d
          - generic [ref=e782]:
            - generic [ref=e783]: m
            - generic [ref=e784]: o
            - generic [ref=e785]: v
            - generic [ref=e786]: e
          - generic [ref=e788]:
            - generic [ref=e789]: w
            - generic [ref=e790]: h
            - generic [ref=e791]: "y"
          - generic [ref=e793]:
            - generic [ref=e794]: h
            - generic [ref=e795]: o
            - generic [ref=e796]: w
          - generic [ref=e798]:
            - generic [ref=e799]: c
            - generic [ref=e800]: l
            - generic [ref=e801]: e
            - generic [ref=e802]: a
            - generic [ref=e803]: "n"
          - generic [ref=e805]:
            - generic [ref=e806]: t
            - generic [ref=e807]: o
            - generic [ref=e808]: "n"
          - generic [ref=e810]:
            - generic [ref=e811]: "n"
            - generic [ref=e812]: o
            - generic [ref=e813]: r
            - generic [ref=e814]: t
            - generic [ref=e815]: h
        - paragraph [ref=e816]: "Practice passage: rest book name hope want work please tire question write why very space each draw town simple paper mean test set with end train tea your his speed point high yes kite great see three order shore hill send paint with me these she make era new word number ant happy street is give main root love use true tear joke school two root ratio from grand want step same walk paint far just mine flow place know find wind fire thing learn stone move later deep pretty number thank draw tire pretty sort if ant wide zinc me white paint fire as three too taste thought glass key put park land how end move why how clean ton north"
        - textbox "Typing input" [active] [ref=e817]: x
      - generic [ref=e819]:
        - generic [ref=e820]:
          - generic [ref=e821]:
            - text: You typed
            - generic [ref=e822]: x
          - generic [ref=e823]:
            - text: Expected
            - generic [ref=e824]: r
          - generic [ref=e825]: Added to your text · Backspace to correct, or keep typing.
        - status [ref=e826]: You typed x. Expected r. Added to your text. Backspace to correct, or keep typing. 1 incorrect attempts so far.
      - generic [ref=e827]:
        - paragraph [ref=e828]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
        - generic [ref=e829]:
          - button "Restart with new text" [ref=e830]
          - button "Show accessible text editor" [ref=e834]
          - button "Pause practice" [ref=e838]
          - button "Finish" [ref=e842]
      - status [ref=e845]: Test running
  - contentinfo [ref=e846]:
    - generic [ref=e847]:
      - generic [ref=e848]:
        - generic [ref=e849]:
          - generic [ref=e850]: Sparow
          - generic [ref=e851]: Type
        - text: Find your rhythm.
      - generic [ref=e852]:
        - link "About & metrics" [ref=e853] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e854] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e855] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e856] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e857] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e858] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e859]: SparowType © 2026
```

# Test source

```ts
  173 | test("a replay during the closing fade owns its lifetime instead of inheriting the previous exit timer", async ({
  174 |   page,
  175 | }) => {
  176 |   const opening = await firstOpening(page);
  177 |   await page.keyboard.press("Escape");
  178 |   await expect(opening).toHaveAttribute("data-closing", "true");
  179 |   await page.evaluate(
  180 |     (name) => window.dispatchEvent(new Event(name)),
  181 |     INTRO_REPLAY_EVENT,
  182 |   );
  183 |   await expect(opening).toHaveAttribute("data-mode", "full");
  184 |   await expect(opening).toHaveAttribute("data-closing", "false");
  185 |   await page.clock.runFor(200);
  186 |   await expect(opening).toHaveAttribute("data-mode", "full");
  187 |   await expect(opening).toHaveAttribute("data-closing", "false");
  188 |   await expect(
  189 |     page.getByRole("textbox", { name: "Typing input", exact: true }),
  190 |   ).toHaveCount(0);
  191 |   await page.keyboard.press("Escape");
  192 |   await page.clock.runFor(200);
  193 |   await expectReadyPractice(page);
  194 | });
  195 | 
  196 | test("automatic caret handoff leaves the first real keystroke available to practice", async ({
  197 |   page,
  198 | }) => {
  199 |   await page.addInitScript(() => {
  200 |     const original = Element.prototype.animate;
  201 |     Element.prototype.animate = function (...args) {
  202 |       if (this.classList.contains("awakening-handoff"))
  203 |         document.documentElement.dataset.caretHandoffs = String(
  204 |           Number(document.documentElement.dataset.caretHandoffs || 0) + 1,
  205 |         );
  206 |       return Reflect.apply(original, this, args);
  207 |     };
  208 |   });
  209 |   await firstOpening(page);
  210 |   await completeAutomaticOpening(page);
  211 |   const input = await expectReadyPractice(page);
  212 |   await page.clock.runFor(80);
  213 |   await expect(page.locator("html")).toHaveAttribute(
  214 |     "data-caret-handoffs",
  215 |     "1",
  216 |   );
  217 |   await input.pressSequentially("x");
  218 |   await expect(input).toHaveValue("x");
  219 |   await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  220 |   await expect(
  221 |     page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  222 |   ).not.toHaveCSS("visibility", "hidden");
  223 | });
  224 | 
  225 | for (const failure of [
  226 |   "blocked chunk",
  227 |   "late chunk",
  228 |   "animation API",
  229 | ] as const) {
  230 |   test(`caret handoff ${failure} preserves input and the real caret`, async ({
  231 |     page,
  232 |   }) => {
  233 |     const errors: string[] = [];
  234 |     page.on("pageerror", (error) => errors.push(error.message));
  235 |     let release = () => {};
  236 |     if (failure === "blocked chunk")
  237 |       await page.route(/\/assets\/caret-handoff[^/]*\.js/, (route) =>
  238 |         route.abort(),
  239 |       );
  240 |     if (failure === "late chunk") {
  241 |       const gate = new Promise<void>((resolve) => {
  242 |         release = resolve;
  243 |       });
  244 |       await page.route(/\/assets\/caret-handoff[^/]*\.js/, async (route) => {
  245 |         await gate;
  246 |         await route.continue();
  247 |       });
  248 |     }
  249 |     if (failure === "animation API")
  250 |       await page.addInitScript(() => {
  251 |         const original = Element.prototype.animate;
  252 |         Element.prototype.animate = function (...args) {
  253 |           if (this.classList.contains("awakening-handoff")) {
  254 |             document.documentElement.dataset.handoffAnimationFailure =
  255 |               "exercised";
  256 |             throw new Error("Unavailable animation");
  257 |           }
  258 |           return Reflect.apply(original, this, args);
  259 |         };
  260 |       });
  261 |     await firstOpening(page);
  262 |     await completeAutomaticOpening(page);
  263 |     const input = await expectReadyPractice(page);
  264 |     if (failure === "animation API") {
  265 |       await page.clock.runFor(80);
  266 |       await expect(page.locator("html")).toHaveAttribute(
  267 |         "data-handoff-animation-failure",
  268 |         "exercised",
  269 |       );
  270 |     }
  271 |     await input.pressSequentially("x");
  272 |     if (failure === "late chunk") {
> 273 |       const response = page.waitForResponse(/\/assets\/caret-handoff[^/]*\.js/);
      |                             ^ Error: page.waitForResponse: Test timeout of 30000ms exceeded.
  274 |       release();
  275 |       await response;
  276 |     }
  277 |     await page.clock.runFor(100);
  278 |     await expect(input).toHaveValue("x");
  279 |     await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  280 |     await expect(
  281 |       page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  282 |     ).not.toHaveCSS("visibility", "hidden");
  283 |     expect(errors).toEqual([]);
  284 |   });
  285 | }
  286 | 
  287 | test.describe("touch entry", () => {
  288 |   test.use({ hasTouch: true });
  289 |   test("a tap on the composition skips and leaves practice ready", async ({
  290 |     page,
  291 |   }) => {
  292 |     const opening = await firstOpening(page);
  293 |     await opening.tap({ position: { x: 30, y: 100 } });
  294 |     await page.clock.runFor(200);
  295 |     await expectReadyPractice(page);
  296 |   });
  297 | });
  298 | 
  299 | for (const source of ["system", "device preference"] as const) {
  300 |   test(`${source} reduced motion uses the 300ms wordmark without downloading WebGL`, async ({
  301 |     page,
  302 |   }) => {
  303 |     const rendererRequests: string[] = [];
  304 |     page.on("request", (request) => {
  305 |       if (
  306 |         /keyboard-scene|keyboard-bloom|deps\/(three|gsap)/.test(request.url())
  307 |       )
  308 |         rendererRequests.push(request.url());
  309 |     });
  310 |     if (source === "system")
  311 |       await page.emulateMedia({ reducedMotion: "reduce" });
  312 |     else
  313 |       await page.addInitScript((key) => {
  314 |         localStorage.setItem(
  315 |           key,
  316 |           JSON.stringify({ schemaVersion: 3, values: { reducedMotion: true } }),
  317 |         );
  318 |       }, PREFERENCES_KEY);
  319 |     await holdClock(page);
  320 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  321 |     const opening = page.getByTestId("opening-experience");
  322 |     await expect(opening).toHaveAttribute("data-mode", "reduced");
  323 |     await expect(opening.locator("canvas")).toHaveCount(0);
  324 |     await page.clock.fastForward(290);
  325 |     await expect(opening).toBeVisible();
  326 |     await page.clock.runFor(11);
  327 |     await expectReadyPractice(page);
  328 |     expect(rendererRequests).toEqual([]);
  329 |   });
  330 | }
  331 | 
  332 | test("deep links remain immediate and a device opt-out persists through manual replay", async ({
  333 |   page,
  334 | }) => {
  335 |   await holdClock(page);
  336 |   await page.goto("/learn");
  337 |   await expect(
  338 |     page.getByRole("region", { name: "Adaptive typing lesson", exact: true }),
  339 |   ).toBeVisible();
  340 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  341 |   await page.addInitScript(
  342 |     (key) => localStorage.setItem(key, "false"),
  343 |     INTRO_ENABLED_STORAGE_KEY,
  344 |   );
  345 |   await page.goto("/");
  346 |   await expectReadyPractice(page);
  347 |   await page.goto("/settings");
  348 |   const toggle = page.getByRole("checkbox", {
  349 |     name: "Opening animation",
  350 |     exact: true,
  351 |   });
  352 |   await expect(toggle).not.toBeChecked();
  353 |   const replay = page.getByRole("button", {
  354 |     name: "Replay opening animation",
  355 |     exact: true,
  356 |   });
  357 |   await replay.click();
  358 |   await expect(page.getByTestId("opening-experience")).toHaveAttribute(
  359 |     "data-mode",
  360 |     "full",
  361 |   );
  362 |   await page.getByRole("button", { name: "Skip intro", exact: false }).click();
  363 |   await page.clock.runFor(200);
  364 |   await expect(replay).toBeFocused();
  365 |   await expect(toggle).not.toBeChecked();
  366 | });
  367 | 
  368 | test("blocked browser storage and unavailable WebGL retain a complete fallback keyboard", async ({
  369 |   page,
  370 | }) => {
  371 |   await page.addInitScript(() => {
  372 |     for (const name of ["localStorage", "sessionStorage"])
  373 |       Object.defineProperty(window, name, {
```