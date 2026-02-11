import { supabase } from '@/integrations/supabase/client';

// Extended word lists - 1000 most common English words
export const commonWords1000 = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'feel', 'find', 'tell', 'ask', 'seem', 'try', 'leave', 'call', 'keep', 'let',
  'put', 'begin', 'through', 'much', 'great', 'where', 'help', 'every', 'line', 'set',
  'own', 'under', 'read', 'last', 'never', 'run', 'around', 'form', 'small', 'place',
  'world', 'live', 'move', 'show', 'learn', 'should', 'still', 'between', 'long', 'turn',
  'high', 'large', 'must', 'name', 'number', 'group', 'always', 'while', 'might', 'many',
  'house', 'study', 'night', 'again', 'point', 'home', 'water', 'grow', 'school', 'side',
  'change', 'open', 'write', 'play', 'spell', 'air', 'such', 'right', 'away', 'say',
  'need', 'few', 'hand', 'thing', 'story', 'young', 'sort', 'kind', 'within', 'soon',
  'enough', 'close', 'start', 'along', 'city', 'carry', 'mile', 'once', 'paper', 'idea',
  'body', 'sound', 'country', 'earth', 'eye', 'face', 'head', 'food', 'father', 'mother',
  'family', 'animal', 'answer', 'order', 'stand', 'walk', 'near', 'child', 'watch', 'hard',
  'both', 'life', 'being', 'still', 'those', 'both', 'mark', 'often', 'letter', 'until',
  'mile', 'river', 'car', 'feet', 'care', 'second', 'book', 'carry', 'took', 'science',
  'eat', 'room', 'friend', 'began', 'idea', 'fish', 'mountain', 'stop', 'once', 'base',
  'hear', 'horse', 'cut', 'sure', 'watch', 'color', 'face', 'wood', 'main', 'enough',
  'plain', 'girl', 'usual', 'young', 'ready', 'above', 'ever', 'red', 'list', 'though',
  'feel', 'talk', 'bird', 'soon', 'body', 'dog', 'family', 'direct', 'leave', 'song',
  'measure', 'door', 'product', 'black', 'short', 'numeral', 'class', 'wind', 'question',
  'happen', 'complete', 'ship', 'area', 'half', 'rock', 'order', 'fire', 'south', 'problem',
  'piece', 'told', 'knew', 'pass', 'since', 'top', 'whole', 'king', 'space', 'heard',
  'best', 'hour', 'better', 'true', 'during', 'hundred', 'five', 'remember', 'step', 'early',
  'hold', 'west', 'ground', 'interest', 'reach', 'fast', 'verb', 'sing', 'listen', 'six',
  'table', 'travel', 'less', 'morning', 'ten', 'simple', 'several', 'vowel', 'toward', 'war',
  'lay', 'against', 'pattern', 'slow', 'center', 'love', 'person', 'money', 'serve', 'appear',
  'road', 'map', 'rain', 'rule', 'govern', 'pull', 'cold', 'notice', 'voice', 'unit',
  'power', 'town', 'fine', 'certain', 'fly', 'fall', 'lead', 'cry', 'dark', 'machine',
  'note', 'wait', 'plan', 'figure', 'star', 'box', 'noun', 'field', 'rest', 'correct',
  'able', 'pound', 'done', 'beauty', 'drive', 'stood', 'contain', 'front', 'teach', 'week',
  'final', 'gave', 'green', 'quick', 'develop', 'ocean', 'warm', 'free', 'minute', 'strong',
  'special', 'mind', 'behind', 'clear', 'tail', 'produce', 'fact', 'street', 'inch', 'multiply',
  'nothing', 'course', 'stay', 'wheel', 'full', 'force', 'blue', 'object', 'decide', 'surface',
  'deep', 'moon', 'island', 'foot', 'system', 'busy', 'test', 'record', 'boat', 'common',
  'gold', 'possible', 'plane', 'stead', 'dry', 'wonder', 'laugh', 'thousand', 'ago', 'ran',
  'check', 'game', 'shape', 'equate', 'miss', 'brought', 'heat', 'snow', 'tire', 'bring',
  'yes', 'distant', 'fill', 'east', 'paint', 'language', 'among', 'grand', 'ball', 'yet',
  'wave', 'drop', 'heart', 'present', 'heavy', 'dance', 'engine', 'position', 'arm', 'wide',
  'sail', 'material', 'size', 'vary', 'settle', 'speak', 'weight', 'general', 'ice', 'matter',
  'circle', 'pair', 'include', 'divide', 'syllable', 'felt', 'perhaps', 'pick', 'sudden', 'count',
  'square', 'reason', 'length', 'represent', 'art', 'subject', 'region', 'energy', 'hunt', 'probable',
  'bed', 'brother', 'egg', 'ride', 'cell', 'believe', 'fraction', 'forest', 'sit', 'race',
  'window', 'store', 'summer', 'train', 'sleep', 'prove', 'lone', 'leg', 'exercise', 'wall',
  'catch', 'mount', 'wish', 'sky', 'board', 'joy', 'winter', 'sat', 'written', 'wild',
  'instrument', 'kept', 'glass', 'grass', 'cow', 'job', 'edge', 'sign', 'visit', 'past',
  'soft', 'fun', 'bright', 'gas', 'weather', 'month', 'million', 'bear', 'finish', 'happy',
  'hope', 'flower', 'clothe', 'strange', 'gone', 'jump', 'baby', 'eight', 'village', 'meet',
  'root', 'buy', 'raise', 'solve', 'metal', 'whether', 'push', 'seven', 'paragraph', 'third',
  'shall', 'held', 'hair', 'describe', 'cook', 'floor', 'either', 'result', 'burn', 'hill',
  'safe', 'cat', 'century', 'consider', 'type', 'law', 'bit', 'coast', 'copy', 'phrase',
  'silent', 'tall', 'sand', 'soil', 'roll', 'temperature', 'finger', 'industry', 'value', 'fight',
  'lie', 'beat', 'excite', 'natural', 'view', 'sense', 'ear', 'else', 'quite', 'broke',
  'case', 'middle', 'kill', 'son', 'lake', 'moment', 'scale', 'loud', 'spring', 'observe',
  'child', 'straight', 'consonant', 'nation', 'dictionary', 'milk', 'speed', 'method', 'organ', 'pay',
  'age', 'section', 'dress', 'cloud', 'surprise', 'quiet', 'stone', 'tiny', 'climb', 'cool',
  'design', 'poor', 'lot', 'experiment', 'bottom', 'key', 'iron', 'single', 'stick', 'flat',
  'twenty', 'skin', 'smile', 'crease', 'hole', 'trade', 'melody', 'trip', 'office', 'receive',
  'row', 'mouth', 'exact', 'symbol', 'die', 'least', 'trouble', 'shout', 'except', 'wrote',
  'seed', 'tone', 'join', 'suggest', 'clean', 'break', 'lady', 'yard', 'rise', 'bad',
  'blow', 'oil', 'blood', 'touch', 'grew', 'cent', 'mix', 'team', 'wire', 'cost',
  'lost', 'brown', 'wear', 'garden', 'equal', 'sent', 'choose', 'fell', 'fit', 'flow',
  'fair', 'bank', 'collect', 'save', 'control', 'decimal', 'gentle', 'woman', 'captain', 'practice',
  'separate', 'difficult', 'doctor', 'please', 'protect', 'noon', 'whose', 'locate', 'ring', 'character',
  'insect', 'caught', 'period', 'indicate', 'radio', 'spoke', 'atom', 'human', 'history', 'effect',
  'electric', 'expect', 'crop', 'modern', 'element', 'hit', 'student', 'corner', 'party', 'supply',
  'bone', 'rail', 'imagine', 'provide', 'agree', 'thus', 'capital', 'won', 'chair', 'danger',
  'fruit', 'rich', 'thick', 'soldier', 'process', 'operate', 'guess', 'necessary', 'sharp', 'wing',
  'create', 'neighbor', 'wash', 'bat', 'rather', 'crowd', 'corn', 'compare', 'poem', 'string',
  'bell', 'depend', 'meat', 'rub', 'tube', 'famous', 'dollar', 'stream', 'fear', 'sight',
  'thin', 'triangle', 'planet', 'hurry', 'chief', 'colony', 'clock', 'mine', 'tie', 'enter',
  'major', 'fresh', 'search', 'send', 'yellow', 'gun', 'allow', 'print', 'dead', 'spot',
  'desert', 'suit', 'current', 'lift', 'rose', 'continue', 'block', 'chart', 'hat', 'sell',
  'success', 'company', 'subtract', 'event', 'particular', 'deal', 'swim', 'term', 'opposite', 'wife',
  'shoe', 'shoulder', 'spread', 'arrange', 'camp', 'invent', 'cotton', 'born', 'determine', 'quart',
  'nine', 'truck', 'noise', 'level', 'chance', 'gather', 'shop', 'stretch', 'throw', 'shine',
  'property', 'column', 'molecule', 'select', 'wrong', 'gray', 'repeat', 'require', 'broad', 'prepare',
  'salt', 'nose', 'plural', 'anger', 'claim', 'continent', 'oxygen', 'sugar', 'death', 'pretty',
  'skill', 'women', 'season', 'solution', 'magnet', 'silver', 'thank', 'branch', 'match', 'suffix',
  'especially', 'fig', 'afraid', 'huge', 'sister', 'steel', 'discuss', 'forward', 'similar', 'guide',
  'experience', 'score', 'apple', 'bought', 'led', 'pitch', 'coat', 'mass', 'card', 'band',
  'rope', 'slip', 'win', 'dream', 'evening', 'condition', 'feed', 'tool', 'total', 'basic',
  'smell', 'valley', 'nor', 'double', 'seat', 'arrive', 'master', 'track', 'parent', 'shore',
  'division', 'sheet', 'substance', 'favor', 'connect', 'post', 'spend', 'chord', 'fat', 'glad',
  'original', 'share', 'station', 'dad', 'bread', 'charge', 'proper', 'bar', 'offer', 'segment',
  'slave', 'duck', 'instant', 'market', 'degree', 'populate', 'chick', 'dear', 'enemy', 'reply',
  'drink', 'occur', 'support', 'speech', 'nature', 'range', 'steam', 'motion', 'path', 'liquid',
  'log', 'meant', 'quotient', 'teeth', 'shell', 'neck', 'cabin', 'adult', 'moment', 'scale',
  'tone', 'join', 'suggest', 'clean', 'break', 'lady', 'yard', 'rise', 'bad', 'blow',
  'oil', 'blood', 'touch', 'grew', 'cent', 'mix', 'team', 'wire', 'cost', 'lost',
  'brown', 'wear', 'garden', 'equal', 'sent', 'choose', 'fell', 'fit', 'flow', 'fair',
  'bank', 'collect', 'save', 'control', 'decimal', 'gentle', 'woman', 'captain', 'practice', 'separate',
  'difficult', 'doctor', 'please', 'protect', 'noon', 'whose', 'locate', 'ring', 'character', 'insect',
  'caught', 'period', 'indicate', 'radio', 'spoke', 'atom', 'human', 'history', 'effect', 'electric',
  'expect', 'crop', 'modern', 'element', 'hit', 'student', 'corner', 'party', 'supply', 'bone',
  'rail', 'imagine', 'provide', 'agree', 'thus', 'capital', 'won', 'chair', 'danger', 'fruit',
  'rich', 'thick', 'soldier', 'process', 'operate', 'guess', 'necessary', 'sharp', 'wing', 'create',
  'neighbor', 'wash', 'bat', 'rather', 'crowd', 'corn', 'compare', 'poem', 'string', 'bell',
  'depend', 'meat', 'rub', 'tube', 'famous', 'dollar', 'stream', 'fear', 'sight', 'thin',
  'triangle', 'planet', 'hurry', 'chief', 'colony', 'clock', 'mine', 'tie', 'enter', 'major',
  'fresh', 'search', 'send', 'yellow', 'gun', 'allow', 'print', 'dead', 'spot', 'desert',
  'suit', 'current', 'lift', 'rose', 'continue', 'block', 'chart', 'hat', 'sell', 'success',
  'company', 'subtract', 'event', 'particular', 'deal', 'swim', 'term', 'opposite', 'wife', 'shoe',
  'shoulder', 'spread', 'arrange', 'camp', 'invent', 'cotton', 'born', 'determine', 'quart', 'nine',
  'truck', 'noise', 'level', 'chance', 'gather', 'shop', 'stretch', 'throw', 'shine', 'property',
  'column', 'molecule', 'select', 'wrong', 'gray', 'repeat', 'require', 'broad', 'prepare', 'salt',
  'nose', 'plural', 'anger', 'claim', 'continent', 'oxygen', 'sugar', 'death', 'pretty', 'skill',
  'women', 'season', 'solution', 'magnet', 'silver', 'thank', 'branch', 'match', 'suffix', 'especially',
  'fig', 'afraid', 'huge', 'sister', 'steel', 'discuss', 'forward', 'similar', 'guide', 'experience',
  'score', 'apple', 'bought', 'led', 'pitch', 'coat', 'mass', 'card', 'band', 'rope',
  'slip', 'win', 'dream', 'evening', 'condition', 'feed', 'tool', 'total', 'basic', 'smell',
  'valley', 'nor', 'double', 'seat', 'arrive', 'master', 'track', 'parent', 'shore', 'division',
  'sheet', 'substance', 'favor', 'connect', 'post', 'spend', 'chord', 'fat', 'glad', 'original',
  'share', 'station', 'dad', 'bread', 'charge', 'proper', 'bar', 'offer', 'segment', 'slave',
  'duck', 'instant', 'market', 'degree', 'populate', 'chick', 'dear', 'enemy', 'reply', 'drink',
  'occur', 'support', 'speech', 'nature', 'range', 'steam', 'motion', 'path', 'liquid', 'log',
  'meant', 'quotient', 'teeth', 'shell', 'neck',
];

