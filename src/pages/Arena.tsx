import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TypingArea } from '@/components/typing/TypingArea';
import { SessionResults } from '@/components/typing/SessionResults';
import { SessionController, type SessionResult, type SessionSnapshot } from '@/lib/typing-core';
import { useAuth } from '@/hooks/useAuth';
import { useCountdownClock } from '@/hooks/useCountdownClock';
import { useTestResults } from '@/hooks/useTestResults';
import { opponentPacePosition } from '@/lib/race-pace';
import { isBackendConfigured } from '@/services/php-api';
import { arenaService, arenaTransport } from '@/services/arena-service';
import { arenaCountdown, normalizeArenaCode, type ArenaRoom } from '@/domain/arena';

export default function Arena() {
  const { user } = useAuth(), { roomCode } = useParams<{ roomCode: string }>(), navigate = useNavigate();
  const [room, setRoom] = useState<ArenaRoom | null>(null), [spectator, setSpectator] = useState(false), [code, setCode] = useState(roomCode ?? '');
  const [duration, setDuration] = useState(30), [pending, setPending] = useState(false), [error, setError] = useState(''), [receivedAt, setReceivedAt] = useState(Date.now());
  const [typingId, setTypingId] = useState<string | null>(null);
  const activeCode = room?.code, ownerId = user?.id;
  const accept = useCallback((value: ArenaRoom) => { setRoom(previous => previous && previous.id === value.id && previous.version > value.version ? previous : value); setReceivedAt(Date.now()); setError(''); }, []);
  useEffect(() => { if (!activeCode || !ownerId) return; return arenaTransport.subscribe(activeCode, spectator, accept, cause => setError(`Arena server offline — practise with bots? ${cause.message}`)); }, [activeCode, ownerId, spectator, accept]);
  useEffect(() => { setCode(roomCode ?? ''); if (roomCode && room?.code !== normalizeArenaCode(roomCode)) setRoom(null); }, [roomCode, room?.code]);
  const run = async (work: () => Promise<ArenaRoom>, watch = false): Promise<boolean> => { if (pending) return false; setPending(true); setError(''); try { const value = await work(); setSpectator(watch); accept(value); navigate(`/arena/${value.code}`, { replace: true }); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : 'Arena request failed.'); return false; } finally { setPending(false); } };
  const countdownNow = useCountdownClock(room?.status === 'countdown' && room.startsAt !== null ? receivedAt + room.startsAt - room.serverNow : null);
  const own = room?.members.find(member => member.id === user?.id), terminal = room?.status === 'completed' || room?.status === 'cancelled';
  const roomId = room?.id, roomStatus = room?.status, ownStatus = own?.status;
  useEffect(() => { if (roomId && roomStatus === 'active' && ownStatus === 'racing') setTypingId(roomId); }, [roomId, roomStatus, ownStatus]);
  return <div className="forge-shell"><Header /><main id="main-content" className="forge-main space-y-6 py-8">
    <div><p className="eyebrow">REAL HUMAN ROOMS · PHP SERVER</p><h1 className="font-display text-3xl font-bold mt-3">Eight-seat arena</h1><p className="text-muted-foreground mt-3 max-w-3xl leading-relaxed">Invite up to eight real accounts. Everyone uses the same server-issued text, strict current-word correction and shared deadline. Placements come from server replay. Bots stay in local practice.</p></div>
    {!isBackendConfigured ? <section className="panel p-6"><h2 className="font-semibold">This frontend build supports local practice.</h2><p className="my-3">Human arenas require a configured PHP server and migration005_arena.sql.</p><Link className="forge-button" to="/race">Practise with a labelled bot</Link></section> : !user ? <section className="panel p-6"><p>Sign in to join, create or spectate a human arena.</p><Link className="forge-button mt-4" to="/auth">Sign in</Link></section> : !room ? <section className="panel p-6 space-y-5" aria-label="Arena setup">
      <label className="block">Shared duration<select className="forge-select ml-3 min-h-11" value={duration} onChange={event => setDuration(Number(event.target.value))}>{[15, 30, 60, 120].map(seconds => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select></label>
      <div className="flex gap-3 flex-wrap"><button className="forge-button" disabled={pending} onClick={() => void run(() => arenaService.create(duration))}>Create eight-seat room</button><button className="forge-button-secondary" disabled={pending} onClick={() => void run(() => arenaService.match(duration))}>Find a human room</button></div>
      <label className="block" htmlFor="arena-code">Eight-character room code</label><input id="arena-code" className="forge-input w-full max-w-xs" maxLength={8} autoCapitalize="characters" autoComplete="off" value={code} onChange={event => setCode(normalizeArenaCode(event.target.value))} />
      <div className="flex gap-3 flex-wrap"><button className="forge-button" disabled={pending || !/^[A-Z0-9]{8}$/.test(code)} onClick={() => void run(() => arenaService.join(code))}>Join arena</button><button className="forge-button-secondary" disabled={pending || !/^[A-Z0-9]{8}$/.test(code)} onClick={() => void run(() => arenaService.get(code, true), true)}>Spectate arena</button></div>
      <p className="text-sm text-muted-foreground">Matchmaking begins within10% of the room's measured pace and widens by5 percentage points every10 seconds. No available human is invented.</p>
    </section> : <>
      <section className="panel p-5 space-y-4" aria-label="Arena room">
        <div className="flex flex-wrap justify-between items-center gap-3"><h2 className="font-display text-xl">Room <span className="font-mono">{room.code}</span></h2><span className="forge-chip">{spectator ? 'Spectating' : room.status} · {room.members.length}/8 · {room.durationSeconds}s</span></div>
        <p className="text-sm text-muted-foreground">Server clock · English QWERTY · three-second all-ready countdown ·20-second reconnect window. Browser evidence cannot prove human input.</p>
        {room.status === 'waiting' && !spectator && own && <button className="forge-button" disabled={pending} aria-pressed={own.ready} onClick={() => void run(() => arenaService.ready(room.code, !own.ready))}>{own.ready ? 'Not ready' : 'Ready to race'}</button>}
        {room.status === 'countdown' && <p className="font-display text-4xl" role="status">Starting in {arenaCountdown(room, countdownNow, receivedAt)}</p>}
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Human racer progress">{room.members.map(member => <div className="rounded-lg border p-3 min-w-0" key={member.id}><div className="flex flex-wrap justify-between gap-2"><strong className="truncate">{member.handle}{member.id === user.id ? ' · you' : ''}</strong><span className="text-xs">{member.placement ? `Place${member.placement}` : member.status === 'joined' ? member.ready ? 'Ready' : 'Not ready' : member.status === 'quarantined' ? 'Under review' : member.status}</span></div><label className="block text-xs mt-2">Measured progress <progress className="w-full" max={100} value={member.progress} />{member.progress.toFixed(1)}% · {member.wpm?.toFixed(0) ?? '—'} WPM · {member.accuracy?.toFixed(1) ?? '—'}% accuracy</label></div>)}</div>
        {own?.status === 'quarantined' && <div className="space-y-3"><p role="status">Your partial result is under review: {own.quarantineReason}. It is excluded from placements. This is a plausibility flag, not proof of automation.</p><button className="forge-button-secondary" disabled={pending || own.appealRequested} onClick={() => void run(() => arenaService.appeal(room.code))}>{own.appealRequested ? 'Review request recorded' : 'Request review'}</button><p className="text-xs text-muted-foreground">A request is stored for the server operator. No response time or automatic clearance is promised.</p></div>}
        {terminal && !spectator && <div className="flex flex-wrap gap-3"><button className="forge-button-secondary" disabled={pending || own?.rematchVote} onClick={() => void run(() => arenaService.rematch(room.code))}>{own?.rematchVote ? 'Rematch vote recorded' : 'Vote for rematch'}</button>{room.rematchCode && <button className="forge-button" onClick={() => void run(() => arenaService.join(room.rematchCode!))}>Open agreed rematch</button>}</div>}
        <div className="flex gap-3 flex-wrap"><Link className="forge-button-secondary" to="/race">Local bot practice</Link><button className="forge-button-secondary" disabled={pending} onClick={() => { if (spectator || terminal) { setRoom(null); navigate('/arena'); } else void run(() => arenaService.leave(room.code)).then(left => { if (left) { setRoom(null); navigate('/arena'); } }); }}>Leave arena</button></div>
      </section>
      {!spectator && own && room.startsAt !== null && typingId === room.id && <ArenaTyping key={`${room.id}:${user.id}`} room={room} owner={user.id} onRoom={accept} />}
      {spectator && <p role="status" className="text-sm text-muted-foreground">Spectator view contains public handles and server metrics. No email, private transcript or raw input timing is exposed.</p>}
    </>}
    {error && <p role="alert" className="panel p-4 text-destructive break-words">{error}</p>}
  </main><Footer /></div>;
}

function ArenaTyping({ room, owner, onRoom }: { room: ArenaRoom; owner: string; onRoom: (room: ArenaRoom) => void }) {
  const { saveSession } = useTestResults(), [result, setResult] = useState<SessionResult | null>(null), [error, setError] = useState('');
  const [bundle] = useState(() => { const offset = room.serverNow - Date.now(), config = { ...room.configuration, clientSessionId: crypto.randomUUID(), ownerScope: owner, initialTarget: room.targetText }; const controller = new SessionController(config, { now: () => performance.now(), wallNow: () => Date.now() + offset }); controller.startAt(performance.now() - Math.max(0, room.serverNow - room.startsAt!), room.startsAt!); return { controller, config }; });
  const latest = useRef<SessionSnapshot | null>(null), posting = useRef(false), complete = useRef(false), queue = useRef<Promise<unknown>>(Promise.resolve());
  const send = useCallback((candidate: SessionResult, finish: boolean) => { queue.current = queue.current.catch(() => undefined).then(() => arenaTransport.submit(room.code, candidate, finish)).then(onRoom); return queue.current; }, [room.code, onRoom]);
  const finish = useCallback((candidate: SessionResult) => { if (complete.current) return; complete.current = true; setResult(candidate); void saveSession(candidate, { localOnly: true });
    if (candidate.finishReason === 'manual' && candidate.elapsedMs < room.durationSeconds * 1000 && candidate.finalTranscript !== room.targetText) void queue.current.catch(() => undefined).then(() => arenaService.leave(room.code)).then(onRoom).catch(cause => setError(String(cause)));
    else void send(candidate, true).catch(cause => setError(`Finish is not confirmed. Local evidence retained. ${String(cause)}`));
  }, [onRoom, room.code, room.durationSeconds, room.targetText, saveSession, send]);
  useEffect(() => { const timer = setInterval(() => { if (complete.current || posting.current || latest.current?.status !== 'running') return; posting.current = true; void send(bundle.controller.checkpoint(), false).catch(cause => setError(String(cause))).finally(() => { posting.current = false; }); }, 1000); return () => clearInterval(timer); }, [bundle, send]);
  useEffect(() => { const member = room.members.find(value => value.id === owner); if (!complete.current && (['completed', 'cancelled'].includes(room.status) || member?.status === 'forfeit' || member?.status === 'quarantined')) { complete.current = true; const evidence = bundle.controller.finish('abandoned'); setResult(evidence); void saveSession(evidence, { localOnly: true }); } }, [bundle, owner, room, saveSession]);
  const rival = room.members.filter(member => member.id !== owner && member.status !== 'quarantined').sort((a, b) => b.progress - a.progress)[0];
  return <section className="space-y-4" aria-label="Arena typing workspace"><p className="text-sm text-muted-foreground">Shared clock continues when focus leaves the passage. Finish before the deadline forfeits your seat; your local report remains exportable.</p>{error && <p role="alert">{error}</p>}{result ? <SessionResults result={result} onRestart={() => void arenaService.get(room.code).then(onRoom).catch(cause => setError(String(cause)))} /> : <TypingArea controller={bundle.controller} configuration={bundle.config} onSnapshot={value => { latest.current = value; }} onTestComplete={finish} autoFocus opponentPace={rival ? { position: opponentPacePosition(room.targetText.length, { progress: rival.progress }), label: rival.handle, wpm: rival.wpm, approximate: true } : undefined} />}</section>;
}
