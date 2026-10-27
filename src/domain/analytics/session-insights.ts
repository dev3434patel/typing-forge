import { learningEvidenceFromResult } from '@/lib/learning-evidence';
import { replaySnapshot, traceSessionWords } from '@/lib/typing-core/metrics';
import type { SessionResult } from '@/lib/typing-core/types';
import { fingerForCharacter, type Finger } from '../training/finger-map';
import { classifyTypingErrors, type ErrorKind } from './error-classifier';
import { graphemes, replayTranscript } from '@/lib/typing-core/transcript';
import { getContentPack } from '@/lib/content-packs';

export interface MeasuredSkill { key: string; n: number; correct: number; accuracy: number; smoothedAccuracy: number; speedMs: number | null; latencySamples: number }
export interface SessionInsights {
  version: 'session-insights-v1'; sessionId: string; ownerId: string;
  keys: MeasuredSkill[]; fingers: Array<MeasuredSkill & { finger: Finger }>;
  bigrams: MeasuredSkill[]; errors: Record<ErrorKind, number>; truncatedWords: number;
  nextAction: { keys: string[]; reason: string; href: string };
}
function summary(key: string, values: Array<{ correct: boolean; latency: number | null }>): MeasuredSkill {
  const timed = values.flatMap(value => value.latency === null ? [] : [value.latency]);
  const correct = values.filter(value => value.correct).length;
  return { key, n: values.length, correct, accuracy: values.length ? correct / values.length * 100 : 0, smoothedAccuracy: (correct + 1) / (values.length + 2), speedMs: timed.length ? timed.reduce((sum, value) => sum + value, 0) / timed.length : null, latencySamples: timed.length };
}
export function sessionInsights(result: SessionResult): SessionInsights | null {
  try {
    const options = { targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments, pauseIntervals: result.pauseIntervals, finiteFinal: !['time', 'race', 'zen'].includes(result.configuration.mode) };
    replaySnapshot(result.configuration, result.events, result.elapsedMs, options);
    const evidence = learningEvidenceFromResult(result);
    const positions = replayTranscript(result.configuration, result.events, Infinity, result.targetText, result.issuedTargetSegments).attempts;
    const keys = new Map<string, Array<{ correct: boolean; latency: number | null }>>();
    const fingers = new Map<Finger, Array<{ correct: boolean; latency: number | null }>>();
    const pairs = new Map<string, Array<{ correct: boolean; latency: number | null }>>();
    const append = <T,>(map: Map<T, Array<{ correct: boolean; latency: number | null }>>, key: T, value: { correct: boolean; latency: number | null }) => {
      const values = map.get(key);
      if (values) values.push(value); else map.set(key, [value]);
    };
    for (const [index, attempt] of evidence.attempts.entries()) {
      if (!attempt.expected) continue;
      const key = attempt.expected.toLocaleLowerCase(result.configuration.language ?? 'en');
      const observation = { correct: attempt.correct, latency: attempt.latencyMs };
      append(keys, key, observation);
      const finger = fingerForCharacter(attempt.expected, evidence.dimensions.layout, evidence.dimensions.language);
      if (finger) append(fingers, finger, observation);
      const previous = evidence.attempts[index - 1];
      if (attempt.attributable && previous?.expected.trim() && positions[index]?.position === positions[index - 1]?.position + 1) {
        const pair = `${previous.expected}${attempt.expected}`.toLocaleLowerCase(result.configuration.language ?? 'en');
        append(pairs, pair, { correct: previous.correct && attempt.correct, latency: previous.correct ? attempt.latencyMs : null });
      }
    }
    const measured = [...keys].map(([key, values]) => summary(key, values)).sort((a, b) => a.smoothedAccuracy - b.smoothedAccuracy || a.key.localeCompare(b.key));
    const errors: Record<ErrorKind, number> = { transposition: 0, omission: 0, substitution: 0, extra: 0, 'finger-slip': 0 };
    let truncatedWords = 0;
    if (result.configuration.scoringPolicy !== 'free') for (const word of traceSessionWords(result.configuration, result.events, result.elapsedMs, options)) {
      if (word.reason === 'untyped') continue;
      // Untyped suffixes of an unfinished active word are not omitted keystrokes.
      const units = graphemes(word.targetWord);
      const target = word.untyped ? units.slice(0, units.length - word.untyped).join('') : word.targetWord;
      const classified = classifyTypingErrors(target, word.typedWord, result.configuration.keyboardLayout);
      if (classified.truncated) truncatedWords++;
      for (const error of classified.errors) errors[error.kind]++;
    }
    const alphabet = new Set(getContentPack(result.configuration.language ?? 'en').alphabet);
    const trainable = measured.filter(key => alphabet.has(key.key));
    const problem = trainable.filter(key => key.n >= 20 && key.smoothedAccuracy < .92).slice(0, 5);
    const focus = problem.length ? problem : trainable.filter(key => key.correct < key.n).slice(0, 5);
    const focusKeys = focus.map(item => item.key);
    return { version: 'session-insights-v1', sessionId: result.clientSessionId, ownerId: result.ownerScope, keys: measured, fingers: [...fingers].map(([finger, values]) => ({ ...summary(finger, values), finger })), bigrams: [...pairs].map(([key, values]) => summary(key, values)).sort((a, b) => a.smoothedAccuracy - b.smoothedAccuracy || b.n - a.n || a.key.localeCompare(b.key)), errors, truncatedWords, nextAction: { keys: focusKeys, reason: problem.length ? 'These keys have at least 20 attempts and smoothed accuracy below 92%.' : focus.length ? 'Review these observed mistakes. More evidence is needed before calling a key a persistent weakness.' : 'No weak key is established in this attempt. Keep your next practice deliberate.', href: `/learn?${new URLSearchParams({ keys: focusKeys.join(''), source: result.clientSessionId, language: result.configuration.language ?? 'en', layout: result.configuration.keyboardLayout ?? 'qwerty' })}` } };
  } catch { return null; }
}