const advancedWords = [
  'algorithm', 'paradigm', 'synchronize', 'comprehensive', 'infrastructure',
  'methodology', 'implementation', 'architecture', 'optimization', 'abstraction',
  'encapsulation', 'polymorphism', 'inheritance', 'asynchronous', 'authentication',
  'authorization', 'configuration', 'documentation', 'specification', 'integration',
  'deployment', 'persistence', 'transaction', 'middleware', 'virtualization',
  'containerization', 'orchestration', 'microservices', 'scalability', 'reliability',
  'maintainability', 'accessibility', 'responsiveness', 'compatibility', 'interoperability',
];

const codeSnippetsLocal = {
  javascript: [
    'const greeting = "Hello, World!";',
    'function add(a, b) { return a + b; }',
    'const arr = [1, 2, 3].map(x => x * 2);',
    'const { name, age } = user;',
    'async function fetchData() { return await fetch(url); }',
    'const result = items.filter(x => x.active).map(x => x.name);',
    'export default function Component({ children }) { return <div>{children}</div>; }',
    'const [state, setState] = useState(initialValue);',
    'useEffect(() => { fetchData(); }, [dependency]);',
    'const handler = useCallback((e) => setValue(e.target.value), []);',
  ],
  python: [
    'def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)',
    'result = [x**2 for x in range(10) if x % 2 == 0]',
    'with open("file.txt", "r") as f: content = f.read()',
    'class Person: def __init__(self, name): self.name = name',
    'import pandas as pd; df = pd.DataFrame(data)',
    'async def fetch_data(): return await session.get(url)',
    'lambda x: x * 2 if x > 0 else 0',
    'try: result = func() except Exception as e: print(e)',
    'from typing import List, Dict, Optional',
    '@decorator def enhanced_function(): pass',
  ],
  typescript: [
    'interface User { id: number; name: string; email?: string; }',
    'type Status = "pending" | "active" | "completed";',
    'function identity<T>(arg: T): T { return arg; }',
    'const useCustomHook = (): [string, (val: string) => void] => {}',
    'export type Props = React.ComponentPropsWithoutRef<"div">;',
    'const assertNever = (x: never): never => { throw new Error(); };',
    'type Readonly<T> = { readonly [P in keyof T]: T[P] };',
    'interface Repository<T> { find(id: string): Promise<T>; }',
    'const enum Direction { Up, Down, Left, Right }',
    'declare module "*.svg" { const src: string; export default src; }',
  ],
  sql: [
    'SELECT * FROM users WHERE age > 18 ORDER BY name;',
    'INSERT INTO products (name, price) VALUES ("Widget", 19.99);',
    'UPDATE accounts SET balance = balance + 100 WHERE id = 1;',
    'DELETE FROM sessions WHERE expires_at < NOW();',
    'SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id;',
    'CREATE TABLE posts (id SERIAL PRIMARY KEY, title TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());',
    'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);',
    'CREATE INDEX idx_user_email ON users(email);',
    'WITH recent AS (SELECT * FROM posts WHERE created_at > NOW() - INTERVAL 7 DAY) SELECT * FROM recent;',
    'GRANT SELECT, INSERT ON products TO app_user;',
  ],
  rust: [
    'fn main() { println!("Hello, Rust!"); }',
    'let mut vec: Vec<i32> = Vec::new();',
    'match value { Some(x) => x, None => 0 }',
    'impl Iterator for Counter { type Item = u32; }',
    'struct Point<T> { x: T, y: T }',
    'fn largest<T: PartialOrd>(list: &[T]) -> &T {}',
    'use std::collections::HashMap;',
    '#[derive(Debug, Clone, PartialEq)]',
    'async fn fetch_url(url: &str) -> Result<String, Error> {}',
    'pub trait Summary { fn summarize(&self) -> String; }',
  ],
};

