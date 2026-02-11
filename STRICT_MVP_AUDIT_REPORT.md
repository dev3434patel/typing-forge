# Typing Forge – Full MVP Audit & Bug Listing Report

**Date**: February 11, 2026  
**Audit Type**: Strict Step-by-Step MVP Compliance Verification  
**Reference**: MVP_DOCUMENTATION.md

---

## Section A – Mode-Level Issues (Index Page)

### time Mode
**Status**: ✅ **CORRECT**
- **Spec**: Fixed duration (15/30/60/120/180 seconds), random words generated, test ends when time expires
- **Implementation**: `TypingArea.tsx` uses `generateRandomWords()` for time mode, timer counts down correctly, test finishes on expiration
- **Notes**: Correctly implemented

### words Mode
**Status**: ✅ **CORRECT**
- **Spec**: Fixed word count (user selects), random words generated, test ends when word count reached
- **Implementation**: `TypingArea.tsx` uses `generateRandomWords(settings.wordCount, ...)`, word count selection available in `TestSettings.tsx`
- **Notes**: Correctly implemented

### quote Mode
**Status**: ⚠️ **INCORRECT** - Missing Author/Category Display
- **Spec**: "Shows author and category" (MVP_DOCUMENTATION.md line 1291)
- **Implementation**: `TypingArea.tsx` line 85 and 351 only uses `getRandomQuote().text`, does NOT display author or category
- **Problems**: 
  - Quote interface in `quotes.ts` includes `author` and `category` fields
  - `getRandomQuote()` from `quotes.ts` returns full `Quote` object with author/category
  - But `TypingArea.tsx` only displays `.text` property
  - No UI element shows author name or category (tech/motivational/philosophy/science)
- **Why Wrong**: MVP explicitly states quote mode should show author and category, but UI only shows text

### code Mode
**Status**: ✅ **CORRECT** (Previously Fixed)
- **Spec**: Code snippets from library, multiple languages (JS/TS/Python/Rust/SQL), syntax-focused practice
- **Implementation**: 
  - `TypingArea.tsx` line 90-93 uses `getRandomCodeSnippet(settings.codeLanguage)`
  - `Index.tsx` line 62-65 uses `getRandomCodeSnippet(settings.codeLanguage)`
  - `TestSettings.tsx` line 90-107 shows language selector when code mode active
  - `test-store.ts` includes `codeLanguage` setting
- **Notes**: Previously fixed - now correctly uses code snippets instead of paragraphs

### zen Mode
**Status**: ✅ **CORRECT**
- **Spec**: Infinite typing, no timer or word limit, focus on flow and accuracy, can restart anytime
- **Implementation**: `TypingArea.tsx` handles zen mode with infinite text generation, no timer, finish button appears after 10 words
- **Notes**: Correctly implemented

### learn/keybr Mode
**Status**: ✅ **CORRECT**
- **Spec**: Adaptive learning mode, uses only unlocked letters, focuses on weak letters, unlocks new letters as you improve
- **Implementation**: `KeybrLessonMode.tsx` uses `generateKeybrLesson()`, tracks character progress, enforces 100% accuracy requirement
- **Notes**: Correctly implemented

---

## Section B – Page-Level Issues

### /stats (Stats Page)
**Status**: ⚠️ **INCORRECT** - Missing "Today" Filter Option
- **Spec**: Time period filter should include "today" option (MVP_DOCUMENTATION.md line 1412: "Today's stats")
- **Implementation**: 
  - `StatsFilter.tsx` line 56-67 only shows: "All Time", "Last 7 Days", "Last 30 Days", "Last Year"
  - Missing "Today" option
  - `stats-utils.ts` line 100-127 has `filterByTimePeriod()` that supports `'today'` period
  - `Stats.tsx` line 106-109 uses `filterByTimePeriod(testSessions, 'today')` for todayStats calculation
- **Problems**: 
  - UI filter dropdown missing "Today" option
  - Backend utility supports it, but user cannot select it from UI
- **Why Wrong**: MVP spec lists "Today's stats" as a feature, but users cannot filter to today from the UI

### /leaderboard
**Status**: ✅ **CORRECT**
- **Spec**: Time filters (All Time, Weekly, Daily), ranking types (Speed, Accuracy, Consistency, Tests)
- **Implementation**: `Leaderboard.tsx` has all time filters and ranking types correctly implemented
- **Notes**: Correctly implemented

### /profile
**Status**: ✅ **CORRECT**
- **Spec**: Profile header, leaderboard stats, recent test summary, WPM trend, test history, character confidence, settings
- **Implementation**: All features present in `Profile.tsx` and related components
- **Notes**: Correctly implemented

