import { memo, useId, useMemo, type CSSProperties } from "react";
import { ChevronDown, ChevronUp, Hand, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { getContentPack } from "@/lib/content-packs";
import { inputUnitLabel } from "@/lib/typing-feedback";
import {
  FINGER_NAMES,
  liveKeyboardLayout,
  locateKeyboardCharacter,
  keyboardNeedsShift,
  isKeyboardCasePair,
  oppositeShift,
  type KeyboardInputState,
  type LiveKeyboardAttempt,
} from "@/lib/live-keyboard";
import "./live-keyboard.css";

export interface LiveKeyboardProps {
  layout: string;
  language: string;
  input: KeyboardInputState;
  expectedCharacter?: string | null;
  lastAttempt?: LiveKeyboardAttempt | null;
  lessonKeys?: readonly string[];
  masteredKeys?: readonly string[];
  visible: boolean;
  fingerGuide: boolean;
  reducedMotion?: boolean;
  onVisibilityChange: (visible: boolean) => void;
  onFingerGuideChange?: (visible: boolean) => void;
  adaptive?: boolean;
}

export const LiveKeyboard = memo(function LiveKeyboard({
  layout,
  language,
  input,
  expectedCharacter,
  lastAttempt,
  lessonKeys,
  masteredKeys,
  visible,
  fingerGuide,
  reducedMotion = false,
  onVisibilityChange,
  onFingerGuideChange,
  adaptive = false,
}: LiveKeyboardProps) {
  const id = useId();
  const mapping = useMemo(
    () => liveKeyboardLayout(layout, language),
    [layout, language],
  );
  const pack = getContentPack(language);
  const expected = locateKeyboardCharacter(mapping, expectedCharacter);
  // A committed IME/autocorrect batch cannot identify the physical key used.
  const actual =
    lastAttempt?.provenance === "keyboard"
      ? locateKeyboardCharacter(mapping, lastAttempt.typed)
      : null;
  const shift =
    expected && keyboardNeedsShift(expected, input.capsLock)
      ? oppositeShift(expected.key.finger)
      : null;
  const known = useMemo(
    () =>
      lessonKeys
        ? new Set(lessonKeys.map((key) => key.toLocaleLowerCase(pack.id)))
        : null,
    [lessonKeys, pack.id],
  );
  const mastered = useMemo(
    () => new Set(masteredKeys?.map((key) => key.toLocaleLowerCase(pack.id))),
    [masteredKeys, pack.id],
  );
  const expectedLabel =
    expectedCharacter == null
      ? "Free practice"
      : inputUnitLabel(expectedCharacter);
  const typingModifier = input.pressedCodes.some((code) =>
    code.startsWith("Shift"),
  );
  const inputMode = input.composing
    ? "Composing · your committed text will appear above"
    : input.deadKey
      ? "Dead key · waiting for the completed character"
      : null;
  const description = `${mapping.label} logical keyboard. ${mapping.reference}. ${expectedCharacter == null ? "No next character is prescribed." : `Expected ${expectedLabel}.`}${lastAttempt ? ` Last input ${inputUnitLabel(lastAttempt.typed)}${lastAttempt.correct ? "" : ", incorrect"}.` : ""}`;
  return (
    <section
      className="live-keyboard"
      data-testid="live-keyboard"
      data-reduced-motion={reducedMotion || undefined}
      aria-label="Live keyboard guide"
    >
      <div className="live-keyboard-toolbar">
        <div className="live-keyboard-title">
          <Keyboard size={15} aria-hidden="true" />
          <span>
            Keyboard
            <span className="live-keyboard-layout">{mapping.label}</span>
          </span>
        </div>
        <div className="live-keyboard-actions">
          {visible && onFingerGuideChange && (
            <button
              type="button"
              className="live-keyboard-control"
              aria-label="Finger guide"
              aria-pressed={fingerGuide}
              onClick={() => onFingerGuideChange(!fingerGuide)}
            >
              <Hand size={14} aria-hidden="true" />
              <span>Finger guide</span>
            </button>
          )}
          <button
            type="button"
            className="live-keyboard-control"
            aria-expanded={visible}
            aria-controls={visible ? `${id}-board` : undefined}
            onClick={() => onVisibilityChange(!visible)}
          >
            {visible ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
            <span>{visible ? "Hide keyboard" : "Show keyboard"}</span>
          </button>
        </div>
      </div>
      {visible && (
        <>
          <div
            id={`${id}-board`}
            className={cn("live-keyboard-board", adaptive && "learn-keyboard")}
            data-testid="live-keyboard-board"
            data-mapped={mapping.mapped}
            role="img"
            aria-label={description}
          >
            <div aria-hidden="true" dir="ltr" className="live-keyboard-keys">
              {mapping.mapped ? (
                mapping.rows.map((row, rowIndex) => (
                  <div
                    className={cn(
                      "live-keyboard-row",
                      adaptive && "learn-keyboard-row",
                    )}
                    key={rowIndex}
                  >
                    {row.map((key) => {
                      const pressed = input.pressedCodes.includes(key.code);
                      const next = expected?.key.code === key.code;
                      const actualKey = actual?.key.code === key.code;
                      const incorrect = actualKey && !lastAttempt!.correct;
                      const isKnown =
                        !known ||
                        key.base === " " ||
                        !key.base ||
                        known.has(key.base.toLocaleLowerCase(pack.id));
                      const isMastered =
                        !!key.base &&
                        mastered.has(key.base.toLocaleLowerCase(pack.id));
                      const shifted = typingModifier && !!key.shifted;
                      const casePair = isKeyboardCasePair(key);
                      const label =
                        casePair && typingModifier !== (input.capsLock === true)
                          ? key.base!.toLocaleUpperCase(pack.id)
                          : key.label;
                      return (
                        <span
                          key={key.code}
                          className={cn(
                            "live-key",
                            adaptive && "learn-key",
                            incorrect && adaptive && "learn-key-incorrect",
                          )}
                          data-key-code={key.code}
                          data-key={key.base}
                          data-expected-key={next || undefined}
                          data-pressed-key={pressed || undefined}
                          data-last-input={actualKey || undefined}
                          data-incorrect-key={incorrect || undefined}
                          data-locked={!isKnown || undefined}
                          data-mastered={isMastered || undefined}
                          data-home-key={key.home || undefined}
                          data-shift-guide={shift === key.code || undefined}
                          data-toggled={
                            (key.code === "CapsLock" && input.capsLock) ||
                            undefined
                          }
                          data-finger={fingerGuide ? key.finger : undefined}
                          style={{ "--key-units": key.width } as CSSProperties}
                        >
                          <span
                            className={cn(
                              "live-key-label",
                              key.label.length > 1 && "live-key-label-wide",
                            )}
                          >
                            {key.shifted &&
                            key.base &&
                            key.shifted !==
                              key.base.toLocaleUpperCase(pack.id) ? (
                              <span
                                className="live-key-alternate"
                                data-selected={shifted || undefined}
                              >
                                {key.shifted}
                              </span>
                            ) : null}
                            <span data-selected={!shifted || undefined}>
                              {label}
                            </span>
                          </span>
                          {key.home && <i className="live-key-home" />}
                          {isMastered && <i className="live-key-mastered" />}
                        </span>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div
                  className="live-keyboard-native"
                  dir={pack.direction}
                  lang={pack.id}
                >
                  {mapping.characters.map((character) => (
                    <span
                      key={character}
                      className="live-character"
                      data-key={character}
                      data-expected-key={
                        character === expectedCharacter || undefined
                      }
                      data-incorrect-key={
                        (lastAttempt?.typed === character &&
                          !lastAttempt.correct) ||
                        undefined
                      }
                      data-locked={
                        (!!known &&
                          character !== " " &&
                          !known.has(character.toLocaleLowerCase(pack.id))) ||
                        undefined
                      }
                    >
                      {character === " " ? "space" : character}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="live-keyboard-feedback">
            <p data-testid="keyboard-next">
              <span className="live-keyboard-next-dot" aria-hidden="true" />
              {expectedCharacter == null ? (
                "Free practice"
              ) : (
                <>
                  Next{" "}
                  <kbd>
                    <bdi>{expectedLabel}</bdi>
                  </kbd>
                </>
              )}
              {fingerGuide && expected?.key.finger && (
                <span className="live-keyboard-finger">
                  {FINGER_NAMES[expected.key.finger]}
                  {shift ? " + opposite Shift" : ""}
                </span>
              )}
            </p>
            {lastAttempt && (
              <p
                data-testid="keyboard-last-input"
                data-incorrect={!lastAttempt.correct || undefined}
              >
                Typed{" "}
                <kbd>
                  <bdi>{inputUnitLabel(lastAttempt.typed)}</bdi>
                </kbd>
                {!lastAttempt.correct && (
                  <span>
                    {" "}
                    · expected <bdi>{inputUnitLabel(lastAttempt.expected)}</bdi>
                  </span>
                )}
                {lastAttempt.provenance === "composition" && (
                  <span> · composed text</span>
                )}
              </p>
            )}
          </div>
          <div className="live-keyboard-caption">
            <span>
              {inputMode ?? mapping.reference}
              {!mapping.mapped &&
                ". Committed characters are shown; physical keys are not inferred."}
            </span>
            {mapping.mapped && (
              <span className="live-keyboard-legend">
                <i className="live-legend-next" />
                Next
                <i className="live-legend-held" />
                Held
                <i className="live-legend-error" />
                Mistake
              </span>
            )}
            {known && (
              <span>
                Dashed keys: not introduced
                {mastered.size > 0 ? " · dot: mastered" : ""}
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
});
