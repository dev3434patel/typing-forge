import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { SessionResult } from '@/lib/typing-core';
import { ArcadeMachine } from '../engine/arcade-machine';
import { FixedLoop } from '../engine/loop';
import { ArcadeAudio, AUDIO_STORAGE_KEY, readAudioSettings } from '../engine/audio';
import { arcadeData } from '../engine/records';
import type { GameDefinition, GameEvidence, GameOptions } from '../engine/types';
import { ArcadeScene, type ArcadeSceneHandle } from './ArcadeScene';
import { NativeGameInput } from './NativeGameInput';
import { downloadJson, shareArcadeCard } from './share';
import { targetFeedback } from './target-feedback';

interface Props { options: Omit<GameOptions, 'now' | 'wallNow' | 'sessionId'>; definition: GameDefinition; reducedMotion: boolean; onExit: () => void; onCompleted?: (evidence: GameEvidence) => void | Promise<void> }
const number = (value: number | null, digits = 0) => value === null ? '—' : value.toFixed(digits);

export default function ArcadePlayer({ options, definition, reducedMotion, onExit, onCompleted }: Props) {
  const [machine] = useState(() => { const game = new ArcadeMachine({ ...options, now: () => performance.now(), wallNow: () => Date.now(), sessionId: crypto.randomUUID() }); game.start(); return game; });
  const [view, setView] = useState(() => machine.view()), [focus, setFocus] = useState(!!options.focusMode);
  const target = machine.bridge.target;
  const targetProgress = useMemo(() => targetFeedback(target, view.draft, view.currentWord), [target, view.draft, view.currentWord]);
  const [dataRevision] = useState(() => arcadeData.revision(options.owner));
  const [audioSettings, setAudioSettings] = useState(() => { try { return readAudioSettings(localStorage); } catch { return readAudioSettings(); } });
  const [storageNotice, setStorageNotice] = useState(''), [exportNotice, setExportNotice] = useState('');
  const scene = useRef<ArcadeSceneHandle>(null), audio = useRef<ArcadeAudio>(), sent = useRef(false), resultHeading = useRef<HTMLHeadingElement>(null);
  const refresh = useCallback(() => setView(machine.view()), [machine]);
  const pause = useCallback(() => { machine.pause(); refresh(); }, [machine, refresh]);
  useEffect(() => {
    const synth = new ArcadeAudio(audioSettings); audio.current = synth;
    // The Play button that mounted this route was a gesture, but async chunk
    // loading can outlive activation. The explicit sound toggle also unlocks.
    return () => { synth.dispose(); audio.current = undefined; };
  // Settings update the same instance below; do not create a context on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (audio.current) audio.current.settings = audioSettings;
    try { localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audioSettings)); } catch { setStorageNotice('Sound preferences are temporary in this browser.'); }
  }, [audioSettings]);
  useEffect(() => {
    let lastUi = 0, beat = -1;
    const loop = new FixedLoop(dt => machine.step(dt), (_alpha, frameMs) => {
      scene.current?.draw(frameMs);
      const at = machine.elapsedMs;
      if (machine.options.gameId === 'rhythm-typing' && machine.phase === 'playing' && machine.hasStarted) { const currentBeat = Math.floor(at / (60000 / machine.bpm)); if (currentBeat !== beat) { beat = currentBeat; audio.current?.tone(beat % 4 ? 900 : 80, beat % 4 ? 0.025 : 0.09); if (beat % 4 === 0) audio.current?.tone(165, 0.2); } }
      if (performance.now() - lastUi >= 100 || machine.phase === 'finished') { lastUi = performance.now(); refresh(); }
      if (machine.phase === 'finished') loop.stop();
    });
    loop.start();
    const hidden = () => { if (document.visibilityState === 'hidden') pause(); };
    window.addEventListener('blur', pause); document.addEventListener('visibilitychange', hidden);
    return () => { loop.stop(); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', hidden); };
  }, [machine, pause, refresh]);
  useEffect(() => {
    if (!view.evidence || sent.current) return;
    sent.current = true;
    if (dataRevision !== arcadeData.revision(options.owner)) { machine.discard(); refresh(); setStorageNotice('The run was discarded because this workspace’s arcade data was cleared.'); return; }
    const saved = arcadeData.save(options.owner, view.evidence, undefined, dataRevision); setStorageNotice(saved.error ?? 'Saved in this workspace’s LOCAL arcade records.');
    void Promise.resolve(onCompleted?.(view.evidence)).catch(() => setStorageNotice('Local arcade result retained. Progression could not be updated.'));
    resultHeading.current?.focus({ preventScroll: true });
  }, [view.evidence, options.owner, onCompleted, dataRevision, machine, refresh]);
  useEffect(() => arcadeData.subscribe((owner, kind, sessionId) => { if (owner === options.owner && (kind === 'clear' || kind === 'remove' && (options.ghost?.clientSessionId === sessionId || machine.bridge.controller.configuration.clientSessionId === sessionId))) { sent.current = true; machine.discard(); refresh(); setStorageNotice(kind === 'clear' ? 'This owner’s local arcade data has been cleared.' : 'The selected replay was deleted. This run was discarded.'); } }, options.owner), [machine, options.owner, options.ghost, refresh]);
  const resume = () => { machine.resume(); refresh(); void audio.current?.unlock(); requestAnimationFrame(() => document.getElementById('arcade-native-input')?.focus()); };
  const sound = async () => {
    const next = { ...audioSettings, muted: !audioSettings.muted }; setAudioSettings(next);
    if (audio.current) { audio.current.settings = next; await audio.current.unlock(); if (!next.muted) audio.current.motif(definition.motif); }
  };
  const finish = () => { machine.finish(); refresh(); };
  return <section className="arcade-player" aria-label={`${definition.name} local practice`} style={{ '--game-accent': definition.accent } as CSSProperties} onPointerDown={() => void audio.current?.unlock()} onKeyDownCapture={() => void audio.current?.unlock()}>
    <div className="arcade-toolbar">
      <span className="arcade-scope">LOCAL · {view.phase === 'finished' ? 'REPLAYED METRICS' : 'PRACTICE'}</span>
      <label><input type="checkbox" checked={focus} onChange={event => setFocus(event.target.checked)} /> Focus Mode</label>
      <button type="button" className="forge-button-secondary" aria-pressed={!audioSettings.muted} onClick={() => void sound()}>{audioSettings.muted ? 'Enable sound' : 'Mute sound'}</button>
      <label>Volume <input aria-label="Game sound volume" type="range" min="0" max="1" step="0.05" value={audioSettings.volume} onChange={event => setAudioSettings({ ...audioSettings, volume: Number(event.target.value) })} /></label>
      {view.phase === 'playing' && <button type="button" className="forge-button-secondary" onClick={pause}>Pause</button>}
      {view.phase === 'paused' && <button type="button" className="forge-button" onClick={resume}>Resume typing</button>}
      {view.phase !== 'finished' && <button type="button" className="forge-button-secondary" onClick={finish}>End run</button>}
    </div>
    <dl className="arcade-metrics">
      <div><dt>Correct-character WPM</dt><dd>{number(view.wpm)}</dd></div><div><dt>Attempt accuracy</dt><dd>{number(view.accuracy, 1)}%</dd></div>
      <div><dt>Arcade score</dt><dd>{view.score}</dd></div><div><dt>Words</dt><dd>{view.words}</dd></div><div><dt>Active time</dt><dd>{(view.elapsedMs / 1000).toFixed(1)}s</dd></div>
    </dl>
    <p className="arcade-contract">Arcade score is a game mechanic. WPM and accuracy come from the unchanged canonical typing log. No verified game board is available.</p>
    {!view.clockStarted && view.phase !== 'finished' && <p className="arcade-contract">Type your first character to start the clock and moving targets. An incorrect first character also starts the run.</p>}
    {view.phase !== 'finished' && <>
      <div className="arcade-scene-shell"><ArcadeScene ref={scene} machine={machine} draft={view.draft} accent={definition.accent} reducedMotion={reducedMotion} focusMode={focus} />
        {view.phase === 'paused' && <div className="arcade-paused"><strong>Paused. Take the time you need.</strong><button className="forge-button" onClick={resume}>Resume typing</button></div>}
      </div>
      <div className="arcade-state-row"><span>Hull {view.hull} / 3 · wave {view.wave}</span><span>{options.gameId === 'rhythm-typing' ? `${machine.bpm} BPM · rhythm combo ${view.rhythmCombo}` : `Word combo ${view.combo}`}</span>{options.gameId === 'lava-rise' && <span>Platforms {view.platforms} · lava {Math.round(view.lava * 100)}%</span>}</div>
      <p className={view.incorrectKey ? 'arcade-key-feedback is-error' : 'arcade-key-feedback'}>Target: <strong>{view.lockedId !== null ? <><span className="arcade-target-prefix">{targetProgress.matched}</span><span className="arcade-target-next">{targetProgress.next}</span>{targetProgress.remaining}</> : view.currentWord || 'choose a visible word'}</strong>{view.lockedId !== null && <span className="arcade-target-count"> · {targetProgress.matchedUnits} / {targetProgress.totalUnits} exact characters</span>}{view.actualKey && <> · Last pressed: <kbd>{view.actualKey === ' ' ? 'Space' : view.actualKey}</kbd>{view.incorrectKey ? ' · incorrect attempt recorded' : ' · exact character'}</>}</p>
      <details className="arcade-target-alternative"><summary>Available target words · text alternative</summary><ul>{view.entities.map(entity => <li key={entity.id}>{entity.kind === 'phantom' && view.elapsedMs - entity.spawnedAt >= 1500 ? `${entity.word.slice(0, 2)}${'·'.repeat(entity.word.length - 2)} — memory target` : entity.word} · {entity.kind} · lane {entity.lane + 1} · {Math.round(entity.y * 100)}% toward base{entity.id === view.lockedId ? ' · locked' : ''}</li>)}</ul></details>
      {options.gameId === 'ghost-gp' && <div className="arcade-tracks" aria-label="Local race progress"><label>You <progress max={1} value={view.playerProgress} />{Math.round(view.playerProgress * 100)}%</label>{view.ghostProgress === null ? <p>No own replay selected. The other cars are modelled BOT practice.</p> : <label>Your actual replay · LOCAL GHOST <progress max={1} value={view.ghostProgress} />{Math.round(view.ghostProgress * 100)}%</label>}{view.bots.map(bot => <label key={bot.name}>{bot.name} · BOT <progress max={1} value={bot.progress} />{Math.round(bot.progress * 100)}%</label>)}<p>Draft and nitro effects change car presentation only. Placements never use a cosmetic boost.</p></div>}
      {options.gameId === 'boss-duel' && <div className="arcade-tracks"><label>You · measured progress <progress max={1} value={view.playerProgress} /></label><label>BOT boss · 105% of {options.medianWpm ?? 35} WPM baseline <progress max={1} value={view.bossProgress} /></label></div>}
      {options.gameId === 'key-tower' && <div className="arcade-tools"><span>In-run scrap: {view.scrap} · separate from Keys · upgrades open between waves</span>{view.towers.map((level, lane) => <button className="forge-button-secondary" key={lane} disabled={view.scrap < 15 || level >= 3 || !machine.canUpgrade} onClick={() => { machine.upgrade(lane); refresh(); }}>Upgrade lane {lane + 1} · 15 scrap · level {level}</button>)}</div>}
      {['word-invaders', 'key-tower'].includes(options.gameId) && <div className="arcade-tools">{(['slow', 'bomb', 'shield'] as const).map(type => <button className="forge-button-secondary" key={type} disabled={!view.powerups[type] || view.phase !== 'playing'} onClick={() => { machine.usePowerup(type); refresh(); }}>{type === 'slow' ? 'Slow-Mo · 6s' : type === 'bomb' ? 'Clear short words' : 'Arm shield'} ({view.powerups[type]})</button>)}</div>}
      <NativeGameInput machine={machine} refresh={refresh} onPause={pause} onCorrect={correct => { if (correct) audio.current?.tone(440, 0.04); else audio.current?.tone(110, 0.06); }} />
      {view.focusSuggested && !focus && <p className="arcade-suggestion">Your current attempt accuracy is below85%. <button className="forge-button-secondary" onClick={() => setFocus(true)}>Try quieter Focus Mode</button></p>}
    </>}
    <p className="arcade-live-status" role="status" aria-live="polite">{view.notice}</p>
    {view.evidence && <ArcadeResult evidence={view.evidence} headingRef={resultHeading} onExit={onExit} onShare={() => void shareArcadeCard(view.evidence!).catch(() => setExportNotice('Image export is unavailable in this browser. JSON remains available.'))} />}
    {view.phase === 'finished' && !view.evidence && <button className="forge-button" onClick={onExit}>Choose another run</button>}
    <p role="status">{storageNotice} {exportNotice}</p>
  </section>;
}

