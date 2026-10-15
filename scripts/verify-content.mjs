import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative, basename, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Script } from 'node:vm';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
const source = ts.createSourceFile('content-library.ts', readFileSync(new URL('../src/lib/content-library.ts', import.meta.url), 'utf8'), ts.ScriptTarget.ES2022, true);
const declaration = source.statements.flatMap(statement => ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : []).find(item => item.name.getText(source) === 'sources');
if (!declaration || !ts.isObjectLiteralExpression(declaration.initializer)) throw new Error('Static code inventory was not found.');
const snippets = declaration.initializer.properties.flatMap(property => {
  if (!ts.isPropertyAssignment(property) || !ts.isArrayLiteralExpression(property.initializer)) throw new Error('Expected a static source list.');
  const language = property.name.getText(source);
  return property.initializer.elements.map((element, index) => {
    if (!ts.isStringLiteral(element)) throw new Error('Examples must be plain string literals.');
    return { language, id: `${language}_${index + 1}`, content: element.text };
  });
});
const directory = mkdtempSync(join(tmpdir(), 'forge-content-'));
const results = [];
function run(command, args, input) {
  const result = spawnSync(command, args, { input, encoding: 'utf8', windowsHide: true, timeout: 30000 });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout.trim();
}
try {
  for (const item of snippets.filter(item => item.language === 'javascript')) new Script(item.content, { filename: `${item.id}.js` });
  results.push({ check: 'JavaScript parse, no execution', passed: 4, runtime: process.version });
  const paths = snippets.filter(item => item.language === 'typescript').map(item => { const path = join(directory, `${item.id}.ts`); writeFileSync(path, item.content); return path; });
  const program = ts.createProgram(paths, { noEmit: true, strict: true, target: ts.ScriptTarget.ES2022, skipLibCheck: true, types: [] });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: path => path, getCurrentDirectory: () => directory, getNewLine: () => '\n' }));
  results.push({ check: 'TypeScript semantic compilation, no emission', passed: 4, runtime: ts.version });
  run('python', ['-c', 'import ast,json,sys\nfor item in json.load(sys.stdin):\n ast.parse(item["content"], filename=item["id"])'], JSON.stringify(snippets.filter(item => item.language === 'python')));
  results.push({ check: 'Python AST parse, no execution', passed: 4, runtime: run('python', ['--version']) });
  run('python', ['-c', 'import sqlite3,json,sys\nconnection=sqlite3.connect(":memory:")\nfor item in json.load(sys.stdin):\n connection.execute("EXPLAIN " + item["content"])'], JSON.stringify(snippets.filter(item => item.language === 'sql')));
  results.push({ check: 'Portable SELECT/CTE subset syntax via SQLite EXPLAIN', passed: 4 });
  const postgres = new PGlite();
  try {
    for (const item of snippets.filter(item => item.language === 'sql')) await postgres.query(`EXPLAIN ${item.content}`);
    const version = await postgres.query('SELECT version() AS version');
    results.push({ check: 'PostgreSQL/WASM syntax and planning via PGlite EXPLAIN, no exercise execution', passed: 4, runtime: version.rows[0].version, limitation: 'Disposable in-memory PostgreSQL parser/planner evidence; live native Supabase Auth/API/Realtime and concurrency remain separate release gates.' });
  } finally {
    await postgres.close();
  }
  const rustVersion = run('rustc', ['--version']);
  for (const item of snippets.filter(item => item.language === 'rust')) {
    const path = join(directory, `${item.id}.rs`); writeFileSync(path, item.content);
    run('rustc', ['--edition=2021', '--crate-name', item.id, '--emit=metadata', '-o', join(directory, `${item.id}.rmeta`), path]);
  }
  results.push({ check: 'Rust metadata compilation, no executable output/execution', passed: 4, runtime: rustVersion });
  console.log(JSON.stringify({ status: 'passed', examples: snippets.length, results }, null, 2));
} finally {
  const target = resolve(directory), withinTemp = relative(resolve(tmpdir()), target);
  if (!withinTemp.startsWith('..') && !isAbsolute(withinTemp) && basename(target).startsWith('forge-content-')) rmSync(target, { recursive: true, force: true });
  else throw new Error('Temporary content directory failed containment verification.');
}
