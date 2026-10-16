"""Build the current audit from completed, preserved local evidence."""
from pathlib import Path
from statistics import median
from datetime import datetime, timezone
import hashlib
import json
import math
import re

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent


def read(name):
    return json.loads((HERE / name).read_text(encoding="utf-8-sig"))


def cases(suites, inherited=""):
    found = []
    for suite in suites:
        file = suite.get("file", inherited)
        for spec in suite.get("specs", []):
            for case in spec.get("tests", []):
                found.append((file, spec["title"], case))
        found.extend(cases(suite.get("suites", []), file))
    return found


def outcome(report):
    stats = report["stats"]
    return f"{stats['expected']} passed / {stats['skipped']} skipped / {stats['unexpected']} failed / {stats['flaky']} flaky"


def skip_notes(report):
    notes = []
    for file, title, case in cases(report["suites"]):
        if case.get("status") == "skipped":
            reasons = "; ".join(a.get("description", "") for a in case.get("annotations", []) if a.get("type") in {"skip", "fixme"})
            notes.append(f"- `{file}` / {title}: **UNVERIFIED** — {reasons or 'No reason recorded.'}")
    return "\n".join(notes) or "No skipped cases."


def validate_controlled_lighthouse(build, scores, paint_summary):
    """Require the declared fixed set and recorded conditions, never favorable host values."""
    protocol = read("lighthouse-release-protocol.json")
    expected_fields = {
        "kind": "controlled-fixed-quiet", "quietBeforeEachRunSeconds": 30,
        "runCount": 3, "repeats": 3, "automaticRetries": 0,
        "normalLighthouse": True, "qualityChanges": False, "scoreFiltering": False,
        "freshProfilePerRun": True, "ownedBrowserWorkloadsClosedBeforeSet": True,
        "storageReset": True, "buildIdentity": build,
    }
    if any(protocol.get(key) != value for key, value in expected_fields.items()):
        raise RuntimeError("The final Lighthouse set lacks its predeclared fixed-quiet, unchanged-quality protocol.")
    flags = ["--chrome-flags=--headless=new --no-sandbox", "--output=json", "--output=html", "--only-categories=performance,accessibility,best-practices,seo", "--quiet"]
    if protocol.get("cliArguments") != flags or protocol.get("flags") != flags or protocol.get("url") != "http://127.0.0.1:4175/":
        raise RuntimeError("The final Lighthouse command differs from the normal unfiltered mobile command.")

    def utc(value):
        if not isinstance(value, str):
            raise RuntimeError("A controlled Lighthouse timestamp is missing.")
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as error:
            raise RuntimeError("A controlled Lighthouse timestamp is malformed.") from error
        if parsed.tzinfo is None or parsed.utcoffset() != timezone.utc.utcoffset(parsed):
            raise RuntimeError("Controlled Lighthouse timestamps must explicitly identify UTC.")
        return parsed

    def number(value):
        return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

    def metric(value):
        return value == "unavailable" or number(value) and value >= 0

    declared = utc(protocol.get("declaredAtUtc"))
    previous_end = declared
    hosts = []
    for index, report in enumerate(scores, 1):
        row = next(entry for entry in paint_summary if entry["run"] == index)
        name = f"lighthouse-control-host-{index}.json"
        if row.get("hostMetadata") != name:
            raise RuntimeError(f"Lighthouse repeat {index} lacks its unique host-record link.")
        host = read(name)
        if host.get("run") != index or host.get("buildIdentity") != build or host.get("cliExitCode") != 0 or host.get("requestedQuietPeriodMs") != 30000:
            raise RuntimeError(f"Lighthouse repeat {index} lacks a successful fixed-build, fixed-quiet execution record.")
        if not number(host.get("quietElapsedMs")) or host["quietElapsedMs"] < 30000:
            raise RuntimeError(f"Lighthouse repeat {index} did not record the full predeclared quiet interval.")
        for stage in ["buildCheckBeforeRun", "buildCheckAfterRun"]:
            if host.get(stage) != {"local": build, "served": build}:
                raise RuntimeError(f"Lighthouse repeat {index} changed local/served build around its actual run.")
        moments = []
        for stage in ["beforeQuiet", "beforeRun", "afterRun"]:
            snapshot = host.get(stage)
            if not isinstance(snapshot, dict):
                raise RuntimeError(f"Lighthouse repeat {index} lacks its {stage} host snapshot.")
            moments.append(utc(snapshot.get("timestampUtc")))
            groups = {
                "cpu": ["totalPercent"],
                "memory": ["totalPhysicalBytes", "freePhysicalBytes", "availableBytes", "committedBytes", "commitLimitBytes"],
                "paging": ["pageFaultsPerSecond", "pageReadsPerSecond", "pagesInputPerSecond", "pagesOutputPerSecond"],
            }
            for group, fields in groups.items():
                values = snapshot.get(group, {})
                if values.get("status") not in {"available", "unavailable"} or any(key not in values or not metric(values[key]) for key in fields):
                    raise RuntimeError(f"Lighthouse repeat {index} {stage} has missing or invalid {group} counters; unavailable counters must be explicit.")
            browsers = snapshot.get("lighthouseBrowsers", {})
            if browsers.get("status") != "available" or browsers.get("matchingCount") != 0 or browsers.get("processes") != [] or not browsers.get("scope"):
                raise RuntimeError(f"Lighthouse repeat {index} {stage} does not verify closed owned Lighthouse-profile browser processes.")
        if not previous_end <= moments[0] <= moments[1] <= utc(report.get("fetchTime")) <= moments[2] or (moments[1] - moments[0]).total_seconds() < 30:
            raise RuntimeError(f"Lighthouse repeat {index} has inconsistent declaration/quiet/run chronology.")
        previous_end = moments[2]
        settings = report.get("configSettings", {})
        if settings.get("formFactor") != "mobile" or settings.get("throttlingMethod") != "simulate" or settings.get("disableStorageReset") is not False or settings.get("onlyCategories") != ["performance", "accessibility", "best-practices", "seo"] or settings.get("onlyAudits") or settings.get("skipAudits") or settings.get("blockedUrlPatterns"):
            raise RuntimeError(f"Lighthouse repeat {index} changed its normal mobile/storage/audit scope.")
        if settings.get("throttling", {}).get("cpuSlowdownMultiplier") != 4 or settings.get("screenEmulation", {}).get("mobile") is not True or settings.get("screenEmulation", {}).get("disabled") is not False or report.get("requestedUrl") != protocol["url"] or report.get("lighthouseVersion") != protocol.get("lighthouseVersion"):
            raise RuntimeError(f"Lighthouse repeat {index} changed its normal tool/emulation/CPU configuration.")
        benchmark = report.get("environment", {}).get("benchmarkIndex", "unavailable")
        if benchmark is None:
            benchmark = "unavailable"
        if not metric(benchmark) or host.get("benchmarkIndex") != benchmark or row.get("benchmarkIndex") != benchmark:
            raise RuntimeError(f"Lighthouse repeat {index} host benchmark does not match its raw Lighthouse report.")
        for key, category in [("performance", "performance"), ("accessibility", "accessibility"), ("bestPractices", "best-practices"), ("seo", "seo")]:
            if row.get(key) != round(report["categories"][category]["score"] * 100):
                raise RuntimeError(f"Lighthouse repeat {index} category summary differs from its raw report.")
        hosts.append({"run": index, "evidence": name, "quietElapsedMs": host["quietElapsedMs"], "benchmarkIndex": benchmark, "cliExitCode": host["cliExitCode"]})
    return protocol, hosts


def validate_startup_ownership(receipts, label):
    payload = next((row["attachments"]["five-native-worker-reload-cycles"] for row in receipts if row.get("status") == "passed" and "five-native-worker-reload-cycles" in row.get("attachments", {})), None)
    if not payload or payload.get("scope") != "Native startup ownership, including pending GPU preparation":
        raise RuntimeError(f"{label} lacks the explicit native startup-ownership receipt.")
    initial = payload.get("initialOwnership", {})
    config = initial.get("configuration", {})
    if any(initial.get(key) != 1 for key in ["nativePublished", "liveWorkers", "maximumLive"]) or config.get("type") != "initialize" or config.get("lowPower") is not False or config.get("finePointer") is not True:
        raise RuntimeError(f"{label} lacks an actual initialized/published single desktop native owner.")
    cycles = payload.get("cycles", [])
    if len(cycles) != 5 or payload.get("maximumLive") != 1 or sorted(row.get("sequence") for row in payload.get("started", [])) != list(range(1, 7)) or sorted(row.get("sequence") for row in payload.get("closed", [])) != list(range(1, 7)):
        raise RuntimeError(f"{label} lacks all five reloads, six actual native starts/closures or maximum-one ownership.")
    for index, cycle in enumerate(cycles, 1):
        records = cycle.get("records", [])
        if cycle.get("reload") != index or cycle.get("priorWorkersClosed") != index or cycle.get("liveWorkers") != 1 or len(records) != 1 or not any(message.get("type") == "initialize" for message in records[0].get("sent", [])):
            raise RuntimeError(f"{label} reload {index} lacks the expected initialized, exclusively owned native worker.")
    # This receipt deliberately proves lifetime/ownership, not a PBR draw. Full
    # renderer readiness remains a separate unchanged browser acceptance case.


