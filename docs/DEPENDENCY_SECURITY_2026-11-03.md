# Dependency security update — PR-02

Date: 2026-11-03. Baseline: `a175e36cae0d23bb402ff868de4742423c8e385a` (latest `main` when work began).
Implementation and local validation only; this document is not an independent review or risk acceptance.

Follow-up to the independent review of `aa75ccf606a81871549482b78b748cef0bbd26ad`: **BLOCKED remains**. The Cesium production asset-path defect is corrected below; lint, development minimatch, a newly reproduced webpack/Cesium export incompatibility, Human checks and production-trigger verification remain open. See [follow-up evidence](security/2026-11-03/review-followup.json).

## Changes and compatibility

| Package / setting | Before (lockfile) | After (lockfile) |
| --- | --- | --- |
| next / eslint-config-next | 16.1.1 | 16.4.3 |
| react / react-dom | 19.2.3 | 19.3.1 |
| jspdf | 4.0.0 | 4.2.1 |
| cesium | 1.136.0 | 1.146.0 |
| resium | 1.19.2 | 1.19.2 (unchanged) |
| cheerio → undici | 1.1.2 → 7.16.0 | 1.2.0 → 7.30.1 |
| protobufjs (Cesium dependency) | 7.5.4 | 8.8.1 |
| sharp (Next optional dependency) | 0.34.5 | 0.35.5 |
| dompurify / nanoid | 3.3.1 / 3.3.11 | 3.4.17 / 3.3.20 |
| postcss / fflate | 8.5.6 / 0.8.2 | 8.5.23 / 0.8.3 |
| protocol-buffers-schema | 3.6.0 | 3.6.1 |
| copy-webpack-plugin | 13.0.1, unused | removed |
| engines.node | unspecified | `^22.23.4 \|\| >=24.22.1` |

The current main already used jsPDF 4.0.0. This repository therefore requires a minor jsPDF update, not a 3.x-to-4.x migration. npm registry metadata and the actual lockfile were used in place of assuming the October 29 inventory remained current. Undici 7.24.0 is no longer sufficient for the current advisory set; the compatible lockfile update resolves 7.30.1.

