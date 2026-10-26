// The hub may poll twice per second; unchanged state must not mutate its DOM.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../web/life-hub.js'),'utf8');
const timerCode=source.slice(source.indexOf('  function timerState()'),source.indexOf('  function wire()'));
let writes=0;
function element(){
  const values={textContent:'',disabled:false},datasetValues={};
  const node={dataset:new Proxy(datasetValues,{set(target,key,value){writes++;target[key]=value;return true;}})};
  for(const key of ['textContent','disabled'])Object.defineProperty(node,key,{get:()=>values[key],set:value=>{writes++;values[key]=value;}});
  return node;
}
const ids=Object.fromEntries(['timer-display','focus-start','focus-finish','sanctuary-intention','sanctuary-toggle','sanctuary-state','sanctuary-finish','hub-sanctuary'].map(id=>[id,element()]));
const times=[element(),element()],statuses=[element(),element()];
const document={hidden:false,querySelectorAll:selector=>selector==='[data-hub-time]'?times:statuses};
const workspace={study:{timer:{endAt:null,title:'Read chapter'}}};
const context={initialized:true,document,window:{},$:id=>ids[id],workspace:()=>workspace};
vm.createContext(context);vm.runInContext(timerCode,context);
ids['timer-display'].textContent='25:00';ids['focus-start'].textContent='Start focus';
context.updateTimer();assert.equal(times[0].textContent,'25:00');assert.equal(ids['sanctuary-intention'].textContent,'Read chapter');
writes=0;context.updateTimer();assert.equal(writes,0,'Identical poll performs no DOM writes');
ids['timer-display'].textContent='24:59';writes=0;context.updateTimer();assert.equal(writes,2,'Only the two clock labels change');
workspace.study.timer.endAt=Date.now()+10000;ids['focus-start'].textContent='Pause ↗';ids['focus-finish'].disabled=true;
context.updateTimer();assert.equal(ids['hub-sanctuary'].dataset.running,'true');assert.equal(ids['sanctuary-toggle'].textContent,'Pause');assert.equal(ids['sanctuary-finish'].disabled,true);
context.window.OrbiterNativeState={timer:{active:false,title:'Native paused'}};context.updateTimer();assert.equal(ids['hub-sanctuary'].dataset.running,'false');assert.equal(ids['sanctuary-intention'].textContent,'Native paused');
writes=0;document.hidden=true;ids['timer-display'].textContent='24:58';writes=0;context.updateTimer();assert.equal(writes,0,'Hidden documents remain untouched');
document.hidden=false;context.updateTimer();assert.equal(times[1].textContent,'24:58','Resuming visibility refreshes the clock');
times[0]=element();context.updateTimer();assert.equal(times[0].textContent,'24:58','Freshly rendered nodes refresh even when timer state is unchanged');
console.log('PASS: hub timer avoids duplicate DOM writes and refreshes changed/native/recreated state');
