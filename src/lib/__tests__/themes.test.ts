import { describe, it, expect } from 'vitest';
import { THEMES, baseDark, hexToHsl, resolveThemeId } from '../themes';
function luminance(hex: string) { return hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0); }
function contrast(a: string, b: string) { const first = luminance(a), second = luminance(b); return (Math.max(first, second) + .05) / (Math.min(first, second) + .05); }
describe('semantic theme contrast', () => { for (const theme of THEMES) it(`${theme.name} supports readable text and distinct controls`, () => { const c = theme.colors; for (const [foreground, background] of [[c.text, c.surface], [c.muted, c.surface], [c.secondary, c.surface], [c.muted, c.background], [c.accent, c.background], [c.accentInk, c.accent], [c.error, c.errorSurface], [c.correct, c.background]]) expect(contrast(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5); expect(contrast(c.borderStrong, c.surface)).toBeGreaterThanOrEqual(3); }); });

describe('semantic text across interactive surfaces', () => {
  for (const theme of THEMES) {
    it(`${theme.name} keeps small text readable on page, card, raised and hover surfaces`, () => {
      const c = theme.colors;
      for (const foreground of [c.text, c.muted, c.secondary, c.accent, c.accent2Text, c.error, c.extra, c.success]) {
        for (const background of [c.background, c.surface, c.raised, c.hover]) {
          expect(contrast(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
});

describe('Sparow theme compatibility', () => {
  it('uses the lime identity and preserves all alternate palettes', () => {
    expect(THEMES.slice(0, 2).map(theme => theme.id)).toEqual(['sparow-dark', 'sparow-light']);
    expect(THEMES[0].colors.accent.toLowerCase()).toBe('#c6ff3d');
    expect(THEMES.slice(2).map(theme => theme.id)).toEqual(['graphite', 'midnight-blue', 'ember', 'mono-ink', 'paper', 'aurora']);
    for (const theme of THEMES) expect(contrast(theme.colors.accent, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
  });
  it('retains the requested dark palette and transparent border alpha', () => {
    expect(baseDark).toMatchObject({background:'#07070A',surface:'#0E0E14',raised:'#151520',text:'#EDEDF2',muted:'#8B8BA0',accent:'#C6FF3D',accent2:'#7B61FF',error:'#FF4D6D',success:'#3DFFA2',border:'rgba(255, 255, 255, 0.08)'});
    expect(hexToHsl(baseDark.border)).toBe('0.00 0.00% 100.00% / 0.08');
  });
  for (const [legacy, canonical] of [['forge-dark', 'sparow-dark'], ['forge-light', 'sparow-light']]) {
    it(`resolves the existing ${legacy} choice as ${canonical}`, () => {
      expect(resolveThemeId(legacy)).toBe(canonical);
      expect(resolveThemeId(canonical)).toBe(canonical);
    });
  }
  it('preserves alternate choices and falls back safely for unknown stored themes', () => {
    expect(resolveThemeId('paper')).toBe('paper');
    expect(resolveThemeId('unknown-theme')).toBeUndefined();
  });
});