### /auth
**Status**: ✅ **CORRECT**
- **Spec**: Login/signup toggle, email/password auth, username validation (3-50 chars, alphanumeric + underscore/hyphen)
- **Implementation**: `Auth.tsx` line 12-15 has correct regex: `/^[a-zA-Z0-9_-]+$/`
- **Notes**: Correctly implemented

### /race
**Status**: ⚠️ **VERIFICATION NEEDED** - Multiple Items
- **Spec**: Race history feature mentioned in MVP (line 1817: "Race history")
- **Implementation**: No race history page or component found
- **Problems**: 
  - MVP mentions "Race history" as a feature
  - No implementation found in codebase
  - Race results are shown but no historical list of past races
- **Why Wrong**: MVP lists race history as a feature but it's not implemented

**Additional Race Issues**:
1. **Race Duration Selection**: ✅ Correct - `RaceSettings.tsx` shows 15/30/60/120 seconds
2. **Race Countdown Synchronization**: ✅ Correct - `Race.tsx` uses Supabase real-time for synchronized countdown
3. **Race Finish Conditions**: ⚠️ **VERIFICATION NEEDED** - Need to verify time expiration handling
4. **Race Room Code Validation**: ✅ Correct - `Race.tsx` line 354 validates 6 alphanumeric characters
5. **Race Real-Time Channel**: ✅ Correct - `Race.tsx` line 154 uses `race:${roomCode}` format
6. **Race Progress Throttling**: ✅ Correct - `Race.tsx` line 451 uses 200ms throttle
7. **Bot Difficulty Selector**: ✅ Correct - `RaceLobby.tsx` shows bot difficulty options
8. **Race Results Winner Display**: ✅ Correct - `RaceResults.tsx` shows winner correctly

### NotFound
**Status**: ✅ **CORRECT**
- **Spec**: 404 error page with link back to home
- **Implementation**: Standard 404 page exists
- **Notes**: Correctly implemented

---

## Section C – Engine-Level Issues

### lib/metrics-engine.ts
**Status**: ✅ **CORRECT**
- **Functions Verified**:
  - `calculateWpm()`: ✅ Formula matches spec: `(correctChars / 5) / (elapsedMs / 60000)`
  - `calculateRawWpm()`: ✅ Formula matches spec: `(totalTypedChars / 5) / (elapsedMs / 60000)`
  - `calculateAccuracy()`: ✅ Formula matches spec, caps at 99.99% if backspace used
  - `calculateConsistency()`: ✅ Uses coefficient of variation as specified
  - `sanitizeMetric()`: ✅ Prevents NaN/Infinity/negative values
- **Notes**: All functions match MVP specification exactly

### lib/typing-engine.ts
**Status**: ✅ **CORRECT**
- **Functions Verified**:
  - `calculateWPM()`: ✅ Delegates to `metrics-engine.calculateWpm()`
  - `calculateRawWPM()`: ✅ Delegates to `metrics-engine.calculateRawWpm()`
  - `calculateAccuracy()`: ✅ Delegates to `metrics-engine.calculateAccuracy()`
  - `calculateConsistency()`: ✅ Delegates to `metrics-engine.calculateConsistency()`
- **Notes**: Correctly delegates to canonical metrics-engine

### lib/professional-accuracy.ts
**Status**: ⚠️ **INCORRECT** - Character Comparison Not Displayed
- **Function**: `generateProfessionalAccuracyReport()`
- **Spec**: Report includes `charComparison` array (MVP_DOCUMENTATION.md line 1544-1548)
- **Implementation**: 
  - Function generates `charComparison` array correctly (line 198-254)
  - Report includes `charComparison` field (line 546)
- **Problems**: 
  - `ProfessionalResultsScreen.tsx` does NOT display `charComparison` data
  - No UI component shows character-by-character comparison
  - Only shows error analysis (typos) but not full character comparison
- **Why Wrong**: MVP spec states character comparison should be displayed, but UI doesn't show it

### lib/keybr-engine.ts
**Status**: ✅ **CORRECT**
- **Functions Verified**:
  - `generateKeybrLesson()`: ✅ Default wordCount is 50 (line 286), matches spec
  - `updateCharacterProgress()`: ✅ Unlock criteria: ≥35 WPM AND ≥95% accuracy (line 201)
  - `calculatePerCharMetrics()`: ✅ Confidence formula matches spec
  - Weighted updates: ✅ Uses 70% new, 30% old (line 195-196)
- **Notes**: All functions match MVP specification

### lib/race-state-machine.ts
**Status**: ✅ **CORRECT**
- **Functions Verified**:
  - `completeRace()`: ✅ Winner determination logic matches spec (highest progress → highest WPM → earliest finish)
- **Notes**: Correctly implemented

### lib/bot-engine.ts
**Status**: ✅ **CORRECT**
- **Functions Verified**:
  - `BOT_CONFIGS`: ✅ All three levels match MVP spec exactly (target WPM, mistake probability, correction delays, IKI means)
  - `getBotName()`: ✅ Returns bot names as specified
