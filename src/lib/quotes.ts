import { curatedCommonWords } from './content-library';
export interface Quote {
  id: string;
  text: string;
  author: string;
  category: 'literature' | 'tech' | 'motivational' | 'philosophy' | 'science' | 'mixed';
  source: string;
  license: string;
  revision: string;
}
/** Original practice passages, not quotations attributed to public figures. */
const passages: { text: string; category: Quote['category'] }[] = [
  { text: 'The window opened onto a quiet garden. Beyond the silver leaves, the morning light gathered slowly on the path.', category: 'literature' },
  { text: 'A steady rhythm begins with a clear intention. Give each movement the attention it needs, and let the next one follow.', category: 'motivational' },
  { text: 'Readable code leaves a trail of small decisions. A useful name and a simple boundary can make the next change easier.', category: 'tech' },
  { text: 'Learning is a conversation between effort and evidence. Notice what happened, choose one adjustment, and try again.', category: 'philosophy' },
  { text: 'Rain gathers in a thousand small places before it becomes a river. Each drop follows the shape of the ground beneath it.', category: 'science' },
  { text: 'The workshop was warm with afternoon sun. A pencil, a folded plan, and a careful pair of hands were enough to begin.', category: 'literature' },
  { text: 'Speed grows from movements you can repeat with care. A calm minute of deliberate practice is a useful place to start.', category: 'motivational' },
  { text: 'A reliable system makes its state easy to understand. It tells you what succeeded, what needs attention, and what can be tried again.', category: 'tech' },
  { text: 'An unanswered question can be a good companion. Carry it into the next experiment, and leave room for an unexpected result.', category: 'philosophy' },
  { text: 'The moon reflects a light that has already crossed the space between worlds. Its quiet glow reaches the water and returns to the sky.', category: 'science' },
  { text: 'Along the narrow lane, the baker arranged fresh loaves beside the door. The town was only beginning to wake.', category: 'literature' },
  { text: 'Set a small goal that you can observe. Finish the work, read the evidence, and decide which step deserves your attention next.', category: 'motivational' },
];
export const quotes: Quote[] = passages.map((passage, index) => ({ ...passage, id: `forge-passage-${index + 1}`, author: 'SparowType', source: 'Original SparowType practice passage', license: 'CC0-1.0', revision: 'forge-passages-2026.10.15' }));
export const commonWords = curatedCommonWords;
export type QuoteLength = 'short' | 'medium' | 'long';
export function getRandomQuote(seed?: string, length: QuoteLength = 'short'): Quote {
  let hash = 0;
  if (seed === undefined) hash = Math.floor(Math.random() * quotes.length);
  else for (const char of seed) hash = (Math.imul(hash, 31) + char.codePointAt(0)!) >>> 0;
  const start = hash % quotes.length;
  const count = length === 'long' ? 4 : length === 'medium' ? 2 : 1;
  if (count === 1) return quotes[start];
  return {
    ...quotes[start],
    id: `forge-passage-${length}-${start + 1}`,
    text: Array.from({length: count}, (_, offset) => quotes[(start + offset) % quotes.length].text).join(' '),
    category: 'mixed',
    source: 'Original SparowType practice passages',
    revision: `${quotes[start].revision}:joined-v1`,
  };
}
export function generateRandomWords(count: number, includePunctuation = false, includeNumbers = false): string {
  const punctuation = ['.', ',', '!', '?', ';', ':'];
  return Array.from({ length: Math.max(1, Math.min(2000, Math.floor(count) || 1)) }, () => {
    let word = curatedCommonWords[Math.floor(Math.random() * curatedCommonWords.length)];
    if (includeNumbers && Math.random() < 0.1) word = Math.floor(Math.random() * 1000).toString();
    if (includePunctuation && Math.random() < 0.15) word += punctuation[Math.floor(Math.random() * punctuation.length)];
    return word;
  }).join(' ');
}
