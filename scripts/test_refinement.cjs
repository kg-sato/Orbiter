/* All requests are intercepted at disposable test origins; no user profile or cloud account. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright-core');
async function route(page,folder){await page.route('**/*',r=>{
  const u=new URL(r.request().url());if(!u.hostname.endsWith('.test'))return r.abort();
  if(u.pathname==='/api/session')return r.fulfill({json:{username:null,csrf:null}});
  const file=path.resolve(folder,u.pathname.slice(1)||'Application.html');
  if(!file.startsWith(path.resolve(folder)+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:''});
  return r.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html'});
});}
async function seed(page){await page.evaluate(async()=>{
  const old=window.OrbiterUI.snapshot(),next=structuredClone(old);
  next.study||={tasks:[],sessions:[],preferences:{name:'',goal:10,motion:false,solid:false},timer:{duration:25,remaining:1500,endAt:null,title:'',taskId:null}};
  next.study.tasks=[{id:'study',title:'A careful study session with a deliberately long intention',course:'PSY 204',due:'2026-12-20',estimate:90,done:false,kind:'assignment',steps:[]}];
  next.study.preferences.accent='mint';
  await window.SchedulerAccountBridge.load(JSON.stringify(next),JSON.stringify(old));
});}
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await route(page,'.');await page.goto('http://orbiter-refinement.test/Application.html');await page.waitForFunction(()=>window.OrbiterUI);await seed(page);
  await page.locator('#focus-intention').selectOption('study');await page.waitForFunction(()=>window.OrbiterUI.snapshot().study.timer.taskId==='study');
  assert.match(await page.locator('#now-title').textContent(),/careful study/);assert.equal(await page.locator('#now-action').textContent(),'Start focus');
  await page.locator('#focus-duration').fill('50');await page.locator('#focus-duration').dispatchEvent('change');await page.waitForFunction(()=>window.OrbiterUI.snapshot().study.timer.duration===50);
  await page.locator('#now-action').click();await page.waitForFunction(()=>!!window.OrbiterUI.snapshot().study.timer.endAt);assert(await page.locator('#focus-intention').isDisabled());assert(await page.locator('#focus-duration').isDisabled());
  await page.waitForTimeout(1100);await page.locator('#focus-start').click();await page.waitForFunction(()=>!window.OrbiterUI.snapshot().study.timer.endAt);assert(await page.locator('#focus-intention').isDisabled());
  // Finish via the public UI, retaining task identity and recorded elapsed focus.
  await page.locator('#focus-finish').click();assert.equal((await page.evaluate(()=>window.OrbiterUI.snapshot())).study.timer.taskId,'study');
  await page.evaluate(()=>window.OrbiterUI.openAppearance());await page.locator('#setting-scene').selectOption('lunar-mist');await page.locator('#setting-atmosphere').fill('80');
  assert.equal(await page.locator('#appearance-preview').getAttribute('data-preset'),'lunar-mist');assert.equal(await page.locator('body').getAttribute('data-preset'),'tidal-night');
  await page.locator('[data-preview="buddy"]').click();assert.equal(await page.locator('#appearance-preview').getAttribute('data-view'),'buddy');
  await page.locator('#appearance-cancel').click();assert.equal(await page.locator('#setting-scene').inputValue(),'tidal-night');
  for(const accent of ['mint','lilac','apricot'])for(const scene of ['tidal-night','lunar-mist','opal-dawn']){
    await page.locator('#setting-accent').selectOption(accent);await page.locator('#setting-scene').selectOption(scene);await page.locator('#setting-atmosphere').fill('70');await page.locator('#appearance-apply').click();
    await page.waitForFunction(({scene,accent})=>document.body.dataset.preset===scene&&document.body.dataset.accent===accent,{scene,accent});
    await page.keyboard.press('Escape');
    if(!await page.locator('#settings-editor').evaluate(d=>d.open))await page.evaluate(()=>window.OrbiterUI.openAppearance());
  }
  await page.locator('#appearance-reset').click();assert.equal(await page.locator('#setting-scene').inputValue(),'tidal-night');assert.equal(await page.locator('body').getAttribute('data-preset'),'opal-dawn');
  // Incoming account edits preserve a stale appearance draft instead of overwriting them.
  await page.evaluate(()=>{window.OrbiterUI.snapshot().study.preferences.accent='mint';});
  await page.locator('#appearance-apply').click();assert.match(await page.locator('#appearance-status').textContent(),/changed elsewhere/);assert.equal(await page.locator('#setting-scene').inputValue(),'tidal-night');
  await page.locator('#appearance-cancel').click();
  for(const [width,height] of [[1440,1000],[390,844],[360,800]]){
    await page.setViewportSize({width,height});
    await page.locator('#appearance-preview').scrollIntoViewIfNeeded();const bounds=await page.locator('#appearance-preview').boundingBox();assert(bounds.width>100&&bounds.x>=0&&bounds.x+bounds.width<=width+1);
    await page.screenshot({path:`build/appearance-studio-${width}.png`});
  }
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#settings-editor').open);
  await page.setViewportSize({width:1440,height:1000});await page.locator('#quick-capture').click();assert.equal(await page.locator('.wave-wipe-stage').count(),0);await page.keyboard.press('Escape');
  await page.locator('#weekly-review-open').click();await page.waitForFunction(()=>window.OrbiterLake?.stats().active);await page.keyboard.press('Escape');assert.equal(await page.locator('.wave-wipe-stage').count(),0);
  // Shared recap presentation uses confirmed values and escapes user titles.
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('orbiter-native-state',{detail:{revision:1,settings:{recapAck:''},latestRecap:{sessionId:'test',title:'<img src=x>',focusedMs:25000,xp:0,crates:0,rewardStatus:'pending',growth:window.OrbiterRewards.growth(25000)},rewards:{xp:0,level:1,chests:0,focusedMs:25000,crateProgressMs:25000,owned:[],stars:0},catalog:[]}})));
  assert.match(await page.locator('.orb-session-recap').textContent(),/25s/);assert.match(await page.locator('.orb-session-recap').textContent(),/awaiting account/);assert.equal(await page.locator('.orb-session-recap img').count(),0);
  await page.screenshot({path:'build/session-recap.png'});
  await page.evaluate(()=>window.scrollTo(0,0));
  for(const hours of [0,2,8,20]){await page.evaluate(hours=>window.OrbiterCats.mount(document.querySelector('.orbit-art'),42,{growthMs:hours*3600000}),hours);assert.equal(await page.evaluate(()=>window.OrbiterCats.stats().age),[0,2,8,20].indexOf(hours));await page.screenshot({path:`build/habitat-stage-${hours}.png`});}
  assert.equal(await page.evaluate(()=>window.OrbiterCats.stats().contexts),1);
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#weekly-review-open').click();assert.equal(await page.locator('.wave-wipe-stage').count(),0);await page.keyboard.press('Escape');
  const fallback=await context.newPage();await route(fallback,'.');await fallback.goto('http://orbiter-fallback.test/Application.html?noWebGL');await fallback.waitForFunction(()=>window.OrbiterUI);assert.equal(await fallback.evaluate(()=>window.OrbiterCats.stats().contexts),0);assert.equal(await fallback.locator('.orbit-art').getAttribute('data-cat-fallback'),'true');
  assert.deepEqual(errors,[]);console.log('Refinement: intentions, previews, stale saves, themes, phone layouts, shared lake motion, recap formatting, habitats and fallback passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
