import { useCallback, useEffect, useRef, useState } from 'react';
import { SessionController, type SessionClock, type SessionConfig, type SessionResult } from '@/lib/typing-core';
import { TypingArea } from '@/components/typing/TypingArea';
import { SessionResults } from '@/components/typing/SessionResults';
import { useIssuedChallengeCountdown } from '@/hooks/useIssuedChallengeCountdown';
import { useTestResults } from '@/hooks/useTestResults';
import { duelSessionConfiguration, type DuelChallenge } from '@/domain/progression/social';
import { SocialApi, type SocialSnapshot } from '@/services/social-api';
import { sessionRepository } from '@/services/session-repository';
import { authService } from '@/services/php-api';
import { claimProgression } from '@/services/progression-service';
import { progressionGeneration } from '@/services/progression-storage';
import { createIssuedChallengeController } from '@/lib/challenge-timing';

export function DuelAttempt({ ownerId, duelId, challenge, clock, onUpdate, onClose }: { ownerId: string; duelId: string; challenge: DuelChallenge; clock: SessionClock; onUpdate: (value: SocialSnapshot) => void; onClose: () => void }) {
  const { saveSession, syncState } = useTestResults();
  const [bundle, setBundle] = useState<{ configuration: SessionConfig; controller: SessionController; preparationRemainingMs: number | null } | null>(null), [result, setResult] = useState<SessionResult | null>(null), [error, setError] = useState<string | null>(null), [sending, setSending] = useState(false), [accepted, setAccepted] = useState(false), [expired, setExpired] = useState(false);
  const alive = useRef(true), submitted = useRef<string | null>(null), generation = useRef(progressionGeneration(ownerId));
  const now = useIssuedChallengeCountdown(!bundle && !result && !expired ? Date.parse(challenge.starts_at) : null, clock);
  const owns = useCallback(() => alive.current && authService.currentSession()?.user?.id === ownerId && progressionGeneration(ownerId) === generation.current, [ownerId]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (bundle || result || expired || clock.wallNow() < Date.parse(challenge.starts_at)) return;
    try { const configuration = duelSessionConfiguration(challenge, ownerId, crypto.randomUUID()); setBundle({ configuration, ...createIssuedChallengeController(configuration, challenge, 0, clock) }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The issued attempt could not start.'); setExpired(true); }
  }, [bundle, challenge, now, clock, ownerId, result, expired]);
  useEffect(() => { if (!bundle || result || bundle.preparationRemainingMs === null) return; const timer = setTimeout(() => { if (bundle.controller.status === 'ready') { setError('This preparation window expired before your first character. This duel cannot issue a replacement counted attempt.'); setExpired(true); setBundle(null); } }, Math.max(0, bundle.preparationRemainingMs) + 1); return () => clearTimeout(timer); }, [bundle, result]);
  const send = useCallback(async (value: SessionResult) => {
    if (!owns()) return; setSending(true); setError(null);
    try {
      const response = await new SocialApi(ownerId).submitDuel(duelId, value);
      if (!owns()) return;
      if (!response.accepted) throw new Error('The server did not acknowledge this duel result.');
      const record = await sessionRepository.get(ownerId, value.clientSessionId);
      if (!owns()) return;
      if (record) await sessionRepository.save({ ...record, accepted: response.accepted, state: 'synced', nextAttemptAt: 0, message: 'Server accepted your private duel result.', errorCode: undefined });
      if (!owns()) return;
      setAccepted(true); onUpdate(response); void claimProgression(value).catch(() => {});
    } catch (cause) { if (owns()) setError(cause instanceof Error ? cause.message : 'This result remains local until the server accepts it.'); }
    finally { if (owns()) setSending(false); }
  }, [duelId, onUpdate, ownerId, owns]);
  const finish = useCallback((value: SessionResult) => {
    setResult(value); if (submitted.current === value.clientSessionId) return; submitted.current = value.clientSessionId;
    void saveSession(value, { localOnly: true }).then(() => { if (value.elapsedMs === 30000 && value.finishReason === 'timeout') return send(value); }).catch(cause => { if (owns()) setError(cause instanceof Error ? cause.message : 'The local result could not be saved.'); });
  }, [saveSession, send, owns]);
  return <section className="space-y-5" aria-label="Your private duel attempt"><div className="panel p-4 text-sm"><p>One counted attempt · 30 seconds · English · QWERTY · keyboard · current-word correction</p><p className="text-xs text-muted-foreground mt-2">Your friend receives the identical passage and an independent preparation countdown. Results are compared after both canonical replays are accepted. {(challenge.configuration.settings?.timingPolicy === 'first-input-v1')?'Your first character starts the clock; idle time then counts.':'This legacy attempt keeps its original server start, including idle time.'}</p></div>{error && <p className="panel p-4 text-sm text-destructive" role="alert">{error}</p>}{result ? <><SessionResults result={result} onRestart={onClose} saveStatus={syncState} />{accepted ? <p role="status" className="text-sm text-primary">Your result is server accepted. The private duel reveals both results when your friend finishes.</p> : <><p className="text-sm text-muted-foreground">{sending ? 'The server is replaying your attempt…' : result.elapsedMs === 30000 ? 'Your result is on this device until accepted by the server.' : 'This attempt ended early. It remains personal practice; a complete timed attempt is required for the duel.'}</p>{!sending && result.elapsedMs === 30000 && <button className="forge-button-secondary" onClick={() => void send(result)}>Retry the same submission</button>}</>}<button className="forge-button-secondary" onClick={onClose}>Back to private duels</button></> : bundle ? <TypingArea key={bundle.configuration.clientSessionId} configuration={bundle.configuration} controller={bundle.controller} onTestComplete={finish} /> : expired ? <button className="forge-button-secondary" onClick={onClose}>Back to private duels</button> : <div className="panel p-10 text-center" aria-live="polite"><p className="eyebrow">Find a comfortable rhythm</p><p className="text-6xl font-mono text-primary my-6">{Math.max(1, Math.ceil((Date.parse(challenge.starts_at) - now) / 1000))}</p><p className="text-sm text-muted-foreground">{(challenge.configuration.settings?.timingPolicy === 'first-input-v1')?'Your independent attempt becomes ready after the countdown. Your first character starts it.':'Your independent server-timed attempt starts after the countdown.'}</p></div>}</section>;
}
