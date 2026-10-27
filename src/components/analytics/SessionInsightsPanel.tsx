import { useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { SessionResult } from '@/lib/typing-core/types';
import { sessionInsights } from '@/domain/analytics/session-insights';
import { FINGER_NAMES } from '@/domain/training/finger-map';
import { replaySession } from '@/lib/typing-core/metrics';
import { MeasuredKeyboard } from './MeasuredKeyboard';
import { FingerAccuracyChart } from './FingerAccuracyChart';

function BurstTimeline({ result }: { result: SessionResult }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const samples = useMemo(() => replaySession(result.configuration, result.events, result.elapsedMs, { targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments, pauseIntervals: result.pauseIntervals, finiteFinal: !['time', 'race', 'zen'].includes(result.configuration.mode) }).timeSeries, [result]);
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, 1000, 72);
    const maximum = Math.max(1, ...samples.map(item => item.localWpm));
    const color = getComputedStyle(document.documentElement).getPropertyValue('--forge-accent').trim() || '#27aae1';
    samples.forEach((sample, index) => {
      context.fillStyle = color;
      context.globalAlpha = .2 + .8 * sample.localWpm / maximum;
      context.fillRect(index * 1000 / samples.length, 0, Math.max(1, 1000 / samples.length - 2), 72);
    });
    context.globalAlpha = 1;
  }, [samples]);
  return <div><h3 className="font-medium">Attempt rhythm</h3><p className="text-xs text-muted-foreground mt-2">Each block is an observed bucket. Brighter blocks indicate a higher insertion-attempt rate; this is not headline WPM.</p><canvas ref={canvas} width={1000} height={72} className="w-full h-12 mt-4 rounded" role="img" aria-label="Attempt-rate timeline. Exact bucket durations, rates and mistakes are available in the table below." /><details className="mt-3"><summary className="min-h-11 flex items-center cursor-pointer text-sm">View attempt rhythm data</summary><div className="overflow-x-auto"><table className="w-full text-sm text-left"><caption className="sr-only">Duration-weighted canonical attempt buckets</caption><thead><tr>{['End time', 'Bucket duration', 'Attempt rate', 'Incorrect attempts'].map(label => <th className="p-2" scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{samples.map(sample => <tr key={sample.offsetMs}><td className="p-2">{sample.seconds.toFixed(1)}s</td><td>{sample.bucketDurationMs}ms</td><td>{sample.localWpm.toFixed(1)}</td><td>{sample.errors}</td></tr>)}</tbody></table></div></details></div>;
}
export function SessionInsightsPanel({ result }: { result: SessionResult }) {
  const insight = useMemo(() => sessionInsights(result), [result]);
  if (!insight) return <p role="status" className="text-sm text-muted-foreground">Replay diagnostics are unavailable for this evidence. Your existing result remains available.</p>;
  const labels = { transposition: 'Transposed pair', omission: 'Omitted character', substitution: 'Substitution', extra: 'Extra character', 'finger-slip': 'Neighbor-key substitution' };
  return <section className="panel p-5 sm:p-7 space-y-6" aria-label="Actionable replay diagnostics">
    <div><p className="eyebrow">FROM EVIDENCE TO PRACTICE</p><h2 className="text-xl font-semibold mt-2">Your next useful step</h2><p className="text-sm text-muted-foreground mt-2">{insight.nextAction.reason}</p><Link className="forge-button mt-4" to={insight.nextAction.href}>{insight.nextAction.keys.length ? `Practise ${insight.nextAction.keys.join(' · ')}` : 'Start a deliberate practice'}</Link></div>
    <BurstTimeline result={result} />
    <div><h3 className="font-medium">Final-word edit patterns</h3><p className="text-xs text-muted-foreground mt-2">Diagnostic edits only; these do not change your score. Corrected mistakes remain in insertion accuracy. Neighboring keys suggest a possible slip, not which finger you used.</p><dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">{Object.entries(insight.errors).map(([kind, count]) => <div className="rounded-lg bg-muted/30 p-3" key={kind}><dt className="text-xs text-muted-foreground">{labels[kind as keyof typeof labels]}</dt><dd className="font-mono text-xl mt-1">{count}</dd></div>)}</dl>{insight.truncatedWords > 0 && <p className="text-xs mt-2">{insight.truncatedWords} long words were diagnosed only through their first 256 graphemes.</p>}</div>
    <details><summary className="min-h-11 flex items-center cursor-pointer font-medium">Explore keys, reference fingers and bigrams</summary><p className="text-xs text-muted-foreground my-3">Accuracy includes every insertion attempt, including corrected mistakes. Latency uses attributable correct keyboard transitions only; first, paused, idle and composition intervals are excluded. Finger groups use the selected reference layout, not a sensor.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Per-key insertion evidence</caption><thead><tr>{['Key', 'Attempts', 'Accuracy', 'Mean attributable latency'].map(label => <th scope="col" className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{insight.keys.map(key => <tr key={key.key}><th className="p-2 font-mono" scope="row">{key.key === ' ' ? 'Space' : key.key === '\n' ? 'Enter' : key.key === '\t' ? 'Tab' : key.key}</th><td>{key.n}</td><td>{key.accuracy.toFixed(1)}%</td><td>{key.speedMs === null ? 'Not measured' : `${key.speedMs.toFixed(0)}ms (${key.latencySamples})`}</td></tr>)}</tbody></table></div>
      <MeasuredKeyboard keys={insight.keys} layout={result.configuration.keyboardLayout ?? 'qwerty'} language={result.configuration.language ?? 'en'} />
      <FingerAccuracyChart fingers={insight.fingers} />
      <div className="mt-5 space-y-3" role="group" aria-label="Accuracy by reference finger">{insight.fingers.map(finger => <div key={finger.finger}><label className="text-xs flex justify-between" htmlFor={`finger-${result.clientSessionId}-${finger.finger}`}><span>{FINGER_NAMES[finger.finger]}</span><span>{finger.accuracy.toFixed(1)}% · {finger.n} attempts</span></label><progress id={`finger-${result.clientSessionId}-${finger.finger}`} className="w-full accent-primary" max={100} value={finger.accuracy} /></div>)}</div>
      <div className="overflow-x-auto mt-5"><table className="w-full text-left text-sm"><caption className="text-left text-xs text-muted-foreground mb-2">Lowest-confidence observed bigrams · smoothed accuracy, at least 20 observations to establish a weakness</caption><thead><tr><th scope="col" className="p-2">Pair</th><th scope="col">Observations</th><th scope="col">Smoothed accuracy</th></tr></thead><tbody>{insight.bigrams.slice(0, 10).map(pair => <tr key={pair.key}><th scope="row" className="p-2 font-mono">{pair.key}</th><td>{pair.n}</td><td>{(pair.smoothedAccuracy * 100).toFixed(1)}%</td></tr>)}</tbody></table></div>
    </details>
  </section>;
}
