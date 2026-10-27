# Isolated native backend acceptance

Executed 2026-10-20 UTC (2026-10-21 in Asia/Calcutta). This supplements the final [mobile, games and static audit](../../docs/MOBILE_GAMES_STATIC_AUDIT_2026-10-20.md). It is a finite local acceptance check, not production deployment or load certification.

## Observed results

| Check | Result | Receipt |
| --- | --- | --- |
| Account/data HTTP lifecycle | **15 checks passed** | [data](backend-ephemeral-data.json) |
| Course HTTP lifecycle | **10 checks passed** | [course](backend-ephemeral-course.json) |
| Race HTTP/InnoDB lifecycle | **10 checks passed** | [race](backend-ephemeral-race.json) |
| Password policy | **Passed:** real/dummy bcrypt cost both 12; significant characters beyond byte 72 preserved | [password](backend-ephemeral-password.json) |
| Native browser account and two-person race | **7 passed, 1 Firefox account timeout**, retries 0; all four ordinary-clock human races passed | [original JSON](backend-ephemeral-native-browser-1.json), [compact summary](backend-ephemeral-native-browser-1-summary.json) |
| Remaining credentialed sign-in / request-context race authorization | **7 passed, 1 Firefox Email-locator timeout**, retries 0; all four request-context race authorization checks passed | [original JSON](backend-ephemeral-native-browser-2.json), [compact summary](backend-ephemeral-native-browser-2-summary.json) |
| First quiet confirmation infrastructure attempt | **2 connection-refused failures before app execution**; original preview/services had disappeared | [separate infrastructure receipt](backend-ephemeral-native-browser-quiet-firefox-auth-connection-refused.json) |
| Restored quiet Firefox account-flow and credentialed sign-in | **1 passed / 1 failed**, retries 0. Sign-in passes; account test passes signup, typing and server-save checks, then fails to find course input after Start lesson | [original JSON](backend-ephemeral-native-browser-quiet-firefox-auth.json), [compact summary](backend-ephemeral-native-browser-quiet-firefox-auth-summary.json) |
| After6 full account-flow confirmation | **Not run.** The user requested acknowledgement only before launch; no after6 native result is claimed | No run/report generated |
| Shutdown of active successful instance | **Passed:** owned preview/API/DB stopped, graceful MariaDB shutdown, exact marked audit directory removed; protected user services remain | [cleanup receipt](backend-ephemeral-cleanup.json) |

The HTTP suites ran once after correcting the new runner's readiness check. Their combined [summary](backend-ephemeral-summary.json) records exit code zero for all four suites. No product source change was required for these results.

## Isolation and ownership

The earlier attempt to create a separate schema with the configured account stopped on SQLSTATE42000 before database creation; [its original receipt](backend-provision.json) and [report](backend-verification.md) are preserved. No grants on that configured server were changed.

This later route used the installed MariaDB **10.4.32** server and Windows initializer to create a wholly new instance. It did not read `backend/config.php`, connect to the existing database, install a Windows service, or bind beyond loopback. PHP **8.2.12** used its required `intl`, `mbstring` and `pdo_mysql` extensions.

The [provisioning receipt](backend-ephemeral-provision.json) confirms an initially empty `sparow_mobile_games_6bbf6bd3f79ea1fe_audit` schema, production schema version 1 and 10 tables. The runner created a new application user with only SELECT/INSERT/UPDATE/DELETE permissions on that new schema. Root credentials and application secrets were randomly generated for this instance and saved only inside its ignored audit directory.

The [environment receipt](backend-ephemeral-environment.json) identifies the original successful instance:

- MariaDB: `127.0.0.1:5058`, owned PID49700.
- PHP API: `http://127.0.0.1:5059/api`, owned PID32804.
- Browser preview: `http://127.0.0.1:6003`, owned PID51496, proxying only the new API.
- Existing services remained `127.0.0.1:3308` PID18028 and `127.0.0.1:8081` PID19308 when checked after native suites.

Before any schema write, the private guard verified the connected server's actual port, data directory, PID-file path and PID against the freshly spawned process. The server used `--no-defaults` and explicit data/PID/log/temp paths. The preview reused the existing production artifact; no build or product configuration file was changed.

The private PHP configuration supplied a unique session cookie namespace and session directory. Both direct API readiness and preview proxy readiness checked that exact namespace. Generated account passwords and cookies are absent from public receipts. Browser tracing is explicitly disabled, including failed cases.

Those original owned processes later disappeared before the predeclared quiet check. Runner session40542 was unknown and the original runner PID53456 was absent. No successful cleanup receipt or normal database shutdown record was present; the retained server log ended at its original startup. The runner source has no HOLD lease/watchdog. The cause of the external disappearance remains **unproven**. The first quiet attempt therefore produced two `NS_ERROR_CONNECTION_REFUSED` navigation failures before either application flow executed; it is retained separately and does not confirm or refute the earlier application behavior.

