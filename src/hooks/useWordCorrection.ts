import { useCallback, useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { graphemes, utf16ToGraphemeOffset, type SessionController, type SessionSnapshot } from "@/lib/typing-core";

export const WORD_CORRECTION_NOTICE = "Previous words are locked. You can correct only the current word.";
export const CORRECT_WORD_CORRECTION_NOTICE = "Correctly submitted words stay locked. Backspace can reopen only the previous incorrect word.";
export function wordCorrectionNotice(controller: SessionController) {
  return controller.configuration.correctionPolicy === "correct-words-locked" ? CORRECT_WORD_CORRECTION_NOTICE : WORD_CORRECTION_NOTICE;
}
const compositionDeletion = (inputType: string) => inputType === "deleteCompositionText" || inputType === "deleteByComposition";

interface Options {
  controller: SessionController;
  inputRef: RefObject<HTMLTextAreaElement>;
  composing: RefObject<boolean>;
  /** Lessons collect one native insertion at a time in an otherwise empty input. */
  draft?: boolean;
  deletionDisabledNotice?: string;
  onSnapshot: (snapshot: SessionSnapshot) => void;
  onNotice: (notice: string) => void;
}

/** Keep native desktop, touch, selection and cut edits inside the core's word boundary. */
export function useWordCorrection(options: Options) {
  const callbacks = useRef(options);
  callbacks.current = options;
  const { controller, inputRef } = options;
  const enabled = controller.configuration.correctionPolicy !== undefined;
  const boundary = useRef({ controller, start: -1, offset: 0 });
  const boundaryOffset = useCallback(() => {
    const start = controller.editableStart;
    if (boundary.current.controller !== controller || boundary.current.start !== start) {
      boundary.current = {
        controller,
        start,
        offset: graphemes(controller.currentText).slice(0, start).join("").length,
      };
    }
    return boundary.current.offset;
  }, [controller]);

  const constrainSelection = useCallback(() => {
    const current = callbacks.current;
    const input = inputRef.current;
    if (!enabled || current.draft || current.composing.current || !input) return;
    const floor = boundaryOffset();
    if (input.selectionStart < floor || input.selectionEnd < floor) {
      input.setSelectionRange(Math.max(floor, input.selectionStart), Math.max(floor, input.selectionEnd));
    }
  }, [enabled, inputRef, boundaryOffset]);

  const remove = useCallback((inputType: string, wholeWord: boolean) => {
    const current = callbacks.current;
    const input = inputRef.current;
    if (!input) return;
    if (current.deletionDisabledNotice) {
      current.onNotice(current.deletionDisabledNotice);
      return;
    }
    const text = controller.currentText;
    const units = graphemes(text);
    const floor = controller.editableStart;
    const start = current.draft ? units.length : Math.max(floor, utf16ToGraphemeOffset(text, input.selectionStart));
    const end = current.draft ? units.length : Math.max(start, utf16ToGraphemeOffset(text, input.selectionEnd));
    if (start === end && (inputType === "deleteByCut" || inputType === "deleteByDrag")) return;
    const forward = inputType.endsWith("Forward");
    const previous = start === end && start === floor && floor === units.length && !forward
      ? controller.previousWordCorrection : null;
    const reopens = previous !== null && !previous.correct;
    const deletionStart = reopens ? wholeWord ? previous.start : previous.separator === "submit" ? units.length : units.length - 1
      : start === end && !forward ? Math.max(floor, wholeWord ? floor : start - 1) : start;
    const deletionEnd = reopens ? units.length : start === end && forward ? Math.min(units.length, wholeWord ? units.length : end + 1) : end;
    if (deletionStart === deletionEnd && !(reopens && previous.separator === "submit")) {
      if (floor > 0) current.onNotice(wordCorrectionNotice(controller));
      constrainSelection();
      return;
    }
    const next = controller.input({ type: "delete", start: deletionStart, end: deletionEnd });
    input.value = current.draft ? "" : next.finalText;
    if (!current.draft) {
      const offset = units.slice(0, deletionStart).join("").length;
      input.setSelectionRange(offset, offset);
    }
    current.onSnapshot(next);
    current.onNotice("");
  }, [controller, inputRef, constrainSelection]);

  const ignoreEmptySpace = useCallback((text: string, canonicalEndInsertion = false) => {
    const current = callbacks.current;
    const input = inputRef.current;
    if (text !== " " || controller.configuration.correctionPolicy !== "correct-words-locked" ||
      current.composing.current || !input || controller.editableStart !== graphemes(controller.currentText).length ||
      !canonicalEndInsertion && !current.draft && (input.selectionStart !== input.selectionEnd || input.selectionEnd !== controller.currentText.length)) return false;
    const snapshot = controller.snapshot();
    // Custom passages may intentionally contain consecutive spaces.
    if (snapshot.characters[snapshot.cursor]?.expected === " ") return false;
    current.onNotice("Type the word before pressing Space.");
    return true;
  }, [controller, inputRef]);

  useEffect(() => {
    const input = inputRef.current;
    if (!enabled || !input) return;
    const beforeInput = (event: InputEvent) => {
      if (callbacks.current.composing.current || event.isComposing || compositionDeletion(event.inputType)) return;
      if (event.inputType.startsWith("delete")) {
        if (!event.cancelable) return; // The normalized edit path still enforces the prefix.
        event.preventDefault();
        remove(event.inputType, event.inputType.includes("Word") || event.inputType.includes("Line"));
      } else if (event.inputType === "insertText" && event.data === " " && event.cancelable && ignoreEmptySpace(event.data)) {
        event.preventDefault();
      } else constrainSelection();
    };
    input.addEventListener("beforeinput", beforeInput);
    return () => input.removeEventListener("beforeinput", beforeInput);
  }, [enabled, inputRef, remove, constrainSelection, ignoreEmptySpace]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!enabled || callbacks.current.composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return false;
    if (event.key === " " && !event.ctrlKey && !event.altKey && !event.metaKey && ignoreEmptySpace(" ")) {
      event.preventDefault();
      return true;
    }
    if (event.key !== "Backspace" && event.key !== "Delete") return false;
    event.preventDefault();
    remove(event.key === "Delete" ? "deleteContentForward" : "deleteContentBackward", event.ctrlKey || event.altKey || event.metaKey);
    return true;
  }, [enabled, remove, ignoreEmptySpace]);

  const handleInputDeletion = useCallback((inputType: string, isComposing = false) => {
    if (!enabled || !inputType.startsWith("delete") || callbacks.current.composing.current || isComposing || compositionDeletion(inputType)) return false;
    remove(inputType, inputType.includes("Word") || inputType.includes("Line"));
    return true;
  }, [enabled, remove]);

  return { constrainSelection, handleKeyDown, handleInputDeletion, ignoreEmptySpace };
}
