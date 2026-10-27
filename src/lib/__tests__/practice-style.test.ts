import { describe, expect, it } from 'vitest';
import { THEMES } from '../themes';
import { parseLocalTheme, validateWoff2 } from '../practice-style';
describe('local semantic theme imports', () => {
  it.each(THEMES)('roundtrips curated $id with required contrast checks', theme => {
    expect(parseLocalTheme(JSON.stringify(theme))).toMatchObject({ name: theme.name, light: theme.light, id: 'local-custom' });
  });
  it.each(['url(https://example.org/x)', 'red', '#fff', 'var(--x)', '</style>', 'rgba(0,0,0,1)'])('rejects executable or unbounded CSS value %s', color => {
    const theme = structuredClone(THEMES[0]); theme.colors.accent = color;
    expect(() => parseLocalTheme(JSON.stringify(theme))).toThrow();
  });
  it('rejects low contrast without rewriting the user color', () => {
    const theme = structuredClone(THEMES[0]); theme.colors.text = theme.colors.surface;
    expect(() => parseLocalTheme(JSON.stringify(theme))).toThrow('contrast');
  });
  it('bounds the imported document', () => expect(() => parseLocalTheme(' '.repeat(12001))).toThrow());
});
describe('bounded native WOFF2 parsing input', () => {
  const header = () => { const bytes = new ArrayBuffer(64); const v = new DataView(bytes); v.setUint32(0, 0x774f4632); v.setUint32(8, 64); v.setUint16(12, 1); v.setUint32(16, 128); v.setUint32(20, 16); return bytes; };
  it('accepts only structural limits, leaving actual decoding to FontFace', () => expect(() => validateWoff2(header())).not.toThrow());
  it.each([0, 20, 47, 204801])('rejects resource size %d', size => expect(() => validateWoff2(new ArrayBuffer(size))).toThrow());
  it.each([[0, 0], [8, 63], [16, 20_000_000], [20, 100]])('rejects invalid header field %s', (offset, value) => { const bytes = header(); new DataView(bytes).setUint32(offset, value); expect(() => validateWoff2(bytes)).toThrow(); });
});
