import { getContentPack, generatePackText, graphemes, seededRandom } from './content-packs';

export const CLASSIC_CONTENT_VERSION = 'sparow-classic-curated200-v1';
/** An original editorial pool, not a measured frequency ranking. */
export const classicWords = Object.freeze(getContentPack('en').words.slice(0, 200));
const blocked = new Set(['fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot']);
export function isSafeGeneratedWord(word: string): boolean { return !blocked.has(word.normalize('NFKC').toLocaleLowerCase('en')); }
export function generateClassicText(count: number, seed: string): string {
  const random = seededRandom(seed), words: string[] = [];
  const safe = classicWords.filter(isSafeGeneratedWord);
  for (let index = 0; index < Math.max(1, Math.min(1000, Math.floor(count))); index++) {
    let next = safe[Math.floor(random() * safe.length)];
    if (next === words.at(-1)) next = safe[(safe.indexOf(next) + 1) % safe.length];
    words.push(next);
  }
  return words.join(' ');
}
export function generateConfiguredWords(language: string, count: number, seed: string, options: { classic?: boolean; numbers?: boolean; punctuation?: boolean } = {}): string {
  const random = seededRandom(seed);
  const text = options.classic && language === 'en' ? generateClassicText(count, seed) : generatePackText(language, count, seed);
  return text.split(' ').map(word => options.numbers && random() < .1 ? String(Math.floor(random() * 1000)) : word + (options.punctuation && random() < .15 ? ['.', ',', '!', '?'][Math.floor(random() * 4)] : '')).join(' ');
}
export function sanitizeCustomPassage(source: string): { text: string; removedControls: number } {
  if (source.length > 10000) throw new Error('Custom passages must be10,000 characters or shorter.');
  const normalized = source.replace(/\r\n?/g, '\n').normalize('NFC');
  let removedControls = 0;
  const text = [...normalized].filter(character => {
    const code = character.codePointAt(0)!;
    if (code < 32 && code !== 9 && code !== 10 || code === 127) { removedControls++; return false; }
    return true;
  }).join('').trim();
  if (!text) throw new Error('Add a nonempty practice passage.');
  // HTML/code is retained as literal text. Rendering never uses innerHTML.
  return { text, removedControls };
}
export function passageDifficulty(text: string) {
  const words = text.trim().split(/\s+/u).filter(Boolean), units = graphemes(text);
  const letters = units.filter(unit => /\p{L}/u.test(unit));
  const rare = letters.filter(unit => /^[jqxz]$/i.test(unit)).length;
  const punctuation = units.filter(unit => /\p{P}/u.test(unit)).length;
  return { version: 'content-difficulty-v1' as const, words: words.length, graphemes: units.length, averageWordLength: words.length ? words.reduce((sum, word) => sum + graphemes(word).length, 0) / words.length : 0, englishRareLetterRatio: letters.length ? rare / letters.length : 0, punctuationDensity: units.length ? punctuation / units.length : 0 };
}
