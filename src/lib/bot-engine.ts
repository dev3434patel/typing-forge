/** Local, visibly labelled race opponents. Clock and randomness can be deterministic in tests. */
import { calculateWpm, calculateProgress } from './metrics-engine';

export type BotLevel = 'beginner' | 'intermediate' | 'pro';
export type BotDifficulty = BotLevel;
export interface BotConfig {
  level: BotLevel;
  targetWpmMean: number;
  targetWpmStdDev: number;
  mistakeProbability: number;
  correctionDelay: [number, number];
  burstProbability: number;
  hesitationProbability: number;
  ikiMean: number;
  ikiStdDev: number;
}
export interface BotKeystroke { char: string; timestamp: number; isCorrect: boolean; isBackspace: boolean }
export interface BotState {
  config: BotConfig;
  targetText: string;
  typedText: string;
  cursorIndex: number;
  keystrokes: BotKeystroke[];
  startTime: number;
  currentWpm: number;
  progress: number;
  isFinished: boolean;
  correctChars: number;
  accuracy: number;
  pendingCorrection?: { stage: 'backspace' | 'retype'; expected: string; at: number };
}
export interface BotDependencies { now?: () => number; random?: () => number }
export const BOT_CONFIGS: Record<BotLevel, BotConfig> = {
  beginner: { level: 'beginner', targetWpmMean: 30, targetWpmStdDev: 8, mistakeProbability: .12, correctionDelay: [300, 800], burstProbability: .1, hesitationProbability: .2, ikiMean: 400, ikiStdDev: 120 },
  intermediate: { level: 'intermediate', targetWpmMean: 50, targetWpmStdDev: 10, mistakeProbability: .07, correctionDelay: [200, 500], burstProbability: .2, hesitationProbability: .1, ikiMean: 240, ikiStdDev: 60 },
  pro: { level: 'pro', targetWpmMean: 82, targetWpmStdDev: 12, mistakeProbability: .025, correctionDelay: [100, 300], burstProbability: .35, hesitationProbability: .05, ikiMean: 146, ikiStdDev: 35 },
};
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function unit(random: () => number): number { return Math.max(Number.EPSILON, Math.min(1 - Number.EPSILON, random())); }
function normal(mean: number, stdDev: number, random: () => number): number {
  return mean + Math.sqrt(-2 * Math.log(unit(random))) * Math.cos(2 * Math.PI * unit(random)) * stdDev;
}
function logNormal(mean: number, stdDev: number, random: () => number): number {
  const sigma = Math.sqrt(Math.log(1 + stdDev ** 2 / mean ** 2));
  const mu = Math.log(mean) - sigma ** 2 / 2;
  return Math.exp(normal(mu, sigma, random));
}
const ADJACENT: Record<string, string> = { a: 'qwsz', b: 'vghn', c: 'xdfv', d: 'serfxc', e: 'wsdr', f: 'drtgcv', g: 'ftyhvb', h: 'gyujbn', i: 'ujko', j: 'huiknm', k: 'jiolm', l: 'kop', m: 'njk', n: 'bhjm', o: 'iklp', p: 'ol', q: 'wa', r: 'edft', s: 'awedzx', t: 'rfgy', u: 'yhji', v: 'cfgb', w: 'qase', x: 'zsdc', y: 'tghu', z: 'asx', ' ': 'cvbnm' };
function typo(expected: string, random: () => number): string {
  const adjacent = ADJACENT[expected.toLowerCase()] ?? 'asdf';
  const value = adjacent[Math.floor(unit(random) * adjacent.length)];
  return expected !== expected.toLowerCase() ? value.toUpperCase() : value;
}
export function createBotState(level: BotLevel, targetText: string, random = Math.random): BotState {
  const template = BOT_CONFIGS[level];
  const config: BotConfig = { ...template, correctionDelay: [...template.correctionDelay], targetWpmMean: Math.max(10, normal(template.targetWpmMean, template.targetWpmStdDev / 2, random)) };
  return { config, targetText, typedText: '', cursorIndex: 0, keystrokes: [], startTime: 0, currentWpm: 0, progress: targetText ? 0 : 100, isFinished: !targetText, correctChars: 0, accuracy: 100 };
}
export interface BotRunner { readonly state: BotState; start(): void; tick(): BotState; isFinished(): boolean }
export function createBot(level: BotLevel, targetText: string, dependencies: BotDependencies = {}): BotRunner {
  const now = dependencies.now ?? (() => performance.now());
  const random = dependencies.random ?? Math.random;
  let state = createBotState(level, targetText, random);
  let nextTime = 0;
  let started = false;
  return {
    get state() { return state; },
    start() {
      if (started) return;
      started = true;
      state = { ...state, startTime: now() };
      nextTime = state.startTime + getNextKeystrokeDelay(state, random);
    },
    tick() {
      if (!started || state.isFinished) return state;
      const current = now();
      // Scheduled event times keep delayed animation frames from changing a bot's pace.
      while (current >= nextTime && !state.isFinished) {
        state = simulateKeystroke(state, nextTime, random);
        nextTime = state.pendingCorrection?.at ?? nextTime + getNextKeystrokeDelay(state, random);
      }
      return state;
    },
    isFinished: () => state.isFinished,
  };
}
export function getNextKeystrokeDelay(bot: BotState, random = Math.random): number {
  const config = bot.config;
  // Target WPM includes configured hesitations and corrections.
  const correctionCost = config.mistakeProbability * ((config.correctionDelay[0] + config.correctionDelay[1]) / 2 + 100);
  const baseMean = Math.max(50, (12000 / config.targetWpmMean - correctionCost) / (1 - .4 * config.burstProbability) - 500 * config.hesitationProbability);
  let delay = logNormal(baseMean, config.ikiStdDev * baseMean / config.ikiMean, random);
  if (unit(random) < config.hesitationProbability) delay += logNormal(500, 200, random);
  if (unit(random) < config.burstProbability) delay *= .6;
  return Math.max(35, Math.min(2000, delay));
}
export function simulateKeystroke(bot: BotState, currentTime: number, random = Math.random): BotState {
  if (bot.isFinished || !Number.isFinite(currentTime)) return bot;
  const pending = bot.pendingCorrection;
  if (pending && currentTime < pending.at) return bot;
  const next: BotState = { ...bot, keystrokes: [...bot.keystrokes] };
  if (pending?.stage === 'backspace') {
    next.typedText = next.typedText.slice(0, -1); next.cursorIndex--;
    next.keystrokes.push({ char: '', timestamp: currentTime, isCorrect: false, isBackspace: true });
    next.pendingCorrection = { stage: 'retype', expected: pending.expected, at: currentTime + logNormal(100, 30, random) };
  } else {
    const expected = pending?.expected ?? next.targetText[next.cursorIndex];
    if (expected === undefined) return { ...next, isFinished: true };
    const mistaken = !pending && unit(random) < next.config.mistakeProbability;
    const char = mistaken ? typo(expected, random) : expected;
    next.typedText += char; next.cursorIndex++;
    next.keystrokes.push({ char, timestamp: currentTime, isCorrect: char === expected, isBackspace: false });
    next.pendingCorrection = mistaken ? { stage: 'backspace', expected, at: currentTime + next.config.correctionDelay[0] + unit(random) * (next.config.correctionDelay[1] - next.config.correctionDelay[0]) } : undefined;
  }
  next.correctChars = Array.from(next.typedText).reduce((count, char, index) => count + Number(char === next.targetText[index]), 0);
  const insertions = next.keystrokes.filter(event => !event.isBackspace);
  next.accuracy = insertions.length ? insertions.filter(event => event.isCorrect).length / insertions.length * 100 : 100;
  next.currentWpm = calculateWpm(next.correctChars, Math.max(0, currentTime - next.startTime));
  next.progress = calculateProgress(next.correctChars, next.targetText.length);
  next.isFinished = next.cursorIndex >= next.targetText.length && !next.pendingCorrection;
  return next;
}
export interface BotUpdate { timestamp: number; progress: number; wpm: number; accuracy: number; typedText: string }
export function simulateFullRace(level: BotLevel, targetText: string, updateIntervalMs = 200, dependencies: BotDependencies = {}): BotUpdate[] {
  const random = dependencies.random ?? Math.random;
  let bot = createBotState(level, targetText, random);
  const updates: BotUpdate[] = [];
  let currentTime = 0;
  let nextUpdate = 0;
  while (!bot.isFinished) {
    currentTime = bot.pendingCorrection?.at ?? currentTime + getNextKeystrokeDelay(bot, random);
    bot = simulateKeystroke(bot, currentTime, random);
    if (currentTime >= nextUpdate || bot.isFinished) {
      updates.push({ timestamp: currentTime, progress: bot.progress, wpm: bot.currentWpm, accuracy: bot.accuracy, typedText: bot.typedText });
      nextUpdate = currentTime + Math.max(1, updateIntervalMs);
    }
  }
  if (!updates.length) updates.push({ timestamp: 0, progress: 100, wpm: 0, accuracy: 100, typedText: '' });
  return updates;
}
export function getBotName(level: BotLevel, random = Math.random): string {
  const names: Record<BotLevel, string[]> = { beginner: ['TypeLearner', 'KeyNewbie', 'SlowTyper', 'Novice123'], intermediate: ['SwiftKeys', 'TyperMike', 'KeyboardKid', 'MidRacer'], pro: ['SpeedDemon', 'TypeMaster', 'KeyboardKing', 'WPMChamp'] };
  return names[level][Math.floor(unit(random) * names[level].length)];
}
export function getExpectedCompletionTime(level: BotLevel, textLength: number): number {
  return Math.max(0, Math.round(textLength * 12000 / BOT_CONFIGS[level].targetWpmMean));
}
