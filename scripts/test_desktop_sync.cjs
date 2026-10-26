/* Paired browser save recovery; VM transport and storage are disposable. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../web/desktop-sync.js'),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const response=(value,ok=true)=>({ok,status:ok?200:409,json:async()=>value});
function fixture(origin='http://127.0.0.1:18743'){
  const requests=[],storage=new Map(),events=[];
  const context={location:{origin,hash:'',pathname:'/Application.html'},URLSearchParams,window:{dispatchEvent:e=>events.push(e)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:(url,options)=>{const result=deferred();requests.push({url,options,result});return result.promise;}};
  vm.createContext(context);vm.runInContext(source,context);
  return{...context,requests,storage,events,api:context.window.OrbitDesktop};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function ready(f){f.requests[0].result.resolve(response({csrf:'fictional-csrf',editRevision:7,revision:8,workspace:{study:{}}}));await f.api.ready;}
function accepted(request,workspace){request.result.resolve(response({editRevision:8,revision:9,workspace}));}
function rejected(request){request.result.resolve(response({error:'Changed elsewhere'},false));}
(async()=>{
  const inert=fixture('https://example.test');assert.equal(inert.api,undefined);assert.equal(inert.requests.length,0);
  const f=fixture(),workspace={study:{title:'Draft'}};
  const early=f.api.save(workspace,true);await flush();assert.equal(f.requests.length,1,'Save waits for initial revision');
  await ready(f);await flush();const first=f.requests[1];assert.equal(first.url,'/api/workspace');const payload=JSON.parse(first.options.body);assert.equal(payload.revision,7);assert.equal(payload.import,true);assert.equal(first.options.headers['X-Orbit-CSRF'],'fictional-csrf');
  rejected(first);await assert.rejects(early,/Changed elsewhere/);assert.equal(f.api.draft(),JSON.stringify(workspace));
  const retry=f.api.save(workspace);await flush();accepted(f.requests[2],workspace);assert.equal(JSON.stringify(await retry),JSON.stringify(workspace));assert.equal(f.api.draft(),null,'Accepted retry clears stale recovery draft');
  // Later rejection must survive an earlier request succeeding out of order.
  for(const newer of [{study:{title:'New draft'}},workspace]){
    f.storage.set('orbit.unsaved-draft',JSON.stringify(workspace));
    const a=f.api.save(workspace),b=f.api.save(newer);await flush();const [ra,rb]=f.requests.slice(-2);
    rejected(rb);await assert.rejects(b,/Changed elsewhere/);accepted(ra,workspace);await a;
    assert.equal(f.api.draft(),JSON.stringify(newer),'Concurrent failed draft survives successful request, even with identical bytes');
  }
  // Storage changed outside this adapter must also retain its newer recovery value.
  const pending=f.api.save(workspace);await flush();f.storage.set('orbit.unsaved-draft','external recovery');accepted(f.requests.at(-1),workspace);await pending;assert.equal(f.api.draft(),'external recovery');
  console.log('PASS: paired desktop readiness, request contract, rejection recovery, retry cleanup, origin isolation and concurrent draft preservation');
})().catch(error=>{console.error(error);process.exitCode=1;});
