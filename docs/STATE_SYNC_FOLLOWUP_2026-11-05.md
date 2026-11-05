# PR-02: scoped state synchronization correction

Baseline HEAD: `605edddabe8227b12c73db3f046f9c1987c4ec51`. Main remained `a175e36cae0d23bb402ff868de4742423c8e385a`; both affected page files were byte-identical between main and the baseline. PR #1 was the only open PR returned, the local tree was clean, and remote/local branch heads matched before work. Earlier delegation authorized limited fixes and normal push to this same branch; no new PR, merge or production action is part of this work.

## The three diagnostics and the correction

| Baseline location | Cause | Limited correction |
| --- | --- | --- |
| handrail-strength/page.tsx:195 | Effect mirrors the column horizontal load into glass input state | Update glass input in the existing column input handler, only when `Object.is` says the horizontal load changed |
| handrail-strength/page.tsx:208 | Effect mirrors an already computed glass result into another state variable | Render the memoized calculation directly; keep saved input/result snapshots separate |
| zoning-info/page.tsx:28 | Mount Effect restores the storage value into local state | Use an SSR-empty `useSyncExternalStore` snapshot cached once per mount, with separate edited-value and saved-status overrides |

Only these two page files change application code. Glass calculation functions, initial values, saved report behavior, key storage name, save/clear handlers, API requests, dependencies and configuration remain unchanged. A manually edited glass load survives unrelated column changes and handrail changes; an actual column horizontal-load change still updates it. Blank key edits remain blank. Later storage events do not replace a mounted page's value or draft. The saved-key indicator keeps its previous semantics while editing, saving and clearing.

The UI no longer needs the redundant result-mirroring render pass. Tests compare settled user-visible behavior after the old implementation's Effects, not the number or timing of internal renders. This follows React's guidance on [derived state and event handling](https://react.dev/learn/you-might-not-need-an-effect) and [server snapshots for external state](https://react.dev/reference/react/useSyncExternalStore).

## Validation

Node 24.22.1 / npm 11.19.1, isolated Edge browser, localhost only. No real API key, external API, paid operation or real project data was used.

- Scoped ESLint on the two changed pages: 7 errors -> 4. All three `react-hooks/set-state-in-effect` findings are gone. The four remaining errors are unchanged, pre-existing `no-explicit-any` findings in zoning-info. No rule was disabled and no unrelated error was edited. These are scoped counts, not a new whole-repository lint count.
- `tsc --noEmit --incremental false`: PASS.
- `npm run build` (Turbopack): PASS for the changed pages.
- Before/after browser regression: all **41 checkpoints match exactly**, with zero uncaught page errors and zero external requests. Checks cover glass input overrides, changed/unchanged column loads, unrelated column/handrail edits, support types, calculated output, saved report stability, absent/empty/present synthetic stored keys, SSR-empty markup, restoration, blank/unsaved edits, external storage events, save, reload and clear.
- The test harness initially needed selector and fixture-origin corrections. Its final comparison normalizes JSON serialization of undefined properties. Both final result files are identical; raw-file hashes and checkpoint hashes are in [state-followup.json](security/2026-11-05/state-followup.json).
- Dependency install/audits and unrelated suites were not repeated because manifest/lockfile did not change. The production audit 0 / development Moderate 16 result remains a **November 3 observation**, not a fresh November 5 audit or a waiver.

To reproduce, install Playwright outside this repository and use an available Edge browser. Start each build on localhost and run:

```powershell
$env:PLAYWRIGHT_MODULE_PATH = '<external Playwright package directory>'
$env:TEST_BASE_URL = 'http://127.0.0.1:3105'
$env:STATE_TEST_OUTPUT = '<writable path>/state-before.json'
node docs/security/2026-11-05/state-regression.mjs
# After switching the local server to the corrected build:
$env:STATE_TEST_BASELINE = $env:STATE_TEST_OUTPUT
$env:STATE_TEST_OUTPUT = '<writable path>/state-after.json'
node docs/security/2026-11-05/state-regression.mjs
```

Use the unchanged baseline build for the first run and the corrected build for the second. The script blocks non-localhost origins and never clicks Search or calls a real upstream API. Fixture values are deliberately invalid synthetic strings. Native PDF pagination and real tiles are not covered.

## Cesium diagnosis without changing versions or settings

Installed Cesium 1.146.0 re-exports 25 names absent from its resolved engine 26.5.0, including `ForEach`, `addBuffer`, `findAccessorMinMax` and `_shaderspassClassification`. Some utilities moved to `@cesium/gltf`; not all missing exports are covered by that move. Resium's ESM entry also imports Cesium, so changing the application's import alone would leave that dependency path.

An isolated webpack client-entry probe of Cesium's official CommonJS entry failed on Node `path`. Next already has a `path-browserify` fallback, so that first probe alone is not evidence that Next would fail. A second isolated probe with that existing Next fallback and its mocked `__dirname` compiled with a dynamic-dependency warning, then failed with `Cannot find module '/Build/CesiumUnminified/index.cjs'`. This is a package-entry diagnosis, not a full replacement of the Next route. No configuration, dependency, application import or node_modules file was changed to work around it.

No supported, minimal version-preserving correction was confirmed. The concrete pending proposal is **Cesium 1.146.0 -> 1.147.0**, its CDN asset base **1.146 -> 1.147**, and normal lockfile regeneration. This is not implemented or assumed approved. It requires official release/source review, install/tree checks, both audits, webpack development and Turbopack production validation, and local/mock real Worker/asset tests. Overrides, export-check suppression, a bundler switch or risk acceptance are not proposed as substitutes.

## Remaining gates and documentation synchronization

The three new lint diagnostics no longer need a specification decision. Pending items are the Cesium version/asset proposal, existing lint debt, development minimatch findings, Human real-tile/device/PDF checks, production-trigger/public-reachability verification and independent review at the new remote HEAD. No Ready transition, formal approval or merge was performed.

**Documentation Sync Trigger:** two pages' state synchronization and their validation evidence changed. This follow-up, the existing dependency report, the regression script, JSON evidence and PR body are synchronized. API documentation is unchanged because the API design is unchanged. The earlier exact-HEAD review does not cover the new state changes; historical dependency/Cesium evidence is retained with its date and scope.
