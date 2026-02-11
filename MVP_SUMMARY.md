# Typing Forge - MVP Quick Reference Summary

## Project Overview
**Typing Forge** is a comprehensive typing practice platform with multiple modes, real-time racing, statistics, and adaptive learning.

## Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **State**: Zustand + React Query
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI**: shadcn/ui components
- **Charts**: Recharts
- **Animations**: Framer Motion

## Pages (7 Total)

### 1. `/` - Index (Main Typing Test)
- **Modes**: Time, Words, Quote, Zen, Keybr, Code
- **Features**: Real-time typing, visual feedback, professional results
- **Components**: TestSettings, TypingArea, ProfessionalResultsScreen, KeybrLessonMode

### 2. `/stats` - Statistics Dashboard
- **Tabs**: Overview, Speed, Keys, Calendar
- **Features**: Filters (language, content, time period), charts, streaks, distribution
- **Data**: Test sessions from DB/localStorage, character confidence

### 3. `/leaderboard` - Global Rankings
- **Filters**: All Time, Weekly, Daily
- **Categories**: Speed, Accuracy, Consistency, Tests Completed
- **Features**: Top 3 podium, full table, rank icons

### 4. `/profile` - User Profile
- **Tabs**: Overview, Test History, Characters, Settings
- **Features**: Profile stats, test history, character grid, settings

### 5. `/auth` - Authentication
- **Features**: Login/Signup, form validation, username support
- **Validation**: Zod schemas, email/password/username rules

### 6. `/race` - Race Mode
- **Types**: Multiplayer (room codes), Bot races (3 difficulties)
- **States**: Lobby → Waiting → Countdown → Racing → Finished
- **Features**: Real-time sync, progress tracking, winner determination

### 7. `*` - 404 Page
- Simple error page with home link

## Core Modules (8 Engines)

### 1. Typing Engine (`typing-engine.ts`)
- WPM, accuracy, consistency calculations
- Character state management
- Test result storage (localStorage)

### 2. Metrics Engine (`metrics-engine.ts`)
- **Canonical** metric calculations from keystroke logs
- Rolling WPM windows
- Validation and sanitization
- Server-authoritative metrics

### 3. Bot Engine (`bot-engine.ts`)
- 3 difficulty levels (beginner/intermediate/pro)
- Realistic typing simulation
- Mistake patterns, corrections, bursts, hesitations

### 4. Keybr Engine (`keybr-engine.ts`)
- Adaptive letter unlocking
- Per-character confidence tracking
- Lesson generation (focus on weak letters)

### 5. Race State Machine (`race-state-machine.ts`)
- Idempotent state transitions
- Winner determination logic
- Version control for concurrency

### 6. Professional Accuracy (`professional-accuracy.ts`)
- Keystroke-level analysis
- Error classification
- Skill assessment
- Character type distribution

### 7. Stats Utils (`stats-utils.ts`)
- Aggregate statistics
- Time period filtering
- Accuracy streaks
- Speed distribution

### 8. Content Library (`content-library.ts`)
- Quotes (20+)
- Code snippets (5 languages)
- Word lists (common + advanced)

## Database Tables (7 Tables)

1. **profiles** - User profiles (username, avatar, target_wpm, theme)
2. **test_sessions** - Test results (WPM, accuracy, consistency, metrics)
3. **leaderboards** - Aggregated stats (best/avg WPM, accuracy, tests)
4. **character_confidence** - Per-character learning progress
5. **race_sessions** - Race data (progress, WPM, winner)
6. **quotes** - Quote library
7. **code_snippets** - Code snippet library

## Key Features

### Typing Modes (6)
✅ Time (15/30/60/120/180s)
✅ Words (custom count)
✅ Quotes (20+ quotes)
✅ Zen (infinite)
✅ Keybr (adaptive learning)
✅ Code (5 languages)

### Race Mode
✅ Multiplayer (room codes, real-time sync)
✅ Bot races (beginner/intermediate/pro)
✅ Progress tracking
✅ Winner determination

### Statistics
✅ Overview (summary, streaks, histogram)
✅ Speed (progress charts, key analysis)
✅ Keys (frequency, heatmap)
✅ Calendar (activity tracking)

### Learning
✅ Letter unlocking (8 starting letters)
✅ Confidence tracking (per character)
✅ Adaptive lessons (focus weak letters)

### Analysis
✅ Professional accuracy reports
✅ Keystroke-level analysis
✅ Error classification
✅ Skill assessment

## Components (50+)

### Typing Components
- TypingArea, TestSettings, ProfessionalResultsScreen, KeyboardVisualizer

