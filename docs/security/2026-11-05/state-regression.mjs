import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.PLAYWRIGHT_MODULE_PATH;
const { chromium } = await import(modulePath ? pathToFileURL(path.join(modulePath, 'index.mjs')).href : 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3105';
const output = process.env.STATE_TEST_OUTPUT;
assert(output, 'Set STATE_TEST_OUTPUT');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const snapshots = [], errors = [], blocked = [];
  async function context() {
    const ctx = await browser.newContext();
    await ctx.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === base) return route.continue();
      blocked.push(url.origin + url.pathname);
      return route.abort();
    });
    ctx.on('page', page => page.on('pageerror', e => errors.push(e.message)));
    return ctx;
  }
  try {
    const ctx = await context();
    const page = await ctx.newPage();
    assert.equal((await page.goto(base + '/tools/handrail-strength')).status(), 200);
    const tabs = page.locator('div.w-fit > button');
    const panel = page.locator('.lg\\:col-span-1');
    const result = page.locator('.lg\\:col-span-2');
    const report = page.locator('.hidden.print\\:absolute');
    const save = panel.locator('button.w-full').last();
    const glass = async () => { await tabs.nth(2).click(); await panel.locator('select').last().waitFor(); };
    const column = () => tabs.nth(0).click();
    const capture = async name => {
      // Observe the settled UI, including the old implementation's passive effects.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const data = await panel.locator('input,select').evaluateAll(nodes => nodes.map(n => ({ tag: n.tagName, type: n.type, value: n.value, checked: n.type === 'checkbox' ? n.checked : undefined })));
      const live = await result.innerText();
      const saved = await report.count() ? await report.textContent() : null;
      const record = { name, data, live, saved };
      snapshots.push(record);
      return record;
    };
    await save.click(); // Also makes the existing print report visible in the DOM.
    await glass();
    assert.equal(await panel.locator('select').last().inputValue(), '1470');
    await capture('glass-initial');
    await panel.locator('select').last().selectOption('980');
    await panel.locator('input[type=number]').nth(0).fill('1250');
    await panel.locator('input[type=number]').nth(1).fill('1300');
    await panel.locator('select').nth(3).selectOption('12');
    const manual = await capture('glass-manual-input');
    await save.click();
    const savedA = (await capture('glass-first-save')).saved;
    await column();
    await panel.locator('input[type=number]').first().fill('1700');
    await glass();
    const unchanged = await capture('unrelated-column-edit-keeps-glass');
    assert.deepEqual(unchanged.data, manual.data);
    assert.equal(unchanged.live, manual.live);
    assert.equal(unchanged.saved, savedA);
    await column();
    await panel.locator('select').first().selectOption('2950');
    await glass();
    assert.equal(await panel.locator('select').last().inputValue(), '2950');
    assert.equal(await panel.locator('input[type=number]').first().inputValue(), '1250');
    const synchronized = await capture('changed-column-load-updates-glass');
    assert.notEqual(synchronized.live, manual.live);
    assert.equal(synchronized.saved, savedA);
    await tabs.nth(1).click();
    await panel.locator('select').first().selectOption('980');
    await glass();
    const handrail = await capture('handrail-edit-keeps-glass');
    assert.deepEqual(handrail.data, synchronized.data);
    assert.equal(handrail.live, synchronized.live);
    assert.equal(handrail.saved, savedA);
    for (const support of ['two_edge', 'four_edge']) {
      await panel.locator('select').first().selectOption(support);
      const state = await capture('support-' + support);
      assert.equal(state.saved, savedA);
    }
    await save.click();
    const savedB = (await capture('glass-second-save')).saved;
    assert.notEqual(savedA, savedB);
    await panel.locator('select').last().selectOption('490');
    const edited = await capture('edited-after-save');
    assert.equal(edited.saved, savedB);
    await column();
    await panel.locator('select').first().selectOption('2950');
    await glass();
    const sameLoad = await capture('same-column-load-keeps-manual-override');
    assert.deepEqual(sameLoad.data, edited.data);
    assert.equal(sameLoad.live, edited.live);
    assert.equal(sameLoad.saved, savedB);
    await ctx.close();

    for (const seed of [null, '', 'synthetic-initial-not-a-valid-key']) {
      const ctx = await context();
      await ctx.addInitScript(({ seed, origin }) => {
        if (location.origin !== origin) return;
        if (!sessionStorage.getItem('state-test-seeded')) {
          if (seed !== null) localStorage.setItem('mlit_api_key', seed);
          sessionStorage.setItem('state-test-seeded', '1');
        }
      }, { seed, origin: base });
      const page = await ctx.newPage();
      page.on('dialog', dialog => dialog.dismiss());
      const response = await page.goto(base + '/tools/zoning-info');
      assert.equal(response.status(), 200);
      const html = await response.text();
      const passwordTag = html.match(/<input[^>]*type="password"[^>]*>/)?.[0];
      assert(passwordTag && passwordTag.includes('value=""'), 'SSR must not contain a stored key');
      const field = page.locator('input[type=password]');
      await page.waitForFunction(expected => document.querySelector('input[type=password]')?.value === expected, seed || '');
      const buttons = field.locator('xpath=ancestor::div[button][1]').locator('button');
      const captureKey = async name => {
        const record = { name: `storage-${seed === null ? 'absent' : seed === '' ? 'empty' : 'present'}-${name}`, value: await field.inputValue(), stored: await page.evaluate(() => localStorage.getItem('mlit_api_key')), saveDisabled: await buttons.first().isDisabled(), deleteVisible: await buttons.count() === 2 };
        snapshots.push(record);
        return record;
      };
      const initial = await captureKey('initial');
      assert.equal(initial.value, seed || '');
      assert.equal(initial.deleteVisible, Boolean(seed));
      await page.evaluate(() => {
        localStorage.setItem('mlit_api_key', 'synthetic-external-before-edit');
        window.dispatchEvent(new StorageEvent('storage', { key: 'mlit_api_key', newValue: 'synthetic-external-before-edit' }));
      });
      await page.locator('input').nth(1).fill('synthetic rerender - no search');
      const untouched = await captureKey('external-storage-does-not-replace-initial-value');
      assert.equal(untouched.value, seed || '');
      assert.equal(untouched.deleteVisible, Boolean(seed));
      await field.fill('');
      await page.locator('input').nth(1).fill('synthetic empty draft - no search');
      const emptyDraft = await captureKey('empty-draft-stays-empty');
      assert.equal(emptyDraft.value, '');
      assert.equal(emptyDraft.deleteVisible, Boolean(seed));
      await field.fill('synthetic-draft-not-a-valid-key');
      const draft = await captureKey('draft');
      assert.equal(draft.stored, 'synthetic-external-before-edit');
      assert.equal(draft.deleteVisible, Boolean(seed));
      await page.evaluate(() => {
        localStorage.setItem('mlit_api_key', 'synthetic-external-not-a-valid-key');
        window.dispatchEvent(new StorageEvent('storage', { key: 'mlit_api_key', newValue: 'synthetic-external-not-a-valid-key' }));
      });
      await page.locator('input').nth(1).fill('synthetic address - no search');
      assert.equal((await captureKey('external-storage-does-not-overwrite-draft')).value, draft.value);
      await buttons.first().click();
      const saved = await captureKey('saved');
      assert.equal(saved.stored, draft.value);
      assert.equal(saved.deleteVisible, true);
      await field.fill('synthetic-unsaved-not-a-valid-key');
      await captureKey('unsaved-edit');
      await page.reload();
      await page.waitForFunction(expected => document.querySelector('input[type=password]')?.value === expected, draft.value);
      assert.equal((await captureKey('reload-restores-saved-only')).value, draft.value);
      await buttons.nth(1).click();
      const cleared = await captureKey('cleared');
      assert.equal(cleared.value, '');
      assert.equal(cleared.stored, null);
      assert.equal(cleared.deleteVisible, false);
      await page.locator('input').nth(1).fill('another synthetic address - no search');
      assert.equal((await captureKey('clear-survives-rerender')).value, '');
      await ctx.close();
    }
    const evidence = { snapshots, errors, blocked, syntheticOnly: true, externalApiCalls: 0 };
    fs.writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n');
    assert.deepEqual(errors, []);
    if (process.env.STATE_TEST_BASELINE) {
      const before = JSON.parse(fs.readFileSync(process.env.STATE_TEST_BASELINE));
      assert.deepEqual(JSON.parse(JSON.stringify(snapshots)), before.snapshots, 'Before/after observable state and calculated/saved output must match');
    }
    console.log(JSON.stringify({ pass: true, snapshots: snapshots.length, beforeAfterEqual: Boolean(process.env.STATE_TEST_BASELINE), errors, blocked }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
