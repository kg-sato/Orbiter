// Paired browser companion only; no native app, real storage or accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.ORBITER_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  try {
    const context = await browser.newContext({viewport: {width: 420, height: 620}, reducedMotion: 'reduce'});
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'http://companion.test') return route.abort();
      if (url.pathname === '/') return route.fulfill({contentType: 'text/html', body: '<title>Fictional opener</title>'});
      if (!['/web/study-companion.html', '/web/study-companion.js'].includes(url.pathname)) return route.abort();
      return route.fulfill({path: path.resolve('.' + url.pathname), contentType: url.pathname.endsWith('.js') ? 'text/javascript' : 'text/html'});
    });
    const opener = await context.newPage(), errors = [];
    await opener.goto('http://companion.test/');
    await opener.evaluate(() => {
      window.__commands = [];
      addEventListener('message', event => window.__commands.push(event.data));
    });
    const popupPromise = context.waitForEvent('page');
    await opener.evaluate(() => {window.__companion = open('/web/study-companion.html#fixture-token');});
    const popup = await popupPromise;
    popup.on('pageerror', error => errors.push(error.message));
    await popup.waitForLoadState();
    await popup.evaluate(() => {
      window.__statusChanges = 0;
      new MutationObserver(records => {window.__statusChanges += records.length;})
        .observe(document.getElementById('status'), {childList: true, subtree: true, characterData: true});
    });
    const send = data => opener.evaluate(data => window.__companion.postMessage(data, location.origin), data);
    const state = {
      kind: 'orbit-state', token: 'fixture-token', title: 'Fictional reading',
      endAt: Date.now() + 120000, remaining: 120, level: 1, minutesToday: 5,
      calm: false, practice: [{id: 'fictional-project', title: 'Read a chapter', minutes: 5, target: 15}],
    };
    await send(state);
    await popup.waitForFunction(() => document.getElementById('status').textContent === 'A little energy, moving forward.');
    const initial = await popup.evaluate(() => window.__statusChanges);
    const time = await popup.locator('#time').textContent();
    await send(state);
    await send(state);
    await popup.waitForTimeout(2200);
    assert.equal(await popup.evaluate(() => window.__statusChanges), initial, 'Identical heartbeats must not repeat live announcements');
    assert.notEqual(await popup.locator('#time').textContent(), time, 'Countdown continues without live status churn');
    await popup.locator('#toggle').click();
    await opener.waitForFunction(() => window.__commands.some(message => message.action === 'timer-toggle'));
    await send({...state, token: 'wrong-token', endAt: null});
    await popup.waitForTimeout(50);
    assert.equal(await popup.locator('#status').textContent(), 'A little energy, moving forward.', 'Untrusted token cannot change state');
    await send({...state, endAt: null});
    await popup.waitForFunction(() => document.getElementById('status').textContent === 'Here when you need a little momentum.');
    assert.equal(await popup.evaluate(() => window.__statusChanges), initial + 1, 'Pause announces one real change');
    await send({...state, endAt: null, remaining: 0});
    await popup.waitForFunction(() => document.getElementById('status').textContent.includes('session is complete'));
    assert.equal(await popup.evaluate(() => window.__statusChanges), initial + 2, 'Completion announces one real change');
    await send({kind: 'orbit-disconnect', token: 'fixture-token'});
    await popup.waitForFunction(() => document.getElementById('toggle').disabled);
    const disconnected = await popup.evaluate(() => window.__statusChanges);
    await popup.waitForTimeout(1200);
    assert.equal(await popup.evaluate(() => window.__statusChanges), disconnected, 'Disconnected heartbeat stays quiet');
    await send(state);
    await popup.waitForFunction(() => !document.getElementById('toggle').disabled);
    assert.equal(await popup.evaluate(() => window.__statusChanges), disconnected + 1, 'Reconnect announces once');
    fs.mkdirSync('build/study-companion', {recursive: true});
    for (const width of [320, 420]) {
      await popup.setViewportSize({width, height: 620});
      assert(await popup.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}`);
      await popup.screenshot({path: `build/study-companion/${width}.png`});
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS: companion countdown, quiet identical heartbeats, single pause/completion/disconnect/reconnect announcements, command delegation, token rejection and 320/420px layouts. Browser fixture only.');
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
