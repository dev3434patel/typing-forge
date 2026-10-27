# Native PHP HTTP acceptance: isolated provisioning attempt

Date: 20 October 2026. Status: **UNVERIFIED — isolated provisioning blocked**.

The existing guarded `data-lifecycle.mjs`, `course-lifecycle.mjs` and `race-lifecycle.mjs` harnesses and their PHP fixtures were read before execution. A separate audit runner attempted to create a uniquely named, empty loopback database using the credentials already configured in private `backend/config.php`. The database account returned **SQLSTATE 42000 before any audit database was created**. Private diagnostics and credentials were not emitted.

Per the authorized boundary, the attempt stopped there. No privileges were granted, no existing database was selected or migrated, no user records were created/deleted, and no existing rate counters were reset. No secondary PHP HTTP server was started. Therefore the account/data/course/race lifecycle suites were **not run** in this attempt, and there is no new isolated API endpoint for native browser acceptance.

The runner's own temporary configuration and empty session directory were removed after the blocked attempt. The normal application PHP listener on `127.0.0.1:8081` and database listener on `127.0.0.1:3308` retained their original process identities, 19308 and 18028 respectively, in the final read-only check.

Evidence:

- `backend-provision.json`: safe provisioning status, `created:false`, SQLSTATE and credential-output flag.
- `backend-cleanup.json`: no audit database existed to drop; own temporary files removed; application port left unchanged.
- `backend-audit-runner.mjs`: explicit-opt-in audit preparation and lifecycle orchestration, including strict generated database identity checks and scoped cleanup. It contains no credentials and is not part of the product runtime.

These receipts do not establish a product backend defect. They establish that this local configuration did not permit the isolated acceptance setup. Existing unit/replay tests and other agents' browser/static verification remain separate evidence.
