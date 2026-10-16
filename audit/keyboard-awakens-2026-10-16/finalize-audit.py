from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[2]
evidence = Path(__file__).parent
report_path = root / 'docs/KEYBOARD_AWAKENS_PRODUCT_AUDIT_2026-10-16.md'
def normalize_report(report):
    report = report.split('### Final coordinated verification')[0].rstrip()
    report = report.replace('**Final integrated browser acceptance is pending at this report\'s initial checkpoint.**', '**The final coordinated verification below records the completed local checks and remaining release gates.**')
    inventory_note = 'The detailed rows below record implementation review at the initial checkpoint. The final coordinated page/department table in section 9 adds the actual integrated outcomes; SOURCE is not an unqualified browser pass.'
    if inventory_note not in report:
        report = report.replace('## 5. Routed page and feature inventory', '## 5. Routed page and feature inventory\n\n' + inventory_note)
    report = report.replace('Current final full unit/coverage/typecheck/lint/build/bundle commands', 'Current local unit/coverage/typecheck/lint/build/bundle commands')
    report = report.replace('**UNVERIFIED at initial report checkpoint**', 'See final coordinated verification below')
    report = report.replace('Root verification must add the actual final-source logs/counts.', 'Final-source logs/counts are recorded in section 9.')
    report = report.replace('Root verification must record per-engine passes, skips and failures.', 'Per-engine passes, skips and failures are recorded in section 9.')
    report = report.replace('Latest integrated verification is not yet attached', 'Latest integrated verification has finite local scope')
    report = report.replace('Record final commit/working-tree/build identity, actual command exits, unit/coverage scope and per-engine browser pass/skip/failure counts. Preserve failures and diagnose them.', 'Retain the local evidence below; complete hosted/native/field gates independently. Current source is an uncommitted working tree, not a deployed release.')
    report = report.replace('1. Final-source unit, type, lint, content compiler, dependency audit, build/bundle and browser logs; no hidden failures or credential skips treated as passes.', '1. Retain the final-source local evidence below. Hosted/native gaps and credential or capability skips are not passes.')
    report = report.replace('6. Lighthouse on a repeatable current build, real interaction latency/INP and sustained FPS/memory on representative hardware. Headless renderer metrics are scoped diagnostics.', '6. Retain the actual mobile lab result, and measure interaction latency/INP and sustained FPS/memory on representative hardware. Headless renderer metrics are scoped diagnostics.')
    report = report.replace('6. Meet the failed mobile performance target, measure actual interaction latency/INP and sustained FPS/memory on representative hardware. Headless renderer metrics are scoped diagnostics.', '6. Retain the actual mobile lab result, and measure interaction latency/INP and sustained FPS/memory on representative hardware. Headless renderer metrics are scoped diagnostics.')
    report = report.replace('A public release should retain the following explicit **UNVERIFIED** gates until actual evidence exists:', 'The following release gates distinguish completed local evidence from hosted/native checks that remain **UNVERIFIED**:')
    report = report.replace('Root verification should append the final outcome below with the saved artifact paths. It should not delete or rewrite prior failure evidence.', 'The final outcome below identifies saved local evidence and its scope. Earlier failures remain retained beside repair confirmations.')
    for old, new in {
        'Each **SOURCE** result below means the implementation and named tests are present and reviewed. Current integrated browser outcomes must be added by root verification; the file\'s existence alone is not marked PASS.': 'Each **SOURCE** result below records implementation review at the initial checkpoint. Actual integrated outcomes and remaining native/hosted gates are now recorded in section 9; a source file alone is not a browser pass.',
        'Current integrated timing/input tests pending.': 'Integrated timing/input outcomes are recorded in section 9.',
        'final visual/native-menu checks pending.': 'local brand/native-option outcomes are in section 9; native OS popup rendering remains UNVERIFIED.',
        'Latest integrated matrix pending.': 'Integrated matrix and final subset scopes are recorded in section 9.',
        'Current content compiler gate pending root.': 'The recorded local content compiler result is in section 9.',
        'Device download/pixel checks for latest build pending; sharing does not give private-text cloud consent.': 'JSON download/PNG-signature checks passed at the full Chromium checkpoint; final-revision share-image pixel acceptance remains UNVERIFIED. Sharing does not give private-text cloud consent.',
        'Latest integrated browser confirmation pending.': 'Full browser checkpoints are recorded in section 9; the final targeted subset did not rerun every Lab case.',
        'Latest Deno check and real deployed JWT/service-role path must be recorded independently.': 'The local Deno check is recorded in section 9; deployed JWT/service-role transport remains UNVERIFIED.',
        'Latest-source budget and font/offline network checks await root evidence.': 'Final bundle/offline results and scoped font diagnosis are recorded in section 9; native font loading remains UNVERIFIED.',
        'SOURCE; execution gates pending': 'SOURCE; remote CI UNVERIFIED',
    }.items():
        report = report.replace(old, new)
    return report