Root then explicitly authorized recovery of the **same** marked synthetic data directory, without initialization, account reseeding, secret changes or rate-counter resets. The [resume readiness proof](backend-ephemeral-resume-environment.json) records new owned PIDs47608/44336/44712, exact port/data-directory/PID identity, the original cookie namespace, API health/schema1, and byte-identical fetched/local `offline-build.json` version `75b0ca89254fc510f652`. Only after those guards passed was a fresh, separately declared two-case confirmation started. The original user processes19308/18028/54056 remained outside recovery ownership.

## Boundaries actually exercised

The data suite covered guest cookies and CSRF, invalid CSRF and foreign Origin rejection, hashed signup with rotation, anonymous/wrong-owner access, valid unique public handles, preference conflict/type handling, replay tampering and immutable deduplication, owner-isolated history, consent/expiry for private text, deletion tombstones, long-password sign-in, explicit account deletion and cookie invalidation, personal/ranked separation, and the configured authentication rate limit.

The course suite covered boolean preference roundtrips, server-derived finite assessment, corrected failed practice, rejection of client qualification and foreign-owner claims, personal speed qualification, independent cookie history restoration, replay expiry preserving durable assessment, contribution removal on session deletion, and account deletion invalidating another cookie client.

The race suite covered authenticated membership/countdown, replayed immutable progress, finish persistence/idempotency/rematch, a contested room seat serialized through independent PHP processes, authenticated quick match, stale-host exclusion, shared deadline settlement, bulk/burst/sustained-rate rejection heuristics, comparison-dimension rejection, and one-use ranked redemption.

These existing harnesses deliberately submit synthetic canonical events and use bounded SQL fixtures to advance room/challenge deadlines. They verify HTTP/PDO/business boundaries; they do not constitute human input, natural-clock racing, production hosting, native mobile keyboard, or internet network testing. Separately coordinated browser cases use individual browser key events and an ordinary-clock race; their result must be read from their own receipt.

## Original native browser outcome

The first group ran eight cases with one worker, retries 0 and traces off: account signup/replay/history/preferences/deletion and the 30-second two-context human race, each in Chromium, Edge, Firefox and WebKit. It completed **7 passed / 1 failed / 0 skipped / 0 flaky**, with a 554.2-second suite duration. All four human race cases passed, including bidirectional server-confirmed opponent pace and ordinary-clock result settlement. Account lifecycle passed in Chromium, Edge and WebKit.

The Firefox account test timed out while waiting for the **first signup-toggle button**, at `e2e/php-account-flow.spec.ts:31:93`, before creating its new account. It reported a 90000ms test timeout and a separate 90000ms context teardown timeout. Browser logs accompanying that timeout contain `RenderCompositorSWGL failed mapping default framebuffer`, Juggler progress-listener `NS_ERROR_FAILURE`, and disposed page-channel/remote-debugging-pipe errors. These diagnostics accompany the failed run; they do not establish an application cause. The next Firefox human-race case passed after the worker restarted. The original failure is retained even if a later quiet confirmation passes.

The second group selects only the real credentialed sign-in and two-account race authorization cases. Its four sign-in cases use browser pages; its four race authorization cases use Playwright request contexts without opening a page. Accordingly the two groups together comprise **12 browser journeys plus 4 request-context cases**, not 16 independent browser-engine interactions. None of the other mocked form/bot tests is included again.

The second group completed **7 passed / 1 failed / 0 skipped / 0 flaky** in 95.0 seconds, with retries 0. The Firefox sign-in case exhausted its 30000ms test budget while waiting for the Email label at `e2e/auth-flow.spec.ts:56:77`, before filling credentials. Its retained error-context provides the locator callsite but no DOM snapshot/screenshot. Credentialed sign-in passed in Chromium, Edge and WebKit. All four request-context authorization cases passed.

The original 16 opt-ins therefore remain **14 passed / 2 failed**, with both failures on the initial Firefox auth page. Browser and application causality is not established for those timeouts. The successful Firefox human race includes real sign-in and ordinary-clock server settlement, but does not overwrite either failed result. No browser or backend suite remains active after these two groups; only the isolated API, database and preview are held idle for the separately coordinated quiet confirmation.

The after5 candidate includes a later conditional home-loader repair. The restored quiet confirmation was tied to build `75b0ca89254fc510f652`; it was not a controlled rerun of the original app artifact. Credentials, server limits and the original 90000ms account/30000ms sign-in budgets remained unchanged; neither a later pass nor a quieter environment rewrites the original failures.

