/* Controlled async persistence; no real journal, disk, consent UI or Apple SDK. */
const assert=require('node:assert/strict');
const {create}=require('../web/native-life-journal.js');
const model={create:()=>({schemaVersion:1,entries:[]}),normalize:v=>{
  if(v?.schemaVersion!==1||!Array.isArray(v.entries))throw Error('invalid journal');
  return JSON.parse(JSON.stringify(v));
},importJSON:v=>model.normalize(JSON.parse(v)),exportJSON:v=>JSON.stringify(model.normalize(v))};
const failure=code=>Object.assign(Error(code),{code});
function fixture(){
 let current=model.create(),revision=0,consented=false,available=true,owner='guest';
 const calls=[];
 const bridge={
  capabilities:async()=>({read:available,write:available,available,consented}),
  requestAccess:async()=>{calls.push('consent');consented=true;return{status:'consented',owner:'device'};},
  read:async()=>{calls.push('read');if(!consented)throw failure('optInRequired');return{status:'ok',owner:'device',revision,json:JSON.stringify(current)};},
  write:async value=>{calls.push('write');assert.equal(value.expectedRevision,revision);current=model.normalize(value.data);revision++;return{status:'ok',owner:'device',revision,json:JSON.stringify(current)};},
  clear:async()=>{calls.push('clear');revision++;current=model.create();return{status:'ok',owner:'device',revision};},
  revoke:async()=>{calls.push('revoke');consented=false;return{status:'revoked',owner:'device'};}
 };
 return {bridge,calls,controller:create({bridge,model,owner:()=>owner}),setOwner:v=>owner=v,setAvailable:v=>available=v};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject};};
(async()=>{
 const f=fixture(),c=f.controller;
 assert.equal(await c.open(),null);assert.deepEqual(f.calls,[],'Opening cannot prompt or read without consent');
 assert.equal(c.status().enabled,false);
 const enabled=await c.enable();assert.deepEqual(enabled,model.create());assert.deepEqual(f.calls,['consent','read']);
 const draft={schemaVersion:1,entries:['fictional']};
 const wait=deferred(),realWrite=f.bridge.write;f.bridge.write=()=>wait.promise;
 const saving=c.save(draft);assert.equal(c.status().busy,true);assert.deepEqual(c.snapshot(),model.create(),'No optimistic commit');
 await assert.rejects(c.save(draft),e=>e.code==='busy');
 wait.resolve(await realWrite({expectedRevision:0,data:draft}));await saving;
 assert.equal(c.status().revision,1);assert.deepEqual(c.snapshot(),draft);
 const copy=c.snapshot();copy.entries.push('mutate');assert.deepEqual(c.snapshot(),draft,'Snapshot isolated');
 f.bridge.write=async()=>{await realWrite({expectedRevision:1,data:{schemaVersion:1,entries:['unknown outcome']}});throw failure('timeout');};
 await assert.rejects(c.save(draft),e=>e.code==='timeout');assert.equal(c.status().phase,'uncertain');
 assert.deepEqual(c.snapshot(),draft,'Timeout preserves last confirmed state');
 const calls=f.calls.length;await assert.rejects(c.save(draft),e=>e.code==='reconcileRequired');assert.equal(f.calls.length,calls,'No automatic retry');
 assert.deepEqual((await c.reconcile()).entries,['unknown outcome']);assert.equal(c.status().revision,2);
 await c.clear();assert.equal(c.status().revision,3);assert.deepEqual(c.snapshot(),model.create());
 const race=deferred();f.bridge.read=()=>race.promise;
 const reading=c.reconcile();await Promise.resolve();f.setOwner('another');
 race.resolve({status:'ok',owner:'device',revision:3,json:JSON.stringify(draft)});
 await assert.rejects(reading,e=>e.code==='cancelled');assert.equal(c.snapshot(),null);assert.equal(c.status().enabled,false);
 const g=fixture();g.setAvailable(false);assert.equal(await g.controller.open(),null);
 await assert.rejects(g.controller.enable(),e=>e.code==='unavailable');assert.deepEqual(g.calls,[]);
 const h=fixture();await h.controller.enable();const pending=deferred();h.bridge.write=()=>pending.promise;
 const stale=h.controller.save(draft);const rejected=assert.rejects(stale,e=>e.code==='cancelled');
 await h.controller.revoke();pending.resolve({status:'ok',owner:'device',revision:1,json:JSON.stringify(draft)});await rejected;
 assert.equal(h.controller.snapshot(),null);assert.equal(h.controller.status().enabled,false);
 const bad=fixture();await bad.controller.enable();bad.bridge.read=async()=>({status:'ok',owner:'device',revision:0,json:'bad'});
 await assert.rejects(bad.controller.reconcile(),e=>e.code==='corrupt');assert.deepEqual(bad.controller.snapshot(),model.create());
 const conflict=fixture();await conflict.controller.enable();conflict.bridge.write=async()=>{throw failure('conflict');};
 await assert.rejects(conflict.controller.save(draft),e=>e.code==='conflict');assert.equal(conflict.controller.status().phase,'uncertain');
 console.log('PASS: async consent, acknowledged saves, snapshot isolation, timeout reconciliation, deletion, owner/revoke races, corruption and conflicts. Controlled JS only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