- **Problems**: 
  - Bot names are generated but may not be displayed in race UI
  - `RaceResults.tsx` line 103 shows bot difficulty but may not show bot name
- **Notes**: Bot engine correct, but bot name display needs verification

### lib/stats-utils.ts
**Status**: ✅ **CORRECT**
- **Functions Verified**:
  - `generateSpeedDistribution()`: ✅ Buckets match spec exactly: 0-20, 20-40, 40-60, 60-80, 80-100, 100-120, 120+
  - `calculateAccuracyStreaks()`: ✅ Thresholds match spec: 100%, 98%, 95%, 90%
  - `filterByTimePeriod()`: ✅ Supports 'today' period
  - `calculatePercentile()`: ✅ Calculates percentile correctly
- **Notes**: All functions match MVP specification

### lib/content-library.ts
**Status**: ⚠️ **INCORRECT** - commonWords1000 Has Only 210 Words
- **Function**: `generateWordList()` uses `commonWords1000` array
- **Spec**: Array should contain 1000 common words (MVP_DOCUMENTATION.md line 1688: "Common Words 1000")
- **Implementation**: 
  - `commonWords1000` array (line 4-26) contains only ~210 words, not 1000
  - Array name suggests 1000 words but actual count is much lower
- **Problems**: 
  - Misleading array name
  - Word pool smaller than expected
  - May affect word variety in generated tests
- **Why Wrong**: Array name promises 1000 words but delivers only ~210

**Additional Content Issues**:
- `getRandomQuote()`: ⚠️ **INCORRECT** - Returns `{ content, author }` but `quotes.ts` has `Quote` interface with `category` field that is not returned
- `getRandomCodeSnippet()`: ✅ Correct - Returns code snippets correctly

---

## Section D – Component/Store-Level Issues

### components/typing/TypingArea.tsx
**Status**: ⚠️ **INCORRECT** - Quote Mode Missing Author/Category Display
- **Spec**: Quote mode should display author and category
- **Implementation**: Only displays quote text, no author/category UI
- **Problems**: 
  - Line 85: `text = getRandomQuote().text` - only uses text
  - Line 351: Same issue in `regenerateText()`
  - No UI element to display author or category
- **Placement Issues**: None - logic placement is correct, just missing UI display

### components/typing/ProfessionalResultsScreen.tsx
**Status**: ⚠️ **INCORRECT** - Character Comparison Not Displayed
- **Spec**: Should display character-by-character comparison from `report.charComparison`
- **Implementation**: 
  - Shows error analysis (typos) at line 466-496
  - Shows missed/extra chars counts at line 236-242
  - Does NOT show full character-by-character comparison array
- **Problems**: 
  - `charComparison` data exists in report but not rendered
  - No component displays the full character comparison
- **Placement Issues**: None - component is correct place, just missing display logic

### components/stats/StatsFilter.tsx
**Status**: ⚠️ **INCORRECT** - Missing "Today" Option
- **Spec**: Should include "Today" time filter option
- **Implementation**: Only shows "All Time", "Last 7 Days", "Last 30 Days", "Last Year"
- **Problems**: Missing "Today" option in dropdown
- **Placement Issues**: None - component is correct place, just missing option

### stores/test-store.ts
**Status**: ✅ **CORRECT**
- **Spec**: Test settings include mode, duration, wordCount, punctuation, numbers, codeLanguage
- **Implementation**: All settings present, `codeLanguage` added correctly
- **Notes**: Correctly implemented

### components/race/RaceResults.tsx
**Status**: ⚠️ **VERIFICATION NEEDED** - Bot Name Display
- **Spec**: Should display bot name when racing against bot
- **Implementation**: 
  - Line 100-107 shows bot difficulty label but may not show actual bot name
  - `getBotName()` exists in `bot-engine.ts` but may not be called
- **Problems**: Bot name may not be displayed, only difficulty level shown
- **Notes**: Needs verification if bot name is displayed

---

## Section E – Data/Content Issues

### Quote Data Source
**Status**: ⚠️ **INCORRECT** - Category Not Returned/Displayed
- **Spec**: Quotes have `category` field (MVP_DOCUMENTATION.md line 1223)
- **Implementation**: 
  - `quotes.ts` `Quote` interface includes `category` field (line 5)
  - `quotes.ts` `getRandomQuote()` returns full `Quote` object with category (line 146)
  - `content-library.ts` `getRandomQuote()` returns `{ content, author }` - MISSING category (line 120)
  - `TypingArea.tsx` uses `getRandomQuote()` from `quotes.ts` which has category, but doesn't display it
