import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp, Hand, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { getContentPack } from "@/lib/content-packs";
import { inputUnitLabel } from "@/lib/typing-feedback";
import type { PressedKeyStore } from "@/lib/pressed-key-store";
import { bindPressedKeyAttribute, syncPressedKeyAttribute } from "@/lib/pressed-key-attribute";
import {
  FINGER_NAMES,
  liveKeyboardLayout,
  locateKeyboardCharacter,
  keyboardNeedsShift,
  isKeyboardCasePair,
  oppositeShift,
  type KeyboardInputState,
  type LiveKey,
  type LiveKeyboardAttempt,
} from "@/lib/live-keyboard";
import "./live-keyboard.css";

// Server markup keeps the same held-key attributes without layout-effect warnings.
const useKeycapLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface LiveKeyboardProps {
  layout: string;
  language: string;
  input: KeyboardInputState;
  /** Optional input-local physical subscription; static callers keep input's
   * complete held-key API and identical server-rendered markup. */
  pressedStore?: PressedKeyStore;
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
  sessionControls?: ReactNode;
}

interface KeycapProps {
  code: string;
  base?: string;
  width: number;
  label: string;
  alternate?: string;
  wide: boolean;
  shifted: boolean;
  home?: boolean;
  finger?: string;
  expected: boolean;
  pressed: boolean;
  pressedStore?: PressedKeyStore;
  lastInput: boolean;
  incorrect: boolean;
  locked: boolean;
  mastered: boolean;
  shiftGuide: boolean;
  toggled: boolean;
  adaptive: boolean;
}

/** Primitive props let unchanged keycaps skip reconciliation on both physical
 * key transitions and canonical input updates. Shift still updates its labels. */
const Keycap = memo(function Keycap(props: KeycapProps) {
  const { pressedStore, code, pressed: staticPressed } = props;
  const keycap = useRef<HTMLSpanElement>(null);
  const pressed = pressedStore ? pressedStore.getSnapshot(code) : staticPressed;
  useKeycapLayoutEffect(() => {
    const node = keycap.current;
    if (node && pressedStore) return bindPressedKeyAttribute(node, pressedStore, code);
  }, [pressedStore, code]);
  useKeycapLayoutEffect(() => {
    // An interrupted render may have sampled an earlier physical state. Repair
    // only this presentation attribute after every commit, before it can paint.
    if (keycap.current)
      syncPressedKeyAttribute(keycap.current, pressedStore ? pressedStore.getSnapshot(code) : staticPressed);
  });
  return (
    <span
      ref={keycap}
      className={cn(
        "live-key",
        props.adaptive && "learn-key",
        props.incorrect && props.adaptive && "learn-key-incorrect",
      )}
      data-key-code={props.code}
      data-key={props.base}
      data-expected-key={props.expected || undefined}
      data-pressed-key={pressed || undefined}
      data-last-input={props.lastInput || undefined}
      data-incorrect-key={props.incorrect || undefined}
      data-locked={props.locked || undefined}
      data-mastered={props.mastered || undefined}
      data-home-key={props.home || undefined}
      data-shift-guide={props.shiftGuide || undefined}
      data-toggled={props.toggled || undefined}
      data-finger={props.finger}
      style={{ "--key-units": props.width } as CSSProperties}
    >
      <span className={cn("live-key-label", props.wide && "live-key-label-wide")}>
        {props.alternate && (
          <span className="live-key-alternate" data-selected={props.shifted || undefined}>
            {props.alternate}
          </span>
        )}
        <span data-selected={!props.shifted || undefined}>{props.label}</span>
      </span>
      {props.home && <i className="live-key-home" />}
      {props.mastered && <i className="live-key-mastered" />}
    </span>
  );
});

interface KeyboardRowProps {
  row: readonly LiveKey[];
  packId: string;
  known: ReadonlySet<string> | null;
  mastered: ReadonlySet<string>;
  expectedCode?: string;
  actualCode?: string;
  incorrect: boolean;
  shiftGuideCode?: string;
  typingModifier: boolean;
  capsLock: boolean;
  pressedMask: number;
  pressedStore?: PressedKeyStore;
  fingerGuide: boolean;
  adaptive: boolean;
}

/** Expected/actual signals are local to this row. Ordinary canonical input
 * therefore leaves the other rows' model mapping and key prop comparisons alone. */
