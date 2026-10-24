/* Disposable file-origin browser check; does not claim WKWebView/device coverage. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.ORBITER_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  try {
    const context = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
    await context.addInitScript(() => {
      window.__files = [];
      window.webkit = {messageHandlers: {scheduleFiles: {postMessage: value => window.__files.push(value)}}};
    });
    const page = await context.newPage(), errors = [], network = [], policyViolations = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {if (/^https?:/.test(request.url())) network.push(request.url());});
    await context.route(/^https?:/, route => route.abort());
    await page.addInitScript(() => {
      window.__policyViolations = [];
      document.addEventListener('securitypolicyviolation', e => window.__policyViolations.push(e.violatedDirective));
    });
    await page.goto(pathToFileURL(path.resolve('Scheduler/Application.html')).href);
    await page.waitForFunction(() => window.OrbiterUI && window.SchedulerAccountBridge);
    assert.equal(await page.locator('#open-account').count(), 0);
    assert.equal(await page.evaluate(() => typeof window.OrbiterCloud), 'undefined');
    assert.match(await page.locator('.account-entry').textContent(), /Account sync is unavailable/);
    await page.locator('#profile').evaluate(button => button.click());
    await page.locator('#iphone-privacy summary').click();
    assert.equal(await page.locator('#iphone-privacy').evaluate(el => el.open), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    fs.mkdirSync('build/iphone', {recursive: true});
    await page.screenshot({path: 'build/iphone/privacy-phone.png', fullPage: true});
    await page.keyboard.press('Escape');
    // Export invokes the native bridge with the actual current workspace.
    await page.locator('#export-dialog').evaluate(dialog => dialog.showModal());
    await page.locator('#export-backup').click();
    const exported = await page.evaluate(() => window.__files.find(message => message.action === 'export'));
    assert(exported, 'Native Files export was not requested');
    assert.deepEqual(JSON.parse(exported.text), await page.evaluate(() => window.OrbiterUI.snapshot()));
    await page.keyboard.press('Escape');
    const original = await page.evaluate(() => window.OrbiterUI.snapshot());
    // Invalid imports must not replace local data.
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('nativeScheduleImport', {detail: '{invalid'})));
    assert.deepEqual(await page.evaluate(() => window.OrbiterUI.snapshot()), original);
    // A valid native Files import must survive a full page reload.
    const imported = structuredClone(original);
    imported.study ||= {tasks: [], sessions: [], preferences: {name: '', goal: 10, motion: false, solid: false},
      timer: {duration: 25, remaining: 1500, endAt: null, title: '', taskId: null}};
    imported.study.preferences.name = 'Offline iPhone fixture';
    await page.evaluate(text => window.dispatchEvent(new CustomEvent('nativeScheduleImport', {detail: text})), JSON.stringify(imported));
    await page.waitForFunction(() => window.OrbiterUI.snapshot().study.preferences.name === 'Offline iPhone fixture');
    policyViolations.push(...await page.evaluate(() => window.__policyViolations));
    await page.reload();
    await page.waitForFunction(() => window.OrbiterUI?.snapshot().study.preferences.name === 'Offline iPhone fixture');
    assert.equal(await page.evaluate(() => window.OrbiterCats.stats().contexts), 1);
    policyViolations.push(...await page.evaluate(() => window.__policyViolations));
    await page.goto(pathToFileURL(path.resolve('Scheduler/Application.html')).href + '?noWebGL=1');
    await page.waitForFunction(() => window.OrbiterUI && window.OrbiterCats);
    // The additive hub opens Today; the planner artwork belongs to Study.
    await page.evaluate(() => window.OrbiterHub?.navigate('study'));
    assert.equal(await page.evaluate(() => window.OrbiterCats.stats().contexts), 0);
    assert.equal(await page.locator('.orbit-art img').isVisible(), true);
    policyViolations.push(...await page.evaluate(() => window.__policyViolations));
    assert.deepEqual(errors, []);
    assert.deepEqual(network, []);
    assert.deepEqual(policyViolations, []);
    await context.close();
    console.log('PASS: offline file bundle, privacy, zero network, native export/import, invalid-import preservation, reload persistence, renderer and CSP. Browser fixture only; not iOS.');
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
