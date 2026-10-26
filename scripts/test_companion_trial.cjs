/* Same isolated companion view, one fresh browser per variant, no real workspace. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/companion-lite');fs.mkdirSync(out,{recursive:true});
const report={method:'Three alternating paired headless Edge runs; 3s warmup + 6s sample. Companion scene only, not full app or device battery benchmark.',metricNotes:'JS heap excludes decoded images, GPU memory and WebView overhead. Stable-PID CPU deltas are incomplete if processes change; comparative CPU summary is suppressed in that case. GPU-process CPU is not GPU utilization.',runs:[]};
const metricValues=r=>Object.fromEntries(r.metrics.map(m=>[m.name,m.value]));
async function run(mode,iteration){
 const browser=await chromium.launch({executablePath:process.env.ORBITER_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const browserCDP=await browser.newBrowserCDPSession();
  if(!report.environment){const system=await browserCDP.send('SystemInfo.getInfo');report.environment={browser:browser.version(),gpu:system.gpu,modelName:system.modelName};}
  const context=await browser.newContext({viewport:{width:1366,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='companion-lite.test')return r.abort();const file=path.resolve(root,u.pathname.slice(1));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404});const ext=path.extname(file);return r.fulfill({body:fs.readFileSync(file),contentType:{'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg'}[ext]||'application/octet-stream'});});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://companion-lite.test/design/companion-lite/index.html?mode=${mode}`);
  await page.waitForFunction(()=>window.trialStats().ready||window.trialStats().error);
  const initial=await page.evaluate(()=>window.trialStats());assert.equal(initial.error,null);assert.equal(initial.webglContexts,mode==='lite'?0:1);
  if(mode==='lite')assert.equal(await page.evaluate(()=>typeof window.OrbiterCats),'undefined','Lite playback must not load Three/GLB bundle');
  await page.waitForTimeout(3000);
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  const start=metricValues(await cdp.send('Performance.getMetrics')),p0=(await browserCDP.send('SystemInfo.getProcessInfo')).processInfo;
  await page.evaluate(()=>{window.__latencies=[];let last=performance.now();window.__probe=setInterval(()=>{const now=performance.now();window.__latencies.push(Math.max(0,now-last-100));last=now;},100);window.__clicks=setInterval(()=>document.getElementById('respond').click(),200);});
  await page.waitForTimeout(6000);
  const timing=await page.evaluate(()=>{clearInterval(window.__probe);clearInterval(window.__clicks);const v=window.__latencies.slice().sort((a,b)=>a-b);return{samples:v.length,p95TimerDelayMs:v[Math.floor(v.length*.95)]||0,maxTimerDelayMs:v.at(-1)||0};});
  const end=metricValues(await cdp.send('Performance.getMetrics')),p1=(await browserCDP.send('SystemInfo.getProcessInfo')).processInfo;
  const before=new Map(p0.map(p=>[p.id,p]));const stable=p1.filter(p=>before.has(p.id));const cpuSeconds=stable.reduce((s,p)=>s+Math.max(0,p.cpuTime-before.get(p.id).cpuTime),0),seconds=end.Timestamp-start.Timestamp;
  const stats=await page.evaluate(()=>window.trialStats());
  const row={mode,iteration,sampleSeconds:seconds,mainThreadTaskMs:(end.TaskDuration-start.TaskDuration)*1000,scriptMs:(end.ScriptDuration-start.ScriptDuration)*1000,jsHeapUsedBytes:end.JSHeapUsedSize,browserProcessCPUSeconds:cpuSeconds,processChurn:p0.length!==stable.length||p1.length!==stable.length,timing,stats};report.runs.push(row);
  assert.deepEqual(errors,[]);assert.equal(await page.locator('#interaction-status').textContent(),'Hello, little study companion.');
  if(iteration===0){await page.screenshot({path:path.join(out,`${mode}-desktop.png`)});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,`${mode}-phone.png`)});
   await page.emulateMedia({reducedMotion:'reduce'});if(mode==='lite')assert.equal(await page.locator('#sprite').evaluate(e=>getComputedStyle(e).animationName),'none');
  }
  console.log(JSON.stringify({mode,iteration,mainThreadTaskMs:Math.round(row.mainThreadTaskMs),heapMiB:Math.round(row.jsHeapUsedBytes/1048576*10)/10,cpuSeconds:Math.round(cpuSeconds*1000)/1000,contexts:stats.webglContexts}));
 }finally{await browser.close();}
}
(async()=>{for(let i=0;i<3;i++)for(const mode of i%2?['live','lite']:['lite','live'])await run(mode,i);
 report.summary={};for(const mode of ['lite','live']){const runs=report.runs.filter(r=>r.mode===mode),median=key=>runs.map(key).sort((a,b)=>a-b)[1];report.summary[mode]={mainThreadTaskMs:median(r=>r.mainThreadTaskMs),heapMiB:median(r=>r.jsHeapUsedBytes/1048576),processCPUSeconds:runs.every(r=>!r.processChurn)?median(r=>r.browserProcessCPUSeconds):null,p95TimerDelayMs:median(r=>r.timing.p95TimerDelayMs)};}
 fs.writeFileSync(path.join(out,'comparison.json'),JSON.stringify(report,null,2));console.log('PASS: trial A/B, no WebGL/3D bundle in lite, responsiveness, desktop/phone geometry and reduced motion.');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'comparison-incomplete.json'),JSON.stringify(report,null,2));process.exitCode=1;});
