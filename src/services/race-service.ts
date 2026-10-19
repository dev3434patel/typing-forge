import { apiRequest, authService, isBackendConfigured } from '@/services/php-api';
import type { SessionResult } from '@/lib/typing-core/types';

export interface RaceRoom {
  id: string; room_code: string; host_id: string; opponent_id: string | null;
  expected_text: string; status: 'waiting' | 'countdown' | 'active' | 'completed' | 'cancelled' | 'abandoned';
  duration_seconds: number; version: number; countdown_started_at: string | null;
  started_at: string | null; deadline_at: string | null; ended_at: string | null; winner_id: string | null;
  host_progress: number; opponent_progress: number; host_wpm: number | null; opponent_wpm: number | null;
  host_accuracy: number | null; opponent_accuracy: number | null; server_now?: string;
  is_public: boolean; is_bot_race: boolean;
}

async function operation(action: string, body: Record<string, unknown> = {}, signal?: AbortSignal): Promise<RaceRoom> {
  if (!isBackendConfigured) throw new Error('Human rooms require the PHP backend. Guest bot practice is available.');
  const expectedOwner = authService.currentSession()?.user?.id;
  if (!expectedOwner) throw new Error('Sign in to create or join a human race.');
  const response = await apiRequest<{room: RaceRoom}>(`/race/${action}`, {
    method: 'POST', body, expectedOwner, signal,
  });
  if (!response.room || typeof response.room.id !== 'string' || !Number.isFinite(response.room.version))
    throw new Error('The server did not return a valid room. Retry the operation.');
  return response.room;
}

export const raceService = {
  create: (duration = 30) => operation('create', { duration }),
  join: (code: string) => operation('join', { code: code.toUpperCase().trim() }),
  get: (code: string, signal?: AbortSignal) => operation('get', { code: code.toUpperCase().trim() }, signal),
  leave: (raceId: string) => operation('leave', { raceId }),
  quickMatch: (duration = 30) => operation('quick-match', { duration }),
  rematch: (raceId: string) => operation('rematch', { raceId }),
  submit: (raceId: string, candidate: SessionResult, finish = false) =>
    operation('submit', { raceId, candidate, finish }),
};

/** Authenticated snapshot polling works on ordinary PHP shared hosting. */
export function subscribeRace(code: string, onRoom: (room: RaceRoom) => void, onError: (error: Error) => void) {
  let currentVersion = -1;
  let alive = true;
  let refreshing = false;
  let delay = 1000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request: AbortController | undefined;
  const refresh = async () => {
    if (!alive || refreshing) return;
    clearTimeout(timer);
    refreshing = true;
    request = new AbortController();
    try {
      const room = await raceService.get(code, request.signal);
      if (alive && room.version >= currentVersion) {
        currentVersion = room.version;
        onRoom(room);
        delay = ['active', 'countdown'].includes(room.status) ? 750 : 1500;
      }
    } catch (cause) {
      if (alive && !request.signal.aborted)
        onError(cause instanceof Error ? cause : new Error('Could not reconnect to this room.'));
      delay = Math.min(5000, delay * 2);
    } finally {
      refreshing = false;
      if (alive) timer = setTimeout(() => { void refresh(); }, typeof document !== 'undefined' && document.hidden ? 5000 : delay);
    }
  };
  const visible = () => { if (!document.hidden) void refresh(); };
  globalThis.document?.addEventListener('visibilitychange', visible);
  void refresh();
  return () => {
    alive = false;
    clearTimeout(timer);
    request?.abort();
    globalThis.document?.removeEventListener('visibilitychange', visible);
  };
}