The restored final-candidate confirmation completed **1 passed / 1 failed / 0 skipped / 0 flaky** in17.5 seconds, retries0. The real credentialed Firefox sign-in passed. The account test passed signup, the ordinary typing result, `Saved to your account`, and the server history/accuracy assertions. It then navigated to `/lessons?lesson=home-anchors`, clicked `Start lesson`, and failed the existing5000ms `Typing input` visibility check at `e2e/php-account-flow.spec.ts:71` / `e2e/helpers.ts:36`. Its retained snapshot shows the fully loaded F and J anchors setup,0/2 checkpoints, VariantA and an enabled Start lesson button, rather than an active typing input. This later failure must not be collapsed into the original auth-page timeouts.

Read-only source review found a reachable session-bootstrap race consistent with that snapshot: `AccountWorkspace` keys routes by `user?.id ?? "guest"` during initial auth loading, while Lessons' Start/begin guards depend on history loading without auth loading. Guest history can become ready first; an early Start can then be discarded by the guest-to-account route remount/owner reset. The no-trace run lacks a per-action/network timeline, so its exact schedule is not proven by these artifacts. No automatic rerun or product source change is implied by this report; the full account journey remains unverified until the specific course-start behavior is resolved and checked.

The later shared workspace-readiness repair was built as after6 candidate `e4d36e64f41584da25a9`. A four-engine account-flow confirmation was prepared with unchanged budgets, credentials and limits. It was **not launched** after the user's subsequent acknowledgement-only instruction. There is no after6 native browser report, and the previous native results are not upgraded by that source repair alone.

## Final cleanup and remaining files

At **2026-10-20 19:47:08 UTC**, the guarded recovered-instance runner stopped its own preview PID44712 and PHP PID44336, requested a verified graceful shutdown of its own MariaDB PID47608, and removed only `D:\extra\typing_updated\typing-forge\backend\storage\mobile-games-instance-6bbf6bd3f79ea1fe`. No forced database stop was needed. The original marker, resumed ownership marker and resolved directory boundary were checked before removal. Its [cleanup receipt](backend-ephemeral-cleanup.json) records the exact ownership and result.

A final read-only process/listener check found no owned listeners on5058/5059/6003 and no owned processes47608/44336/44712. Protected user services remained unchanged: PHP8081 PID19308, database3308 PID18028 and preview4173 PID54056. The two earlier policy-denied stopped directories listed below still exist and were not touched. All original native pass/failure reports, the connection-refused infrastructure attempt and the restored after5 result remain on disk. No further tests, browser runs or product edits followed cleanup.

## Readiness corrections and retained failed attempts

Three setup attempts reached a fresh schema but failed the runner's readiness check before any lifecycle suite. The runner called `response.ok()` as if it were Playwright's APIResponse; Node fetch exposes the boolean `response.ok`. An independent request returned HTTP200 and the correct unique session namespace. Both readiness checks were corrected. This was an audit-harness defect and does not establish a product failure.

Each failed instance was stopped gracefully. Historical [attempt 1](backend-ephemeral-attempt-1-failure.json), [attempt 2](backend-ephemeral-attempt-2-failure.json) and [attempt 3](backend-ephemeral-attempt-3-failure.json) failure/cleanup receipts remain separate. No browser case was retried.

Automatic approval review rejected the guarded PowerShell removal of two already-stopped failed-attempt directories, reporting only `blocked by policy`. No alternative deletion tool/path was used after rejection. The following ignored directories remain, containing only the generated audit instance material:

- `D:\extra\typing_updated\typing-forge\backend\storage\mobile-games-instance-a259364bf1489e3a`
- `D:\extra\typing_updated\typing-forge\backend\storage\mobile-games-instance-461ff9ad9d349a88`

Their [attempt 2 cleanup](backend-ephemeral-attempt-2-cleanup.json) and [attempt 3 cleanup](backend-ephemeral-attempt-3-cleanup.json) receipts confirm that their owned processes were stopped. The first failed attempt removed its own directory before this policy rejection. No real user records were created, deleted or migrated by this isolated acceptance.

## Initialization references

Checked against installed binary help and primary MariaDB sources on 2026-10-20 UTC:

- [Windows system-table initialization](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/installing-mariadb/installing-system-tables-mariadb-install-db/mariadb-install-db-exe): explicit data directory/port/password and optional service creation.
- [Matching MariaDB 10.4.32 initializer source](https://github.com/MariaDB/server/blob/mariadb-10.4.32/sql/mysql_install_db.cc): bootstrap uses `--no-defaults`; service registration requires an explicit nonempty service argument.
- [Server option reference](https://mariadb.com/docs/server/server-management/starting-and-stopping-mariadb/mariadbd-options): `--no-defaults` prevents option-file inheritance.

The reproducible audit tooling is [the instance runner](backend-ephemeral-instance-runner.mjs) and [the browser runner](backend-ephemeral-browser-runner.mjs). Both require explicit opt-ins; the instance runner requires a separate stdin command before preparing a browser preview.
