import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/contexts/PreferencesContext';
import { THEMES } from '@/lib/themes';
import { parseLocalTheme } from '@/lib/practice-style';
import { readPracticeStyle, savePracticeStyle, importPracticeFont, clearPracticeStyle, invalidatePracticeStyle } from '@/services/practice-style';
import { setUiLocale, useTranslation, type UiLocale } from '@/i18n';
import './studio.css';

export default function Studio() {
  const owner = useAuth().user?.id ?? 'guest';
  const { preferences, updatePreferences } = usePreferences();
  const { locale, t } = useTranslation();
  const [choice, setChoice] = useState(() => readPracticeStyle(owner));
  const [json, setJson] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const refresh = () => setChoice(readPracticeStyle(owner));
    const storage = (event: StorageEvent) => { if (event.key === `sparowtype.practice-style.v1:${encodeURIComponent(owner)}` || event.key === null) { invalidatePracticeStyle(owner); refresh(); } };
    window.addEventListener('sparowtype:practice-style', refresh); window.addEventListener('storage', storage);
    return () => { window.removeEventListener('sparowtype:practice-style', refresh); window.removeEventListener('storage', storage); };
  }, [owner]);
  const save = (patch: Parameters<typeof savePracticeStyle>[1]) => {
    const persisted = savePracticeStyle(owner, patch);
    setChoice(readPracticeStyle(owner)); setNotice(t(persisted ? 'saved' : 'memory'));
  };
  const exportTheme = () => {
    const theme = choice.theme || THEMES.find(item => item.id === preferences.theme) || THEMES[0];
    const url = URL.createObjectURL(new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'sparowtype-theme.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="forge-shell"><Header /><main id="main-content" className="forge-main studio-main">
    <p className="eyebrow">SparowType</p><h1 className="mt-3 text-3xl font-semibold">{t('studio')}</h1>
    <p className="mt-3 max-w-2xl text-muted-foreground">{t('studioIntro')}</p>
    <div role="status" aria-live="polite" className="mt-4 min-h-6 text-sm">{notice}</div>
    <section className="studio-card" aria-labelledby="studio-language"><h2 id="studio-language">{t('language')}</h2>
      <select className="forge-input max-w-sm" value={locale} aria-label={t('language')} onChange={event => setUiLocale(event.target.value as UiLocale)}>
        <option value="en">English</option><option value="hi">हिन्दी</option><option value="ar-XB">RTL pseudo-locale · testing</option>
      </select><p className="text-sm text-muted-foreground">Navigation and this studio support English and Hindi. Practice passage language is a separate setting. Other existing pages currently use English.</p>
    </section>
    <section className="studio-card" aria-labelledby="studio-themes"><h2 id="studio-themes">{t('themes')}</h2>
      <p className="text-sm text-muted-foreground">{t('count', { count: THEMES.length })}</p>
      <div className="studio-themes">{THEMES.map(theme => <button type="button" key={theme.id} aria-pressed={!choice.theme && preferences.theme === theme.id}
        style={{ background: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.borderStrong }} onClick={() => { save({ theme: undefined }); updatePreferences({ theme: theme.id }); }}>
        <span style={{ color: theme.colors.accent }} aria-hidden="true">Aa</span><span>{theme.name}</span></button>)}</div>
      <label htmlFor="theme-json">{t('localTheme')}</label>
      <textarea id="theme-json" className="forge-input font-mono" rows={5} maxLength={12000} value={json} onChange={event => setJson(event.target.value)} spellCheck={false} />
      <p className="text-sm text-muted-foreground">Import/export stays local. Only semantic hexadecimal colors are accepted; contrast must pass before applying.</p>
      <div className="flex flex-wrap gap-2"><button className="forge-button" onClick={() => { try { save({ theme: parseLocalTheme(json) }); } catch (error) { setNotice(error instanceof Error ? error.message : 'Theme could not be read.'); } }}>{t('importTheme')}</button>
        <button className="forge-button-secondary" onClick={exportTheme}>{t('exportTheme')}</button></div>
    </section>
    <section className="studio-card" aria-labelledby="studio-font"><h2 id="studio-font">{t('font')}</h2><p id="font-help" className="text-sm text-muted-foreground">{t('fontHelp')}</p>
      <input className="forge-input" type="file" accept=".woff2,font/woff2" aria-label={t('font')} aria-describedby="font-help" disabled={busy} onChange={async event => {
        const file = event.target.files?.[0]; if (!file) return; setBusy(true);
        try { const persisted = await importPracticeFont(owner, file); setChoice(readPracticeStyle(owner)); setNotice(t(persisted ? 'saved' : 'memory')); }
        catch (error) { setNotice(error instanceof Error ? error.message : 'The browser could not load this font.'); }
        finally { setBusy(false); event.target.value = ''; }
      }} />
      <p className="typing-text rounded-lg border p-5" style={{ '--typing-size': '24px' } as React.CSSProperties}>{t('preview')}</p>
      <button className="forge-button-secondary w-fit" disabled={!choice.font} onClick={() => save({ font: undefined })}>{t('removeFont')}</button>
    </section>
    <section className="studio-card" aria-labelledby="studio-keycaps"><h2 id="studio-keycaps">{t('keycaps')}</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('keycaps')}>{(['classic', 'flat', 'outline'] as const).map(value => <button key={value} className="forge-chip" aria-pressed={(choice.keycaps || 'classic') === value} onClick={() => save({ keycaps: value })}>{t(value)}</button>)}</div>
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={choice.ripple === true} onChange={event => save({ ripple: event.target.checked })} />{t('ripple')}</label>
      <p className="text-sm text-muted-foreground">Feedback lasts 240 ms. Reduced-motion and focus preferences take priority. Keyboard appearance never changes measured input.</p>
    </section>
    <button className="forge-button-secondary" onClick={() => { try { clearPracticeStyle(owner); setNotice(t('saved')); } catch (error) { setNotice(error instanceof Error ? error.message : 'Persistent removal could not be confirmed.'); } finally { setChoice(readPracticeStyle(owner)); } }}>{t('clear')}</button>
  </main><Footer /></div>;
}