- **Problems**: 
  - Two different `getRandomQuote()` functions exist
  - `content-library.ts` version doesn't return category
  - Even when category is available, UI doesn't display it
- **Why Wrong**: MVP spec states quotes have categories and should be displayed, but category is not shown

### Code Snippet Data Source
**Status**: ✅ **CORRECT**
- **Spec**: Code snippets from library, multiple languages
- **Implementation**: `getRandomCodeSnippet()` correctly returns code snippets based on language
- **Notes**: Correctly implemented

### Word List Data Source
**Status**: ⚠️ **INCORRECT** - Word Count Discrepancy
- **Spec**: `commonWords1000` should contain 1000 words
- **Implementation**: 
  - `content-library.ts` `commonWords1000` has ~210 words
  - `quotes.ts` `commonWords` has 144 words
  - Two different word pools exist with different counts
- **Problems**: 
  - Array name misleading (suggests 1000 words)
  - Inconsistent word pools between files
- **Why Wrong**: Array name doesn't match actual content

### Keybr Lesson Generation
**Status**: ✅ **CORRECT**
- **Spec**: Uses only unlocked letters, 70% focus words, 30% other words
- **Implementation**: `generateKeybrLesson()` correctly filters by unlocked letters, uses focus ratio
- **Notes**: Correctly implemented

---

## Section F – Metrics & Accuracy Issues

### Metrics Formulas
**Status**: ✅ **CORRECT**
- **WPM Calculation**: ✅ All components use `metrics-engine.calculateWpm()` or delegate through `typing-engine`
- **Raw WPM Calculation**: ✅ All components use canonical functions
- **Accuracy Calculation**: ✅ All components use canonical functions with correct backspace capping
- **Consistency Calculation**: ✅ Uses coefficient of variation as specified
- **Notes**: All metrics correctly use canonical engine

### Professional Accuracy Report
**Status**: ⚠️ **INCORRECT** - Missing Character Comparison Display
- **Spec**: Report includes `charComparison` array that should be displayed
- **Implementation**: 
  - Report generation includes `charComparison` correctly
  - UI does not display character-by-character comparison
  - Only shows error summary (typos list) but not full comparison
- **Problems**: Character comparison data exists but not shown to user
- **Why Wrong**: MVP spec states character comparison should be displayed

### Stats Calculations
**Status**: ✅ **CORRECT**
- **Speed Distribution**: ✅ Buckets match spec exactly
- **Accuracy Streaks**: ✅ Thresholds match spec (100%, 98%, 95%, 90%)
- **Percentile Calculation**: ✅ Calculated correctly
- **Notes**: All stats utilities match MVP specification

### Race Metrics
**Status**: ✅ **CORRECT**
- **WPM Calculation**: ✅ Uses `metrics-engine.calculateWpm()`
- **Accuracy Calculation**: ✅ Uses `metrics-engine.calculateAccuracy()`
- **Progress Calculation**: ✅ Calculated correctly
- **Notes**: Race mode correctly uses canonical metrics

---

## Summary of Issues

### 🔴 Critical Issues (4)
1. **Quote Mode Missing Author/Category Display** - UI doesn't show author/category even though data exists
2. **commonWords1000 Has Only 210 Words** - Array name misleading, should contain 1000 words
3. **Character Comparison Not Displayed in Results Screen** - Data exists but UI doesn't show it
4. **Race History Feature Missing** - MVP mentions it but no implementation found

### 🟡 Medium Priority Issues (3)
5. **Stats Filter Missing "Today" Option** - Backend supports it but UI doesn't show it
6. **Word Count Discrepancy Between Files** - Different word pools in different files
7. **Quote Category Not Returned/Displayed** - `content-library.ts` version doesn't return category, UI doesn't display it even when available

### 🟢 Verification Needed (7)
8. Race finish conditions (time expiration) - Need to verify handling
9. Bot name display in race results - Need to verify if bot name is shown
10. Keybr lesson word count default - Verified as 50, matches spec
11. Profile WPM trend calculation - Verified as correct
12. Race countdown synchronization - Verified as correct
13. Race room code validation - Verified as correct
14. Race progress throttling - Verified as 200ms, matches spec

---

## Recommendations

### Priority 1 (Critical - Must Fix)
1. Add author and category display to quote mode UI
2. Either expand `commonWords1000` to 1000 words or rename array
3. Add character comparison display to `ProfessionalResultsScreen.tsx`
4. Implement race history feature or remove from MVP spec

### Priority 2 (Medium - Should Fix)
5. Add "Today" option to `StatsFilter.tsx` dropdown
6. Consolidate word pools or document why different pools exist
7. Ensure `getRandomQuote()` returns category and display it in UI

### Priority 3 (Verification - Nice to Have)
8. Verify race time expiration handling
9. Verify bot name display in race results
10. Add tests for edge cases

---

**End of Audit Report**
