import { SessionController, type InputProvenance, type SessionResult, type SessionSnapshot } from '@/lib/typing-core';
import { graphemes } from '@/lib/typing-core/transcript';
import type { GameOptions } from './types';
import { ARCADE_VERSION } from './types';

/** Every inserted unit passes through the unchanged canonical scorer. Non-text
 * submissions delimit game targets without inventing a Space insertion. */
export class CanonicalGameBridge {
  readonly controller: SessionController;
  private wordStart = 0;
  private expected = '';
  private wordAttempts = 0;
  private wordCorrect = 0;
  constructor(options: GameOptions) {
    this.controller = new SessionController({ clientSessionId: options.sessionId, ownerScope: options.owner,
      mode: 'zen', initialTarget: '', scoringPolicy: 'prose', correctionPolicy: 'current-word', rejectIncorrect: true,
      language: 'en', script: 'Latin', keyboardLayout: options.keyboardLayout ?? 'qwerty', inputMethod: 'keyboard',
      contentRevision: `${ARCADE_VERSION}:${options.gameId}:${options.difficulty}`, generatorVersion: ARCADE_VERSION,
      seed: options.seed, privacy: 'public-corpus', startImmediately: false,
      settings: { arcadeGame: options.gameId, arcadeVersion: ARCADE_VERSION, difficulty: options.difficulty, variant: options.variant, localOnly: true } }, { now: options.now, wallNow: options.wallNow });
  }
  get target(): string { return this.expected; }
  get draft(): string { return graphemes(this.controller.currentText).slice(this.wordStart).join(''); }
  get complete(): boolean { return this.expected !== '' && this.draft === this.expected; }
  get currentWordAccuracy(): number { return this.wordAttempts ? this.wordCorrect / this.wordAttempts * 100 : 0; }
  assign(word: string): void {
    if (this.expected) throw new Error('Submit the issued target before assigning another');
    if (!word || /\s/u.test(word)) throw new Error('Arcade targets must be individual words');
    this.controller.appendTarget(word + ' ');
    this.wordStart = graphemes(this.controller.currentText).length;
    this.expected = word; this.wordAttempts = 0; this.wordCorrect = 0;
  }
  edit(start: number, end: number, text: string, provenance: InputProvenance = 'keyboard', compositionId?: string): SessionSnapshot {
    const length = graphemes(this.draft).length;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > length) throw new Error('Edit must stay in the active game word');
    const view = this.controller.input({ type: text ? provenance === 'composition' ? 'composition' : 'replace' : 'delete',
      start: this.wordStart + start, end: this.wordStart + end, text, provenance, ...(compositionId ? { compositionId } : {}) });
    if (text) for (const attempt of this.controller.lastInputAttempts) { this.wordAttempts++; if (attempt.correct) this.wordCorrect++; }
    return view;
  }
  reject(text: string, provenance: InputProvenance = 'keyboard', compositionId?: string): SessionSnapshot {
    if (!text) return this.snapshot();
    const snapshot = this.controller.input({ type: 'reject', text, provenance, ...(compositionId ? { compositionId } : {}) });
    for (const attempt of this.controller.lastInputAttempts) { this.wordAttempts++; if (attempt.correct) this.wordCorrect++; }
    return snapshot;
  }
  markAssistance(provenance: InputProvenance): void {
    const end = graphemes(this.controller.currentText).length;
    this.controller.input({ type: 'replace', start: end, end, text: '', provenance });
  }
  submit(): void {
    if (!this.expected) return;
    this.controller.input({ type: 'submit', text: '' });
    this.expected = ''; this.wordStart = graphemes(this.controller.currentText).length;
  }
  pause(): SessionSnapshot { return this.controller.pause(); }
  resume(): SessionSnapshot { return this.controller.resume(); }
  snapshot(): SessionSnapshot { return this.controller.snapshot(); }
  finish(): SessionResult { return this.controller.finish('manual'); }
}
