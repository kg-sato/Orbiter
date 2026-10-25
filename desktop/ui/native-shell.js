/* One native window; the island lives in an isolated shadow component. */
(() => {
 const {invoke}=window.__TAURI__.core,{listen}=window.__TAURI__.event;
 const nativeWindow=window.__TAURI__.window.getCurrentWindow(), stage=document.getElementById('native-planner');
 const suspended=[];window.OrbiterSuspendedDialogs=new WeakSet();
 let mode='buddy',presentation='compact',state=null,received=0,closing=false,saving=false,busy=false,sizeTimer=0,slot='appearance',previousLevel=0;
 const R=window.OrbiterRewards;
 const glyphs={play:'<path d="m9 5 10 7-10 7Z"/>',pause:'<path d="M9 5v14M16 5v14"/>',check:'<path d="m5 12 4 4L19 6"/>',planner:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 5v15"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',minus:'<path d="M6 12h12"/>',close:'<path d="m7 7 10 10M17 7 7 17"/>',spark:'<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/>',resize:'<path d="m7 17 10-10M12 17l5-5"/>'};
 const icon=name=>`<svg class="buddy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${glyphs[name]||glyphs.spark}</svg>`;
 let equipmentPreviewing=false,presentationSerial=0;
 function diagnostics(){return {plannerLoaded:!!window.OrbiterUI,mode,presentation,buddyHidden:buddy.hidden,plannerHidden:stage.hidden,hostPosition:getComputedStyle(buddy).position,errors:window.OrbiterNativeErrors||[],cat:window.OrbiterCats?.stats()};}
 function notice(e){buddy.$('error').textContent=e?String(e):'';}
 async function act(action,args={}){try{notice('');let v;if(state?.cloudConnected&&action==='chest')v=await invoke('cloud_command',{action:'chest',args:{}});else if(state?.cloudConnected&&action==='settings'&&['appearance','halo','trail','habitat'].some(k=>args[k])){const slot=['appearance','halo','trail','habitat'].find(k=>args[k]);v=await invoke('cloud_command',{action:'equip',args:{slot,item:args[slot]}});}else v=await invoke('action',{action,args});accept(v);return v;}catch(e){notice(e);throw e;}}
 function activeCode(){if(state?.timer.courseProfile)return Number(state.timer.courseProfile);const task=state?.workspace.study.tasks.find(t=>t.id===state.timer.taskId);return task?.course ? state.workspace.study.catProfiles?.[task.course] ?? window.OrbiterCats.main() : window.OrbiterCats.main();}
 function selectedGrowth(){const code=activeCode(),task=state?.workspace.study.tasks.find(t=>t.id===state.timer.taskId),linked=state?.timer.courseProfile||task?.course;return R.growth(linked?state.rewards.courseMs?.[code]||0:state?.rewards.focusedMs||0);}
 function mountCat(){if(!state)return;if(mode==='buddy'){if(presentation==='options'){window.OrbiterCats.setVisible(false);return;}const code=activeCode(), linked=state.timer.courseProfile||state.timer.taskId&&state.workspace.study.tasks.find(t=>t.id===state.timer.taskId)?.course;window.OrbiterCats.mount(buddy.$('cat'),code,{focus:state.timer.active,paused:!state.timer.active&&state.timer.remainingMs<state.timer.duration*60000,equipment:state.settings,growthMs:linked?state.rewards.courseMs?.[code]||0:state.rewards.focusedMs||0,stars:state.rewards.stars||0});}else window.OrbiterUI?.refreshCat();}
 function accept(v){if(!state||v.revision>=state.revision){const previous=state,newRecap=state&&v.latestRecap&&v.latestRecap.sessionId!==state.latestRecap?.sessionId&&v.settings.recapAck!==v.latestRecap.sessionId;state=v;received=performance.now();document.body.classList.toggle('calm',!!v.settings.calm);document.body.classList.toggle('quiet',!!v.settings.quiet);buddy.update(v);if(previousLevel&&v.rewards.level>previousLevel)window.OrbiterCats.celebrate();previousLevel=v.rewards.level;mountCat();
  if(previous&&!previous.timer.active&&v.timer.active&&mode==='buddy'&&presentation==='compact')buddy.feedback(previous.timer.remainingMs<previous.timer.duration*60000&&previous.timer.remainingMs>0?'resume':'start');
  if(previous?.timer.active&&!v.timer.active&&!newRecap)buddy.cancelFeedback();
  if(newRecap){window.OrbiterCats.celebrate();if(mode==='buddy'&&presentation==='compact'&&!v.timer.active){if(previous?.timer.active){buddy.feedback('victory');const session=v.latestRecap.sessionId;buddy.recapTimer=setTimeout(()=>{if(!document.hidden&&mode==='buddy'&&presentation==='compact'&&!state.timer.active&&state.latestRecap?.sessionId===session)buddy.openRecap();},buddy.dataset.calm==='true'||Number(document.body.dataset.motionIntensity)===0?120:1900);}else buddy.openRecap();}}}}
 function setView(next){
  buddy.cancelFeedback();presentationSerial++;window.OrbiterChests?.cancel('mode-change');
  window.dispatchEvent(new CustomEvent('orbiter-mode-change'));mode=next;document.body.dataset.nativeMode=next;presentation='compact';buddy.setPresentation();
  if(next==='buddy'){
   for(const dialog of document.querySelectorAll('#native-planner dialog[open]')){window.OrbiterSuspendedDialogs.add(dialog);suspended.push(dialog);dialog.close();}
   stage.hidden=true;stage.inert=true;buddy.hidden=false;document.body.classList.add('motion-hidden');
   for(const animation of stage.getAnimations({subtree:true}))animation.pause();
   buddy.$('toggle').focus();
  }else{
   stage.hidden=false;stage.inert=false;buddy.hidden=true;document.body.classList.remove('motion-hidden');
   for(const animation of stage.getAnimations({subtree:true}))if(animation.playState==='paused')animation.play();
   for(const dialog of suspended.splice(0)){window.OrbiterSuspendedDialogs.delete(dialog);if(dialog.isConnected&&!dialog.open)dialog.showModal();}
  }
  mountCat();setTimeout(()=>invoke('ui_ready',{diagnostics:diagnostics()}).catch(()=>{}),400);
 }
 const switchMode=mode=>invoke('switch_mode',{mode}).catch(notice);
 async function present(kind){buddy.cancelFeedback();window.OrbiterChests?.cancel('presentation-change');const ticket=++presentationSerial;window.OrbiterLake?.cancel('buddy-presentation');if(kind!=='reward')window.OrbiterCats.cancelPreview();presentation=kind;buddy.setPresentation();await invoke('buddy_presentation',{kind}).catch(notice);if(ticket!==presentationSerial)return;mountCat();requestAnimationFrame(()=>{if(mode==='buddy'&&ticket===presentationSerial)window.OrbiterLake?.play({kind:kind==='compact'?'tab':'popup',target:kind==='compact'?buddy:buddy.$(kind==='options'?'options':'reward-panel'),duration:kind==='compact'?350:600});});}
 class OrbiterBuddy extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML=`
  <link rel="stylesheet" href="./buddy.css" /><link rel="stylesheet" href="./web/rewards.css" /><link rel="stylesheet" href="./web/glass.css" /><link rel="stylesheet" href="./web/cosmic.css" />
  <div id="island"><div class="island-water" aria-hidden="true"><i></i><i></i><i></i></div>
  <header id="window-bar"><span id="drag" data-tauri-drag-region>ORBITER <i>✦</i></span><nav aria-label="Window controls"><button id="settings" aria-label="Buddy options">⚙</button><button id="minimize" aria-label="Minimize">−</button><button id="maximize" aria-label="Open planner">↗</button><button id="close" aria-label="Close to tray">×</button></nav></header>
  <div id="compact"><button id="cat" aria-label="Open full planner"><img src="./web/icons/orbit-192.png" alt="" /></button><div id="instrument"><div id="intention">A little room to focus</div><div id="time">25:00</div><div id="status">Ready when you are</div><div class="actions"><button id="toggle" class="primary">Start</button><button id="finish">Finish</button><button id="planner" aria-label="Open planner">Planner ↗</button></div></div></div>
  <div id="reward-strip" aria-label="Level and crate progress"></div>
  <section id="reward-panel" hidden><header><h2 id="reward-heading">Discoveries</h2><button id="reward-back">Done</button></header><div id="reward-content"></div></section>
  <section id="options" hidden><header><h2>Your little universe.</h2><button id="back">Done</button></header>
  <div class="settings-intro">Make room for your next idea.<span>Study, appearance and everyday comforts.</span></div><fieldset class="settings-card"><legend>Focus</legend><label for="task">Intention</label><select id="task"><option value="">Open focus</option></select>
  <label for="duration">Focus minutes</label><div class="preset"><button data-minutes="25">25</button><button data-minutes="50">50</button><button data-minutes="60">60</button></div><input id="duration" type="number" min="1" max="240" value="25" />
  </fieldset><fieldset class="settings-card"><legend>Appearance</legend><label>Island size</label><div class="preset"><button data-size="360,200">Small</button><button data-size="420,220">Default</button><button data-size="520,260">Large</button></div>
  <div class="row"><label>Width<input id="width" type="number" min="360" max="560" /></label><label>Height<input id="height" type="number" min="200" max="300" /></label></div><button id="apply-size">Apply size</button>
  <label><input id="pinned" type="checkbox" /> Keep above other windows</label><label><input id="calm" type="checkbox" /> Calmer motion</label><label><input id="quiet" type="checkbox" /> Quiet mode</label></fieldset><fieldset class="settings-card"><legend>Daily comforts</legend><label><input id="reminders" type="checkbox" /> Study reminders</label><label>Reminder hour<input id="reminder-hour" type="number" min="0" max="23" /></label><label><input id="startup" type="checkbox" /> Start with Windows</label>
  </fieldset><fieldset class="settings-card"><legend>Your companion</legend><div id="growth-info"></div><button id="settings-discoveries">Explore discoveries ✧</button><div id="inventory" hidden></div><details><summary>Crate odds</summary><p class="hint">Every 30 focus minutes earns a crate. Common 70% · Rare 25% · Mythic 5%. Only unowned items; unavailable tiers redistribute. Complete collections earn constellation stars.</p></details>
  </fieldset><fieldset class="settings-card"><legend>Your workspace</legend><div class="row"><button id="import">Import backup</button><button id="export">Export</button></div><input id="file" type="file" accept=".json,application/json" hidden /><button id="latest-session">Latest session</button><button id="appearance-studio">Appearance studio</button><button id="account">Account & sync</button><button id="backups">Recovery backups</button><button id="browser">Paired browser ↗</button></fieldset></section>
  <button id="resize" aria-label="Resize island">◢</button><p id="error" role="alert"></p><dialog id="close-choice"><h2>Keep your changes?</h2><p>Your planner has unsaved edits.</p><button id="save-close" class="primary">Save and close</button><button id="discard-close">Discard and close</button><button id="cancel-close">Cancel</button></dialog></div>`;}
  connectedCallback(){const $=id=>this.shadowRoot.getElementById(id);this.$=$;
   for(const [id,name] of [['settings','settings'],['minimize','minus'],['maximize','planner'],['close','close'],['planner','planner'],['resize','resize']]){$(id).innerHTML=icon(name);$(id).title=$(id).getAttribute('aria-label');}
   $('finish').innerHTML=icon('check')+'<span>Finish</span>';$('finish').title='Finish this focus session';
   const feedback=document.createElement('div');feedback.id='focus-feedback';feedback.setAttribute('aria-hidden','true');$('island').append(feedback);
   const announcement=document.createElement('span');announcement.id='focus-announcement';announcement.setAttribute('role','status');announcement.setAttribute('aria-live','polite');$('island').append(announcement);
   $('cat').onclick=$('planner').onclick=$('maximize').onclick=()=>switchMode('planner');$('settings').onclick=()=>present('options');$('back').onclick=()=>present('compact');$('reward-back').onclick=async()=>{if(this.recapView){await act('ack-recap',{sessionId:state.latestRecap.sessionId});this.recapView=false;}present('compact');};
   $('settings-discoveries').onclick=()=>this.openReward(true);
   $('minimize').onclick=()=>invoke('window_control',{action:'minimize'}).catch(notice);$('close').onclick=()=>invoke('window_control',{action:'close'}).catch(notice);
   $('drag').onpointerdown=e=>{if(e.button===0)nativeWindow.startDragging().catch(notice);};$('drag').ondblclick=()=>switchMode('planner');$('resize').onpointerdown=e=>{if(e.button===0)nativeWindow.startResizeDragging('SouthEast').catch(notice);};
   $('toggle').onclick=()=>act('toggle').catch(()=>{});$('finish').onclick=()=>act('finish').catch(()=>{});
   const configure=()=>act('configure',{duration:Number($('duration').value),taskId:$('task').value||null,title:state?.workspace.study.tasks.find(t=>t.id===$('task').value)?.title||'Open focus'}).catch(()=>{});
   $('duration').onchange=$('task').onchange=configure;this.shadowRoot.querySelectorAll('[data-minutes]').forEach(b=>b.onclick=()=>{$('duration').value=b.dataset.minutes;configure();});
   const resize=(width,height)=>invoke('buddy_size',{width:Number(width),height:Number(height)}).then(v=>{accept(v);return present('options');}).catch(notice);
   $('apply-size').onclick=()=>resize($('width').value,$('height').value);this.shadowRoot.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>resize(...b.dataset.size.split(',')));
   for(const key of ['pinned','calm','quiet','reminders'])$(key).onchange=()=>act('settings',{[key]:$(key).checked}).catch(()=>{});
   $('reminder-hour').onchange=()=>act('settings',{reminderHour:Number($('reminder-hour').value)}).catch(()=>{});$('startup').onchange=()=>invoke($('startup').checked?'plugin:autostart|enable':'plugin:autostart|disable').catch(notice);invoke('plugin:autostart|is_enabled').then(v=>$('startup').checked=v).catch(notice);
   $('latest-session').onclick=()=>this.openRecap();
   $('appearance-studio').onclick=async()=>{await switchMode('planner');window.OrbiterUI?.openAppearance();};
   $('account').onclick=async()=>{await switchMode('planner');window.OrbiterAccount?.open();};
   $('export').onclick=()=>invoke('export_workspace').catch(notice);$('backups').onclick=()=>invoke('open_backups').catch(notice);$('browser').onclick=()=>invoke('open_browser').catch(notice);
   $('import').onclick=()=>$('file').click();$('file').onchange=async()=>{const f=$('file').files[0];try{if(!f)return;if(f.size>2*1024*1024)throw Error('Backup exceeds 2 MB.');if(!confirm('Import this backup into Orbiter? This replaces study data and creates a recovery copy.'))return;await window.OrbitDesktop.save(JSON.parse(await f.text()),true);accept(await invoke('snapshot'));await window.OrbiterUI?.reload?.();}catch(e){notice(e);}finally{$('file').value='';}};
   $('cancel-close').onclick=()=>{$('close-choice').close();closing=false;};$('discard-close').onclick=async()=>{$('close-choice').close();await invoke('close_buddy');};
   $('save-close').onclick=async()=>{if(saving)return;saving=true;try{$('close-choice').close();await switchMode('planner');await new Promise(r=>setTimeout(r,350));if(await window.OrbiterUI?.saveDrafts())await invoke('close_buddy');else{closing=false;notice('Review the planner fields before closing.');}}finally{saving=false;}};
  }
  cancelFeedback(preserveRecap=false){clearTimeout(this.feedbackTimer);if(!preserveRecap)clearTimeout(this.recapTimer);this.feedbackAnimations?.forEach(a=>a.cancel());this.feedbackAnimations=[];this.$('focus-feedback')?.replaceChildren();delete this.dataset.feedback;}
  feedback(kind){
   this.cancelFeedback();this.$('focus-announcement').textContent=kind==='victory'?'Focus complete. Beautifully done.':kind==='resume'?'Back in your flow.':'A little room to focus.';
   if(kind==='victory')this.$('status').textContent='Session complete · beautifully done';
   if(document.hidden||this.dataset.calm==='true'||Number(document.body.dataset.motionIntensity)===0)return;
   const layer=this.$('focus-feedback'),island=this.$('island').getBoundingClientRect(),cat=this.$('cat').getBoundingClientRect(),button=this.$('toggle').getBoundingClientRect();layer.style.opacity=String(Math.min(1,Math.max(.2,Number(document.body.dataset.motionIntensity||70)/70)));
   const x=cat.left-island.left+cat.width*.5,y=cat.top-island.top+cat.height*.63,bx=button.left-island.left+button.width*.5,by=button.top-island.top+button.height*.5;
   // The pond shares an opaque renderer with the kitten. Paint over that canvas,
   // but cut a soft opening around the kitten so its face/identity stay clear.
   layer.style.maskImage=`radial-gradient(ellipse ${cat.width*.25}px ${cat.height*.34}px at ${x}px ${cat.top-island.top+cat.height*.44}px,transparent 92%,#000 100%)`;
   this.dataset.feedback=kind;this.feedbackAnimations=[];
   const animate=(node,frames,options)=>{layer.append(node);const a=node.animate(frames,{fill:'both',...options});this.feedbackAnimations.push(a);};
   const dot=(className,left,top)=>{const n=document.createElement('i');n.className=className;n.style.left=left+'px';n.style.top=top+'px';return n;};
   // Dew traces a shallow arc from the accepted action into the companion's pool.
   if(kind!=='victory')for(let i=0;i<7;i++){const mote=dot('focus-dew',0,0);mote.style.offsetPath=`path('M ${bx} ${by} Q ${(bx+x)*.5} ${Math.max(18,y-45)} ${x} ${y}')`;animate(mote,[{offsetDistance:'0%',opacity:0,scale:.2},{opacity:.9,offset:.18,scale:1},{offsetDistance:'100%',opacity:0,scale:.3}],{duration:780,delay:i*42,easing:'cubic-bezier(.2,.6,.2,1)'});}
   for(let i=0;i<3;i++)animate(dot('focus-ring',x,y),[{transform:'translate(-50%,-50%) scale(.15)',opacity:0},{opacity:.65,offset:.25},{transform:`translate(-50%,-50%) scale(${kind==='victory'?2.3:1.65})`,opacity:0}],{duration:1250,delay:(kind==='victory'?60:420)+i*130,easing:'cubic-bezier(.16,1,.3,1)'});
   if(kind==='victory'){
    for(let i=0;i<8;i++){const angle=i*Math.PI/4,petal=dot('focus-petal',x,y),bloom=`translate(-50%,-50%) rotate(${i*45}deg) translateY(-26px) scale(1)`;animate(petal,[{transform:`translate(-50%,-50%) rotate(${i*45}deg) scale(0)`,opacity:0},{transform:bloom,opacity:.9,offset:.28},{transform:bloom,opacity:.75,offset:.64},{transform:`translate(-50%,-50%) rotate(${i*45+12}deg) translateY(-36px) scale(.65)`,opacity:0}],{duration:1650,delay:i*25,easing:'linear'});
     const star=dot('focus-star',x,y);star.innerHTML=icon('spark');animate(star,[{transform:'translate(-50%,-50%) scale(0)',opacity:0},{opacity:1,offset:.25},{transform:`translate(calc(-50% + ${Math.cos(angle)*57}px),calc(-50% + ${Math.sin(angle)*42-12}px)) rotate(35deg) scale(.5)`,opacity:0}],{duration:1450,delay:220+i*40,easing:'cubic-bezier(.15,.7,.25,1)'});}
   }
   this.feedbackTimer=setTimeout(()=>{this.feedbackAnimations.forEach(a=>a.cancel());this.feedbackAnimations=[];layer.replaceChildren();delete this.dataset.feedback;},kind==='victory'?1850:1700);
  }
  async openRecap(){
   if(!state.latestRecap)return;this.recapView=true;await present('reward');this.$('reward-heading').textContent='Your session';
   this.renderRecap();
  }
  renderRecap(){
   const host=this.$('reward-content');host.innerHTML=R.recap(state);host.classList.add('recap-view');
   host.querySelector('[data-recap-done]')?.addEventListener('click',async()=>{await act('ack-recap',{sessionId:state.latestRecap.sessionId});this.recapView=false;present('compact');});
   host.querySelector('[data-recap-task]')?.addEventListener('click',async()=>{await switchMode('planner');window.OrbiterUI?.openTaskById(state.latestRecap.taskId);});
   host.querySelector('[data-recap-crate]')?.addEventListener('click',()=>this.openReward());
  }
  setPresentation(){this.dataset.presentation=presentation;this.$('options').hidden=presentation!=='options';this.$('reward-panel').hidden=presentation!=='reward';}
  bindInventory(host){host.querySelectorAll('[data-slot-filter]').forEach(b=>b.onclick=()=>{slot=b.dataset.slotFilter;this.renderInventory();});host.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{const item=state.catalog.find(c=>c.id===b.dataset.equip);this.$('reward-panel').dataset.view='preview';host.innerHTML=R.equipmentPreview(state,item);window.OrbiterCats.previewEquipment(host.querySelector('.orb-preview-model'),{[item.slot]:item.id});host.querySelector('[data-preview-cancel]').onclick=()=>{window.OrbiterCats.cancelPreview();this.$('reward-panel').dataset.view='collection';this.renderInventory();};host.querySelector('[data-preview-equip]').onclick=()=>act('settings',{[item.slot]:item.id}).then(()=>{window.OrbiterCats.cancelPreview();this.$('reward-panel').dataset.view='collection';this.renderInventory();}).catch(()=>{});});}
  renderInventory(){const host=this.$('inventory');host.innerHTML=R.collection(state,slot);this.bindInventory(host);if(presentation==='reward'&&this.$('reward-panel').dataset.view==='collection'){const content=this.$('reward-content');content.innerHTML=R.collection(state,slot);this.bindInventory(content);}}
  async openReward(collectionOnly=false){
   if(busy)return;
   // Lock before resizing so rapid clicks cannot consume multiple earned crates.
   let chestPresentation;busy=true;this.recapView=false;const panel=this.$('reward-panel'),host=this.$('reward-content');
   host.classList.remove('recap-view','orb-revealed','orb-opening');panel.dataset.view=collectionOnly?'collection':'reveal';
   try{
    const showing=present('reward'),ticket=presentationSerial;await showing;if(mode!=='buddy'||presentation!=='reward'||ticket!==presentationSerial)return;this.$('reward-heading').textContent=collectionOnly?'Discoveries':'Your discovery';
    if(collectionOnly){this.renderInventory();return;}
    host.innerHTML=R.crateArt();
    if(!state.rewards.chests){host.innerHTML=R.crateArt()+`<h3>A little more momentum.</h3><p>${Math.ceil((1800000-state.rewards.crateProgressMs)/60000)} focus minutes to your next crate.</p>`;return;}
    host.innerHTML='<div class="crate-stage">'+R.crateArt()+'<span class="crate-halo" aria-hidden="true"></span></div><p class="crate-caption" role="status">Opening your discovery…</p>';
    const quiet=this.dataset.calm==='true'||Number(document.body.dataset.motionIntensity)===0;
    host.classList.toggle('orb-opening',!quiet);host.setAttribute('aria-busy','true');
    // The native action runs once. Presentation waits independently for the lid,
    // even when a local RPC resolves before the browser's first paint.
    chestPresentation=window.OrbiterChests?.play(host.querySelector('.crate-stage'),{quiet,onPhase:phase=>{const caption=host.querySelector('.crate-caption');if(caption)caption.textContent=phase==='complete'?'Saving your discovery…':phase==='open'?'A new discovery…':phase==='unlock'?'A little moonlight…':'Opening your discovery…';}});
    const opening=chestPresentation?.finished||Promise.resolve();
    const [v]=await Promise.all([act('chest'),opening]);
    if(mode!=='buddy'||presentation!=='reward'||ticket!==presentationSerial)return;
    const reward=v.reward;if(!reward)throw Error('Your discovery was saved. Reopen Discoveries to view it.');
    host.classList.remove('orb-opening');host.classList.toggle('orb-revealed',!quiet);
    host.innerHTML=R.preview(reward)+`<small class="orb-rarity">${reward.rarity}</small><h3></h3>`+(reward.id?'<button id="equip-reveal" class="primary">Equip discovery</button>':'<p>A new light in your constellation.</p>');
    host.querySelector('h3').textContent=R.displayName(reward.name);
    host.querySelector('#equip-reveal')?.addEventListener('click',()=>act('settings',{[reward.slot]:reward.id}).then(()=>notice('Equipped')).catch(()=>{}));
    window.OrbiterCats.celebrate();
   }catch(e){notice(e);if(presentation==='reward'&&panel.dataset.view==='reveal')host.innerHTML='<h3>Discovery paused</h3><p>Your collection is saved. Open Discoveries to check your items.</p>';}
   finally{chestPresentation?.cancel('released');busy=false;host.classList.remove('orb-opening');host.removeAttribute('aria-busy');}
  }
  update(v){const $=this.$,p=v.workspace.study.preferences,g=selectedGrowth();document.body.dataset.motionIntensity=String(p.motionIntensity??70);document.body.dataset.effectQuality=p.effectQuality||'auto';this.dataset.calm=String(!!(v.settings.calm||v.settings.quiet||p.motion||matchMedia('(prefers-reduced-motion:reduce)').matches));this.dataset.focusing=String(v.timer.active);this.dataset.growth=String(g.stage);this.style.setProperty('--accent',({mint:'#b4e6d5',lilac:'#c8b5eb',apricot:'#edbfa0'})[p.accent]||'#b4e6d5');this.style.setProperty('--orbiter-accent',this.style.getPropertyValue('--accent'));this.dataset.solid=String(!!p.solid||p.material==='quiet');this.style.setProperty('--surface',p.material==='quiet'?'#253344':'#2a4152');if(!equipmentPreviewing)this.dataset.habitat=v.settings.habitat||'';this.dataset.preset=p.scenePreset||'tidal-night';this.style.setProperty('--atmosphere',String((p.atmosphereStrength??50)/100));
   $('intention').textContent=v.timer.title||'Open focus';$('intention').title=$('intention').textContent;const label=v.timer.active?'Pause':v.timer.remainingMs<v.timer.duration*60000&&v.timer.remainingMs>0?'Resume':'Start';if(this.toggleLabel!==label){this.toggleLabel=label;$('toggle').innerHTML=icon(v.timer.active?'pause':'play')+'<span>'+label+'</span>';$('toggle').setAttribute('aria-label',label+' focus');}$('finish').disabled=!v.timer.active&&(v.timer.remainingMs===0||v.timer.remainingMs>=v.timer.duration*60000);$('status').textContent=v.timer.reason||g.label+' · growing with you';$('status').title=$('status').textContent;
   if(this.dataset.calm==='true'||Number(p.motionIntensity)===0)this.cancelFeedback(true);
   if(this.shadowRoot.activeElement?.tagName!=='INPUT'){ $('width').value=v.settings.buddyWidth;$('height').value=v.settings.buddyHeight;$('duration').value=v.timer.duration;$('reminder-hour').value=v.settings.reminderHour; }
   for(const k of ['pinned','calm','quiet','reminders'])$(k).checked=v.settings[k];const tasks=v.workspace.study.tasks.filter(t=>!t.done),sig=JSON.stringify(tasks.map(t=>[t.id,t.title]));if(this.taskKey!==sig){this.taskKey=sig;$('task').replaceChildren(new Option('Open focus',''),...tasks.map(t=>new Option(t.title,t.id)));}$('task').value=v.timer.taskId||'';$('task').disabled=$('duration').disabled=v.timer.active||(v.timer.remainingMs>0&&v.timer.remainingMs<v.timer.duration*60000);this.shadowRoot.querySelectorAll('[data-minutes]').forEach(b=>b.disabled=$('task').disabled);
   $('reward-strip').innerHTML=R.strip(v,true);$('reward-strip').querySelector('[data-reward-open]').onclick=()=>this.openReward();const collection=$('reward-strip').querySelector('[data-reward-collection]');collection.innerHTML=icon('spark');collection.title='Discoveries';collection.onclick=()=>this.openReward(true);$('growth-info').textContent=g.label+(g.nextAtMs?' · '+Math.ceil((g.nextAtMs-g.focusedMs)/60000)+'m to next stage':' · your journey continues');
   $('latest-session').disabled=!v.latestRecap;const recapKey=JSON.stringify(v.latestRecap);if(this.recapView&&presentation==='reward'&&this.recapKey!==recapKey){this.recapKey=recapKey;this.renderRecap();}
   const key=JSON.stringify([v.rewards.owned,v.settings.appearance,v.settings.halo,v.settings.trail,v.settings.habitat,slot]);if(this.inventoryKey!==key){this.inventoryKey=key;this.renderInventory();}tick();
  }
 }
 customElements.define('orbiter-buddy',OrbiterBuddy);const buddy=document.querySelector('orbiter-buddy');
 document.addEventListener('visibilitychange',()=>{if(document.hidden)buddy.cancelFeedback();});
 window.addEventListener('resize',()=>buddy.cancelFeedback());
 matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',()=>{buddy.cancelFeedback(true);if(state)buddy.update(state);});
 window.addEventListener('orbiter-equipment-preview',e=>{equipmentPreviewing=!!e.detail.previewing;buddy.dataset.habitat=e.detail.habitat||'';});
 function tick(){if(!state||document.hidden)return;const remaining=Math.max(0,state.timer.remainingMs-(state.timer.active?performance.now()-received:0)),s=Math.ceil(remaining/1000);buddy.$('time').textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
 setInterval(tick,1000);window.addEventListener('orbiter-native-state',e=>accept(e.detail));window.addEventListener('orbiter-workspace-rendered',()=>{if(mode==='buddy')mountCat();});listen('orbiter-mode',e=>setView(e.payload));
 listen('orbiter-close-request',async()=>{if(closing)return;const dirty=window.OrbiterUI?.dirty()||suspended.some(d=>d.querySelector('form input,form textarea'));if(dirty){closing=true;if(mode==='planner')await switchMode('buddy');await present('reward');buddy.$('close-choice').showModal();}else invoke('close_buddy').catch(notice);});
 nativeWindow.onResized(()=>{clearTimeout(sizeTimer);sizeTimer=setTimeout(async()=>{if(mode==='buddy'&&presentation==='compact'){const sz=await nativeWindow.innerSize(),scale=await nativeWindow.scaleFactor();act('settings',{buddyWidth:Math.round(sz.width/scale),buddyHeight:Math.round(sz.height/scale)}).catch(()=>{});}},500);});
 window.OrbitDesktop.ready.then(async v=>{accept(v);const initial=await invoke('window_mode');setView(initial.mode);if(new URLSearchParams(location.search).has('expanded'))await switchMode('planner');const measuring=await invoke('ui_ready',{diagnostics:diagnostics()});if(measuring===true){buddy.$('drag').textContent='TEST · AUTO-CLOSE';for(const delay of [5000,15000,22000])setTimeout(()=>invoke('ui_ready',{diagnostics:diagnostics()}).catch(()=>{}),delay);}}).catch(notice);
})();

