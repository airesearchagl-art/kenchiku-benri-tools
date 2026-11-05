import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateLoopbackBaseUrl, createRequestGuard, assertLocalRequestsOnly } from './state-regression-safety.mjs';

const valid = [
  ['http://127.0.0.1:3105', 'http://127.0.0.1:3105'],
  ['http://localhost:3105/', 'http://localhost:3105'],
  ['https://localhost:443', 'https://localhost'],
  ['HTTP://LOCALHOST:80/', 'http://localhost'],
  ['http://[::1]:3105/', 'http://[::1]:3105'],
  ['https://[0:0:0:0:0:0:0:1]:8443', 'https://[::1]:8443'],
  ['http://127.1:3105', 'http://127.0.0.1:3105'],
];
for (const [input, expected] of valid) {
  test(`accept and normalize ${input}`, () => assert.equal(validateLoopbackBaseUrl(input), expected));
}

const invalid = [
  undefined, null, 123, '', '/relative', '//localhost:3105',
  'https://example.invalid', 'http://localhost.example.invalid', 'http://localhost.',
  'http://0.0.0.0', 'http://192.168.1.1', 'http://[::]', 'http://[::ffff:127.0.0.1]',
  'http://user:synthetic@localhost', 'http://user@127.0.0.1', 'http://@localhost',
  'http://localhost@outside.invalid', 'http://outside.invalid@localhost',
  'http://user%40outside.invalid@localhost',
  'file://localhost/tmp/test', 'ftp://localhost', 'ws://localhost', 'data:text/plain,localhost', 'javascript:localhost',
  ' http://localhost', 'http://localhost ', 'http://local\nhost', 'http://localhost\t', 'http://localhost\u0000',
  'http://localhost\\outside.invalid', 'http:\\localhost',
  'http://localhost/test', 'http://localhost/?token=synthetic', 'http://localhost/#test', 'http://localhost?', 'http://localhost#',
  'http://localhost:99999', 'http://[::1',
  'http://127.0.0.1.example.invalid', 'http://134744072',
];
invalid.forEach((input, index) => {
  test(`reject invalid base case ${index + 1}`, () => assert.throws(() => validateLoopbackBaseUrl(input)));
});

for (const [base, message] of [
  ['https://example.invalid', /loopback host/],
  ['http://synthetic:invalid@localhost', /credentials/],
  ['file://localhost/tmp/test', /HTTP or HTTPS/],
]) {
  test(`entry rejects ${message.source} before loading Playwright or launching a browser`, () => {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./state-regression.mjs', import.meta.url))], {
      env: { ...process.env, TEST_BASE_URL: base, STATE_TEST_OUTPUT: 'unused-synthetic-output.json', PLAYWRIGHT_MODULE_PATH: fileURLToPath(new URL('./synthetic-package-not-installed', import.meta.url)) },
      encoding: 'utf8', timeout: 5000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
    assert.doesNotMatch(result.stderr, /ERR_MODULE_NOT_FOUND/);
  });
}

test('invalid credential URLs are rejected without echoing their values', () => {
  assert.throws(() => validateLoopbackBaseUrl('http://synthetic:private-fixture@['), error => {
    assert.doesNotMatch(error.message, /private-fixture/);
    return /credentials/.test(error.message);
  });
});

test('guard also validates its base before observing requests', () => {
  assert.throws(() => createRequestGuard('https://example.invalid'));
});

test('local requests are counted and accepted without recording query values', () => {
  const guard = createRequestGuard('http://localhost:3105/');
  assert.equal(guard.observe('http://localhost:3105/tools/handrail-strength'), true);
  assert.equal(guard.route('http://localhost:3105/tools/handrail-strength'), true);
  assert.equal(guard.observe('http://localhost:3105/_next/example.js?cache=synthetic'), true);
  assert.deepEqual(guard.evidence(), { observedRequestCount: 2, externalApiCalls: 0, blocked: [] });
  assert.doesNotThrow(() => assertLocalRequestsOnly(guard.evidence()));
});

test('an off-origin request increments the observed count and fails the run', () => {
  const guard = createRequestGuard('http://127.0.0.1:3105');
  assert.equal(guard.observe('http://127.0.0.1:3105/'), true);
  assert.equal(guard.observe('https://synthetic:invalid@example.invalid/api?token=synthetic#fragment'), false);
  assert.equal(guard.route('https://synthetic:invalid@example.invalid/api?token=synthetic#fragment'), false);
  const evidence = guard.evidence();
  assert.deepEqual(evidence, { observedRequestCount: 2, externalApiCalls: 1, blocked: ['https://example.invalid/api'] });
  assert.throws(() => assertLocalRequestsOnly(evidence), /blocked request/);
});

test('other loopback origins and ports are blocked, not silently trusted', () => {
  const guard = createRequestGuard('http://localhost:3105');
  for (const request of ['http://127.0.0.1:3105/', 'http://localhost:3106/', 'https://localhost:3105/']) {
    assert.equal(guard.observe(request), false);
    assert.equal(guard.route(request), false);
  }
  assert.equal(guard.evidence().externalApiCalls, 3);
  assert.throws(() => assertLocalRequestsOnly(guard.evidence()));
});

test('same-origin credentials and malformed URLs fail even when not sent', () => {
  const guard = createRequestGuard('http://localhost:3105');
  assert.equal(guard.observe('http://synthetic:invalid@localhost:3105/'), false);
  assert.equal(guard.route('http://synthetic:invalid@localhost:3105/'), false);
  assert.deepEqual(guard.evidence(), { observedRequestCount: 1, externalApiCalls: 0, blocked: ['http://localhost:3105/'] });
  assert.throws(() => assertLocalRequestsOnly(guard.evidence()));
  assert.equal(guard.observe('not a URL'), false);
  assert.equal(guard.route('not a URL'), false);
  assert.equal(guard.evidence().externalApiCalls, 1);
});

test('missing or inconsistent observations cannot be reported as PASS', () => {
  assert.throws(() => assertLocalRequestsOnly(createRequestGuard('http://localhost').evidence()), /No browser requests/);
  const guard = createRequestGuard('http://localhost');
  guard.observe('https://example.invalid/not-intercepted');
  assert.deepEqual(guard.evidence(), { observedRequestCount: 1, externalApiCalls: 1, blocked: [] });
  assert.throws(() => assertLocalRequestsOnly(guard.evidence()), /off-origin request/);
});

test('returned evidence cannot mutate the request history', () => {
  const guard = createRequestGuard('http://localhost');
  guard.observe('https://example.invalid/');
  guard.route('https://example.invalid/');
  guard.evidence().blocked.length = 0;
  assert.equal(guard.evidence().blocked.length, 1);
  assert.throws(() => assertLocalRequestsOnly(guard.evidence()));
});
