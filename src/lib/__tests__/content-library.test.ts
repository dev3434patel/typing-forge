import { describe, expect, it } from 'vitest';
import { Script } from 'node:vm';
import ts from 'typescript';
import { CODE_SNIPPETS, curatedCommonWords, getCodeSnippets, getRandomCodeSnippet, generateWordList } from '../content-library';
import { quotes } from '../quotes';

describe('Original licensed content inventory', () => {
  it('uses unique curated vocabulary with no advertised unsupported list size', () => {
    expect(curatedCommonWords.length).toBeGreaterThan(200);
    expect(new Set(curatedCommonWords).size).toBe(curatedCommonWords.length);
    expect(generateWordList(30, 'medium', true, true, 'same')).toBe(generateWordList(30, 'medium', true, true, 'same'));
  });
  it('records authored passage identity, source, revision and license', () => {
    expect(quotes.length).toBeGreaterThanOrEqual(10);
    expect(new Set(quotes.map(quote => quote.id)).size).toBe(quotes.length);
    expect(quotes.every(quote => quote.author === 'SparowType' && quote.license === 'CC0-1.0' && quote.source && quote.revision)).toBe(true);
  });
  it('has stable code IDs, source/revision, explicit program/query classification and SQL dialect', async () => {
    expect(CODE_SNIPPETS).toHaveLength(20);
    expect(new Set(CODE_SNIPPETS.map(snippet => snippet.id)).size).toBe(20);
    for (const snippet of CODE_SNIPPETS) {
      expect(snippet.content.length).toBeGreaterThan(20);
      expect(snippet.revision).toBeTruthy(); expect(snippet.author).toBe('SparowType'); expect(snippet.license).toBe('CC0-1.0');
      expect(snippet.kind).toBe(snippet.language === 'sql' ? 'standalone-query' : 'complete-program');
      if (snippet.language === 'sql') expect(snippet.dialect).toContain('PostgreSQL');
    }
    expect(await getCodeSnippets('python')).toHaveLength(4);
    expect(getRandomCodeSnippet('rust', 'same')).toEqual(getRandomCodeSnippet('rust', 'same'));
  });
  for (const snippet of CODE_SNIPPETS.filter(item => item.language === 'javascript')) it(`parses ${snippet.id} without executing it`, () => {
    expect(() => new Script(snippet.content, { filename: `${snippet.id}.js` })).not.toThrow();
  });
  for (const snippet of CODE_SNIPPETS.filter(item => item.language === 'typescript')) it(`parses ${snippet.id} with the TypeScript compiler`, () => {
    const result = ts.transpileModule(snippet.content, { fileName: `${snippet.id}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2022, strict: true }, reportDiagnostics: true });
    expect(result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)).toEqual([]);
  });
});
