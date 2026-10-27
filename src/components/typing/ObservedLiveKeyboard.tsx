import { memo, useState, type RefObject } from "react";
import { useLiveKeyboard } from "@/hooks/useLiveKeyboard";
import { PressedKeyStore } from "@/lib/pressed-key-store";
import { LiveKeyboard, type LiveKeyboardProps } from "./LiveKeyboard";

interface Props extends Omit<LiveKeyboardProps, "input" | "pressedStore"> {
  inputRef: RefObject<HTMLTextAreaElement>;
  sessionKey: unknown;
  observe: boolean;
}

/** Physical press/release feedback belongs to the guide, not the measured passage.
 * Code-specific subscriptions keep plain press/release out of the full guide's
 * rendering path as well as the measured passage.
 */
export const ObservedLiveKeyboard = memo(function ObservedLiveKeyboard({
  inputRef,
  sessionKey,
  observe,
  ...props
}: Props) {
  const [pressedStore] = useState(() => new PressedKeyStore());
  const input = useLiveKeyboard(inputRef, sessionKey, observe && props.visible, pressedStore);
  return <LiveKeyboard {...props} input={input} pressedStore={pressedStore} />;
});
