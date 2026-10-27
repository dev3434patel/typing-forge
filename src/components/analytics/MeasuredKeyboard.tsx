import { useState } from 'react';
import { liveKeyboardLayout } from '@/lib/live-keyboard';
import type { MeasuredSkill } from '@/domain/analytics/session-insights';
import { referenceKeyMeasurement } from '@/domain/analytics/key-map';

/** Post-test reference map. Text values and the adjacent key table carry the same evidence. */
export function MeasuredKeyboard({ keys, layout, language }: { keys: readonly MeasuredSkill[]; layout: string; language: string }) {
  const [metric, setMetric] = useState<'accuracy' | 'latency'>('accuracy');
  const reference = liveKeyboardLayout(layout, language);
  const label = (sample: MeasuredSkill | undefined) => !sample ? '—' : metric === 'accuracy' ? `${sample.accuracy.toFixed(0)}%` : sample.speedMs === null ? '—' : `${sample.speedMs.toFixed(0)}ms`;
  return <div className="mt-5">
    <h3 className="font-medium">Measured key map</h3>
    <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Key map measurement">
      <button className="forge-button-secondary" aria-pressed={metric === 'accuracy'} onClick={() => setMetric('accuracy')}>Attempt accuracy</button>
      <button className="forge-button-secondary" aria-pressed={metric === 'latency'} onClick={() => setMetric('latency')}>Attributable latency</button>
    </div>
    <p className="text-xs text-muted-foreground mt-3">{reference.label} reference · {metric === 'accuracy' ? 'Every insertion attempt counts, including corrected mistakes.' : 'Mean measured correct-key latency. Lower values indicate a faster observed transition.'} Base and Shift forms share a physical-key cell and are weighted by their measured counts. A dash means no measurement. The key table lists each character separately.</p>
    {reference.mapped ? <div className="overflow-x-auto mt-3" role="img" aria-label={`${metric === 'accuracy' ? 'Insertion accuracy' : 'Mean attributable latency'} by measured key on the ${reference.label} reference keyboard. The key table provides exact accessible values.`}>
      <div className="min-w-[590px] space-y-1" aria-hidden="true">{reference.rows.slice(0, 4).map((row, index) => <div className="flex gap-1" key={index}>{row.map(key => {
        const sample = referenceKeyMeasurement(keys, key.base, key.shifted, language);
        const strength = !sample ? 0 : metric === 'accuracy' ? sample.accuracy / 100 : sample.speedMs === null ? 0 : Math.min(1, 120 / sample.speedMs);
        return <div className="rounded border border-border px-1 py-2 text-center min-w-0" key={key.code} style={{ flex: key.width, backgroundColor: sample ? `color-mix(in srgb, var(--forge-accent) ${Math.round(5 + strength * 20)}%, transparent)` : undefined }}>
          <span className="block text-[10px] truncate">{key.label}</span><span className="block font-mono text-[10px] mt-1">{label(sample)}</span>
        </div>;
      })}</div>)}</div>
    </div> : <p className="text-sm text-muted-foreground mt-3">This script has no supported physical reference map. Its measured characters remain available in the key table.</p>}
  </div>;
}
