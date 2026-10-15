import { useMemo, useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { getAllCharacterStats, getCharacterHistory, type LearningOptions } from '@/lib/keybr-engine';
import { getContentPack, getLayout } from '@/lib/content-packs';
import { cn } from '@/lib/utils';

interface Props extends LearningOptions { compact?: boolean; targetWpm?: number; selectedKey?: string; onSelectKey?: (char: string) => void }
export function LetterProgressPanel({ compact = false, targetWpm = 35, selectedKey, onSelectKey, ...options }: Props) {
  const [inspectedKey, setInspectedKey] = useState<string | null>(null);
  const stats = getAllCharacterStats({ ...options, targetWpm });
  const pack = getContentPack(options.dimensions?.language ?? 'en');
  const selected = selectedKey ?? inspectedKey;
  const metric = stats.find(stat => stat.char === selected);
  const history = selected ? getCharacterHistory(selected, options) : [];
  const layout = getLayout(options.dimensions?.layout ?? 'qwerty');
  const useMappedRows = pack.script === 'Latin' && layout.rows.length > 0;
  const rows = useMemo(() => {
    if (!useMappedRows) return [pack.introductionOrder];
    const mapped = layout.rows.map(row => row.filter(char => pack.alphabet.includes(char)));
    const represented = new Set(mapped.flat());
    return [...mapped, pack.introductionOrder.filter(char => !represented.has(char))].filter(row => row.length > 0);
  }, [layout.rows, pack, useMappedRows]);
  const keyButton = (char: string) => {
    const stat = stats.find(item => item.char === char)!;
    const label = !stat.isUnlocked ? 'Locked' : stat.assessmentState === 'introduced' ? 'Introduced, awaiting evidence' : stat.assessmentState === 'mastered' ? 'Mastered' : stat.assessmentState === 'review' ? 'Mastered, needs review' : `${stat.assessmentState ?? 'Unassessed'}, ${stat.attributableAttempts ?? 0} attributable recent attempts`;
    return <button type="button" key={char} aria-label={`${char}: ${label}`} aria-pressed={selected === char} onClick={() => { setInspectedKey(char); if (stat.isUnlocked) onSelectKey?.(char); }} className={cn('relative flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border p-2 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', !stat.isUnlocked ? 'border-border bg-muted/20 text-muted-foreground' : stat.assessmentState === 'mastered' ? 'border-success/50 bg-success/10 text-success' : stat.assessmentState === 'review' ? 'border-warning/50 bg-warning/10 text-warning' : 'border-border bg-background text-foreground hover:border-primary', selected === char && 'ring-2 ring-primary')} title={`${char}: ${label}`}><span>{char}</span>{!stat.isUnlocked ? <Lock className="size-2.5" /> : stat.assessmentState === 'mastered' ? <Check className="size-3" /> : null}</button>;
  };
  if (compact) return <div className="flex flex-wrap justify-center gap-1.5">{stats.map(stat => keyButton(stat.char))}</div>;
  return <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-label="Per-key learning progress">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Your key map</h3><p className="mt-1 text-xs text-muted-foreground">{useMappedRows ? `${layout.label} logical-character view` : 'Native / unmapped character view'} · select an available key to focus practice</p></div><span className="text-xs text-muted-foreground">{stats.filter(stat => stat.isUnlocked).length} introduced / {stats.length}</span></div>
    <div className="space-y-2" lang={pack.id}>{rows.map((row, index) => <div key={index} className="flex flex-wrap justify-center gap-1.5">{row.map(keyButton)}</div>)}</div>
    <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Check className="size-3 text-success" />Mastered</span><span>Available: evidence in progress</span><span className="text-warning">Needs review</span><span className="flex items-center gap-1"><Lock className="size-3" />Locked</span></div>
    {metric && <div className="mt-6 border-t border-border pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold"><span className="mr-2 font-mono text-xl text-primary">{metric.char}</span>{metric.assessmentState?.replaceAll('_', ' ')}</h4><span className="text-xs text-muted-foreground">{metric.recentAttempts ?? 0} recent attempts · {metric.lessonCount ?? 0} assessments</span></div><p className="mt-2 text-sm text-muted-foreground">{metric.qualifiedLatencySamples ? `${Math.round(metric.wpm)} WPM latency estimate; target ${targetWpm} WPM. ` : 'No qualified individual-key timing yet. '}{metric.recentAttempts ? `${metric.accuracy.toFixed(1)}% recent attempt accuracy.` : 'Practice this key to begin collecting evidence.'}</p>
      {history.length > 0 ? <div className="mt-4 max-h-52 overflow-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Actual session history for {metric.char}</caption><thead className="text-muted-foreground"><tr><th className="py-2 font-normal">Completed lesson</th><th className="text-right font-normal">Key speed</th><th className="text-right font-normal">Accuracy</th><th className="text-right font-normal">Attempts</th></tr></thead><tbody>{history.slice(-10).map(item => <tr key={item.sessionId} className="border-t border-border"><td className="py-2">{new Date(item.completedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td className="text-right font-mono">{item.wpm === null ? '—' : `${Math.round(item.wpm)} WPM`}</td><td className="text-right font-mono">{item.accuracy.toFixed(1)}%</td><td className="text-right font-mono">{item.attempts}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-xs text-muted-foreground">No recorded sessions for this key. Legacy summary values are unassessed.</p>}
    </div>}
  </section>;
}
