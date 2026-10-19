/* Full application; disposable origins/profiles, simulated accounts only. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright-core');
async function files(context){await context.route('**/*',route=>{
 const u=new URL(route.request().url());if(u.hostname!=='orbiter-lake.test')return route.abort();
 if(u.pathname==='/api/session')return route.fulfill({json:{username:null,csrf:null}});
 const name=path.resolve('.'+u.pathname);if(!name.startsWith(process.cwd()+path.sep)||!fs.existsSync(name))return route.fulfill({status:404});
 return route.fulfill({body:fs.readFileSync(name),contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html'});
});}
(async()=>{
 const out=path.resolve('build/lake-checks');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out,size:{width:1280,height:890}}});await files(context);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://orbiter-lake.test/Application.html');await page.waitForFunction(()=>window.OrbiterUI&&window.OrbiterLake&&OrbiterCats.stats().pond?.frames>2);
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  const baseline=await metrics();await page.waitForTimeout(1100);const idle=await metrics();
  const desktopNav=()=>page.locator('.side-nav button[data-page="tasks"]');
  await desktopNav().click();await page.waitForFunction(()=>OrbiterLake.stats().kind==='page'&&OrbiterLake.stats().active);
  const revealBoxes=await page.locator('.desk-layout [style*="clip-path"]').evaluateAll(nodes=>nodes.map(n=>({display:getComputedStyle(n).display,id:n.id,width:n.getBoundingClientRect().width})));
  assert(revealBoxes.length>1,'Navigation must reveal actual painted panels');
  assert(revealBoxes.every(n=>n.display!=='contents'&&n.width>0),'Boxless layout wrappers cannot receive the reveal mask');
  assert.equal(await page.locator('.desk-layout').evaluate(n=>getComputedStyle(n).transform),'none');
  assert.equal(await page.locator('.control-flash,.wave-wipe-stage,.lake-arrival').count(),0);
  await page.waitForTimeout(330);await page.screenshot({path:out+'/navigation.png'});await page.waitForTimeout(850);
  const afterEffect=await metrics();
  const beforeSnapshot=await page.evaluate(()=>OrbiterUI.snapshot());
  await page.locator('#quick-capture').click();await page.waitForFunction(()=>OrbiterLake.stats().active&&OrbiterLake.stats().kind==='popup');
  assert.equal(await page.locator('#capture-editor').evaluate(n=>getComputedStyle(n).transform),'none');
  await page.locator('#capture-title').fill('An immediate, preserved draft');
  assert.equal(await page.locator('#capture-title').inputValue(),'An immediate, preserved draft');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'capture-title');
  await page.waitForTimeout(240);await page.screenshot({path:out+'/popup.png'});
  await page.getByRole('button',{name:'Close quick capture',exact:true}).click();assert.equal(await page.locator('#capture-editor').evaluate(n=>n.open),false);
  await page.waitForFunction(()=>OrbiterLake.stats().active&&OrbiterLake.stats().kind==='close');await page.waitForTimeout(580);
  await page.locator('[data-task-filter="done"]').click();await page.waitForFunction(()=>OrbiterLake.stats().active&&OrbiterLake.stats().kind==='tab');
  await page.waitForTimeout(450);
  // Keyboard activation has an element-centred origin; Escape prevents a closing aftereffect.
  await page.locator('#quick-capture').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>OrbiterLake.stats().active);await page.keyboard.press('Escape');
  await page.waitForTimeout(50);assert.equal(await page.locator('#pond-morph-edge').count(),0);
  // A fresh activation immediately following Escape must still animate.
  await page.locator('#quick-capture').click();await page.waitForFunction(()=>OrbiterLake.stats().active);await page.keyboard.press('Escape');
  // Rapid programmatic actions exercise interruption rather than locator animation waits.
  await page.evaluate(()=>{for(const p of ['atlas','rhythm','tasks','desk','tasks'])document.querySelector(`.side-nav button[data-page="${p}"]`).click();});
  assert((await page.locator('#pond-morph-edge').count())<=1);await page.waitForTimeout(1150);assert.equal(await page.locator('#pond-morph-edge').count(),0);
  assert.equal(await page.evaluate(()=>OrbiterUI.snapshot().study?.timer?.endAt||null),beforeSnapshot.study?.timer?.endAt||null);
  // All current palettes/materials retain a stationary form and readable controls.
  for(const scene of ['tidal-night','lunar-mist','opal-dawn'])for(const material of ['sculpted','glass','quiet'])for(const accent of ['mint','lilac','apricot']){
   await page.evaluate(async({scene,material,accent})=>{const old=OrbiterUI.snapshot(),next=structuredClone(old);next.study??={tasks:[],sessions:[],preferences:{name:'',goal:10,motion:false,solid:false},timer:{duration:25,remaining:1500,endAt:null,title:'',taskId:null}};Object.assign(next.study.preferences,{scenePreset:scene,material,accent,motion:false,motionIntensity:70,effectQuality:'auto'});await SchedulerAccountBridge.load(JSON.stringify(next),JSON.stringify(old));},{scene,material,accent});
   await page.locator('#quick-capture').click();assert.equal(await page.locator('#capture-editor').evaluate(n=>getComputedStyle(n).transform),'none');await page.keyboard.press('Escape');
  }
  for(const [width,height] of [[1440,1000],[390,844],[360,800]]){
   await page.setViewportSize({width,height});await page.locator('#quick-capture').click();await page.waitForFunction(()=>OrbiterLake.stats().active);
   const box=await page.locator('#capture-editor').boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:out+`/popup-${width}.png`});await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#quick-capture').click();await page.waitForFunction(()=>OrbiterLake.stats().active);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.locator('#pond-morph-edge').count(),0);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.keyboard.press('Escape');
  await page.locator('#quick-capture').click();await page.waitForFunction(()=>OrbiterLake.stats().active);await page.setViewportSize({width:1400,height:960});assert.equal(await page.locator('#pond-morph-edge').count(),0);await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#quick-capture').click();assert.equal(await page.locator('#pond-morph-edge').count(),0);assert(await page.locator('#capture-title').isEditable());await page.keyboard.press('Escape');await page.emulateMedia({reducedMotion:'no-preference'});
  // Explicit zero motion disables decoration; Low quality still has lightweight edge feedback.
  for(const [motion,quality,expected,calmer] of [[0,'auto',false,false],[70,'auto',false,true],[70,'high',true,false],[70,'low',true,false]]){
   await page.evaluate(async({motion,quality,calmer})=>{const old=OrbiterUI.snapshot(),next=structuredClone(old);Object.assign(next.study.preferences,{motionIntensity:motion,effectQuality:quality,motion:calmer});await SchedulerAccountBridge.load(JSON.stringify(next),JSON.stringify(old));},{motion,quality,calmer});
   await page.locator('#quick-capture').click();await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>OrbiterLake.stats().active),expected);await page.keyboard.press('Escape');
  }
  // Mode changes cancel and suspended dialogs must not produce a close silhouette.
  await page.locator('#quick-capture').click();await page.waitForFunction(()=>OrbiterLake.stats().active);await page.evaluate(()=>dispatchEvent(new CustomEvent('orbiter-mode-change')));assert.equal(await page.locator('#pond-morph-edge').count(),0);await page.keyboard.press('Escape');
  const stats=await page.evaluate(()=>({lake:OrbiterLake.stats(),cat:OrbiterCats.stats()}));assert.equal(stats.lake.lastError,null);assert.equal(stats.cat.contexts,1);assert.equal(stats.lake.overlayCount,0);assert.deepEqual(errors,[]);
  // WebGL failure leaves an ordinary editable dialog and a static reflected-water treatment.
  const fallback=await browser.newContext({viewport:{width:390,height:844}});await files(fallback);await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/.test(kind)?null:get.call(this,kind,...args)};});
  const failed=await fallback.newPage();await failed.goto('http://orbiter-lake.test/Application.html');await failed.waitForFunction(()=>window.OrbiterUI&&window.OrbiterLake);await failed.locator('#quick-capture').click();await failed.waitForFunction(()=>OrbiterLake.stats().active);assert(await failed.locator('#capture-title').isEditable());await failed.waitForTimeout(1050);assert.equal(await failed.evaluate(()=>OrbiterLake.stats().lastError),null);await failed.screenshot({path:out+'/webgl-fallback.png'});await fallback.close();
  const report={stats,errors,idleTaskPercent:100*(idle.TaskDuration-baseline.TaskDuration)/(idle.Timestamp-baseline.Timestamp),effectSampleTaskPercent:100*(afterEffect.TaskDuration-idle.TaskDuration)/(afterEffect.Timestamp-idle.Timestamp),heapBytes:afterEffect.JSHeapUsedSize,notes:'Browser indicative samples; TaskDuration is main-thread work, not Windows process/GPU utilization. Canvas buffer bytes exclude browser/driver allocation. No native installer measurement.'};
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));const video=page.video();await context.close();await video.saveAs(out+'/application-motion.webm');console.log('Lake transitions: navigation, immediate input, close, tabs, interruption, palettes/materials, phone, reduced motion, Low and WebGL fallback passed. '+JSON.stringify({meanDrawMs:stats.lake.meanDrawMs,maxDrawMs:stats.lake.maxDrawMs,bufferBytes:stats.lake.bufferBytes}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

