/* Separate opt-in journal sync. No study codec, reward authority or credential storage. */
(function(root){
 'use strict';
 function create(options){
  const {model:M,owner,readLocal,replaceLocal,storage,request}=options;
  let busy=false,epoch=0,conflict=null,message='Not connected';
  const key=()=>`orbiter.life.sync.v1:${owner()}`;
  function meta(){try{return JSON.parse(storage.getItem(key())||'null');}catch{return null;}}
  function save(value){storage.setItem(key(),JSON.stringify(value));}
  function status(){const m=meta();return{busy,connected:!!m?.connected,revision:m?.revision??0,lastSync:m?.lastSync||null,conflict:!!conflict,message};}
  function emit(text){if(text)message=text;options.changed?.(status());}
  function validate(row){if(!row||!Number.isSafeInteger(row.revision)||row.revision<0||typeof row.enabled!=='boolean'||typeof row.deleted!=='boolean')throw Error('The server returned an invalid journal response.');return{...row,journal:row.journal==null?null:M.normalize(row.journal)};}
  async function run(fn){if(busy)throw Error('A journal connection is already in progress.');if(owner()==='guest')throw Error('Sign in to Orbiter before connecting your journal.');busy=true;const who=owner(),token=epoch;emit();
   const guard=()=>{if(owner()!==who||epoch!==token)throw Error('The account or journal changed. Your local journal is unchanged.');};
   const rpc=async(op,args={})=>{guard();const row=validate(await request(op,args,who));guard();return row;};
   try{return await fn({who,guard,rpc});}catch(e){emit(e.message||String(e));throw e;}finally{busy=false;emit();}
  }
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function remember(row,connected=true){save({connected,revision:row.revision,base:row.journal,lastSync:new Date().toISOString()});}
  function clash(row,local){conflict={row,local};emit('Both devices have journal changes. Choose which version to keep; nothing was replaced.');return status();}
  async function synchronize(ctx,first=false){const {guard,rpc}=ctx,local=M.normalize(readLocal()),m=meta(),row=await rpc('pull');guard();if(!same(local,M.normalize(readLocal())))throw Error('Your journal changed while checking. Sync again after saving.');
   if(!row.enabled){if(!first){save({...m,connected:false});emit('Account sharing is off. Your local journal is kept.');return status();}const enabled=await rpc('consent',{p_id:crypto.randomUUID(),p_expected:row.revision,p_enabled:true});if(enabled.conflict)return clash(enabled,local);return reconcile(enabled,local,null,ctx,true);}
   return reconcile(row,local,m?.base,ctx,first);
  }
  async function reconcile(row,local,base,ctx,first){const {guard,rpc}=ctx;guard();if(!same(local,M.normalize(readLocal())))throw Error('Your local journal changed. Sync again after saving.');
   if(row.journal===null&&row.deleted&&!first){remember(row,false);emit('The account journal was deleted. This device’s copy is kept and disconnected.');return status();}
   if(same(local,row.journal)){remember(row);conflict=null;emit('Journal is up to date.');return status();}
   if(row.journal!==null&&(first||base===undefined||base===null||(!same(local,base)&&!same(row.journal,base))))return clash(row,local);
   if(row.journal!==null&&!same(row.journal,base)){guard();await replaceLocal(row.journal,local);guard();remember(row);conflict=null;emit('Account journal saved on this device.');return status();}
   const result=await rpc('write',{p_id:crypto.randomUUID(),p_expected:row.revision,p_value:local});if(result.conflict)return clash(result,local);guard();if(!same(local,M.normalize(readLocal())))throw Error('Newer local edits were kept. Sync again to share them.');remember(result);conflict=null;emit('Journal synced to your account.');return status();
  }
  return{status,invalidate(){epoch++;conflict=null;message='Not connected';options.changed?.(status());},
   connect:()=>run(async ctx=>{const result=await synchronize(ctx,true);return result;}),
   sync:()=>run(ctx=>{if(!meta()?.connected)throw Error('Connect this device’s journal first.');return synchronize(ctx);}),
   resolve:choice=>run(async({guard,rpc})=>{if(!conflict||!['local','remote'].includes(choice))throw Error('Choose a journal version first.');const {row,local}=conflict;if(!same(local,M.normalize(readLocal())))throw Error('Your local journal changed. Sync again before choosing.');const current=await rpc('pull');if(!same(local,M.normalize(readLocal())))throw Error('Your local journal changed while reviewing. Sync again before choosing.');if(current.revision!==row.revision)return clash(current,local);if(!current.enabled)throw Error('Account sharing was disabled. Connect again before resolving.');if(choice==='remote'){guard();await replaceLocal(current.journal||M.create(),local);guard();remember(current);conflict=null;emit('Account version saved on this device.');}else{const result=await rpc('write',{p_id:crypto.randomUUID(),p_expected:current.revision,p_value:local});if(result.conflict)return clash(result,local);remember(result);conflict=null;emit('This device’s version saved to your account.');}return status();}),
   disconnect:()=>run(async({rpc})=>{const row=await rpc('pull'),result=await rpc('consent',{p_id:crypto.randomUUID(),p_expected:row.revision,p_enabled:false});if(result.conflict)throw Error('Account journal changed. Try disconnecting again.');remember(result,false);conflict=null;emit('Sharing disabled for this account. Local and account copies are kept.');}),
   deleteRemote:()=>run(async({rpc})=>{const row=await rpc('pull'),result=await rpc('delete',{p_id:crypto.randomUUID(),p_expected:row.revision});if(result.conflict)throw Error('Account journal changed. Review it before deleting.');remember(result,false);conflict=null;emit('Account journal deleted. This device’s copy is kept.');})
  };
 }
 root.OrbiterLifeSync={create};if(typeof module==='object')module.exports={create};
})(typeof window!=='undefined'?window:globalThis);
