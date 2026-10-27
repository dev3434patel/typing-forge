import type { MeasuredSkill } from './session-insights';

/** Combines base/shift forms on one reference key using counts, never mean-of-percentages. */
export function referenceKeyMeasurement(keys: readonly MeasuredSkill[], base?: string, shifted?: string, language = 'en'): MeasuredSkill | undefined {
  const locale = language === 'gu-Latn' ? 'gu' : language;
  const forms = new Set([base, shifted].filter((key): key is string => !!key).map(key => key.toLocaleLowerCase(locale)));
  const samples = keys.filter(key => forms.has(key.key));
  if (!samples.length) return undefined;
  const n = samples.reduce((sum, key) => sum + key.n, 0), correct = samples.reduce((sum, key) => sum + key.correct, 0);
  const timed = samples.filter(key => key.speedMs !== null && key.latencySamples > 0);
  const latencySamples = timed.reduce((sum, key) => sum + key.latencySamples, 0);
  return { key: [...new Set(samples.map(key => key.key))].join(' / '), n, correct, accuracy: n ? correct / n * 100 : 0, smoothedAccuracy: (correct + 1) / (n + 2), latencySamples, speedMs: latencySamples ? timed.reduce((sum, key) => sum + key.speedMs! * key.latencySamples, 0) / latencySamples : null };
}
