# PR-02: regression harness boundary checks

Baseline: `6a69831af45856e986af0d5d28988eb47c208abb`. This is an implementation follow-up to the reported independent review, not an independent review by the author. Application calculation/state/storage code, dependency versions, repository settings and Cesium were not changed. The existing branch and normal-push authorization cover this limited verification correction.

## Changes

- `TEST_BASE_URL` is validated **before Playwright is imported or a browser starts**. HTTP/HTTPS and canonical hostnames `localhost`, `127.0.0.1`, `[::1]` are accepted. Equivalent WHATWG URL spellings are normalized; trailing `/` and default ports become the canonical origin. Other hosts, credentials (including empty userinfo), invalid schemes, non-root paths, queries/fragments, whitespace/control characters and backslashes are rejected. Invalid credential URLs do not echo their values in validation errors.
- Browser `request` events supply the observation count and `externalApiCalls`; route abort decisions supply the separate `blocked` list. A run requires at least one observation, no blocked requests and no off-origin observed requests. An off-origin observation fails even if it was not intercepted by the route handler. Failed assertions cannot print the final PASS result.
- The legacy field name `externalApiCalls` conservatively counts **all off-origin browser request attempts**, including blocked attempts and assets. It is not a measurement of server-side proxy egress. Query strings, fragments and URL credentials are omitted from blocked-request records.
- Service Workers are blocked in the isolated browser context so they cannot take over requests outside the route fixture. This changes only the test context, not application or service settings.

## New validation

`node --test --test-reporter=tap docs/security/2026-11-05/state-regression-safety.test.mjs`: **58/58 PASS**. Cases cover valid/normalized loopback URLs; rejected external/IP-lookalike/credential/scheme/path URLs; rejection before Playwright import; observed versus blocked requests; same-origin credentials; missing/unintercepted observations; and evidence-copy isolation. Rejection cases are synthetic unit tests, not requests to real sites.

Scoped lint on the harness, safety helper and unit tests: **0 errors / 0 warnings**.

The hardened harness was run once against the existing localhost production build for the unchanged application. Node 24.22.1 / npm 11.19.1, isolated Edge, synthetic inputs/storage strings only. **41 checkpoints PASS; 120 browser requests observed; 0 off-origin attempts; 0 blocked requests; 0 uncaught page errors.** `TEST_BASE_URL=http://127.0.0.1:3105/` exercised origin normalization in this run.

This is a **new run**, without `STATE_TEST_BASELINE`. The earlier 41-checkpoint before/after result and its [state-followup.json](security/2026-11-05/state-followup.json) are unchanged and retain their original meaning. Current source hashes, previous harness hash, raw result hashes, build ID, new counts and the retained evidence hash are in [harness-followup.json](security/2026-11-05/harness-followup.json).

Use the existing [reproduction instructions](STATE_SYNC_FOLLOWUP_2026-11-05.md), with a loopback origin. The script blocks off-origin routes and fails the run on any blocked request. No install/audit, unrelated suite, fresh application build, authenticated Preview, real credential/tile/device or production test was performed for this harness-only change.

## Review and remaining work

The parent reported no new Required Fix for the application-state delta at the baseline. Those application files remain unchanged; the new harness/helper/test delta still needs review. The author has not performed formal approval, Ready transition, merge, release or risk acceptance.

Cesium 1.147.0 plus matching CDN assets remains a separate pending decision. Existing lint debt, minimatch findings, Human checks and Production-trigger verification are unchanged.

**Documentation Sync Trigger:** the test URL contract and evidence semantics changed. This follow-up, its JSON evidence, unit tests and PR body are synchronized; earlier evidence is retained rather than rewritten.