const KeyboardRow = memo(function KeyboardRow({
  row, packId, known, mastered, expectedCode, actualCode, incorrect,
  shiftGuideCode, typingModifier, capsLock, pressedMask, pressedStore,
  fingerGuide, adaptive,
}: KeyboardRowProps) {
  return (
    <div className={cn("live-keyboard-row", adaptive && "learn-keyboard-row")}>
      {row.map((key, index) => {
        const actualKey = actualCode === key.code;
        const isKnown = !known || key.base === " " || !key.base ||
          known.has(key.base.toLocaleLowerCase(packId));
        const isMastered = !!key.base && mastered.has(key.base.toLocaleLowerCase(packId));
        const shifted = typingModifier && !!key.shifted;
        const label = isKeyboardCasePair(key) && typingModifier !== capsLock
          ? key.base!.toLocaleUpperCase(packId) : key.label;
        return (
          <Keycap
            key={key.code}
            code={key.code}
            base={key.base}
            width={key.width}
            label={label}
            alternate={key.shifted && key.base && key.shifted !== key.base.toLocaleUpperCase(packId) ? key.shifted : undefined}
            wide={key.label.length > 1}
            shifted={shifted}
            home={key.home}
            finger={fingerGuide ? key.finger : undefined}
            expected={expectedCode === key.code}
            pressed={(pressedMask & (1 << index)) !== 0}
            pressedStore={pressedStore}
            lastInput={actualKey}
            incorrect={actualKey && incorrect}
            locked={!isKnown}
            mastered={isMastered}
            shiftGuide={shiftGuideCode === key.code}
            toggled={key.code === "CapsLock" && capsLock}
            adaptive={adaptive}
          />
        );
      })}
    </div>
  );
});

const NativeKeycap = memo(function NativeKeycap({
  character, expected, incorrect, locked,
}: { character: string; expected: boolean; incorrect: boolean; locked: boolean }) {
  return (
    <span
      className="live-character"
      data-key={character}
      data-expected-key={expected || undefined}
      data-incorrect-key={incorrect || undefined}
      data-locked={locked || undefined}
    >
      {character === " " ? "space" : character}
    </span>
  );
});

export const LiveKeyboard = memo(function LiveKeyboard({
  layout,
  language,
  input,
  pressedStore,
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
  sessionControls,
}: LiveKeyboardProps) {
  const id = useId();
  const mapping = useMemo(
    () => liveKeyboardLayout(layout, language),
    [layout, language],
  );
  const rowForCode = useMemo(() => {
    const rows = new Map<string, number>();
    mapping.rows.forEach((row, index) => row.forEach((key) => rows.set(key.code, index)));
    return rows;
  }, [mapping]);
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
  const expectedRow = rowForCode.get(expected?.key.code ?? "");
  const actualRow = rowForCode.get(actual?.key.code ?? "");
  const shiftGuideRow = rowForCode.get(shift ?? "");
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
        {sessionControls && (
          <div className="live-keyboard-session-controls">
            {sessionControls}
          </div>
        )}
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
                  <KeyboardRow
                    key={rowIndex}
                    row={row}
                    packId={pack.id}
                    known={known}
                    mastered={mastered}
                    expectedCode={expectedRow === rowIndex ? expected?.key.code : undefined}
                    actualCode={actualRow === rowIndex ? actual?.key.code : undefined}
                    incorrect={actualRow === rowIndex && lastAttempt?.correct === false}
                    shiftGuideCode={shiftGuideRow === rowIndex ? shift ?? undefined : undefined}
                    typingModifier={typingModifier}
                    capsLock={input.capsLock === true}
                    // Physical ANSI rows contain at most14 keys. Static callers
                    // retain local held chords; observed stores update leaves.
                    pressedMask={pressedStore ? 0 : row.reduce((mask, key, index) =>
                      input.pressedCodes.includes(key.code) ? mask | (1 << index) : mask, 0)}
                    pressedStore={pressedStore}
                    fingerGuide={fingerGuide}
                    adaptive={adaptive}
                  />
                ))
              ) : (
                <div
                  className="live-keyboard-native"
                  dir={pack.direction}
                  lang={pack.id}
                >
                  {mapping.characters.map((character) => (
                    <NativeKeycap
                      key={character}
                      character={character}
                      expected={character === expectedCharacter}
                      incorrect={lastAttempt?.typed === character && !lastAttempt.correct}
                      locked={!!known && character !== " " && !known.has(character.toLocaleLowerCase(pack.id))}
                    />
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
