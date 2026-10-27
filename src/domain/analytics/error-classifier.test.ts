import { describe, expect, it } from 'vitest';
import { classifyTypingErrors, type ErrorKind } from './error-classifier';

const cases: Array<[string, string, ErrorKind]> = [
  ['ab', 'ba', 'transposition'], ['the', 'teh', 'transposition'], ['form', 'from', 'transposition'], ['🙂a', 'a🙂', 'transposition'],
  ['cat', 'ct', 'omission'], ['train', 'tran', 'omission'], ['a🙂b', 'ab', 'omission'], ['éa', 'a', 'omission'],
  ['cat', 'cart', 'extra'], ['ab', 'abb', 'extra'], ['ab', 'a🙂b', 'extra'], ['a', 'aa', 'extra'],
  ['cat', 'cot', 'substitution'], ['a', 'X', 'substitution'], ['🙂', '🚀', 'substitution'], ['a', 's', 'finger-slip'],
];
describe('original deterministic final-text diagnostics, never scoring', () => {
  for (const [prefix, suffix] of [['', ''], ['clear ', ''], ['', ' end'], ['clear ', ' end']]) {
    it.each(cases)(`classifies %s → %s as %s with context ${JSON.stringify([prefix, suffix])}`, (expected, typed, kind) => {
      const result = classifyTypingErrors(prefix + expected + suffix, prefix + typed + suffix);
      expect(result.distance).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].kind).toBe(kind);
      expect(result.truncated).toBe(false);
    });
  }
  it('breaks repeated-letter alignment ties deterministically at the earliest unmatched position', () => {
    expect(classifyTypingErrors('aaaa', 'aaa').errors).toEqual([{ kind: 'omission', expected: 'a', typed: '', expectedIndex: 0, typedIndex: 0 }]);
  });
  it('returns no diagnostic when both strings match', () => expect(classifyTypingErrors('exact words', 'exact words').errors).toEqual([]));
  it('reports rather than hides bounded long-word truncation', () => expect(classifyTypingErrors('a'.repeat(257), 'a'.repeat(257)).truncated).toBe(true));
  it('never calls a case-only mismatch an inferred finger slip', () => expect(classifyTypingErrors('a', 'A').errors[0].kind).toBe('substitution'));
  it('supports entirely empty sides', () => {
    expect(classifyTypingErrors('', 'a').errors[0].kind).toBe('extra');
    expect(classifyTypingErrors('a', '').errors[0].kind).toBe('omission');
  });
});
