import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useSessionHistory, useTestResults } from '@/hooks/useTestResults';
import { usePreferences } from '@/contexts/PreferencesContext';
import { GAMES, DIFFICULTIES, gameDefinition } from '../modes/catalog';
import { dailyChallenge, featuredGameIndex, utcDate } from '../modes/daily';
import { arcadeData, arcadeStorageKey } from '../engine/records';
import { isCanonicalReplay } from '../modes/ghost';
import { EVIDENCE_TTL_MS } from '@/lib/evidence-policy';
import type { GameEvidence, GameId, Difficulty, Variant, GameOptions } from '../engine/types';
import { downloadJson } from './share';
import './arcade.css';

const ArcadePlayer = lazy(() => import('./ArcadePlayer'));
export default function ArcadePage({ gameId, onCompleted }: { gameId?: GameId; onCompleted?: (evidence: GameEvidence) => void | Promise<void> }) {
  const params = useParams<{ gameId: string }>(), definition = gameDefinition(gameId ?? params.gameId);
  const { user } = useAuth(), owner = user?.id ?? 'guest';
  const { preferences } = usePreferences(), history = useSessionHistory(), { saveSession } = useTestResults();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal'), [variant, setVariant] = useState<Variant>('mission');
  const [active, setActive] = useState<Omit<GameOptions, 'now' | 'wallNow' | 'sessionId'> | null>(null);
  const [starting, setStarting] = useState(false), [error, setError] = useState('');
  const [stored, setStored] = useState(() => ({ owner, result: arcadeData.read(owner) }));
  const [ghostId, setGhostId] = useState(''), [focus, setFocus] = useState(false);
  const day = utcDate(), featured = GAMES[featuredGameIndex(day, GAMES.length)];
  useEffect(() => { const refresh = () => setStored({ owner, result: arcadeData.read(owner) }); refresh();
    const stop = arcadeData.subscribe(changedOwner => { if (changedOwner === owner) refresh(); }, owner);
    const storage = (event: StorageEvent) => { if (event.key === null || event.key === arcadeStorageKey(owner)) refresh(); };
    window.addEventListener('storage', storage); return () => { stop(); window.removeEventListener('storage', storage); };
  }, [owner]);
  const localData = stored.owner === owner ? stored.result : arcadeData.read(owner);
  const publicReplays = useMemo(() => {
    const all = [...localData.data.replays.map(value => value.session), ...history.records.map(value => value.candidate).filter(isCanonicalReplay)];
    const seen = new Set<string>();
    return all.filter(value => value.ownerScope === owner && value.finishedAtWall + EVIDENCE_TTL_MS > Date.now() && value.configuration.privacy === 'public-corpus' && value.events.length > 0 && value.elapsedMs > 0 && !seen.has(value.clientSessionId) && !!seen.add(value.clientSessionId)).slice(0, 20);
  }, [history.records, owner, localData]);
  const activeGhostId = active?.ghost?.clientSessionId;
  useEffect(() => {
    if (!activeGhostId || history.loading) return;
    const available = [...localData.data.replays.map(value => value.session), ...history.records.map(value => value.candidate).filter(isCanonicalReplay)]
      .some(value => value.clientSessionId === activeGhostId && value.ownerScope === owner && value.finishedAtWall + EVIDENCE_TTL_MS > Date.now() && value.configuration.privacy === 'public-corpus');
    if (!available) { setActive(null); setError('The selected replay was deleted or expired. The in-progress ghost run was discarded.'); }
  }, [activeGhostId, history.loading, history.records, localData.data.replays, owner]);
  const medianWpm = useMemo(() => {
    const values = history.records.filter(record => !(isCanonicalReplay(record.candidate) && record.candidate.configuration.settings?.arcadeGame)).map(record => record.metricSummary?.wpm ?? record.summary.wpm).filter(value => typeof value === 'number' && Number.isFinite(value) && value >= 5 && value <= 500).sort((a, b) => a! - b!);
    return values.length ? values[Math.floor(values.length / 2)]! : undefined;
  }, [history.records]);
  const averageAccuracy = useMemo(() => {
    const values = history.records.map(record => record.metricSummary?.inputAccuracy ?? record.summary.accuracy).filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
  }, [history.records]);
  const begin = async () => {
    if (!definition || starting) return;
    setStarting(true); setError('');
    try {
      const daily = definition.id === 'daily-gauntlet' ? await dailyChallenge(utcDate()) : undefined;
      setActive({ gameId: definition.id, difficulty, variant, seed: daily?.seed ?? crypto.randomUUID(), owner,
        medianWpm, averageAccuracy, focusMode: focus, keyboardLayout: preferences.layout, mobile: matchMedia('(max-width: 767px)').matches,
        ghost: publicReplays.find(replay => replay.clientSessionId === ghostId), dailyText: daily?.text });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The game could not be prepared.'); }
    finally { setStarting(false); }
  };
  const completed = async (evidence: GameEvidence) => {
    await saveSession(evidence.session, { localOnly: true });
    await onCompleted?.(evidence);
  };
  return <div className="forge-shell arcade-shell">
    <Header />
    <main id="main-content" className="forge-main arcade-main">
      <nav className="arcade-breadcrumb" aria-label="Arcade navigation"><Link to="/games">Signal Run</Link><span aria-hidden="true">/</span><Link to="/arcade">Arcade collection</Link>{definition && <><span aria-hidden="true">/</span><span>{definition.name}</span></>}</nav>
      {!definition && !params.gameId && !gameId ? <>
        <div className="arcade-heading"><p className="eyebrow">PLAY WITH PURPOSE · LOCAL PRACTICE</p><h1>Eight ways to find your flow.</h1><p>Original word worlds, shared typing evidence. Every wrong attempt stays counted. No game score is presented as a verified ranking.</p></div>
        <aside className="arcade-featured"><span>Featured for {day} UTC</span><strong>{featured.name}</strong><p>{featured.subtitle}</p><Link className="forge-button" to={`/arcade/${featured.id}`}>Explore today’s game</Link></aside>
        <div className="arcade-catalog">{GAMES.map((game, index) => <article className="arcade-card" key={game.id} style={{ '--game-accent': game.accent } as CSSProperties}>
          <div className="arcade-card-art" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><div className={`arcade-mini-world world-${game.id}`}><i /><i /><i /><i /></div></div>
          <span className="arcade-scope">LOCAL · 3 DIFFICULTIES</span><h2>{game.name}</h2><p>{game.subtitle}</p><Link className="forge-button-secondary" to={`/arcade/${game.id}`}>Open {game.name}</Link>
        </article>)}</div>
      </> : !definition ? <section className="panel p-6"><h1>This game is not in the collection.</h1><Link className="forge-button" to="/arcade">Choose an arcade game</Link></section> : <>
        <div className="arcade-heading"><p className="eyebrow">LOCAL PRACTICE · CANONICAL TYPING EVIDENCE</p><h1>{definition.name}</h1><p>{definition.subtitle}</p></div>
        {active?.gameId === definition.id ? <Suspense fallback={<p role="status">Preparing the local game engine…</p>}><ArcadePlayer key={active.seed} options={active} definition={definition} reducedMotion={preferences.reducedMotion} onExit={() => setActive(null)} onCompleted={completed} /></Suspense> : <>
          <section className="arcade-setup panel p-5 sm:p-7" aria-label={`${definition.name} setup`}>
            <div><h2>Three steps. Your own pace.</h2><ol>{definition.instructions.map(instruction => <li key={instruction}>{instruction}</li>)}</ol></div>
            <div className="arcade-setup-controls"><label>Difficulty<select aria-label="Arcade difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value as Difficulty)}>{DIFFICULTIES.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
              <label>Run<select aria-label="Arcade run variant" value={variant} onChange={event => setVariant(event.target.value as Variant)}><option value="mission">Mission</option><option value="endless">Endless · five-minute safety cap</option></select></label>
              <label className="arcade-checkbox"><input type="checkbox" checked={focus} onChange={event => setFocus(event.target.checked)} /> Quieter Focus Mode</label>
              {definition.id === 'ghost-gp' && <label>Your own replay<select aria-label="Own canonical ghost replay" value={ghostId} onChange={event => setGhostId(event.target.value)}><option value="">Bots only · no personal ghost</option>{publicReplays.map(replay => <option key={replay.clientSessionId} value={replay.clientSessionId}>{new Date(replay.finishedAtWall).toLocaleDateString()} · {replay.metrics.wpm?.toFixed(0) ?? '—'} WPM · {replay.configuration.mode}</option>)}</select><small>Only this owner’s public-corpus replays are offered. Private custom text stays excluded.</small></label>}
              <button className="forge-button" onClick={() => void begin()} disabled={starting}>{starting ? 'Preparing real assets…' : `Play ${definition.name}`}</button>
            </div>
          </section>
          <p className="arcade-contract">{definition.id === 'daily-gauntlet' ? `${day} UTC · SHA-256 daily seed · all attempts LOCAL PRACTICE. No server-issued daily contract or verified daily board is available.` : `Pace baseline: ${medianWpm ? `${medianWpm.toFixed(0)} WPM from your non-arcade local history` : 'declared 35 WPM practice baseline; no personal median measured yet'}.`} {definition.id === 'boss-duel' && 'The duel is always 90 seconds, including the Endless selection.'}</p>
          <section className="arcade-local-board" aria-label="Local arcade leaderboard"><h2>LOCAL bests in this workspace</h2><p>Arcade score first, then measured attempt accuracy. These records are on this device and have no public ranking.</p><div className="arcade-table-scroll"><table><caption>{definition.name} · own device records</caption><thead><tr><th>Difficulty</th><th>Run</th><th>Arcade score</th><th>Accuracy</th><th>Canonical WPM</th></tr></thead><tbody>{localData.data.bests.filter(best => best.gameId === definition.id).map(best => <tr key={`${best.difficulty}:${best.variant}`}><th>{best.difficulty}</th><td>{best.variant}</td><td>{best.score}</td><td>{best.accuracy?.toFixed(1) ?? '—'}%</td><td>{best.wpm?.toFixed(0) ?? '—'}</td></tr>)}</tbody></table></div>{!localData.data.bests.some(best => best.gameId === definition.id) && <p>No local best yet. Your first measured run can start the collection.</p>}</section>
        </>}
      </>}
      {(localData.error || error) && <p role="status" className="arcade-data-notice">{error || localData.error}</p>}
      {localData.recoveryText !== null && <div className="arcade-tools"><button className="forge-button-secondary" onClick={() => downloadJson({ ownerId: owner, recovery: localData.recoveryText }, 'sparowtype-arcade-recovery.json')}>Export recovery data</button><button className="forge-button-secondary" onClick={() => { try { arcadeData.clear(owner); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Persistent deletion could not be confirmed.'); } finally { setStored({ owner, result: arcadeData.read(owner) }); } }}>Clear only this workspace’s arcade data</button></div>}
      <p className="arcade-footnote">English targets · declared layout {preferences.layout}. Keyboard and touch input share the canonical scorer. Composition commits retain their provenance. Physical iOS/Android keyboards and native screen-reader journeys remain UNVERIFIED.</p>
    </main><Footer />
  </div>;
}
