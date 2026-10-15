import { useEffect, useState } from 'react';
import { Keyboard, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getContentPack, getLayout } from '@/lib/content-packs';

interface KeyboardVisualizerProps {
  currentKey?: string;
  errorKeys?: Set<string>;
  /** Observed latency speed ratios only. Missing entries have no measurement. */
  keyConfidence?: Map<string, number>;
  layout?: string;
  language?: string;
}
export function KeyboardVisualizer({ currentKey, errorKeys = new Set(), keyConfidence, layout = 'qwerty', language = 'en' }: KeyboardVisualizerProps) {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const pack = getContentPack(language);
  const mapping = getLayout(pack.script === 'Latin' ? layout : 'native');
  useEffect(() => {
    if (!currentKey) return;
    setPressedKey(currentKey.toLocaleLowerCase());
    const timer = window.setTimeout(() => setPressedKey(null), 160);
    return () => window.clearTimeout(timer);
  }, [currentKey]);
  return <section className="mx-auto mt-7 w-full max-w-4xl" aria-label="Keyboard visualization">
    <div className="mb-4 flex items-center justify-center gap-3"><label htmlFor="keyboard-visibility" className="flex items-center gap-2 text-sm text-muted-foreground">{showKeyboard ? <Keyboard className="size-4" /> : <EyeOff className="size-4" />}Keyboard view</label><Switch id="keyboard-visibility" checked={showKeyboard} onCheckedChange={setShowKeyboard} /></div>
    {showKeyboard && <div className="rounded-xl border border-border bg-card p-4 sm:p-6"><p className="mb-4 text-center text-xs text-muted-foreground">{mapping.label} · logical characters</p>{mapping.rows.length > 0 ? <div className="space-y-1.5 overflow-x-auto"><div className="mx-auto min-w-max space-y-1.5">{mapping.rows.map((row, index) => <div key={index} className="flex justify-center gap-1.5">{row.map(key => {
      const value = keyConfidence?.get(key);
      const observed = value !== undefined && Number.isFinite(value);
      const pressed = pressedKey === key;
      const incorrect = errorKeys.has(key);
      return <span key={key} title={observed ? `${key}: observed speed ratio ${value.toFixed(2)}× target` : `${key}: no observed timing`} className={cn('grid h-9 w-7 place-items-center rounded-md border font-mono text-xs transition-colors sm:h-10 sm:w-10', !observed && 'border-border text-muted-foreground', observed && value >= 1 && 'border-primary/50 bg-primary/10 text-primary', observed && value < 1 && 'border-warning/40 bg-warning/10 text-warning', pressed && 'border-primary bg-primary text-primary-foreground', incorrect && 'border-destructive bg-destructive/20 text-destructive')}>{key}</span>;
    })}</div>)}</div></div> : <p className="py-5 text-center text-sm text-muted-foreground">Your native layout has no physical-key mapping. Input is still measured as logical characters.</p>}
    <p className="mt-4 text-center text-xs text-muted-foreground">{keyConfidence?.size ? 'Color reflects observed speed against target; mastery also needs accuracy and repeated evidence.' : 'No observed timing data. Keys stay neutral until measurements are available.'}</p></div>}
  </section>;
}
