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
              - generic [aria-hidden]: t
            - generic [ref=e80]: o
            - generic [ref=e81]: p
          - generic [ref=e83]:
            - generic [ref=e84]: p
            - generic [ref=e85]: a
            - generic [ref=e86]: i
            - generic [ref=e87]: "n"
            - generic [ref=e88]: t
          - generic [ref=e90]:
            - generic [ref=e91]: q
            - generic [ref=e92]: u
            - generic [ref=e93]: i
            - generic [ref=e94]: e
            - generic [ref=e95]: t
          - generic [ref=e97]:
            - generic [ref=e98]: i
            - generic [ref=e99]: r
            - generic [ref=e100]: o
            - generic [ref=e101]: "n"
          - generic [ref=e103]:
            - generic [ref=e104]: o
            - generic [ref=e105]: "n"
          - generic [ref=e107]:
            - generic [ref=e108]: p
            - generic [ref=e109]: a
            - generic [ref=e110]: g
            - generic [ref=e111]: e
          - generic [ref=e113]:
            - generic [ref=e114]: w
            - generic [ref=e115]: a
            - generic [ref=e116]: "n"
            - generic [ref=e117]: t
          - generic [ref=e119]:
            - generic [ref=e120]: s
            - generic [ref=e121]: a
            - generic [ref=e122]: v
            - generic [ref=e123]: e
          - generic [ref=e125]:
            - generic [ref=e126]: g
            - generic [ref=e127]: r
            - generic [ref=e128]: o
            - generic [ref=e129]: w
          - generic [ref=e131]:
            - generic [ref=e132]: w
            - generic [ref=e133]: i
            - generic [ref=e134]: s
            - generic [ref=e135]: h
          - generic [ref=e137]:
            - generic [ref=e138]: l
            - generic [ref=e139]: a
            - generic [ref=e140]: k
            - generic [ref=e141]: e
          - generic [ref=e143]:
            - generic [ref=e144]: s
            - generic [ref=e145]: a
            - generic [ref=e146]: m
            - generic [ref=e147]: e
          - generic [ref=e149]:
            - generic [ref=e150]: q
            - generic [ref=e151]: u
            - generic [ref=e152]: i
            - generic [ref=e153]: e
            - generic [ref=e154]: t
          - generic [ref=e156]:
            - generic [ref=e157]: w
            - generic [ref=e158]: a
            - generic [ref=e159]: t
            - generic [ref=e160]: e
            - generic [ref=e161]: r
          - generic [ref=e163]:
            - generic [ref=e164]: s
            - generic [ref=e165]: e
            - generic [ref=e166]: v
            - generic [ref=e167]: e
            - generic [ref=e168]: "n"
          - generic [ref=e170]:
            - generic [ref=e171]: s
            - generic [ref=e172]: p
            - generic [ref=e173]: e
            - generic [ref=e174]: e
            - generic [ref=e175]: d
          - generic [ref=e177]:
            - generic [ref=e178]: t
            - generic [ref=e179]: i
            - generic [ref=e180]: e
            - generic [ref=e181]: r
          - generic [ref=e183]:
            - generic [ref=e184]: t
            - generic [ref=e185]: i
            - generic [ref=e186]: m
            - generic [ref=e187]: e
          - generic [ref=e189]:
            - generic [ref=e190]: "n"
            - generic [ref=e191]: a
            - generic [ref=e192]: t
            - generic [ref=e193]: i
            - generic [ref=e194]: o
            - generic [ref=e195]: "n"
          - generic [ref=e197]:
            - generic [ref=e198]: g
            - generic [ref=e199]: r
            - generic [ref=e200]: a
            - generic [ref=e201]: s
            - generic [ref=e202]: s
          - generic [ref=e204]:
            - generic [ref=e205]: o
            - generic [ref=e206]: l
            - generic [ref=e207]: d
          - generic [ref=e209]:
            - generic [ref=e210]: m
            - generic [ref=e211]: a
            - generic [ref=e212]: k
            - generic [ref=e213]: e
          - generic [ref=e215]:
            - generic [ref=e216]: "n"
            - generic [ref=e217]: u
            - generic [ref=e218]: m
            - generic [ref=e219]: b
            - generic [ref=e220]: e
            - generic [ref=e221]: r
          - generic [ref=e223]:
            - generic [ref=e224]: s
            - generic [ref=e225]: p
            - generic [ref=e226]: r
            - generic [ref=e227]: i
            - generic [ref=e228]: "n"
            - generic [ref=e229]: g
          - generic [ref=e231]:
            - generic [ref=e232]: s
            - generic [ref=e233]: t
            - generic [ref=e234]: u
            - generic [ref=e235]: d
            - generic [ref=e236]: "y"
          - generic [ref=e238]:
            - generic [ref=e239]: s
            - generic [ref=e240]: e
            - generic [ref=e241]: c
            - generic [ref=e242]: o
            - generic [ref=e243]: "n"
            - generic [ref=e244]: d
          - generic [ref=e246]:
            - generic [ref=e247]: t
            - generic [ref=e248]: o
          - generic [ref=e250]:
            - generic [ref=e251]: w
            - generic [ref=e252]: a
            - generic [ref=e253]: t
            - generic [ref=e254]: c
            - generic [ref=e255]: h
          - generic [ref=e257]:
            - generic [ref=e258]: w
            - generic [ref=e259]: h
            - generic [ref=e260]: i
            - generic [ref=e261]: c
            - generic [ref=e262]: h
          - generic [ref=e264]: i
          - generic [ref=e267]:
            - generic [ref=e268]: r
            - generic [ref=e269]: o
            - generic [ref=e270]: o
            - generic [ref=e271]: t
          - generic [ref=e273]:
            - generic [ref=e274]: g
            - generic [ref=e275]: o
            - generic [ref=e276]: l
            - generic [ref=e277]: d
          - generic [ref=e279]:
            - generic [ref=e280]: h
            - generic [ref=e281]: i
            - generic [ref=e282]: g
            - generic [ref=e283]: h
          - generic [ref=e285]:
            - generic [ref=e286]: "n"
            - generic [ref=e287]: o
            - generic [ref=e288]: r
            - generic [ref=e289]: t
            - generic [ref=e290]: h
          - generic [ref=e292]:
            - generic [ref=e293]: t
            - generic [ref=e294]: h
            - generic [ref=e295]: e
            - generic [ref=e296]: s
            - generic [ref=e297]: e
          - generic [ref=e299]:
            - generic [ref=e300]: r
            - generic [ref=e301]: o
            - generic [ref=e302]: s
            - generic [ref=e303]: e
          - generic [ref=e305]:
            - generic [ref=e306]: s
            - generic [ref=e307]: e
            - generic [ref=e308]: "n"
            - generic [ref=e309]: d
          - generic [ref=e311]:
            - generic [ref=e312]: p
            - generic [ref=e313]: u
            - generic [ref=e314]: t
          - generic [ref=e316]:
            - generic [ref=e317]: r
            - generic [ref=e318]: a
            - generic [ref=e319]: c
            - generic [ref=e320]: e
          - generic [ref=e322]:
            - generic [ref=e323]: h
            - generic [ref=e324]: i
            - generic [ref=e325]: l
            - generic [ref=e326]: l
          - generic [ref=e328]:
            - generic [ref=e329]: e
            - generic [ref=e330]: v
            - generic [ref=e331]: e
            - generic [ref=e332]: r
            - generic [ref=e333]: "y"
          - generic [ref=e335]:
            - generic [ref=e336]: t
            - generic [ref=e337]: h
            - generic [ref=e338]: a
            - generic [ref=e339]: t
          - generic [ref=e341]:
            - generic [ref=e342]: k
            - generic [ref=e343]: e
            - generic [ref=e344]: "y"
          - generic [ref=e346]:
            - generic [ref=e347]: s
            - generic [ref=e348]: h
            - generic [ref=e349]: i
            - generic [ref=e350]: "n"
            - generic [ref=e351]: e
          - generic [ref=e353]:
            - generic [ref=e354]: s
            - generic [ref=e355]: h
            - generic [ref=e356]: i
            - generic [ref=e357]: p
          - generic [ref=e359]:
            - generic [ref=e360]: b
            - generic [ref=e361]: u
            - generic [ref=e362]: i
            - generic [ref=e363]: l
            - generic [ref=e364]: d
          - generic [ref=e366]:
            - generic [ref=e367]: m
            - generic [ref=e368]: a
            - generic [ref=e369]: "y"
          - generic [ref=e371]:
            - generic [ref=e372]: m
            - generic [ref=e373]: a
            - generic [ref=e374]: p
          - generic [ref=e376]:
            - generic [ref=e377]: m
            - generic [ref=e378]: a
            - generic [ref=e379]: d
            - generic [ref=e380]: e
          - generic [ref=e382]:
            - generic [ref=e383]: s
            - generic [ref=e384]: t
            - generic [ref=e385]: a
            - generic [ref=e386]: t
            - generic [ref=e387]: e
          - generic [ref=e389]:
            - generic [ref=e390]: "n"
            - generic [ref=e391]: i
            - generic [ref=e392]: c
            - generic [ref=e393]: e
          - generic [ref=e395]:
            - generic [ref=e396]: t
            - generic [ref=e397]: h
            - generic [ref=e398]: a
            - generic [ref=e399]: t
          - generic [ref=e401]:
            - generic [ref=e402]: t
            - generic [ref=e403]: h
            - generic [ref=e404]: o
            - generic [ref=e405]: s
            - generic [ref=e406]: e
          - generic [ref=e408]:
            - generic [ref=e409]: k
            - generic [ref=e410]: e
            - generic [ref=e411]: e
            - generic [ref=e412]: "n"
          - generic [ref=e414]:
            - generic [ref=e415]: c
            - generic [ref=e416]: o
            - generic [ref=e417]: m
            - generic [ref=e418]: e
          - generic [ref=e420]:
            - generic [ref=e421]: h
            - generic [ref=e422]: o
            - generic [ref=e423]: l
            - generic [ref=e424]: d
          - generic [ref=e426]:
            - generic [ref=e427]: c
            - generic [ref=e428]: l
            - generic [ref=e429]: e
            - generic [ref=e430]: a
            - generic [ref=e431]: "n"
          - generic [ref=e433]:
            - generic [ref=e434]: i
            - generic [ref=e435]: "n"
            - generic [ref=e436]: "n"
            - generic [ref=e437]: a
            - generic [ref=e438]: t
            - generic [ref=e439]: e
          - generic [ref=e441]:
            - generic [ref=e442]: b
            - generic [ref=e443]: o
            - generic [ref=e444]: o
            - generic [ref=e445]: k
          - generic [ref=e447]:
            - generic [ref=e448]: t
            - generic [ref=e449]: w
            - generic [ref=e450]: o
          - generic [ref=e452]:
            - generic [ref=e453]: w
            - generic [ref=e454]: a
            - generic [ref=e455]: "y"
          - generic [ref=e457]:
            - generic [ref=e458]: h
            - generic [ref=e459]: o
            - generic [ref=e460]: w
          - generic [ref=e462]:
            - generic [ref=e463]: r
            - generic [ref=e464]: i
            - generic [ref=e465]: o
            - generic [ref=e466]: t
          - generic [ref=e468]:
            - generic [ref=e469]: s
            - generic [ref=e470]: h
            - generic [ref=e471]: e
          - generic [ref=e473]:
            - generic [ref=e474]: w
            - generic [ref=e475]: a
            - generic [ref=e476]: t
            - generic [ref=e477]: c
            - generic [ref=e478]: h
          - generic [ref=e480]:
            - generic [ref=e481]: b
            - generic [ref=e482]: a
            - generic [ref=e483]: c
            - generic [ref=e484]: k
          - generic [ref=e486]:
            - generic [ref=e487]: l
            - generic [ref=e488]: i
            - generic [ref=e489]: g
            - generic [ref=e490]: h
            - generic [ref=e491]: t
          - generic [ref=e493]:
            - generic [ref=e494]: d
            - generic [ref=e495]: a
            - generic [ref=e496]: "y"
          - generic [ref=e498]:
            - generic [ref=e499]: t
            - generic [ref=e500]: r
            - generic [ref=e501]: u
            - generic [ref=e502]: e
          - generic [ref=e504]:
            - generic [ref=e505]: g
            - generic [ref=e506]: r
            - generic [ref=e507]: o
            - generic [ref=e508]: w
          - generic [ref=e510]:
            - generic [ref=e511]: p
            - generic [ref=e512]: r
            - generic [ref=e513]: a
            - generic [ref=e514]: c
            - generic [ref=e515]: t
            - generic [ref=e516]: i
            - generic [ref=e517]: c
            - generic [ref=e518]: e
          - generic [ref=e520]:
            - generic [ref=e521]: v
            - generic [ref=e522]: o
            - generic [ref=e523]: i
            - generic [ref=e524]: c
            - generic [ref=e525]: e
          - generic [ref=e527]:
            - generic [ref=e528]: m
            - generic [ref=e529]: u
            - generic [ref=e530]: s
            - generic [ref=e531]: t
          - generic [ref=e533]:
            - generic [ref=e534]: s
            - generic [ref=e535]: h
            - generic [ref=e536]: o
            - generic [ref=e537]: r
            - generic [ref=e538]: e
          - generic [ref=e540]:
            - generic [ref=e541]: "n"
            - generic [ref=e542]: e
            - generic [ref=e543]: s
            - generic [ref=e544]: t
          - generic [ref=e546]:
            - generic [ref=e547]: a
            - generic [ref=e548]: t
          - generic [ref=e550]:
            - generic [ref=e551]: s
            - generic [ref=e552]: e
            - generic [ref=e553]: "n"
            - generic [ref=e554]: t
          - generic [ref=e556]:
            - generic [ref=e557]: p
            - generic [ref=e558]: a
            - generic [ref=e559]: i
            - generic [ref=e560]: "n"
            - generic [ref=e561]: t
          - generic [ref=e563]:
            - generic [ref=e564]: s
            - generic [ref=e565]: t
            - generic [ref=e566]: r
            - generic [ref=e567]: e
            - generic [ref=e568]: e
            - generic [ref=e569]: t
          - generic [ref=e571]:
            - generic [ref=e572]: b
            - generic [ref=e573]: a
            - generic [ref=e574]: c
            - generic [ref=e575]: k
          - generic [ref=e577]:
            - generic [ref=e578]: "n"
            - generic [ref=e579]: i
            - generic [ref=e580]: g
            - generic [ref=e581]: h
            - generic [ref=e582]: t
          - generic [ref=e584]:
            - generic [ref=e585]: m
            - generic [ref=e586]: a
            - generic [ref=e587]: k
            - generic [ref=e588]: e
          - generic [ref=e590]:
            - generic [ref=e591]: e
            - generic [ref=e592]: a
            - generic [ref=e593]: t
          - generic [ref=e595]:
            - generic [ref=e596]: s
            - generic [ref=e597]: c
            - generic [ref=e598]: h
            - generic [ref=e599]: o
            - generic [ref=e600]: o
            - generic [ref=e601]: l
          - generic [ref=e603]:
            - generic [ref=e604]: w
            - generic [ref=e605]: o
            - generic [ref=e606]: r
            - generic [ref=e607]: l
            - generic [ref=e608]: d
          - generic [ref=e610]:
            - generic [ref=e611]: h
            - generic [ref=e612]: i
            - generic [ref=e613]: g
            - generic [ref=e614]: h
          - generic [ref=e616]:
            - generic [ref=e617]: t
            - generic [ref=e618]: a
            - generic [ref=e619]: s
            - generic [ref=e620]: t
            - generic [ref=e621]: e
          - generic [ref=e623]:
            - generic [ref=e624]: h
            - generic [ref=e625]: o
            - generic [ref=e626]: w
          - generic [ref=e628]:
            - generic [ref=e629]: a
            - generic [ref=e630]: "n"
            - generic [ref=e631]: t
            - generic [ref=e632]: e
          - generic [ref=e634]:
            - generic [ref=e635]: r
            - generic [ref=e636]: a
            - generic [ref=e637]: t
            - generic [ref=e638]: i
            - generic [ref=e639]: o
          - generic [ref=e641]:
            - generic [ref=e642]: t
            - generic [ref=e643]: r
            - generic [ref=e644]: u
            - generic [ref=e645]: e
          - generic [ref=e647]:
            - generic [ref=e648]: g
            - generic [ref=e649]: r
            - generic [ref=e650]: a
            - generic [ref=e651]: s
            - generic [ref=e652]: s
          - generic [ref=e654]:
            - generic [ref=e655]: b
            - generic [ref=e656]: r
            - generic [ref=e657]: i
            - generic [ref=e658]: "n"
            - generic [ref=e659]: g
          - generic [ref=e661]:
            - generic [ref=e662]: u
            - generic [ref=e663]: "n"
            - generic [ref=e664]: d
            - generic [ref=e665]: e
            - generic [ref=e666]: r
          - generic [ref=e668]:
            - generic [ref=e669]: w
            - generic [ref=e670]: h
            - generic [ref=e671]: a
            - generic [ref=e672]: t
          - generic [ref=e674]:
            - generic [ref=e675]: s
            - generic [ref=e676]: a
            - generic [ref=e677]: "y"
          - generic [ref=e679]:
            - generic [ref=e680]: w
            - generic [ref=e681]: a
            - generic [ref=e682]: t
            - generic [ref=e683]: e
            - generic [ref=e684]: r
          - generic [ref=e686]:
            - generic [ref=e687]: "n"
            - generic [ref=e688]: a
            - generic [ref=e689]: t
            - generic [ref=e690]: i
            - generic [ref=e691]: o
            - generic [ref=e692]: "n"
          - generic [ref=e694]:
            - generic [ref=e695]: s
            - generic [ref=e696]: h
            - generic [ref=e697]: o
            - generic [ref=e698]: r
            - generic [ref=e699]: t
          - generic [ref=e701]:
            - generic [ref=e702]: j
            - generic [ref=e703]: o
            - generic [ref=e704]: k
            - generic [ref=e705]: e
          - generic [ref=e707]:
            - generic [ref=e708]: r
            - generic [ref=e709]: a
            - generic [ref=e710]: c
            - generic [ref=e711]: e
          - generic [ref=e713]:
            - generic [ref=e714]: d
            - generic [ref=e715]: r
            - generic [ref=e716]: a
            - generic [ref=e717]: w
          - generic [ref=e719]:
            - generic [ref=e720]: d
            - generic [ref=e721]: a
            - generic [ref=e722]: r
            - generic [ref=e723]: k
          - generic [ref=e725]:
            - generic [ref=e726]: t
            - generic [ref=e727]: a
            - generic [ref=e728]: k
            - generic [ref=e729]: e
          - generic [ref=e731]:
            - generic [ref=e732]: f
            - generic [ref=e733]: i
            - generic [ref=e734]: "n"
            - generic [ref=e735]: d
          - generic [ref=e737]:
            - generic [ref=e738]: m
            - generic [ref=e739]: a
            - generic [ref=e740]: "y"
          - generic [ref=e742]:
            - generic [ref=e743]: b
            - generic [ref=e744]: u
            - generic [ref=e745]: i
            - generic [ref=e746]: l
            - generic [ref=e747]: d
          - generic [ref=e749]:
            - generic [ref=e750]: h
            - generic [ref=e751]: a
            - generic [ref=e752]: p
            - generic [ref=e753]: p
            - generic [ref=e754]: "y"
          - generic [ref=e756]:
            - generic [ref=e757]: s
            - generic [ref=e758]: c
            - generic [ref=e759]: h
            - generic [ref=e760]: o
            - generic [ref=e761]: o
            - generic [ref=e762]: l
          - generic [ref=e764]:
            - generic [ref=e765]: f
            - generic [ref=e766]: e
            - generic [ref=e767]: e
            - generic [ref=e768]: l
          - generic [ref=e770]:
            - generic [ref=e771]: d
            - generic [ref=e772]: r
            - generic [ref=e773]: a
            - generic [ref=e774]: w
          - generic [ref=e776]:
            - generic [ref=e777]: l
            - generic [ref=e778]: o
            - generic [ref=e779]: v
            - generic [ref=e780]: e
          - generic [ref=e782]:
            - generic [ref=e783]: "y"
            - generic [ref=e784]: e
            - generic [ref=e785]: l
            - generic [ref=e786]: l
            - generic [ref=e787]: o
            - generic [ref=e788]: w
          - generic [ref=e790]:
            - generic [ref=e791]: s
            - generic [ref=e792]: h
            - generic [ref=e793]: i
            - generic [ref=e794]: "n"
            - generic [ref=e795]: e
          - generic [ref=e797]:
            - generic [ref=e798]: z
            - generic [ref=e799]: i
            - generic [ref=e800]: "n"
            - generic [ref=e801]: c
          - generic [ref=e803]:
            - generic [ref=e804]: t
            - generic [ref=e805]: u
            - generic [ref=e806]: r
            - generic [ref=e807]: "n"
          - generic [ref=e809]:
            - generic [ref=e810]: a
            - generic [ref=e811]: "n"
            - generic [ref=e812]: t
            - generic [ref=e813]: e
          - generic [ref=e815]:
            - generic [ref=e816]: l
            - generic [ref=e817]: e
            - generic [ref=e818]: t
          - generic [ref=e820]:
            - generic [ref=e821]: h
            - generic [ref=e822]: i
            - generic [ref=e823]: s
          - generic [ref=e825]:
            - generic [ref=e826]: t
            - generic [ref=e827]: e
            - generic [ref=e828]: a
            - generic [ref=e829]: m
        - paragraph [ref=e830]: "Practice passage: top paint quiet iron on page want save grow wish lake same quiet water seven speed tier time nation grass old make number spring study second to watch which i root gold high north these rose send put race hill every that key shine ship build may map made state nice that those keen come hold clean innate book two way how riot she watch back light day true grow practice voice must shore nest at sent paint street back night make eat school world high taste how ante ratio true grass bring under what say water nation short joke race draw dark take find may build happy school feel draw love yellow shine zinc turn ante let his team"
        - textbox "Typing input" [active] [ref=e831]: x
      - generic [ref=e833]:
        - generic [ref=e834]:
          - generic [ref=e835]:
            - text: You typed
            - generic [ref=e836]: x
          - generic [ref=e837]:
            - text: Expected
            - generic [ref=e838]: t
          - generic [ref=e839]: Added to your text · Backspace to correct, or keep typing.
        - status [ref=e840]: You typed x. Expected t. Added to your text. Backspace to correct, or keep typing. 1 incorrect attempts so far.
      - generic [ref=e841]:
        - paragraph [ref=e842]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
        - generic [ref=e843]:
          - button "Restart with new text" [ref=e844]
          - button "Show accessible text editor" [ref=e848]
          - button "Pause practice" [ref=e852]
          - button "Finish" [ref=e856]
      - status [ref=e859]: Test running
  - contentinfo [ref=e860]:
    - generic [ref=e861]:
      - generic [ref=e862]:
        - generic [ref=e863]:
          - generic [ref=e864]: Sparow
          - generic [ref=e865]: Type
        - text: Find your rhythm.
      - generic [ref=e866]:
        - link "About & metrics" [ref=e867] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e868] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e869] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e870] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e871] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e872] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e873]: SparowType © 2026
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