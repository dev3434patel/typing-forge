import { useSyncExternalStore } from 'react';
import { english, hindi, type MessageId } from './messages';
export type UiLocale = 'en' | 'hi' | 'ar-XB';
const key = 'sparowtype.ui-locale.v1';
const event = 'sparowtype:ui-locale';
let memory: UiLocale | undefined;
export const intlLocale = (locale: UiLocale) => locale === 'ar-XB' ? 'ar' : locale;
export function getUiLocale(): UiLocale {
  if (memory) return memory;
  try { const stored = localStorage.getItem(key); return stored === 'hi' || stored === 'ar-XB' ? stored : 'en'; } catch { return 'en'; }
}
export function setUiLocale(locale: UiLocale) {
  memory = locale;
  try { localStorage.setItem(key, locale); } catch { /* Locale remains available for this visit. */ }
  document.documentElement.lang = locale === 'ar-XB' ? 'ar' : locale;
  document.documentElement.dir = locale === 'ar-XB' ? 'rtl' : 'ltr';
  window.dispatchEvent(new Event(event));
}
/** Supported ICU subset: named values and a single-level cardinal plural with an other branch. */
export function formatMessage(source: string, values: Record<string, string | number> = {}, locale: UiLocale = 'en'): string {
  const language = intlLocale(locale);
  const plural = /\{(\w+),\s*plural,\s*((?:(?:=\d+|zero|one|two|few|many|other)\s*\{[^{}]*\}\s*)+)\}/g;
  const expanded = source.replace(plural, (_, name: string, branches: string) => {
    const count = values[name];
    if (typeof count !== 'number' || !Number.isFinite(count)) throw new Error(`A finite ${name} is required.`);
    const choices = Object.fromEntries([...branches.matchAll(/(=\d+|zero|one|two|few|many|other)\s*\{([^{}]*)\}/g)].map(match => [match[1], match[2]]));
    if (!choices.other) throw new Error('Plural messages require an other branch.');
    return (choices[`=${count}`] ?? choices[new Intl.PluralRules(language).select(count)] ?? choices.other).replace(/#/g, new Intl.NumberFormat(language).format(count));
  });
  return expanded.replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in values)) throw new Error(`Missing message value ${name}.`);
    return typeof values[name] === 'number' ? new Intl.NumberFormat(language).format(values[name] as number) : String(values[name]);
  });
}
export function translate(id: MessageId, locale: UiLocale, values?: Record<string, string | number>) {
  const text = formatMessage(locale === 'hi' ? hindi[id] : english[id], values, locale);
  return locale === 'ar-XB' ? `\u2067⟦ ${text} ⟧\u2069` : text;
}
const subscribe = (callback: () => void) => {
  const storage = (value: StorageEvent) => { if (value.key === key) { memory = undefined; callback(); } };
  window.addEventListener(event, callback); window.addEventListener('storage', storage);
  return () => { window.removeEventListener(event, callback); window.removeEventListener('storage', storage); };
};
export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, getUiLocale, () => 'en' as const);
  return { locale, t: (id: MessageId, values?: Record<string, string | number>) => translate(id, locale, values) };
}
