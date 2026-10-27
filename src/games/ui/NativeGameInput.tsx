import { useEffect, useRef, useState, type FormEvent } from 'react';
import { graphemes } from '@/lib/typing-core/transcript';
import { CompositionEchoGuard } from '@/lib/composition-echo';
import type { ArcadeMachine } from '../engine/arcade-machine';
import { attachGameInputGuard, gameBlurLeavesPlayer } from './native-game-guards';

function changedRange(before: string, after: string) {
  const a = graphemes(before), b = graphemes(after);
  let start = 0; while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length, endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  return { start, end: endA, text: b.slice(start, endB).join('') };
}
export function NativeGameInput({ machine, refresh, onCorrect, onPause }: { machine: ArcadeMachine; refresh: () => void; onCorrect: (correct: boolean) => void; onPause: () => void }) {
  const input = useRef<HTMLTextAreaElement>(null), composing = useRef(false), echo = useRef(new CompositionEchoGuard()), internalPointerUntil = useRef(0);
  const [draft, setDraft] = useState(machine.bridge.draft), [warning, setWarning] = useState('');
  useEffect(() => {
    const element = input.current; if (!element) return;
    // React's synthetic before-input adapter does not cover every native mobile
    // deletion event. Observe the actual event, as the main input guard does.
    const stop = attachGameInputGuard(element, { composing: () => composing.current, playable: () => machine.phase === 'playing' && !machine.canUpgrade, empty: () => !machine.bridge.draft,
      unlock: () => { machine.unlock(); setDraft(''); refresh(); }, transferBlocked: () => setWarning('Paste and drop are disabled during arcade practice.') });
    const pointer = (event: PointerEvent) => { internalPointerUntil.current = event.target instanceof Element && event.target.closest('.arcade-player') ? performance.now() + 500 : 0; };
    document.addEventListener('pointerdown', pointer, true);
    return () => { stop(); document.removeEventListener('pointerdown', pointer, true); };
  }, [machine, refresh]);
  const commit = (value: string, inputType: string, compositionId?: string) => {
    const change = changedRange(machine.bridge.draft, value);
    if (change.text || change.start !== change.end) {
      const feedback = machine.edit(change.start, change.end, change.text, compositionId ? 'composition' : inputType === 'insertReplacementText' ? 'autocorrect' : 'keyboard', compositionId);
      if (feedback !== null) onCorrect(feedback);
    } else if (inputType === 'insertReplacementText') machine.bridge.markAssistance('autocorrect');
    setDraft(machine.bridge.draft); if (input.current) input.current.value = machine.bridge.draft; refresh();
  };
  const change = (event: FormEvent<HTMLTextAreaElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (native.inputType === 'insertFromPaste' || native.inputType === 'insertFromDrop') { event.currentTarget.value = machine.bridge.draft; setWarning('Paste and drop are disabled during arcade practice.'); return; }
    if (composing.current || native.isComposing) { setDraft(event.currentTarget.value); return; }
    if (echo.current.consume(native.data ?? '', native.inputType ?? '')) { event.currentTarget.value = machine.bridge.draft; return; }
    commit(event.currentTarget.value, native.inputType ?? 'insertText');
  };
  return <div className="arcade-input-shell">
    <label htmlFor="arcade-native-input">Type a target word <span>· exact characters, every attempt counted</span></label>
    <textarea ref={input} id="arcade-native-input" aria-label="Arcade typing input" aria-describedby="arcade-input-help arcade-input-warning"
      rows={1} value={draft} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={256}
      disabled={machine.phase !== 'playing' || machine.canUpgrade} onChange={change}
      onPaste={event => { event.preventDefault(); setWarning('Paste is disabled. Type the target with your keyboard.'); }}
      onDrop={event => { event.preventDefault(); setWarning('Drop is disabled. Type the target with your keyboard.'); }}
      onCompositionStart={() => { composing.current = true; echo.current.reset(); }}
      onCompositionEnd={event => {
        composing.current = false; const value = event.currentTarget.value;
        commit(value, 'insertCompositionText', crypto.randomUUID());
        echo.current.remember(event.data ?? value);
      }}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'Escape') { event.preventDefault(); onPause(); }
        if (event.key === 'Backspace' && !machine.bridge.draft) { event.preventDefault(); machine.unlock(); setDraft(''); refresh(); }
        if (event.getModifierState('CapsLock')) setWarning('Caps Lock is on. Target case is exact.');
        else if (warning.startsWith('Caps Lock')) setWarning('');
      }} onBlur={event => { echo.current.reset(); const destination = event.relatedTarget;
        if (gameBlurLeavesPlayer(destination instanceof HTMLElement ? !!destination.closest('.arcade-player') : null, internalPointerUntil.current, performance.now())) onPause(); }} />
    <p id="arcade-input-help">Words complete automatically; no Space is needed. Backspace edits or unlocks an empty target. Escape pauses.</p>
    <p id="arcade-input-warning" role="status">{warning}</p>
    <button type="button" className="forge-button-secondary" onClick={() => input.current?.focus()} disabled={machine.phase !== 'playing'}>Focus typing / open mobile keyboard</button>
  </div>;
}
