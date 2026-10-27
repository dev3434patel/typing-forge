import { describe, expect, it } from 'vitest';
import { CONTENT_PACKS, graphemes } from '../content-packs';
import { quotes } from '../quotes';
import { classicWords, generateClassicText, isSafeGeneratedWord, passageDifficulty, sanitizeCustomPassage } from '../content-policy';
describe('original content inventory QA', () => {
  it.each(CONTENT_PACKS)('$id has unique normalized bounded safe words and original attribution', pack => {
    expect(new Set(pack.words).size).toBe(pack.words.length);
    expect(pack.provenance.license).toBe('CC0-1.0');
    for (const word of pack.words) {
      expect(word).toBe(word.normalize('NFC').trim()); expect(word).not.toMatch(/\s/u);
      expect(graphemes(word).join('')).toBe(word); expect(isSafeGeneratedWord(word)).toBe(true);
    }
  });
  it('ships200 unique original classic words without claiming a frequency rank', () => {
    expect(classicWords).toHaveLength(200); expect(new Set(classicWords).size).toBe(200);
    expect(generateClassicText(120, 'seed')).toBe(generateClassicText(120, 'seed'));
    expect(generateClassicText(120, 'seed').split(' ').every(word => classicWords.includes(word))).toBe(true);
    expect(generateClassicText(120, 'seed')).not.toBe(generateClassicText(120, 'different'));
  });
  it('keeps passages original and attributed', () => {
    expect(new Set(quotes.map(quote => quote.text)).size).toBe(quotes.length);
    for (const quote of quotes) expect(quote).toMatchObject({ author: 'SparowType', license: 'CC0-1.0' });
  });
  it('normalizes custom text without interpreting HTML or destroying code', () => {
    expect(sanitizeCustomPassage(' e\u0301\r\n<T>\u0000 ').text).toBe('é\n<T>');
    expect(sanitizeCustomPassage('a\u0000b').removedControls).toBe(1);
    expect(() => sanitizeCustomPassage(' ')).toThrow(); expect(() => sanitizeCustomPassage('x'.repeat(10001))).toThrow();
  });
  it('reports named difficulty descriptors and finite empty values', () => {
    expect(passageDifficulty('quiz, box!')).toMatchObject({ words: 2, graphemes: 10 });
    for (const value of Object.values(passageDifficulty(''))) if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
  });
});
