/* Same-page original/new measurements. Browser main-thread time is not process CPU. */
const fs=require('fs'),path=require('path'),{chromium}=require('playwright-core');
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();
  const start=performance.now();await page.goto('http://127.0.0.1:18868/design/living-pond/index.html');await page.waitForFunction(()=>OrbiterCats.stats().loaded&&OrbiterCats.stats().frames>2);const startupMs=performance.now()-start;
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  const records=[];
  for(const original of [true,false]){
    if(await page.evaluate(()=>!!window.OrbiterStudyOriginal)!==original)await page.locator('#compare').click();
    for(const outfit of ['Tide Wanderer','Moon Garden','Stargazer']){
      await page.locator(`[data-showcase="${outfit}"]`).click();await page.locator('#world-panel').scrollIntoViewIfNeeded();const habitat=await page.evaluate(()=>OrbiterStudy.equipment().habitat);
      await page.waitForTimeout(2000);const samples=[],before=await metrics(),a=await page.evaluate(()=>OrbiterCats.stats()),began=performance.now();
      for(let i=0;i<30;i++){await page.waitForTimeout(100);samples.push(await page.evaluate(()=>OrbiterCats.stats()));}
      const elapsed=performance.now()-began,b=await page.evaluate(()=>OrbiterCats.stats()),after=await metrics(),gpu=samples.map(s=>s.gpuMs).filter(Number.isFinite);
      records.push({original,outfit,habitat,resolution:b.pond.resolution,elapsedMs:elapsed,fps:(b.frames-a.frames)/(elapsed/1000),mainThreadPercent:(after.TaskDuration-before.TaskDuration)/(elapsed/1000)*100,medianDrawMs:median(samples.map(s=>s.frameMs)),medianGpuMs:gpu.length?median(gpu):null,jsHeapMiB:after.JSHeapUsedSize/1048576,drawCalls:b.renderCalls,triangles:b.triangles,geometryCount:b.geometries,components:b.study});
    }
  }
  await page.locator('#motion').click();await page.waitForTimeout(200);const a=await page.evaluate(()=>OrbiterCats.stats());await page.waitForTimeout(1000);const b=await page.evaluate(()=>OrbiterCats.stats());
  const result={startupMs,records,pausedFrames:b.frames-a.frames,notes:['Previous-item comparison shares the refined review GLB and pond renderer; it is not a complete old-release baseline.','Startup is isolated browser page-ready time, not installed native launch time.','Main-thread percentages use Chromium TaskDuration, not whole-process CPU.','JS heap excludes native process memory, GPU memory and decoded media.','GPU medians exclude a 2-second warmup per scene; timer availability is hardware-dependent.','No installer-size comparison: prototype is not packaged.']};
  fs.writeFileSync(path.resolve('build/living-pond-review/performance.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
