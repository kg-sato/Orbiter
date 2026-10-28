import {createClient} from '@supabase/supabase-js';
import config from '../../web/cloud-config.json';
import catalog from '../../web/cloud-catalog.json';
import {encode,decode,merge,equal,clone} from './codec.js';

const native=!!window.__TAURI__, invoke=(action,args={})=>window.__TAURI__.core.invoke('cloud_command',{action,args});
let connected=false;
let client=null,account=null,cache=null,channel=null,busy=false,again=false,loading=false,db=null,serial=Promise.resolve(),retry=null;
const syncWaiters=[];
const emit=message=>window.dispatchEvent(new CustomEvent('orbiter-cloud-status',{detail:{account,pending:Object.keys(cache?.pending||{}).length,conflicts:cache?.conflicts||{},message}}));
const lock=fn=>{const next=serial.then(fn);serial=next.catch(()=>{});return next;};
async function database(){if(db)return db;db=await new Promise((resolve,reject)=>{const r=indexedDB.open('orbiter-cloud-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('accounts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return db;}
async function read(key){const d=await database();return new Promise((resolve,reject)=>{const r=d.transaction('accounts').objectStore('accounts').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function write(key,value){const d=await database();return new Promise((resolve,reject)=>{const tx=d.transaction('accounts','readwrite');tx.objectStore('accounts').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Account storage is unavailable'));});}
// Guest backup, account cache and ownership must commit together. A failed put
// must abort earlier requests too, including synchronous quota/clone failures.
async function connectWorkspace(owner,guest,next){const d=await database();return new Promise((resolve,reject)=>{
  const tx=d.transaction('accounts','readwrite');
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Account storage is unavailable'));tx.onabort=()=>reject(tx.error||Error('Account storage is unavailable'));
  try{const store=tx.objectStore('accounts');store.put(guest,'guest');store.put(next,owner);store.put(owner,'active-owner');}
  catch(e){tx.abort();reject(e);}
});}
function bridge(){return window.SchedulerAccountBridge;}
async function rpc(name,args){const {data:auth}=await client.auth.getSession();if(!auth.session||auth.session.user.id!==account?.id)throw Error('Account changed or expired. Reload or sign in to the same account; this queue stays with its original owner.');const {data,error}=await client.rpc(name,args);if(error)throw Error(error.message);return data;}
function queue(next){
  for(const key of new Set([...Object.keys(cache.base),...Object.keys(next)])){
    const desired=next[key]??null,base=cache.base[key]?.value??null;
    if(equal(desired,base)){delete cache.pending[key];delete cache.conflicts[key];continue;}
    const old=cache.pending[key];if(!old||!equal(old.value,desired))cache.pending[key]={id:crypto.randomUUID(),value:clone(desired),expected:cache.base[key]?.version||0};
  }
}
async function apply(){
  if(!account||(!cache?.enrolled||!connected))return;
  const records=Object.fromEntries(Object.entries(cache.base).map(([k,v])=>[k,v.value]));
  for(const [k,v] of Object.entries(cache.pending))records[k]=v.value;
  const expected=bridge().snapshot(),workspace=decode(records,JSON.parse(expected));
  cache.workspace=workspace;await write(account.id,cache);
  if(equal(JSON.parse(expected),workspace))return;
  loading=true;try{await bridge().load(JSON.stringify(workspace),expected);}finally{loading=false;}
}
async function sync(){
  if(native)return invoke('sync');if(!account||(!cache?.enrolled||!connected))return;
  if(busy){again=true;return new Promise(resolve=>syncWaiters.push(resolve));}busy=true;clearTimeout(retry);
  try{do{again=false;await lock(async()=>{
    const remote=await rpc('orbiter_pull');
    for(const [key,row] of Object.entries(remote)){
      const pending=cache.pending[key];
      if(pending&&row.version!==pending.expected){
        const combined=merge(cache.base[key]?.value??null,pending.value,row.value);
        if(combined.conflict){cache.conflicts[key]={local:pending.value,remote:row.value,version:row.version};continue;}
        pending.value=combined.value;pending.expected=row.version;pending.id=crypto.randomUUID();
        if(equal(pending.value,row.value))delete cache.pending[key];
      }
      cache.base[key]=row;
    }
    await write(account.id,cache);
    for(const [key,op] of Object.entries(cache.pending)){
      if(cache.conflicts[key])continue;
      const row=await rpc('orbiter_write',{p_id:op.id,p_key:key,p_expected:op.expected,p_value:op.value});
      if(row.conflict){again=true;continue;}
      cache.base[key]=row;delete cache.pending[key];await write(account.id,cache);
    }
    await apply();await refreshRewards();emit('Your space is up to date.');
  });}while(again);
  }catch(e){emit(e.message);if(account&&navigator.onLine)retry=setTimeout(()=>sync(),15000);}
  finally{busy=false;for(const resolve of syncWaiters.splice(0))resolve();}
}
async function adopt(user){
  if(!user)return;
  const active=await read('active-owner');
  if(active&&active!==user.id){const guest=await read('guest');if(guest){loading=true;try{await bridge().load(JSON.stringify(guest),bridge().snapshot());}finally{loading=false;}}}
  account={id:user.id,email:user.email};cache=await read(user.id)||{base:{},pending:{},conflicts:{},enrolled:false};
  channel=client.channel('orbiter:'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'orbiter_records',filter:'user_id=eq.'+user.id},()=>sync()).on('postgres_changes',{event:'*',schema:'public',table:'orbiter_progress',filter:'user_id=eq.'+user.id},()=>refreshRewards()).subscribe();
  connected=active===user.id&&!!cache.enrolled;
  if(connected){await lock(apply).catch(e=>emit(e.message));await sync();}else emit('Choose how to connect this device.');
}
async function ready(){
  if(native){const s=await invoke('status');account=s?.account||null;window.__TAURI__.event.listen('orbiter-cloud-status',e=>{account=e.payload.account;emit(e.payload.message);});return s;}
  if(!window.isSecureContext)throw Error('Use the HTTPS beta website or localhost for account sign-in.');
  const callback=new URL(location.href);const fromLink=callback.searchParams.has('code')||callback.searchParams.has('error')||callback.hash.includes('access_token=')||callback.hash.includes('error_description=');
  client=createClient(config.url,config.publishableKey,{auth:{storageKey:'orbiter-auth-v1',detectSessionInUrl:true,flowType:'pkce'},global:{headers:{'X-Client-Info':'orbiter-web/0.4'}}});
  const {data,error}=await client.auth.getSession();
  if(fromLink){const clean=new URL(location.href);for(const key of ['code','error','error_code','error_description'])clean.searchParams.delete(key);clean.hash='';history.replaceState(null,'',clean.pathname+clean.search);}
  if(error||(fromLink&&!data.session))throw Object.assign(Error('That sign-in link could not be completed. Request a new one and open it in the browser that requested it.'),{fromLink});
  if(data.session)await adopt(data.session.user);
  else if(await read('active-owner')){const guest=await read('guest');if(guest){loading=true;try{await bridge().load(JSON.stringify(guest),bridge().snapshot());}finally{loading=false;}}await write('active-owner',null);}
  client.auth.onAuthStateChange((event,session)=>{if(event==='TOKEN_REFRESHED')setTimeout(()=>sync(),0);if(event==='SIGNED_IN'&&account&&session?.user.id!==account.id)emit('Account changed in another tab. Reload before connecting; your edits remain with their original account.');if(event==='SIGNED_OUT'&&account)emit('Session ended. Sign in to reconnect your saved queue.');});
  return {account,fromLink};
}
async function refreshRewards(){if(native||!account||(!cache?.enrolled||!connected))return;const rewards=await rpc('orbiter_rewards');cache.rewards=rewards;await write(account.id,cache);const snapshot={rewards,settings:rewards.equipment||{},catalog};window.OrbiterNativeState=snapshot;window.dispatchEvent(new CustomEvent('orbiter-native-state',{detail:snapshot}));}
const api={
  ready:()=>ready(),status:()=>native?invoke('status'):Promise.resolve({account,enrolled:connected,pending:Object.keys(cache?.pending||{}).length,conflicts:cache?.conflicts||{}}),
  sendCode:async email=>{if(native)return invoke('send-code',{email});if(!client)throw Error('Open the HTTPS beta website or localhost to sign in.');if(account)throw Error('Sign out before requesting another sign-in link.');const redirect=new URL('./Application.html',location.href);const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:redirect.href}});if(error)throw Error(error.message);},
  verify:async(email,token)=>{if(native){const s=await invoke('verify',{email,token});account=s.account;return s;}if(account)throw Error('Sign out before changing accounts.');const {data,error}=await client.auth.verifyOtp({email,token,type:'email'});if(error)throw Error(error.message);await adopt(data.user);return api.status();},
  preview:async()=>{if(native)return invoke('preview');const records=await rpc('orbiter_pull');return {localCount:Object.keys(encode(JSON.parse(bridge().snapshot()))).length,remoteCount:Object.values(records).filter(r=>r.value!==null).length};},
  enroll:async choice=>{if(native)return invoke('enroll',{choice});await lock(async()=>{
    if(!account)throw Error('Sign in before connecting this workspace.');
    if(choice!=='merge'&&choice!=='remote')throw Error('Choose how to connect this workspace.');
    if(connected&&cache.enrolled)return;
    const guest=JSON.parse(bridge().snapshot()),next=clone(cache);
    if(!next.enrolled){const remote=await rpc('orbiter_pull');next.base=remote;next.pending={};next.conflicts={};next.enrolled=true;
    if(choice==='merge'){
      const local=encode(guest);for(const [key,value] of Object.entries(local)){
        if(remote[key]?.value!==undefined&&remote[key]?.value!==null&&!equal(remote[key].value,value)){next.pending[key]={id:crypto.randomUUID(),value,expected:remote[key].version};next.conflicts[key]={local:value,remote:remote[key].value,version:remote[key].version};}
        else if(remote[key]?.value===undefined)next.pending[key]={id:crypto.randomUUID(),value,expected:0};
      }
    }}
    await connectWorkspace(account.id,guest,next);cache=next;connected=true;await apply();
  });await sync();return api.status();},
  save:async workspace=>{if(native||loading||!account||(!cache?.enrolled||!connected))return;await lock(async()=>{queue(encode(workspace));cache.workspace=clone(workspace);await write(account.id,cache);});emit('Saved on this device; syncing.');queueMicrotask(sync);},
  resolve:async(key,choice)=>{if(native)return invoke('resolve',{key,choice});await lock(async()=>{const c=cache.conflicts[key];if(!c)throw Error('Conflict already resolved');cache.base[key]={value:c.remote,version:c.version};if(choice==='remote')delete cache.pending[key];else cache.pending[key]={id:crypto.randomUUID(),value:c.local,expected:c.version};delete cache.conflicts[key];await write(account.id,cache);});await sync();},
  signOut:async()=>{if(native){const s=await invoke('logout');account=null;return s;}if(window.OrbiterUI?.dirty())throw Error('Save or close your editor before signing out.');const timer=JSON.parse(bridge().snapshot()).study?.timer;if(timer?.endAt||(timer?.remaining>0&&timer.remaining<timer.duration*60))throw Error('Finish focus before signing out.');const {data:auth}=await client.auth.getSession();if(auth.session&&auth.session.user.id!==account?.id)throw Error('The account changed in another tab. Reload; your previous account queue stays separate.');await lock(async()=>{
    const guest=await read('guest');loading=true;try{if(guest)await bridge().load(JSON.stringify(guest),bridge().snapshot());}finally{loading=false;}
    clearTimeout(retry);if(channel)await client.removeChannel(channel);const {error}=await client.auth.signOut({scope:'local'});if(error)localStorage.removeItem('orbiter-auth-v1');await write('active-owner',null);account=null;cache=null;connected=false;window.OrbiterNativeState=null;window.dispatchEvent(new CustomEvent('orbiter-native-state',{detail:null}));
  });emit('Signed out. Your original local workspace is restored.');},
  rewardAction:async(action,args={})=>{if(!account||(!cache?.enrolled||!connected))throw Error("Sign in and connect this workspace first.");let result;if(action==='chest'){cache.crateOperation||=crypto.randomUUID();await write(account.id,cache);result=await rpc('orbiter_open_crate',{p_id:cache.crateOperation});delete cache.crateOperation;await write(account.id,cache);}else if(action==='settings'){const slot=Object.keys(args)[0];await rpc('orbiter_equip',{p_slot:slot,p_item:args[slot]});}else throw Error("Unsupported reward action");await refreshRewards();return {...window.OrbiterNativeState,reward:result?.reward};},
  sync
};
window.OrbiterCloud=api;
window.addEventListener('online',()=>sync());
window.addEventListener('focus',()=>sync());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
