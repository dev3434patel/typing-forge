import { baseDark, type ForgeTheme } from './themes';

export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
/** JSON contains semantic colors only, never CSS/HTML/URLs or executable fields. */
export function parseLocalTheme(text: string): ForgeTheme {
  if (text.length > 12000) throw new Error('Theme JSON must be12KB or smaller.');
  const value = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 50 || typeof value.light !== 'boolean' || !value.colors || typeof value.colors !== 'object') throw new Error('Use a theme export with a name, light flag and colors object.');
  const colors = { ...baseDark };
  for (const key of Object.keys(colors) as Array<keyof typeof colors>) {
    const color = value.colors[key];
    if (key === 'border' && color === baseDark.border) { colors[key] = color; continue; }
    if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) throw new Error(`The ${key} color must be a six-digit hexadecimal value.`);
    colors[key] = color.toUpperCase();
  }
  for (const foreground of ['text', 'muted', 'secondary', 'accent', 'accent2Text', 'error', 'extra', 'success'] as const) for (const background of ['background', 'surface', 'raised', 'hover'] as const) {
    if (contrastRatio(colors[foreground], colors[background]) < 4.5) throw new Error(`${foreground} on ${background} needs at least4.5:1 text contrast.`);
  }
  if (contrastRatio(colors.accentInk, colors.accent) < 4.5 || contrastRatio(colors.error, colors.errorSurface) < 4.5 || contrastRatio(colors.borderStrong, colors.surface) < 3) throw new Error('Accent text, error text or control-border contrast is too low.');
  return { id: 'local-custom', name: value.name.trim(), light: value.light, colors };
}
/** Structural resource limits precede the browser's native font parser. No font executes as CSS. */
export function validateWoff2(bytes: ArrayBuffer): void {
  if (bytes.byteLength < 48 || bytes.byteLength > 200 * 1024) throw new Error('Choose a WOFF2 font no larger than200KB.');
  const view = new DataView(bytes);
  if (view.getUint32(0) !== 0x774f4632 || view.getUint32(8) !== bytes.byteLength || view.getUint16(12) < 1 || view.getUint16(12) > 128 || view.getUint16(14) !== 0 || view.getUint32(16) > 10 * 1024 * 1024 || view.getUint32(16) < 12 || view.getUint32(20) > bytes.byteLength - 48) throw new Error('This is not a structurally valid bounded WOFF2 font.');
}
