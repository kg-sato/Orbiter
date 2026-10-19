/* Isolated moving design study; no accounts, installed profiles or production data. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright-core');
(async()=>{
 const output=path.resolve('build/lake-review');fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:output,size:{width:1280,height:890}}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:18867/design/lake-transitions/index.html');
  await page.waitForFunction(()=>window.OrbiterLake&&window.OrbiterCats?.stats().pond?.frames>2);
  await page.locator('#ordinary').click();await page.waitForTimeout(95);await page.screenshot({path:output+'/button.png'});
  await page.waitForTimeout(200);
  await page.locator('#open-popup').click();await page.waitForTimeout(390);await page.screenshot({path:output+'/popup.png'});
  assert(await page.locator('#sample-popup').evaluate(d=>d.open));
  await page.locator('#intention').fill('Draft stays sharp and editable');
  assert.equal(await page.locator('#intention').inputValue(),'Draft stays sharp and editable');
  await page.waitForTimeout(600);
  await page.locator('#close-popup').click();assert.equal(await page.locator('#sample-popup').evaluate(d=>d.open),false);
  await page.waitForTimeout(190);await page.screenshot({path:output+'/closing.png'});
  await page.waitForTimeout(420);
  await page.locator('[data-page="Assignments"]').click();await page.waitForTimeout(420);await page.screenshot({path:output+'/navigation.png'});
  await page.waitForTimeout(700);await page.locator('[data-tab="This week"]').click();await page.waitForTimeout(120);await page.screenshot({path:output+'/tab.png'});await page.waitForTimeout(450);
  const stats=await page.evaluate(()=>({transition:OrbiterLake.stats(),cat:OrbiterCats.stats()}));
  assert.equal(stats.transition.active,false);assert.equal(stats.transition.overlayCount,0);assert.equal(stats.cat.contexts,1);assert(stats.transition.pondCaptures>0);assert(stats.cat.pond.transitionDisturbances>0);
  assert.deepEqual(errors,[]);fs.writeFileSync(output+'/prototype.json',JSON.stringify({stats,errors},null,2));
  const video=page.video();await context.close();await video.saveAs(output+'/prototype-motion.webm');
  console.log(JSON.stringify({output,meanDrawMs:stats.transition.meanDrawMs,maxDrawMs:stats.transition.maxDrawMs,pondCaptures:stats.transition.pondCaptures,webglContexts:stats.cat.contexts,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
