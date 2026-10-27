import type { RaceRoom } from './race-service';
import type { SessionResult } from '@/lib/typing-core/types';
export interface RaceTransport { subscribe(code: string, onRoom: (room: RaceRoom) => void, onError: (error: Error) => void): () => void; submit(raceId: string, candidate: SessionResult, finish?: boolean): Promise<RaceRoom> }
export interface RaceStreamCapabilities { sse: boolean; maxStreamSeconds: number; players: 2 }
export interface RaceEventSource { addEventListener(type: string, listener: (event: { data?: string }) => void): void; close(): void }
export interface RaceTransportOptions {
  ownerId: string; code: string; currentOwner: () => string | null;
  capabilities: (signal: AbortSignal) => Promise<RaceStreamCapabilities>;
  open: () => RaceEventSource;
  poll: (onRoom: (room: RaceRoom) => void, onError: (error: Error) => void) => () => void;
  observeOwner?: (listener: () => void) => () => void;
  visibility?: { hidden: () => boolean; subscribe: (listener: () => void) => () => void };
}
/** SSE is an optional snapshot delivery channel. POST canonical evidence remains authoritative. */
export function subscribeRaceTransport(options: RaceTransportOptions, onRoom: (room: RaceRoom) => void, onError: (error: Error) => void): () => void {
  let alive = true, version = -1, roomId: string | null = null, source: RaceEventSource | null = null;
  let stopPoll: (() => void) | null = null, retry: ReturnType<typeof setTimeout> | undefined, handshake: ReturnType<typeof setTimeout> | undefined;
  let streamFailures = 0, enabled = false;
  let stopOwner: () => void = () => {}, stopVisibility: () => void = () => {};
  const discovery = new AbortController();
  const owned = () => alive && options.currentOwner() === options.ownerId;
  const deliver = (room: RaceRoom): boolean => {
    if (!owned() || !room || room.room_code !== options.code || typeof room.id !== 'string' || (roomId !== null && room.id !== roomId) || !Number.isSafeInteger(room.version) || room.version < version || (room.host_id !== options.ownerId && room.opponent_id !== options.ownerId)) return false;
    roomId = room.id; version = room.version; onRoom(room); return true;
  };
  const poll = () => { if (!owned() || stopPoll) return; stopPoll = options.poll(deliver, error => { if (owned()) onError(error); }); };
  const close = () => { clearTimeout(handshake); handshake = undefined; source?.close(); source = null; };
  const failed = () => {
    if (!alive) return; close(); poll(); streamFailures++;
    clearTimeout(retry);
    if (owned() && enabled && streamFailures <= 3 && !options.visibility?.hidden()) retry = setTimeout(connect, Math.min(8000, 1000 * 2 ** (streamFailures - 1)));
  };
  const connect = () => {
    retry = undefined;
    if (!owned() || !enabled || source || options.visibility?.hidden()) return;
    try {
      const candidate = options.open(); source = candidate;
      handshake = setTimeout(() => { if (source === candidate) failed(); }, 4000);
      candidate.addEventListener('room', event => {
        if (!owned() || source !== candidate) return;
        try { const payload = JSON.parse(event.data ?? '') as { room?: RaceRoom }; if (payload.room && payload.room.version < version) return; if (!payload.room || !deliver(payload.room)) { failed(); return; } clearTimeout(handshake); handshake = undefined; stopPoll?.(); stopPoll = null; if (['completed', 'cancelled', 'abandoned'].includes(payload.room.status)) { enabled = false; close(); clearTimeout(retry); } }
        catch { failed(); }
      });
      candidate.addEventListener('error', () => { if (source === candidate) failed(); });
      candidate.addEventListener('auth-error', () => { if (source === candidate) { enabled = false; failed(); } });
      candidate.addEventListener('reconnect', () => { if (source === candidate) { close(); poll(); if (owned() && !options.visibility?.hidden()) retry = setTimeout(connect, 500); } });
    } catch { failed(); }
  };
  const stop = () => { if (!alive) return; alive = false; discovery.abort(); close(); clearTimeout(retry); stopPoll?.(); stopPoll = null; stopOwner?.(); stopVisibility?.(); };
  stopOwner = options.observeOwner?.(() => { if (!owned()) stop(); }) ?? (() => {});
  if (!alive) { stopOwner(); return stop; }
  stopVisibility = options.visibility?.subscribe(() => { if (!owned()) { stop(); return; } if (options.visibility?.hidden()) { close(); clearTimeout(retry); poll(); } else { streamFailures = 0; connect(); } }) ?? (() => {});
  if (!alive) { stopVisibility(); return stop; }
  poll();
  void options.capabilities(discovery.signal).then(value => { if (!owned()) return; enabled = value.sse === true && value.players === 2 && Number.isFinite(value.maxStreamSeconds) && value.maxStreamSeconds > 0 && value.maxStreamSeconds <= 30; if (enabled) connect(); }).catch(() => { /* Original polling remains live on an older or unavailable endpoint. */ });
  return stop;
}
