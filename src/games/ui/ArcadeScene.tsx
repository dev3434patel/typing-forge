import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { ArcadeMachine } from '../engine/arcade-machine';
import { ParticlePool } from '../engine/particles';
import { paintTargetFeedback, targetFeedback } from './target-feedback';

export interface ArcadeSceneHandle { draw: (frameMs: number) => void }
export const ArcadeScene = forwardRef<ArcadeSceneHandle, { machine: ArcadeMachine; draft: string; accent: string; reducedMotion: boolean; focusMode: boolean }>(function ArcadeScene({ machine, draft, accent, reducedMotion, focusMode }, reference) {
  const canvas = useRef<HTMLCanvasElement>(null), particles = useRef<ParticlePool>();
  const dimensions = useRef({ width: 800, height: 380 }), hit = useRef(0), lastHitAt = useRef(-1000);
  const visualFreezeUntil = useRef(0), words = useRef(0);
  const palette = useRef({ text: '#EDEDF2', surface: '#0E0E14', feedback: '#C6FF3D' });
  const suppressed = reducedMotion || focusMode;
  const target = machine.bridge.target;
  const feedback = useMemo(() => targetFeedback(target, draft), [target, draft]);
  useEffect(() => {
    const element = canvas.current; if (!element) return;
    particles.current = new ParticlePool(!!machine.options.mobile);
    const resize = () => {
      const width = Math.max(240, element.clientWidth), height = Math.max(240, element.clientHeight), dpr = Math.min(devicePixelRatio || 1, 1.5);
      dimensions.current = { width, height }; element.width = Math.round(width * dpr); element.height = Math.round(height * dpr);
      element.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    const theme = () => { const css = getComputedStyle(element); palette.current = { text: css.getPropertyValue('--text').trim() || '#EDEDF2', surface: css.getPropertyValue('--surface').trim() || '#0E0E14', feedback: css.getPropertyValue('--accent').trim() || '#C6FF3D' }; };
    theme(); const themeObserver = new MutationObserver(theme); themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => { observer.disconnect(); themeObserver.disconnect(); particles.current?.clear(); };
  }, [machine]);
  useImperativeHandle(reference, () => ({ draw(frameMs) {
    const element = canvas.current, context = element?.getContext('2d'); if (!element || !context) return;
    const { width: w, height: h } = dimensions.current, at = machine.elapsedMs, game = machine.options.gameId;
    const { text, surface } = palette.current;
    if (hit.current !== machine.hitCount) { hit.current = machine.hitCount; lastHitAt.current = at; if (!suppressed) particles.current?.emit(machine.lastHitX, machine.lastHitY, 6); }
    if (words.current !== machine.words) { words.current = machine.words; if (!suppressed) visualFreezeUntil.current = at + 40; }
    if (!suppressed && at < visualFreezeUntil.current) return;
    context.clearRect(0, 0, w, h); context.fillStyle = surface; context.fillRect(0, 0, w, h);
    context.save();
    const sinceHit = at - lastHitAt.current;
    if (!suppressed && sinceHit < 180) context.translate(Math.sin(at * 0.09) * 4 * (1 - sinceHit / 180), 0);
    context.strokeStyle = accent; context.globalAlpha = 0.12; context.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, h); context.stroke(); }
    for (let y = 0; y < h; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(w, y); context.stroke(); }
    context.globalAlpha = 1;
    if (game === 'snake-words') {
      const size = Math.min(w - 40, h - 40) / 12, left = (w - size * 12) / 2;
      machine.snake.forEach((part, index) => { context.fillStyle = index === 0 ? text : accent; context.globalAlpha = index === 0 ? 1 : 0.6; context.fillRect(left + part.x * size + 2, 20 + part.y * size + 2, size - 4, size - 4); }); context.globalAlpha = 1;
      context.strokeStyle = text; context.lineWidth = 2; context.strokeRect(left + machine.snakeFood.x * size + 1, 21 + machine.snakeFood.y * size, size - 2, size - 2);
      context.fillStyle = text; context.font = `${Math.max(9, size * 0.45)}px Inter,sans-serif`; context.textAlign = 'center'; context.fillText(machine.snakeFood.word.slice(0, 2).toUpperCase(), left + (machine.snakeFood.x + 0.5) * size, 20 + (machine.snakeFood.y + 0.5) * size);
    }
    if (game === 'lava-rise') {
      context.fillStyle = '#FB923C'; context.globalAlpha = 0.55; context.fillRect(0, h * (1 - machine.lava), w, h * machine.lava); context.globalAlpha = 1;
      context.strokeStyle = text; for (let i = 0; i < Math.min(machine.platforms + 1, 8); i++) { context.beginPath(); const y = h - 35 - i * 32; context.moveTo(w / 2 - 70 + (i % 2) * 30, y); context.lineTo(w / 2 + 70 + (i % 2) * 30, y); context.stroke(); }
    }
    if (game === 'rhythm-typing') {
      const beat = at % (60000 / machine.bpm) / (60000 / machine.bpm);
      context.strokeStyle = text; context.beginPath(); context.moveTo(20, h * 0.67); context.lineTo(w - 20, h * 0.67); context.stroke();
      context.beginPath(); context.arc(w - 36, 34, 11 + (suppressed ? 0 : beat * 7), 0, Math.PI * 2); context.strokeStyle = accent; context.stroke();
    }
    if (game === 'key-tower') {
      context.strokeStyle = text; for (let lane = 0; lane < 3; lane++) { const x = (lane + 0.5) / 3 * w; context.strokeRect(x - 18, h - 44 - machine.towers[lane] * 5, 36, 30 + machine.towers[lane] * 5); }
    }
    if (game === 'ghost-gp' || game === 'boss-duel') {
      const rows = game === 'ghost-gp' ? machine.visualTracks.length : 2;
      for (let lane = 0; lane < rows; lane++) { context.globalAlpha = lane ? 0.25 : 0.65; context.fillStyle = lane ? text : accent; context.fillRect(30, 42 + lane * 32, w - 60, 2); }
      if (game === 'ghost-gp') for (let lane = 0; lane < machine.visualTracks.length; lane++) {
        const car = machine.visualTracks[lane], boost = lane === 0 && !suppressed ? (machine.visualNitro ? 1.05 : machine.visualDraft ? 1.03 : 1) : 1;
        const x = 30 + Math.min(1, car.progress * boost) * (w - 84), y = 30 + lane * 32;
        context.globalAlpha = car.ghost ? 0.35 : 1; context.fillStyle = lane === 0 ? accent : text; context.fillRect(x, y, 38, 18);
        context.fillStyle = surface; context.fillRect(x + 8, y + 3, 12, 7); context.globalAlpha = 1;
      }
      context.globalAlpha = 1; context.fillStyle = text; context.font = '12px Inter, sans-serif'; context.textAlign = 'center'; context.fillText(machine.visualNitro ? 'Nitro ·2s visual boost; measured progress below is unchanged.' : 'Measured progress appears in the accessible track below.', w / 2, h - 24, w - 32);
    }
    context.font = '600 17px "JetBrains Mono", monospace'; context.textAlign = 'center'; context.textBaseline = 'middle';
    let visibleIndex = 0;
    for (const entity of machine.pool.slots) {
      if (!entity.active) continue;
      let x = entity.x * w, y = entity.y * h;
      if (reducedMotion) { x = (visibleIndex % 3 + 0.5) / 3 * w; y = 58 + Math.floor(visibleIndex / 3) * 54; visibleIndex++; }
      if (['ghost-gp', 'daily-gauntlet', 'snake-words', 'lava-rise', 'boss-duel'].includes(game)) { x = w / 2; y = game === 'snake-words' ? 30 : h * 0.4; }
      const locked = entity.id === machine.lockedId;
      const label = entity.kind === 'phantom' && at - entity.spawnedAt >= 1500 ? entity.word.slice(0, 2) + '·'.repeat(entity.word.length - 2) : entity.word;
      const boxWidth = context.measureText(label).width + 28;
      x = Math.max(boxWidth / 2 + 8, Math.min(w - boxWidth / 2 - 8, x));
      context.fillStyle = surface; context.fillRect(x - boxWidth / 2, y - 20, boxWidth, 40);
      context.strokeStyle = locked ? text : accent; context.lineWidth = locked ? 2 : 1; context.strokeRect(x - boxWidth / 2, y - 20, boxWidth, 40);
      context.fillStyle = text; context.fillText(label, x, y);
      if (locked && entity.word === target) paintTargetFeedback(context, label, x, y, feedback, palette.current.feedback, text);
      if (entity.kind !== 'word') { context.font = '10px Inter, sans-serif'; context.fillText(entity.kind.toUpperCase(), x, y - 31); context.font = '600 17px "JetBrains Mono", monospace'; }
    }
    if (!suppressed && sinceHit < 120) { context.strokeStyle = accent; context.lineWidth = 2; context.beginPath(); context.moveTo(w / 2, h - 14); context.lineTo(machine.lastHitX * w, machine.lastHitY * h); context.stroke(); }
    particles.current?.observeFrame(frameMs); particles.current?.update(frameMs);
    if (!suppressed) for (const particle of particles.current?.slots ?? []) if (particle.active) { context.globalAlpha = 1 - particle.age / particle.life; context.fillStyle = accent; context.fillRect(particle.x * w, particle.y * h, 3, 3); }
    context.globalAlpha = 1; context.restore();
  } }), [machine, accent, suppressed, reducedMotion, target, feedback]);
  return <canvas ref={canvas} className="arcade-canvas" aria-hidden="true" />;
});
