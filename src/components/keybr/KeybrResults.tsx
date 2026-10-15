import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
const SessionResults = lazy(() => import('@/components/typing/SessionResults').then(module => ({ default: module.SessionResults })));
import type { SaveStatus } from '@/hooks/useTestResults';
import type { SessionResult } from '@/lib/typing-core';
import type { CharacterConfidence } from '@/lib/keybr-engine';

interface KeybrResultsProps {
  result: SessionResult;
  newlyUnlocked: string[];
  progress: CharacterConfidence[];
  perCharMetrics: Map<string, CharacterConfidence>;
  onRestart: () => void;
  onRetry: () => void;
  sourceResultId?: string;
  retestTo?: string;
  saveStatus?: SaveStatus;
  onRetrySave?: () => void;
}
export function KeybrResults({ result, newlyUnlocked, progress, perCharMetrics, onRestart, onRetry, sourceResultId, retestTo, saveStatus, onRetrySave }: KeybrResultsProps) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { root.current?.focus(); }, [result.clientSessionId]);
  const observed = [...perCharMetrics.values()].sort((a, b) => a.accuracy - b.accuracy || a.confidence - b.confidence);
  return <div ref={root} tabIndex={-1} onKeyDown={event => { if (event.key === 'Enter' && event.target === event.currentTarget) { event.preventDefault(); onRestart(); } }} className="space-y-6 outline-none" aria-label="Learning results">
    {newlyUnlocked.length > 0 && <div role="status" className="flex items-center gap-4 rounded-xl border border-success/40 bg-success/10 p-5"><Sparkles className="size-6 shrink-0 text-success" /><div><h3 className="font-semibold text-success">New key introduced: <span className="font-mono">{newlyUnlocked.join(', ')}</span></h3><p className="mt-1 text-sm text-muted-foreground">All previous keys met initial mastery. This key is now available in your next lesson.</p></div></div>}
    <Suspense fallback={<p className="py-10 text-sm text-muted-foreground" role="status">Preparing your recorded results…</p>}><SessionResults result={result} onRestart={onRestart} onRepeat={onRetry} saveStatus={saveStatus} onRetrySave={onRetrySave} /></Suspense>
    <section className="overflow-hidden rounded-2xl border bg-card"><div className="border-b p-5"><h3 className="font-semibold">Key evidence from this lesson</h3><p className="mt-1 text-xs text-muted-foreground">Key speed estimates use attributable individual timings. Simultaneous IME commits have accuracy evidence only.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Session-local per-key measurements and accumulated mastery evidence</caption><thead className="bg-muted/20 text-xs text-muted-foreground"><tr><th className="p-4 font-normal">Key</th><th className="p-4 font-normal">Attempt accuracy</th><th className="p-4 font-normal">Key speed</th><th className="p-4 font-normal">Recent evidence</th><th className="p-4 font-normal">State</th></tr></thead><tbody>{observed.map(metric => { const cumulative = progress.find(stat => stat.char === metric.char); return <tr className="border-t" key={metric.char}><td className="p-4 font-mono text-lg">{metric.char}</td><td className="p-4 font-mono">{metric.accuracy.toFixed(1)}% <span className="text-xs text-muted-foreground">({metric.occurrences})</span></td><td className="p-4 font-mono">{metric.qualifiedLatencySamples ? `${Math.round(metric.wpm)} WPM` : '—'}</td><td className="p-4 font-mono">{cumulative?.attributableAttempts ?? 0} / 20 · {cumulative?.masteryCheckpoints ?? 0} / 2 checkpoints</td><td className="p-4 text-xs capitalize">{cumulative?.assessmentState ?? 'Observed'}</td></tr>; })}</tbody></table></div></section>
    {sourceResultId && <Button variant="outline" asChild><Link to={retestTo ?? '/?retest=targeted'}>Retest matched configuration</Link></Button>}
    <p className="text-xs text-muted-foreground">Enter continues when the results panel has focus.</p>
  </div>;
}
