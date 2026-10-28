/* Auth and cloud HTTP are simulated; no real email or user data is touched. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{chromium}=require('playwright-core');
const records={},receipts={},headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};let offline=false,failPull=false,otpRequest=null,pkceExchange=null;
const uid='11111111-1111-4111-a111-111111111111',email='owner@test.invalid';
const token=()=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000),aud:'authenticated',role:'authenticated'})).toString('base64url'),'test-signature'].join('.');
const session=()=>({access_token:token(),refresh_token:'fixture-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()}});
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1200,height:900}});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const url=new URL(route.request().url());
  if(url.hostname==='oymssinpmiqzyyuiwjpn.supabase.co'){
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});if(offline)return route.abort();
   const body=route.request().postDataJSON()||{};let result={};
   if(url.pathname==='/auth/v1/verify'||url.pathname==='/auth/v1/token')result=session();if(url.pathname==='/auth/v1/otp')otpRequest={body,redirect:url.searchParams.get('redirect_to')};if(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='pkce')pkceExchange=body;if(url.pathname==='/auth/v1/user')result=session().user;
   if(url.pathname==='/rest/v1/rpc/orbiter_pull'){if(failPull)return route.fulfill({status:400,json:{message:'Fixture enrollment pull failed'},headers});result=records;}
   if(url.pathname==='/rest/v1/rpc/orbiter_write'){
    if(receipts[body.p_id])result=receipts[body.p_id];else{const previous=records[body.p_key]||{value:null,version:0};if(previous.version!==body.p_expected)result={...previous,conflict:true};else{result={value:body.p_value,version:previous.version+1};records[body.p_key]=result;receipts[body.p_id]=result;}}
   }
   if(url.pathname==='/rest/v1/rpc/orbiter_rewards')result={focusedMs:1800000,xp:30,level:1,chests:1,owned:['mint'],courseMs:{},stars:0,crateProgressMs:0,equipment:{appearance:'mint'}};
   return route.fulfill({json:result,headers});
  }
  if(url.hostname!=='orbiter-cloud.test')return route.abort();
  const file=path.resolve(url.pathname.slice(1)||'Application.html');if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
  return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html'});
 });
 await page.routeWebSocket('**/realtime/v1/websocket**',ws=>ws.onMessage(()=>{}));
 await page.goto('https://orbiter-cloud.test/Application.html');await page.waitForFunction(()=>window.OrbiterCloud&&document.querySelector('#account-dialog'));
 const guest=await page.evaluate(()=>window.OrbiterUI.snapshot());
 await page.evaluate(async({email})=>{await window.OrbiterCloud.sendCode(email);await window.OrbiterCloud.verify(email,'123456');}, {email});
 assert.equal(Object.keys(records).length,0,'Signing in must not upload guest data');
 // An interrupted first connection must preserve local mode and remain retryable.
 const readStored=key=>page.evaluate(key=>new Promise((resolve,reject)=>{const r=indexedDB.open('orbiter-cloud-v1',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const d=r.result,q=d.transaction('accounts').objectStore('accounts').get(key);q.onsuccess=()=>{resolve(q.result??null);d.close();};q.onerror=()=>reject(q.error);};}),key);
 const readOwner=()=>readStored('active-owner');
 const assertUnconnected=async label=>{
  assert.equal((await page.evaluate(()=>window.OrbiterCloud.status())).enrolled,false,label+': failed enrollment must stay disconnected');
  assert.equal(await readOwner(),null,label+': failed enrollment must not persist an active owner');
  assert.equal(await readStored('guest'),null,label+': failed transaction must not publish a guest backup');
  assert.equal(await readStored(uid),null,label+': failed transaction must not publish an account cache');
  assert.deepEqual(await page.evaluate(()=>window.OrbiterUI.snapshot()),guest,label+': guest workspace must remain unchanged');
  assert.equal(Object.keys(records).length,0,label+': failed enrollment must not upload guest data');
  await page.evaluate(()=>window.OrbiterAccount.open());await page.waitForFunction(()=>document.querySelector('#account-dialog')?.open&&!document.querySelector('#account-migration').hidden);
  await page.keyboard.press('Escape');
 };
 failPull=true;
 const pullError=await page.evaluate(()=>window.OrbiterCloud.enroll('merge').then(()=>null,e=>e.message));
 assert.match(pullError,/Fixture enrollment pull failed/);
 await assertUnconnected('Rejected initial pull');
 await page.reload();await page.waitForFunction(async()=>!!(await window.OrbiterCloud?.status())?.account);
 await assertUnconnected('Reload after rejected pull');failPull=false;
 // Fail a real IndexedDB account-cache write without touching real browser storage.
 await page.evaluate(owner=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){if(this.name==='accounts'&&key===owner){IDBObjectStore.prototype.put=put;throw new DOMException('Fixture account storage failed','QuotaExceededError');}return put.apply(this,arguments);};},uid);
 const storageError=await page.evaluate(()=>window.OrbiterCloud.enroll('merge').then(()=>null,e=>e.message));
 assert.match(storageError,/Fixture account storage failed/);
 await assertUnconnected('Rejected account-cache write');
 await page.reload();await page.waitForFunction(async()=>!!(await window.OrbiterCloud?.status())?.account);
 await assertUnconnected('Reload after rejected cache write');
 // Abort after the account put succeeds to exercise asynchronous transaction rollback.
 await page.evaluate(owner=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){const request=put.apply(this,arguments);if(this.name==='accounts'&&key===owner){IDBObjectStore.prototype.put=put;const transaction=this.transaction;request.addEventListener('success',()=>transaction.abort(),{once:true});}return request;};},uid);
 const abortError=await page.evaluate(()=>window.OrbiterCloud.enroll('merge').then(()=>null,e=>e?.message??String(e)));
 assert.match(abortError,/Account storage is unavailable/);
 await assertUnconnected('Aborted connection transaction');
 await page.reload();await page.waitForFunction(async()=>!!(await window.OrbiterCloud?.status())?.account);
 await assertUnconnected('Reload after aborted transaction');
 await page.evaluate(()=>window.OrbiterCloud.enroll('merge'));assert(Object.keys(records).length>0);
 assert.equal((await page.evaluate(()=>window.OrbiterCloud.status())).enrolled,true,'Retry must connect successfully');assert.equal(await readOwner(),uid);
 // Offline saves must remain durable through a page reload.
 offline=true;await page.evaluate(async()=>{const old=window.OrbiterUI.snapshot(),next=structuredClone(old);next.study.preferences.name='Offline owner';await window.SchedulerAccountBridge.load(JSON.stringify(next),JSON.stringify(old));});
 assert((await page.evaluate(()=>window.OrbiterCloud.status())).pending>0);await page.reload();await page.waitForFunction(()=>window.OrbiterUI?.snapshot().study?.preferences.name==='Offline owner');
 offline=false;await page.evaluate(()=>window.OrbiterCloud.sync());assert.equal(records[JSON.stringify(['preference','name'])].value,'Offline owner');
 // Concurrent writes to the same field retain a reviewable conflict.
 offline=true;await page.evaluate(async()=>{const old=window.OrbiterUI.snapshot(),next=structuredClone(old);next.study.preferences.name='Local choice';await window.SchedulerAccountBridge.load(JSON.stringify(next),JSON.stringify(old));});
 const nameKey=JSON.stringify(['preference','name']);records[nameKey]={value:'Remote choice',version:records[nameKey].version+1};offline=false;await page.evaluate(()=>window.OrbiterCloud.sync());
 assert(Object.keys((await page.evaluate(()=>window.OrbiterCloud.status())).conflicts).includes(nameKey));
 await page.evaluate(key=>window.OrbiterCloud.resolve(key,'remote'),nameKey);assert.equal(await page.evaluate(()=>window.OrbiterUI.snapshot().study.preferences.name),'Remote choice');
 await page.evaluate(()=>window.OrbiterCloud.enroll('merge'));
 assert.deepEqual(await readStored('guest'),guest,'Repeated enrollment must preserve the original guest backup');
 assert.equal(await page.evaluate(()=>window.OrbiterUI.snapshot().study.preferences.name),'Remote choice','Repeated enrollment must preserve connected edits');
 await page.evaluate(()=>window.OrbiterCloud.signOut());assert.deepEqual(await page.evaluate(()=>window.OrbiterUI.snapshot()),guest);assert.equal((await page.evaluate(()=>window.OrbiterCloud.status())).account,null);
 await page.evaluate(()=>window.OrbiterHub.openStudy('atlas'));await page.locator('#atlas-new-name').fill('New guest course');await page.locator('#atlas-create button').click();const secondGuest=await page.evaluate(()=>window.OrbiterUI.snapshot());
 await page.evaluate(({email})=>window.OrbiterCloud.verify(email,'123456'),{email});assert.equal((await page.evaluate(()=>window.OrbiterCloud.status())).enrolled,false);assert.deepEqual(await page.evaluate(()=>window.OrbiterUI.snapshot()),secondGuest);await page.evaluate(()=>window.OrbiterCloud.enroll('remote'));await page.evaluate(()=>window.OrbiterCloud.signOut());assert.deepEqual(await page.evaluate(()=>window.OrbiterUI.snapshot()),secondGuest);
 await page.evaluate(({email})=>window.OrbiterCloud.sendCode(email),{email});assert(otpRequest.body.code_challenge);assert.equal(otpRequest.body.code_challenge_method,'s256');assert(otpRequest.redirect.startsWith('https://orbiter-cloud.test/Application.html'));
 await page.goto('https://orbiter-cloud.test/Application.html?code=fixture-valid-code');await page.waitForFunction(()=>document.querySelector('#account-dialog')?.open&&window.OrbiterCloud);await page.waitForFunction(()=>document.querySelector('#account-identity')?.textContent.includes('owner@test.invalid'));assert.equal(pkceExchange.auth_code,'fixture-valid-code');assert(pkceExchange.code_verifier.length>=43);assert(!page.url().includes('code='));assert.deepEqual(await page.evaluate(()=>window.OrbiterUI.snapshot()),secondGuest,'Email callback must not import automatically');await page.keyboard.press('Escape');await page.evaluate(()=>window.OrbiterCloud.signOut());
 assert.deepEqual(errors,[]);console.log('Browser cloud: failed enrollment recovery, storage failure, explicit migration, offline reload, reconnect, conflicts and guest restoration passed.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

