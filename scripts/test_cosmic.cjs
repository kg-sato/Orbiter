/* Disposable browser origins and generated art studies; never loads a real account. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.env.ORBITER_ART_OUT||path.join(root,'build/cosmic-studies'));
(async()=>{
 const bytes=fs.readFileSync(path.join(root,'src/mascot/assets/kitten.glb'));
 assert.equal(bytes.toString('ascii',0,4),'glTF');const data=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 assert(data.skins[0].joints.length<=24);assert(data.materials.length<=6);assert(data.meshes.some(m=>m.extras?.targetNames?.includes('Blink')));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&/kitten|Cat uses/.test(m.text()))console.log(m.text());});
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(!u.hostname.endsWith('.test'))return r.abort();if(u.pathname==='/api/session')return r.fulfill({json:{username:null,csrf:null}});const f=path.resolve(root,u.pathname.slice(1)||'Application.html');if(!f.startsWith(root+path.sep)||!fs.existsSync(f))return r.fulfill({status:404,body:''});return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':'text/html'});});
  await page.goto('http://orbiter-cosmic.test/Application.html');await page.waitForFunction(()=>window.OrbiterUI&&window.OrbiterCats?.stats().loaded);
  // The life hub now opens on Today; companion controls live in Study / My Day.
  await page.evaluate(()=>window.OrbiterHub?.openStudy('desk'));
  await page.evaluate(()=>window.OrbiterCats.ready);const stats=await page.evaluate(()=>window.OrbiterCats.stats());assert.equal(stats.contexts,1);assert.equal(stats.error,null);
  fs.mkdirSync(out,{recursive:true});
  // Front/side/three-quarter neutral presentations, plus actual owned item comparisons.
  for(const [name,angle,items] of [['front',0,{}],['side',Math.PI/2,{}],['three-quarter',Math.PI/4,{}],['equipped',0,{appearance:'look-10',halo:'halo-12',trail:'trail-comet',habitat:'habitat-07'}]]){
   const url=await page.evaluate(({angle,items})=>window.OrbiterCats.portrait(0,7200000,items,angle),{angle,items});fs.writeFileSync(path.join(out,`kitten-${name}.png`),Buffer.from(url.split(',')[1],'base64'));
  }
  for(const preset of ['tidal-night','lunar-mist','opal-dawn']){await page.evaluate(p=>{document.body.dataset.preset=p;window.OrbiterCats.mount(document.querySelector('.orbit-art'),0,{growthMs:7200000,equipment:{appearance:'look-10',halo:'halo-12',trail:'trail-comet',habitat:'habitat-07'}});},preset);await page.screenshot({path:path.join(out,`${preset}.png`)});}
  const fixture={revision:1,settings:{appearance:'mint',halo:'halo-thin',trail:'trail-waves',habitat:''},rewards:{xp:120,level:2,chests:1,focusedMs:7200000,crateProgressMs:0,owned:['mint','halo-thin','trail-waves','habitat-07'],stars:0},catalog:[{id:'mint',name:'Tidal mint',rarity:'common',slot:'appearance'},{id:'halo-thin',name:'Silver charm',rarity:'common',slot:'halo'},{id:'trail-waves',name:'Quiet tide',rarity:'common',slot:'trail'},{id:'habitat-07',name:'Crystal grotto',rarity:'rare',slot:'habitat'},{id:'habitat-12',name:'Infinity tide',rarity:'mythic',slot:'habitat'}]};
  await page.evaluate(v=>{window.OrbiterCats.mount(document.querySelector('.orbit-art'),0,{equipment:v.settings});window.dispatchEvent(new CustomEvent('orbiter-native-state',{detail:v}));},fixture);
  await page.locator('[data-reward-collection]').click();await page.locator('[data-slot-filter=habitat]').click();await page.locator('[data-equip=habitat-12]').click();assert(await page.locator('[data-preview-equip]').isDisabled());assert.match(await page.locator('.orb-equipment-preview').textContent(),/LOCKED/);assert.equal(await page.evaluate(()=>window.OrbiterCats.stats().contexts),1);
  await page.locator('[data-preview-cancel]').click();assert.equal(await page.evaluate(()=>document.body.dataset.habitat),undefined);await page.locator('[data-equip=habitat-07]').click();assert(!(await page.locator('[data-preview-equip]').isDisabled()));await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.body.dataset.habitat);
  await page.evaluate(()=>window.OrbiterUI.openAppearance());await page.locator('#setting-motion-intensity').fill('0');await page.locator('#setting-quality').selectOption('low');await page.locator('#appearance-apply').click();await page.waitForFunction(()=>document.body.dataset.effectQuality==='low');assert.equal(await page.evaluate(()=>document.body.dataset.motionIntensity),'0');
  await page.locator('#setting-motion-intensity').fill('90');await page.locator('#appearance-cancel').click();assert.equal(await page.locator('#setting-motion-intensity').inputValue(),'0');await page.keyboard.press('Escape');
  for(const width of [360,390,1440]){await page.setViewportSize({width,height:1000});if(!(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)))console.log('Overflow',width,await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+2&&getComputedStyle(e).position!=='fixed';}).slice(-12).map(e=>[e.tagName,e.id,e.className,e.getBoundingClientRect().right])));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await page.emulateMedia({reducedMotion:'reduce'});const a=await page.evaluate(()=>window.OrbiterCats.stats().frames);await page.waitForTimeout(150);const b=await page.evaluate(()=>window.OrbiterCats.stats().frames);assert(b-a<=2);
  const catalog=[...fs.readFileSync(path.join(root,'desktop/src-tauri/src/engine.rs'),'utf8').matchAll(/\("([^"]+)",\s*"([^"]+)",\s*"(common|rare|mythic)"\)/g)].map(m=>({id:m[1],slot:m[1].startsWith('halo-')?'halo':m[1].startsWith('trail-')?'trail':m[1].startsWith('habitat-')?'habitat':'appearance'}));assert.equal(catalog.length,51);
  const hashes=await page.evaluate(catalog=>catalog.map(c=>({id:c.id,slot:c.slot,url:window.OrbiterCats.portrait(0,7200000,{[c.slot]:c.id})})),catalog);
  for(const slot of ['appearance','halo','trail','habitat']){const entries=hashes.filter(h=>h.slot===slot);assert.equal(new Set(entries.map(h=>h.url)).size,entries.length,'Each '+slot+' has distinct rendered artwork');}
  // The chest is now the first embedded GLB: corrupt the kitten by exact bytes.
  const broken=await ctx.newPage();await broken.route('**/*',r=>{if(!r.request().url().includes('broken-avatar.test'))return r.abort();const source=fs.readFileSync(path.join(root,'Application.html'),'utf8'),asset='data:application/octet-stream;base64,'+bytes.toString('base64');assert(source.includes(asset));const html=source.replace(asset,'data:application/octet-stream;base64,YmFk');return r.fulfill({contentType:'text/html',body:html});});await broken.goto('http://broken-avatar.test/Application.html');await broken.waitForFunction(()=>window.OrbiterUI&&window.OrbiterCats.stats().error);assert.equal(await broken.locator('.orbit-art').getAttribute('data-cat-fallback'),'true');assert(await broken.locator('#focus-start').isEnabled());
  await broken.evaluate(()=>window.OrbiterHub?.openStudy('desk'));
  for(const id of ['halo-05','halo-09','habitat-04','habitat-09']){await broken.evaluate(id=>{const host=document.querySelector('.orbit-art');window.OrbiterCats.mount(host,0,{equipment:{[id.startsWith('halo')?'halo':'habitat']:id}});},id);assert.equal(await broken.locator('.orbit-art canvas').count(),0);await broken.locator('.orbit-art').screenshot({path:path.join(out,`model-failure-${id}.png`)});}await broken.close();
  console.log('Cosmic: original GLB, rig/material budgets, shape keys, turnarounds, scenes, preview/cancel/locked equipment, preference persistence, widths and reduced motion passed.',await page.evaluate(()=>window.OrbiterCats.stats()));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
