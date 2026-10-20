import { useLayoutEffect, useState, type RefObject } from "react";
import {
  EMPTY_KEYBOARD_INPUT,
  observeKeyboardInput,
  type KeyboardInputState,
} from "@/lib/live-keyboard";

export function useLiveKeyboard(
  inputRef: RefObject<HTMLTextAreaElement>,
  sessionKey: unknown,
  enabled = true,
): KeyboardInputState {
  const [state, setState] = useState<KeyboardInputState>(EMPTY_KEYBOARD_INPUT);
  useLayoutEffect(() => {
    setState(EMPTY_KEYBOARD_INPUT);
    if (!enabled || !inputRef.current) return;
    return observeKeyboardInput(inputRef.current, setState);
  }, [inputRef, sessionKey, enabled]);
  return enabled ? state : EMPTY_KEYBOARD_INPUT;
}