function ArcadeResult({ evidence, headingRef, onExit, onShare }: { evidence: GameEvidence; headingRef: RefObject<HTMLHeadingElement>; onExit: () => void; onShare: () => void }) {
  const metrics = evidence.session.metrics;
  return <section className="arcade-result" aria-label="Arcade result">
    <h2 ref={headingRef} tabIndex={-1}>{evidence.outcome}</h2><p>LOCAL PRACTICE · {evidence.verification}. A local score is not a verified ranking.</p>
    <dl className="arcade-metrics"><div><dt>Canonical WPM</dt><dd>{number(metrics.wpm)}</dd></div><div><dt>Raw WPM</dt><dd>{number(metrics.rawWpm)}</dd></div><div><dt>Attempt accuracy</dt><dd>{number(metrics.inputAccuracy, 2)}%</dd></div><div><dt>Correct / all attempts</dt><dd>{metrics.correctAttempts} / {metrics.insertionAttempts}</dd></div><div><dt>Consistency</dt><dd>{number(metrics.consistency)}%</dd></div></dl>
    <p>{metrics.incorrectAttempts} incorrect attempts remain counted · {metrics.deletedUnits} characters deleted · {evidence.session.pauseIntervals.length} paused intervals.</p>
    <p>Session {evidence.session.clientSessionId} · metrics {evidence.session.metricsVersion}. Game-generated word submissions do not insert characters or create typing credit.</p>
    <div className="arcade-tools"><button className="forge-button" onClick={onExit}>Choose another run</button><button className="forge-button-secondary" onClick={() => downloadJson(evidence, `sparowtype-${evidence.gameId}-local.json`)}>Export canonical game JSON</button><button className="forge-button-secondary" onClick={onShare}>Share spoiler-free image</button></div>
  </section>;
}
export type { SessionResult };
