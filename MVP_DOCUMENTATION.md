# Typing Forge - Comprehensive MVP Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Pages & Routes](#pages--routes)
5. [Core Modules & Engines](#core-modules--engines)
6. [Components](#components)
7. [State Management](#state-management)
8. [Database Schema](#database-schema)
9. [Authentication System](#authentication-system)
10. [Typing Test System](#typing-test-system)
11. [Race Mode System](#race-mode-system)
12. [Statistics & Analytics](#statistics--analytics)
13. [Keybr Adaptive Learning](#keybr-adaptive-learning)
14. [Professional Accuracy System](#professional-accuracy-system)
15. [Bot Engine](#bot-engine)
16. [Metrics Engine](#metrics-engine)
17. [Content Library](#content-library)
18. [UI Components](#ui-components)
19. [Hooks & Utilities](#hooks--utilities)
20. [API Integration](#api-integration)

---

## Project Overview

**Typing Forge** (also branded as "Typing Master") is a comprehensive, feature-rich typing practice and competition platform built with React, TypeScript, and Supabase. The application provides multiple typing modes, real-time multiplayer races, detailed statistics, adaptive learning, and professional-grade accuracy analysis.

### Key Features
- **Multiple Typing Modes**: Time-based, word count, quotes, zen mode, code snippets, and adaptive Keybr learning
- **Real-Time Multiplayer Racing**: Create/join races with room codes, compete against bots or real players
- **Comprehensive Statistics**: Detailed analytics, charts, progress tracking, and performance insights
- **Adaptive Learning**: Keybr-style letter unlocking system with confidence tracking
- **Professional Accuracy Analysis**: Keystroke-level error analysis and detailed reports
- **Leaderboards**: Global rankings by speed, accuracy, consistency, and test count
- **User Profiles**: Personal stats, character confidence, test history, and settings
- **Dark Mode UI**: Modern, responsive design with smooth animations

---

## Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool and dev server
- **React Router DOM 7.12.0** - Client-side routing
- **Zustand 5.0.10** - State management
- **Framer Motion 12.26.1** - Animations
- **TanStack React Query 5.83.0** - Server state management
- **Tailwind CSS 3.4.17** - Styling
- **shadcn/ui** - UI component library (Radix UI primitives)
- **Recharts 2.15.4** - Data visualization

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)

### Testing
- **Vitest 4.0.18** - Unit testing framework
- **Playwright 1.57.0** - E2E testing

---

## Application Architecture

### File Structure
```
src/
├── pages/              # Route pages
├── components/         # React components
│   ├── typing/        # Typing test components
│   ├── race/          # Race mode components
│   ├── stats/         # Statistics components
│   ├── profile/       # Profile components
│   ├── keybr/         # Keybr learning components
│   ├── layout/        # Layout components
│   └── ui/            # shadcn/ui components
├── lib/               # Core business logic
│   ├── typing-engine.ts
│   ├── metrics-engine.ts
│   ├── bot-engine.ts
│   ├── keybr-engine.ts
│   ├── race-state-machine.ts
│   ├── professional-accuracy.ts
│   ├── stats-utils.ts
│   └── content-library.ts
├── hooks/             # Custom React hooks
├── stores/            # Zustand stores
├── integrations/      # External service integrations
│   └── supabase/
└── main.tsx           # Application entry point
```

### State Flow
1. **Global State**: Zustand stores for typing test state
2. **Server State**: React Query for async data fetching
3. **Local State**: React useState/useReducer for component state
4. **URL State**: React Router for navigation and route params

---

## Pages & Routes

### 1. Index Page (`/`)
**File**: `src/pages/Index.tsx`

**Purpose**: Main typing test interface

**Features**:
- Test settings configuration
- Multiple typing modes (time, words, quote, zen, keybr)
- Real-time typing area with visual feedback
- Professional results screen with detailed metrics
- Test completion handling and result saving

**Key Functions**:
- `handleTestComplete()` - Processes test results, generates accuracy report
- `handleRestart()` - Resets test with new text based on mode
- `handleNewTest()` - Clears results and resets test state

**Components Used**:
- `TestSettings` - Mode and duration selection
- `TypingArea` - Main typing interface
- `ProfessionalResultsScreen` - Detailed results display
- `KeybrLessonMode` - Adaptive learning interface
- `Header` / `Footer` - Layout components

**State Management**:
- Uses `useTestStore` for test state
- Uses `useTestResults` hook for saving results
- Local state for results display

---

### 2. Stats Page (`/stats`)
**File**: `src/pages/Stats.tsx`

**Purpose**: Comprehensive statistics and analytics dashboard

**Features**:
- **Filters**: Language, content type, time period (all/week/month/year)
- **Tabs**:
  - **Overview**: Summary stats, accuracy streaks, speed histogram, percentile
  - **Speed**: Learning progress chart, typing speed chart, key speed charts
  - **Keys**: Key frequency histogram and heatmap
  - **Calendar**: Practice calendar with activity tracking

**Key Functions**:
- `fetchData()` - Loads test sessions from Supabase or localStorage
- `filterByTimePeriod()` - Filters tests by selected time period
- `calculateAggregateStats()` - Computes all-time statistics
- `calculateAccuracyStreaks()` - Finds accuracy streaks
- `generateSpeedDistribution()` - Creates speed buckets for histogram
- `calculatePercentile()` - Calculates user percentile
- `prepareLessonData()` - Formats data for charts
- `generateCalendarActivities()` - Creates calendar activity data

**Data Sources**:
- Supabase `test_sessions` table (if authenticated)
- localStorage `typingmaster_history` (if not authenticated)
- Keybr character data from localStorage

**Components Used**:
- `StatsFilter` - Filter controls
- `StatsSummary` - Summary cards
- `AccuracyStreaks` - Streak visualization
- `SpeedHistogram` - Speed distribution chart
- `LearningProgressChart` - Progress over time
- `TypingSpeedChart` - Speed trend chart
- `KeySpeedChart` - Per-key speed analysis
- `KeyFrequencyHistogram` - Key usage frequency
- `PracticeCalendar` - Activity calendar

---

### 3. Leaderboard Page (`/leaderboard`)
**File**: `src/pages/Leaderboard.tsx`

**Purpose**: Global leaderboard rankings

**Features**:
- **Time Filters**: All Time, Weekly, Daily
- **Ranking Types**:
  - **Speed**: Best WPM
  - **Accuracy**: Average accuracy percentage
  - **Consistency**: Average consistency percentage
  - **Tests**: Total tests completed

**Key Functions**:
- `fetchLeaderboard()` - Loads leaderboard data from Supabase
- `getMetricValue()` - Returns appropriate metric value for active tab
- `getRankIcon()` - Returns icon for rank position (Crown/Medal/Award)

**Data Sources**:
- Supabase `leaderboards` table
- Supabase `profiles` table (for usernames)

**Components Used**:
- Top 3 podium display
- Full leaderboard table
- Time filter buttons
- Tab navigation

**Display Features**:
- Top 3 highlighted with special styling
- Rank icons (Crown for 1st, Medal for 2nd, Award for 3rd)
- Responsive table with hidden columns on mobile

---

### 4. Profile Page (`/profile`)
**File**: `src/pages/Profile.tsx`

**Purpose**: User profile and settings

**Features**:
- **Tabs**:
  - **Overview**: Profile header, leaderboard stats, recent test summary, WPM trend
  - **Test History**: Paginated list of all test sessions
  - **Characters**: Character confidence grid with unlock status
  - **Settings**: Profile settings (username, target WPM, theme)

**Key Functions**:
- `fetchProfileData()` - Loads all profile-related data
- Calculates additional stats (total time, averages, WPM trend)

**Data Sources**:
- Supabase `profiles` table
- Supabase `leaderboards` table
- Supabase `character_confidence` table
- Supabase `test_sessions` table

**Components Used**:
- `ProfileHeader` - Profile banner with avatar and stats
- `ProfileOverview` - Overview dashboard
- `TestHistory` - Test history table
- `CharacterGrid` - Character confidence visualization
- `ProfileSettings` - Settings form

**Authentication**: Requires authentication, redirects to `/auth` if not logged in

---

### 5. Auth Page (`/auth`)
**File**: `src/pages/Auth.tsx`

**Purpose**: User authentication (login/signup)

**Features**:
- Toggle between login and signup
- Email/password authentication
- Username input for signup
- Form validation with Zod
- Error handling and display
- Auto-redirect if already logged in

**Key Functions**:
- `validateForm()` - Validates form inputs using Zod schemas
- `handleAuth()` - Handles login/signup via Supabase Auth
- Username validation (3-50 chars, alphanumeric + underscore/hyphen)

**Validation Rules**:
- Email: Valid email format
- Password: Minimum 6 characters
- Username: 3-50 characters, alphanumeric + underscore/hyphen only

**Components Used**:
- Form inputs with icons
- Error message display
- Loading states
- Toast notifications

---

### 6. Race Page (`/race` or `/race/:roomCode`)
**File**: `src/pages/Race.tsx`

**Purpose**: Real-time typing race mode

**Features**:
- **Race Types**:
  - **Multiplayer**: Create room or join with code
  - **Bot Race**: Race against AI opponents (beginner/intermediate/pro)
- **Race States**:
  - `lobby` - Race creation/joining interface
  - `waiting` - Waiting for opponent to join
  - `countdown` - 3-second countdown before race starts
  - `racing` - Active race with real-time progress
  - `finished` - Race results and winner display

**Key Functions**:
- `createRace()` - Creates new multiplayer race room
- `createBotRace()` - Starts bot race with selected difficulty
- `joinRace()` - Joins existing race with room code
- `handleTyping()` - Processes typing input, updates progress
- `finishRace()` - Calculates final metrics and determines winner
- `handleRestart()` - Resets race state
- `generateRoomCode()` - Generates 6-character alphanumeric room code
- `generateRaceText()` - Generates text based on race duration

**Real-Time Updates**:
- Supabase real-time subscriptions for multiplayer races
- Throttled progress updates (200ms intervals)
- Bot progress simulation for bot races

**Components Used**:
- `RaceLobby` - Race creation/joining interface
- `RaceWaiting` - Waiting room display
- `RaceCountdown` - Countdown animation
- `RaceTypingArea` - Race typing interface with opponent progress
- `RaceResults` - Results screen with winner announcement
- `RaceSettings` - Duration and difficulty settings

**Data Sources**:
- Supabase `race_sessions` table
- Real-time Supabase channels

---

### 7. NotFound Page (`*`)
**File**: `src/pages/NotFound.tsx`

**Purpose**: 404 error page

**Features**:
- Simple 404 message
- Link back to home page
- Error logging

---

## Core Modules & Engines

### 1. Typing Engine (`lib/typing-engine.ts`)

**Purpose**: Core typing test calculations and state management

**Key Functions**:

#### `calculateWPM(correctChars, elapsedTimeSeconds)`
- Calculates Words Per Minute
- Formula: `(correctChars / 5) / (elapsedTimeSeconds / 60)`
- Returns: Rounded WPM integer

#### `calculateRawWPM(totalChars, elapsedTimeSeconds)`
- Calculates raw WPM (includes errors)
- Formula: `(totalChars / 5) / (elapsedTimeSeconds / 60)`
- Returns: Rounded raw WPM integer

#### `calculateAccuracy(correctChars, totalChars)`
- Calculates accuracy percentage
- Formula: `(correctChars / totalChars) * 100`
- Returns: Rounded accuracy percentage (0-100)

#### `calculateConsistency(wpmHistory)`
- Calculates typing consistency from WPM history
- Uses coefficient of variation
- Formula: `100 - (CV * 100)` where CV = stdDev / mean
- Returns: Consistency score (0-100)

#### `getCharacterStates(targetText, typedText, currentIndex)`
- Generates character-by-character state array
- States: `'correct' | 'incorrect' | 'current' | 'upcoming'`
- Used for visual feedback in typing area

#### `saveTestResult(result)`
- Saves test result to localStorage
- Keeps last 100 results
- Storage key: `typingmaster_history`

#### `getTestHistory()`
- Retrieves test history from localStorage
- Returns: Array of `TestResult` objects

#### `getPersonalBest()`
- Finds best WPM and accuracy from history
- Returns: `{ wpm: number, accuracy: number } | null`

**Interfaces**:
```typescript
interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  errors: number;
  elapsedTime: number;
  consistency: number;
}

interface TestResult {
  id: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  mode: string;
  duration: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  errors: number;
  date: string;
  wpmHistory: number[];
}
```

---

### 2. Metrics Engine (`lib/metrics-engine.ts`)

**Purpose**: Server-authoritative, mathematically correct metric calculations

**Key Features**:
- Canonical metric calculations from keystroke logs
- Reproducible results
- Validation and sanitization
- Rolling WPM windows for consistency

**Key Functions**:

#### `calculateWpm(correctChars, elapsedMs)`
- Canonical WPM calculation
- Formula: `(correctChars / 5) / (elapsedMs / 60000)`
- Returns: Rounded WPM

#### `calculateRawWpm(totalTypedChars, elapsedMs)`
- Raw WPM calculation
- Formula: `(totalTypedChars / 5) / (elapsedMs / 60000)`

#### `calculateAccuracy(correctChars, incorrectChars, missedChars, extraChars, backspaceUsed)`
- Comprehensive accuracy calculation
- Formula: `(correctChars / totalDenominator) * 100`
- **Critical**: Caps at 99.99% if backspace was used (strict accuracy enforcement)

#### `calculateConsistency(wpmWindows)`
- Consistency from WPM windows
- Uses coefficient of variation
- Formula: `100 - (CV * 100)`
- Clamped to [0, 100]

#### `calculateWpmWindows(keystrokes, windowSizeMs, stepMs)`
- Generates rolling WPM windows
- Default: 5-second windows, 1-second steps
- Returns: Array of `WpmWindow` objects

#### `computeSessionMetrics(keystrokes, targetText, finalTypedText)`
- **CANONICAL** source of truth for all metrics
- Computes all metrics from keystroke log
- Validates for NaN/Infinity
- Returns: Complete `SessionMetrics` object

#### `sanitizeMetric(value, allowNegative)`
- Validates and sanitizes metric values
- Returns 0 for NaN/Infinity
- Prevents negative values (unless allowed)

#### `verifyMetrics(clientMetrics, keystrokes, targetText)`
- Server-side validation
- Verifies client-submitted metrics against keystroke log
- Tolerance: 0.5% for floating point comparison

**Interfaces**:
```typescript
interface KeystrokeRecord {
  user_id?: string;
  session_id: string;
  char_expected: string;
  char_typed: string;
  event_type: 'keydown' | 'keyup';
  timestamp_ms: number;
  cursor_index: number;
  is_backspace: boolean;
  is_correct: boolean;
}

interface SessionMetrics {
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  consistency: number;
  totalTypedChars: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  extraChars: number;
  durationMs: number;
  durationSeconds: number;
  durationMinutes: number;
  charsPerSecond: number;
  peakWpm: number;
  lowestWpm: number;
  backspaceCount: number;
  isValid: boolean;
  validationErrors: string[];
}
```

---

### 3. Bot Engine (`lib/bot-engine.ts`)

**Purpose**: Realistic AI opponent simulation for race mode

**Key Features**:
- Three difficulty levels (beginner/intermediate/pro)
- Realistic typing patterns with mistakes and corrections
- Log-normal keystroke timing distribution
- Adjacent key typo simulation
- Burst typing and hesitation patterns

**Difficulty Levels**:

#### Beginner
- Target WPM: 30 ± 8
- Mistake probability: 12%
- Correction delay: 300-800ms
- Inter-keystroke interval: ~400ms mean

#### Intermediate
- Target WPM: 50 ± 10
- Mistake probability: 7%
- Correction delay: 200-500ms
- Inter-keystroke interval: ~240ms mean

#### Pro
- Target WPM: 82 ± 12
- Mistake probability: 2.5%
- Correction delay: 100-300ms
- Inter-keystroke interval: ~146ms mean

**Key Functions**:

#### `createBot(level, targetText)`
- Creates bot runner instance
- Returns: `BotRunner` interface

#### `simulateKeystroke(bot, currentTime)`
- Simulates single keystroke
- Handles mistakes, corrections, backspaces
- Updates bot state

#### `getNextKeystrokeDelay(bot)`
- Calculates delay until next keystroke
- Uses log-normal distribution
- Adds hesitation and burst modifiers
- Returns: Delay in milliseconds

#### `getTypoChar(expectedChar)`
- Generates realistic typo
- Uses keyboard adjacency map
- Preserves case

#### `simulateFullRace(level, targetText, updateIntervalMs)`
- Pre-computes full race timeline
- Used for server-side bot execution
- Returns: Array of `BotUpdate` objects

**Interfaces**:
```typescript
interface BotConfig {
  level: BotLevel;
  targetWpmMean: number;
  targetWpmStdDev: number;
  mistakeProbability: number;
  correctionDelay: [number, number];
  burstProbability: number;
  hesitationProbability: number;
  ikiMean: number;
  ikiStdDev: number;
}

interface BotState {
  config: BotConfig;
  targetText: string;
  typedText: string;
  cursorIndex: number;
  keystrokes: BotKeystroke[];
  startTime: number;
  currentWpm: number;
  progress: number;
  isFinished: boolean;
  correctChars: number;
  accuracy: number;
}
```

---

### 4. Keybr Engine (`lib/keybr-engine.ts`)

**Purpose**: Adaptive learning system with letter unlocking

**Key Features**:
- Per-character confidence tracking
- Letter unlocking based on performance
- Adaptive lesson generation
- Focus on weak letters
- Starting letters: e, t, a, o, i, n, s, r

**Key Functions**:

#### `calculatePerCharMetrics(keystrokes, targetWPM)`
- Calculates metrics for each character
- Tracks accuracy, speed, consistency per character
- Returns: Map of character to `CharacterConfidence`

#### `updateCharacterProgress(newMetrics, targetWPM)`
- Updates character confidence data
- Unlocks letters when threshold met (35 WPM, 95% accuracy)
- Uses weighted average (70% weight to new data)
- Returns: Updated characters, newly unlocked letters, next to unlock

#### `generateKeybrLesson(wordCount)`
- Generates adaptive lesson text
- Uses only unlocked letters
- 70% focus words (weak letters), 30% other words
- Returns: `KeybrLesson` object

#### `getUnlockedLetters()`
- Returns array of all unlocked letters
- Includes starting letters

#### `getLockedLetters()`
- Returns array of locked letters

#### `getWeakLetters(count)`
- Returns letters with lowest confidence
- Used for focus in lessons

#### `getConfidenceStatus(confidence, isUnlocked)`
- Returns status with color and emoji
- Statuses: weak, needs_work, in_progress, nearly_unlocked, unlocked

**Storage**:
- localStorage key: `keybr_character_data`
- Persists character confidence across sessions

**Interfaces**:
```typescript
interface CharacterConfidence {
  char: string;
  confidence: number; // 0.0 to 1.0+
  wpm: number;
  accuracy: number;
  occurrences: number;
  avgTimeMs: number;
  stdDev: number;
  isUnlocked: boolean;
  status: 'weak' | 'needs_work' | 'in_progress' | 'nearly_unlocked' | 'unlocked';
}
```

---

### 5. Race State Machine (`lib/race-state-machine.ts`)

**Purpose**: Server-authoritative race state management

**Key Features**:
- Idempotent state transitions
- Optimistic concurrency control (version field)
- Valid state transition enforcement
- Winner determination logic

**Race States**:
- `waiting` - Waiting for opponent
- `countdown` - Countdown phase
- `active` - Race in progress
- `completed` - Race finished
- `cancelled` - Race cancelled

**Valid Transitions**:
- `waiting` → `countdown` | `cancelled`
- `countdown` → `active` | `cancelled`
- `active` → `completed` | `cancelled`
- `completed` - Terminal
- `cancelled` - Terminal

**Key Functions**:

#### `createRaceState(id, roomCode, hostId, expectedText)`
- Creates initial race state
- Status: `waiting`

#### `addOpponent(state, opponentId, isBot, botLevel)`
- Adds opponent to race
- Only valid in `waiting` status

#### `startCountdown(state, triggeredBy, idempotencyKey)`
- Transitions to countdown
- Idempotent (returns null if already in countdown)
- Requires opponent

#### `startRace(state)`
- Transitions to active
- Idempotent

#### `updateProgress(state, participantId, progress, wpm, accuracy)`
- Updates participant progress
- Only valid in `active` status
- Validates bounds (progress 0-100, WPM 0-500, accuracy 0-100)

#### `completeRace(state)`
- Determines winner and completes race
- Winner logic:
  1. First to 100% progress
  2. If tie, highest WPM
  3. If still tie, earliest finish time

#### `serializeRaceState(state)` / `deserializeRaceState(data)`
- Converts between state object and database format

---

### 6. Professional Accuracy System (`lib/professional-accuracy.ts`)

**Purpose**: Detailed keystroke-level accuracy analysis

**Key Features**:
- Character-by-character comparison
- Error type classification (typos, misses, extras)
- Character type distribution (letters, numbers, spaces, punctuation)
- Keystroke interval analysis
- Skill assessment
- Consistency scoring

**Key Functions**:

#### `generateProfessionalAccuracyReport(targetText, typedText, keystrokeLog, durationSeconds, backspaceCount, wpmHistory)`
- **Main function** - Generates complete accuracy report
- Returns: `ProfessionalAccuracyReport` object

**Report Sections**:

1. **Overview**: Accuracy, WPM, consistency, duration
2. **Accuracy Breakdown**: Correct/incorrect/missed/extra characters
3. **Typing Metrics**: Total keystrokes, backspace count, chars/second
4. **Error Analysis**: Typos, misses, extras with positions
5. **Character Type Distribution**: Accuracy by character type
6. **Consistency**: Keystroke intervals, peak/lowest WPM
7. **Skill Assessment**: Skill level, strengths, improvements

**Critical Fixes**:
- For time-based tests, only analyzes what was typed
- Doesn't count untyped remaining text as "missed" errors
- Accuracy capped at 99.99% if backspace used

**Interfaces**:
```typescript
interface ProfessionalAccuracyReport {
  overview: {
    accuracy: number;
    wpm: number;
    netWpm: number;
    rawWpm: number;
    consistency: number;
    duration: number;
    timestamp: string;
  };
  accuracy: {
    typed: number;
    target: number;
    adjusted: number;
    final: number;
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    missedChars: number;
    totalTargetChars: number;
    totalTypedChars: number;
    backspaceUsed: boolean;
    backspaceCount: number;
  };
  typing: {
    totalCharsTyped: number;
    totalKeystrokes: number;
    backspaceCount: number;
    backspacePercentage: number;
    wpm: number;
    rawWpm: number;
    netWpm: number;
    charsPerSecond: number;
  };
  errors: ErrorAnalysis;
  distribution: CharTypeDistribution;
  consistency: {
    score: number;
    keystrokeIntervals: KeystrokeIntervals;
    peakWpm: number;
    lowestWpm: number;
    consistencyLevel: string;
  };
  assessment: SkillAssessment;
  charComparison: CharComparison[];
}
```

---

### 7. Stats Utils (`lib/stats-utils.ts`)

**Purpose**: Statistics calculation utilities

**Key Functions**:

#### `calculateAggregateStats(sessions)`
- Calculates aggregate statistics
- Returns: Total time, lessons count, top/avg speed/accuracy/consistency, total characters/errors
- All metrics sanitized

#### `filterByTimePeriod(sessions, period)`
- Filters sessions by time period
- Periods: `'all' | 'today' | 'week' | 'month' | 'year'`

#### `calculateAccuracyStreaks(sessions)`
- Finds longest accuracy streaks
- Thresholds: 100%, 98%, 95%, 90%
- Returns streaks with avg WPM and accuracy

#### `generateSpeedDistribution(sessions)`
- Creates speed buckets for histogram
- Buckets: 0-20, 20-40, 40-60, 60-80, 80-100, 100-120, 120+

#### `calculatePercentile(sessions, avgSpeed)`
- Calculates user's percentile
- Based on their own test distribution

#### `prepareLessonData(sessions)`
- Formats data for charts
- Returns array with lesson number, WPM, accuracy, consistency

#### `generateCalendarActivities(sessions, dailyGoal)`
- Generates calendar activity data
- Tracks lessons per day
- Calculates daily goal percentage

---

### 8. Content Library (`lib/content-library.ts`)

**Purpose**: Text content generation and management

**Key Functions**:

#### `getQuotes()`
- Fetches quotes from Supabase
- Fallback to local quotes if fetch fails

#### `getRandomQuote()`
- Returns random quote

#### `getCodeSnippets(language?)`
- Fetches code snippets from Supabase
- Filters by language if provided
- Fallback to local snippets

#### `getRandomCodeSnippet(language?)`
- Returns random code snippet

#### `generateWordList(count, difficulty, includePunctuation, includeNumbers)`
- Generates word list for typing tests
- Difficulties: easy, medium, hard
- Word pools: commonWords1000, advancedWords

**Local Content**:
- 20 quotes (tech, motivational, philosophy, science)
- 144 common words
- Code snippets for: JavaScript, TypeScript, Python, Rust, SQL

---

## Components

### Typing Components (`components/typing/`)

#### `TypingArea.tsx`
- Main typing interface
- Real-time character state visualization
- WPM/accuracy display
- Keyboard visualizer
- Handles input events
- Tracks keystroke log

#### `TestSettings.tsx`
- Mode selection (time/words/quote/zen/keybr/code)
- Duration selection (15/30/60/120/180 seconds)
- Word count input (for words mode)
- Punctuation toggle
- Numbers toggle

#### `ProfessionalResultsScreen.tsx`
- Detailed results display
- Overview metrics
- Accuracy breakdown
- Error analysis
- Character distribution
- Consistency analysis
- Skill assessment
- Restart/new test buttons

#### `ResultsScreen.tsx`
- Simple results display (legacy)

#### `StatCard.tsx`
- Reusable stat card component
- Icon, label, value display

#### `KeyboardVisualizer.tsx`
- Visual keyboard display
- Highlights active keys
- Shows finger positions

#### `ModeSettings.tsx`
- Mode-specific settings panel

---

### Race Components (`components/race/`)

#### `RaceLobby.tsx`
- Race creation interface
- Join race input
- Bot race buttons
- User authentication check

#### `RaceWaiting.tsx`
- Waiting room display
- Room code display
- Copy room code button
- Waiting message

#### `RaceCountdown.tsx`
- 3-second countdown animation
- Large number display
- Smooth transitions

#### `RaceTypingArea.tsx`
- Race typing interface
- Dual progress bars (player vs opponent)
- Real-time WPM/accuracy display
- Time remaining
- Opponent progress indicator
- Bot difficulty indicator

#### `RaceResults.tsx`
- Race results screen
- Winner announcement
- Player vs opponent comparison
- WPM and accuracy display
- Play again button

#### `RaceSettings.tsx`
- Race duration selector
- Bot difficulty selector (for bot races)
- Settings display (read-only during race)

---

### Stats Components (`components/stats/`)

#### `StatsFilter.tsx`
- Language selector
- Content type filter
- Time period filter

#### `StatsSummary.tsx`
- Summary cards display
- Total time, lessons count
- Top/avg speed, accuracy, consistency
- Total characters, errors

#### `AccuracyStreaks.tsx`
- Streak visualization
- Multiple threshold displays
- Avg WPM and accuracy per streak

#### `SpeedHistogram.tsx`
- Speed distribution chart
- User average/top speed markers
- Percentile indicator

#### `LearningProgressChart.tsx`
- Progress over time chart
- Multiple key progress lines
- Lesson-based x-axis

#### `KeySpeedChart.tsx`
- Per-key speed analysis
- Line chart with target WPM
- Key selection

#### `KeySpeedHistogram.tsx`
- Key speed distribution
- Bar chart

#### `KeyFrequencyCharts.tsx`
- Key frequency histogram
- Key frequency heatmap
- Hit/miss ratios

#### `PracticeCalendar.tsx`
- Calendar view
- Activity heatmap
- Daily goal progress

---

### Profile Components (`components/profile/`)

#### `ProfileHeader.tsx`
- Profile banner
- Avatar display
- Username
- Leaderboard rank
- Tests completed count

#### `ProfileOverview.tsx`
- Overview dashboard
- Leaderboard stats
- Recent test summary
- WPM trend indicator

#### `CharacterGrid.tsx`
- Character confidence grid
- Unlock status indicators
- Confidence level colors
- Character stats on hover

#### `TestHistory.tsx`
- Paginated test history table
- Sortable columns
- Test details display

#### `ProfileSettings.tsx`
- Settings form
- Username edit
- Target WPM setting
- Theme selector

---

### Keybr Components (`components/keybr/`)

#### `KeybrLessonMode.tsx`
- Adaptive lesson interface
- Letter progress panel
- Lesson text display
- Unlocked letters indicator
- Focus letters highlight

#### `KeybrResults.tsx`
- Keybr lesson results
- Character progress updates
- Newly unlocked letters notification

#### `LetterProgressPanel.tsx`
- Letter confidence display
- Unlock status
- Progress bars
- Status indicators

---

### Layout Components (`components/layout/`)

#### `Header.tsx`
- Navigation bar
- Logo and branding
- Navigation links (Type, Race, Stats, Leaderboard)
- User menu (Profile, Sign out)
- Sign in button (if not authenticated)

#### `Footer.tsx`
- Footer with copyright
- Social links (Twitter, GitHub)
- Made with love message

---

## State Management

### Test Store (`stores/test-store.ts`)

**Zustand store for typing test state**

**State**:
```typescript
interface TestState {
  settings: {
    mode: 'time' | 'words' | 'quote' | 'zen' | 'keybr' | 'code';
    duration: 15 | 30 | 60 | 120 | 180;
    wordCount: number;
    punctuation: boolean;
    numbers: boolean;
  };
  status: 'idle' | 'running' | 'finished';
  targetText: string;
  typedText: string;
  currentIndex: number;
  startTime: number | null;
  endTime: number | null;
  wpmHistory: number[];
}
```

**Actions**:
- `setSettings()` - Update test settings
- `setTargetText()` - Set target text
- `startTest()` - Start test
- `updateTypedText()` - Update typed text
- `finishTest()` - Finish test
- `resetTest()` - Reset test state
- `addWpmSample()` - Add WPM sample to history

---

## Database Schema

### Tables

#### `profiles`
User profile information
```sql
- id (uuid, PK, FK to auth.users)
- username (text)
- avatar_url (text)
- target_wpm (integer)
- theme (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `test_sessions`
Typing test results
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles.id)
- test_mode (text)
- duration_seconds (integer)
- gross_wpm (numeric)
- net_wpm (numeric)
- accuracy_percent (numeric)
- consistency_percent (numeric)
- total_characters (integer)
- correct_characters (integer)
- error_count (integer)
- per_char_metrics (jsonb)
- wpm_history (jsonb)
- created_at (timestamp)
```

#### `leaderboards`
Aggregated leaderboard stats
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles.id, unique)
- wpm_best (numeric)
- wpm_avg (numeric)
- accuracy_avg (numeric)
- consistency_avg (numeric)
- tests_completed (integer)
- total_characters (bigint)
- updated_at (timestamp)
```

#### `character_confidence`
Per-character learning progress
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles.id)
- character (text)
- confidence_level (numeric)
- current_wpm (numeric)
- current_accuracy (numeric)
- total_instances (integer)
- lessons_practiced (integer)
- is_unlocked (boolean)
- unlocked_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `race_sessions`
Multiplayer race sessions
```sql
- id (uuid, PK)
- room_code (text, unique)
- host_id (uuid, FK to profiles.id)
- opponent_id (uuid, FK to profiles.id, nullable)
- expected_text (text)
- status (text)
- is_bot_race (boolean)
- bot_difficulty (text)
- host_progress (numeric)
- host_wpm (numeric)
- host_accuracy (numeric)
- opponent_progress (numeric)
- opponent_wpm (numeric)
- opponent_accuracy (numeric)
- countdown_started_at (timestamp)
- started_at (timestamp)
- ended_at (timestamp)
- winner_id (uuid, FK to profiles.id)
- version (integer)
- created_at (timestamp)
```

#### `quotes`
Quote library
```sql
- id (uuid, PK)
- content (text)
- author (text)
- category (text)
- difficulty (text)
- word_count (integer)
- character_count (integer)
- created_at (timestamp)
```

#### `code_snippets`
Code snippet library
```sql
- id (uuid, PK)
- content (text)
- language (text)
- title (text)
- difficulty (text)
- character_count (integer)
- created_at (timestamp)
```

---

## Authentication System

### Implementation (`hooks/useAuth.tsx`)

**Features**:
- Supabase Auth integration
- Session management
- Auth state listener
- Sign out functionality

**Hook**: `useAuth()`
- Returns: `{ user, session, loading, signOut }`
- Provides user context throughout app

**Provider**: `AuthProvider`
- Wraps application
- Manages auth state
- Listens to auth changes

**Auth Flow**:
1. User signs up/logs in via `/auth` page
2. Supabase Auth creates session
3. `AuthProvider` updates state
4. User redirected to home
5. Protected routes check auth state

---

## Typing Test System

### Test Modes

#### 1. Time Mode
- Fixed duration (15/30/60/120/180 seconds)
- Random words generated
- Test ends when time expires
- Accuracy based on typed characters only

#### 2. Words Mode
- Fixed word count (user selects)
- Random words generated
- Test ends when word count reached
- Can include punctuation and numbers

#### 3. Quote Mode
- Random quote from library
- Test ends when quote completed
- Shows author and category

#### 4. Zen Mode
- Infinite typing
- No timer or word limit
- Focus on flow and accuracy
- Can restart anytime

#### 5. Keybr Mode
- Adaptive learning mode
- Uses only unlocked letters
- Focuses on weak letters
- Unlocks new letters as you improve

#### 6. Code Mode
- Code snippets from library
- Multiple languages (JS/TS/Python/Rust/SQL)
- Syntax-focused practice

### Test Flow

1. **Setup**: User selects mode and settings
2. **Start**: Test begins, timer starts
3. **Typing**: User types, real-time metrics calculated
4. **Completion**: Test ends (time/words/completion)
5. **Results**: Professional accuracy report generated
6. **Save**: Results saved to localStorage and database

### Metrics Calculation

- **WPM**: `(correctChars / 5) / (elapsedSeconds / 60)`
- **Raw WPM**: `(totalChars / 5) / (elapsedSeconds / 60)`
- **Accuracy**: `(correctChars / totalTypedChars) * 100`
- **Consistency**: Based on WPM variance over time

---

## Race Mode System

### Race Types

#### Multiplayer Race
1. **Create Race**:
   - Host creates room with 6-character code
   - Room code generated: `generateRoomCode()`
   - Text generated based on duration
   - Status: `waiting`

2. **Join Race**:
   - Opponent enters room code
   - Validates code format (6 alphanumeric)
   - Checks room exists and is waiting
   - Updates race: adds opponent, status → `countdown`

3. **Countdown**:
   - 3-second countdown (synchronized)
   - Both players see countdown
   - Status: `countdown`

4. **Race**:
   - Both players type simultaneously
   - Real-time progress updates (throttled 200ms)
   - Progress, WPM, accuracy synced via Supabase
   - Status: `racing`

5. **Finish**:
   - Race ends when:
     - First player completes text, OR
     - Time expires
   - Winner determined by:
     - Highest progress, OR
     - If tie: highest WPM, OR
     - If still tie: earliest finish
   - Status: `completed`

#### Bot Race
1. **Start**: User selects bot difficulty
2. **Countdown**: 3-second countdown
3. **Race**: User types, bot simulates typing
4. **Finish**: Race ends when user completes or time expires
5. **Results**: Comparison with bot stats

### Real-Time Updates

- **Supabase Channels**: Real-time subscriptions
- **Channel Name**: `race:{roomCode}`
- **Table**: `race_sessions`
- **Events**: INSERT, UPDATE
- **Throttling**: 200ms update intervals

### Bot Simulation

- **Hook**: `useBotRace`
- **Update Frequency**: 50ms ticks
- **Progress Updates**: Real-time WPM, accuracy, progress
- **Finish Callback**: Final stats when bot completes

---

## Statistics & Analytics

### Data Sources

1. **Authenticated Users**: Supabase `test_sessions` table
2. **Guest Users**: localStorage `typingmaster_history`
3. **Character Data**: localStorage `keybr_character_data`

### Statistics Calculated

#### Aggregate Stats
- Total practice time
- Lessons completed
- Top speed (WPM)
- Average speed (WPM)
- Top accuracy
- Average accuracy
- Average consistency
- Total characters typed
- Total errors

#### Time-Based Stats
- Today's stats
- Weekly stats
- Monthly stats
- Yearly stats
- All-time stats

#### Advanced Analytics
- Accuracy streaks (100%, 98%, 95%, 90%)
- Speed distribution histogram
- Percentile ranking
- Learning progress chart
- Per-key speed analysis
- Key frequency analysis
- Practice calendar

### Charts & Visualizations

1. **Speed Histogram**: Distribution of WPM across tests
2. **Learning Progress**: WPM trend over time
3. **Key Speed Chart**: Per-key performance
4. **Key Frequency**: Most/least used keys
5. **Practice Calendar**: Daily activity heatmap
6. **Accuracy Streaks**: Longest accuracy streaks

---

## Keybr Adaptive Learning

### Concept
Progressive letter unlocking system inspired by keybr.com

### Starting Letters
Default unlocked: `e, t, a, o, i, n, s, r`

### Unlock Criteria
- **WPM**: ≥ 35 WPM for character
- **Accuracy**: ≥ 95% for character
- **Confidence**: Calculated from speed × accuracy × consistency

### Confidence Calculation
```
confidence = (speedComponent × accuracyComponent × consistencyMultiplier)
- speedComponent = min(charWPM / targetWPM, 1.0)
- accuracyComponent = accuracy / 100
- consistencyMultiplier = max(0, 1 - (stdDev / 200))
```

### Lesson Generation
- Uses only unlocked letters
- 70% focus words (contain weak letters)
- 30% other words (for variety)
- Filters word bank by available letters

### Character Status
- **Locked** 🔒: Not yet unlocked
- **Weak** 🔴: Confidence < 0.3
- **Needs Work** 🟠: Confidence 0.3-0.6
- **In Progress** 🟡: Confidence 0.6-0.8
- **Nearly Unlocked** 🟢: Confidence 0.8-1.0
- **Mastered** ✅: Confidence ≥ 1.0

### Progress Tracking
- Per-character metrics stored in localStorage
- Synced to database when authenticated
- Weighted average updates (70% new, 30% old)

---

## Professional Accuracy System

### Report Generation

**Input**:
- Target text
- Typed text
- Keystroke log
- Duration
- Backspace count
- WPM history

**Output**: Complete `ProfessionalAccuracyReport`

### Report Sections

#### 1. Overview
- Final accuracy
- WPM (net and raw)
- Consistency score
- Duration
- Timestamp

#### 2. Accuracy Breakdown
- Typed accuracy
- Target accuracy
- Adjusted accuracy
- Final accuracy
- Character counts (correct/incorrect/missed/extra)
- Backspace usage

#### 3. Typing Metrics
- Total characters typed
- Total keystrokes
- Backspace count and percentage
- WPM metrics
- Characters per second

#### 4. Error Analysis
- Typos (with positions and similarity scores)
- Missed characters
- Extra characters
- Total errors
- Error rate

#### 5. Character Type Distribution
- Letters: correct/incorrect/accuracy
- Numbers: correct/incorrect/accuracy
- Spaces: correct/incorrect/accuracy
- Punctuation: correct/incorrect/accuracy

#### 6. Consistency Analysis
- Consistency score
- Keystroke intervals (avg/min/max/median/stdDev)
- Peak WPM
- Lowest WPM
- Consistency level description

#### 7. Skill Assessment
- Skill level (LEARNING/BEGINNER/INTERMEDIATE/ADVANCED/PROFESSIONAL)
- Overall rating (0-100)
- Strengths list
- Improvements list

### Character Comparison
- Character-by-character analysis
- Status: CORRECT/INCORRECT/MISSED/EXTRA/UNTYPED
- Error type classification
- Position tracking

---

## Bot Engine

### Architecture

**Three-Tier System**:
1. **Config**: Difficulty parameters
2. **State**: Current bot state
3. **Runner**: Execution engine

### Bot Configurations

#### Beginner
```typescript
{
  targetWpmMean: 30,
  targetWpmStdDev: 8,
  mistakeProbability: 0.12,
  correctionDelay: [300, 800],
  burstProbability: 0.1,
  hesitationProbability: 0.2,
  ikiMean: 400,
  ikiStdDev: 120
}
```

#### Intermediate
```typescript
{
  targetWpmMean: 50,
  targetWpmStdDev: 10,
  mistakeProbability: 0.07,
  correctionDelay: [200, 500],
  burstProbability: 0.2,
  hesitationProbability: 0.1,
  ikiMean: 240,
  ikiStdDev: 60
}
```

#### Pro
```typescript
{
  targetWpmMean: 82,
  targetWpmStdDev: 12,
  mistakeProbability: 0.025,
  correctionDelay: [100, 300],
  burstProbability: 0.35,
  hesitationProbability: 0.05,
  ikiMean: 146,
  ikiStdDev: 35
}
```

### Typing Simulation

1. **Keystroke Timing**: Log-normal distribution
2. **Mistakes**: Probability-based, adjacent key typos
3. **Corrections**: Delay before backspace, retype correct char
4. **Bursts**: Occasional faster typing
5. **Hesitations**: Occasional pauses (thinking)

### Bot Names
- Beginner: TypeLearner, KeyNewbie, SlowTyper, Novice123
- Intermediate: SwiftKeys, TyperMike, KeyboardKid, MidRacer
- Pro: SpeedDemon, TypeMaster, KeyboardKing, WPMChamp

---

## Metrics Engine

### Canonical Calculations

All metrics computed from keystroke logs for reproducibility.

### WPM Calculation
```
WPM = (correctChars / 5) / (elapsedMs / 60000)
```

### Accuracy Calculation
```
Accuracy = (correctChars / totalDenominator) * 100
where totalDenominator = correctChars + incorrectChars + missedChars + extraChars
```

**Critical Rule**: If backspace used, accuracy capped at 99.99%

### Consistency Calculation
```
Consistency = 100 - (CV * 100)
where CV = stdDev(wpmWindows) / mean(wpmWindows)
```

### Rolling Windows

- **Window Size**: 5 seconds default
- **Step Size**: 1 second default
- **Purpose**: Calculate WPM over time for consistency

### Validation

- **Sanitization**: All metrics sanitized (NaN/Infinity → 0)
- **Bounds**: Progress 0-100%, WPM 0-500, Accuracy 0-100%
- **Verification**: Server-side validation with 0.5% tolerance

---

## Content Library

### Quotes

**20 Quotes** in categories:
- Tech (7 quotes)
- Motivational (6 quotes)
- Philosophy (4 quotes)
- Science (3 quotes)

**Sources**:
- Supabase `quotes` table (primary)
- Local fallback array

### Code Snippets

**Languages Supported**:
- JavaScript (10 snippets)
- TypeScript (10 snippets)
- Python (10 snippets)
- Rust (10 snippets)
- SQL (10 snippets)

**Sources**:
- Supabase `code_snippets` table (primary)
- Local fallback object

### Word Lists

**Common Words 1000**: Most common English words
**Advanced Words**: Technical/professional vocabulary

**Generation**:
- Easy: First 200 common words
- Medium: All common words
- Hard: Common words + advanced words

---

## UI Components

### shadcn/ui Components

Full component library from shadcn/ui:
- Accordion, Alert, Alert Dialog, Avatar
- Badge, Breadcrumb, Button, Calendar
- Card, Carousel, Chart, Checkbox
- Collapsible, Command, Context Menu
- Dialog, Drawer, Dropdown Menu
- Form, Hover Card, Input, Input OTP
- Label, Menubar, Navigation Menu
- Pagination, Popover, Progress
- Radio Group, Resizable, Scroll Area
- Select, Separator, Sheet, Skeleton
- Slider, Sonner (Toast), Switch
- Table, Tabs, Textarea, Toast
- Toggle, Toggle Group, Tooltip

### Custom Components

All components styled with Tailwind CSS and dark mode support.

---

## Hooks & Utilities

### Custom Hooks

#### `useAuth()`
- Authentication state and methods
- Returns: `{ user, session, loading, signOut }`

#### `useBotRace()`
- Bot race simulation hook
- Props: `isActive`, `expectedText`, `difficulty`, `onBotProgress`, `onBotFinish`
- Returns: `{ botState, reset }`

#### `useTestResults()`
- Test result saving hook
- Functions: `saveResult()`, `saveCharacterConfidence()`
- Handles localStorage and Supabase saves

#### `useToast()`
- Toast notification hook
- From shadcn/ui

#### `useMobile()`
- Mobile detection hook

### Utilities

#### `cn()` (from `lib/utils.ts`)
- Class name merger (clsx + tailwind-merge)

---

## API Integration

### Supabase Client

**File**: `integrations/supabase/client.ts`

**Configuration**:
- Environment variables for URL and anon key
- Type-safe client with generated types

### Real-Time Subscriptions

**Race Updates**:
```typescript
supabase
  .channel(`race:${roomCode}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'race_sessions',
    filter: `room_code=eq.${roomCode}`
  }, callback)
  .subscribe()
```

### Database Operations

**Test Sessions**:
- INSERT: Save test results
- SELECT: Load test history
- UPDATE: Update leaderboard

**Race Sessions**:
- INSERT: Create race
- UPDATE: Update progress, finish race
- SELECT: Load race data

**Profiles**:
- SELECT: Load profile
- UPDATE: Update settings

**Leaderboards**:
- SELECT: Load rankings
- UPDATE: Update stats

---

## Key Features Summary

### Typing Modes
✅ Time-based (15/30/60/120/180s)
✅ Word count
✅ Quotes
✅ Zen mode
✅ Keybr adaptive learning
✅ Code snippets

### Race Mode
✅ Multiplayer races (room codes)
✅ Bot races (3 difficulty levels)
✅ Real-time progress sync
✅ Winner determination
✅ Race history

### Statistics
✅ Comprehensive analytics
✅ Time period filters
✅ Multiple chart types
✅ Accuracy streaks
✅ Speed distribution
✅ Per-key analysis
✅ Practice calendar

### Learning
✅ Adaptive letter unlocking
✅ Per-character confidence
✅ Focus on weak letters
✅ Progress tracking

### Accuracy Analysis
✅ Professional-grade reports
✅ Keystroke-level analysis
✅ Error classification
✅ Character type distribution
✅ Skill assessment

### User Features
✅ Authentication (Supabase Auth)
✅ Profiles with settings
✅ Leaderboards
✅ Test history
✅ Character progress

### UI/UX
✅ Dark mode
✅ Responsive design
✅ Smooth animations
✅ Modern component library
✅ Accessible components

---

## Development

### Scripts
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### Testing
- Unit tests: Vitest
- E2E tests: Playwright
- Test files: `lib/__tests__/`

---

## Future Enhancements

### Potential Features
- Custom word lists
- Multiplayer tournaments
- Achievements/badges
- Social features (friends, challenges)
- Mobile app
- Offline mode
- More languages
- Custom themes
- Export results (CSV/PDF)
- Voice typing support

---

## Conclusion

**Typing Forge** is a comprehensive, production-ready typing practice platform with:
- ✅ 7 pages/routes
- ✅ 6 typing modes
- ✅ Real-time multiplayer racing
- ✅ Comprehensive statistics
- ✅ Adaptive learning system
- ✅ Professional accuracy analysis
- ✅ Bot opponents
- ✅ Leaderboards
- ✅ User profiles
- ✅ Modern UI/UX

All features are fully implemented and functional, with robust error handling, validation, and user experience considerations.

---

**Document Version**: 1.0
**Last Updated**: February 2026
**Project**: Typing Forge / Typing Master
