import { SeededRandom } from '../engine/random';
import { ORIGINAL_WORDS } from './catalog';
export function utcDate(at = Date.now()): string {
  if (!Number.isFinite(at)) throw new Error('UTC date requires a finite timestamp');
  return new Date(at).toISOString().slice(0, 10);
}
export async function dailyChallenge(day: string, subtle: Pick<SubtleCrypto, 'digest'> = crypto.subtle): Promise<{ day: string; seed: string; text: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(day + 'T00:00:00Z').toISOString().slice(0, 10) !== day) throw new Error('Invalid UTC day');
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(`SparowType-gauntlet-${day}`));
  const seed = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  const random = new SeededRandom(seed), words: string[] = [];
  while (words.length < 40) { const word = random.pick(ORIGINAL_WORDS); if (word !== words.at(-1)) words.push(word); }
  return { day, seed, text: words.join(' ') };
}
export function featuredGameIndex(day: string, count: number): number {
  if (!Number.isInteger(count) || count < 1) throw new Error('Featured game pool is empty');
  return new SeededRandom(`featured:${day}`).integer(0, count - 1);
}
