import { graphemes } from '@/lib/typing-core/transcript';
import { liveKeyboardLayout, locateKeyboardCharacter } from '@/lib/live-keyboard';

export type ErrorKind = 'transposition' | 'omission' | 'substitution' | 'extra' | 'finger-slip';
export interface ClassifiedError { kind: ErrorKind; expected: string; typed: string; expectedIndex: number; typedIndex: number }
/** Neighboring physical reference keys: a possible slip, not measured finger use. */
export function neighboringKeys(expected: string, typed: string, layout = 'qwerty'): boolean {
  const reference = liveKeyboardLayout(layout, 'en');
  const a = locateKeyboardCharacter(reference, expected)?.key, b = locateKeyboardCharacter(reference, typed)?.key;
  if (!a || !b || a.code === b.code) return false;
  return reference.rows.some(row => row.some((key, index) => key.code === a.code && (row[index - 1]?.code === b.code || row[index + 1]?.code === b.code)));
}
/** Original optimal-string-alignment classifier. Equal-cost ties: transpose,
 * substitute, omit, extra. It describes edits; it never alters scoring. */
export function classifyTypingErrors(expectedText: string, typedText: string, layout = 'qwerty') {
  const originalA = graphemes(expectedText), originalB = graphemes(typedText);
  const a = originalA.slice(0, 256), b = originalB.slice(0, 256);
  const cost = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = 0; i <= a.length; i++) cost[i][0] = i;
  for (let j = 0; j <= b.length; j++) cost[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    cost[i][j] = Math.min(cost[i - 1][j] + 1, cost[i][j - 1] + 1, cost[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cost[i][j] = Math.min(cost[i][j], cost[i - 2][j - 2] + 1);
  }
  const errors: ClassifiedError[] = [];
  let i = a.length, j = b.length;
  while (i || j) {
    if (i && j && a[i - 1] === b[j - 1] && cost[i][j] === cost[i - 1][j - 1]) { i--; j--; continue; }
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && cost[i][j] === cost[i - 2][j - 2] + 1) {
      errors.push({ kind: 'transposition', expected: a.slice(i - 2, i).join(''), typed: b.slice(j - 2, j).join(''), expectedIndex: i - 2, typedIndex: j - 2 }); i -= 2; j -= 2;
    } else if (i && j && cost[i][j] === cost[i - 1][j - 1] + 1) {
      errors.push({ kind: neighboringKeys(a[i - 1], b[j - 1], layout) ? 'finger-slip' : 'substitution', expected: a[i - 1], typed: b[j - 1], expectedIndex: i - 1, typedIndex: j - 1 }); i--; j--;
    } else if (i && cost[i][j] === cost[i - 1][j] + 1) {
      errors.push({ kind: 'omission', expected: a[i - 1], typed: '', expectedIndex: i - 1, typedIndex: j }); i--;
    } else { errors.push({ kind: 'extra', expected: '', typed: b[j - 1], expectedIndex: i, typedIndex: j - 1 }); j--; }
  }
  return { version: 'typing-edit-diagnostics-v1' as const, errors: errors.reverse(), distance: cost[a.length][b.length], truncated: originalA.length > 256 || originalB.length > 256 };
}
