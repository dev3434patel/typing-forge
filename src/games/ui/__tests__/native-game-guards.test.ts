import { describe, expect, it, vi } from 'vitest';
import { attachGameInputGuard, gameBlurLeavesPlayer } from '../native-game-guards';
function fixture() {
  const element = new EventTarget(), unlock = vi.fn(), transferBlocked = vi.fn(), state = { composing: false, playable: true, empty: true };
  const stop = attachGameInputGuard(element, { composing: () => state.composing, playable: () => state.playable, empty: () => state.empty, unlock, transferBlocked });
  const dispatch = (inputType: string, isComposing = false) => { const event = new Event('beforeinput', { cancelable: true }); Object.defineProperties(event, { inputType: { value: inputType }, isComposing: { value: isComposing } }); element.dispatchEvent(event); return event; };
  return { unlock, transferBlocked, state, stop, dispatch };
}
describe('actual native game input guards', () => {
  it('unlocks an empty word from native beforeinput without a preceding keydown', () => { const f = fixture(); expect(f.dispatch('deleteContentBackward').defaultPrevented).toBe(true); expect(f.unlock).toHaveBeenCalledOnce(); f.stop(); });
  it('leaves nonempty native deletion to the normal retained-text edit path', () => { const f = fixture(); f.state.empty = false; expect(f.dispatch('deleteContentBackward').defaultPrevented).toBe(false); expect(f.unlock).not.toHaveBeenCalled(); f.stop(); });
  it('does not interpret deletion inside an IME composition as unlocking', () => { const f = fixture(); f.dispatch('deleteContentBackward', true); f.state.composing = true; f.dispatch('deleteContentBackward'); expect(f.unlock).not.toHaveBeenCalled(); f.stop(); });
  it('cannot unlock while paused, finished or between tower waves', () => { const f = fixture(); f.state.playable = false; f.dispatch('deleteContentBackward'); expect(f.unlock).not.toHaveBeenCalled(); f.stop(); });
  it.each(['insertFromPaste', 'insertFromDrop'])('blocks native%s without inserting or unlocking', inputType => { const f = fixture(); expect(f.dispatch(inputType).defaultPrevented).toBe(true); expect(f.transferBlocked).toHaveBeenCalledOnce(); expect(f.unlock).not.toHaveBeenCalled(); f.stop(); });
  it('ignores unrelated native edits and releases its listener on unmount', () => { const f = fixture(); f.dispatch('insertText'); f.stop(); f.dispatch('deleteContentBackward'); expect(f.unlock).not.toHaveBeenCalled(); expect(f.transferBlocked).not.toHaveBeenCalled(); });
  it('keeps an internal pointer click with null relatedTarget from moving the toolbar before click', () => { expect(gameBlurLeavesPlayer(null, 1500, 1001)).toBe(false); expect(gameBlurLeavesPlayer(true, 0, 2000)).toBe(false); });
  it('still pauses for an explicit external focus target even immediately after an internal pointer', () => expect(gameBlurLeavesPlayer(false, 1500, 1001)).toBe(true));
  it('does not let stale pointer intent suppress a later programmatic blur', () => expect(gameBlurLeavesPlayer(null, 1500, 1501)).toBe(true));
});