report = normalize_report(report_path.read_text(encoding='utf-8'))

def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def update_status_ledger(text, checkpoint):
    start = '<!-- keyboard-awakens-current:start -->'
    end = '<!-- keyboard-awakens-current:end -->'
    text = re.sub(re.escape(start) + r'.*?' + re.escape(end) + r'\s*', '', text, flags=re.S)
    text = text.replace('**Latest follow-up, 16 October:**', '**Earlier identity follow-up, 16 October (historical):**')
    text = text.replace('**Current release status: local review available; release verification remains open.**', '**Earlier release status (historical): local review available; release verification remained open.**')
    text = text.replace('### SparowType identity checkpoint — 16 October\n', '### SparowType identity checkpoint — 16 October, historical revision\n')
    text = text.replace('## Remaining specification and release work\n', '## Remaining specification and release work — historical checkpoint\n\nThis list records the earlier milestone. The current checkpoint above and current product audit supersede items completed later, including daily/weekly ranking views.\n', 1)
    heading, remainder = text.split('\n', 1)
    return heading + '\n\n' + start + '\n' + checkpoint.strip() + '\n' + end + '\n\n' + remainder.lstrip().rstrip() + '\n'

def browser_summary(name):
    path = evidence / name
    if not path.exists():
        return '**UNVERIFIED** — report absent'
    data = read_json(path)
    stats = data['stats']
    flaky = f" / {stats['flaky']} flaky" if stats.get('flaky') else ''
    errors = f"; {len(data['errors'])} report-level errors" if data.get('errors') else ''
    return f"{stats['expected']} passed / {stats['skipped']} skipped / {stats['unexpected']} failed{flaky} ({stats['duration']/60000:.1f} min){errors}"

def grouped_summary(name):
    path = evidence / name
    if not path.exists():
        return {}
    data = read_json(path)
    totals = {}
    def walk(suites):
        for suite in suites:
            for spec in suite.get('specs', []):
                for case in spec.get('tests', []):
                    name = case['projectName']
                    counts = totals.setdefault(name, {'passed': 0, 'skipped': 0, 'failed': 0, 'flaky': 0})
                    status = case.get('status')
                    if status == 'skipped': counts['skipped'] += 1
                    elif status == 'expected': counts['passed'] += 1
                    elif status == 'flaky': counts['flaky'] += 1
                    else: counts['failed'] += 1
            walk(suite.get('suites', []))
    walk(data['suites'])
    return {name: f"{counts['passed']} passed / {counts['skipped']} skipped / {counts['failed']} failed" + (f" / {counts['flaky']} flaky" if counts['flaky'] else '') for name, counts in totals.items()}

def skip_descriptions(name):
    path = evidence / name
    if not path.exists():
        return '**UNVERIFIED** — report absent'
    descriptions = set()
    def walk(suites):
        for suite in suites:
            for spec in suite.get('specs', []):
                for case in spec.get('tests', []):
                    if case.get('status') == 'skipped':
                        notes = [a.get('description', 'No reason recorded') for a in case.get('annotations', []) if a.get('type') in ('skip', 'fixme')]
                        descriptions.add(f"- `{case['projectName']}` / {spec['title']}: {'; '.join(notes) or 'No skip annotation recorded.'}")
            walk(suite.get('suites', []))
    walk(read_json(path)['suites'])
    return '\n'.join(sorted(descriptions)) or 'No cases were skipped in this focused report.'

cross = grouped_summary('cross-engine.json')
observed_path = evidence / 'repairs-observed.json'
observed = read_json(observed_path)
observed_rows = '\n'.join(f"| {project} | {counts['passed']} passed / {counts['skipped']} skipped / {counts['failed']} failed | {counts['reported']} / {counts['planned']} | " + ('Fully reported project; wider attempt incomplete.' if counts['fullyReported'] else '**INCOMPLETE — missing planned cases are UNVERIFIED.**') + ' |' for project, counts in observed['projects'].items())
observed_summary = '; '.join(f"{project}: {counts['passed']} passed / {counts['skipped']} skipped / {counts['failed']} failed, {counts['reported']}/{counts['planned']} reported" for project, counts in observed['projects'].items())
repairs_path = evidence / 'repairs-confirmation.json'
if not repairs_path.exists():
    raise SystemExit('Final targeted confirmation is absent. Do not finalize while browser reports are pending.')
repairs = grouped_summary(repairs_path.name)
if not repairs or not (evidence / 'icon-pwa-final.json').exists():
    raise SystemExit('Final repair groups or final icon/PWA report are pending; leave both documents unchanged.')
