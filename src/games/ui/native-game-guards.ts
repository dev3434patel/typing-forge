interface GameInputGuard {
  composing: () => boolean;
  playable: () => boolean;
  empty: () => boolean;
  unlock: () => void;
  transferBlocked: () => void;
}
/** Native event registration covers mobile deletions without a keydown event. */
export function attachGameInputGuard(element: EventTarget, state: GameInputGuard): () => void {
  const beforeInput = (raw: Event) => {
    const event = raw as InputEvent;
    if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') { event.preventDefault(); state.transferBlocked(); return; }
    if (event.inputType === 'deleteContentBackward' && !event.isComposing && !state.composing() && state.playable() && state.empty()) { event.preventDefault(); state.unlock(); }
  };
  element.addEventListener('beforeinput', beforeInput);
  return () => element.removeEventListener('beforeinput', beforeInput);
}
export function gameBlurLeavesPlayer(destinationInside: boolean | null, pointerInsideUntil: number, now: number): boolean {
  return destinationInside === null ? now > pointerInsideUntil : !destinationInside;
}
