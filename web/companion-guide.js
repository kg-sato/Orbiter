/* Read-only companion portraits. Native focus remains the growth authority. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const thresholds=[0,2,8,20].map(hours=>hours*3600000);
  const labels=['Baby','Kitten','Young cat','Adult'];
  let dialog,profile,previewStage=null,angle=0,returnFocus=null,profileSignature='';
  const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  const validMs=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
  function profiles(){
    let workspace={};
    try{workspace=window.OrbiterUI?.snapshot()||{};}catch(error){/* A loading workspace has no course list yet. */}
    const all=[{key:'main',label:'Your companion',code:window.OrbiterCats?.main?.()??0,main:true}];
    const courses=workspace.study?.catProfiles;
    if(courses&&typeof courses==='object')for(const [name,code]of Object.entries(courses)){
      if(Number.isInteger(code)&&code>=0)all.push({key:'course:'+name,label:name,code,main:false});
    }
    return all;
  }
  function rebuildProfiles(){
    const all=profiles(),signature=JSON.stringify(all),selected=profile.value;
    if(signature!==profileSignature){
      profile.replaceChildren(...all.map(item=>{const option=document.createElement('option');option.value=item.key;option.textContent=item.label;return option;}));
      profile.value=all.some(item=>item.key===selected)?selected:'main';profileSignature=signature;
    }
    return all.find(item=>item.key===profile.value)||all[0];
  }
  function render(){
    if(!dialog?.open)return;
    const selected=rebuildProfiles(),native=window.OrbiterNativeState,rewards=native?.rewards;
    const actual=selected.main?rewards?.focusedMs:(rewards?rewards.courseMs?.[selected.code]??0:undefined);
    const known=validMs(actual),growth=window.OrbiterRewards?.growth;
    const actualGrowth=known&&growth?growth(actual):null;
    text($('companion-guide-stage'),actualGrowth?'Current growth: '+actualGrowth.label:'Current growth: native credit unavailable');
    text($('companion-guide-progress'),actualGrowth?(actualGrowth.nextAtMs?Math.max(0,Math.ceil((actualGrowth.nextAtMs-actual)/60000))+' minutes of native focus to '+labels[actualGrowth.stage+1]+'.':'Fully grown. Your focused study still counts.'):'Browser and offline previews cannot confirm native focus credit. Previewing never earns growth or rewards.');
    const preview=previewStage!==null||!known,ms=previewStage!==null?thresholds[previewStage]:(known?actual:0),stage=growth?growth(ms).stage:(previewStage??0);
    text($('companion-guide-preview-status'),preview?'Preview only · '+labels[stage]+'. Your saved growth is unchanged.':'Showing current growth · '+labels[stage]+'.');
    $('companion-guide-growth').value=previewStage===null?'current':String(previewStage);
    $('companion-guide-current').disabled=previewStage===null;
    dialog.querySelectorAll('[data-companion-angle]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.companionAngle)===angle)));
    const settings=native?.settings||{},equipment=$('companion-guide-equipment'),catalog=Array.isArray(native?.catalog)?native.catalog:[];
    const parts=[];
    for(const [slot,label]of [['appearance','Appearance'],['halo','Halo'],['trail','Trail'],['habitat','Habitat']]){
      const id=settings[slot];if(typeof id!=='string'||!id)continue;
      const item=catalog.find(entry=>entry.id===id);parts.push(label+': '+(item?.name||id));
    }
    text(equipment,parts.length?'Current equipment · '+parts.join(' · '):'No native equipment is available to display.');
    const image=$('companion-guide-portrait'),unavailable=$('companion-guide-unavailable');
    try{
      const url=window.OrbiterCats?.portrait?.(selected.code,ms,settings,angle);
      if(typeof url==='string'&&url.startsWith('data:image/')){
        if(image.getAttribute('src')!==url)image.src=url;
        image.alt=selected.label+' · '+labels[stage]+' · '+(angle===0?'front':angle===Math.PI/4?'three-quarter':'side')+' view'+(preview?' (preview)':'');
        image.hidden=false;unavailable.hidden=true;
      }else{image.hidden=true;unavailable.hidden=false;}
    }catch(error){image.hidden=true;unavailable.hidden=false;}
  }
  function open(){
    init();if(!dialog||dialog.open)return;
    returnFocus=document.activeElement;previewStage=null;angle=0;
    dialog.showModal();render();$('companion-guide-close').focus();
    Promise.resolve(window.OrbiterCats?.ready).then(()=>{if(dialog.open)render();});
  }
  function init(){
    if(!$('workspace')||!window.OrbiterUI)return;
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='companion-guide';dialog.className='companion-guide';dialog.setAttribute('aria-labelledby','companion-guide-title');dialog.setAttribute('aria-describedby','companion-guide-intro');
      dialog.innerHTML=`<header><div><p class="companion-guide-eyebrow">YOUR STUDY COMPANIONS</p><h2 id="companion-guide-title">Companion field guide</h2></div><button id="companion-guide-close" type="button">Close</button></header>
        <p id="companion-guide-intro">Meet your course kittens, explore their growth and see your current equipment. All previews are temporary.</p>
        <label class="companion-guide-label" for="companion-guide-profile">Choose a companion</label><select id="companion-guide-profile"></select>
        <figure class="companion-guide-figure"><img id="companion-guide-portrait" width="240" height="240" alt="" hidden><p id="companion-guide-unavailable">The companion portrait is loading or unavailable. Growth details are still shown below.</p><figcaption id="companion-guide-preview-status" role="status" aria-live="polite"></figcaption></figure>
        <div class="companion-guide-angles" role="group" aria-label="Portrait angle"><button type="button" data-companion-angle="0" aria-pressed="true">Front</button><button type="button" data-companion-angle="${Math.PI/4}" aria-pressed="false">Three-quarter</button><button type="button" data-companion-angle="${Math.PI/2}" aria-pressed="false">Side</button></div>
        <section class="companion-guide-growth-panel" aria-label="Growth"><h3 id="companion-guide-stage"></h3><p id="companion-guide-progress"></p><label class="companion-guide-label" for="companion-guide-growth">Preview a growth stage</label><select id="companion-guide-growth"><option value="current">Current growth</option>${labels.map((label,i)=>'<option value="'+i+'">'+label+' · preview</option>').join('')}</select><button id="companion-guide-current" data-companion-current type="button">Use current growth</button></section>
        <p id="companion-guide-equipment"></p><p class="companion-guide-footnote">This guide does not equip items, change companion identities or grant focus credit.</p>`;
      document.body.append(dialog);profile=$('companion-guide-profile');
      $('companion-guide-close').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus();returnFocus=null;});
      profile.addEventListener('change',()=>{previewStage=null;render();});
      $('companion-guide-growth').addEventListener('change',event=>{previewStage=event.target.value==='current'?null:Number(event.target.value);render();});
      $('companion-guide-current').addEventListener('click',()=>{previewStage=null;render();});
      dialog.querySelectorAll('[data-companion-angle]').forEach(button=>button.addEventListener('click',()=>{angle=Number(button.dataset.companionAngle);render();}));
    }
    if(!$('companion-guide-open')){
      const anchor=$('focus-history');if(anchor){const button=document.createElement('button');button.id='companion-guide-open';button.className='companion-guide-open';button.type='button';button.textContent='Companion field guide';button.setAttribute('aria-haspopup','dialog');button.addEventListener('click',open);anchor.before(button);}
    }
  }
  window.OrbiterCompanionGuide={open};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('orbiter-workspace-rendered',()=>{init();render();});
  window.addEventListener('orbiter-native-state',render);
  window.addEventListener('orbiter-avatar-ready',render);
  window.addEventListener('orbiter-mode-change',()=>{if(dialog?.open)dialog.close();});
})();
