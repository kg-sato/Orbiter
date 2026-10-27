/* Disposable browser contexts and intercepted local assets; no account/network writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright-core');
const root = path.resolve(__dirname, '..');
const reproduce = process.argv.includes('--reproduce');

async function open(browser, {phone = false, reduced = false, iphone = false} = {}) {
  const context = await browser.newContext({viewport:phone ? {width:390,height:844} : {width:1366,height:900}, reducedMotion:reduced ? 'reduce' : 'no-preference'});
  if (iphone) await context.addInitScript(() => {window.webkit = {messageHandlers:{scheduleFiles:{postMessage(){}}}};});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'focus.test') return route.abort();
    if (url.pathname === '/api/session') return route.fulfill({json:{username:null,csrf:null}});
    const name = url.pathname.slice(1) || 'Application.html', file = path.resolve(root, name);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({status:404,body:''});
    return route.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name.endsWith('.png') ? 'image/png' : 'text/html'});
  });
  await page.goto(`http://focus.test/${iphone ? 'Scheduler/' : ''}Application.html?noWebGL=1`);
  await page.waitForFunction(() => window.OrbiterUI && window.OrbiterHub);
  async function fixture(timer, tasks = []) {
    await page.evaluate(async ({timer,tasks}) => {
      window.OrbiterCloud = undefined;
      const old = window.OrbiterUI.snapshot(), next = structuredClone(old);
      next.study ||= {tasks:[],sessions:[],preferences:{name:'',goal:10,motion:false,solid:false},timer:{}};
      next.study.sessions = [];
      next.study.tasks = tasks;
      next.study.preferences.name = 'Fictional focus tester';
      next.study.timer = {duration:25,remaining:1500,endAt:null,title:'Fictional reading',taskId:null,...timer};
      await window.SchedulerAccountBridge.load(JSON.stringify(next), JSON.stringify(old));
      window.__saves = []; window.__pending = []; window.__live = [];
      window.OrbiterCloud = {save:data => {
        window.__saves.push(structuredClone(data));
        return new Promise((resolve,reject) => window.__pending.push({resolve,reject}));
      }};
      window.__observer?.disconnect();
      window.__observer = new MutationObserver(records => {
        for (const record of records) if (record.target.textContent) window.__live.push({id:record.target.id,text:record.target.textContent});
      });
      for (const id of ['status','focus-announcement']) {
        const region = document.getElementById(id);
        if (region) window.__observer.observe(region, {childList:true});
      }
    }, {timer,tasks});
  }
  async function settle(fail = false) {
    await page.evaluate(fail => window.__pending.splice(0).forEach(p => fail ? p.reject(Error('Controlled save failure')) : p.resolve()), fail);
    await page.waitForTimeout(100);
  }
  const saved = () => page.evaluate(() => ({calls:window.__saves.length,sessions:window.OrbiterUI.snapshot().study.sessions.length,persisted:JSON.parse(localStorage.getItem('week-by-week.schedule.v1')).study.sessions.length,live:window.__live,timer:window.OrbiterUI.snapshot().study.timer}));
  const trigger = id => page.locator('#'+id).evaluate(e => {e.click();});
  const pending = () => page.waitForFunction(() => window.__pending.length > 0);
  const shot = async name => {
    await page.evaluate(() => window.OrbiterHub.openStudy());
    if (phone) await page.evaluate(() => window.OrbiterHub.openSanctuary());
    else await page.locator('.focus-card').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({path:path.join(root,'build/focus-completion',name+'.png')});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'No horizontal page overflow');
    if (phone) await page.locator('#sanctuary-close').click();
  };
  return {context,page,errors,fixture,settle,saved,trigger,pending,shot};
}

async function keyboardCompletion(browser) {
  for (const reduced of [false,true]) {
    const run = await open(browser,{reduced}), {page} = run;
    const tasks = [{id:'keyboard-assignment',title:'Fictional keyboard assignment',course:'',due:'2026-11-02',estimate:30,done:false,kind:'assignment'}];
    const load = async () => {
      await run.fixture({remaining:0,taskId:tasks[0].id},tasks);
      await page.evaluate(() => window.OrbiterHub.openStudy());
    };
    const keyboardActivate = async () => {
      await page.locator('#focus-start').focus();
      // Traverse real browser tab order, including the injected sanctuary entry.
      for (let i=0;i<8 && !(await page.locator('#focus-complete-task').evaluate(e=>e===document.activeElement));i++) await page.keyboard.press('Tab');
      assert(await page.locator('#focus-complete-task').evaluate(e=>e===document.activeElement),'Tab must reach Complete assignment');
      await page.keyboard.press('Enter'); await run.pending();
    };
    await load(); await keyboardActivate(); await run.settle();
    assert(await page.locator('#focus-complete-task').isHidden());
    assert(await page.locator('#focus-clear-intention').isVisible());
    assert(await page.locator('#focus-clear-intention').evaluate(e=>e===document.activeElement),'Accepted keyboard completion must focus Take a break');
    await page.screenshot({path:path.join(root,'build/focus-completion',`keyboard-completion-${reduced?'reduced':'normal'}.png`)});
    await page.keyboard.press('Enter'); await run.pending(); await run.settle();
    assert.equal((await run.saved()).timer.taskId,null,'Keyboard can continue with Take a break');

    await load();
    await page.locator('#now-action').focus();
    await run.trigger('focus-complete-task'); await run.pending(); await run.settle();
    assert(await page.locator('#now-action').evaluate(e=>e===document.activeElement),'Programmatic completion must not steal focus');

    await load(); await keyboardActivate();
    await page.keyboard.press('Shift+Tab');
    const movedFocus = await page.evaluate(()=>document.activeElement.id || document.activeElement.className);
    await run.settle();
    assert.equal(await page.evaluate(()=>document.activeElement.id || document.activeElement.className),movedFocus,'Completion must respect navigation during save');

    await load(); await keyboardActivate(); await run.settle(true);
    assert(await page.locator('#focus-complete-task').evaluate(e=>e===document.activeElement),'Rejected completion keeps its focus and retry control');
    assert.equal(await page.evaluate(()=>window.OrbiterUI.snapshot().study.tasks[0].done),false);
    assert.deepEqual(run.errors,[]);
    console.log(`Keyboard completion (${reduced?'reduced':'normal'} motion): Tab/Enter continuation, programmatic completion, navigation during save and rejected save passed.`);
    await run.context.close();
  }
}

(async () => {
  fs.mkdirSync(path.join(root,'build/focus-completion'), {recursive:true});
  const browser = await chromium.launch({executablePath:process.env.ORBITER_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try {
    if (process.argv.includes('--keyboard-only')) {await keyboardCompletion(browser);return;}
    if (reproduce) {
      const run = await open(browser);
      await run.fixture({endAt:Date.now()-1000});
      await run.page.waitForTimeout(2600);
      const pending = await run.saved();
      await run.settle();
      const complete = await run.saved();
      console.log('Observed expired timer delayed-save requests:',pending.calls,'completion live-region mutations:',complete.live);
      await run.page.locator('#focus-finish').evaluate(e => {void e.onclick();});
      await run.settle();
      console.log('Observed Finish invoked after complete:', await run.saved());
      await run.fixture({remaining:1200,endAt:Date.now()+1200000});
      await run.page.evaluate(() => {document.getElementById('focus-finish').click();document.getElementById('sanctuary-finish').click();document.getElementById('focus-finish').click();});
      console.log('Observed repeated Finish/source and sanctuary delayed-save requests:',(await run.saved()).calls);
      await run.settle();
      await run.context.close();
      return;
    }
    for (const options of [{}, {phone:true,reduced:true}, {phone:true,reduced:true,iphone:true}]) {
      const label = options.iphone ? 'iphone' : options.phone ? 'phone-reduced' : 'desktop';
      const run = await open(browser, options);
      await run.fixture({endAt:Date.now()-1000});
      await run.pending();
      await run.page.waitForTimeout(2300);
      const pending = await run.saved();
      assert.equal(pending.live.length,0,'Pending persistence must not announce completion');
      assert.equal(await run.page.locator('#timer-state').textContent(),'SAVING');
      for (const id of ['focus-start','now-action','focus-finish','focus-reset','focus-duration','focus-intention','focus-clear-intention'])
        assert(await run.page.locator('#'+id).isDisabled(),id+' must be disabled while saving');
      await run.page.evaluate(() => {
        // Exercise handler boundaries as well as disabled controls/delegated source clicks.
        for(const id of ['focus-start','focus-finish','focus-reset','focus-clear-intention','now-action']) void document.getElementById(id).onclick();
        document.getElementById('focus-duration').value='45';
        void document.getElementById('focus-duration').onchange();
        void document.getElementById('focus-intention').onchange();
        void document.querySelector('[data-duration]').onclick();
        document.getElementById('sanctuary-finish').click();
        document.getElementById('sanctuary-toggle').click();
      });
      assert.equal((await run.saved()).calls,1,'Alternate timer controls cannot bypass pending completion');
      await run.shot(label+'-saving');
      await run.settle();
      const complete = await run.saved();
      assert.equal(pending.calls,1,'Expiry ticks must share one pending completion');
      assert.equal(pending.sessions,0,'No session before persistence succeeds');
      assert.equal(pending.persisted,0,'No local session before persistence succeeds');
      assert.equal(complete.sessions,1);
      assert.equal(complete.persisted,1);
      assert.deepEqual(complete.live.map(l=>l.id), ['status'],'Completion uses one shared live announcement');
      await run.page.locator('#focus-finish').evaluate(e => {void e.onclick();});
      assert.equal((await run.saved()).calls,1,'Already complete Finish must be a no-op');
      assert.equal(complete.timer.duration,25,'Pending duration changes cannot replace the timer');
      assert.equal(await run.page.locator('#timer-state').textContent(),'COMPLETE');
      assert(!/Pause focus/.test(await run.page.locator('#now-action').textContent()),'Main action must refresh after completion');
      await run.shot(label+'-complete');

      // A failed expiry preserves the running deadline/history, stops automatic retries,
      // and provides an explicit Retry save through the same source button.
      await run.fixture({endAt:Date.now()-1000});
      await run.pending();
      const beforeFailure = await run.saved();
      await run.settle(true);
      await run.page.waitForTimeout(1200);
      const failed = await run.saved();
      assert.equal(failed.calls,1,'Failure must not cause an automatic retry loop');
      assert.equal(failed.sessions,0);
      assert.equal(failed.persisted,0);
      assert.deepEqual(failed.timer,beforeFailure.timer);
      assert(!failed.live.some(l=>/complete|recorded|started|paused/.test(l.text)),'Failure must not announce success');
      assert.match(await run.page.locator('#status').textContent(),/Could not save/);
      assert.equal(await run.page.locator('#focus-start').textContent(),'Retry save');
      await run.shot(label+'-retry');
      await run.trigger('focus-start'); await run.pending(); await run.settle();
      assert.equal((await run.saved()).sessions,1,'Explicit retry records exactly one completion');
      assert.equal((await run.saved()).live.filter(l=>l.text.includes('Focus session complete')).length,1);

      // Start again, pause, resume, and Finish all retain their existing meanings.
      await run.trigger('focus-start'); await run.pending();
      assert.equal((await run.saved()).timer.remaining,0,'Start again is not accepted before save');
      await run.settle();
      assert((await run.saved()).timer.endAt > Date.now());
      await run.page.waitForTimeout(1100);
      await run.trigger('focus-start'); await run.pending(); await run.settle();
      assert.equal((await run.saved()).timer.endAt,null);
      assert((await run.saved()).timer.remaining > 0);
      await run.page.evaluate(() => window.OrbiterHub.openSanctuary());
      await run.page.waitForTimeout(600);
      await run.page.locator('#sanctuary-toggle').click(); await run.pending();
      const beforeRepeated = (await run.saved()).calls;
      await run.trigger('sanctuary-toggle');
      assert.equal((await run.saved()).calls,beforeRepeated);
      await run.settle();
      assert((await run.saved()).timer.endAt > Date.now());
      await run.page.waitForTimeout(600);
      await run.page.locator('#sanctuary-finish').click(); await run.pending();
      const finishing = await run.saved();
      await run.page.evaluate(() => {document.getElementById('sanctuary-finish').click();void document.getElementById('focus-finish').onclick();});
      assert.equal((await run.saved()).calls,finishing.calls,'Repeated Finish must not start another save');
      await run.settle(true);
      assert.deepEqual((await run.saved()).timer,finishing.timer,'Rejected Finish retains running timer');
      assert.equal((await run.saved()).sessions,1);
      await run.page.waitForTimeout(600);
      await run.page.locator('#sanctuary-finish').click(); await run.pending(); await run.settle();
      assert.equal((await run.saved()).sessions,2,'Finish can retry and records one more session');
      assert.equal((await run.saved()).persisted,2);
      await run.page.waitForTimeout(600);
      assert(await run.page.locator('#sanctuary-finish').isDisabled());
      assert.match(await run.page.locator('#sanctuary-toggle').textContent(),/Start again/);
      await run.page.screenshot({path:path.join(root,'build/focus-completion',label+'-sanctuary.png')});
      await run.page.locator('#sanctuary-close').click();
      assert.deepEqual(run.errors,[]);
      console.log(label+': delayed expiry, alternate controls, single live announcement, complete guard, failed expiry/Finish retry, start/pause/resume and sanctuary passed.');
      await run.context.close();
    }
    await keyboardCompletion(browser);
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
