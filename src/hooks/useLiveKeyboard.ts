import { useLayoutEffect, useState, type RefObject } from "react";
import {
  EMPTY_KEYBOARD_INPUT,
  observeKeyboardInput,
  type KeyboardInputState,
} from "@/lib/live-keyboard";
import { keyboardSemanticInput, type PressedKeyStore } from "@/lib/pressed-key-store";

export function useLiveKeyboard(
  inputRef: RefObject<HTMLTextAreaElement>,
  sessionKey: unknown,
  enabled = true,
  pressedStore?: PressedKeyStore,
): KeyboardInputState {
  const [state, setState] = useState<KeyboardInputState>(EMPTY_KEYBOARD_INPUT);
  useLayoutEffect(() => {
    setState(EMPTY_KEYBOARD_INPUT);
    pressedStore?.clear();
    if (!enabled || !inputRef.current) return;
    let semantic = EMPTY_KEYBOARD_INPUT;
    const stop = observeKeyboardInput(inputRef.current, (next) => {
      if (!pressedStore) {
        setState(next);
        return;
      }
      pressedStore.replace(next.pressedCodes);
      const nextSemantic = keyboardSemanticInput(semantic, next);
      if (nextSemantic !== semantic) {
        semantic = nextSemantic;
        setState(nextSemantic);
      }
    });
    return () => {
      stop();
      pressedStore?.clear();
    };
  }, [inputRef, sessionKey, enabled, pressedStore]);
  return enabled ? state : EMPTY_KEYBOARD_INPUT;
}
