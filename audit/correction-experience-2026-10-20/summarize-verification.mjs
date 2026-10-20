import { readFile, writeFile } from 'node:fs/promises';
const directory = 'audit/correction-experience-2026-10-20';
const read = async name => JSON.parse((await readFile(`${directory}/${name}`, 'utf8')).replace(/^\uFEFF/, ''));
const summaries = [];
const coverage = new Map();
const sourceBuild = await read('source-build.json');
const initialBuild = await read('source-build-initial.json');
for (const name of ['regressions.json', 'correction-flows.json', 'correction-confirmation.json', 'final-acceptance.json']) {
  let report;
  try { report = await read(name); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  const cases = [];
  const walk = suites => {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
        cases.push({ file: spec.file, title: spec.title, project: test.projectName, status: test.status,
          errors: test.results.flatMap(result => result.errors ?? []).map(error => error.message?.replace(/\u001b\[[0-9;]*m/g, '').slice(0, 1800)) });
        const key = JSON.stringify([spec.file, spec.title, test.projectName]);
        const existing = coverage.get(key);
        coverage.set(key, { ...cases.at(-1), passed: existing?.passed || test.status === 'expected' });
      }
      walk(suite.suites);
    }
  };
  walk(report.suites);
  summaries.push({ report: name, buildVersion: name === 'final-acceptance.json' ? sourceBuild.local.version : initialBuild.local.version, stats: report.stats, cases: cases.length,
    byProject: Object.fromEntries([...new Set(cases.map(test => test.project))].map(project => [project, {
      passed: cases.filter(test => test.project === project && test.status === 'expected').length,
      failed: cases.filter(test => test.project === project && test.status === 'unexpected').length,
      skipped: cases.filter(test => test.project === project && test.status === 'skipped').length }])),
    failed: cases.filter(test => test.status !== 'expected' && test.status !== 'skipped') });
}
const unitLog = await readFile(`${directory}/unit-tests.log`, 'utf8');
const finalMobile = await read('mobile-results-final.json').catch(error => { if (error.code === 'ENOENT') return null; throw error; });
const summary = { capturedAt: new Date().toISOString(), build: sourceBuild, initialBuild,
  unitSuite: { files: Number(unitLog.match(/Test Files\s+(\d+) passed/)?.[1]), tests: Number(unitLog.match(/Tests\s+(\d+) passed/)?.[1]) },
  phpReplay: await read('php-replay-parity.json'), phpCourse: await read('php-course-assessment.json'),
  mobileInitial: await read('mobile-results.json'), mobile: finalMobile,
  typing: { unthrottled: await read('typing-unthrottled.json'), throttled: await read('typing-throttled.json') },
  hostingPackage: await read('hosting-package.json'), browsers: summaries,
  combinedBrowserCoverage: { uniqueCases: coverage.size, confirmedCases: [...coverage.values()].filter(test => test.passed).length,
    unconfirmed: [...coverage.values()].filter(test => !test.passed),
    method: 'Exploratory union by file, test title and project across recorded builds. Initial failures remain in the individual receipts. Only final-acceptance.json describes the final focus fix; this union is not a claim that all cases ran on the final build or that an earlier combined run passed.' } };
await writeFile(`${directory}/verification-summary.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ build: summary.build.local.version, coverage: summary.combinedBrowserCoverage, browsers: summaries.map(({ failed, ...record }) => ({ ...record, failed: failed.map(test => ({ file: test.file, title: test.title, project: test.project })) })) }, null, 2));
