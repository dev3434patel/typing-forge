# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> default native worker draws the complete keyboard while document tasks, resize and skip remain responsive
- Location: e2e\opening-worker.spec.ts:302:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
      - generic [ref=e12]:
        - button "Switch to light theme" [ref=e13]
        - link "Settings" [ref=e20] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=e24] [cursor=pointer]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e28]:
      - link "Test" [ref=e29] [cursor=pointer]:
        - /url: /
      - link "Learn" [ref=e32] [cursor=pointer]:
        - /url: /learn
      - link "Race" [ref=e36] [cursor=pointer]:
        - /url: /race
      - link "Stats" [ref=e46] [cursor=pointer]:
        - /url: /stats
      - link "Rankings" [ref=e49] [cursor=pointer]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e56] [cursor=pointer]:
        - /url: /keyboard-lab
  - main [ref=e59]:
    - heading "Typing practice" [level=1] [ref=e60]
    - region "Test configuration" [ref=e61]:
      - generic [ref=e62]:
        - group "Test mode" [ref=e63]:
          - button "Time" [pressed] [ref=e64]
          - button "Words" [ref=e68]
          - button "Quote" [ref=e71]
          - button "Code" [ref=e75]
          - button "Custom" [ref=e80]
          - button "Zen" [ref=e84]
        - group "Test duration" [ref=e87]:
          - button "15 seconds" [ref=e88]:
            - text: "15"
            - generic [ref=e89]: seconds
          - button "30 seconds" [pressed] [ref=e90]:
            - text: "30"
            - generic [ref=e91]: seconds
          - button "60 seconds" [ref=e92]:
            - text: "60"
            - generic [ref=e93]: seconds
          - button "120 seconds" [ref=e94]:
            - text: "120"
            - generic [ref=e95]: seconds
      - generic [ref=e96]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e97]:
          - checkbox "Precision mode · stop on errors" [ref=e98]
          - text: Precision mode · stop on errors
        - generic [ref=e99]:
          - text: Language
          - combobox "Language" [ref=e100]:
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
        - button "punctuation" [ref=e101]
        - button "# numbers" [ref=e103]
    - region "Typing session" [ref=e104]:
      - generic [ref=e106]:
        - generic [ref=e107]:
          - generic [ref=e108]: 30s
          - generic [ref=e109]: remaining
        - generic [ref=e110]: —wpm
      - generic [ref=e112]:
        - generic [ref=e114]:
          - generic [ref=e115]:
            - generic [ref=e116]: k
            - generic [ref=e117]: i
            - generic [ref=e118]: "n"
            - generic [ref=e119]: d
          - generic [ref=e121]: a
          - generic [ref=e124]:
            - generic [ref=e125]: s
            - generic [ref=e126]: e
            - generic [ref=e127]: e
            - generic [ref=e128]: "n"
          - generic [ref=e130]:
            - generic [ref=e131]: t
            - generic [ref=e132]: a
            - generic [ref=e133]: l
            - generic [ref=e134]: l
          - generic [ref=e136]:
            - generic [ref=e137]: t
            - generic [ref=e138]: a
            - generic [ref=e139]: l
            - generic [ref=e140]: k
          - generic [ref=e142]:
            - generic [ref=e143]: f
            - generic [ref=e144]: o
            - generic [ref=e145]: r
            - generic [ref=e146]: g
            - generic [ref=e147]: e
          - generic [ref=e149]:
            - generic [ref=e150]: s
            - generic [ref=e151]: h
            - generic [ref=e152]: i
            - generic [ref=e153]: p
          - generic [ref=e155]:
            - generic [ref=e156]: h
            - generic [ref=e157]: e
            - generic [ref=e158]: l
            - generic [ref=e159]: p
          - generic [ref=e161]:
            - generic [ref=e162]: s
            - generic [ref=e163]: e
            - generic [ref=e164]: a
            - generic [ref=e165]: t
          - generic [ref=e167]:
            - generic [ref=e168]: h
            - generic [ref=e169]: o
            - generic [ref=e170]: u
            - generic [ref=e171]: s
            - generic [ref=e172]: e
          - generic [ref=e174]:
            - generic [ref=e175]: w
            - generic [ref=e176]: i
            - generic [ref=e177]: d
            - generic [ref=e178]: e
          - generic [ref=e180]:
            - generic [ref=e181]: o
            - generic [ref=e182]: r
            - generic [ref=e183]: d
            - generic [ref=e184]: e
            - generic [ref=e185]: r
          - generic [ref=e187]:
            - generic [ref=e188]: s
            - generic [ref=e189]: e
            - generic [ref=e190]: a
          - generic [ref=e192]: a
          - generic [ref=e195]:
            - generic [ref=e196]: s
            - generic [ref=e197]: o
            - generic [ref=e198]: m
            - generic [ref=e199]: e
          - generic [ref=e201]:
            - generic [ref=e202]: p
            - generic [ref=e203]: l
            - generic [ref=e204]: e
            - generic [ref=e205]: a
            - generic [ref=e206]: s
            - generic [ref=e207]: e
          - generic [ref=e209]:
            - generic [ref=e210]: e
            - generic [ref=e211]: a
            - generic [ref=e212]: s
            - generic [ref=e213]: e
          - generic [ref=e215]:
            - generic [ref=e216]: f
            - generic [ref=e217]: a
            - generic [ref=e218]: s
            - generic [ref=e219]: t
          - generic [ref=e221]:
            - generic [ref=e222]: a
            - generic [ref=e223]: s
          - generic [ref=e225]:
            - generic [ref=e226]: s
            - generic [ref=e227]: e
            - generic [ref=e228]: "n"
            - generic [ref=e229]: d
          - generic [ref=e231]:
            - generic [ref=e232]: g
            - generic [ref=e233]: r
            - generic [ref=e234]: a
            - generic [ref=e235]: s
            - generic [ref=e236]: s
          - generic [ref=e238]:
            - generic [ref=e239]: t
            - generic [ref=e240]: w
            - generic [ref=e241]: o
          - generic [ref=e243]:
            - generic [ref=e244]: a
            - generic [ref=e245]: "n"
            - generic [ref=e246]: t
          - generic [ref=e248]:
            - generic [ref=e249]: e
            - generic [ref=e250]: a
            - generic [ref=e251]: s
            - generic [ref=e252]: t
          - generic [ref=e254]:
            - generic [ref=e255]: t
            - generic [ref=e256]: o
            - generic [ref=e257]: "n"
          - generic [ref=e259]:
            - generic [ref=e260]: s
            - generic [ref=e261]: o
            - generic [ref=e262]: f
            - generic [ref=e263]: t
          - generic [ref=e265]:
            - generic [ref=e266]: z
            - generic [ref=e267]: i
            - generic [ref=e268]: "n"
            - generic [ref=e269]: c
          - generic [ref=e271]:
            - generic [ref=e272]: h
            - generic [ref=e273]: a
            - generic [ref=e274]: s
          - generic [ref=e276]:
            - generic [ref=e277]: b
            - generic [ref=e278]: l
            - generic [ref=e279]: u
            - generic [ref=e280]: e
          - generic [ref=e282]:
            - generic [ref=e283]: s
            - generic [ref=e284]: t
            - generic [ref=e285]: o
            - generic [ref=e286]: r
            - generic [ref=e287]: "y"
          - generic [ref=e289]:
            - generic [ref=e290]: w
            - generic [ref=e291]: h
            - generic [ref=e292]: e
            - generic [ref=e293]: "n"
          - generic [ref=e295]:
            - generic [ref=e296]: w
            - generic [ref=e297]: o
            - generic [ref=e298]: r
            - generic [ref=e299]: k
          - generic [ref=e301]:
            - generic [ref=e302]: s
            - generic [ref=e303]: t
            - generic [ref=e304]: e
            - generic [ref=e305]: p
          - generic [ref=e307]:
            - generic [ref=e308]: p
            - generic [ref=e309]: o
            - generic [ref=e310]: i
            - generic [ref=e311]: "n"
            - generic [ref=e312]: t
          - generic [ref=e314]:
            - generic [ref=e315]: m
            - generic [ref=e316]: e
            - generic [ref=e317]: e
            - generic [ref=e318]: t
          - generic [ref=e320]:
            - generic [ref=e321]: "y"
            - generic [ref=e322]: o
            - generic [ref=e323]: u
            - generic [ref=e324]: r
          - generic [ref=e326]:
            - generic [ref=e327]: a
            - generic [ref=e328]: t
          - generic [ref=e330]:
            - generic [ref=e331]: "y"
            - generic [ref=e332]: o
            - generic [ref=e333]: u
            - generic [ref=e334]: r
          - generic [ref=e336]:
            - generic [ref=e337]: k
            - generic [ref=e338]: e
            - generic [ref=e339]: e
            - generic [ref=e340]: p
          - generic [ref=e342]:
            - generic [ref=e343]: r
            - generic [ref=e344]: o
            - generic [ref=e345]: a
            - generic [ref=e346]: d
          - generic [ref=e348]:
            - generic [ref=e349]: g
            - generic [ref=e350]: r
            - generic [ref=e351]: o
            - generic [ref=e352]: w
          - generic [ref=e354]:
            - generic [ref=e355]: "n"
            - generic [ref=e356]: e
            - generic [ref=e357]: a
            - generic [ref=e358]: r
          - generic [ref=e360]:
            - generic [ref=e361]: w
            - generic [ref=e362]: o
            - generic [ref=e363]: m
            - generic [ref=e364]: a
            - generic [ref=e365]: "n"
          - generic [ref=e367]:
            - generic [ref=e368]: g
            - generic [ref=e369]: r
            - generic [ref=e370]: a
            - generic [ref=e371]: "n"
            - generic [ref=e372]: d
          - generic [ref=e374]:
            - generic [ref=e375]: r
            - generic [ref=e376]: e
            - generic [ref=e377]: s
            - generic [ref=e378]: t
          - generic [ref=e380]:
            - generic [ref=e381]: m
            - generic [ref=e382]: u
            - generic [ref=e383]: c
            - generic [ref=e384]: h
          - generic [ref=e386]:
            - generic [ref=e387]: p
            - generic [ref=e388]: r
            - generic [ref=e389]: e
            - generic [ref=e390]: t
            - generic [ref=e391]: t
            - generic [ref=e392]: "y"
          - generic [ref=e394]:
            - generic [ref=e395]: w
            - generic [ref=e396]: a
            - generic [ref=e397]: "y"
          - generic [ref=e399]:
            - generic [ref=e400]: t
            - generic [ref=e401]: h
            - generic [ref=e402]: i
            - generic [ref=e403]: "n"
            - generic [ref=e404]: k
          - generic [ref=e406]:
            - generic [ref=e407]: p
            - generic [ref=e408]: l
            - generic [ref=e409]: a
            - generic [ref=e410]: i
            - generic [ref=e411]: "n"
          - generic [ref=e413]:
            - generic [ref=e414]: t
            - generic [ref=e415]: e
            - generic [ref=e416]: l
            - generic [ref=e417]: l
          - generic [ref=e419]:
            - generic [ref=e420]: w
            - generic [ref=e421]: a
            - generic [ref=e422]: t
            - generic [ref=e423]: c
            - generic [ref=e424]: h
          - generic [ref=e426]:
            - generic [ref=e427]: h
            - generic [ref=e428]: a
            - generic [ref=e429]: p
            - generic [ref=e430]: p
            - generic [ref=e431]: "y"
          - generic [ref=e433]:
            - generic [ref=e434]: m
            - generic [ref=e435]: "y"
          - generic [ref=e437]:
            - generic [ref=e438]: s
            - generic [ref=e439]: t
            - generic [ref=e440]: a
            - generic [ref=e441]: i
            - generic [ref=e442]: r
          - generic [ref=e444]:
            - generic [ref=e445]: t
            - generic [ref=e446]: r
            - generic [ref=e447]: e
            - generic [ref=e448]: e
          - generic [ref=e450]:
            - generic [ref=e451]: p
            - generic [ref=e452]: i
            - generic [ref=e453]: "n"
            - generic [ref=e454]: k
          - generic [ref=e456]:
            - generic [ref=e457]: "n"
            - generic [ref=e458]: o
            - generic [ref=e459]: r
            - generic [ref=e460]: t
            - generic [ref=e461]: h
          - generic [ref=e463]:
            - generic [ref=e464]: l
            - generic [ref=e465]: i
            - generic [ref=e466]: "n"
            - generic [ref=e467]: e
          - generic [ref=e469]:
            - generic [ref=e470]: f
            - generic [ref=e471]: e
            - generic [ref=e472]: e
            - generic [ref=e473]: l
          - generic [ref=e475]:
            - generic [ref=e476]: "y"
            - generic [ref=e477]: o
            - generic [ref=e478]: u
          - generic [ref=e480]:
            - generic [ref=e481]: c
            - generic [ref=e482]: o
            - generic [ref=e483]: l
            - generic [ref=e484]: d
          - generic [ref=e486]:
            - generic [ref=e487]: s
            - generic [ref=e488]: e
            - generic [ref=e489]: e
            - generic [ref=e490]: d
          - generic [ref=e492]:
            - generic [ref=e493]: h
            - generic [ref=e494]: i
            - generic [ref=e495]: g
            - generic [ref=e496]: h
          - generic [ref=e498]:
            - generic [ref=e499]: o
            - generic [ref=e500]: f
            - generic [ref=e501]: t
            - generic [ref=e502]: e
            - generic [ref=e503]: "n"
          - generic [ref=e505]:
            - generic [ref=e506]: h
            - generic [ref=e507]: a
            - generic [ref=e508]: p
            - generic [ref=e509]: p
            - generic [ref=e510]: "y"
          - generic [ref=e512]:
            - generic [ref=e513]: w
            - generic [ref=e514]: o
            - generic [ref=e515]: r
            - generic [ref=e516]: l
            - generic [ref=e517]: d
          - generic [ref=e519]:
            - generic [ref=e520]: s
            - generic [ref=e521]: i
            - generic [ref=e522]: d
            - generic [ref=e523]: e
          - generic [ref=e525]:
            - generic [ref=e526]: w
            - generic [ref=e527]: o
            - generic [ref=e528]: r
            - generic [ref=e529]: l
            - generic [ref=e530]: d
          - generic [ref=e532]:
            - generic [ref=e533]: s
            - generic [ref=e534]: o
            - generic [ref=e535]: u
            - generic [ref=e536]: t
            - generic [ref=e537]: h
          - generic [ref=e539]:
            - generic [ref=e540]: h
            - generic [ref=e541]: e
            - generic [ref=e542]: l
            - generic [ref=e543]: p
          - generic [ref=e545]:
            - generic [ref=e546]: h
            - generic [ref=e547]: e
            - generic [ref=e548]: r
            - generic [ref=e549]: e
          - generic [ref=e551]:
            - generic [ref=e552]: t
            - generic [ref=e553]: h
            - generic [ref=e554]: e
            - generic [ref=e555]: "n"
          - generic [ref=e557]:
            - generic [ref=e558]: q
            - generic [ref=e559]: u
            - generic [ref=e560]: i
            - generic [ref=e561]: c
            - generic [ref=e562]: k
          - generic [ref=e564]:
            - generic [ref=e565]: s
            - generic [ref=e566]: m
            - generic [ref=e567]: a
            - generic [ref=e568]: l
            - generic [ref=e569]: l
          - generic [ref=e571]:
            - generic [ref=e572]: t
            - generic [ref=e573]: i
            - generic [ref=e574]: e
          - generic [ref=e576]:
            - generic [ref=e577]: r
            - generic [ref=e578]: a
            - generic [ref=e579]: t
            - generic [ref=e580]: i
            - generic [ref=e581]: o
          - generic [ref=e583]:
            - generic [ref=e584]: l
            - generic [ref=e585]: o
            - generic [ref=e586]: w
          - generic [ref=e588]:
            - generic [ref=e589]: s
            - generic [ref=e590]: h
            - generic [ref=e591]: e
          - generic [ref=e593]:
            - generic [ref=e594]: p
            - generic [ref=e595]: l
            - generic [ref=e596]: a
            - generic [ref=e597]: i
            - generic [ref=e598]: "n"
          - generic [ref=e600]:
            - generic [ref=e601]: k
            - generic [ref=e602]: e
            - generic [ref=e603]: e
            - generic [ref=e604]: p
          - generic [ref=e606]:
            - generic [ref=e607]: t
            - generic [ref=e608]: r
            - generic [ref=e609]: e
            - generic [ref=e610]: e
          - generic [ref=e612]:
            - generic [ref=e613]: "n"
            - generic [ref=e614]: e
            - generic [ref=e615]: a
            - generic [ref=e616]: t
          - generic [ref=e618]:
            - generic [ref=e619]: t
            - generic [ref=e620]: e
            - generic [ref=e621]: "n"
          - generic [ref=e623]:
            - generic [ref=e624]: s
            - generic [ref=e625]: h
            - generic [ref=e626]: a
            - generic [ref=e627]: r
            - generic [ref=e628]: e
          - generic [ref=e630]:
            - generic [ref=e631]: e
            - generic [ref=e632]: a
            - generic [ref=e633]: t
          - generic [ref=e635]:
            - generic [ref=e636]: l
            - generic [ref=e637]: i
            - generic [ref=e638]: f
            - generic [ref=e639]: e
          - generic [ref=e641]:
            - generic [ref=e642]: t
            - generic [ref=e643]: i
            - generic [ref=e644]: e
          - generic [ref=e646]:
            - generic [ref=e647]: e
            - generic [ref=e648]: "y"
            - generic [ref=e649]: e
          - generic [ref=e651]:
            - generic [ref=e652]: e
            - generic [ref=e653]: "y"
            - generic [ref=e654]: e
          - generic [ref=e656]:
            - generic [ref=e657]: t
            - generic [ref=e658]: a
            - generic [ref=e659]: "n"
          - generic [ref=e661]:
            - generic [ref=e662]: l
            - generic [ref=e663]: o
            - generic [ref=e664]: "n"
            - generic [ref=e665]: g
          - generic [ref=e667]:
            - generic [ref=e668]: f
            - generic [ref=e669]: o
            - generic [ref=e670]: c
            - generic [ref=e671]: u
            - generic [ref=e672]: s
          - generic [ref=e674]:
            - generic [ref=e675]: d
            - generic [ref=e676]: a
            - generic [ref=e677]: r
            - generic [ref=e678]: k
          - generic [ref=e680]:
            - generic [ref=e681]: u
            - generic [ref=e682]: p
          - generic [ref=e684]:
            - generic [ref=e685]: p
            - generic [ref=e686]: e
            - generic [ref=e687]: r
            - generic [ref=e688]: s
            - generic [ref=e689]: o
            - generic [ref=e690]: "n"
          - generic [ref=e692]:
            - generic [ref=e693]: d
            - generic [ref=e694]: e
            - generic [ref=e695]: a
            - generic [ref=e696]: r
          - generic [ref=e698]:
            - generic [ref=e699]: s
            - generic [ref=e700]: t
            - generic [ref=e701]: u
            - generic [ref=e702]: d
            - generic [ref=e703]: "y"
          - generic [ref=e705]:
            - generic [ref=e706]: s
            - generic [ref=e707]: p
            - generic [ref=e708]: a
            - generic [ref=e709]: c
            - generic [ref=e710]: e
          - generic [ref=e712]:
            - generic [ref=e713]: t
            - generic [ref=e714]: e
            - generic [ref=e715]: s
            - generic [ref=e716]: t
          - generic [ref=e718]:
            - generic [ref=e719]: s
            - generic [ref=e720]: u
            - generic [ref=e721]: m
            - generic [ref=e722]: m
            - generic [ref=e723]: e
            - generic [ref=e724]: r
          - generic [ref=e726]:
            - generic [ref=e727]: l
            - generic [ref=e728]: e
            - generic [ref=e729]: t
          - generic [ref=e731]:
            - generic [ref=e732]: l
            - generic [ref=e733]: e
            - generic [ref=e734]: t
          - generic [ref=e736]:
            - generic [ref=e737]: c
            - generic [ref=e738]: o
            - generic [ref=e739]: p
            - generic [ref=e740]: "y"
          - generic [ref=e742]:
            - generic [ref=e743]: h
            - generic [ref=e744]: a
            - generic [ref=e745]: r
            - generic [ref=e746]: d
          - generic [ref=e748]:
            - generic [ref=e749]: s
            - generic [ref=e750]: p
            - generic [ref=e751]: e
            - generic [ref=e752]: a
            - generic [ref=e753]: k
          - generic [ref=e755]:
            - generic [ref=e756]: t
            - generic [ref=e757]: h
            - generic [ref=e758]: a
            - generic [ref=e759]: "n"
          - generic [ref=e761]:
            - generic [ref=e762]: h
            - generic [ref=e763]: o
            - generic [ref=e764]: w
          - generic [ref=e766]:
            - generic [ref=e767]: f
            - generic [ref=e768]: i
            - generic [ref=e769]: "n"
            - generic [ref=e770]: e
          - generic [ref=e772]:
            - generic [ref=e773]: l
            - generic [ref=e774]: o
            - generic [ref=e775]: "n"
            - generic [ref=e776]: g
          - generic [ref=e778]:
            - generic [ref=e779]: j
            - generic [ref=e780]: u
            - generic [ref=e781]: s
            - generic [ref=e782]: t
          - generic [ref=e784]:
            - generic [ref=e785]: m
            - generic [ref=e786]: e
          - generic [ref=e788]:
            - generic [ref=e789]: a
            - generic [ref=e790]: t
          - generic [ref=e792]:
            - generic [ref=e793]: p
            - generic [ref=e794]: a
            - generic [ref=e795]: r
            - generic [ref=e796]: k
          - generic [ref=e798]:
            - generic [ref=e799]: p
            - generic [ref=e800]: l
            - generic [ref=e801]: a
            - generic [ref=e802]: i
            - generic [ref=e803]: "n"
          - generic [ref=e805]:
            - generic [ref=e806]: d
            - generic [ref=e807]: r
            - generic [ref=e808]: a
            - generic [ref=e809]: w
          - generic [ref=e811]:
            - generic [ref=e812]: l
            - generic [ref=e813]: e
            - generic [ref=e814]: t
          - generic [ref=e816]:
            - generic [ref=e817]: z
            - generic [ref=e818]: i
            - generic [ref=e819]: "n"
            - generic [ref=e820]: c
          - generic [ref=e822]:
            - generic [ref=e823]: g
            - generic [ref=e824]: r
            - generic [ref=e825]: a
            - generic [ref=e826]: "n"
            - generic [ref=e827]: d
          - generic [ref=e829]:
            - generic [ref=e830]: h
            - generic [ref=e831]: a
            - generic [ref=e832]: p
            - generic [ref=e833]: p
            - generic [ref=e834]: "y"
        - paragraph [ref=e835]: "Practice passage: kind a seen tall talk forge ship help seat house wide order sea a some please ease fast as send grass two ant east ton soft zinc has blue story when work step point meet your at your keep road grow near woman grand rest much pretty way think plain tell watch happy my stair tree pink north line feel you cold seed high often happy world side world south help here then quick small tie ratio low she plain keep tree neat ten share eat life tie eye eye tan long focus dark up person dear study space test summer let let copy hard speak than how fine long just me at park plain draw let zinc grand happy"
        - textbox "Typing input" [active] [ref=e836]
      - generic [ref=e838]:
        - paragraph [ref=e839]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=e840]
      - generic [ref=e841]:
        - paragraph [ref=e842]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=e843]:
          - button "Restart with new text" [ref=e844]
          - button "Show accessible text editor" [ref=e848]
          - button "Finish" [disabled] [ref=e852]
      - status [ref=e855]: Ready to type
  - contentinfo [ref=e856]:
    - generic [ref=e857]:
      - generic [ref=e858]:
        - generic [ref=e859]:
          - generic [ref=e860]: Sparow
          - generic [ref=e861]: Type
        - text: Find your rhythm.
      - generic [ref=e862]:
        - link "About & metrics" [ref=e863] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e864] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e865] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e866] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e867] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e868] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e869]: SparowType © 2026
