export interface ArcadeAudioSettings { muted: boolean; volume: number }
export const AUDIO_STORAGE_KEY = 'sparowtype.arcade.audio.v1';
export function readAudioSettings(storage?: Pick<Storage, 'getItem'>): ArcadeAudioSettings {
  try { const value = JSON.parse(storage?.getItem(AUDIO_STORAGE_KEY) ?? '{}'); return { muted: value.muted !== false, volume: typeof value.volume === 'number' && Number.isFinite(value.volume) ? Math.max(0, Math.min(1, value.volume)) : 0.25 }; }
  catch { return { muted: true, volume: 0.25 }; }
}
/** Original oscillator motifs only. Context creation requires an explicit gesture. */
export class ArcadeAudio {
  private context: AudioContext | null = null;
  private active = new Set<OscillatorNode>();
  constructor(public settings: ArcadeAudioSettings) {}
  async unlock(): Promise<void> {
    if (this.settings.muted) return;
    try { this.context ??= new AudioContext(); if (this.context.state === 'suspended') await this.context.resume(); } catch { this.context = null; }
  }
  tone(frequency: number, length = 0.06, offset = 0): void {
    const context = this.context;
    if (!context || this.settings.muted || context.state !== 'running' || this.active.size >= 16) return;
    const oscillator = context.createOscillator(), gain = context.createGain(), at = context.currentTime + offset;
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at); gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.settings.volume * 0.12), at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    oscillator.connect(gain).connect(context.destination); this.active.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.active.delete(oscillator); };
    oscillator.start(at); oscillator.stop(at + length + 0.01);
  }
  motif(notes: readonly number[]): void { notes.forEach((note, index) => this.tone(note, 0.1, index * 0.09)); }
  dispose(): void { for (const oscillator of this.active) { try { oscillator.stop(); } catch { /* An ended node is already silent. */ } } this.active.clear(); void this.context?.close(); this.context = null; }
}
