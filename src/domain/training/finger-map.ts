import { FINGER_NAMES, liveKeyboardLayout, locateKeyboardCharacter, type Finger } from '@/lib/live-keyboard';

export { FINGER_NAMES, type Finger };
export const TRAINING_FINGERS = ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'thumb', 'right-index', 'right-middle', 'right-ring', 'right-pinky'] as const;

/** Reference assignment, never a claim about the finger a person actually used. */
export function fingerForCharacter(character: string, layout = 'qwerty', language = 'en'): Finger | null {
  return locateKeyboardCharacter(liveKeyboardLayout(layout, language), character)?.key.finger ?? null;
}
