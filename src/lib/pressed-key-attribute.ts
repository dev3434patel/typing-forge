import type { PressedKeyStore } from "./pressed-key-store";

type PressedKeyNode = Pick<Element, "getAttribute" | "setAttribute" | "removeAttribute">;
const PRESSED_ATTRIBUTE = "data-pressed-key";

/** Physical feedback owns this attribute only. Reads never measure layout. */
export function syncPressedKeyAttribute(node: PressedKeyNode, pressed: boolean): void {
  const previous = node.getAttribute(PRESSED_ATTRIBUTE);
  if (pressed) {
    if (previous !== "true") node.setAttribute(PRESSED_ATTRIBUTE, "true");
  } else if (previous !== null) node.removeAttribute(PRESSED_ATTRIBUTE);
}

/** Subscribe before sampling, so mount cannot miss a simultaneous store update.
 * Disposal releases ownership and guards callbacks already copied by a store.
 */
export function bindPressedKeyAttribute(
  node: PressedKeyNode,
  store: PressedKeyStore,
  code: string,
): () => void {
  let active = true;
  const sync = () => {
    if (active) syncPressedKeyAttribute(node, store.getSnapshot(code));
  };
  const unsubscribe = store.subscribe(code, sync);
  sync();
  return () => {
    if (!active) return;
    active = false;
    unsubscribe();
    syncPressedKeyAttribute(node, false);
  };
}