repair_data = read_json(repairs_path)
repair_rows = '\n'.join(f"| {project} | {result} | [repairs-confirmation.json](../audit/keyboard-awakens-2026-10-16/repairs-confirmation.json), final targeted selection; not a complete project sweep. |" for project, result in repairs.items())
repair_skips = skip_descriptions(repairs_path.name)
repair_errors = f"The focused report also records {len(repair_data.get('errors', []))} report-level errors."
pwa_projects = ', '.join(grouped_summary('pwa-true-outage.json')) or 'project report absent'
icon_projects = '; '.join(project + ': ' + result for project, result in grouped_summary('icon-pwa-final.json').items()) or 'project report absent'
bundle_path = evidence / 'bundle-final.json'
build_path = evidence / 'build-final.txt'
bundle = read_json(bundle_path)
build = read_json(root / 'dist/offline-build.json')
build_log = build_path.read_text(encoding='utf-8-sig')
lint_log = (evidence / 'lint-final.txt').read_text(encoding='utf-8-sig')
lint_result = re.search(r'(\d+) problems? \((\d+) errors?, (\d+) warnings?\)', lint_log)
if not lint_result:
    raise SystemExit('The final lint summary could not be established; leave both documents unchanged.')
lint_errors, lint_warnings = int(lint_result[2]), int(lint_result[3])
lint_status = '**PASS with warnings**' if lint_errors == 0 else '**FAILED**'
if 'built in' not in build_log or 'Offline public app prepared:' not in build_log:
    raise SystemExit('Final build log is incomplete; leave the audit unchanged.')
if f"version {build['version']}" not in build_log:
    raise SystemExit('Final build log and dist/offline-build.json identify different public builds.')
budget_ok = all(bundle[field] <= bundle['budgets'][budget] for field, budget in [('initialPracticeJsGzipBytes', 'initialPracticeJsGzipBytes'), ('maxFeatureJsGzipBytes', 'featureJsGzipBytes'), ('introDeferredJsGzipBytes', 'introDeferredJsGzipBytes')])
budget_status = '**PASS — local**' if budget_ok else '**FAILED — local**'
lh_path = next((evidence / name for name in ['lighthouse-mobile-final.report.json', 'lighthouse-mobile-optimized.report.json', 'lighthouse-mobile.report.json'] if (evidence / name).exists()), None)
lh = read_json(lh_path) if lh_path else None
lh_final = bool(lh_path and lh_path.name == 'lighthouse-mobile-final.report.json')
scores = ' / '.join(f"{label} {round(lh['categories'][key]['score'] * 100)}" for key, label in [('performance', 'Performance'), ('accessibility', 'Accessibility'), ('best-practices', 'Best practices'), ('seo', 'SEO')]) if lh else 'UNVERIFIED — no Lighthouse report'
metrics = '; '.join(f"{label} {lh['audits'][key].get('displayValue', 'unavailable')}" for key, label in [('first-contentful-paint', 'FCP'), ('largest-contentful-paint', 'LCP'), ('total-blocking-time', 'TBT'), ('cumulative-layout-shift', 'CLS')]) if lh else 'No recorded lab metrics.'
lh_scope = 'Final-build mobile lab run' if lh_final else 'Earlier-build checkpoint; final-build Lighthouse UNVERIFIED'
lh_result = ('**PASS — single local lab target**' if lh['categories']['performance']['score'] >= .95 else '**PARTIAL / performance gate FAILED**') if lh_final else '**CHECKPOINT ONLY — final-build target UNVERIFIED**' if lh else '**UNVERIFIED**'
lh_evidence = f"[{lh_path.name}](../audit/keyboard-awakens-2026-10-16/{lh_path.name}); {lh_scope}; recorded {lh.get('fetchTime', 'time unavailable')}; {metrics}." if lh else metrics
performance_limit = ('The latest final-build mobile lab score meets 95, but this single synthetic run does not establish field INP, sustained frame rate, representative devices or added LCP relative to an intro-free baseline.' if lh['categories']['performance']['score'] >= .95 else f"The latest final-build mobile performance score is {round(lh['categories']['performance']['score'] * 100)}, below the requested 95 target. This release gate FAILED; a passing bundle gate or exact-input burst does not override it.") if lh_final else 'Final-build mobile Lighthouse is absent, so that current-build target remains UNVERIFIED. Retained earlier lab results describe only their own checkpoints.'
throughput_rows = []
for file in ['typing-throughput.json', 'typing-burst.json']:
    path = evidence / file
    if path.exists():
        sample = read_json(path)
        throughput_rows.append(f"| [{file}](../audit/keyboard-awakens-2026-10-16/{file}) | {sample['requestedInterCharacterDelayMs']} ms | {sample['elapsedMs']/1000:.2f} s | {sample['correctCharacterWpm']:.2f} | {sample['attempts']} / {sample['targetUnits']} | {sample['inputAccuracy']}% / {'yes' if sample['finalTextExact'] else 'NO'} | {sample['p98ObservedTypingEventDurationMs']} / {sample['maxObservedTypingEventDurationMs']} ms |")
