/* Browser bridge contract only: does not exercise Apple permission UI or delivery. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright-core');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.ORBITER_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true});
  try {
    const context = await browser.newContext({viewport: {width:390,height:844}, reducedMotion:'reduce'});
    await context.addInitScript(() => {
      window.__messages = [];
      window.webkit = {messageHandlers:{scheduleFiles:{postMessage:m => window.__messages.push(m)}}};
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve('Scheduler/Application.html')).href);
    await page.waitForFunction(() => window.OrbiterUI);
    assert(await page.evaluate(()=>window.__messages.some(m=>m.action==='reminderStatus')),'Startup must check current system permission');
    assert(await page.evaluate(()=>window.__messages.some(m=>m.action==='focusReminder' && m.force===true)),'Startup must reconcile saved reminder');
    const fixture = await page.evaluate(() => window.OrbiterUI.snapshot());
    fixture.study ||= {tasks:[],sessions:[],preferences:{name:'',goal:10,motion:true,solid:false},timer:{duration:25,remaining:1500,endAt:null,title:'',taskId:null}};
    fixture.study.preferences.reminders = true;
    fixture.study.sessions = [];
    fixture.study.timer = {duration:240,remaining:14400,endAt:null,title:'Notification fixture',taskId:null};
    async function load(data) {
      await page.evaluate(text => window.dispatchEvent(new CustomEvent('nativeScheduleImport',{detail:text})), JSON.stringify(data));
      await page.waitForFunction(() => window.OrbiterUI.snapshot().study?.timer.duration === 240);
    }
    async function permission(detail) {
      await page.evaluate(detail => window.dispatchEvent(new CustomEvent('nativeReminderPermission',{detail})), detail);
    }
    const lastReminder = () => page.evaluate(() => window.__messages.filter(m=>m.action==='focusReminder').at(-1));
    await load(fixture);
    await page.locator('#focus-start').evaluate(e=>e.click());
    await page.waitForFunction(() => window.OrbiterUI.snapshot().study.timer.endAt !== null);
    const reminder = await lastReminder();
    assert(reminder.endAt > Date.now()+14300*1000, '240-minute deadline must reach native bridge');
    await page.locator('#focus-start').evaluate(e=>e.click());
    assert.equal((await lastReminder()).endAt,null,'Pause must cancel reminder');
    await page.locator('#focus-start').evaluate(e=>e.click());
    assert((await lastReminder()).endAt > Date.now(),'Resume must reschedule');
    await permission({granted:true});
    assert.match(await page.locator('#status').textContent(),/Focus notifications enabled/);
    assert((await lastReminder()).endAt > Date.now(),'Grant must reconcile active timer');
    const runningEndAt = await page.evaluate(()=>window.OrbiterUI.snapshot().study.timer.endAt);
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nativeReminderRefresh')));
    assert.equal((await lastReminder()).endAt,runningEndAt,'Foreground reconciliation must retain authoritative deadline');
    assert.equal((await lastReminder()).force,true);
    await page.locator('#profile').evaluate(e=>e.click());
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nativeReminderStatus',{detail:{authorization:'allowed',alerts:true,sounds:true}})));
    const promptsBefore = await page.evaluate(()=>window.__messages.filter(m=>m.action==='requestReminders').length);
    await page.locator('#settings-form').evaluate(e=>e.requestSubmit());
    await page.waitForFunction(()=>!document.querySelector('#settings-editor').open);
    assert.equal(await page.evaluate(()=>window.__messages.filter(m=>m.action==='requestReminders').length),promptsBefore,'Unrelated Profile save must not request permission again');
    assert.equal((await lastReminder()).endAt,runningEndAt);
    assert.equal((await lastReminder()).force,false,'Unchanged save must allow native idempotence');
    page.once('dialog', d=>d.accept());
    await page.locator('#focus-reset').evaluate(e=>e.click());
    assert.equal((await lastReminder()).endAt,null,'Reset must cancel reminder');
    await page.locator('#focus-start').evaluate(e=>e.click());
    await page.locator('#profile').evaluate(e=>e.click());
    await status({authorization:'allowed',alerts:true,sounds:true,pending:false});
    assert.match(await page.locator('#reminder-status').textContent(),/No pending focus reminder was found/);
    assert.equal(await page.locator('#reminder-retry').isVisible(),true);
    await page.setViewportSize({width:320,height:568});
    await page.locator('#reminder-retry').scrollIntoViewIfNeeded();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Retry UI must fit narrow phone');
    const retryBox = await page.locator('#reminder-retry').boundingBox();
    assert(retryBox.width>=44 && retryBox.height>=44,'Retry needs a usable touch target');
    assert(await page.locator('#reminder-retry').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Retry target must not be covered');
    fs.mkdirSync('build/iphone-notifications',{recursive:true});
    await page.screenshot({path:'build/iphone-notifications/missing-320.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    const retryDeadline = await page.evaluate(()=>window.OrbiterUI.snapshot().study.timer.endAt);
    await page.locator('#reminder-retry').click();
    assert.equal((await lastReminder()).force,true,'Retry must bypass unchanged-deadline guard');
    assert.equal((await lastReminder()).endAt,retryDeadline,'Retry must preserve timer deadline');
    await status({authorization:'allowed',alerts:true,sounds:true,pending:true});
    assert.match(await page.locator('#reminder-status').textContent(),/iPhone has a pending focus reminder/);
    assert.equal(await page.locator('#reminder-retry').isVisible(),false);
    fs.mkdirSync('build/iphone-notifications',{recursive:true});
    await page.screenshot({path:'build/iphone-notifications/pending.png',fullPage:true});
    await page.keyboard.press('Escape');
    await permission({error:'unavailable'});
    assert.equal(await page.evaluate(()=>window.OrbiterUI.snapshot().study.preferences.reminders),true,'Transient permission failure must preserve opt-in');
    assert.match(await page.locator('#status').textContent(),/Try saving notification settings again/);
    await permission({granted:false});
    await page.waitForFunction(()=>window.OrbiterUI.snapshot().study.preferences.reminders===false);
    assert.equal((await lastReminder()).endAt,null,'Denial cancels reminder');
    assert.equal(await page.locator('#setting-reminders').isChecked(),false);
    const before = await page.evaluate(()=>window.__messages.length);
    await permission({granted:true});
    assert.equal(await page.evaluate(()=>window.__messages.length),before,'Late permission grant must not undo opt-out');
    assert.equal(await page.evaluate(()=>window.OrbiterUI.snapshot().study.preferences.reminders),false);
    await page.reload();
    await page.waitForFunction(()=>window.OrbiterUI?.snapshot().study?.preferences.reminders===false);
    await page.locator('#profile').evaluate(e=>e.click());
    const beforeStatus = await page.evaluate(()=>window.OrbiterUI.snapshot());
    async function status(detail) {
      await page.evaluate(detail=>window.dispatchEvent(new CustomEvent('nativeReminderStatus',{detail})),detail);
    }
    await status({authorization:'blocked',alerts:false,sounds:false});
    assert.match(await page.locator('#reminder-status').textContent(),/blocked in iPhone Settings/);
    assert.deepEqual(await page.evaluate(()=>window.OrbiterUI.snapshot()),beforeStatus,'Passive permission query must not edit study data');
    await page.locator('#reminder-settings').click();
    assert.equal(await page.evaluate(()=>window.__messages.at(-1).action),'openReminderSettings');
    fs.mkdirSync('build/iphone-notifications',{recursive:true});
    await page.screenshot({path:'build/iphone-notifications/blocked.png',fullPage:true});
    await status({authorization:'allowed',alerts:true,sounds:false});
    assert.match(await page.locator('#reminder-status').textContent(),/reminders are off.*allows notifications.*Sounds are off/);
    await page.locator('#setting-reminders').check();
    await status({authorization:'quiet',alerts:false,sounds:false});
    assert.equal(await page.locator('#setting-reminders').isChecked(),true,'Status refresh must preserve an unsaved checkbox draft');
    assert.match(await page.locator('#reminder-status').textContent(),/quiet notifications/);
    await status({authorization:'notRequested'});
    assert.match(await page.locator('#reminder-status').textContent(),/Permission has not been requested/);
    await status({authorization:'unknown'});
    assert.match(await page.locator('#reminder-status').textContent(),/could not be confirmed/);
    await status({authorization:'allowed',alerts:true,sounds:true});
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nativeReminderRefresh')));
    assert.equal(await page.evaluate(()=>window.__messages.at(-1).action),'reminderStatus');
    assert.equal((await lastReminder()).force,true,'Return from Settings must force native reconciliation');
    assert.equal((await lastReminder()).endAt,null,'Return from Settings cannot turn saved opt-out on');
    assert.deepEqual(await page.evaluate(()=>window.OrbiterUI.snapshot()),beforeStatus);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Settings must fit phone width');
    await page.screenshot({path:'build/iphone-notifications/settings.png',fullPage:true});
    await page.keyboard.press('Escape');
    const expired = await page.evaluate(()=>window.OrbiterUI.snapshot());
    expired.study.preferences.reminders = true;
    expired.study.timer = {duration:1,remaining:1,endAt:Date.now()-1000,title:'Notification completion fixture',taskId:null};
    await page.evaluate(() => {
      window.__completionAnnouncements = 0;
      new MutationObserver(records => {
        if (document.querySelector('#status').textContent.includes('Focus session complete'))
          window.__completionAnnouncements += records.filter(r=>r.type==='childList').length;
      }).observe(document.querySelector('#status'),{childList:true});
    });
    await page.evaluate(text=>window.dispatchEvent(new CustomEvent('nativeScheduleImport',{detail:text})),JSON.stringify(expired));
    await page.waitForFunction(()=>window.OrbiterUI.snapshot().study.sessions.some(s=>s.title==='Notification completion fixture'));
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(()=>window.OrbiterUI.snapshot().study.sessions.filter(s=>s.title==='Notification completion fixture').length),1);
    assert.equal(await page.evaluate(()=>window.__completionAnnouncements),1,'iPhone completion must announce once through shared status');
    assert.equal(await page.locator('#focus-announcement').textContent(),'','Avoid second iPhone completion live-region announcement');
    assert.deepEqual(errors,[]);
    await context.close();
    console.log('PASS: timer/permission contracts, reconciliation, pending/missing reminder and retry UI, one completion announcement, Settings action, draft/data preservation and phone layout. Browser bridge only.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
