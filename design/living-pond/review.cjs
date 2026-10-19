/* Explicit review checks: fresh, disposable browser context; no installed profile. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright-core');
const url='http://127.0.0.1:18868/design/living-pond/index.html';
(async()=>{
 const out=path.resolve('build/living-pond-review');fs.mkdirSync(out,{recursive:true});
 const assetBytes=fs.readFileSync(path.resolve('design/living-pond/avatar/kitten.glb'));assert.equal(assetBytes.toString('ascii',0,4),'glTF');const model=JSON.parse(assetBytes.subarray(20,20+assetBytes.readUInt32LE(12)).toString());assert(model.skins[0].joints.length<=24);assert(model.materials.length<=6);assert(model.meshes.some(m=>m.extras?.targetNames?.includes('Blink')));const asset={bytes:assetBytes.length,bones:model.skins[0].joints.length,materials:model.materials.length};
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050},recordVideo:{dir:out,size:{width:1280,height:934}}});
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error'&&message.text().includes('THREE.'))errors.push(message.text());});page.on('request',r=>requests.push(r.url()));
  await page.goto(url);await page.waitForFunction(()=>window.OrbiterCats?.stats().loaded&&OrbiterCats.stats().pond?.frames>2);
  const gusts=await page.evaluate(()=>OrbiterCats.stats().pond.gusts);await page.mouse.move(8,410);for(let y=420;y<600;y+=12)await page.mouse.move(8,y);await page.waitForTimeout(120);assert((await page.evaluate(()=>OrbiterCats.stats().pond.gusts))>gusts);const still=await page.evaluate(()=>OrbiterCats.stats().pond.gusts);await page.waitForTimeout(140);assert.equal(await page.evaluate(()=>OrbiterCats.stats().pond.gusts),still);
  assert.equal(await page.locator('.catalog-item').count(),51);
  assert.equal(await page.locator('.catalog-item[data-ready="true"]').count(),14);
  const baseline={};
  for(const id of ['habitat-01','habitat-07','habitat-12']){
    await page.selectOption('#quick-habitat',id);await page.waitForTimeout(450);
    baseline[id]={updated:await page.evaluate(()=>OrbiterStudy.stats())};
    await page.locator('#world-panel').screenshot({path:`${out}/${id}.png`});
    await page.locator('#compare').click();await page.waitForTimeout(100);baseline[id].original=await page.evaluate(()=>OrbiterStudy.stats());
    await page.locator('#compare').click();await page.waitForTimeout(120);
  }
  for(const id of ['halo-thin','halo-07','halo-12']){await page.selectOption('#quick-accessory',id);await page.waitForTimeout(400);await page.locator('#world-panel').screenshot({path:`${out}/${id}.png`});}
  for(const name of ['Tide Wanderer','Moon Garden','Stargazer']){await page.locator(`[data-showcase="${name}"]`).click();await page.waitForTimeout(450);await page.locator('#world-panel').screenshot({path:out+'/outfit-'+name.toLowerCase().replaceAll(' ','-')+'.png'});const outfit=await page.evaluate(()=>OrbiterCats.stats());assert(outfit.study.reduce((n,p)=>n+p.drawCalls,0)<=12);assert(outfit.study.filter(p=>p.item.startsWith('habitat-')).every(p=>p.triangles<=15000));for(const identity of ['0','85','170','255'])for(const age of ['0','7200000','28800000','72000000']){await page.selectOption('#identity',identity);await page.selectOption('#growth',age);const s=await page.evaluate(()=>OrbiterCats.stats());assert.equal(s.profile,Number(identity));assert.equal(s.contexts,1);}}
  await page.selectOption('#identity','0');await page.selectOption('#growth','0');await page.locator('#rotation').evaluate(n=>{n.value='30';n.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(100);await page.locator('#world-panel').screenshot({path:out+'/rotation.png'});await page.locator('#rotation').evaluate(n=>{n.value='0';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#open-popup').click();await page.waitForTimeout(150);await page.screenshot({path:out+'/popup-lens.png'});
  await page.locator('#intention').fill('Immediate typing, stable draft');assert.equal(await page.locator('#intention').inputValue(),'Immediate typing, stable draft');
  await page.waitForTimeout(170);await page.screenshot({path:out+'/popup-forming.png'});await page.waitForTimeout(650);
  assert.equal(await page.locator('.pond-forming').count(),0);
  await page.locator('#close-popup').click();assert.equal(await page.locator('#sample-popup').evaluate(d=>d.open),false);await page.waitForTimeout(140);await page.screenshot({path:out+'/closing.png'});await page.waitForTimeout(500);
  await page.locator('#draft').fill('Persistent preview draft');
  await page.locator('[data-page="Assignments"]').click();await page.waitForTimeout(300);await page.screenshot({path:out+'/navigation.png'});
  await page.locator('[data-page="Atlas"]').click();await page.waitForTimeout(1100);assert.equal(await page.locator('#draft').inputValue(),'Persistent preview draft');
  await page.locator('#open-popup').click();await page.keyboard.press('Escape');await page.waitForTimeout(550);assert.equal(await page.locator('#sample-popup').evaluate(d=>d.open),false);assert.equal(await page.locator('.pond-forming,.pond-evaporating').count(),0);
  await page.locator('#open-popup').focus();await page.keyboard.press('Enter');await page.locator('#intention').fill('Keyboard activation');await page.waitForTimeout(1000);await page.locator('#done-popup').click();await page.waitForTimeout(550);
  for(const palette of ['tidal-night','lunar-mist','opal-dawn'])for(const material of ['glass','solid','reduced']){await page.selectOption('#palette',palette);await page.selectOption('#material',material);await page.waitForTimeout(60);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow);}
  await page.locator('#open-popup').click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert.equal(await page.locator('.pond-forming').count(),0);await page.screenshot({path:out+'/phone-popup.png'});await page.keyboard.press('Escape');await page.waitForTimeout(550);
  await page.locator('#compact').click();await page.locator('#buddy-options').click();await page.locator('#buddy-intention').fill('Compact draft');await page.waitForTimeout(450);await page.screenshot({path:out+'/compact-options.png'});await page.locator('#buddy-done').click();await page.waitForTimeout(450);await page.screenshot({path:out+'/compact.png'});
  await page.setViewportSize({width:360,height:720});await page.waitForTimeout(100);assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(n=>n.getBoundingClientRect().right>innerWidth+1).map(n=>({tag:n.tagName,id:n.id,right:n.getBoundingClientRect().right})))));await page.screenshot({path:out+'/minimum-phone.png'});
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#buddy-options').click();assert.equal(await page.locator('.pond-forming').count(),0);await page.emulateMedia({reducedMotion:'no-preference'});
  await page.selectOption('#quality','low');await page.locator('#buddy-done').click();await page.waitForTimeout(250);assert.equal(await page.locator('.pond-forming').count(),0);
  await page.selectOption('#quality','auto');await page.selectOption('#palette','tidal-night');await page.selectOption('#material','glass');
  await page.setViewportSize({width:1440,height:1050});await page.locator('#compact').click();await page.locator('#motion').click();await page.locator('#open-popup').click();assert.equal(await page.locator('.pond-forming').count(),0);await page.keyboard.press('Escape');await page.locator('#motion').click();
  await page.locator('[data-item="habitat-01"]').click();await page.locator('#equip').click();await page.locator('[data-item="habitat-12"]').click();await page.locator('#cancel-preview').click();assert.equal((await page.evaluate(()=>OrbiterStudy.equipment())).habitat,'habitat-01');
  for(let i=0;i<16;i++)await page.locator(`[data-item="${i%2?'habitat-07':'habitat-12'}"]`).click();await page.waitForTimeout(500);
  const final=await page.evaluate(()=>OrbiterStudy.stats());assert.equal(final.cat.contexts,1);assert.equal(final.transition.overlayCount,0);assert.equal(final.transition.temporarySurfaces,0);assert(final.transition.surfaceFrames>0);assert(final.transition.captures>0);
  const fallback=await context.newPage();await fallback.goto(url+'?noWebGL');await fallback.waitForFunction(()=>!!document.querySelector('#cat-host img'));for(const id of ['habitat-01','habitat-07','habitat-12']){await fallback.locator(`[data-item="${id}"]`).click();await fallback.waitForTimeout(100);await fallback.screenshot({path:`${out}/fallback-${id}.png`});}assert.equal(await fallback.evaluate(()=>OrbiterCats.stats().contexts),0);await fallback.close();
  assert.equal(final.transition.lastError,null);
  assert.deepEqual(errors,[]);assert(requests.every(r=>r.startsWith('http://127.0.0.1:18868/')||r.startsWith('data:')||r.startsWith('blob:')));
  const report={asset,baseline,final,errors,requests:[...new Set(requests)],limitations:['Review prototype only; remaining 37 visuals and production integration await visual approval.','Original comparison means previous item geometry within the shared refined avatar/pond review renderer.','No native installer, Windows scaling or live account sync checked.','Browser frame samples are not whole-process CPU or GPU memory measurements.']};
  fs.writeFileSync(out+'/checks.json',JSON.stringify(report,null,2));const video=page.video();await context.close();await video.saveAs(out+'/motion.webm');console.log(JSON.stringify({out,errors,final}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
