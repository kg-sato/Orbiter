/* Art review only: render the bundled avatar on a disposable offline browser origin. */
const fs=require('fs'),path=require('path');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:800,height:800}});
  await page.route('**/*',r=>r.request().url().startsWith('http://avatar-art.test/')?r.fulfill({contentType:'text/html',body:fs.readFileSync('Application.html')}):r.abort());
  await page.goto('http://avatar-art.test/Application.html');await page.waitForFunction(()=>window.OrbiterCats?.stats().loaded);
  await page.emulateMedia({reducedMotion:'reduce'});fs.mkdirSync('design/avatar/review',{recursive:true});
  for(const [name,code,angle,items={}] of [['front',0,0],['side',0,Math.PI/2],['three-quarter',0,Math.PI/4],['folded',4,0],['rounded',8,0],['tufted',12,0],['tuxedo',1,0],['tabby',2,0],['sage',3,0],['equipped',0,0,{appearance:'look-10',halo:'halo-12',trail:'trail-comet',habitat:'habitat-07'}]]){
   const data=await page.evaluate(({code,angle,items})=>window.OrbiterCats.portrait(code,7200000,items,angle),{code,angle,items});
   fs.writeFileSync(`design/avatar/review/${name}.png`,Buffer.from(data.split(',')[1],'base64'));
  }
  console.log('Rendered original avatar turnarounds and identity variations for art review.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
