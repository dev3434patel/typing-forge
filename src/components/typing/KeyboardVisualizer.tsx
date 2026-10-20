import { useState } from "react";
import { LiveKeyboard } from "./LiveKeyboard";
import { EMPTY_KEYBOARD_INPUT } from "@/lib/live-keyboard";

/** Compatibility adapter for the retired race view; active workspaces use LiveKeyboard. */
export function KeyboardVisualizer({
  currentKey,
  errorKeys = new Set<string>(),
  layout = "qwerty",
  language = "en",
}: {
  currentKey?: string;
  errorKeys?: Set<string>;
  keyConfidence?: Map<string, number>;
  layout?: string;
  language?: string;
}) {
  const [visible, setVisible] = useState(true);
  const [fingerGuide, setFingerGuide] = useState(true);
  return (
    <LiveKeyboard
      layout={layout}
      language={language}
      input={EMPTY_KEYBOARD_INPUT}
      lastAttempt={
        currentKey
          ? {
              typed: currentKey,
              correct: !errorKeys.has(currentKey),
              provenance: "keyboard",
              eventSequence: 0,
            }
          : null
      }
      visible={visible}
      fingerGuide={fingerGuide}
      onVisibilityChange={setVisible}
      onFingerGuideChange={setFingerGuide}
    />
  );
}