### Race Components
- RaceLobby, RaceWaiting, RaceCountdown, RaceTypingArea, RaceResults, RaceSettings

### Stats Components
- StatsFilter, StatsSummary, AccuracyStreaks, SpeedHistogram, LearningProgressChart, KeySpeedChart, PracticeCalendar

### Profile Components
- ProfileHeader, ProfileOverview, CharacterGrid, TestHistory, ProfileSettings

### Keybr Components
- KeybrLessonMode, KeybrResults, LetterProgressPanel

### Layout Components
- Header, Footer

### UI Components
- Full shadcn/ui library (40+ components)

## State Management

### Zustand Store
- `test-store.ts` - Typing test state (settings, status, text, history)

### React Query
- Server state management (test sessions, leaderboards, profiles)

### Local State
- Component-level state (forms, UI state)

## Hooks (4 Custom)

1. `useAuth()` - Authentication state
2. `useBotRace()` - Bot simulation
3. `useTestResults()` - Result saving
4. `useToast()` - Notifications

## Key Metrics

### WPM Calculation
```
WPM = (correctChars / 5) / (elapsedSeconds / 60)
```

### Accuracy Calculation
```
Accuracy = (correctChars / totalTypedChars) * 100
Capped at 99.99% if backspace used
```

### Consistency Calculation
```
Consistency = 100 - (CV * 100)
where CV = stdDev(wpmWindows) / mean(wpmWindows)
```

## Race Flow

### Multiplayer
1. Host creates room → Room code generated
2. Opponent joins → Code validation
3. Countdown → 3 seconds synchronized
4. Race → Real-time progress sync (200ms throttle)
5. Finish → Winner by progress/WPM/time

### Bot Race
1. Select difficulty → Beginner/Intermediate/Pro
2. Countdown → 3 seconds
3. Race → Bot simulates typing (50ms ticks)
4. Finish → Compare stats

## Keybr System

### Starting Letters
`e, t, a, o, i, n, s, r`

### Unlock Criteria
- WPM ≥ 35
- Accuracy ≥ 95%
- Confidence calculated from speed × accuracy × consistency

### Status Levels
🔒 Locked → 🔴 Weak → 🟠 Needs Work → 🟡 In Progress → 🟢 Nearly Unlocked → ✅ Mastered

## Bot Difficulties

| Level | WPM | Mistakes | Correction Delay |
|-------|-----|----------|------------------|
| Beginner | 30 ± 8 | 12% | 300-800ms |
| Intermediate | 50 ± 10 | 7% | 200-500ms |
| Pro | 82 ± 12 | 2.5% | 100-300ms |

## File Structure
```
src/
├── pages/          # 7 route pages
├── components/     # 50+ components
│   ├── typing/    # Typing test UI
│   ├── race/      # Race mode UI
│   ├── stats/     # Statistics UI
│   ├── profile/   # Profile UI
│   ├── keybr/     # Learning UI
│   ├── layout/    # Header/Footer
│   └── ui/        # shadcn/ui components
├── lib/           # 8 core engines
├── hooks/         # 4 custom hooks
├── stores/        # Zustand stores
└── integrations/  # Supabase client
```

## Data Storage

### Supabase (Authenticated Users)
- Test sessions
- Profiles
- Leaderboards
- Character confidence
- Race sessions

### localStorage (Guest Users)
- Test history (`typingmaster_history`)
- Character data (`keybr_character_data`)

## Real-Time Features

### Race Updates
- Supabase channels
- Table: `race_sessions`
- Channel: `race:{roomCode}`
- Throttle: 200ms

## Validation & Sanitization

### Metrics
- All metrics sanitized (NaN/Infinity → 0)
- Bounds checking (WPM 0-500, Accuracy 0-100, Progress 0-100)
- Server-side verification (0.5% tolerance)

### Forms
- Zod schemas
- Email validation
- Password min 6 chars
- Username: 3-50 chars, alphanumeric + underscore/hyphen

## Performance

### Optimizations
- Throttled race updates (200ms)
- Memoized calculations (useMemo)
- Lazy loading (code splitting)
- Optimistic updates

## Testing

### Test Files
- `lib/__tests__/bot-engine.test.ts`
- `lib/__tests__/metrics-engine.test.ts`
- `lib/__tests__/race-state-machine.test.ts`

### Tools
- Vitest (unit tests)
- Playwright (E2E tests)

## Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - Linting
- `npm run preview` - Preview build

---

**Total Features**: 50+
**Total Components**: 50+
**Total Pages**: 7
**Total Modules**: 8
**Database Tables**: 7
**Custom Hooks**: 4

**Status**: ✅ Fully Functional MVP
