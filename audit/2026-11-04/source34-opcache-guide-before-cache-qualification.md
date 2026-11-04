# PHP OPcache runtime profile

**Verified 4 November 2026 on an isolated owned web runtime. Status: CONDITIONAL production-wire burst PASS; ordinary/full capacity FAILED.** The optional [configuration fragment](../backend/opcache.ini.example) was loaded and verified on a fresh owned Apache/PHP runtime. This does not activate OPcache on a hosting account or the user's existing XAMPP installation.

Source34 retained the same strict p95 target of less than 150 ms for every representation:

| Runtime | Evidence representation | p95 | Result |
| --- | --- | ---: | --- |
| Ordinary, uncached | Full | 188.6088 ms | FAILED |
| Ordinary, uncached | Production wire | 157.5576 ms | FAILED |
| Verified OPcache profile | Full | 190.5714 ms | FAILED |
| Verified OPcache profile | Production wire | 141.3239 ms | PASS for this declared burst |

Each run completed all 1,653 operations at 20 concurrent HTTP requests, with 50 rooms, 8 seats per room, 400 accepted submissions and leaves, and zero unexpected responses. This is not a sustained 400-concurrent-client, production-hosting, multi-region or authentication-throughput certification. See the immutable [ordinary assessment](../audit/2026-11-04/source34-ordinary-capacity-assessment.json) and [OPcache assessment](../audit/2026-11-04/source34-opcache-capacity-assessment.json) for the complete scope and raw evidence hashes. The ordinary native atomic counter passed; the profile's real Arena lifecycle passed 32 checks, including full final-chart persistence and immutable retry.

All older failures remain recorded, including source33 ordinary [full 193.2158 ms](../audit/2026-11-02/source33-capacity-ac90918fa4030e51.json), [wire 172.1367 ms](../audit/2026-11-02/source33-capacity-wire-ac90918fa4030e51.json), and the separately [assessed source33 profile](../audit/2026-11-04/source33-opcache-v3-capacity-assessment.json). The conditional source34 result does not replace them or establish a default/full pass.

## Configuration

The fragment enables web-request bytecode caching, reserves 128 MiB with 8 MiB for interned strings, and requests capacity for 4,000 scripts. It retains comments and working-directory separation. Timestamp validation stays enabled with a zero-second revalidation interval. JIT is disabled, including its buffer; CLI caching is disabled. PHP documents the directive meanings, supported settings and effective cache-key sizing in its [OPcache configuration reference](https://www.php.net/manual/en/opcache.configuration.php). These are the tested fixed values; they have not been measured as optimal for a hosting account.

This profile changes no application response cache, database connection policy, PDO preparation mode, SQL statement, transaction durability, rate limit, replay rule or authentication policy. It does not change frontend or 3D assets.

## Activation boundary

This is a repository-provided host-settings fragment. The current hosting archive packager does not copy or load it automatically. Obtain the example from the repository when opting into this profile; extension setup remains a separate host operation.

OPcache must be available in the PHP installation serving HTTP. The host administrator or the isolated test controller loads that installed extension through the startup configuration, then applies the fragment to that web SAPI and restarts only the intended runtime. Extension selection depends on the host's PHP build and operating system; the example deliberately contains no extension path. PHP describes loading the module with `zend_extension` in its [installation documentation](https://www.php.net/manual/en/opcache.installation.php).

For this repository's local audit, use only a newly owned Apache/PHP instance with its own generated configuration, database and ports. **Do not edit the global XAMPP configuration or restart the user's existing services.** On Windows, give that owned instance a unique `opcache.cache_id`; PHP documents that the same user, SAPI and cache ID share an OPcache instance in its [cache-ID reference](https://www.php.net/manual/en/opcache.configuration.php#ini.opcache.cache-id). That owner-specific value belongs in the generated runtime configuration, not in this portable fragment.

On shared hosting, use the provider's supported extension and web-PHP controls. A `.user.ini` file does not guarantee that the extension can be loaded or system-only OPcache values changed: per-directory files apply to CGI/FastCGI and accept only their permitted setting modes. Confirm the provider's actual web-SAPI settings; if those controls are unavailable, this profile remains UNVERIFIED. See PHP's [.user.ini documentation](https://www.php.net/manual/en/configuration.file.per-user.php).

No file-cache directory is configured here. Any platform-specific fallback requires a separately declared, private writable directory supplied by its runtime controller or hosting provider.

## Evidence required before a performance claim

Use the same HTTP SAPI that handles the Arena requests. CLI configuration output cannot establish web-cache behavior when CLI caching is disabled. A private, owner-controlled probe must record the effective directives, `opcache_enabled`, cached-script count, hits, misses, cache-full and restart states before and after the workload. It must also confirm that the expected application scripts are cached. PHP provides [cache status](https://www.php.net/manual/en/function.opcache-get-status.php) and [per-script cache checks](https://www.php.net/manual/en/function.opcache-is-script-cached.php); these report the in-memory cache. Export only bounded counts and booleans, keeping private paths and configuration contents out of public reports. An unavailable or restricted status API is missing evidence, not proof of successful caching.

The acceptance protocol must declare its startup and warmup behavior in advance, retain the actual cold/warm observations, and require positive cache activity and application-script evidence. Run both original full-evidence and production-wire workloads with the same 50 rooms, 8 seats per room, 20 concurrent HTTP requests, 1,653 operations, correctness checks and strict 150-ms target. Preserve every result, including any failure. Do not use a profiled or warmed subset as a replacement for an ordinary declared workload.

The source34 profile added no application warmup, cache reset, retry or result filtering. It recorded the initial cache state, then ran full evidence, production wire and the native Arena lifecycle in that order. Its final proof recorded 18 cached scripts and 42,721 hits, with the actual application entry point, validator and Arena evidence script matched by canonical full path, frozen source SHA and file timestamp. On this Windows runtime, forward-slash-only `opcache_is_script_cached` queries returned false for cached class files; realpath queries and full canonical metadata agreed. Those raw false lookup facts remain preserved. A basename match or CLI-only probe does not establish application-script caching.

Afterward, stop the same owned services gracefully and record residual-process checks and the original services' untouched state. Hosting-wide throughput, sustained 400-client operation and production deployment remain separate verification.

## Source and runtime identity

The existing 505-file production manifest excludes this example and this document. Before starting an OPcache test, add the SHA256 of `backend/opcache.ini.example` to the protocol's explicit extra runtime inputs, then verify it again after both workloads. Also bind the generated runtime configuration, effective web-SAPI identity and installed extension binary identity. Keep these runtime identities separate from the frozen application identity; do not alter or relabel an older manifest.

For source34, all 505 production files, all 38 backend files and all 9 separately bound profile inputs remained unchanged through workload completion and graceful owned-service cleanup. The portable fragment remains unchanged. This document's status was updated only after those checks and cleanup; its exact tested version is [archived separately](../audit/2026-11-04/source34-opcache-profile-docs-tested.md). Future runs must bind their current documentation/configuration hashes in a new preparation manifest rather than reuse an old manifest after inputs change.

The profile requires explicit hosting-provider activation and fresh verification on that host. It is not automatically loaded by the hosting packager, and no global XAMPP configuration or existing user service was modified. Official PHP documentation linked above was checked on 4 November 2026.
