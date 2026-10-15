import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
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
// New migration RPC signatures are deliberately isolated until generated DB types are refreshed.
async function operation(name: string, parameters: Record<string, unknown> = {}): Promise<RaceRoom> {
  if (!isSupabaseConfigured) throw new Error('Human rooms require a configured backend. Guest bot practice is available.');
  const { data, error } = await supabase.rpc(name as never, parameters as never);
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object') throw new Error('The server did not return a room. Retry the operation.');
  return data as unknown as RaceRoom;
}
export const raceService = {
  create: (duration = 30) => operation('forge_create_race', { p_duration: duration }),
  join: (code: string) => operation('forge_join_race', { p_code: code.toUpperCase().trim() }),
  get: (code: string) => operation('forge_get_race', { p_code: code.toUpperCase().trim() }),
  leave: (id: string) => operation('forge_leave_race', { p_race_id: id }),
  quickMatch: (duration = 30) => operation('forge_quick_match', { p_duration: duration }),
  rematch: (id: string) => operation('forge_rematch_race', { p_race_id: id }),
  async submit(id: string, candidate: SessionResult, finish = false): Promise<RaceRoom> {
    if (!isSupabaseConfigured) throw new Error('Human race validation is unavailable.');
    const { data, error } = await supabase.functions.invoke('race-operation', { body: { raceId: id, candidate, finish } });
    if (error) throw new Error(data?.error ?? error.message);
    if (!data?.room) throw new Error('Race validation was not acknowledged. Reconnect to fetch the current room.');
    return data.room as RaceRoom;
  },
};

/** Confirm subscription before fetching; refetch each version gap instead of replaying stale events. */
export function subscribeRace(code: string, onRoom: (room: RaceRoom) => void, onError: (error: Error) => void) {
  let currentVersion = -1; let alive = true; let refreshing = false;
  const refresh = async () => {
    if (refreshing) return; refreshing = true;
    try { const room = await raceService.get(code); if (alive && room.version >= currentVersion) { currentVersion = room.version; onRoom(room); } }
    catch (error) { if (alive) onError(error instanceof Error ? error : new Error('Could not reconnect to this room.')); }
    finally { refreshing = false; }
  };
  const channel = supabase.channel(`forge-room:${code}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'race_sessions', filter: `room_code=eq.${code}` }, () => { void refresh(); })
    .subscribe(status => { if (status === 'SUBSCRIBED') void refresh(); if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onError(new Error('Race connection interrupted. Reconnecting…')); });
  const timer = setInterval(() => { void refresh(); }, 2000);
  return () => { alive = false; clearInterval(timer); void supabase.removeChannel(channel); };
}
