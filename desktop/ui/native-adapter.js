/* Native planner adapter: bundled assets only. It preserves the browser adapter contract. */
(() => {
 window.OrbiterNativeErrors=[];
 window.addEventListener('error',e=>window.OrbiterNativeErrors.push(String(e.message).slice(0,250)));
 document.addEventListener('securitypolicyviolation',e=>window.OrbiterNativeErrors.push('CSP '+e.violatedDirective+' '+e.blockedURI));
 const invoke=window.__TAURI__.core.invoke, listen=window.__TAURI__.event.listen;
 let current=null,latest=null,subscriber=null,pending=false,again=false;
 const publish=v=>{if(!latest||v.revision>=latest.revision){latest=v;window.OrbiterNativeState=v;window.dispatchEvent(new CustomEvent('orbiter-native-state',{detail:v}));}};
 const ready=invoke('snapshot').then(v=>{current=v;publish(v);return v;});
 window.OrbitDesktop={
  ready,
  actionResult:async(action,args={})=>{await ready;const v=await invoke('action',{action,args});if(v.editRevision===current.editRevision)current=v;publish(v);return v;},
  save:async(workspace,importing=false)=>{await ready;try{const v=await invoke('save_workspace',{workspace,revision:current.editRevision,import:importing});current=v;publish(v);sessionStorage.removeItem('orbit.unsaved-draft');return v.workspace;}catch(e){sessionStorage.setItem('orbit.unsaved-draft',JSON.stringify(workspace));throw e;}},
  action:async(action,args={})=>{await ready;if(action==='show-buddy'){await invoke('switch_mode',{mode:'buddy'});return latest.workspace;}const v=await invoke('action',{action,args});if(v.editRevision===current.editRevision)current=v;publish(v);return v.workspace;},
  subscribe:callback=>{subscriber=callback;},
  reload:async()=>{current=await invoke('snapshot');publish(current);return current.workspace;},
  draft:()=>sessionStorage.getItem('orbit.unsaved-draft'),
 };
 listen('orbit-changed',async()=>{
  if(pending){again=true;return;}pending=true;
  try{do{again=false;const v=await invoke('snapshot');publish(v);if(v.revision>current.revision && subscriber && await subscriber(v.workspace)!==false)current=v;}while(again);}
  catch(e){window.dispatchEvent(new CustomEvent('orbit-connection-lost'));console.error(e);}
  finally{pending=false;}
 });
})();
