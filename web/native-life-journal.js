/* Async protected journal controller. No WebKit storage, account tokens or automatic writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OrbiterNativeLifeJournal=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const fail=(code,message)=>Object.assign(new Error(message),{code});
  function create({bridge,model,owner=()=> 'device'}) {
    let epoch=0, phase='closed', enabled=false, busy=false, revision=null, data=null, error='';
    const clone=value=>value===null?null:model.normalize(value);
    const snapshot=()=>clone(data);
    const status=()=>({phase,enabled,busy,revision,error});
    function invalidate(){epoch++;phase='closed';enabled=false;busy=false;revision=null;data=null;error='';}
    function guard(token,who){if(token!==epoch||who!==owner()) { if(token===epoch)invalidate();throw fail('cancelled','Journal ownership changed. Your draft was not saved.');}}
    function decode(value) {
      if(value?.status!=='ok'||value.owner!=='device'||!Number.isSafeInteger(value.revision)||value.revision<0)
        throw fail('invalid','Unsupported protected journal response.');
      let next;
      try{next=value.json===undefined?model.create():model.importJSON(value.json);}
      catch(_){throw fail('corrupt','The protected journal could not be read. Its original data was kept.');}
      return {revision:value.revision,data:clone(next)};
    }
    async function run(task,{mutation=false}={}) {
      if(busy)throw fail('busy','Wait for the current journal operation.');
      const token=epoch,who=owner();busy=true;error='';
      try{return await task(()=>guard(token,who));}
      catch(e){guard(token,who);error=e.message||'Protected journal unavailable.';
        if(mutation&&['timeout','error','invalid','unavailable'].includes(e.code))phase='uncertain';
        else if(e.code==='conflict')phase='uncertain';
        else phase=enabled?'error':'disabled';
        throw e;
      }finally{if(token===epoch){busy=false;}}
    }
    async function load(check) {
      const value=await bridge.read({owner:'device'});check();
      const next=decode(value);revision=next.revision;data=next.data;enabled=true;phase='ready';return snapshot();
    }
    async function open(){return run(async check=>{
      if(!bridge)throw fail('unavailable','The protected iPhone journal is unavailable.');
      const c=await bridge.capabilities();check();
      if(!c.read||!c.write){phase='disabled';enabled=false;error=c.reason||'Protected journal unavailable.';return null;}
      if(c.consented!==true){phase='disabled';enabled=false;return null;}
      return load(check);
    });}
    async function enable(){return run(async check=>{
      if(!bridge)throw fail('unavailable','The protected iPhone journal is unavailable.');
      const c=await bridge.capabilities();check();
      if(!c.read||!c.write)throw fail('unavailable',c.reason||'Protected journal unavailable.');
      const result=await bridge.requestAccess({consent:true});check();
      if(result?.status!=='consented'||result.owner!=='device')throw fail('optInRequired','Native journal consent was not completed.');
      return load(check);
    });}
    async function save(next){
      if(!enabled||phase!=='ready')throw fail('reconcileRequired','Read and reconcile the protected journal before saving. Your draft was kept.');
      const candidate=clone(next),expected=revision;
      return run(async check=>{
        const result=await bridge.write({owner:'device',expectedRevision:expected,data:candidate});check();
        const saved=decode(result);
        if(saved.revision!==expected+1||model.exportJSON(saved.data)!==model.exportJSON(candidate))
          throw fail('invalid','The saved journal could not be confirmed. Reconcile before trying again.');
        revision=saved.revision;data=saved.data;phase='ready';return snapshot();
      },{mutation:true});
    }
    async function clear(){
      if(!enabled||phase!=='ready')throw fail('reconcileRequired','Read and reconcile the protected journal before deleting.');
      const expected=revision;
      return run(async check=>{
        const result=await bridge.clear({owner:'device',expectedRevision:expected});check();
        const cleared=decode(result);
        if(cleared.revision!==expected+1||result.json!==undefined)throw fail('invalid','Deletion could not be confirmed. Reconcile before trying again.');
        revision=cleared.revision;data=cleared.data;phase='ready';return snapshot();
      },{mutation:true});
    }
    async function revoke(){
      // Immediately invalidate local work; native revoke is ordered behind accepted disk operations.
      invalidate();
      return run(async check=>{await bridge.revoke();check();phase='disabled';return null;});
    }
    async function reconcile(){return open();} // Explicit read; never replays a failed mutation.
    return Object.freeze({open,enable,save,clear,revoke,reconcile,status,snapshot,invalidate});
  }
  return Object.freeze({create});
});
