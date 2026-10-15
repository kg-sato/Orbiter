/* Native identity/status only: refresh credentials never enter this UI. */
(() => {
 const bridge=window.SchedulerAccountBridge,cloud=window.OrbiterCloud,entry=document.getElementById('open-account');
 if(!entry||!bridge?.enabled||!cloud)return;
 if(location.origin==='http://127.0.0.1:18743'&&!window.__TAURI__){entry.textContent='Account managed in Orbiter for Windows';entry.disabled=true;return;}
 const dialog=document.createElement('dialog');dialog.id='account-dialog';dialog.setAttribute('aria-labelledby','account-title');
 dialog.innerHTML=`<header class="jump-heading"><div><p class="eyebrow">YOUR SPACE / CONNECTED</p><h2 id="account-title">Across your little universe.</h2></div><button id="account-close" aria-label="Close account">×</button></header>
 <div class="account-body"><p>Sign in securely with a link from your email.</p>
 <form id="account-auth"><label for="account-email">Email address</label><input id="account-email" type="email" autocomplete="email" required maxlength="254"><button id="account-send" type="submit">Email me a sign-in link</button></form>
 <p id="account-link-help" hidden></p><button id="account-show-code" type="button" hidden>My email contains a numeric code instead</button>
 <form id="account-verify" hidden><label for="account-code">Code from your email</label><input id="account-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" minlength="6" maxlength="8" required><button type="submit">Connect my space</button></form>
 <section id="account-workspace" hidden><p id="account-identity"></p><p id="account-progress"></p>
 <section id="account-migration" hidden><h3>Connect this device</h3><p id="account-preview"></p><p>Your current workspace is backed up before connecting. Matching records with different content are kept for review.</p><div class="account-actions"><button id="account-merge">Merge this device into my account</button><button id="account-remote">Use my account workspace</button></div></section>
 <div id="account-conflicts"></div><div class="account-actions"><button id="account-sync">Sync now</button><button id="account-logout">Sign out</button></div></section>
 <p id="account-status" role="status" aria-live="polite"></p><button id="account-backup">Download local backup</button></div>`;
 (document.getElementById('native-planner')||document.body).append(dialog);
 const $=id=>dialog.querySelector('#'+id);let busy=false,identity=null,cooldown=0,codeEmail='',parentDialog=null;
 const status=message=>$('account-status').textContent=message;
 async function paint(){const s=await cloud.status();identity=s.account;
  $('account-auth').hidden=!!identity;if(identity)$('account-verify').hidden=true;$('account-workspace').hidden=!identity;$('account-link-help').hidden=!!identity||!codeEmail;$('account-show-code').hidden=!!identity||!codeEmail;
  $('account-identity').textContent=identity?'Signed in as '+identity.email:'';
  $('account-progress').textContent=s.pending?`${s.pending} changes saved here, waiting to sync.`:'Local edits save automatically when connected.';
  $('account-migration').hidden=!identity||!!s.enrolled;$('account-conflicts').replaceChildren();
  for(const [key,c] of Object.entries(s.conflicts||{})){
   const row=document.createElement('section');row.className='account-conflict';const h=document.createElement('h3');h.textContent='Review '+JSON.parse(key)[0];row.append(h);
   for(const [label,choice,value] of [['Keep this device','local',c.local],['Keep account version','remote',c.remote]]){const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre'),b=document.createElement('button');summary.textContent=label;pre.textContent=JSON.stringify(value,null,2);b.textContent='Choose '+label.toLowerCase();b.onclick=()=>run(()=>cloud.resolve(key,choice));details.append(summary,pre,b);row.append(details);} $('account-conflicts').append(row);
  }
 }
 async function run(fn){if(busy)return;busy=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){status(String(e.message||e));}finally{busy=false;dialog.querySelectorAll('button').forEach(b=>b.disabled=false);$('account-send').disabled=Date.now()<cooldown;await paint().catch(e=>status(String(e)));}}
 const preview=async()=>{const p=await cloud.preview();$('account-preview').textContent=`This device: ${p.localCount} records · Account: ${p.remoteCount} records`;};
 entry.onclick=()=>run(async()=>{const parent=entry.closest('dialog');parentDialog=parent?.open?parent:null;if(parentDialog)parentDialog.close();dialog.showModal();await paint();if(identity)await preview();});$('account-close').onclick=()=>dialog.close();
 window.OrbiterAccount={open:()=>entry.click()};
 dialog.addEventListener('close',()=>{if(parentDialog?.isConnected&&!parentDialog.open)parentDialog.showModal();parentDialog=null;});
 $('account-auth').onsubmit=e=>{e.preventDefault();run(async()=>{if(Date.now()<cooldown)throw Error('Wait a minute before requesting another link.');const email=$('account-email').value.trim();await cloud.sendCode(email);codeEmail=email;cooldown=Date.now()+60000;status('Sign-in link sent.');$('account-link-help').textContent=window.__TAURI__?'Open the newest email link on this PC and keep Orbiter running. It will bring you back to Orbiter.':'Open the newest email link in this same browser. You will choose how to connect your workspace after signing in.';$('account-verify').hidden=true;setTimeout(()=>{$('account-send').disabled=false;},60000);});};
 $('account-show-code').onclick=()=>{$('account-verify').hidden=false;$('account-code').focus();};
 $('account-verify').onsubmit=e=>{e.preventDefault();run(async()=>{await cloud.verify(codeEmail,$('account-code').value.trim());$('account-code').value='';await preview();status('Signed in. Choose how to connect this device.');});};
 for(const [id,choice] of [['account-merge','merge'],['account-remote','remote']])$(id).onclick=()=>run(async()=>{if(window.OrbiterUI?.dirty())throw Error('Save or close your other editor before connecting.');await cloud.enroll(choice);status('Connected. Future edits sync automatically.');});
 $('account-sync').onclick=()=>run(()=>cloud.sync());$('account-logout').onclick=()=>run(async()=>{if(window.OrbiterUI?.dirty())throw Error('Save or close your editor before signing out.');await cloud.signOut();codeEmail='';status('Signed out. Your account queue remains separate from local mode.');});
 $('account-backup').onclick=()=>{const url=URL.createObjectURL(new Blob([bridge.snapshot()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='Orbiter-before-sync.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 window.addEventListener('orbiter-cloud-status',e=>{if(e.detail.message)status(e.detail.message);if(dialog.open&&!busy)paint().catch(()=>{});});
 if(window.__TAURI__)window.__TAURI__.event.listen('orbiter-open-account',()=>window.OrbiterAccount.open());
 cloud.ready().then(async result=>{await paint();if(result?.fromLink){window.OrbiterAccount.open();status(identity?'Signed in. Choose how to connect this device.':'Request a new sign-in link in this browser.');}}).catch(e=>{status('Account connection unavailable: '+String(e.message||e));if(e.fromLink)window.OrbiterAccount.open();});
})();
