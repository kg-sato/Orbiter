/* Visual art review, using disposable offline pages; no automated assertions. */
const fs=require('fs'),path=require('path');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await ctx.newPage();
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='orbiter-scene-art.test')return r.abort();if(u.pathname==='/api/session')return r.fulfill({json:{username:null,csrf:null}});const f=path.resolve('.'+u.pathname);if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f))return r.fulfill({status:404,body:''});return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':'text/html'});});
  await page.goto('http://orbiter-scene-art.test/Application.html');await page.waitForFunction(()=>window.OrbiterUI&&window.OrbiterCats?.stats().loaded);
  fs.mkdirSync('design/backgrounds/review',{recursive:true});
  for(const scene of ['tidal-night','lunar-mist','opal-dawn']){
   await page.setViewportSize({width:1440,height:1000});await page.evaluate(s=>{document.body.dataset.preset=s;document.body.style.setProperty('--atmosphere','.7');window.scrollTo(0,0);},scene);await page.screenshot({path:`design/backgrounds/review/${scene}-planner.png`});
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:`design/backgrounds/review/${scene}-phone.png`});
   const art=await ctx.newPage();await art.setViewportSize({width:1440,height:900});await art.setContent(`<style>${fs.readFileSync('web/celestial.css','utf8')}\n${fs.readFileSync('web/cosmic.css','utf8')}body{margin:0;--atmosphere:.8} .art-label{position:absolute;bottom:35px;left:50px;font:12px system-ui;color:#c1d4dd;letter-spacing:3px}</style><body data-preset="${scene}" class="scene-still"><div class="orbital-backdrop">${fs.readFileSync('web/celestial.svg','utf8')}</div><div class="art-label">ORBITER · ${scene.toUpperCase().replaceAll('-',' ')}</div></body>`);await art.screenshot({path:`design/backgrounds/review/${scene}.png`});await art.close();
  }
  // Use the real shadow markup/styles for a static buddy art composition.
  const markup=fs.readFileSync('desktop/ui/native-shell.js','utf8').match(/this\.shadowRoot\.innerHTML=`([\s\S]*?)`;/)[1];
  const css=['desktop/ui/buddy.css','web/rewards.css','web/glass.css','web/cosmic.css'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
  const cat='data:image/png;base64,'+fs.readFileSync('design/avatar/review/front.png').toString('base64');
  await page.setViewportSize({width:420,height:220});await page.evaluate(({markup,css,cat})=>{window.OrbiterCats.setVisible(false);document.body.replaceChildren();document.body.style.background='transparent';const el=document.createElement('orbiter-buddy');el.attachShadow({mode:'open'});el.shadowRoot.innerHTML='<style>'+css+'</style>'+markup.replace(/<link[^>]+>/g,'');el.dataset.calm='true';el.dataset.presentation='compact';el.dataset.preset='tidal-night';document.body.append(el);el.shadowRoot.getElementById('cat').querySelector('img').src=cat;el.shadowRoot.getElementById('reward-strip').innerHTML=window.OrbiterRewards.strip({rewards:{xp:42,level:1,chests:0,crateProgressMs:720000},settings:{}},true);}, {markup,css,cat});
  for(const scene of ['tidal-night','lunar-mist','opal-dawn']){await page.evaluate(s=>document.querySelector('orbiter-buddy').dataset.preset=s,scene);await page.screenshot({path:`design/backgrounds/review/${scene}-buddy.png`,omitBackground:true});}
  console.log('Rendered all three backgrounds and planner/phone compositions for visual review.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
