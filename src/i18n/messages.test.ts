import { describe, expect, it } from 'vitest';
import { english, hindi } from './messages';
import { formatMessage, translate } from './index';
describe('English / Hindi / RTL message scaffold', () => {
  it('extracts the same complete message keys in both shipped dictionaries', () => expect(Object.keys(hindi).sort()).toEqual(Object.keys(english).sort()));
  it.each(['en', 'hi', 'ar-XB'] as const)('formats plurals and values using Intl in %s', locale => {
    expect(translate('count', locale, { count: 21 })).not.toContain('{count');
    expect(formatMessage('Hello {name}', { name: '<script>' }, locale)).toBe('Hello <script>'); // Rendered as React text, never HTML.
  });
  it('supports explicit plural numbers before language categories', () => expect(formatMessage('{n, plural, =0 {none} one {# item} other {# items}}', { n: 0 })).toBe('none'));
  it('uses the one and other branches correctly', () => {
    expect(formatMessage('{n, plural, one {# item} other {# items}}', { n: 1 })).toBe('1 item');
    expect(formatMessage('{n, plural, one {# item} other {# items}}', { n: 2 })).toBe('2 items');
  });
  it('does not silently invent missing or nonfinite variables', () => {
    expect(() => formatMessage('{name}')).toThrow();
    expect(() => translate('count', 'en', { count: NaN })).toThrow();
  });
  it('provides a marked RTL pseudo-locale without claiming an Arabic translation', () => expect(translate('test', 'ar-XB')).toContain('⟦ Test ⟧'));
});
