import { describe, expect, it } from 'vitest';
import { renderShareCard, SHARE_CARD_SIZE, type ShareCardContext } from './share-card';

describe('privacy-preserving1200x630 share paint', () => {
  it('paints only the wordmark, declared statistics and fixed labels at stable positions', () => {
    const texts: Array<[string, number, number]> = [], rectangles: number[][] = [];
    const context = { fillStyle: '', font: '', fillRect: (...args: number[]) => rectangles.push(args), beginPath() {}, roundRect() {}, fill() {}, fillText: (text: string, x: number, y: number) => texts.push([text, x, y]), measureText: () => ({ width: 20 }) } as unknown as ShareCardContext;
    renderShareCard(context, { version: 'private-share-v1', label: 'Personal practice · local evidence', mode: 'time', metrics: { wpm: 45.3, inputAccuracy: 98.25, durationSeconds: 30 } }, (_, fallback) => fallback);
    expect(SHARE_CARD_SIZE).toEqual({ width: 1200, height: 630 });
    expect(rectangles).toEqual([[0, 0, 1200, 630], [70, 475, 1060, 1]]);
    expect(texts.slice(0, 10).map(item => item[0]).join('')).toBe('SparowType');
    expect(texts.slice(10)).toEqual([
      ['time · 30.0s · personal practice', 70, 150], ['45', 65, 340], ['words per minute', 75, 390],
      ['98.3%', 700, 300], ['input accuracy', 705, 355], ['Personal practice · no private text included', 70, 530],
    ]);
  });
  it('renders inapplicable metrics as dashes rather than fabricated zeros', () => {
    const texts: string[] = [];
    const context = { fillStyle: '', font: '', fillRect() {}, beginPath() {}, roundRect() {}, fill() {}, fillText: (text: string) => texts.push(text), measureText: () => ({ width: 20 }) } as unknown as ShareCardContext;
    renderShareCard(context, { version: 'private-share-v1', label: 'Personal practice · local evidence', mode: 'zen', metrics: { wpm: null, inputAccuracy: null, durationSeconds: 1 } }, (_, fallback) => fallback);
    expect(texts).toContain('—'); expect(texts).toContain('—%');
  });
});
