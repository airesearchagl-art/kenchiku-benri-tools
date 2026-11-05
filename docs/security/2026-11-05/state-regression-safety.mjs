import assert from 'node:assert/strict';

export function validateLoopbackBaseUrl(value) {
  assert(typeof value === 'string' && value.length > 0, 'TEST_BASE_URL must be a URL');
  assert(!/[\s\\\u0000-\u001f\u007f]/u.test(value), 'TEST_BASE_URL must not contain whitespace, controls or backslashes');
  assert(/^https?:\/\//i.test(value), 'TEST_BASE_URL must use HTTP or HTTPS');
  const authority = value.slice(value.indexOf('://') + 3).split(/[/?#]/, 1)[0];
  assert(!authority.includes('@'), 'TEST_BASE_URL must not contain credentials');
  let url;
  try { url = new URL(value); } catch { assert.fail('TEST_BASE_URL must be a valid HTTP(S) origin'); }
  assert(!url.username && !url.password, 'TEST_BASE_URL must not contain credentials');
  assert(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'TEST_BASE_URL must be a loopback host');
  assert(url.pathname === '/' && !url.search && !url.hash && !value.includes('?') && !value.includes('#'), 'TEST_BASE_URL must be an origin without a path, query or fragment');
  return url.origin;
}

export function createRequestGuard(base) {
  const origin = validateLoopbackBaseUrl(base);
  const requests = [];
  const blocked = [];
  function classify(value) {
    try {
      const url = new URL(value);
      const external = url.origin !== origin;
      return { allowed: !external && !url.username && !url.password, external, url: url.origin + url.pathname };
    } catch {
      return { allowed: false, external: true, url: '<invalid request URL>' };
    }
  }
  return {
    observe(value) {
      const request = classify(value);
      requests.push(request);
      return request.allowed;
    },
    route(value) {
      const request = classify(value);
      if (!request.allowed) blocked.push(request.url);
      return request.allowed;
    },
    evidence() {
      return {
        observedRequestCount: requests.length,
        externalApiCalls: requests.filter(request => request.external).length,
        blocked: [...blocked],
      };
    },
  };
}

export function assertLocalRequestsOnly(evidence) {
  assert(evidence.observedRequestCount > 0, 'No browser requests were observed');
  assert.deepEqual(evidence.blocked, [], 'The run attempted a blocked request');
  assert.equal(evidence.externalApiCalls, 0, 'The run attempted an off-origin request');
}