```

# Test source

```ts
  160 |         name: animation.animationName,
  161 |         currentTime:
  162 |           typeof animation.currentTime === "number"
  163 |             ? animation.currentTime
  164 |             : null,
  165 |         timelineTime:
  166 |           typeof animation.timeline?.currentTime === "number"
  167 |             ? animation.timeline.currentTime
  168 |             : null,
  169 |         timelineId: animation.timeline ? timelines.get(animation.timeline)! : 0,
  170 |         rate: animation.playbackRate,
  171 |         endTime: typeof end === "number" && Number.isFinite(end) ? end : null,
  172 |         state: animation.playState,
  173 |         renderer:
  174 |           target
  175 |             .closest('[data-testid="opening-experience"]')
  176 |             ?.getAttribute("data-renderer") ?? null,
  177 |       };
  178 |     };
  179 |     for (const action of ["pause", "play", "finish"] as const) {
  180 |       const native = Animation.prototype[action];
  181 |       Animation.prototype[action] = function (...args) {
  182 |         const result = Reflect.apply(native, this, args);
  183 |         const measured = sample(this);
  184 |         if (measured)
  185 |           actions.push({ ...measured, action, atMs: performance.now() });
  186 |         return result;
  187 |       };
  188 |     }
  189 |     (window as AuditedWindow).fallbackAnimationAudit = {
  190 |       actions,
  191 |       sample: () =>
  192 |         Array.from(
  193 |           document
  194 |             .querySelector(".awakening-fallback")
  195 |             ?.getAnimations({ subtree: true }) || [],
  196 |         )
  197 |           .map(sample)
  198 |           .filter(
  199 |             (item): item is FallbackAnimationSample =>
  200 |               item !== null && item.name === "awakening-key-dissolve",
  201 |           ),
  202 |     };
  203 |   });
  204 | }
  205 | async function firstWorkerReady(page: Page) {
  206 |   await expect
  207 |     .poll(async () =>
  208 |       (await records(page))[0]?.received.some(
  209 |         (receipt) => receipt.type === "ready",
  210 |       ),
  211 |     )
  212 |     .toBe(true);
  213 | }
  214 | async function firstWorkerInitialized(page: Page) {
  215 |   await expect
  216 |     .poll(async () =>
  217 |       (await records(page))[0]?.sent.some(
  218 |         (receipt) => receipt.type === "initialize",
  219 |       ),
  220 |     )
  221 |     .toBe(true);
  222 | }
  223 | async function readyPractice(page: Page) {
  224 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  225 |   const input = page.getByRole("textbox", {
  226 |     name: "Typing input",
  227 |     exact: true,
  228 |   });
  229 |   await expect(input).toBeVisible();
  230 |   await expect(input).toHaveValue("");
  231 |   await expect(
  232 |     page.getByRole("region", { name: "Typing session", exact: true }),
  233 |   ).toHaveAttribute("data-status", "ready");
  234 |   return input;
  235 | }
  236 | async function expectWorkerClosed(
  237 |   page: Page,
  238 |   policy: "acknowledged" | "watchdog-allowed" = "acknowledged",
  239 | ) {
  240 |   await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  241 |   await expect
  242 |     .poll(
  243 |       () =>
  244 |         page.workers().filter((worker) => workerEntry.test(worker.url()))
  245 |           .length,
  246 |     )
  247 |     .toBe(0);
  248 |   const [record] = await records(page);
  249 |   const dispose = record.sent.find((receipt) => receipt.type === "dispose");
  250 |   if (dispose?.atMs === undefined || record.terminatedAtMs === null)
  251 |     throw new Error(
  252 |       "No monotonic dispose/terminate receipts for native worker",
  253 |     );
  254 |   const acknowledged =
  255 |     record.received.some((receipt) => receipt.type === "disposed") &&
  256 |     record.received.some((receipt) => receipt.diagnostics?.disposed);
  257 |   const elapsedMs = record.terminatedAtMs - dispose.atMs;
  258 |   let path = "acknowledged-disposal";
  259 |   if (policy === "acknowledged" || acknowledged) {
> 260 |     expect(acknowledged).toBe(true);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  261 |   } else {
  262 |     // A busy GPU worker gets a200ms disposal grace period before termination.
  263 |     // Require measured watchdog timing and actual native closure. A missing
  264 |     // acknowledgement alone never establishes successful explicit disposal.
  265 |     expect(elapsedMs).toBeGreaterThanOrEqual(190);
  266 |     expect(elapsedMs).toBeLessThanOrEqual(1000);
  267 |     path = "watchdog-termination-no-disposal-acknowledgement";
  268 |   }
  269 |   await test.info().attach("native-worker-shutdown", {
  270 |     body: JSON.stringify({
  271 |       path,
  272 |       policy,
  273 |       disposeAtMs: dispose.atMs,
  274 |       terminatedAtMs: record.terminatedAtMs,
  275 |       elapsedMs,
  276 |       terminated: record.terminated,
  277 |       liveNativeWorkers: page
  278 |         .workers()
  279 |         .filter((worker) => workerEntry.test(worker.url())).length,
  280 |     }),
  281 |     contentType: "application/json",
  282 |   });
  283 | }
  284 | 
  285 | test.afterEach(async ({ page }, info) => {
  286 |   if (page.isClosed()) return;
  287 |   const observed = await records(page).catch(() => []);
  288 |   await info.attach("native-worker-receipts", {
  289 |     body: JSON.stringify(observed, null, 2),
  290 |     contentType: "application/json",
  291 |   });
  292 |   const animationActions = await page
  293 |     .evaluate(() => (window as AuditedWindow).fallbackAnimationAudit?.actions)
  294 |     .catch(() => undefined);
  295 |   if (animationActions)
  296 |     await info.attach("native-fallback-animation-actions", {
  297 |       body: JSON.stringify(animationActions),
  298 |       contentType: "application/json",
  299 |     });
  300 | });
  301 | 
  302 | test("default native worker draws the complete keyboard while document tasks, resize and skip remain responsive", async ({
  303 |   page,
  304 | }, info) => {
  305 |   await observeNativeWorker(page, info);
  306 |   await page.addInitScript(() => {
  307 |     Object.defineProperty(navigator, "hardwareConcurrency", {
  308 |       configurable: true,
  309 |       get: () => 8,
  310 |     });
  311 |     Object.defineProperty(navigator, "deviceMemory", {
  312 |       configurable: true,
  313 |       get: () => 8,
  314 |     });
  315 |   });
  316 |   await page.emulateMedia({ reducedMotion: "no-preference" });
  317 |   await page.setViewportSize({ width: 1280, height: 800 });
  318 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  319 |   await firstWorkerReady(page);
  320 |   await expect
  321 |     .poll(async () =>
  322 |       (await records(page))[0]?.received.some(
  323 |         (receipt) =>
  324 |           receipt.diagnostics?.thread === "worker" &&
  325 |           receipt.diagnostics.frames > 0 &&
  326 |           receipt.diagnostics.drawCalls > 0,
  327 |       ),
  328 |     )
  329 |     .toBe(true);
  330 |   const [record] = await records(page);
  331 |   const scene = [...record.received]
  332 |     .reverse()
  333 |     .find((receipt) => receipt.diagnostics?.frames)?.diagnostics;
  334 |   if (!scene) throw new Error("No real worker draw diagnostics were received");
  335 |   expect(scene).toMatchObject({
  336 |     thread: "worker",
  337 |     keyCount: 61,
  338 |     keycapMeshes: 1,
  339 |     tier: "desktop",
  340 |     bloom: true,
  341 |     environment: true,
  342 |     environmentIntensity: 0.35,
  343 |     contextLost: false,
  344 |     disposed: false,
  345 |   });
  346 |   expect(scene.cameraElevationDegrees).toBeGreaterThanOrEqual(28);
  347 |   expect(scene.cameraElevationDegrees).toBeLessThanOrEqual(42);
  348 |   expect(
  349 |     record.sent.find((receipt) => receipt.type === "initialize"),
  350 |   ).toMatchObject({ lowPower: false, finePointer: true });
  351 |   const responsiveness = await page.evaluate(async () => {
  352 |     const started = performance.now();
  353 |     await new Promise<void>((resolve) => setTimeout(resolve, 0));
  354 |     const timerAtMs = performance.now() - started;
  355 |     await new Promise<void>((resolve) =>
  356 |       requestAnimationFrame(() => resolve()),
  357 |     );
  358 |     return {
  359 |       timerAtMs,
  360 |       frameAtMs: performance.now() - started,
```