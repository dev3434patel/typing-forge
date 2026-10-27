import { applyTheme, applyThemeDefinition, type ForgeTheme } from '@/lib/themes';
import { parseLocalTheme, validateWoff2 } from '@/lib/practice-style';

export const STYLE_EVENT = 'sparowtype:practice-style';
const keyFor = (owner: string) => `sparowtype.practice-style.v1:${encodeURIComponent(owner)}`;
interface StoredStyle { schemaVersion: 1; theme?: ForgeTheme; font?: string; keycaps?: 'classic' | 'flat' | 'outline'; ripple?: boolean }
const memory = new Map<string, StoredStyle>();
const memoryOnly = new Set<string>();
const resetRevision = new Map<string, number>();
let activeFont: FontFace | undefined;
let generation = 0;
export function readPracticeStyle(owner: string): StoredStyle {
  if (memoryOnly.has(owner) && memory.has(owner)) return memory.get(owner)!;
  try {
    const value = JSON.parse(localStorage.getItem(keyFor(owner)) || 'null');
    if (value?.schemaVersion !== 1) return { schemaVersion: 1 };
    const clean: StoredStyle = { schemaVersion: 1 };
    if (value.theme) clean.theme = parseLocalTheme(JSON.stringify(value.theme));
    if (typeof value.font === 'string' && value.font.length < 280000 && /^[A-Za-z0-9+/=]+$/.test(value.font)) clean.font = value.font;
    if (['classic', 'flat', 'outline'].includes(value.keycaps)) clean.keycaps = value.keycaps;
    clean.ripple = value.ripple === true;
    return clean;
  } catch { return { schemaVersion: 1 }; }
}
export function savePracticeStyle(owner: string, patch: Partial<StoredStyle>): boolean {
  const next = { ...readPracticeStyle(owner), ...patch, schemaVersion: 1 as const };
  memory.set(owner, next);
  let persisted = true;
  try { localStorage.setItem(keyFor(owner), JSON.stringify(next)); } catch { persisted = false; }
  if (persisted) memoryOnly.delete(owner); else memoryOnly.add(owner);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(STYLE_EVENT));
  return persisted;
}
export function clearPracticeStyle(owner: string): void {
  resetRevision.set(owner, (resetRevision.get(owner) ?? 0) + 1);
  generation++;
  memory.set(owner, { schemaVersion: 1 });
  memoryOnly.add(owner);
  let failure = false;
  try { localStorage.removeItem(keyFor(owner)); memoryOnly.delete(owner); } catch { failure = true; }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(STYLE_EVENT));
  if (failure) throw new Error('Studio choices were cleared for this visit. Persistent removal could not be confirmed because browser storage is blocked. Retry after enabling storage.');
}
export function invalidatePracticeStyle(owner: string): void { memory.delete(owner); memoryOnly.delete(owner); resetRevision.set(owner, (resetRevision.get(owner) ?? 0) + 1); generation++; }
export async function importPracticeFont(owner: string, file: File): Promise<boolean> {
  const revision = resetRevision.get(owner) ?? 0;
  if (!file.name.toLowerCase().endsWith('.woff2')) throw new Error('Only local WOFF2 fonts are supported.');
  const bytes = await file.arrayBuffer();
  validateWoff2(bytes);
  const font = new FontFace('SparowLocalPractice', bytes);
  await font.load();
  if (revision !== (resetRevision.get(owner) ?? 0)) throw new Error('Font import canceled because this workspace was reset.');
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return savePracticeStyle(owner, { font: btoa(binary) });
}
export async function applyPracticeStyle(owner: string, baseTheme: string, signal?: AbortSignal): Promise<void> {
  const token = ++generation;
  if (activeFont) { document.fonts.delete(activeFont); activeFont = undefined; }
  document.documentElement.style.removeProperty('--practice-font');
  const style = readPracticeStyle(owner);
  applyTheme(baseTheme);
  if (style.theme) applyThemeDefinition(style.theme);
  document.documentElement.dataset.keycaps = style.keycaps || 'classic';
  document.documentElement.dataset.keyRipple = String(style.ripple === true);
  if (!style.font) return;
  try {
    const bytes = Uint8Array.from(atob(style.font), char => char.charCodeAt(0)).buffer;
    validateWoff2(bytes);
    const font = await new FontFace('SparowLocalPractice', bytes).load();
    if (token !== generation || signal?.aborted) return;
    document.fonts.add(font); activeFont = font;
    document.documentElement.style.setProperty('--practice-font', 'SparowLocalPractice');
  } catch { /* Malformed imported fonts retain the self-hosted default; export remains available. */ }
}
