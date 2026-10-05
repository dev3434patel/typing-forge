/**
 * RACE STATE MACHINE
 * Server-authoritative race state management with idempotent transitions
 */

export type RaceStatus = 'waiting' | 'countdown' | 'active' | 'completed' | 'cancelled';

export interface RaceParticipant {
  id: string;
  isBot: boolean;
  botLevel?: 'beginner' | 'intermediate' | 'pro';
  progress: number;
  wpm: number;
  accuracy: number;
  finishedAt?: number;
}

export interface RaceState {
  id: string;
  roomCode: string;
  status: RaceStatus;
  expectedText: string;
  hostId: string;
  host: RaceParticipant;
  opponent?: RaceParticipant;
  countdownStartedAt?: number;
  raceStartedAt?: number;
  raceEndedAt?: number;
  winnerId?: string;
  version: number; // For optimistic concurrency control
  createdAt: number;
  updatedAt: number;
}

export interface RaceTransition {
  from: RaceStatus;
  to: RaceStatus;
  triggeredBy: string; // user_id or 'system'
  timestamp: number;
  idempotencyKey?: string;
}

// Valid state transitions
const VALID_TRANSITIONS: Record<RaceStatus, RaceStatus[]> = {
  waiting: ['countdown', 'cancelled'],
  countdown: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Check if a transition is valid
 */
export function isValidTransition(from: RaceStatus, to: RaceStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Create initial race state
 */
export function createRaceState(
  id: string,
  roomCode: string,
  hostId: string,
  expectedText: string
): RaceState {
  const now = Date.now();
  
  return {
    id,
    roomCode,
    status: 'waiting',
    expectedText,
    hostId,
    host: {
      id: hostId,
      isBot: false,
      progress: 0,
      wpm: 0,
      accuracy: 100,
    },
    version: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Add opponent to race
 */
export function addOpponent(
  state: RaceState,
  opponentId: string,
  isBot: boolean = false,
  botLevel?: 'beginner' | 'intermediate' | 'pro'
): RaceState {
  if (state.status !== 'waiting') {
    throw new Error(`Cannot add opponent in status: ${state.status}`);
  }
  
  if (state.opponent) {
    throw new Error('Race already has an opponent');
  }
  
  return {
    ...state,
    opponent: {
      id: opponentId,
      isBot,
      botLevel,
      progress: 0,
      wpm: 0,
      accuracy: 100,
    },
    version: state.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Transition to countdown - IDEMPOTENT
 * Returns null if already in countdown (idempotent)
 */
export function startCountdown(
  state: RaceState,
  triggeredBy: string,
  idempotencyKey?: string
): RaceState | null {
  // Idempotent: if already in countdown, return null (no change needed)
  if (state.status === 'countdown') {
    return null;
  }
  
  if (!isValidTransition(state.status, 'countdown')) {
    throw new Error(`Invalid transition from ${state.status} to countdown`);
  }
  
  // Must have opponent to start countdown
  if (!state.opponent) {
    throw new Error('Cannot start countdown without opponent');
  }
  
  return {
    ...state,
    status: 'countdown',
    countdownStartedAt: Date.now(),
    version: state.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Transition to active racing - IDEMPOTENT
 */
export function startRace(state: RaceState): RaceState | null {
  if (state.status === 'active') {
    return null;
  }
  
  if (!isValidTransition(state.status, 'active')) {
    throw new Error(`Invalid transition from ${state.status} to active`);
  }
  
  return {
    ...state,
    status: 'active',
    raceStartedAt: Date.now(),
    version: state.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Update participant progress
 */
export function updateProgress(
  state: RaceState,
  participantId: string,
  progress: number,
  wpm: number,
  accuracy: number
): RaceState {
  if (state.status !== 'active') {
    throw new Error(`Cannot update progress in status: ${state.status}`);
  }
  
  // Validate bounds
  const safeProgress = Math.min(100, Math.max(0, progress));
  const safeWpm = Math.min(500, Math.max(0, wpm));
  const safeAccuracy = Math.min(100, Math.max(0, accuracy));
  
  const isHost = participantId === state.hostId;
  const isOpponent = participantId === state.opponent?.id;
  
  if (!isHost && !isOpponent) {
    throw new Error('Participant not in this race');
  }
  
  const newState = { ...state };
  
  if (isHost) {
    newState.host = {
      ...state.host,
      progress: safeProgress,
      wpm: safeWpm,
      accuracy: safeAccuracy,
      finishedAt: safeProgress >= 100 ? Date.now() : state.host.finishedAt,
    };
  } else if (state.opponent) {
    newState.opponent = {
      ...state.opponent,
      progress: safeProgress,
      wpm: safeWpm,
      accuracy: safeAccuracy,
      finishedAt: safeProgress >= 100 ? Date.now() : state.opponent.finishedAt,
    };
  }
  
  newState.version = state.version + 1;
  newState.updatedAt = Date.now();
  
  return newState;
}

/**
 * Determine winner and complete race
 * Winner is determined by:
 * 1. First to reach 100% progress
 * 2. If tie in progress, highest WPM
 * 3. If still tie, earliest finish time
 */
export function completeRace(state: RaceState): RaceState {
  if (state.status === 'completed') {
    return state;
  }
  
  if (!isValidTransition(state.status, 'completed')) {
    throw new Error(`Invalid transition from ${state.status} to completed`);
  }
  
  let winnerId: string | undefined;
  
  const hostProgress = state.host.progress;
  const opponentProgress = state.opponent?.progress ?? 0;
  const hostWpm = state.host.wpm;
  const opponentWpm = state.opponent?.wpm ?? 0;
  const hostFinishedAt = state.host.finishedAt;
  const opponentFinishedAt = state.opponent?.finishedAt;
  
  // Winner logic (strict priority):
  // 1. First to reach 100% progress
  // 2. If both reach 100%, highest WPM
  // 3. If still tie, earliest finish time
  // 4. If neither reached 100%, highest progress
  // 5. If progress tie, highest WPM
  
  // Both reached 100%
  if (hostProgress >= 100 && opponentProgress >= 100) {
    if (hostWpm > opponentWpm) {
      winnerId = state.hostId;
    } else if (opponentWpm > hostWpm) {
      winnerId = state.opponent?.id;
    } else {
      // WPM tie, use finish time
      if (hostFinishedAt && opponentFinishedAt) {
        winnerId = hostFinishedAt < opponentFinishedAt ? state.hostId : state.opponent?.id;
      } else if (hostFinishedAt) {
        winnerId = state.hostId;
      } else if (opponentFinishedAt) {
        winnerId = state.opponent?.id;
      } else {
        // No finish times, use host as default
        winnerId = state.hostId;
      }
    }
  }
  // Only host reached 100%
  else if (hostProgress >= 100) {
    winnerId = state.hostId;
  }
  // Only opponent reached 100%
  else if (opponentProgress >= 100) {
    winnerId = state.opponent?.id;
  }
  // Neither reached 100%, use progress
  else if (hostProgress > opponentProgress) {
    winnerId = state.hostId;
  } else if (opponentProgress > hostProgress) {
    winnerId = state.opponent?.id;
  } else {
    // Progress tie, use WPM
    if (hostWpm >= opponentWpm) {
      winnerId = state.hostId;
    } else {
      winnerId = state.opponent?.id;
    }
  }
  
  return {
    ...state,
    status: 'completed',
    winnerId,
    raceEndedAt: Date.now(),
    version: state.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Cancel race
 */
export function cancelRace(state: RaceState, reason?: string): RaceState {
  if (state.status === 'cancelled' || state.status === 'completed') {
    return state;
  }
  
  return {
    ...state,
    status: 'cancelled',
    raceEndedAt: Date.now(),
    version: state.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Serialize state for database storage
 */
export function serializeRaceState(state: RaceState): Record<string, unknown> {
  return {
    id: state.id,
    room_code: state.roomCode,
    status: state.status,
    expected_text: state.expectedText,
    host_id: state.hostId,
    host_progress: state.host.progress,
    host_wpm: state.host.wpm,
    host_accuracy: state.host.accuracy,
    opponent_id: state.opponent?.id ?? null,
    opponent_is_bot: state.opponent?.isBot ?? false,
    opponent_bot_level: state.opponent?.botLevel ?? null,
    opponent_progress: state.opponent?.progress ?? 0,
    opponent_wpm: state.opponent?.wpm ?? 0,
    opponent_accuracy: state.opponent?.accuracy ?? 100,
    countdown_started_at: state.countdownStartedAt ? new Date(state.countdownStartedAt).toISOString() : null,
    started_at: state.raceStartedAt ? new Date(state.raceStartedAt).toISOString() : null,
    ended_at: state.raceEndedAt ? new Date(state.raceEndedAt).toISOString() : null,
    winner_id: state.winnerId ?? null,
    version: state.version,
    created_at: new Date(state.createdAt).toISOString(),
    updated_at: new Date(state.updatedAt).toISOString(),
  };
}

/**
 * Deserialize state from database
 */
export function deserializeRaceState(data: Record<string, unknown>): RaceState {
  const d = data as {
    id: string;
    room_code: string;
    status: string;
    expected_text: string;
    host_id: string;
    host_progress?: number;
    host_wpm?: number;
    host_accuracy?: number;
    opponent_id?: string | null;
    opponent_is_bot?: boolean;
    opponent_bot_level?: 'beginner' | 'intermediate' | 'pro' | null;
    opponent_progress?: number;
    opponent_wpm?: number;
    opponent_accuracy?: number;
    countdown_started_at?: string | null;
    started_at?: string | null;
    ended_at?: string | null;
    winner_id?: string | null;
    version?: number;
    created_at: string;
    updated_at: string;
  };
  return {
    id: d.id,
    roomCode: d.room_code,
    status: d.status as RaceStatus,
    expectedText: d.expected_text,
    hostId: d.host_id,
    host: {
      id: d.host_id,
      isBot: false,
      progress: d.host_progress ?? 0,
      wpm: d.host_wpm ?? 0,
      accuracy: d.host_accuracy ?? 100,
    },
    opponent: d.opponent_id ? {
      id: d.opponent_id,
      isBot: d.opponent_is_bot ?? false,
      botLevel: d.opponent_bot_level ?? undefined,
      progress: d.opponent_progress ?? 0,
      wpm: d.opponent_wpm ?? 0,
      accuracy: d.opponent_accuracy ?? 100,
    } : undefined,
    countdownStartedAt: d.countdown_started_at ? new Date(d.countdown_started_at).getTime() : undefined,
    raceStartedAt: d.started_at ? new Date(d.started_at).getTime() : undefined,
    raceEndedAt: d.ended_at ? new Date(d.ended_at).getTime() : undefined,
    winnerId: d.winner_id ?? undefined,
    version: d.version ?? 0,
    createdAt: new Date(d.created_at).getTime(),
    updatedAt: new Date(d.updated_at).getTime(),
  };
}
