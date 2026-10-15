/* Visual acceptance uses disposable origins and demonstration data only. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const {chromium} = require('playwright-core');
const root = path.resolve(__dirname, '..');
async function route(page) {
  await page.route('**/*', r => {
    const url = new URL(r.request().url());
    if (url.hostname !== 'orbiter-celestial.test') return r.abort();
    if (url.pathname === '/api/session') return r.fulfill({json:{username:null,csrf:null}});
    const file = path.resolve(root, url.pathname.slice(1) || 'Application.html');
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return r.fulfill({status:404,body:''});
    return r.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':'text/html'});
  });
}
async function navigate(page, scene) {
  // The desktop navigation is hidden on phones; dispatch its existing handler.
  await page.locator(`.side-nav button[data-page="${scene}"]`).evaluate(e => e.click());
  await page.waitForTimeout(700);
}
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1000}});
    const page = await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await route(page); await page.goto('http://orbiter-celestial.test/Application.html');
    await page.waitForFunction(()=>window.OrbiterUI && window.OrbiterScene?.stats().started);
    await page.evaluate(async()=>{
      const old=window.OrbiterUI.snapshot(),next=structuredClone(old),today=new Date();
      next.study ||= {tasks:[],sessions:[],preferences:{name:'',goal:10,motion:false,solid:false},timer:{duration:25,remaining:1500,endAt:null,title:'',taskId:null}};
      const date=offset=>{const d=new Date(today);d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
      next.study.preferences.name='Alex';next.study.preferences.accent='mint';
      next.study.tasks=[
        {id:'essay',title:'Make sense of the messy notes',course:'PSY 204',due:date(1),estimate:90,done:false,kind:'assignment',steps:[]},
        {id:'lab',title:'A careful experiment, one small observation at a time',course:'BIO 210',due:date(4),estimate:120,done:false,kind:'assignment',steps:[]},
        {id:'long',title:('Advanced methods: '+('a thoughtful examination of interconnected systems ').repeat(3)).slice(0,160),course:'MAT 221',due:date(10),estimate:120,done:false,kind:'assignment',steps:[]},
        {id:'exam',title:'Cognitive psychology — midterm',course:'PSY 204',due:date(5),estimate:60,done:false,kind:'exam',exam:{targetMinutes:300,startDate:date(0),logs:[]},steps:[]},
      ];
      next.template=[{id:'class',title:'Cognitive psychology',course:'PSY 204',day:(today.getDay()+6)%7,start:'09:00',end:'10:00',kind:'class',color:'#bba8df',notes:''},{id:'study',title:'Make sense of the messy notes',course:'PSY 204',day:(today.getDay()+6)%7,start:'10:30',end:'11:30',kind:'study',color:'#a9d5c8',notes:''}];
      next.weeks={};await window.SchedulerAccountBridge.load(JSON.stringify(next),JSON.stringify(old));
    });
    fs.mkdirSync(path.join(root,'build/celestial-040'),{recursive:true});
    for(const [width,height] of [[1440,1000],[1024,850],[390,844],[360,800]]) {
      await page.setViewportSize({width,height});
      for(const scene of ['desk','tasks','atlas','rhythm']) {
        await navigate(page,scene);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${scene} overflows at ${width}`);
        assert.equal(await page.evaluate(()=>window.OrbiterScene.stats().page),scene);
        assert.equal(await page.evaluate(()=>window.OrbiterCats.stats().contexts),1);
        if(scene==='atlas') {
          const overlaps=await page.locator('.atlas-sculpture').evaluate(e=>{const r=e.getBoundingClientRect(),cards=document.getElementById('atlas-courses').getBoundingClientRect();return r.bottom>cards.top;});
          assert.equal(overlaps,false,`Atlas cat overlaps course cards at ${width}`);
          assert.equal(await page.locator('.course-habitat').count(),3);
        }
        if(scene==='desk') {
          await page.mouse.move(width*.8,height*.3);await page.waitForTimeout(200);
          assert.equal(await page.evaluate(()=>window.OrbiterScene.stats().paused),false);
        }
        if(width===1440||width===390) await page.screenshot({path:`build/celestial-040/${scene}-${width}.png`,fullPage:true});
      }
    }
    await page.setViewportSize({width:1440,height:1000});
    for(const accent of ['mint','lilac','apricot']) for(const material of ['sculpted','glass','quiet']) {
      await page.evaluate(async ({accent,material})=>{const old=window.OrbiterUI.snapshot(),next=structuredClone(old);next.study.preferences.accent=accent;next.study.preferences.material=material;await window.SchedulerAccountBridge.load(JSON.stringify(next),JSON.stringify(old));},{accent,material});
      assert.equal(await page.evaluate(()=>window.OrbiterScene.stats().paused),material==='quiet');
    }
    await page.evaluate(async()=>{const old=window.OrbiterUI.snapshot(),next=structuredClone(old);next.study.preferences.material='sculpted';await window.SchedulerAccountBridge.load(JSON.stringify(next),JSON.stringify(old));});
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);
    assert.equal(await page.evaluate(()=>window.OrbiterScene.stats().paused),true);
    assert.equal(await page.locator('#liquid-landscape').evaluate(e=>getComputedStyle(e).transform),'none');
    await page.emulateMedia({reducedMotion:'no-preference'});await navigate(page,'desk');
    await page.locator('#focus-start').click();
    assert.equal(await page.evaluate(()=>window.OrbiterScene.stats().paused),false,'Focus must stay expressive');
    for(const scene of ['atlas','tasks','rhythm','desk','atlas','desk']) await navigate(page,scene);
    assert.equal(await page.evaluate(()=>window.OrbiterCats.stats().contexts),1);
    assert.deepEqual(errors,[]);
    console.log('Celestial scenes, 4 viewport layouts, 9 themes, reduced motion and expressive focus passed.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
