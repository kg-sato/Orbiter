/* Actual generated iPhone UI + production async controller, fictional native bridge only. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{const context=await browser.newContext({viewport:{width:390,height:844}});await context.route(/^https?:/,r=>r.abort());await context.addInitScript(()=>{
 window.webkit={messageHandlers:{scheduleFiles:{postMessage(){}}}};window.__native={revision:0,json:undefined,consented:false,writes:0,reads:0,access:0,delay:false,timeout:false};const n=window.__native;
 for(const method of ['getItem','setItem','removeItem']){const old=Storage.prototype[method];Storage.prototype[method]=function(key,...args){if(String(key).startsWith('orbiter.life'))throw Error('Native journal touched WebKit storage: '+key);return old.call(this,key,...args);};}
 const response=()=>({status:'ok',owner:'device',revision:n.revision,...(n.json===undefined?{}:{json:n.json})});const backend={capabilities:async()=>({contractVersion:1,available:true,read:true,write:true,consented:n.consented,owner:'device',cloud:false,healthKit:false}),requestAccess:async()=>{n.access++;n.consented=true;return{status:'consented',owner:'device'};},read:async()=>{n.reads++;if(!n.consented)throw Error('No native consent');return response();},write:async({expectedRevision,data})=>{n.writes++;if(n.timeout){n.timeout=false;throw Object.assign(Error('Uncertain native save'),{code:'timeout'});}if(expectedRevision!==n.revision)throw Object.assign(Error('Stale native revision'),{code:'conflict'});if(n.delay){n.delay=false;await new Promise(r=>window.__releaseSave=r);}n.json=JSON.stringify(data);n.revision++;return response();},clear:async({expectedRevision})=>{assertNative(expectedRevision===n.revision);n.json=undefined;n.revision++;return response();},revoke:async()=>{n.consented=false;return{status:'revoked'};}};
 window.webkit.messageHandlers.scheduleFiles.postMessage=async message=>{
  if(message.action!=='lifeStore')return;
  try{
   const fn=backend[message.operation];if(!fn)throw Error('Unknown operation');
   const args=message.operation==='write'?{expectedRevision:message.expectedRevision,data:JSON.parse(message.json)}:message;
   const value=await fn(args);
   window.dispatchEvent(new CustomEvent('nativeLifeStoreResult',{detail:{requestId:message.requestId,ok:true,value}}));
  }catch(error){window.dispatchEvent(new CustomEvent('nativeLifeStoreResult',{detail:{requestId:message.requestId,ok:false,error:{code:error.code||'error',message:error.message}}}));}
 };
 function assertNative(ok){if(!ok)throw Error('Stale deletion revision');}
 });const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('Scheduler/Application.html')).href);await p.waitForFunction(()=>window.OrbiterHub);await p.evaluate(()=>window.OrbiterHub.navigate('health'));await p.locator('[data-hub-action="enable"]').waitFor();assert.equal(await p.evaluate(()=>window.__native.reads),0,'No read before native consent');await p.locator('[data-hub-action="enable"]').click();await p.locator('#hub-meal-form').waitFor();assert.equal(await p.evaluate(()=>window.__native.access),1);
 async function enter(name){await p.locator('#hub-meal-name').fill(name);await p.locator('#hub-meal-form [name="calories"]').fill('350');}
 await enter('Accepted save');await p.evaluate(()=>window.__native.delay=true);await p.locator('#hub-meal-form [type="submit"]').click();await p.waitForFunction(()=>!!window.__releaseSave);assert.equal(await p.evaluate(()=>window.OrbiterHub.snapshot().meals.length),0,'No optimistic adoption before protected save');await p.locator('#hub-meal-name').fill('Newer typed draft');await p.evaluate(()=>window.__releaseSave());await p.waitForFunction(()=>window.OrbiterHub.snapshot().meals.length===1);assert.equal(await p.locator('#hub-meal-name').inputValue(),'Newer typed draft','Late save preserves newly typed entry');assert.equal(await p.evaluate(()=>window.OrbiterHub.dirty()),true);await p.locator('#hub-meal-form [type="submit"]').click();await p.waitForFunction(()=>window.OrbiterHub.snapshot().meals.length===2);
 await enter('Uncertain draft');await p.evaluate(()=>window.__native.timeout=true);await p.locator('#hub-meal-form [type="submit"]').click();await p.waitForFunction(()=>document.getElementById('hub-notice').textContent.includes('Uncertain'));assert.equal(await p.locator('#hub-meal-name').inputValue(),'Uncertain draft');const count=await p.evaluate(()=>window.__native.writes);await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>window.__native.writes),count,'No automatic uncertain-write retry');await p.locator('[data-hub-action="native-reconcile"]').click();await p.waitForFunction(()=>!document.getElementById('hub-notice').textContent.includes('Uncertain'));assert.equal(await p.locator('#hub-meal-name').inputValue(),'Uncertain draft','Explicit reread preserves form draft');await p.locator('[data-discard-form="hub-meal-form"]').click();await p.evaluate(()=>window.OrbiterHub.navigate('life'));await p.locator('[data-hub-action="delete-journal"]').click();await p.locator('#hub-delete-confirm').click();await p.waitForFunction(()=>window.OrbiterHub.snapshot().meals.length===0);assert.equal(await p.evaluate(()=>window.__native.json),undefined);
 await p.evaluate(()=>window.OrbiterHub.navigate('health'));p.once('dialog',d=>d.accept());await p.locator('[data-hub-action="native-revoke"]').click();await p.locator('[data-hub-action="enable"]').waitFor();assert.equal(await p.evaluate(()=>window.__native.consented),false);assert.equal(await p.locator('#hub-meal-form').count(),0);assert.deepEqual(errors,[]);
 fs.mkdirSync('build/native-life-ui',{recursive:true});await p.screenshot({path:'build/native-life-ui/disconnected.png',fullPage:true});await context.close();
 const closed=await browser.newContext({viewport:{width:390,height:844}});
 await closed.addInitScript(()=>{
  window.__journalMessages=[];
  window.webkit={messageHandlers:{scheduleFiles:{postMessage:message=>{
   if(message.action!=='lifeStore')return;
   window.__journalMessages.push(message.operation);
   queueMicrotask(()=>window.dispatchEvent(new CustomEvent('nativeLifeStoreResult',{detail:{requestId:message.requestId,ok:true,value:{contractVersion:1,owner:'device',available:false,consented:false,read:false,write:false,cloud:false,healthKit:false,reason:'Protected journal unavailable pending native validation.'}}})));
  }}}};
  for(const method of ['getItem','setItem','removeItem']){const old=Storage.prototype[method];Storage.prototype[method]=function(key,...args){if(String(key).startsWith('orbiter.life'))throw Error('Closed journal touched WebKit storage');return old.call(this,key,...args);};}
 });
 const cp=await closed.newPage();const closedErrors=[];cp.on('pageerror',e=>closedErrors.push(e.message));
 await cp.goto(pathToFileURL(path.resolve('Scheduler/Application.html')).href);await cp.waitForFunction(()=>window.OrbiterHub);
 await cp.evaluate(()=>window.OrbiterHub.navigate('health'));
 await cp.waitForFunction(()=>document.getElementById('life-hub').textContent.includes('pending native validation'));
 assert.equal(await cp.locator('[data-hub-action="enable"]').count(),0);
 assert.equal(await cp.locator('#hub-meal-form').count(),0);
 assert(await cp.evaluate(()=>window.__journalMessages.length>0&&window.__journalMessages.every(operation=>operation==='capabilities')),'Closed gate permits capability checks only');
 assert.deepEqual(closedErrors,[]);await closed.close();
 console.log('PASS: actual iPhone hub awaits consent/read/save/delete, no WebKit journal storage, late saves retain newer drafts, timeout no retry, explicit reconciliation retains drafts and revoke clears visible journal.');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
