/* Native-only update controls. Release notes are always plain text. */
(() => {
  if (!window.__TAURI__) return;
  const {invoke}=window.__TAURI__.core;
  const dialog=document.createElement('dialog');
  dialog.id='orbiter-update-dialog';
  dialog.setAttribute('aria-labelledby','orbiter-update-title');
  dialog.innerHTML=`<header class="jump-heading"><div><p class="eyebrow">ORBITER / UPDATES</p><h2 id="orbiter-update-title">A little further in orbit.</h2></div><button type="button" data-close aria-label="Close updates">×</button></header><div class="update-body"><p data-status role="status" aria-live="polite"></p><pre class="update-notes" data-notes hidden></pre><label class="update-preference"><input type="checkbox" data-startup><span><strong>Check at startup</strong><small>Let Orbiter look for a new version when it opens.</small></span></label><div class="update-actions"><button type="button" data-save>Save open edits</button><button type="button" data-check>Check for updates</button><button type="button" data-install hidden>Download and restart</button></div><p class="update-help">Installing pauses your focus timer. Save and close any editors first. Your workspace and discoveries stay on this PC.</p></div>`;
  document.body.append(dialog);
  const $=s=>dialog.querySelector(s);
  let checking=false,installing=false,available=null;
  const status=text=>$('[data-status]').textContent=text;
  const preference='orbiter.check-updates';
  $('[data-startup]').checked=localStorage.getItem(preference)==='true';
  $('[data-startup]').onchange=e=>localStorage.setItem(preference,String(e.target.checked));
  function controls(){ $('[data-check]').disabled=checking||installing;$('[data-save]').disabled=checking||installing;$('[data-install]').disabled=checking||installing;$('[data-close]').disabled=installing; }
  async function check(silent=false){
    if(checking||installing)return;
    checking=true;controls();if(!silent)status('Checking for updates…');
    try{
      const result=await invoke('check_update');available=result.available?result:null;
      status(available?`Orbiter ${result.version} is ready. Installed: ${result.currentVersion}.`:`Orbiter ${result.currentVersion} is up to date.`);
      $('[data-install]').hidden=!available;
      $('[data-notes]').hidden=!available?.notes;$('[data-notes]').textContent=available?.notes||'';
      document.querySelectorAll('[data-orbiter-updates]').forEach(b=>b.textContent=available?'Update available ↗':'Check for updates');
    }catch(e){available=null;$('[data-install]').hidden=true;status(String(e));}
    finally{checking=false;controls();}
  }
  async function open(){await invoke('switch_mode',{mode:'planner'});dialog.showModal();if(!available)check();}
  $('[data-save]').onclick=async()=>{
    try{status('Saving edits?');const saved=await window.OrbiterUI?.saveDrafts();status(saved?'Edits saved. You can install when ready.':'Review your open editor fields, save them, then return here.');}catch(e){status(String(e));}
  };
  $('[data-check]').onclick=()=>check();$('[data-close]').onclick=()=>dialog.close();
  dialog.addEventListener('cancel',e=>{if(installing)e.preventDefault();});
  $('[data-install]').onclick=async()=>{
    if(installing||!available)return;
    if(window.OrbiterUI?.dirty()){status('Save and close your open editors before installing. Your edits have not been changed.');return;}
    if(!confirm(`Install Orbiter ${available.version} and restart? Your timer will pause before installation.`))return;
    installing=true;controls();status('Downloading and verifying the update…');
    try{await invoke('install_update');status('Installer started. Orbiter will reopen after updating.');}
    catch(e){status(String(e));}
    finally{installing=false;controls();}
  };
  window.__TAURI__.event.listen('orbiter-update-progress',e=>status(e.payload.percent==null?'Downloading update…':`Downloading update… ${e.payload.percent}%`));
  const entry=document.getElementById('open-account');
  if(entry){const b=document.createElement('button');b.type='button';b.dataset.orbiterUpdates='';b.textContent='Check for updates';b.onclick=open;entry.after(b);}
  const buddy=document.querySelector('orbiter-buddy');
  const b=document.createElement('button');b.type='button';b.textContent='Check for updates';b.onclick=open;
  buddy?.shadowRoot?.getElementById('backups')?.after(b);
  window.OrbiterUpdates={open};
  if($('[data-startup]').checked)setTimeout(()=>check(true),8000);
})();