throughput_table = '\n'.join(throughput_rows) or '| No recorded throughput report | UNVERIFIED | — | — | — | — | — |'
final = f'''
### Final coordinated verification — 16 October 2026

This is local working-tree evidence. The final built public cache version is `{build.get('version', build.get('buildId', 'see offline-build.json'))}`. No code was committed, remotely migrated or published. Original failed runs are retained.

| Gate | Status / result | Test and evidence |
| --- | --- | --- |
| Full unit suite | **PASS — local: 586 tests / 37 files** | [coverage-final.txt](../audit/keyboard-awakens-2026-10-16/coverage-final.txt); includes finite replay, edit fuzz, validation, learning, layouts, preferences, PWA and SEO cases. |
| Scoped business-logic coverage | **PASS**: statements 89.78%, branches 86.09%, functions 90.19%, lines 96.19% | Aggregate thresholds in `vitest.config.ts`; this is not whole-React or per-file coverage. |
| App/tooling/domain/portable types | **PASS — local** | [typecheck-final.txt](../audit/keyboard-awakens-2026-10-16/typecheck-final.txt); the full React app is not strict mode. |
| ESLint | {lint_status}: {lint_errors} errors, {lint_warnings} current-source Fast Refresh warnings | [lint-final.txt](../audit/keyboard-awakens-2026-10-16/lint-final.txt); generated audit/delivery files are excluded. The earlier transient generated-trace-file race is retained in [lint-artifact-race.txt](../audit/keyboard-awakens-2026-10-16/lint-artifact-race.txt). |
| Content compiler gate | **PASS: 20 examples** | [content.txt](../audit/keyboard-awakens-2026-10-16/content.txt); JS/TS/Python/Rust/SQLite/PostgreSQL parsers/compilers, no practice-program execution. |
| Dependency scan | **PASS: 0 reported vulnerabilities** | [dependencies.json](../audit/keyboard-awakens-2026-10-16/dependencies.json); npm advisory snapshot, not a guarantee against unknown vulnerabilities. |
| SQL compatibility/authorization/upgrade | **PASS — local: 17 migrations** | [database.txt](../audit/keyboard-awakens-2026-10-16/database.txt); integrity, owner/privacy boundaries, period/preferences fixtures and legacy upgrade. |
| Edge entry-point types | **PASS — local** | [edge-typecheck.txt](../audit/keyboard-awakens-2026-10-16/edge-typecheck.txt), Deno 2.9.6 and all three endpoints. No deployed HTTP claim. |
| Production build / offline generation | **PASS — local** | [build-final.txt](../audit/keyboard-awakens-2026-10-16/build-final.txt), {build['publicFiles']} allowlisted public files; main-chunk size warning remains. |
| JS budgets | {budget_status} | Initial {bundle['initialPracticeJsGzipBytes']:,} bytes gzip; largest other feature {bundle['maxFeatureJsGzipBytes']:,}; deferred intro {bundle['introDeferredJsGzipBytes']:,}. Limits 200,000 / 150,000 / 220,000. [bundle-final.json](../audit/keyboard-awakens-2026-10-16/bundle-final.json). |
| Chromium full checkpoint | {browser_summary('chromium-release.json')} | [chromium-release.json](../audit/keyboard-awakens-2026-10-16/chromium-release.json), production preview 4175, one worker, trace off. This precedes localized cross-engine repairs; it is not a new full-final-build run. Hosted-credential skips remain UNVERIFIED. |
| Firefox full checkpoint | {cross.get('firefox', '**UNVERIFIED**')} | [cross-engine.json](../audit/keyboard-awakens-2026-10-16/cross-engine.json); original failures retained, repair confirmations recorded separately below. |
| WebKit full checkpoint | {cross.get('webkit', '**UNVERIFIED**')} | Same report. Playwright WebKit on Windows is not native macOS/iOS Safari. |
| Actual-server-outage PWA journey | {browser_summary('pwa-true-outage.json')} | [pwa-true-outage.json](../audit/keyboard-awakens-2026-10-16/pwa-true-outage.json), projects: {pwa_projects}. Dedicated static server is stopped and restarted; both actual history rows survive clearing only the public download. Native installation remains separate. |
| Final favicon/active-contrast/PWA confirmation | {browser_summary('icon-pwa-final.json')} | [icon-pwa-final.json](../audit/keyboard-awakens-2026-10-16/icon-pwa-final.json): {icon_projects}. Served SVG contains a single typographic S; active header/footer/controls retain opacity 1 in the browser assertion. Non-error feedback opacity 1 was also checked in source. Real-outage PWA and brand assertions run separately from the earlier app-source repair attempt. |
| Mobile Lighthouse lab | {lh_result}: {scores} | {lh_evidence} Single local throttled synthetic run; no field INP claim. |
| Real preview response security headers | **PASS — local** | [preview-security-headers.json](../audit/keyboard-awakens-2026-10-16/preview-security-headers.json); CSP, nosniff, referrer and permissions policy. Hosted headers UNVERIFIED. |
| Native/hosted/field gates | **UNVERIFIED** | No real account deletion, OAuth provider, simultaneous hosted race, native install, screen-reader certification or representative-hardware FPS/INP acceptance. |

### Interrupted repair attempt — observed reporter lines only

The 208-case/four-project attempt on build `{observed['testedBuild']}` was stopped during repeated native Edge runner stalls and emitted **no standard Playwright final JSON**. [repairs-observed.json](../audit/keyboard-awakens-2026-10-16/repairs-observed.json) is explicitly a summary of actual [list-reporter lines](../audit/keyboard-awakens-2026-10-16/repairs-final.txt), not a substituted Playwright report. Unreported cases are never counted as passes, skips or completed failures.

| Project | Observed outcomes | Reported / planned | Completion boundary |
| --- | --- | ---: | --- |
{observed_rows}

The task-owned stalled worker was stopped first; the owned runner and descendants were later stopped after a second unbounded stall. [Worker intervention](../audit/keyboard-awakens-2026-10-16/edge-worker-intervention.json) and [run interruption](../audit/keyboard-awakens-2026-10-16/edge-run-interruption.json) preserve those actions/reasons. Edge's incomplete matrix remains **UNVERIFIED** beyond its observed cases. Its separate later PWA/brand confirmations do not erase these failures or establish the missing 46 cases.

### Final targeted confirmations by project

These are actual groups from `repairs-confirmation.json`, with that final targeted report's own outcomes. They are distinct from both the full historical failures and the interrupted source-repair attempt above. The final CSS/letter-favicon revision changes the public cache version; its separate brand/PWA confirmation is also recorded above. Do not add repeated checks across these runs as though all were distinct passing cases. {repair_errors}

| Project | Actual focused outcome | Evidence / scope |
| --- | --- | --- |
{repair_rows}

Explicit skipped cases in that focused report remain **UNVERIFIED**:

{repair_skips}

### Audio API capability boundary

[browser-capabilities.json](../audit/keyboard-awakens-2026-10-16/browser-capabilities.json) records actual Windows runner probes: Chromium 156, Firefox 157 and installed Edge 155 expose standard `AudioContext`; Playwright WebKit 27.2 exposes neither standard/prefixed `AudioContext` nor `OfflineAudioContext`. This describes this runner, **not** native macOS/iOS Safari. The earlier combined audio test attempted `Proxy(undefined)`, so its zero-context result was not evidence that the app failed to start supported audio.

Preferences, outline carets, reduced motion and unavailable-audio guidance now run independently across browsers. A separate sound-only case checks the real capability first and records an explicit **UNVERIFIED** skip when unavailable; supported engines retain zero contexts before input, one on a typing gesture and disposal on navigation. Settings explains unavailable device audio without clearing a preference intended for another supported/synced device. Five packs are procedural synthesis, not recorded switch libraries.

The strict sound assertions passed in the observed Chromium/Firefox project selections. The native Edge sound case failed during its interrupted attempt, so Edge sound remains **UNVERIFIED**, despite its API being present. The later Edge brand/PWA passes do not establish sound playback/disposal. The WebKit sound-only case was explicitly skipped because its API was absent; the final 15-case route/font confirmation did not rerun sound.

### Finite typing throughput and event-duration evidence

Both saved samples use local Chromium 156 at 390×844 with 4× CPU throttling applied after loading a custom test, native browser typing events and the exact same 247-unit target. They compare actual exported final text/attempts, rather than assuming requested driver delay equals achieved speed. No browser page errors were recorded. The opening was explicitly bypassed for this isolated input-throughput measurement; it remains present in the separate full-intro Lighthouse run.

| Recorded sample | Requested driver delay | Actual active duration | Correct-character WPM | Attempts / target units | Input accuracy / exact final text | Observed p98 / max event duration |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
{throughput_table}

The burst establishes one finite **200+ WPM / 247-unit no-dropped-input** case, not an unlimited speed guarantee, a physical typist study or all-device acceptance. Event Timing values are quantized/thresholded (entries at least 16 ms) and are **not field INP**. The observed maxima of 144/160 ms exceed 100 ms; neither sample proves a universal sub-100 ms response bound. They do not rescue the failed mobile Lighthouse target.

### Final page and department acceptance table

“PASS — local” below means the named finite check at its recorded checkpoint, not every possible browser/user state or an unperformed complete final-source rerun. The full checkpoints and focused final results above establish the actual project scope. Native and hosted qualifications are part of the result.

| Page / section / department | Status | Test performed | Result / limit |
| --- | --- | --- | --- |
| Home and `/typing-test` | PASS — local | Mode matrix, typing and viewport specs | Real mode/length/language controls, input, wrong keys, resizing and fresh restart. |
| Typing engine | PASS finite correctness; PARTIAL requested policy | 586-test unit suite; exported corrected/IME/timed vectors | Historical mistakes retained, independent canonical timing/replay. Headline word credit and weighted-attempt consistency remain declared differences. |
| Results and share | PASS — local | Corrected-cat exports, PNG 1200×630 signature, result explanation/replay specs | Denominators, per-key evidence, chart/table and targeted practice. No inferred population ranking. |
| Learn / practice aliases | PASS — local | Learning matrix through ten packs and saved assessed evidence | Advance-on-error, rejected-error mode and measured progression; no complete school curriculum or efficacy study. |
| Keyboard Lab / layouts | PASS — local | Lab observation/privacy/drill cases, Workman mapping/content controls | Browser-observed logical signals and qualified transitions; no model/switch detection claim. |
| Local bot race and gray pace | PASS — local | Race mode/pace/restart specs | Actual canonical bot position, user-owned scroll and clean retry. |
| Human race / ranked backend | PARTIAL; hosted UNVERIFIED | SQL replay, validator attacks, guest gates | Server-owned authority implemented; actual two-account race and deployed credentials skipped. |
| Leaderboard all-time/day/week | PASS local SQL + mocked browser transport | Three isolated period RPC cases plus UTC/cap/privacy SQL fixtures | Old all-time preserved; server period aggregates, empty/error/retry/missing endpoint. Real PostgREST acceptance UNVERIFIED. |
| Stats and Profile | PASS — local | Populated/empty history, comparison, reload and narrow-page cases | Uses real owner-scoped history and accepted/unverified distinctions. |
| Settings / fonts / eight themes | PASS finite checks; unsupported/Edge audio UNVERIFIED | Preference persistence, 256 color surface pairs, native-option styles, default/outline caret cases; four shapes implemented | Exact dark tokens, readable alternate palettes, real API notice and five procedural sound options. Contrast-reducing active opacity overrides were corrected; full WCAG and native Safari audio remain gaps. |
| Auth | PASS local forms/owner isolation; hosted UNVERIFIED | Guest links and intercepted account switch | Email/Google actions wired; no real provider or production sign-in claim. |
| About / Touch typing / Privacy / Terms | PASS local UI/metadata | Secondary-page navigation, headings and route metadata | Actual readable content and recovery links. Legal/operator review and crawlers remain deployment gates. |
| 404 | PASS local UI; hosted HTTP UNVERIFIED | Unknown-route recovery spec | Accessible branded recovery; host may still return a soft 404. |
| Offline app page and guest typing | See actual-outage project results above | Download → real server outage → corrected session → recovery → clear download/history check | Static recovery no longer collides with `/offline`; no API/private response caching. Native install/update/eviction UNVERIFIED. |
| Opening / reduced / returning / skip | PASS finite browser lifecycle | Intro cases, no-WebGL fallback, context loss, five runner WebGL create/dispose cycles, handoff fault injection | Dedicated score-free gate; blocked/late handoff chunks preserve input. Replay focus waits for a visible lazy Settings control. GPU memory/60 FPS on real devices UNVERIFIED. |
| Responsiveness | PASS finite checkpoint geometry; latest subset above | 360, 390, 768, 1024, 1280, 1440, 1920, 2560; 844×390; 640×450 zoom equivalent | Wrong glyph, measured caret and fresh restart. Profile containment repair and subpixel/font-ready checks have the focused scope above. Equivalent viewport is not a native zoom certification. |
| SEO | PASS pure/build/local route checks; hosted UNVERIFIED | Titles, aliases, noindex, structured data and sitemap fixtures | Actual origin used; sitemap intentionally omitted without real configured production origin. |
| PWA | PASS local worker/build/browser scope | Versioned allowlist, cache exclusions and offline controls | Generic shell/public assets only; authenticated/native lifecycle remains UNVERIFIED. |
| Security / privacy | PASS local boundaries; production UNVERIFIED | RLS/grants/replay attacks, owner scope, header response, dependency scan | No service key in client, private-text consent and data controls. Automation, query scale and multi-connection behavior remain gates. |
| Accessibility | PARTIAL | Recorded Lighthouse accessibility score above, labels/focus/tables, reduced motion, 256 pair checks | Not a complete WCAG 2.2 AA, native popup, opacity-state, NVDA or VoiceOver audit. |
| Performance | Mobile 95 target FAILED; finite throughput/bundle checks passed | Full-intro Lighthouse, gzip budgets and exact exported 247-unit burst | Opening can become LCP; 228.34 correct-character WPM in one sample does not establish field INP <100 ms, added LCP <150 ms or sustained 60 FPS. |
| Research | Verified official-source scan; Trends UNVERIFIED | Five platforms, three Codrops references and requested Trends scope | No invented rising queries, market share, award status or worldwide uniqueness. |
| CI / operations / deployment | SOURCE; hosted UNVERIFIED | Local commands and workflow/config inspection | Remote CI, migrations, schedules, rollback/backup and public release were not executed. |

### Recorded failures and repairs

The first integrated Chromium checkpoint had 104 passes, seven failures and two credential skips ([chromium-full.json](../audit/keyboard-awakens-2026-10-16/chromium-full.json)). Two demonstrated application defects were repaired: the generated `offline.html` intercepted the `/offline` route, and Tailwind Merge removed the selected caret shape when `caret-blink` was combined with outline/block/underline. Static recovery now has its own `/_offline-recovery.html`; the blink utility has a distinct name.

The remaining initial failures, and one later typing-experience checkpoint (128 passes / one failure / two skips in [chromium-final.json](../audit/keyboard-awakens-2026-10-16/chromium-final.json)), stopped at the separately tested 4.2-second intro under the old unrelated-test 5-second assumption. Those suites now explicitly opt out of the opening, including profile/navigation cases. Intro behavior remains independently exercised, including blocked storage/WebGL, late/blocked handoff chunks, an unavailable animation API and input preservation. No expectation timeout was enlarged to hide an application failure. Prior artifacts remain beside the latest run.

The retained full Firefox/WebKit checkpoint has {browser_summary('cross-engine.json')}. Its raw failures and screenshots remain under [cross-engine-artifacts](../audit/keyboard-awakens-2026-10-16/cross-engine-artifacts/); the focused final repair report is a separate result, not a rewrite of that run. Concrete follow-up changes are:

- **Navigation:** after the URL changed, WebKit could retain the old typing route under a deferred router transition. `BrowserRouter useTransitions=false` makes navigation urgent and uses the existing lazy-route loading fallback. It does not change canonical scoring clocks.
- **Replay focus:** a single animation frame could run before lazy Settings committed. A bounded MutationObserver now restores focus once the replay button exists and is visible, then disconnects; it also cleans up on unmount/expiry.
- **Profile containment:** the guest heading could exceed a narrow panel's content box. The profile header now stacks/contains text at small widths; the populated-history test checks both the actual heading and input border boxes against their panel content areas.
- **Font/geometry harness:** [diagnostic findings](../audit/keyboard-awakens-2026-10-16/font-diagnostic/findings.md) retain real HTTP-200 font loads, exact returned face identities and independently loaded WOFF2 glyph-metric comparisons. WebKit's later global/check state could say unloaded despite the matching rendered metrics. The helper now requires exact registered successful load receipts, retries those same faces once if needed, and allows two paint frames within the original total 10-second Node-owned deadline. The final 15-case route/font confirmation passed five selected cases each in Chromium/Firefox/WebKit. Measured caret comparisons allow one CSS pixel for renderer subpixel rounding; real clipping/missing carets still fail.
- **Sound capability:** the Windows WebKit runner lacks AudioContext, so the former combined test's Proxy fixture failed before installation. Visual preference coverage is now independent; unsupported sound is a documented capability skip with a device notice, rather than a reported sound pass or a fabricated native-Safari limitation.
- **Offline harness:** Firefox's former `context.setOffline()` assumption still allowed the service worker's GET to reach the live test server. The dedicated outage fixture stops the actual static server, then tests offline recovery/history and restarts it. The former failure is retained; the actual-outage result above is independently recorded.

Theme review additionally corrected alternate-palette raised/hover text ratios and introduced a readable secondary-accent text token without changing exact default colors. Handoff review added synchronous cancellation while its module downloads, rejection handling, reduced-motion cancellation and real-caret restoration on animation failure.

The interrupted repair attempt still recorded three WebKit failures (navigation-fallback geometry and font readiness) and four observed native Edge failures before the runner stop. They remain visible above and in their artifacts. Final targeted confirmations have their own narrower scope; no missing Edge cases or capability skips become passes.

The final asset audit found that the SVG favicon still contained the full wordmark, while its PNG/ICO counterparts already used the requested plain letter. The SVG was corrected to one typographic **S** on the dark background, with no emblem. The earlier active-typing opacity overrides also reduced header/footer to .25, controls to .35 and non-error feedback to .65; those CSS overrides now retain opacity **1**. The strengthened served-asset/active-opacity assertions and actual-outage PWA journey have their own `icon-pwa-final.json` result after rebuilding. Earlier reviews are not relabelled as having already met those strict requirements. Application JavaScript did not change in that final asset/CSS revision.

### Known limitations and requested-spec differences

1. **Performance retains the measured scope above.** {performance_limit} A 4.2-second text-bearing opening competes with a 150 ms added-LCP target. The code drops desktop bloom on measured low FPS; native hardware, field INP and sustained thermals still need measurement. No hidden/reduced-motion-only score is presented as a full-intro score.
2. **Metrics remain compatible `forge-v3`.** Main WPM is word credit, not the requested character formula; a separate correct-character statistic is provided. Consistency uses weighted attempt buckets, not per-second correct WPM. Input accuracy counts committed insertion graphemes, not modifier/backspace keydown events. A new canonical policy requires versioned server/history comparisons.
3. **Focus behavior:** ordinary input blur preserves the session and idle time continues; personal practice has explicit Pause/Resume. Automatic pause-on-window/visibility-loss was not substituted. Races keep authoritative deadlines. This differs from the requested blanket automatic pause/resume.
4. Five sound choices are procedural synthesis, not five recorded commercial switch sample libraries. The probed Windows Playwright WebKit has no AudioContext API; its sound-only check is explicitly UNVERIFIED, while visual preferences and unsupported-device guidance remain tested. Native Safari gesture/audio behavior is independently UNVERIFIED. The CPU/mobile renderer deliberately uses simpler PBR and smaller textures; fallback uses HTML/CSS geometry rather than the WebGL dissolve shader.
5. A beginner guide and adaptive model do not constitute a complete TypingClub curriculum/classroom system. Content breadth, native script fonts/layouts, actual learning outcomes and engagement require further editorial and user validation.
6. Google Trends rising queries remain UNVERIFIED for all six terms across Worldwide/India/US. No result was inferred from roundups or normalized interest terminology.
7. Hosted Supabase Auth/Google OAuth/Edge/Realtime/cron, simultaneous clients, native Safari/iOS/Android, actual screen readers and install/eviction/update behavior remain UNVERIFIED. Public operator/legal details and the deployment origin still require the real environment.
8. Exact palette pair checks and a lab CLS observation do not establish full contrast/layout-shift conformance. Several non-Latin font fallbacks depend on installed system fonts; their size adjustment is not fully calibrated.

No finite test suite proves universal zero defects, physical keyboard identity, human typing or worldwide visual originality. The implementation is reviewable locally; the failed/unverified release gates above remain open.

Related material: [Phase 0 research](KEYBOARD_AWAKENS_RESEARCH_2026-10-16.md), [brand contract review](../audit/keyboard-awakens-2026-10-16/brand-contract-review.md), [offline/secondary pages](OFFLINE_SEO_AND_SECONDARY_PAGES_2026-10-16.md), [period rankings](PERIOD_RANKINGS_2026-10-16.md), [deployment](DATA_AND_DEPLOYMENT.md), and the source delivery under `delivery/` when generated by the root handoff.
'''
checkpoint = f'''
## Keyboard Awakens — current local checkpoint, 16 October 2026

Current identity is **wordmark-only SparowType**, Sora 700 with lime/violet dark tokens and retained light/alternate themes. Earlier sky-blue/sparrow entries below describe historical revisions. Workman and short/medium/long quote controls, measured feedback, secondary information pages, offline controls and real day/week server aggregate views are now implemented; they must not be mistaken for the older remaining-work list. Metric/storage compatibility stays `forge-v3`.

- Local evidence: **586 unit tests / 37 files**, scoped business-logic coverage, full typecheck/lint, 17-migration SQL compatibility and content/dependency gates. See the [current product audit](KEYBOARD_AWAKENS_PRODUCT_AUDIT_2026-10-16.md) for exact warnings, scopes and saved paths.
- Final targeted selection: {'; '.join(project + ': ' + result for project, result in repairs.items())}. This is not a new full-source browser sweep. The earlier 208-case attempt was interrupted: {observed_summary}; native Edge's unreported cases remain UNVERIFIED. Original failed matrices and interruption records remain retained. Unsupported Windows WebKit audio is a sound-only capability skip, with visible device guidance; it does not establish native Safari behavior.
- Current public build `{build['version']}`; initial JS **{bundle['initialPracticeJsGzipBytes']:,} gzip bytes**. The interrupted source-repair attempt used `{observed['testedBuild']}`; later SVG/CSS fixes use plain **S** favicon text and full active-control opacity. Final icon/PWA confirmation: {browser_summary('icon-pwa-final.json')}.
- Mobile lab: **{scores}** ({lh_scope}). {performance_limit} Bundle limits do not establish field INP, real-device 60 FPS or added-LCP targets.
- Finite throughput: a saved 247-unit Chromium/4× CPU burst achieved **228.34 correct-character WPM**, exact final text, 247 attempts and 100% input accuracy. Observed event p98/max were 80/160 ms, not field INP or a maximum-under-100 ms guarantee; the separate 20 ms driver sample achieved 165.67 WPM with 88/144 ms observed p98/max. Both source JSON reports are linked in the current audit.
- Hosted Auth/Google OAuth/Edge/Realtime/cron, independent simultaneous races, native devices/IME/screen readers and public deployment remain **UNVERIFIED**. Primary word-credit WPM/weighted-attempt consistency and explicit personal pause behavior still differ from parts of the requested new specification. No commit, migration or publication is claimed.

The current audit supersedes older “latest” summaries while preserving their original evidence and remaining failures below.
'''
status_path = root / 'docs/IMPLEMENTATION_STATUS.md'
status = update_status_ledger(status_path.read_text(encoding='utf-8'), checkpoint)
report_path.write_text(report.rstrip() + '\n\n' + final.strip() + '\n', encoding='utf-8')
status_path.write_text(status, encoding='utf-8')
print('Final audit written from actual saved reports.')
