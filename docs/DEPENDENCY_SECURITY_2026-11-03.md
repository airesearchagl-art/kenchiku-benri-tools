# Dependency security update — PR-02

Date: 2026-11-03. Baseline: `a175e36cae0d23bb402ff868de4742423c8e385a` (latest `main` when work began).
Implementation and local validation only; this document is not an independent review or risk acceptance.

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

The existing webpack `CESIUM_BASE_URL` is aligned from CDN release 1.114 to 1.146; the new release's Widgets asset returned HTTP 200. Next-generated type declarations were refreshed. Application/API/calculation logic was not changed. Live Cesium workers/3D tiles, including the Turbopack production asset path, still need human verification.

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
| `npm run lint` | FAIL: 27 errors, 38 warnings | FAIL: 30 errors, 38 warnings |
| `tsc --noEmit --incremental false` | PASS | PASS |
| `npm run build` | PASS (16.1.1) | PASS (16.4.3), 15 static pages generated |
| `npm ls --all` | not run | PASS, no invalid peer/dependency tree |
| Existing test/typecheck scripts | none declared | none declared; direct tsc executed above |
| New GitHub Actions CI | none existed | not added (optional); existing lint debt remains |

All 27 original lint errors remain. The three additional diagnostics are the updated `react-hooks/set-state-in-effect` rule on existing code: `src/app/tools/handrail-strength/page.tsx` lines 195 and 208; `src/app/tools/zoning-info/page.tsx` line 28. They concern glass-input/result synchronization and restoring the API key from localStorage. They are recorded for independent review rather than changing application semantics during this dependency update.

Local production-build browser checks used an isolated Edge session on `127.0.0.1:3102`. External requests were blocked or fulfilled with synthetic fixtures; no user credentials, external API keys, paid APIs or real project data were used. The home, zoning, rainwater, passive-design and handrail pages returned HTTP 200 with zero uncaught browser errors. Both local API routes returned the expected HTTP 400 for missing input without contacting upstreams.

The rainwater fixture flow confirmed nearest-station lookup, mocked rainfall response, intensity/area display, pipe selection and the print handler. Passive-design fixture checks confirmed seasonal wind/charts, Leaflet with placeholder tiles and print handling. Handrail save/print and PDF-byte generation were checked separately. A jsPDF 4.2.1 smoke check generated a valid PDF header. These checks do not validate native print-dialog interaction, visual PDF pagination, live upstream data or live map/3D tiles. See [verification evidence](security/2026-11-03/verification-results.json).

The zoning no-key fixture request succeeded, but its expected explanatory notice was not visible. Existing code sets `debugInfo` while entering the `result` state and renders it only in the `error` state. This pre-existing UI issue was recorded; the authenticated tile flow was not exercised.

## Human local checks and merge gates

1. Use a patched Node 22.x (>=22.23.4) or 24.x (>=24.22.1). Run `npm ci`, `npm run lint`, `npm run build`, and both audits. Review the lint and minimatch residuals explicitly before readiness/merge; this implementation does not accept them.
2. Run `npm run dev` and open `http://localhost:3001`. For zoning (`/tools/zoning-info`), use a non-confidential test address; verify coordinates and the four layer results with an authorized test API key only if separately permitted. Check valid/invalid tile responses and browser/server errors. No key was provided or saved by this change.
3. For rainwater (`/tools/rainwater-drainage`), use a public test address, fetch the nearest station/rainfall, confirm 10-minute rainfall × 6 equals the design intensity, change pipe sizes/conditions, and check displayed results. Live GSI/JMA integration was not exercised by the fixture test.
4. For passive design (`/tools/passive-design`), check actual map tiles, pin drag/reverse geocoding, weather retrieval, seasonal graphs and PDF export. The automated map tiles were placeholders.
5. For PDF (`/tools/handrail-strength`), save default column/handrail results, use "PDFレポート印刷 / 保存", save through the native browser dialog, and inspect Japanese text, tables, figures and page breaks. Do the same for rainwater/passive reports. Automated checks covered handlers/PDF bytes, not manual layout acceptance.
6. For Cesium (`/tools/plateau-shadow`), separately verify 3D tiles, workers, widgets and time controls under the normal development and production bundlers. Supply credentials only under separate authorization; asset-path compatibility remains a human check.
7. Obtain independent review tied to the exact remote HEAD. This work remains Draft; no formal approval, Ready transition or merge is performed here.
8. Before merge, verify Vercel's actual runtime patch, public reachability, Production Branch and deployment triggers. Read-only project metadata on 2026-11-03 showed Node `24.x`, a READY **production** deployment `dpl_G4vYj4uAv4REGNPDVU9GotLBViic`, SSO protection `all_except_custom_domains`, password protection disabled and `live=false`. These fields do not establish current public reachability or branch-trigger behavior. Existing production deployment means merge can have production consequences. No settings changes, redeploy or production verification was performed.

## Separate risks and documentation synchronization

`/api/zoning/proxy` forwards a client-supplied API key to MLIT and returns/logs raw upstream error details. Its key-forwarding and error-response design is explicitly outside PR-02; assess it separately. The no-key notice issue above is also outside this dependency patch.

**Documentation Sync Trigger:** runtime minimum, dependency versions, security findings and verification procedure changed. README now states the patched Node requirement and links here; this document and machine-readable evidence record the update and human checks. `docs/API_REFERENCE.md` was reviewed; endpoints and API behavior were not modified, so no API-reference edit is needed. No central vault/Drive/other-repository synchronization was performed; the campaign owner can reference this PR in the inventory after independent review.
