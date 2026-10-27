import { useState } from 'react';
import { classroomAlias, validAggregate, type ClassAggregate } from '@/domain/classroom/model';

export function ManualReportForm({ onAdd }: { onAdd: (report: ClassAggregate) => void }) {
  const [alias, setAlias] = useState(''), [error, setError] = useState('');
  const [values, setValues] = useState({ sessions: '1', minutes: '1', attempts: '100', correct: '98', wpm: '20' });
  const labels = { sessions: 'Reported sessions', minutes: 'Active minutes', attempts: 'Insertion attempts', correct: 'Correct insertion attempts', wpm: 'Best reported WPM' };
  return <details><summary className="min-h-11 flex items-center cursor-pointer text-sm">Add a manually reported alias</summary><form className="mt-3 space-y-3" onSubmit={event => {
    event.preventDefault(); setError('');
    try {
      const report: ClassAggregate = { alias: classroomAlias(alias), sessions: Number(values.sessions), activeMs: Number(values.minutes) * 60000, insertionAttempts: Number(values.attempts), correctAttempts: Number(values.correct), bestWpm: Number(values.wpm), verification: 'manual-unverified' };
      if (!validAggregate(report)) throw new Error('Check the report bounds; correct attempts cannot exceed all insertion attempts.');
      onAdd(report); setAlias('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'This report is invalid.'); }
  }}><p className="text-xs text-muted-foreground">These are manually entered aggregates. They are never presented as replay-checked results or ranked scores.</p><label className="text-sm block">Student alias, without an email<input className="forge-input mt-2" value={alias} onChange={event => setAlias(event.target.value)} required minLength={2} maxLength={32} /></label><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{(Object.keys(values) as Array<keyof typeof values>).map(key => <label className="text-sm" key={key}>{labels[key]}<input className="forge-input mt-2" type="number" min={0} max={key === 'attempts' || key === 'correct' ? 20000000 : key === 'minutes' ? 10000 : 1000} step={key === 'minutes' || key === 'wpm' ? '.1' : '1'} required value={values[key]} onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}</div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button className="forge-button-secondary">Add unverified manual report</button></form></details>;
}
