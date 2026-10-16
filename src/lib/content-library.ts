import { getContentPack, seededRandom } from './content-packs';

/** Original unique vocabulary, intentionally named without an unsupported size claim. */
export const curatedCommonWords = [...getContentPack('en').words];
/** @deprecated Use curatedCommonWords. Kept for route/API compatibility. */
export const commonWords1000 = curatedCommonWords;
const advancedWords = ['algorithm', 'paradigm', 'synchronize', 'comprehensive', 'infrastructure', 'methodology', 'implementation', 'architecture', 'optimization', 'abstraction', 'encapsulation', 'polymorphism', 'inheritance', 'asynchronous', 'authentication', 'authorization', 'configuration', 'documentation', 'specification', 'integration', 'deployment', 'persistence', 'transaction', 'middleware', 'virtualization', 'containerization', 'orchestration', 'scalability', 'reliability', 'maintainability', 'accessibility', 'responsiveness', 'compatibility', 'interoperability'];
export type CodeLanguage = 'javascript' | 'typescript' | 'python' | 'rust' | 'sql';
export interface CodeSnippet {
  id: string;
  content: string;
  language: CodeLanguage;
  revision: string;
  kind: 'complete-program' | 'standalone-query';
  dialect?: string;
  author: string;
  license: string;
}
const sources: Record<CodeLanguage, readonly string[]> = {
  javascript: [
    'function sum(values) {\n  return values.reduce((total, value) => total + value, 0);\n}\nconsole.log(sum([2, 4, 6]));',
    'const words = ["calm", "clear", "steady"];\nconst lengths = words.map(word => word.length);\nconsole.log(lengths.join(", "));',
    'function countLetters(text) {\n  const counts = new Map();\n  for (const letter of text) {\n    counts.set(letter, (counts.get(letter) || 0) + 1);\n  }\n  return counts;\n}',
    'class PracticeTimer {\n  constructor(seconds) { this.seconds = seconds; }\n  tick() { this.seconds = Math.max(0, this.seconds - 1); }\n}\nconst timer = new PracticeTimer(30);\ntimer.tick();',
  ],
  typescript: [
    'interface Lesson {\n  id: string;\n  duration: number;\n}\nfunction totalDuration(lessons: Lesson[]): number {\n  return lessons.reduce((sum, lesson) => sum + lesson.duration, 0);\n}',
    'type Result<T> = { ok: true; value: T } | { ok: false; reason: string };\nfunction first<T>(values: T[]): Result<T> {\n  return values.length ? { ok: true, value: values[0] } : { ok: false, reason: "Empty" };\n}',
    'function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Partial<Record<K, T[]>> {\n  const groups: Partial<Record<K, T[]>> = {};\n  for (const item of items) {\n    const name = key(item);\n    (groups[name] ??= []).push(item);\n  }\n  return groups;\n}',
    'type Theme = "dark" | "light";\nconst labels: Record<Theme, string> = { dark: "Sparow Dark", light: "Sparow Light" };\nfunction themeLabel(theme: Theme): string {\n  return labels[theme];\n}',
  ],
  python: [
    'def fibonacci(count):\n    values = []\n    current, following = 0, 1\n    for _ in range(count):\n        values.append(current)\n        current, following = following, current + following\n    return values',
    'class PracticeTimer:\n    def __init__(self, seconds):\n        self.seconds = seconds\n\n    def tick(self):\n        self.seconds = max(0, self.seconds - 1)',
    'def average(values):\n    if not values:\n        raise ValueError("At least one value is required")\n    return sum(values) / len(values)\n\ntry:\n    result = average([10, 20, 30])\nexcept ValueError as error:\n    result = str(error)',
    'def count_letters(text):\n    counts = {}\n    for letter in text:\n        counts[letter] = counts.get(letter, 0) + 1\n    return counts\n\nwords = [word.strip() for word in "calm clear steady".split()]',
  ],
  rust: [
    'fn main() {\n    let values = vec![2, 4, 6];\n    let total: i32 = values.iter().sum();\n    println!("Total: {}", total);\n}',
    'fn first_even(values: &[i32]) -> Option<i32> {\n    values.iter().copied().find(|value| value % 2 == 0)\n}\nfn main() {\n    println!("{:?}", first_even(&[1, 3, 8]));\n}',
    'struct Lesson {\n    name: String,\n    seconds: u32,\n}\nfn main() {\n    let lesson = Lesson { name: String::from("Home row"), seconds: 30 };\n    println!("{}: {}s", lesson.name, lesson.seconds);\n}',
    'fn main() {\n    let words = ["calm", "clear", "steady"];\n    let lengths: Vec<usize> = words.iter().map(|word| word.len()).collect();\n    for length in lengths {\n        println!("{}", length);\n    }\n}',
  ],
  sql: [
    "SELECT upper('sparowtype') AS title;",
    'WITH samples(number) AS (VALUES (1), (2), (3))\nSELECT number, number * number AS square\nFROM samples\nORDER BY number;',
    "WITH practice(day, minutes) AS (VALUES ('Monday', 10), ('Tuesday', 12))\nSELECT SUM(minutes) AS total_minutes\nFROM practice;",
    'WITH scores(wpm, accuracy) AS (VALUES (42, 98), (55, 96), (38, 99))\nSELECT wpm, accuracy\nFROM scores\nWHERE accuracy >= 97\nORDER BY wpm DESC;',
  ],
};
export const CODE_SNIPPETS: readonly CodeSnippet[] = Object.entries(sources).flatMap(([language, contents]) => contents.map((content, index) => ({ id: `forge-${language}-${index + 1}`, content, language: language as CodeLanguage, revision: 'sparow-code-2026.10.16', kind: language === 'sql' ? 'standalone-query' as const : 'complete-program' as const, ...(language === 'sql' ? { dialect: 'PostgreSQL 15+ (portable SELECT/CTE subset)' } : {}), author: 'SparowType', license: 'CC0-1.0' })));
export async function getQuotes(): Promise<{ content: string; author: string; source: string; license: string }[]> {
  const { quotes } = await import('./quotes');
  return quotes.map(quote => ({ content: quote.text, author: quote.author, source: quote.source, license: quote.license }));
}
export async function getRandomQuote(): Promise<{ content: string; author: string; category?: string; id: string; revision: string; source: string; license: string }> {
  const { getRandomQuote: localQuote } = await import('./quotes');
  const quote = localQuote();
  return { content: quote.text, author: quote.author, category: quote.category, id: quote.id, revision: quote.revision, source: quote.source, license: quote.license };
}
export async function getCodeSnippets(language?: string): Promise<CodeSnippet[]> {
  return CODE_SNIPPETS.filter(snippet => !language || snippet.language === language).map(snippet => ({ ...snippet }));
}
export function getRandomCodeSnippet(language?: string, seed?: string): CodeSnippet {
  const pool = CODE_SNIPPETS.filter(snippet => !language || snippet.language === language);
  const choices = pool.length ? pool : CODE_SNIPPETS;
  const random = seed === undefined ? Math.random : seededRandom(seed);
  return { ...choices[Math.floor(random() * choices.length)] };
}
export function generateWordList(count = 50, difficulty: 'easy' | 'medium' | 'hard' = 'medium', includePunctuation = false, includeNumbers = false, seed?: string): string {
  const random = seed === undefined ? Math.random : seededRandom(seed);
  const wordPool = difficulty === 'hard' ? [...new Set([...curatedCommonWords.filter(word => word.length > 4), ...advancedWords])] : difficulty === 'easy' ? curatedCommonWords.filter(word => word.length <= 4) : curatedCommonWords;
  const punctuation = ['.', ',', '!', '?', ';', ':'];
  return Array.from({ length: Math.max(1, Math.min(2000, Math.floor(count) || 1)) }, () => {
    let word = wordPool[Math.floor(random() * wordPool.length)];
    if (includeNumbers && random() < 0.15) word = Math.floor(random() * 1000).toString();
    if (includePunctuation && random() < 0.2) word += punctuation[Math.floor(random() * punctuation.length)];
    return word;
  }).join(' ');
}
export const CODE_LANGUAGES = [{ value: 'javascript', label: 'JavaScript' }, { value: 'typescript', label: 'TypeScript' }, { value: 'python', label: 'Python' }, { value: 'rust', label: 'Rust' }, { value: 'sql', label: 'SQL (PostgreSQL)' }];
