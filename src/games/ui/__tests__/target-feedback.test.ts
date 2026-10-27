import { describe, expect, it } from 'vitest';
import { paintTargetFeedback, targetFeedback } from '../target-feedback';

describe('direct arcade target feedback', () => {
  it('distinguishes the retained correct prefix, next character and all remaining letters', () => {
    expect(targetFeedback('signal', 'sig')).toEqual({ matched: 'sig', next: 'n', remaining: 'al', matchedUnits: 3, totalUnits: 6 });
    expect(targetFeedback('signal', '')).toEqual({ matched: '', next: 's', remaining: 'ignal', matchedUnits: 0, totalUnits: 6 });
  });
  it('does not color a wrong suffix as correct and moves the next-character cue back after deletion', () => {
    expect(targetFeedback('signal', 'six').matched).toBe('si');
    expect(targetFeedback('signal', 's').next).toBe('i');
    expect(targetFeedback('signal', 'signal').next).toBe('');
  });
  it('segments composition graphemes without splitting an emoji or combining mark', () => {
    expect(targetFeedback('a\u0301👩‍💻z', 'a\u0301')).toEqual({ matched: 'a\u0301', next: '👩‍💻', remaining: 'z', matchedUnits: 1, totalUnits: 3 });
  });
  it.each([
    { label: 'signal', draft: 'si', expectedClipX: 70, expectedStart: 90, expectedEnd: 100, direction: 'ltr' },
    { label: 'שלום', draft: 'של', expectedClipX: 100, expectedStart: 90, expectedEnd: 100, direction: 'rtl' },
  ])('repaints the whole shaped$direction word in place with mirrored progress bounds', ({ label, draft, expectedClipX, expectedStart, expectedEnd, direction }) => {
    const calls: { type: string; values: unknown[] }[] = [];
    const context = {
      save() {}, restore() {}, beginPath() {}, clip() {}, stroke() {},
      rect: (...values: number[]) => calls.push({ type: 'rect', values }),
      fillText: (...values: unknown[]) => calls.push({ type: 'fillText', values }),
      moveTo: (...values: number[]) => calls.push({ type: 'moveTo', values }),
      lineTo: (...values: number[]) => calls.push({ type: 'lineTo', values }),
      measureText: (text: string) => ({ width: Array.from(text).length * 10 }),
      direction: 'inherit', fillStyle: '', strokeStyle: '', lineWidth: 0,
    };
    paintTargetFeedback(context as unknown as CanvasRenderingContext2D, label, 100, 40, targetFeedback(label, draft), '#C6FF3D', '#EDEDF2');
    expect(calls.find(call => call.type === 'rect')?.values).toEqual([expectedClipX, 22, 20, 36]);
    expect(calls.find(call => call.type === 'fillText')?.values).toEqual([label, 100, 40]);
    expect(calls.find(call => call.type === 'moveTo')?.values).toEqual([expectedStart, 51]);
    expect(calls.find(call => call.type === 'lineTo')?.values).toEqual([expectedEnd, 51]);
    expect(context.direction).toBe(direction);
  });
  it('keeps a phantom word masked when drawing typed progress', () => {
    const drawn: string[] = [];
    const context = { save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText: (text: string) => drawn.push(text), measureText: (text: string) => ({ width: text.length * 10 }), direction: 'inherit', fillStyle: '', strokeStyle: '', lineWidth: 0 };
    paintTargetFeedback(context as unknown as CanvasRenderingContext2D, 'si····', 100, 40, targetFeedback('signal', 'sign'), '#C6FF3D', '#EDEDF2');
    expect(drawn).toEqual(['si····']); expect(drawn.join('')).not.toContain('signal');
    expect(targetFeedback('signal', 'sign', 'si····')).toEqual({ matched: 'si··', next: '·', remaining: '·', matchedUnits: 4, totalUnits: 6 });
  });
});
