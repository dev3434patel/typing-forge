import { describe, expect, it } from 'vitest';
import { CONTENT_PACKS, generatePackText, getContentPack, getLayout, graphemes, LAYOUTS, seededRandom } from '../content-packs';

describe('Original content pack inventory and segmentation', () => {
  it('contains every required language pack with a unique identity', () => {
    expect(CONTENT_PACKS.map(pack => pack.id)).toEqual(['en', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'hi', 'ar', 'gu-Latn']);
  });
  for (const pack of CONTENT_PACKS) it(`${pack.id} has normalized, unique words and complete logical alphabet/order`, () => {
    expect(pack.words.length).toBeGreaterThan(50);
    expect(new Set(pack.words).size).toBe(pack.words.length);
    expect(pack.words.every(word => word === word.normalize('NFC') && !/\s/u.test(word))).toBe(true);
    expect(new Set(pack.introductionOrder)).toEqual(new Set(pack.alphabet));
    expect(pack.introductionOrder.length).toBeGreaterThanOrEqual(6);
    expect(pack.provenance.license).toBe('CC0-1.0');
    expect(generatePackText(pack.id, 20, 'fixed')).toBe(generatePackText(pack.id, 20, 'fixed'));
    expect(generatePackText(pack.id, 20, 'fixed').split(' ').every(word => pack.words.includes(word))).toBe(true);
  });
  it('maps region aliases and keeps Gujarati transliteration honest', () => {
    expect(getContentPack('en-US').id).toBe('en');
    expect(getContentPack('gu').id).toBe('gu-Latn');
    expect(getContentPack('gu-Latn').script).toBe('Latin');
    expect(getContentPack('gu-Latn').label).toContain('transliteration');
    expect(getContentPack('unknown').id).toBe('en');
  });
  it('identifies Arabic RTL and does not claim native mappings for non-Latin scripts', () => {
    expect(getContentPack('ar').direction).toBe('rtl');
    for (const language of ['ar', 'hi', 'ru']) expect(getContentPack(language).defaultLayout).toBe('native');
  });
  it('segments NFC accents, Hindi clusters, Arabic, and family emoji as logical graphemes', () => {
    expect(graphemes('e\u0301')).toEqual(['é']);
    expect(graphemes('कि', 'hi')).toEqual(['कि']);
    expect(graphemes('سلام', 'ar')).toEqual(['س', 'ل', 'ا', 'م']);
    expect(graphemes('👨‍👩‍👧‍👦')).toHaveLength(1);
  });
  it('exposes the six distinct layout views and an honest unmapped state', () => {
    expect(Object.keys(LAYOUTS)).toEqual(['qwerty', 'dvorak', 'colemak', 'colemak-dh', 'azerty', 'qwertz', 'native']);
    expect(LAYOUTS.qwerty.rows[0].join('')).toBe('qwertyuiop');
    expect(LAYOUTS['colemak-dh'].rows[1].join('')).toBe('arstgmneio');
    expect(getLayout('unknown').rows).toEqual([]);
    expect(getLayout('DVORAK')).toBe(LAYOUTS.dvorak);
  });
  it('uses seeded selection with no ambient random dependency', () => {
    const a = seededRandom('a'), b = seededRandom('a'), c = seededRandom('b');
    expect(Array.from({ length: 10 }, a)).toEqual(Array.from({ length: 10 }, b));
    expect(c()).toBeGreaterThanOrEqual(0); expect(c()).toBeLessThan(1);
  });
});