def prepare_checkpoint_promotions(build, performance, edge, worker, caret, observers, geometry, unit_count, file_count, bundle):
    """Prepare public summaries only after main has validated every final gate."""
    marker = "performance-polish-current"
    checkpoint = f"""<!-- {marker}:start -->
**Current local verification — 16 October 2026 UTC:** build `{build['version']}`; **{unit_count} unit tests / {file_count} files passed**; complete installed Edge **{outcome(edge)}**. Three normal first-visit mobile Lighthouse repeats scored **{' / '.join(map(str, performance))}** for performance, with accessibility, best practices and SEO recorded in the [current audit](docs/PERFORMANCE_POLISH_AUDIT_2026-10-16.md). The actual trace confirms the renderer request followed useful paint in each repeat. Hosted credentials, physical devices, desktop animation smoothness and field INP remain **UNVERIFIED**; skipped checks are not passes. This is a local working tree, not a published release.
<!-- {marker}:end -->"""
    readme_path = ROOT / "README.md"
    readme = readme_path.read_text(encoding="utf-8")
    readme = re.sub(rf"<!-- {marker}:start -->.*?<!-- {marker}:end -->\s*", "", readme, flags=re.S)
    readme = readme.replace("[The current research and audit](docs/KEYBOARD_AWAKENS_PRODUCT_AUDIT_2026-10-16.md)", "[The current performance and verification audit](docs/PERFORMANCE_POLISH_AUDIT_2026-10-16.md)")
    readme = readme.replace("npm run test:coverage\n", "npm run test:coverage -- --maxWorkers=2\n")
    if readme.count("## What changed in v3") != 1:
        raise RuntimeError("README promotion anchor changed; review it before publishing summaries.")
    readme = readme.replace("## What changed in v3", checkpoint + "\n\n## What changed in v3", 1)

    ledger_path = ROOT / "docs/IMPLEMENTATION_STATUS.md"
    ledger = ledger_path.read_text(encoding="utf-8")
    ledger = re.sub(rf"<!-- {marker}:start -->.*?<!-- {marker}:end -->\s*", "", ledger, flags=re.S)
    if not ledger.startswith("# SparowType v3 — implementation and verification\n"):
        raise RuntimeError("Implementation-ledger promotion anchor changed; review it before publishing summaries.")
    ledger = ledger.replace("## Keyboard Awakens — current local checkpoint, 16 October 2026", "## Keyboard Awakens — retained earlier checkpoint, 16 October 2026", 1)
    current = f"""<!-- {marker}:start -->
## Performance polish — current local checkpoint, 16 October 2026 UTC

The [current complete audit](PERFORMANCE_POLISH_AUDIT_2026-10-16.md) supersedes the retained checkpoint below. Earlier failures keep their original reports and identities.

- Final local public build **`{build['version']}`**: {build['publicFiles']} precached files / {build['bytes']:,} public bytes. Compressed JS: {bundle['bootstrapJsGzipBytes']:,} bytes opening bootstrap, {bundle['initialPracticeJsGzipBytes']:,} bytes complete practice graph, {bundle['introDeferredJsGzipBytes']:,} bytes shared deferred renderer graph. No commit or deployment is claimed.
- Source gates: **{unit_count} unit tests / {file_count} files passed**, full TypeScript, build, scoped coverage, content and local database/dependency gates. Coverage used `--maxWorkers=2`, changing concurrency only and retaining the same cases/assertions. An incomplete prior combined revalidation remains recorded; its unfinished coverage/build was not treated as a pass. ESLint retains **0 errors / 9 Fast Refresh warnings**.
- Complete installed Edge: **{outcome(edge)}**. Chromium recovery/typing subset: **{outcome(worker)}**. Separate Chromium/Edge caret-readiness confirmation: **{outcome(caret)}**. Credential-dependent skipped cases remain **UNVERIFIED**; this is not a new complete Firefox/WebKit/native-device matrix.
- Separate Chromium/Edge typing-observer confirmation: **{outcome(observers)}**; actual-character caret geometry: **{outcome(geometry)}**. Each report has matching local/served identities, actual process exit and native receipts.
- Three normal first-visit mobile Lighthouse performance repeats: **{' / '.join(map(str, performance))}**, median **{median(performance):g}**. Every repeat has its own matching build identity, and actual traces place the scene request after observed first contentful paint. Raw nonzero CLS and the other category scores are recorded in the audit; literal zero CLS and field INP are not claimed.
- The full 61-key front-view model retains configured detail/effects, with an engraved wordmark visible from initial HTML and separate responsive no-JS recovery styling. The real caret-target readiness race was repaired with bounded observation/cancellation. Desktop hardware smoothness, physical devices, assistive-technology journeys and universal zero-leak claims remain **UNVERIFIED**.
- Caret geometry uses the paragraph viewport's `dir` for its leading edge. Simple RTL/LTR cases are checked; mixed Arabic/Latin/digit insertion semantics and full native Unicode bidi conformance remain **UNVERIFIED**.
- Both final Chromium typing benchmarks pass the finite lab gate of at least 200 observed correct-character WPM and observed event p98 below 100 ms, with exact final text, attempts/accuracy and real portrait-to-landscape retention recorded in the current audit. The observed maximum is disclosed separately; maximum latency below 100 ms and field INP are not claimed. Scoring/storage stay `forge-v3`; existing metric-policy differences and hosted/native release gates remain explicit.

The earlier Keyboard Awakens numbers below are historical evidence, including its failed mobile-performance gate and interrupted Edge attempt. They do not describe this promoted build.
<!-- {marker}:end -->
"""
    heading, remainder = ledger.split("\n", 1)
    ledger = heading + "\n\n" + current + "\n" + remainder.lstrip("\n")
    return {readme_path: readme, ledger_path: ledger}