export async function getQuotes(): Promise<{ content: string; author: string }[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('content, author')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    // Fallback to local quotes
    return [
      { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
      { content: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
      { content: 'Life is what happens when you are busy making other plans.', author: 'John Lennon' },
    ];
  }
}

export async function getRandomQuote(): Promise<{ content: string; author: string; category?: string }> {
  const quotes = await getQuotes();
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  // Try to get category from Supabase if available
  try {
    const { data } = await supabase
      .from('quotes')
      .select('category')
      .eq('content', quote.content)
      .eq('author', quote.author)
      .maybeSingle();
    return { ...quote, category: data?.category };
  } catch {
    return quote;
  }
}

export async function getCodeSnippets(language?: string): Promise<{ content: string; language: string }[]> {
  try {
    let query = supabase.from('code_snippets').select('content, language');
    if (language) {
      query = query.eq('language', language);
    }
    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch {
    // Fallback to local snippets
    if (language && codeSnippetsLocal[language as keyof typeof codeSnippetsLocal]) {
      return codeSnippetsLocal[language as keyof typeof codeSnippetsLocal].map(content => ({ content, language }));
    }
    return Object.entries(codeSnippetsLocal).flatMap(([lang, snippets]) => 
      snippets.map(content => ({ content, language: lang }))
    );
  }
}

export function getRandomCodeSnippet(language?: string): { content: string; language: string } {
  if (language && codeSnippetsLocal[language as keyof typeof codeSnippetsLocal]) {
    const snippets = codeSnippetsLocal[language as keyof typeof codeSnippetsLocal];
    return { content: snippets[Math.floor(Math.random() * snippets.length)], language };
  }
  
  const allSnippets = Object.entries(codeSnippetsLocal).flatMap(([lang, snippets]) => 
    snippets.map(content => ({ content, language: lang }))
  );
  return allSnippets[Math.floor(Math.random() * allSnippets.length)];
}

export function generateWordList(
  count: number = 50,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  includePunctuation: boolean = false,
  includeNumbers: boolean = false
): string {
  let wordPool: string[];
  
  switch (difficulty) {
    case 'easy':
      wordPool = commonWords1000.slice(0, 200);
      break;
    case 'hard':
      wordPool = [...commonWords1000.slice(100), ...advancedWords];
      break;
    default:
      wordPool = [...commonWords1000];
  }

  const words: string[] = [];
  const punctuation = ['.', ',', '!', '?', ';', ':'];
  
  for (let i = 0; i < count; i++) {
    let word = wordPool[Math.floor(Math.random() * wordPool.length)];
    
    if (includeNumbers && Math.random() < 0.15) {
      word = Math.floor(Math.random() * 1000).toString();
    }
    
    if (includePunctuation && Math.random() < 0.2) {
      word += punctuation[Math.floor(Math.random() * punctuation.length)];
    }
    
    words.push(word);
  }

  return words.join(' ');
}

export const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
];
