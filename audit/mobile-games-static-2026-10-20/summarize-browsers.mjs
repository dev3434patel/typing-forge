import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const emptyCounts = () => ({ total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 });
const stripAnsi = value => String(value ?? "").replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
const shortMessage = value => stripAnsi(value).trim().replace(/\s+/g, " ").slice(0, 450);

function outcome(test) {
  if (test.status === "expected") return "passed";
  if (test.status === "unexpected") return "failed";
  if (test.status === "skipped") return "skipped";
  if (test.status === "flaky") return "flaky";
  const attempts = test.results ?? [];
  const last = attempts.at(-1);
  if (!last || last.status === "skipped") return "skipped";
  const expected = test.expectedStatus ?? "passed";
  if (last.status !== expected) return "failed";
  return attempts.some(result => result.status !== expected && result.status !== "skipped") ? "flaky" : "passed";
}

/** Counts reported test outcomes, without retrying tests or reading live app state. */
export function summarizeReport(report) {
  if (!report || !Array.isArray(report.suites)) throw new Error("Expected a Playwright JSON report with a suites array.");
  const totals = emptyCounts();
  const projects = new Map();
  const failures = [], flakyCases = [], skippedCases = [], expectedFailures = [];
  const visit = (suite, parents = []) => {
    const titles = suite.title ? [...parents, suite.title] : parents;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const project = test.projectName || "(unnamed project)";
        const counts = projects.get(project) ?? emptyCounts();
        projects.set(project, counts);
        const status = outcome(test);
        for (const target of [totals, counts]) { target.total++; target[status]++; }
        const identity = {
          project,
          title: [...titles, spec.title].filter(Boolean).join(" › "),
          file: spec.file ?? suite.file ?? null,
          line: spec.line ?? null,
        };
        const annotations = [...(spec.annotations ?? []), ...(test.annotations ?? [])];
        if (status === "skipped") {
          skippedCases.push({ ...identity, reasons: [...new Set(annotations
            .filter(annotation => annotation.type === "skip" || annotation.type === "fixme")
            .map(annotation => annotation.description || `${annotation.type} annotation without a description`))] });
        }
        if (status === "passed" && test.expectedStatus === "failed") expectedFailures.push(identity);
        if (status === "failed" || status === "flaky") {
          const attempts = test.results ?? [];
          const bad = attempts.filter(result => ["failed", "timedOut", "interrupted"].includes(result.status));
          const errors = bad.flatMap(result => result.errors?.length ? result.errors : result.error ? [result.error] : []);
          const detail = {
            ...identity,
            attempts: attempts.length,
            attemptStatuses: attempts.map(result => result.status),
            messages: [...new Set(errors.map(error => shortMessage(error.message || error.value || error.stack)).filter(Boolean))].slice(0, 3),
          };
          (status === "flaky" ? flakyCases : failures).push(detail);
        }
      }
    }
    for (const child of suite.suites ?? []) visit(child, titles);
  };
  for (const suite of report.suites) visit(suite);
  const reasons = new Map();
  for (const test of skippedCases) {
    for (const reason of test.reasons.length ? test.reasons : ["No skip/fixme reason was recorded in the JSON report."]) {
      const group = reasons.get(reason) ?? { reason, count: 0, projects: new Set() };
      group.count++;
      group.projects.add(test.project);
      reasons.set(reason, group);
    }
  }
  const reportedStats = report.stats ? {
    expected: report.stats.expected,
    unexpected: report.stats.unexpected,
    skipped: report.stats.skipped,
    flaky: report.stats.flaky,
  } : null;
  return {
    totals,
    projects: [...projects].sort(([a], [b]) => a.localeCompare(b)).map(([project, counts]) => ({ project, ...counts })),
    reportedStats,
    countsAgreeWithReport: reportedStats ? reportedStats.expected === totals.passed && reportedStats.unexpected === totals.failed && reportedStats.skipped === totals.skipped && reportedStats.flaky === totals.flaky : null,
    failures,
    flakyCases,
    skippedCases,
    skipReasons: [...reasons.values()].map(group => ({ ...group, projects: [...group.projects].sort() })),
    expectedFailures,
    globalErrors: (report.errors ?? []).map(error => shortMessage(error.message || error.value || error.stack)).filter(Boolean),
    scope: "Reported case outcomes only. Flaky cases remain separate from passes; skip reasons are copied from report annotations. No browser or test execution is performed.",
  };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (process.argv.length !== 3) throw new Error("Usage: node summarize-browsers.mjs <playwright-json-report>");
    const reportPath = path.resolve(process.argv[2]);
    const result = summarizeReport(JSON.parse(await readFile(reportPath, "utf8")));
    console.log(JSON.stringify({ report: reportPath, ...result }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
  }
}
