import { seededRandom } from '@/lib/content-packs';
import { interleaveReview } from './review';

export const TRAINING_GENERATOR_VERSION = 'sparow-training-original-v1';
export type DrillKind = 'home-row' | 'keys' | 'words' | 'sentences' | 'code' | 'numbers' | 'problem-keys';
// Original training vocabulary, maintained here rather than downloaded at runtime.
const LEXICON = 'calm clear steady hands flow soft light read write train learn move focus skill rest small simple warm home row sound rhythm kind bright river stone garden open quiet trust speed practice'.split(' ');
const SENTENCES = ['calm hands find a steady rhythm.', 'clear practice builds a useful skill.', 'read the next word and keep a light touch.'];
export interface KeyConfidence { key: string; accuracy: number; smoothedMs: number | null; n: number }
export function trainingConfidence(key: KeyConfidence, targetMs: number): number {
  if (!Number.isFinite(targetMs) || targetMs <= 0 || !key.n || key.smoothedMs === null || !Number.isFinite(key.smoothedMs) || key.smoothedMs <= 0) return 0;
  return Math.min(1, targetMs / key.smoothedMs) * Math.max(0, Math.min(1, key.accuracy));
}
export function keyPracticeWeight(accuracy: number): number {
  return Math.min(4, Math.max(1, 1 + 3 * (1 - (Number.isFinite(accuracy) ? Math.max(0, Math.min(1, accuracy)) : 0))));
}
export function nextTrainingKey(order: readonly string[], active: readonly string[], evidence: readonly KeyConfidence[], threshold = .92, targetMs = 350): string | null {
  if (!active.length || !active.every(key => {
    const measured = evidence.find(item => item.key === key);
    return measured && measured.n >= 20 && trainingConfidence(measured, targetMs) >= threshold;
  })) return null;
  return order.find(key => !active.includes(key)) ?? null;
}
export function generateTrainingDrill(options: { seed: string; keys: readonly string[]; kind?: DrillKind; count?: number; weak?: readonly KeyConfidence[]; reviewKeys?: readonly string[]; focusSequences?: readonly string[] }): string {
  const keys = [...new Set(options.keys.filter(key => /^[a-z0-9.,;:!?()[\]{}+=_'-]$/i.test(key)))].sort();
  if (!keys.length) throw new Error('Choose at least one supported practice key.');
  const count = Math.min(100, Math.max(1, Math.floor(options.count ?? 20)));
  const random = seededRandom(`${TRAINING_GENERATOR_VERSION}:${options.seed}:${options.kind ?? 'keys'}`);
  const allowed = new Set(keys);
  const words = LEXICON.filter(word => [...word].every(key => allowed.has(key)));
  if (options.kind === 'sentences') {
    const sentences = SENTENCES.map(text => [...text].filter(key => key === ' ' || allowed.has(key)).join('').replace(/ +/g, ' ').trim()).filter(Boolean);
    if (sentences.length) return Array.from({ length: Math.max(1, Math.ceil(count / 7)) }, () => sentences[Math.floor(random() * sentences.length)]).join(' ');
  }
  const transitions = new Map<string, string[]>();
  for (const word of LEXICON) for (let index = 0; index < word.length - 1; index++) {
    if (allowed.has(word[index]) && allowed.has(word[index + 1])) transitions.set(word[index], [...(transitions.get(word[index]) ?? []), word[index + 1]]);
  }
  const weights = keys.map(key => keyPracticeWeight(options.weak?.find(item => item.key === key)?.accuracy ?? 1));
  const choose = () => {
    let value = random() * weights.reduce((sum, weight) => sum + weight, 0);
    return keys.find((_, index) => { value -= weights[index]; return value < 0; }) ?? keys[keys.length - 1];
  };
  const fresh = Array.from({ length: count }, (_, index) => {
    if (['words', 'sentences'].includes(options.kind ?? '') && words.length) return words[Math.floor(random() * words.length)];
    if (options.kind === 'home-row') return Array.from({ length: 4 }, choose).join('');
    if (options.kind === 'code') return ['const', 'value', '=', '1;', 'return', 'value;'][index % 6].split('').filter(key => allowed.has(key)).join('') || choose();
    let word = choose();
    for (let length = 2 + Math.floor(random() * 4); word.length < length;) {
      const next = transitions.get(word[word.length - 1]);
      word += next?.length && random() > .35 ? next[Math.floor(random() * next.length)] : choose();
    }
    return word;
  });
  const sequences = (options.focusSequences ?? []).filter(sequence => sequence.length > 0 && sequence.length <= 2 && [...sequence].every(key => allowed.has(key)));
  if (options.kind === 'problem-keys' && sequences.length) fresh.forEach((word, index) => {
    const sequence = sequences[index % sequences.length];
    if (!word.includes(sequence)) fresh[index] = `${sequence}${word.slice(sequence.length)}`;
  });
  const review = options.kind === 'code' ? [] : [...new Set(options.reviewKeys ?? [])].filter(key => allowed.has(key)).map(key => key.repeat(3));
  return interleaveReview(fresh, review, count).map(item => item.item).join(' ');
}
