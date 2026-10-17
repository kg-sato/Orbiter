/* Short, deliberately paced visual demonstration of the review checkpoint. */
const fs=require('fs'),path=require('path'),{chromium}=require('playwright-core');
(async()=>{
 const out=path.resolve('build/living-pond-review');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050},recordVideo:{dir:out,size:{width:1280,height:934}}}),page=await context.newPage();
  await page.goto('http://127.0.0.1:18868/design/living-pond/index.html');await page.waitForFunction(()=>OrbiterCats.stats().loaded&&OrbiterCats.stats().frames>2);
  await page.waitForTimeout(800);
  for(const name of ['Tide Wanderer','Moon Garden','Stargazer']){await page.locator(`[data-showcase="${name}"]`).click();await page.waitForTimeout(850);await page.locator('#world-panel').screenshot({path:out+'/'+name.toLowerCase().replaceAll(' ','-')+'-final.png'});await page.mouse.move(1150,450);await page.waitForTimeout(650);}
  fs.mkdirSync(path.resolve('design/living-pond/stills'),{recursive:true});
  for(const preset of ['tidal-night','lunar-mist','opal-dawn']){await page.selectOption('#palette',preset);await page.waitForTimeout(1100);const pond=await page.evaluate(()=>document.querySelector('#pond-background canvas').toDataURL('image/png'));fs.writeFileSync(out+'/pond-'+preset+'.png',Buffer.from(pond.split(',')[1],'base64'));const jpg=await page.evaluate(()=>document.querySelector('#pond-background canvas').toDataURL('image/jpeg',.9));fs.writeFileSync(path.resolve('design/living-pond/stills/'+preset+'.jpg'),Buffer.from(jpg.split(',')[1],'base64'));}
  await page.selectOption('#palette','tidal-night');await page.locator('#rotation').evaluate(n=>{n.value='25';n.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(800);await page.locator('#rotation').evaluate(n=>{n.value='0';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#open-popup').click();await page.waitForTimeout(170);await page.screenshot({path:out+'/wave-forming-final.png'});await page.locator('#intention').fill('One step at a time.');await page.waitForTimeout(900);await page.locator('#close-popup').click();await page.waitForTimeout(700);
  await page.locator('[data-page="Assignments"]').click();await page.waitForTimeout(1200);await page.locator('[data-page="Atlas"]').click();await page.waitForTimeout(1200);
  await page.locator('#compact').click();await page.waitForTimeout(700);await page.locator('#buddy-options').click();await page.waitForTimeout(700);await page.locator('#buddy-done').click();await page.waitForTimeout(700);await page.locator('#buddy').screenshot({path:out+'/buddy-final.png'});
  const video=page.video();await context.close();await video.saveAs(out+'/showcase.webm');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
