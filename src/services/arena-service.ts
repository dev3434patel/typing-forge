import { apiRequest, authService, isBackendConfigured } from './php-api';
import { arenaCodeValid, arenaEvidencePayload, normalizeArenaCode, type ArenaRoom } from '@/domain/arena';
import type { SessionResult } from '@/lib/typing-core';
async function operation(action: string, body: Record<string, unknown>, signal?: AbortSignal, expectedOwner = authService.currentSession()?.user?.id): Promise<ArenaRoom> {
  if (!isBackendConfigured) throw new Error('Arena needs the PHP server. Local bot practice remains available.');
  if (!expectedOwner) throw new Error('Sign in to join a real human arena.');
  if (body.code !== undefined && !arenaCodeValid(String(body.code))) throw new Error('Enter the eight-character arena code.');
  const response = await apiRequest<{ arena: ArenaRoom }>(`/arena/${action}`, { method: 'POST', body, expectedOwner, signal });
  if (!response.arena || !arenaCodeValid(response.arena.code) || !Array.isArray(response.arena.members) || response.arena.members.length > 8 || !Number.isFinite(response.arena.version) || !Number.isFinite(response.arena.serverNow)) throw new Error('The server returned an invalid arena snapshot.');
  return response.arena;
}
export const arenaService = {
  create: (duration = 30) => operation('create', { duration }),
  match: (duration = 30) => operation('match', { duration }),
  join: (code: string) => operation('join', { code: normalizeArenaCode(code) }),
  get: (code: string, spectator = false, signal?: AbortSignal) => operation(spectator ? 'spectate' : 'get', { code: normalizeArenaCode(code) }, signal),
  ready: (code: string, ready: boolean) => operation('ready', { code, ready }),
  leave: (code: string) => operation('leave', { code }),
  rematch: (code: string) => operation('rematch', { code }),
  appeal: (code: string) => operation('appeal', { code }),
  submit: (code: string, candidate: SessionResult, finish: boolean) => operation('submit', { code, candidate: arenaEvidencePayload(candidate), finish }, undefined, candidate.ownerScope),
};
export interface ArenaTransport { subscribe: typeof subscribeArena; submit: typeof arenaService.submit }
export function subscribeArena(code: string, spectator: boolean, onRoom: (room: ArenaRoom) => void, onError: (error: Error) => void): () => void {
  const owner = authService.currentSession()?.user?.id; let alive = true, timer: ReturnType<typeof setTimeout> | undefined, controller: AbortController | undefined, version = -1, pending = false, delay = 1000;
  const stop = () => { alive = false; clearTimeout(timer); controller?.abort(); };
  const refresh = async () => {
    if (!alive || pending) return; clearTimeout(timer);
    if (authService.currentSession()?.user?.id !== owner) { stop(); return; }
    pending = true; controller = new AbortController();
    try { const room = await arenaService.get(code, spectator, controller.signal); if (alive && room.version >= version) { version = room.version; delay = room.status === 'active' || room.status === 'countdown' ? 1000 : 2000; onRoom(room); } }
    catch (cause) { if (alive && !controller.signal.aborted) onError(cause instanceof Error ? cause : new Error('Arena server offline — practise with bots?')); delay = Math.min(5000, delay * 2); }
    finally { pending = false; if (alive) timer = setTimeout(() => void refresh(), typeof document !== 'undefined' && document.hidden ? 5000 : delay); }
  };
  const unsubscribe = authService.subscribe(() => { if (authService.currentSession()?.user?.id !== owner) stop(); });
  const visible = () => { if (!document.hidden) void refresh(); }; globalThis.document?.addEventListener('visibilitychange', visible); void refresh();
  return () => { stop(); unsubscribe(); globalThis.document?.removeEventListener('visibilitychange', visible); };
}
export const arenaTransport: ArenaTransport = { subscribe: subscribeArena, submit: arenaService.submit };