def main():
    build = read("final-build-identity.json")
    for name in ["lighthouse-release-build.json", *[f"lighthouse-release-{number}-build.json" for number in (1, 2, 3)]]:
        if build != read(name):
            raise RuntimeError(f"Final build differs from {name}; do not publish this audit.")
    edge = read("edge-complete.json")
    worker = read("worker-chromium-ownership-final.json")
    caret = read("caret-readiness-confirmation.json")
    observers = read("typing-observer-confirmation.json")
    geometry = read("geometry-confirmation.json")
    scores = [read(f"lighthouse-mobile-release-{i}.report.json") for i in (1, 2, 3)]
    paint_summary = read("lighthouse-release-results.json")
    if len(paint_summary) != 3 or sorted(item.get("run") for item in paint_summary) != [1, 2, 3]:
        raise RuntimeError("Per-repeat paint evidence is incomplete or duplicated.")
    controlled_protocol, controlled_hosts = validate_controlled_lighthouse(build, scores, paint_summary)
    performance = [round(item["categories"]["performance"]["score"] * 100) for item in scores]
    lh_rows = []
    for number, item in enumerate(scores, 1):
        audits = item["audits"]
        categories = " / ".join(str(round(item["categories"][key]["score"] * 100)) for key in ["performance", "accessibility", "best-practices", "seo"])
        observed_fcp = audits["metrics"]["details"]["items"][0].get("observedFirstContentfulPaint")
        requests = [entry.get("rendererStartTime") for entry in audits["network-requests"]["details"]["items"] if "/keyboard-scene-bridge-" in entry.get("url", "")]
        if not requests or any(not isinstance(value, (int, float)) or not math.isfinite(value) for value in [observed_fcp, *requests]):
            raise RuntimeError(f"Lighthouse repeat {number} lacks actual paint/scene-request timestamps.")
        bridge_start = min(requests)
        recorded = next(entry for entry in paint_summary if entry["run"] == number)
        if bridge_start <= observed_fcp or recorded.get("sceneStartsAfterObservedPaint") is not True or abs(recorded["observedFcpMs"] - observed_fcp) > 0.001 or abs(recorded["sceneBridgeRequestMs"] - bridge_start) > 0.001:
            raise RuntimeError(f"Lighthouse repeat {number} does not prove the recorded scene request followed useful paint.")
        if recorded.get("performance") != performance[number - 1]:
            raise RuntimeError(f"Lighthouse repeat {number} summary score differs from its raw report.")
        lh_rows.append(f"| {number} | {categories} | {audits['first-contentful-paint']['displayValue']} | {audits['largest-contentful-paint']['displayValue']} | {audits['total-blocking-time']['displayValue']} | {audits['cumulative-layout-shift']['numericValue']:.12g} | {observed_fcp:g} → {bridge_start:.1f} ms | [Report {number}](../audit/performance-polish-2026-10-16/lighthouse-mobile-release-{number}.report.html) |")
    bundle = read("bundle-final.json")
    checks = read("final-source-checks.json")
    required_checks = {"typecheck", "lint", "unitCoverage", "build", "bundle", "database", "content", "productionDependencyAudit", "faviconPixelComparison"}
    if not required_checks.issubset(checks):
        raise RuntimeError("The final source-check inventory is incomplete.")
    for name, check in checks.items():
        evidence = (HERE / check["evidence"]).resolve()
        if not evidence.is_relative_to(HERE) or hashlib.sha256(evidence.read_bytes()).hexdigest() != check["evidenceSha256"]:
            raise RuntimeError(f"Recorded source evidence changed: {name}.")
    coverage = (HERE / "coverage-final.txt").read_text(encoding="utf-8-sig")
    if "--maxWorkers=2" not in coverage:
        raise RuntimeError("Final coverage log does not record the documented two-worker protocol.")
    unit_count = re.search(r"Tests\s+(\d+) passed", coverage)[1]
    file_count = re.search(r"Test Files\s+(\d+) passed", coverage)[1]
    scope_coverage = "; ".join(re.search(rf"^{label}\s+:.*$", coverage, re.M)[0].strip() for label in ["Statements", "Branches", "Functions", "Lines"])
    fixture_count = (HERE / "database-current.txt").read_text(encoding="utf-8-sig").count("Replayed ")
    dependency = read("dependency-current.json")["metadata"]["vulnerabilities"]["total"]
    typing_rows = []
    typing_results = []
    for name in ["typing-burst.json", "typing-sustained.json"]:
        data = read(name)
        if data.get("build") != build or data.get("servedBuild") != build:
            raise RuntimeError(f"Typing evidence does not identify the final local and served build: {name}.")
        if data.get("cpuThrottle") != 4 or data.get("targetUnits") != {"typing-burst.json": 247, "typing-sustained.json": 1239}[name] or data.get("observedBeforeInputEvents") != data.get("targetUnits"):
            raise RuntimeError(f"Typing workload/protocol changed: {name}; retain the 247/1239-unit 4x CPU native-input probes.")
        if not data.get("finalTextExact") or data["attempts"] != data["targetUnits"] or data["inputAccuracy"] != 100 or data.get("errors"):
            raise RuntimeError(f"Typing correctness did not pass: {name}.")
        if name == "typing-sustained.json" and (not data.get("resize") or not data["resize"].get("retainedExactly") or data["resize"].get("overflow")):
            raise RuntimeError("The sustained typing resize evidence did not pass.")
        speed = data.get("correctCharacterWpm")
        p98 = data.get("p98ObservedTypingEventDurationMs")
        maximum = data.get("maxObservedTypingEventDurationMs")
        if not data.get("eventTimingSupported") or any(not isinstance(value, (int, float)) or not math.isfinite(value) for value in [speed, p98, maximum]) or speed < 200 or not 0 <= p98 < 100 or maximum < p98:
            raise RuntimeError(f"Typing lab gate not accepted for {name}: requires observed correct-character WPM >=200 and observed event p98 <100 ms; unsupported timing remains unverified.")
        typing_results.append({"evidence": name, "targetUnits": data["targetUnits"], "observedCorrectCharacterWpm": speed, "observedEventP98Ms": p98, "observedEventMaxMs": maximum, "finiteLabGatePassed": True})
        timing = f"{data['p98ObservedTypingEventDurationMs']} ms / {data['maxObservedTypingEventDurationMs']} ms" if data.get("eventTimingSupported") and data.get("p98ObservedTypingEventDurationMs") is not None else "UNVERIFIED — Event Timing unavailable"
        typing_rows.append(f"| {data['targetUnits']} units | {data['correctCharacterWpm']:.2f} | {data['inputAccuracy']}% | {data['attempts']} | {data['finalTextExact']} | {timing} | {'Portrait → landscape, exact retention and no overflow' if data['resize'] else '390 × 844'} | [{name}](../audit/performance-polish-2026-10-16/{name}) |")
    groups = {}
    for file, _, case in cases(edge["suites"]):
        counts = groups.setdefault(file, {"expected": 0, "skipped": 0, "unexpected": 0, "flaky": 0})
        state = case.get("status", "unexpected")
        counts[state if state in counts else "unexpected"] += 1
    group_rows = "\n".join(f"| `{file}` | {count['expected']} | {count['skipped']} | {count['unexpected']} | {count['flaky']} |" for file, count in sorted(groups.items()))
    browser_suites = [
        ("Edge", "edge-complete", edge, 158, {"edge"}),
        ("Chromium worker subset", "worker-chromium-ownership-final", worker, 9, {"chromium"}),
        ("Chromium/Edge caret readiness", "caret-readiness-confirmation", caret, 14, {"chromium", "edge"}),
        ("Chromium/Edge typing observers", "typing-observer-confirmation", observers, 4, {"chromium", "edge"}),
        ("Chromium/Edge caret geometry", "geometry-confirmation", geometry, 20, {"chromium", "edge"}),
    ]
    for label, prefix, current, expected_cases, expected_projects in browser_suites:
        for suffix in ["-build.json", "-served-build.json"]:
            if read(prefix + suffix) != build:
                raise RuntimeError(f"{label} {suffix} does not identify the final build.")
        if (HERE / f"{prefix}-exit.txt").read_text(encoding="utf-8-sig").strip() != "0":
            raise RuntimeError(f"{label} lacks a successful actual runner exit.")
        actual = {"expected": 0, "skipped": 0, "unexpected": 0, "flaky": 0}
        for _, _, case in cases(current["suites"]):
            state = case.get("status", "unexpected")
            actual[state if state in actual else "unexpected"] += 1
        if any(actual[key] != current["stats"][key] for key in actual) or not actual["expected"]:
            raise RuntimeError(f"{label} case inventory differs from its summary or contains no passes.")
        if sum(actual.values()) != expected_cases or (prefix != "edge-complete" and actual["skipped"]):
            raise RuntimeError(f"{label} does not contain the complete {expected_cases}-case acceptance inventory.")
        if {project.get("name") for project in current["config"]["projects"]} != expected_projects:
            raise RuntimeError(f"{label} has different browser projects from its documented scope.")
        if current["config"].get("workers") != 1 or any(project.get("retries") != 0 for project in current["config"]["projects"]):
            raise RuntimeError(f"{label} did not use the documented one-worker, zero-retry protocol.")
        if prefix == "edge-complete":
            allowed_skips = {
                ("auth-flow.spec.ts", "real account sign in with dedicated deployment credentials"),
                ("race-mode.spec.ts", "deployed two-account race authorization and RLS"),
            }
            skipped = {(file, title) for file, title, case in cases(current["suites"]) if case.get("status") == "skipped"}
            if not skipped.issubset(allowed_skips):
                raise RuntimeError("The complete Edge run skipped non-credential cases; native/UI acceptance cannot be silently omitted.")
    for prefix, current, expected_count, attachment_names in [
        ("typing-observer-confirmation", observers, 4, {"learning-native-observer-ownership", "race-native-observer-scroll-ownership"}),
        ("geometry-confirmation", geometry, 20, {"actual-character-caret-geometry", "actual-code-newline-caret-geometry", "actual-static-free-anchor-geometry"}),
    ]:
        decoded = read(prefix + "-decoded-receipts.json")
        companion = read(prefix + "-summary.json")
        if companion.get("stats") != current["stats"] or companion.get("reportedAttempts") != expected_count or companion.get("nonPassing") or len(decoded) != expected_count:
            raise RuntimeError(f"{prefix} companion evidence is incomplete or stale.")
        if any(row.get("status") != "passed" or not attachment_names.intersection(row.get("attachments", {})) for row in decoded):
            raise RuntimeError(f"{prefix} lacks the expected native ownership/geometry receipts.")
    worker_receipts = read("worker-chromium-ownership-final-decoded-receipts.json")
    validate_startup_ownership(worker_receipts, "Chromium worker subset")
    validate_startup_ownership(read("edge-complete-decoded-receipts.json"), "Complete Edge")
    phase_receipts = {"native-hidden-fallback-phase", "native-fallback-resume-phase", "native-fallback-animation-actions"}
    if not any(row.get("status") == "passed" and phase_receipts.issubset(row.get("attachments", {})) for row in worker_receipts):
        raise RuntimeError("The final native worker run lacks hidden-fallback pause/resume/action phase receipts.")
    acknowledgement = next((row["attachments"] for row in worker_receipts if row.get("status") == "passed" and "native-idle-boundary-acknowledgement" in row.get("attachments", {})), None)
    if not acknowledgement:
        raise RuntimeError("The final native worker run lacks a separate protocol-idle disposal acknowledgement case.")
    idle = acknowledgement["native-idle-boundary-acknowledgement"]
    ready = idle.get("ready", {}).get("diagnostics", {})
    shutdown = idle.get("shutdown", {})
    closed = acknowledgement.get("native-worker-shutdown", {})
    idle_types = {receipt.get("type") for receipt in idle.get("idleReceipts", [])}
    native_received = shutdown.get("received", [])
    if not idle.get("scope", "").startswith("Protocol-only") or not {"test-native-idle-boundary", "test-native-render-frame-held"}.issubset(idle_types):
        raise RuntimeError("The native acknowledgement case lacks its explicit cadence-controlled protocol boundary.")
    if ready.get("thread") != "worker" or ready.get("keyCount") != 61 or ready.get("bloom") is not True or ready.get("environmentIntensity") != 0.35 or ready.get("frames", 0) <= 0 or ready.get("drawCalls", 0) <= 0:
        raise RuntimeError("The acknowledgement case did not first draw the real full-quality native scene.")
    if shutdown.get("terminated") != 1 or not any(receipt.get("type") == "disposed" for receipt in native_received) or not any(receipt.get("diagnostics", {}).get("disposed") for receipt in native_received):
        raise RuntimeError("The separate acknowledgement case lacks actual disposed diagnostics/acknowledgement and one termination.")
    if closed.get("path") != "acknowledged-disposal" or closed.get("policy") != "acknowledged" or closed.get("liveNativeWorkers") != 0:
        raise RuntimeError("The separate acknowledgement case did not establish its strict acknowledged-closure contract.")
    finite_pass = all(check["exitCode"] == 0 for check in checks.values()) and all(report["stats"]["unexpected"] == 0 and report["stats"]["flaky"] == 0 and not report.get("errors") for report in [edge, worker, caret, observers, geometry]) and min(performance) >= 95 and all(report["categories"][key]["score"] == 1 for report in scores for key in ["accessibility", "best-practices", "seo"])
    if not finite_pass:
        raise RuntimeError("Required local gates are not clean; retain failures and do not publish passing department rows.")
    promotions = prepare_checkpoint_promotions(build, performance, edge, worker, caret, observers, geometry, unit_count, file_count, bundle)
    status = "PASS — finite local gates; hosted/native/field gates remain unverified" if finite_pass else "FAILED OR INCOMPLETE — inspect actual evidence below"
    report = f"""# SparowType — performance, keyboard and Edge audit

Verified on 16 October 2026 UTC. **{status}.** This report supersedes the older mobile performance and incomplete Edge checkpoints in the [retained product audit](KEYBOARD_AWAKENS_PRODUCT_AUDIT_2026-10-16.md). It does not relabel their failed attempts as passes.

## 1. Actual outcome and build

- Production preview: `http://127.0.0.1:4175/`; public build **{build['version']}**, {build['publicFiles']} precached files, {build['bytes']:,} public bytes. This is an uncommitted local working tree, not a hosted release.
- Mobile Lighthouse performance: **{' / '.join(map(str, performance))}**, median **{median(performance):g}**. Accessibility, best practices and SEO are recorded separately below. Normal first-visit opening, mobile emulation, default simulated throttling, no reduced-motion preference, intro skip, audit detection or quality downgrade.
- Complete installed Microsoft Edge project: **{outcome(edge)}**. Chromium recovery/typing subset: **{outcome(worker)}**. Separate Chromium/Edge caret-readiness confirmation: **{outcome(caret)}**. Skipped checks are not passes.
- Separate Chromium/Edge typing-observer confirmation: **{outcome(observers)}**; actual-character caret-geometry confirmation: **{outcome(geometry)}**. Native receipts and process exits are required alongside matching build identities.
- Current unit suite: **{unit_count} tests / {file_count} files passed**. Full application/config/domain/portable TypeScript and production build passed. ESLint has no errors and nine retained Fast Refresh warnings.
- The keyboard now has tapered, dished caps, proportionate legends, recessed light rings and a roughly 35° front view. Off-axis projection reserves the wordmark area without shrinking the model, changing its camera angle or removing effects.

## 2. Mobile Lighthouse: every final repeat

Scores are Performance / Accessibility / Best practices / SEO. CLS below is the raw value; the Lighthouse display rounds it to zero. **Literal zero CLS is not claimed.**

| Run | Scores | FCP | LCP | Blocking time | Raw CLS | Observed FCP → scene request | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
{chr(10).join(lh_rows)}

The last timing column comes from actual trace `observedFirstContentfulPaint` and the first `keyboard-scene-bridge` network request, cross-checked against [per-repeat evidence](../audit/performance-polish-2026-10-16/lighthouse-release-results.json). These observed timings are separate from Lighthouse's simulated FCP/LCP score values. In all three repeats the scene request followed observed content paint. Per-repeat build identities must each match the final build before this report can be generated.

The old full-quality worker checkpoint scored 88; its first engraved-wordmark revision scored 87. Paint-priority scheduling reached 97 and the framing checkpoint reached 96. A later repeat on build `5c57ec3b85a7a3393561` scored 96 then 93; that revision was not accepted as a stable final result. These reports remain beside the three current reports. The earlier pre-worker baseline was 53 with 1,640 ms blocking time. Lab scores do not establish field INP, every device, or a universal load-time guarantee.

The following caret-readiness repair also did not establish a stable performance pass: its [first retained repeat](../audit/performance-polish-2026-10-16/lighthouse-mobile-caret-repair-1.report.html) scored **88** (FCP 2.4 s, LCP 3.4 s, blocking time 30 ms), and its [second repeat](../audit/performance-polish-2026-10-16/lighthouse-mobile-caret-repair-2.report.html) scored **96** (FCP 1.7 s, LCP 2.3 s, blocking time 110 ms). Its distinct [build identity](../audit/performance-polish-2026-10-16/lighthouse-caret-repair-build.json) and both reports are preserved. This variance prompted further investigation of useful content paint and GPU preparation; the three final repeats above identify their own measured builds independently.

The subsequent revision `cdf21f6f5102db4838c6` recorded mobile Lighthouse **98 / 98 / 98**, yet its longer typing stress failed the separate responsiveness gate. Those [three pre-input-polish Lighthouse reports](../audit/performance-polish-2026-10-16/lighthouse-mobile-before-chunks-1.report.html), companion repeats 2/3, and their [build identity](../audit/performance-polish-2026-10-16/lighthouse-before-chunks-build.json) remain retained. A loading score alone was not accepted as typing-performance evidence.

That same older revision's [14-case caret confirmation](../audit/performance-polish-2026-10-16/caret-readiness-before-input-polish.json) and [eight-case Chromium worker/typing subset](../audit/performance-polish-2026-10-16/worker-chromium-ownership-before-input-polish.json) were successful partial selections. Their companion identities record `cdf21f6f5102db4838c6`; they are retained under distinct names and do not stand in for the new build's separate confirmations or a complete Edge run. The final identity and every current result above must match the input-polished revision before promotion.

The later actual-character caret revision, [build `94bee422685001262adf`](../audit/performance-polish-2026-10-16/lighthouse-caret-geometry-build.json), recorded [**97 / 97 / 84** performance](../audit/performance-polish-2026-10-16/lighthouse-caret-geometry-results.json), with blocking time **60 / 100 / 530 ms** and accessibility **100 / 100 / 98**. All three raw reports and individual build identities remain retained as `lighthouse-mobile-caret-geometry-1/2/3.report.*`; scene requests followed observed content paint in each, so a real paint witness alone did not establish stable acceptance. This checkpoint was not promoted. Its genuine introduction-landmark and sound-button naming gaps were repaired before a separate final revision was measured.

The same three raw reports record host benchmark indices **2,391 / 2,023 / 1,365** (the last about 43% lower than the first), while all three request inventories remained **31 requests / 526,012 transferred bytes**. Those observations correlate host-index variation with the slow repeat; they **do not prove an external cause or rule out application work**. The outlier remains a failed finite performance result rather than being relabeled as 95+.

The first hidden-animation ownership set on [build `28188793dbb56fac3963`](../audit/performance-polish-2026-10-16/lighthouse-hidden-animation-build.json) likewise remained **unaccepted**: [**97 / 98 / 65** performance](../audit/performance-polish-2026-10-16/lighthouse-hidden-animation-results.json), blocking time **70 / 80 / 1,050 ms**, and accessibility/best practices/SEO **100 throughout**. All three normal-run reports are preserved separately as `lighthouse-mobile-hidden-animation-1/2/3.report.*`. Actual scene requests still followed observed paint. The 65 outlier is a failed stability result; the optional hidden-animation change is not presented as sufficient proof of 95+ on every run.

The final controlled set was [declared separately](../audit/performance-polish-2026-10-16/lighthouse-release-protocol.json): all owned browser workloads close first, each of exactly three fresh-profile runs receives a fixed 30-second quiet interval, the same normal mobile/simulated Lighthouse arguments and full application/renderer remain, and every score is retained. There are no automatic retries, score filtering, host-load thresholds or audit-only application branches. CPU/RAM/paging/process snapshots and raw host benchmark indices document the conditions, with unavailable counters labeled explicitly. Zero owned Lighthouse-profile browsers is checked before each quiet interval, before the run and after CLI completion; unrelated user browsers are outside that inventory. Actual CLI exits, local/served builds around each run, the full measured quiet intervals and timestamp ordering are required by this report's generator.

| Run | Measured quiet interval | Raw host benchmark index | Actual CLI exit | Host records |
| --- | --- | --- | --- | --- |
{chr(10).join(f"| {row['run']} | {row['quietElapsedMs'] / 1000:.3f} s | {row['benchmarkIndex']} | {row['cliExitCode']} | [Before quiet / before run / after run](../audit/performance-polish-2026-10-16/{row['evidence']}) |" for row in controlled_hosts)}

This protocol isolates workloads; **it does not establish that earlier outliers were caused externally or guarantee a passing score**. No CPU/RAM/benchmark threshold decides whether a run proceeds or its score is retained. The three final reports above must still independently satisfy every stated gate.

An earlier full-scope Edge checkpoint recorded **138 passed / 2 failed / 2 skipped** and was not accepted. It exposed a real caret handoff race when a slowly loaded typing target did not exist within the original two animation frames. That failure and its evidence remain retained; the final complete run below is separate evidence for the repaired revision.

The caret repair observes the real target instead of assuming readiness after two frames. It schedules a **500 ms target-readiness deadline**, retains a separate **1,000 ms module-import deadline**, and keeps the **360 ms decorative animation** with a **460 ms stalled-animation cleanup deadline**. Input, pointer activity, resize, scroll, reduced-motion changes and cancellation dispose the handoff; input readiness and first keystrokes do not wait for it. Twelve focused unit cases cover these finite ownership, readiness and failure paths. These scheduled deadlines are cleanup controls, not guaranteed wall-clock bounds in a blocked document.

The separate [Chromium/Edge caret-readiness confirmation](../audit/performance-polish-2026-10-16/caret-readiness-confirmation.json) completed **{outcome(caret)}** in **{caret['stats']['duration'] / 1000:.3f} seconds**, with one worker and zero retries. Its [local build](../audit/performance-polish-2026-10-16/caret-readiness-confirmation-build.json) and [served build](../audit/performance-polish-2026-10-16/caret-readiness-confirmation-served-build.json) both identify the final revision. [Decoded receipts](../audit/performance-polish-2026-10-16/caret-readiness-confirmation-decoded-receipts.json) and the [summary](../audit/performance-polish-2026-10-16/caret-readiness-confirmation-summary.json) retain observed lifecycle/input evidence independently of the later complete Edge run.

### Implemented changes and supporting evidence

1. A roughly 53 KB bootstrap renders the real opening independently of account providers and the typing workspace. Both workspace preparation and scene creation use the same real first-contentful-paint scheduler: buffered paint entries or a paint observer establish useful content, followed by an idle opportunity with a 400 ms scheduling deadline. A separate one-second fallback handles stalled/missing paint reports or APIs. That fallback allows progress without a paint witness and **does not guarantee actual paint was observed in every browser**. All three recorded final traces do contain a real paint witness before the scene request. Pending observations/jobs are canceled on exit.
2. Native OffscreenCanvas worker preparation keeps shader/GPU setup outside the document event loop. The worker and main-thread recovery reuse the same emitted renderer and Three.js chunks; neither path has a duplicate library graph.
3. Opening/font declarations are inlined in production with correct self-hosted font URLs. The full engraved wordmark is genuinely visible from initial HTML; the original physical key presses still illuminate its letters in sequence.
4. The complete CSS fallback and its key geometry are memoized. Receipt, phase and readiness updates no longer reconcile all 61 caps; key presses update the affected caps.
5. The favicon retains the same text-only Sora 700 S. Its embedded font was reduced from a complete variable font to that single weight/letter: **45,298 → 1,471 bytes**. Actual Chromium comparison found zero changed pixels at 16, 32, 64 and 448 px. The application's fonts and the 3D scene were not reduced.
6. Caret measurement keeps stable ResizeObserver/font subscriptions during test input. Learn likewise keeps ownership stable for its real lesson stage, and the race opponent marker keeps its own resize/font/scroll subscriptions while reading current position from refs. Committed input/progress changes still receive immediate measurements; the opponent never takes over user scrolling. The hot input path reads canonical current text without constructing a redundant full session snapshot on each edit, covered by two added core tests. Memoized presentation blocks of roughly 64 characters bound passage reconciliation while keeping all passage text in the DOM, complete-word wrapping, oversized-word/code fragments, accessibility and measured error/caret/opponent annotations; this is not passage virtualization. These changes structurally narrow React work, but their first sustained checkpoint still failed. Actual recorded throughput/latency, rather than the structural design alone, controls acceptance. No scoring formulas, visual design tokens or renderer-quality settings were changed by this input-polish work.
7. Profile-supported changes deduplicate unchanged global test-status publications and contain layout/paint within the already fixed-height, clipped typing viewport. Real status transitions still publish, committed caret measurement stays synchronous, and the complete passage remains mounted. The profile below identifies the observed costs; the final unassisted benchmarks establish whether the combined revision meets the finite lab gate.
8. The moving hidden inline measurement probe is removed from production. Caret geometry reads the actual current character's first native client rectangle, including the first newline fragment; only free-writing and end positions use a stable static anchor. A shared geometry helper applies RTL leading edges and line/block/outline/underline dimensions without changing text flow. Dedicated finite browser receipts below cover its geometry separately from score/throughput acceptance.
9. Running CSS animations owned by the hidden fallback keyboard are suspended after the WebGL canvas takes over. On visible context-loss recovery, the same animations seek forward by native timeline elapsed time × their captured playback rate and finish at the proper boundary, preserving their original phase. Canvas choreography, camera, geometry, effects and score logic are unchanged. This is optional capability-based work avoidance: missing WAAPI/`CSSAnimation`, null initial time or unsupported timing leaves the browser's animations untouched. Externally changed/canceled/replaced effects are not taken over. Eight focused unit cases cover ownership and cleanup; native phase receipts below are required separately.

### Actual compressed JavaScript budgets

| Graph | Bytes gzip | Gate |
| --- | ---: | --- |
| Opening bootstrap | {bundle['bootstrapJsGzipBytes']:,} | Recorded separately; not substituted for the complete practice graph |
| Complete initial practice graph | {bundle['initialPracticeJsGzipBytes']:,} | ≤ 200,000 |
| Shared deferred intro, including worker, fallback and bloom | {bundle['introDeferredJsGzipBytes']:,} | ≤ 220,000 |
| Largest other feature graph | {bundle['maxFeatureJsGzipBytes']:,} | ≤ 150,000 |

[Bundle accounting](../audit/performance-polish-2026-10-16/bundle-final.json) explicitly includes native worker/bloom imports. The deferred raw Three.js chunk still produces Vite's >500 KB warning; its compressed cost is included, not suppressed.

## 3. 3D quality, framing and recovery

Native-worker browser assertions require all **61 caps in one instanced cap mesh**, actual draw/frame counters, desktop bloom enabled, environment intensity **0.35**, and a front camera elevation between 28° and 42°. Configured material/lighting/postprocessing tiers remain; FPS no longer triggers automatic bloom removal or resolution reduction. The supported document recovery renders the same model/materials.

An independent comparison with the prior source delivery confirms unchanged cap topology (588 triangles per desktop cap / 300 per mobile cap), chassis/legend topology, physical material values, 2048 PCFSoft desktop shadows, configured DPR caps (1.5 desktop / 1 mobile), exposure and every bloom/chromatic/vignette/grain setting. Mobile gains the real studio environment and both tiers gain front fill. The underglow was deliberately redesigned from an oversized solid 300-triangle plate to a recessed hollow 224-triangle band; **not every mesh is topologically identical**. This shape change improves the physical keyboard presentation and is disclosed separately from retaining cap detail and effects.

The [desktop capture](../audit/performance-polish-2026-10-16/final-front-desktop-typed.png) and [landscape capture](../audit/performance-polish-2026-10-16/final-front-landscape-typed.png) verify a complete settled keyboard with no wordmark overlap or clipping. Their explicit visual build is `3642da6955ef3aef54e6`; later changes concern startup scheduling, fallback memoization, recovery styling and favicon payload. The renderer/frame configuration is unchanged, and the final-build native tests independently verify actual renderer quality.

The real-clock touch/landscape runs measured 60 FPS after shader preparation and entered practice with empty, ready input. The full-effects desktop headless/software-GPU run rendered only six frames over the intro; **smooth desktop animation and its target-time assembly remain UNVERIFIED on representative hardware**. Quality was retained instead of removing effects to manufacture a frame-rate pass. First-ready diagnostics report zero FPS until enough real frames exist.

Fault tests cover worker startup cancellation, transport failure, actual native WebGL loss during preparation, actual post-ready loss, fresh-canvas main-thread recovery, viewport resize, and five consecutive reloads including pending preparation. Full-quality readiness is asserted separately; reload ownership does not require every canceled worker to finish PBR before the intro deadline. A genuine preparation-loss bug was found and repaired: context events are now owned before asynchronous initialization, and lost/disposed preparation cannot publish a ready scene.

Shutdown evidence distinguishes resource-disposal acknowledgement from the watchdog scheduled after 200 ms when GPU work cannot acknowledge. Actual worker closure and bounded ownership are required in either case. A busy document can delay that scheduled callback; **an absolute 200 ms wall-clock guarantee is not claimed**. Five reloads establish finite worker ownership; they do not prove a universal JS/GPU memory-leak guarantee. See the [Edge investigation and retained failures](../audit/performance-polish-2026-10-16/edge-diagnosis.md).

The [retained startup animation trace](../audit/performance-polish-2026-10-16/startup-caret-geometry-profile-animations.json) showed the canvas opacity reveal beginning at **3,364.356 ms**, while all **61** fallback key-dissolve animations remained active until **5,084.645 ms**. Hidden CSS animation work therefore continued after the canvas took over. That observation motivated scoped suspension rather than changing visible keyboard quality or skipping its choreography.

The final native context-loss case includes `native-hidden-fallback-phase`, `native-fallback-resume-phase` and `native-fallback-animation-actions` in the [decoded worker receipts](../audit/performance-polish-2026-10-16/worker-chromium-ownership-final-decoded-receipts.json). They record two actual animation-frame samples of 61 paused native CSS dissolves, visible-recovery catch-up on the same native timeline with end clamps, and actual pause/play/finish calls. Generation requires these new receipts alongside the matching build, complete worker inventory and successful runner exit; older worker passes without them cannot substitute. This finite native observation does not guarantee the optional optimization is available in every browser.

The first phase-enabled Chromium attempt on `28188793dbb56fac3963` remains [**7 passed / 1 failed / 0 skipped, exit 1**](../audit/performance-polish-2026-10-16/worker-chromium-before-phase-assertion.json), about 55 seconds. All new hidden-61 pause/phase predicates passed, and the [retained trace finding](../audit/performance-polish-2026-10-16/native-loss-trace-finding.json) records a real recovered main-thread scene with 61 caps, bloom, environment 0.35, one frame and 22 draw calls. The later live-scene poll began after the fixed intro canvas had been removed, following 305 serialized per-key assertion steps. This failed attempt was not relabeled as a pass. The separate harness revision aggregates the same five predicates for every one of 61 keys, preserving phase tolerances, two real document frames, strict native recovery/draw requirements and original deadlines. Application source and its build are unchanged; the final successful worker report is separate evidence.

A [second retained attempt](../audit/performance-polish-2026-10-16/worker-chromium-quality-watchdog-checkpoint.json) on the same product build recorded **7 passed / 1 failed / 0 skipped, exit 1, 54.1 seconds**. The live-loss phase and strict full-quality recovery checks now passed. A different ordinary-quality shutdown assertion required an acknowledgement even though the product's documented watchdog path was taken: [actual disposal/termination evidence](../audit/performance-polish-2026-10-16/quality-watchdog-finding.json) records dispose at **3,597.9 ms**, exactly one native termination at **3,817.0 ms** (**219.1 ms later**), and no acknowledgement. That failed assertion remains a failed attempt. A scheduled watchdog closure is distinct from an acknowledged renderer-resource disposal; neither is silently substituted for the other. Finite acceptance retains every quality/input/resize requirement, evaluates ordinary closure against the existing bounded-ownership contract, and requires native acknowledgement evidence separately.

The final worker subset additionally contains `native-idle-boundary-acknowledgement`. It first requires an actual full-quality native scene, then holds the native renderer's next RAF callback at an explicit **protocol-only cadence boundary**. This is not a GPU-driver-idle claim, performance score or renderer replacement. The real production disposal handler must issue disposed diagnostics and its actual acknowledgement, terminate exactly once and leave no live native owner; no synthetic disposed reply or substituted resource API establishes the pass. The generator separately requires this receipt and its strict `acknowledged-disposal` shutdown record. Ordinary full-quality closure retains its measured acknowledged-or-watchdog contract without conflating that with this dedicated acknowledgement proof.

The first complete Edge attempt on the same final product build recorded [**155 passed / 1 failed / 2 credential-dependent skipped / 0 flaky**, **381.720 seconds**, actual **exit 1**](../audit/performance-polish-2026-10-16/edge-complete-before-worker-publication.json). It remains a failed attempt, with its original log, identities, decoded receipts and artifact directory preserved. Its [five-reload publication finding](../audit/performance-polish-2026-10-16/edge-native-publication-finding.json) records failure at cycle 2 after 2.56 seconds: the document recorded the native worker constructor/initialize at about 152 ms, while Playwright's asynchronous worker-publication event had not yet appeared in an immediate `page.workers()` check. The two previous actual owners had closed, with maximum live ownership one. The harness now waits for actual native publication using the existing five-second deadline before retaining the exact-one native worker, exact-one live owner, maximum-one owner and five actual closure checks. Application source, renderer quality, scoring and deadlines did not change. A fresh nine-case Chromium selection and the **entire** 158-case Edge inventory must pass separately; the earlier partial progress summaries and this failed full attempt are not treated as final passing evidence.

The next complete Edge attempt also remained [**155 passed / 1 failed / 2 credential-dependent skipped / 0 flaky**, **452.774 seconds**, actual **exit 1**](../audit/performance-polish-2026-10-16/edge-complete-before-startup-ownership.json). Its [distinct finding](../audit/performance-polish-2026-10-16/edge-startup-ownership-finding.json) concerns the reload test's initial warm-up precondition **before any reload**: initialize occurred at about **1,574 ms**, environment diagnostics at **3,967 ms**, intro disposal at **4,373 ms**, and actual termination at about **4,605 ms**. Full PBR readiness had not arrived within the real introduction lifetime. The dedicated ordinary full-quality draw and strict idle-boundary acknowledgement cases passed in that run; its failed lifecycle precondition is nevertheless retained as a failure.

The independently reviewed harness now explicitly separates **native startup ownership, including pending GPU preparation**, from **full rendered quality**. Its title and `five-native-worker-reload-cycles` receipt state this scope. The initial document must publish an actual single native worker with real initialize configuration `lowPower: false` / `finePointer: true`; all five rapid reloads still require a real initialized/published worker, closure of every preceding owner, maximum-one live ownership and all six actual closures. The final skip must reach an empty ready typing session and accept the first real `x` key. Strict 61-cap/PBR/bloom/environment/actual-draw requirements remain unchanged in the separate quality, recovery and acknowledgement cases. The startup receipt **does not establish a PBR draw**, and no additional drawing claim is inferred from it. Neither application code, quality settings nor deadlines changed for this scope correction. Generation requires separate fresh passing nine-case Chromium and complete 158-case Edge reports, not either retained failed full run.

## 4. Typing responsiveness and exact input

These are actual native Chromium keystrokes at **4× CPU throttling after loading**, not a claimed speed derived from the requested driver delay. The sustained case rotates the viewport midway. Event Timing durations are quantized, thresholded lab observations; p98 is not field INP.

Input is issued by the instrumented browser driver, not a human; these finite results do not establish human typing speed or a universal processing-capacity guarantee. The opening is explicitly disabled for these post-load typing probes, so the hidden-fallback animation optimization is not exercised here and **cannot be credited as the cause of their typing-speed improvement**. Differences between passing builds can include host variation; acceptance records the measured protocol outcome without assigning every change a causal speed gain.

The finite acceptance gate requires **both** recorded benchmark passages to achieve **at least 200 observed correct-character WPM** and **observed event p98 below 100 ms**, in addition to exact final text, insertion-attempt/accuracy correctness and retained resize input. The maximum is always shown separately: this gate does **not** require or establish every event below 100 ms, field INP or equivalent physical-device behavior.

| Passage | Observed correct-character WPM | Input accuracy | Attempts | Exact final text | Observed event p98 / max | Layout | Evidence |
| --- | ---: | ---: | ---: | --- | --- | --- | --- |
{chr(10).join(typing_rows)}

The earlier [247-unit burst](../audit/performance-polish-2026-10-16/typing-before-chunks-burst.json) on [build `cdf21f6f5102db4838c6`](../audit/performance-polish-2026-10-16/typing-before-chunks-build.json) achieved **289.16 WPM / 88 ms p98 / 160 ms maximum**. Its [1,239-unit sustained run](../audit/performance-polish-2026-10-16/typing-before-chunks-sustained.json) achieved only **155.83 WPM / 144 ms p98 / 600 ms maximum**. All 1,239 insertion attempts remained exact with 100% input accuracy and portrait-to-landscape retention, so input correctness passed while the sustained speed/latency gate failed. Both raw outcomes are preserved; the final rows above are separate runs after removing redundant session snapshots and narrowing passage reconciliation.

The first chunked checkpoint, [build `ddb953eb3a7408f509f9`](../audit/performance-polish-2026-10-16/typing-chunks-checkpoint-build.json), also **failed** sustained performance: [1,239 units at **157.90 WPM / 160 ms p98 / 1,496 ms maximum**](../audit/performance-polish-2026-10-16/typing-chunks-checkpoint-sustained.json). Exact text, all 1,239 insertion attempts, 100% accuracy and rotation retention still passed. Its source gates passed, but that did not override the measured responsiveness failure. It was not advanced to three new Lighthouse repeats or a new complete Edge run; the remaining bottleneck required a bounded CDP investigation before further application changes. The memoized-chunk design was therefore not represented as a proven throughput fix.

The next isolated-status/viewport checkpoint, [build `7c03d8b602d91e4d92ac`](../audit/performance-polish-2026-10-16/typing-isolation-checkpoint-build.json), also remained **unaccepted**: its [full native 1,239-unit run](../audit/performance-polish-2026-10-16/typing-isolation-checkpoint-sustained.json) recorded **150.92 WPM / 160 ms p98 / 1,192 ms maximum**, with exact text, all insertion attempts, 100% accuracy and rotation retention. Removing repeated shell publication was useful structural work, but did not by itself meet the sustained gate.

### Diagnostic profile: separate from acceptance

The [CDP profile summary](../audit/performance-polish-2026-10-16/typing-profile-summary.json) identifies the same `ddb953eb3a7408f509f9` build and uses **800 assisted prefill units followed by 150 browser-driven native input characters** at 4× CPU throttling. The assisted prefix is explicitly diagnostic: this run is **not an accepted score or WPM/throughput benchmark**. CPU/timeline instrumentation adds overhead. The [sampling profile](../audit/performance-polish-2026-10-16/typing-cpu-profile.cpuprofile), [timeline](../audit/performance-polish-2026-10-16/typing-timeline-trace.json) and [profiling script](../audit/performance-polish-2026-10-16/profile-typing.mjs) are retained.

| Observed cost | Recorded value | Interpretation |
| --- | ---: | --- |
| `getBoundingClientRect` sampled self time | 1,761.6 ms | Geometry reads were a dominant named JavaScript/browser boundary. |
| Layout events | 300 / 2,034.9 ms | Significant repeated layout with 4,364 layout objects reported at the observed document-root layout point. |
| Paint event aggregate | 2,880.3 ms | Nested timeline aggregate; not additive with layout/pre-paint or sampled CPU totals. |
| PrePaint event aggregate | 1,263.5 ms | Nested timeline aggregate; not an independent wall-clock duration. |

The profile and source inspection linked repeated shell/router-link work to `TypingArea` reporting status on input/timer snapshots and `Index` publishing a new Zustand object even when mapped status did not change. The repair preserves the prior store object for unchanged status and publishes actual transitions; layout/paint containment uses the existing explicit viewport height and clipping. Unicode/grapheme behavior remains unchanged; segmentation was only a small share of sampled time. These findings support the targeted changes, while fresh unassisted exact-input runs above remain the acceptance evidence.

A [separate paired diagnostic on `7c03d8b602d91e4d92ac`](../audit/performance-polish-2026-10-16/after-isolation-profile-review.md) retained the same assisted-800/native-150 setup and made one explicit runtime intervention: hide only the moving hidden inline caret probe and redirect only its geometry read to the current character's first client rectangle. Layout duration fell **1,521.0 → 651.8 ms (about 57%)**, and geometry sampled self time fell **1,321.8 → 459.5 ms** in that single pair. Layout still occurred (301 → 290 events), and nested timing categories remain non-additive. The runtime shim was diagnostic, not a production fix, accepted WPM run or evidence of universal speed. It supported the subsequent real source change to actual-character measurement/static end anchors; the unchanged full native-input benchmark and geometry receipts are required independently.

### Observer and caret geometry acceptance

The [typing-observer confirmation](../audit/performance-polish-2026-10-16/typing-observer-confirmation.json) recorded **{outcome(observers)}** across Chromium and installed Edge in **{observers['stats']['duration'] / 1000:.3f} seconds**. Its [decoded native receipts](../audit/performance-polish-2026-10-16/typing-observer-confirmation-decoded-receipts.json) cover stable Learn resize ownership, actual lesson-stage restart/cleanup, and stable race resize/scroll ownership through user/opponent progress, deletion and resize.

The separate [caret-geometry confirmation](../audit/performance-polish-2026-10-16/geometry-confirmation.json) recorded **{outcome(geometry)}** across the same browsers in **{geometry['stats']['duration'] / 1000:.3f} seconds**. [Decoded geometry receipts](../audit/performance-polish-2026-10-16/geometry-confirmation-decoded-receipts.json) cover all four caret styles with LTR/RTL text, rotation/deletion, code newline first-fragment/new-row geometry, and empty/multiline/free/end static-anchor identity. These suites require matching local and served builds, complete case inventories, one worker, zero retries and actual successful process exits. Finite geometry checks do not replace native IME, physical-device or assistive-technology acceptance.

The helper selects a leading edge from the paragraph viewport's `dir`. These finite cases exercise simple LTR/RTL text; **mixed Arabic plus Latin/digit Unicode bidi insertion semantics have not been independently verified**. Full native bidi caret conformance is not claimed.

No scoring/timer contract was changed by these rendering optimizations. The full Edge flows also exercise wrong-key feedback, corrected errors, deletion, composition/transfer guardrails, quick restart, modes, pace and lesson feedback. A dedicated 240-character browser regression verifies stable test observer ownership, exact input through resize/deletion, and caret containment; the two added Learn/opponent regressions inspect native observer and scroll-listener ownership through input/progress, deletion, resize, real lesson restart and cleanup. Font-ready callback ownership is retained by the same source lifetimes. Full passage DOM remains present through these updates. Long unbounded Zen histories are not virtualized; these finite passage results are not an all-duration guarantee. Existing word-credit headline WPM and attempt-bucket consistency retain the explicitly documented policy differences in [METRICS.md](METRICS.md).

## 5. Every department and page: status and scope

| Page / department | Status | Actual check and practical limit |
| --- | --- | --- |
| Home/test and mode controls | PASS — local | Full Edge input/mode/content/restart flows; 4× CPU exact-input runs. Native OS input and every IME remain UNVERIFIED. |
| Learn / Practice / touch typing | PASS — local | Lesson feedback, layouts, targeted-learning evidence, content and guide routes. Educational effectiveness at user scale is UNVERIFIED. |
| Keyboard Lab | PASS — local | Browser-observed keys, layout/transition controls and responsive Lab flows. Hardware model/finger/true switch-latency detection is not claimed. |
| Race | PARTIAL | Local bot, opponent pace/feedback and navigation checked. Deployed human race/API/Realtime transport remains UNVERIFIED. |
| Results and exports | PASS — local | Corrected-error evidence, statistics, accessible chart/data, JSON/share flows and narrow results layouts in complete Edge project. |
| Stats / guest profile | PASS — local | Populated history, matching comparisons, calendar/chart and account-control layout flows. Hosted owner synchronization remains UNVERIFIED. |
| Rankings | PARTIAL | Period UI fixtures and local PostgreSQL integrity assertions pass. Actual hosted ranking publication/concurrency is UNVERIFIED. |
| Settings / themes / fonts | PASS — local | Saved choices, light/dark, caret/reduced motion/audio API ownership, native-option styles and responsive controls. Audible output/native OS popup pixels are not certified. |
| Auth | PARTIAL | UI/validation/unavailable states covered. Credential-dependent end-to-end account/OAuth paths are explicitly skipped below. |
| About / Privacy / Terms / 404 | PASS — local | Full Edge routed page/navigation/metadata and responsive public-page checks. Legal suitability for a particular deployment is not certified. |
| Offline route / PWA | PASS — local | Public cache download, genuine server-outage recovery, private-request bypass and update controls. Static no-JS recovery additionally fits 320/390/landscape with real 47px links/focus. Native installation remains UNVERIFIED. |
| Early application failure | PASS — local | App CSS and JS failures independently injected at 320px; self-contained recovery, measured contrast/focus/44px control, real reload and preserved guest history. |
| Intro / renderer lifecycle | PASS — finite local | Real worker quality, loss/recovery, cancellation, five reloads and native hidden-fallback pause/phase recovery receipts. Optional animation API capability, desktop smoothness and universal zero leaks remain finite limits. |
| Accessibility | PARTIAL | Root Lighthouse 100, keyboard/focus/contrast/responsive assertions. Full WCAG 2.2 audit and manual assistive-technology journeys are UNVERIFIED. |
| Mobile performance | PASS — local lab | All three final repeats ≥95; raw scores/CLS above. Field INP and physical device matrix remain UNVERIFIED. |
| SEO | PASS — local | Root Lighthouse 100 and page/alias/robots/canonical tests. Sitemap intentionally waits for an explicit deployment origin; indexing is UNVERIFIED. |
| Database / result validation | PASS — local fixtures | {fixture_count} migrations and integrity/upgrade/ownership/period assertions. Hosted Edge/JWT/API/RLS transport and simultaneous connections remain UNVERIFIED. |
| Security / dependencies | PARTIAL | Input/transfer/replay/privacy fixtures, configured CSP and {dependency} known production dependency advisories at check time. No penetration-test or production-security guarantee. |
| Privacy / data | PASS — local scope | Export/local owner separation, protected cache boundaries and recovery retention flows. Production deletion/provider retention remain UNVERIFIED. |
| Native/browser reach | PARTIAL | Complete installed Edge plus current Chromium subset. Prior Firefox/WebKit evidence remains dated; latest complete Firefox/WebKit sweeps and native Safari/iOS/Android remain UNVERIFIED. |
| Release / deployment | UNVERIFIED | No hosted deployment, production migration, remote CI run or live-account deletion was performed. |

### Complete Edge inventory

[Complete report](../audit/performance-polish-2026-10-16/edge-complete.json), [runtime version](../audit/performance-polish-2026-10-16/edge-complete-version.json), [build identity](../audit/performance-polish-2026-10-16/edge-complete-build.json). Overall: **{outcome(edge)}**; {len(edge.get('errors', []))} report-level errors. One browser workload at a time, one worker, zero retries and original case deadlines; the overall watchdog is separate.

| Spec | Passed | Skipped | Failed | Flaky |
| --- | ---: | ---: | ---: | ---: |
{group_rows}

### Checks deliberately not represented as passes

{skip_notes(edge)}

Chromium recovery/typing subset: {skip_notes(worker)}

## 6. Source and local engineering gates

- **{unit_count} tests / {file_count} files passed**. Configured business-logic coverage: {scope_coverage}. This coverage selection is defined in `vitest.config.ts`; it is not a whole-application coverage percentage.
- Full TypeScript, production build and honest complete-graph bundle gates passed. ESLint: **0 errors / 9 existing Fast Refresh warnings**; these development warnings were not suppressed.
- Local PostgreSQL/WASM: **{fixture_count} migrations** replayed and integrity, legacy-upgrade, owner/version and period checks passed. This does not exercise hosted network/auth/concurrent transactions.
- The 20 code examples pass their language parser/compiler checks; SQL is checked by both SQLite and PostgreSQL/WASM. Code exercises were not executed as arbitrary programs.
- Production dependency audit: **{dependency} known advisories** in the recorded registry response. This is not proof that every vulnerability is absent.
- [Source checks](../audit/performance-polish-2026-10-16/final-source-checks.json), [coverage](../audit/performance-polish-2026-10-16/coverage-final.txt), [database](../audit/performance-polish-2026-10-16/database-current.txt), [content](../audit/performance-polish-2026-10-16/content-current.txt), [favicon pixel comparison](../audit/performance-polish-2026-10-16/favicon-render-comparison.json).

The [prior combined source-revalidation attempt](../audit/performance-polish-2026-10-16/source-revalidation-interrupted.json) was interrupted after completed TypeScript/lint logs; its unfinished coverage/build was not counted as a pass. The complete, unchanged unit/coverage suite was then rerun with `--maxWorkers=2`: concurrency changed, while case selection and assertions stayed the same. Production build and bundle completion are separate recorded gates.

## 7. Run and reproduce

```powershell
npm ci
npm run typecheck
npm run lint
npm run test:coverage -- --maxWorkers=2
npm run test:database
npm run test:content
npm run build
npm run check:bundle
npm run preview -- --host 127.0.0.1 --port 4175 --strictPort
```

In a second terminal, with installed Microsoft Edge:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:4175"
$env:PLAYWRIGHT_BROWSERS = "edge"
npm run test:e2e -- --workers=1 --retries=0
```

Keep Lighthouse and browser test workloads separate. The retained command/evidence files record the exact local profiling runs. Normal builds need no font-authoring Python dependency; `scripts/subset-favicon.py` is an optional reproducible asset recipe. Review [DATA_AND_DEPLOYMENT.md](DATA_AND_DEPLOYMENT.md) before any real deployment. The [prior detailed architecture/research audit](KEYBOARD_AWAKENS_PRODUCT_AUDIT_2026-10-16.md) and [research sources](KEYBOARD_AWAKENS_RESEARCH_2026-10-16.md) retain the wider product and metric limitations, including unavailable Google Trends data.
"""
    (ROOT / "docs/PERFORMANCE_POLISH_AUDIT_2026-10-16.md").write_text(report, encoding="utf-8")
    summary = {"build": build, "localGatesPass": finite_pass, "lighthousePerformance": performance, "lighthouseMedian": median(performance), "lighthouseControlledProtocol": controlled_protocol, "lighthouseHostRecords": controlled_hosts, "paintOrdering": paint_summary, "typingLabGate": {"minimumObservedCorrectCharacterWpm": 200, "observedEventP98StrictlyBelowMs": 100, "maximumLatencyIsNotAnAcceptanceBound": True, "runs": typing_results}, "edge": edge["stats"], "chromiumRecoverySubset": worker["stats"], "caretReadinessConfirmation": caret["stats"], "typingObserverConfirmation": observers["stats"], "caretGeometryConfirmation": geometry["stats"], "unitTests": int(unit_count), "unitFiles": int(file_count), "unitWorkerConcurrency": 2, "interruptedSourceAttempt": "source-revalidation-interrupted.json", "bundle": bundle, "limitations": ["Hosted credential gates skipped", "Desktop hardware FPS unverified", "Native devices/AT/field INP unverified", "Finite tests, not universal perfection"]}
    (HERE / "verification-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    for path, content in promotions.items():
        path.write_text(content, encoding="utf-8")
    print(json.dumps({"audit": "docs/PERFORMANCE_POLISH_AUDIT_2026-10-16.md", "localGatesPass": finite_pass, "lighthouseMedian": median(performance), "edge": outcome(edge)}, indent=2))


if __name__ == "__main__":
    main()