The official [Next 16.2](https://nextjs.org/blog/next-16-2), [16.3](https://nextjs.org/blog/next-16-3), [16.4](https://nextjs.org/blog/next-16-4), and [16.4.3](https://github.com/vercel/next.js/releases/tag/v16.4.3) notes were checked. Optional Cache Components, Partial Prefetching and experimental features remain unconfigured. Next 16.4.3 accepts React `^19.0.0`; React DOM 19.3.1 requires React `^19.3.1`. Resium 1.19.2 accepts Cesium `1.x` and React/React DOM `>=18.2.0`, so no resium update was needed. Cesium 1.146.0 requires Node >=22.0.0; validation used 24.22.1.

Next 16.4.3 accepts sharp `^0.35.5`, fixing the image-library findings without an override. Cesium's parent update supplies protobufjs 8.8.1. The unused copy-webpack-plugin was already absent from webpack configuration; removing it also removes its vulnerable serialize-javascript dependency and the fast-uri path. Other development transitive dependencies were updated within their parents' compatible ranges. No `npm audit fix --force`, overrides or unrelated direct major updates were used.

`CESIUM_BASE_URL` now uses Next's `compiler.define`, shared by Turbopack and webpack, with the Cesium 1.146 CDN base. The original webpack-only definition did not reach the production bundle. On the reviewed HEAD, the actual production page resolved assets under `file:///ROOT/node_modules/@cesium/engine/Source/Core/`, failed to load them and stopped rendering. The corrected production bundle contains the literal CDN base; real Cesium worker modules responded in an isolated browser with installed-package assets served locally and synthetic imagery/tileset responses. This proves local production asset/worker resolution, not live CDN availability, real tile compatibility or Human visual acceptance. Application/API/calculation logic is unchanged. [Next compiler documentation](https://nextjs.org/docs/architecture/nextjs-compiler) and the installed Next 16.4.3 documentation/source confirm this option.

The follow-up removes the obsolete webpack callback, its unused import and its now-unnecessary empty Turbopack configuration/type suppression. It does not suppress lint checks or change dependency versions. Next-generated production type declarations are retained.

## Audit comparison

These are **npm vulnerable package counts**, which include affected parents, not counts of unique CVEs or reachable exploits.

| Audit | Critical | High | Moderate | Low | Total | Exit |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Before, `npm audit --omit=dev` | 3 | 6 | 4 | 0 | 13 | 1 |
| After, `npm audit --omit=dev` | 0 | 0 | 0 | 0 | 0 | 0 |
| Before, `npm audit` | 3 | 15 | 8 | 1 | 27 | 1 |
| After, `npm audit` | 0 | 0 | 16 | 0 | 16 | 1 |

[Machine-readable audit evidence](security/2026-11-03/audit-evidence.json) contains package versions, all advisory/range references from the audit, remaining findings, counts and hashes of the original audit JSON files. It covers the whole dependency tree, including development dependencies. A clean audit is a point-in-time known-advisory result, not proof of absence of all vulnerabilities or proof of production deployment.

Examples resolved by this update include:

- Next: [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr), [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r).
- jsPDF: [GHSA-pqxr-3g65-p328](https://github.com/advisories/GHSA-pqxr-3g65-p328), [GHSA-p5xg-68wr-hm3m](https://github.com/advisories/GHSA-p5xg-68wr-hm3m) and the other jsPDF advisories in the evidence. The current handrail UI uses `window.print()`; the package finding alone does not establish an exploitable application path.
- protobufjs: [GHSA-xq3m-2v4x-88gg](https://github.com/advisories/GHSA-xq3m-2v4x-88gg) and [GHSA-66ff-xgx4-vchm](https://github.com/advisories/GHSA-66ff-xgx4-vchm).
- sharp: [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj), [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c), [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) (including CVE-2026-96889).
- undici: current fixes include [GHSA-4w7w-5xrc-9h26](https://github.com/advisories/GHSA-4w7w-5xrc-9h26), [GHSA-2m5v-pch6-74hx](https://github.com/advisories/GHSA-2m5v-pch6-74hx), [GHSA-qrxm-fqhp-jwvm](https://github.com/advisories/GHSA-qrxm-fqhp-jwvm).

### Unresolved development finding — not accepted

[GHSA-g3hv-75wg-m249 / CVE-2026-118764](https://github.com/advisories/GHSA-g3hv-75wg-m249), Moderate: minimatch glob-pattern amplification. npm's reviewed advisory marks `<11.0.1` affected; the upstream description specifically discusses 10.2.6 with `optimizationLevel >= 2`. No reachability exception was applied.

The lockfile contains minimatch 3.1.5 and 10.2.6. ESLint 9.39.5, @eslint/config-array 0.21.2 and @eslint/eslintrc 3.3.7 require `^3.1.5`; eslint-plugin-import/jsx-a11y/react retain 3.x ranges; @typescript-eslint/typescript-estree 8.72.1 requires `^10.2.2`. Patched minimatch 11.0.1 is outside those ranges. npm reports the finding through 16 development packages. Its suggested downgrade to ESLint 4 / eslint-config-next 12 was not applied. Compatible upstream fixes or an explicitly reviewed separate migration are required. There are no production findings and no remaining Critical/High findings in the full audit.

## Validation

Runtime: official Windows x64 Node 24.22.1, npm 11.19.1, isolated workspace install. Node archive SHA-256: `d2046d28c2c3dcd211ac5145c0bf30e2047ef9dfb306693c8c6e2eccd8b95fa5`, matched to the official SHASUMS256.txt. Global Node and npm were not changed.

| Check | Before | After |
| --- | --- | --- |
| `npm ci` | PASS | PASS |
| `npm run lint` | FAIL: 27 errors, 38 warnings | FAIL: 29 errors, 36 warnings (reviewed HEAD was 30 / 38) |
| `tsc --noEmit --incremental false` | PASS | PASS |
| `npm run build` | PASS (16.1.1) | PASS (16.4.3), 15 static pages generated |
| `npm ls --all` | not run | PASS, no invalid peer/dependency tree |
| Existing test/typecheck scripts | none declared | none declared; direct tsc executed above |
| New GitHub Actions CI | none existed | not added (optional); existing lint debt remains |

The configuration replacement removes one original lint error and two warnings. The other 26 original errors and all three additional `react-hooks/set-state-in-effect` diagnostics remain: `src/app/tools/handrail-strength/page.tsx` lines 195 and 208; `src/app/tools/zoning-info/page.tsx` line 28. A focused correction would derive the glass result without mirrored state, update the glass default through the column-input event path while preserving manual overrides and saved-report snapshots, and restore storage state with an SSR-safe external-store approach. These affect state synchronization and saved/API-key UI behavior; they were investigated but not implemented as an unrelated lint cleanup. They require focused behavioral tests and a scope decision. No lint rules were disabled.

All command checks in the table were rerun after the configuration correction using Node 24.22.1/npm 11.19.1. Both audits were also repeated: production 0, full audit 16 Moderate, no Critical/High. Fresh registry queries still show no patched minimatch in the current parents' 3.x/10.x ranges. The original [verification-results.json](security/2026-11-03/verification-results.json) is historical evidence for the reviewed HEAD; the [follow-up record](security/2026-11-03/review-followup.json) records current checks, raw-log hashes, bundle hash and the real Worker observations.

### Newly reproduced development blocker

`next dev --webpack` returns HTTP 500 for `/tools/plateau-shadow`. `cesium@1.146.0/Source/Cesium.js` re-exports `ForEach`, `addBuffer` and other symbols from `@cesium/engine`, but the lockfile resolves engine 26.5.0, which does not export them. A plain Node ESM import reproduces the missing `ForEach` export without Next configuration. This establishes a package export mismatch; the webpack browser test stops before asset resolution. Do not describe webpack development as passing. The production Turbopack test succeeds with the imports actually used by this application; that does not validate all Cesium exports.

Registry metadata offers Cesium 1.147.0 with `@cesium/gltf`, engine `^26.5.0` and widgets `^16.3.1`. Moving the explicitly requested 1.146.0 target to 1.147.0 is a proposed follow-up, not an implemented or validated fix. It would need source/release-note review, a matching CDN asset version, fresh audit and both bundler checks. Pinning internal packages/adding overrides, patching node_modules, switching the dev bundler or suppressing export errors was not used. The manifest and lockfile are unchanged by this review follow-up.

### Cesium reproduction

Use [cesium-smoke.cjs](security/2026-11-03/cesium-smoke.cjs) with Playwright installed outside this repository and an available Edge browser. Set `PLAYWRIGHT_MODULE_PATH` to that external `playwright` module, `CESIUM_TEST_ORIGIN` to the local running application and `CESIUM_EVIDENCE_DIR` to a writable output directory. Run `node docs/security/2026-11-03/cesium-smoke.cjs after` against `npm run build` plus the production server, or use stage `webpack-dev` against `npm run dev`. The script blocks external requests, serves installed Cesium assets locally, supplies synthetic imagery/empty 3D tiles and observes actual Worker responses; it does not inject `CESIUM_BASE_URL` or replace Worker computation. On the current dependency tree the webpack stage fails at the HTTP 200 assertion, as recorded above.

Local production-build browser checks used an isolated Edge session on `127.0.0.1:3102`. External requests were blocked or fulfilled with synthetic fixtures; no user credentials, external API keys, paid APIs or real project data were used. The home, zoning, rainwater, passive-design and handrail pages returned HTTP 200 with zero uncaught browser errors. Both local API routes returned the expected HTTP 400 for missing input without contacting upstreams.

The rainwater fixture flow confirmed nearest-station lookup, mocked rainfall response, intensity/area display, pipe selection and the print handler. Passive-design fixture checks confirmed seasonal wind/charts, Leaflet with placeholder tiles and print handling. Handrail save/print and PDF-byte generation were checked separately. A jsPDF 4.2.1 smoke check generated a valid PDF header. These checks do not validate native print-dialog interaction, visual PDF pagination, live upstream data or live map/3D tiles. See [verification evidence](security/2026-11-03/verification-results.json).

The zoning no-key fixture request succeeded, but its expected explanatory notice was not visible. Existing code sets `debugInfo` while entering the `result` state and renders it only in the `error` state. This pre-existing UI issue was recorded; the authenticated tile flow was not exercised.

## Human local checks and merge gates

1. Use a patched Node 22.x (>=22.23.4) or 24.x (>=24.22.1). Run `npm ci`, `npm run lint`, `npm run build`, and both audits. Review the lint and minimatch residuals explicitly before readiness/merge; this implementation does not accept them.
2. Run `npm run dev` and open `http://localhost:3001`. For zoning (`/tools/zoning-info`), use a non-confidential test address; verify coordinates and the four layer results with an authorized test API key only if separately permitted. Check valid/invalid tile responses and browser/server errors. No key was provided or saved by this change.
3. For rainwater (`/tools/rainwater-drainage`), use a public test address, fetch the nearest station/rainfall, confirm 10-minute rainfall × 6 equals the design intensity, change pipe sizes/conditions, and check displayed results. Live GSI/JMA integration was not exercised by the fixture test.
4. For passive design (`/tools/passive-design`), check actual map tiles, pin drag/reverse geocoding, weather retrieval, seasonal graphs and PDF export. The automated map tiles were placeholders.
5. For PDF (`/tools/handrail-strength`), save default column/handrail results, use "PDFレポート印刷 / 保存", save through the native browser dialog, and inspect Japanese text, tables, figures and page breaks. Do the same for rainwater/passive reports. Automated checks covered handlers/PDF bytes, not manual layout acceptance.
6. Resolve the webpack package-export blocker first. For Cesium (`/tools/plateau-shadow`), separately verify real 3D tiles, workers, widgets and time controls under development and production bundlers. Supply credentials only under separate authorization. Local production asset/worker resolution has automated evidence; live resources and real-device visual behavior remain Human checks.
7. Obtain independent review tied to the exact remote HEAD. This work remains Draft; no formal approval, Ready transition or merge is performed here.
8. Before merge, verify Vercel's actual runtime patch, public reachability, Production Branch and deployment triggers. Read-only project metadata on 2026-11-03 showed Node `24.x`, a READY **production** deployment `dpl_G4vYj4uAv4REGNPDVU9GotLBViic`, SSO protection `all_except_custom_domains`, password protection disabled and `live=false`. These fields do not establish current public reachability or branch-trigger behavior. Existing production deployment means merge can have production consequences. No settings changes, redeploy or production verification was performed.

## Separate risks and documentation synchronization

`/api/zoning/proxy` forwards a client-supplied API key to MLIT and returns/logs raw upstream error details. Its key-forwarding and error-response design is explicitly outside PR-02; assess it separately. The no-key notice issue above is also outside this dependency patch.

**Documentation Sync Trigger:** runtime minimum, dependency versions, security findings and verification procedure changed. README now states the patched Node requirement and links here; this document and machine-readable evidence record the update and human checks. `docs/API_REFERENCE.md` was reviewed; endpoints and API behavior were not modified, so no API-reference edit is needed. No central vault/Drive/other-repository synchronization was performed; the campaign owner can reference this PR in the inventory after independent review.

The review follow-up changes production configuration and adds reproduction/evidence, so this document and the PR body are synchronized. The earlier exact-HEAD review no longer covers the new configuration or resulting bundles. Dependency versions and application source remain unchanged; the residual findings are not accepted by this implementation. Independent review of the new remote HEAD is still required.
