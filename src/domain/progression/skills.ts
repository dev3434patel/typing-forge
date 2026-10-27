import type { SkillContribution, SkillMap, SkillObservation, SkillStatistic } from './types';
export function emptySkills(): SkillMap { return { keys: {}, fingers: {}, bigrams: {}, trigrams: {} }; }
const round = (value: number) => Math.round(value * 1000) / 1000;
function observe(map: Record<string, SkillStatistic>, key: string, sample: SkillObservation) {
  // Null-prototype assignment is unnecessary with an own-property lookup and defineProperty.
  const previous = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : { n: 0, correct: 0, accuracy: .5, speedMs: null, latencyMs: null };
  const n = previous.n + 1, correct = previous.correct + Number(sample.correct);
  const timing = sample.correct && sample.latencyMs !== null && sample.latencyMs > 0 && sample.latencyMs <= 2000 ? sample.latencyMs : null;
  const speedMs = timing === null ? previous.speedMs : round(previous.speedMs === null ? timing : .8 * previous.speedMs + .2 * timing);
  Object.defineProperty(map, key, { value: { n, correct, accuracy: (correct + 1) / (n + 2), speedMs, latencyMs: timing ?? previous.latencyMs }, enumerable: true, writable: true, configurable: true });
}
export function applySkillObservations(skills: SkillMap, samples: SkillObservation[]): void {
  for (const sample of samples) { if (!sample.key) continue; observe(skills.keys, sample.key, sample); if (sample.finger) observe(skills.fingers, sample.finger, sample); if (sample.bigram) observe(skills.bigrams, sample.bigram, sample); if (sample.trigram) observe(skills.trigrams, sample.trigram, sample); }
}
export function problemKeys(skills: SkillMap): string[] { return Object.keys(skills.keys).filter(key => skills.keys[key].n >= 20 && skills.keys[key].accuracy < .92).sort((a, b) => skills.keys[a].accuracy - skills.keys[b].accuracy || a.localeCompare(b)); }
/** Session sufficient statistics do not preserve the ordered typed passage. */
export function aggregateSkills(samples: SkillObservation[]): SkillContribution[] {
  const groups = new Map<string, SkillContribution>();
  for (const sample of samples) for (const [group, key] of [['keys', sample.key], ['fingers', sample.finger], ['bigrams', sample.bigram], ['trigrams', sample.trigram]] as const) {
    if (!key) continue;
    const identity = `${group}:${key}`;
    const item = groups.get(identity) ?? { group, key, n: 0, correct: 0, timingN: 0, ewma: null, weighted: 0, lastLatency: null };
    const correct = group === 'bigrams' ? sample.bigramCorrect ?? sample.correct : group === 'trigrams' ? sample.trigramCorrect ?? sample.correct : sample.correct;
    item.n++; item.correct += Number(correct);
    const latency = sample.latencyMs;
    if (correct && latency !== null && latency > 0 && latency <= 2000) { item.timingN++; item.ewma = item.ewma === null ? latency : .8 * item.ewma + .2 * latency; item.weighted = .8 * item.weighted + .2 * latency; item.lastLatency = latency; }
    groups.set(identity, item);
  }
  return [...groups.values()].sort((a, b) => a.group < b.group ? -1 : a.group > b.group ? 1 : a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}
export function applySkillContributions(skills: SkillMap, contributions: SkillContribution[]): void {
  for (const sample of contributions) {
    const map = skills[sample.group];
    const previous = Object.prototype.hasOwnProperty.call(map, sample.key) ? map[sample.key] : { n: 0, correct: 0, accuracy: .5, speedMs: null, latencyMs: null };
    const n = previous.n + sample.n, correct = previous.correct + sample.correct;
    const speedMs = sample.timingN === 0 ? previous.speedMs : round(previous.speedMs === null ? sample.ewma! : .8 ** sample.timingN * previous.speedMs + sample.weighted);
    Object.defineProperty(map, sample.key, { value: { n, correct, accuracy: (correct + 1) / (n + 2), speedMs, latencyMs: sample.lastLatency ?? previous.latencyMs }, enumerable: true, writable: true, configurable: true });
  }
}
