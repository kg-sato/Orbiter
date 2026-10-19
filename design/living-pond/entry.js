import '../../web/celestial.js';
import * as cats from '../../src/mascot/cat.js';
import {catalog,item,prototypeIds} from './catalog.js';
import {play,start,stats} from './transitions.js';
import {studyFallback} from './fallback.js';

const $=id=>document.getElementById(id);
let equipment={appearance:'mint',halo:'halo-10',trail:'trail-waves',habitat:'habitat-01'},saved={...equipment},focus=false,compact=false;
const glyphs={'habitat-01':'◌','habitat-07':'◇','habitat-11':'❀','habitat-12':'∞','halo-thin':'✧','halo-07':'⋆','halo-10':'✥','halo-12':'☽'};
const showcases={
 'Tide Wanderer':{appearance:'mint',halo:'halo-10',trail:'trail-waves',habitat:'habitat-01'},
 'Moon Garden':{appearance:'look-11',halo:'halo-12',trail:'trail-sparks',habitat:'habitat-11'},
 Stargazer:{appearance:'indigo',halo:'halo-07',trail:'trail-comet',habitat:'habitat-07'}
};
// Extra review controls are ephemeral and have no native/account connection.
const showcase=document.createElement('section');showcase.className='surface outfit-showcases';showcase.setAttribute('aria-label','Coordinated outfit demonstrations');
for(const [name,items] of Object.entries(showcases)){const b=document.createElement('button');b.textContent=name;b.dataset.showcase=name;b.onclick=()=>{equipment={...items};mount();play({kind:'tab',target:compact?$('buddy'):$('world-panel')});};showcase.append(b);}
$('world-panel').before(showcase);
const identityLabel=document.createElement('label');identityLabel.textContent='Companion identity';const identity=document.createElement('select');identity.id='identity';for(const [value,name] of [[0,'Cream · pointed ears'],[85,'Tuxedo · folded ears'],[170,'Lilac · rounded ears'],[255,'Sage · tufted ears']]){const option=new Option(name,String(value));identity.add(option);}identityLabel.append(identity);document.querySelector('.controls').prepend(identityLabel);
const rotateLabel=document.createElement('label');rotateLabel.className='rotation-control';rotateLabel.textContent='Rotate companion';const rotation=document.createElement('input');rotation.type='range';rotation.id='rotation';rotation.min='-45';rotation.max='45';rotation.value='0';rotation.setAttribute('aria-label','Rotate companion');rotateLabel.append(rotation);$('cat-home').after(rotateLabel);
const equipped=document.createElement('div');equipped.id='equipped-collection';equipped.className='equipped-collection';equipped.setAttribute('aria-label','Equipped preview collection');showcase.after(equipped);
for(const [select,id] of [['quick-habitat','habitat-11'],['quick-accessory','halo-10']])$(select).add(new Option(item(id).name,id));
function mount(){
  window.OrbiterStudyAppearance=equipment.appearance;
  cats.mount($('cat-host'),Number(identity.value),{equipment,growthMs:Number($('growth').value),focus});
  $('habitat-name').textContent=item(equipment.habitat).name;$('habitat-description').textContent=item(equipment.habitat).description;
  $('equipment-name').textContent=item(equipment.halo).name;$('equipment-description').textContent=item(equipment.halo).description;
  document.querySelectorAll('[data-item]').forEach(b=>b.setAttribute('aria-pressed',String(Object.values(equipment).includes(b.dataset.item))));
  document.body.dataset.habitat=equipment.habitat;
  $('quick-habitat').value=equipment.habitat;$('quick-accessory').value=equipment.halo;
  equipped.replaceChildren();for(const id of Object.values(equipment)){const chip=document.createElement('span');chip.className='equipped-chip';chip.textContent=item(id).name;equipped.append(chip);}
  document.querySelectorAll('[data-showcase]').forEach(b=>b.setAttribute('aria-pressed',String(JSON.stringify(showcases[b.dataset.showcase])===JSON.stringify(equipment))));
  document.querySelectorAll('[data-catalog-item]').forEach(card=>{const selected=Object.values(equipment).includes(card.dataset.catalogItem);card.dataset.equipped=String(selected);const badge=card.querySelector('.ownership');if(badge)badge.textContent=selected?'Equipped in preview':prototypeIds.has(card.dataset.catalogItem)?'Available in demo':'Planned · unavailable';});
}
function choice(id){const data=item(id),button=document.createElement('button');button.className='choice';button.dataset.item=id;button.setAttribute('aria-pressed',String(Object.values(equipment).includes(id)));const glyph=document.createElement('span');glyph.className='glyph';glyph.setAttribute('aria-hidden','true');glyph.textContent=glyphs[id];const text=document.createElement('span'),title=document.createElement('strong'),desc=document.createElement('small');title.textContent=data.name;desc.textContent=data.description;text.append(title,desc);button.append(glyph,text);button.onclick=()=>{equipment={...equipment,[data.slot]:id};mount();$('preview-status').textContent='Temporary preview · '+data.name+'. Your real inventory is untouched.';play({kind:'tab',target:compact?$('buddy'):$('world-panel')});};return button;}
for(const id of ['habitat-01','habitat-07','habitat-11','habitat-12'])$('habitats').append(choice(id));
for(const id of ['halo-thin','halo-07','halo-10','halo-12'])$('accessories').append(choice(id));
for(const data of catalog){const card=document.createElement('div');card.className='catalog-item';card.dataset.catalogItem=data.id;card.dataset.ready=String(prototypeIds.has(data.id));const name=document.createElement('strong'),desc=document.createElement('small'),status=document.createElement('span'),ownership=document.createElement('span');ownership.className='ownership';name.textContent=data.name;desc.textContent=data.description;status.textContent=data.rarity.replace(/^./,c=>c.toUpperCase());ownership.textContent=prototypeIds.has(data.id)?'Available in demo':'Planned · unavailable';if(prototypeIds.has(data.id)){const thumbnail=new Image();thumbnail.className='item-thumbnail';thumbnail.loading='lazy';thumbnail.src=studyFallback(0,1,{[data.slot]:data.id});thumbnail.alt=data.name+' · static illustration';card.append(thumbnail);}card.append(name,desc,status,ownership);if(prototypeIds.has(data.id)){const preview=document.createElement('button');preview.textContent='Preview';preview.onclick=()=>{equipment={...equipment,[data.slot]:data.id};mount();};card.append(preview);}$('catalog').append(card);}
document.querySelector('.catalog p').textContent='Fourteen items have working review visuals, including the three complete outfit demonstrations. Other entries remain planned. All availability here is fictional; this page does not read your inventory.';
document.querySelector('.section-heading .eyebrow').textContent='FOURTEEN WORKING ITEM VISUALS';
OrbiterScene.start();start();mount();
identity.onchange=mount;rotation.oninput=()=>{window.OrbiterStudyYaw=Number(rotation.value)*Math.PI/180;mount();};
$('quick-habitat').onchange=()=>{equipment={...equipment,habitat:$('quick-habitat').value};mount();play({kind:'tab',target:$('world-panel')});};
$('quick-accessory').onchange=()=>{equipment={...equipment,halo:$('quick-accessory').value};mount();play({kind:'tab',target:$('world-panel')});};
$('open-popup').onclick=()=>$('sample-popup').showModal();$('close-popup').onclick=$('done-popup').onclick=()=>$('sample-popup').close();
for(const b of document.querySelectorAll('[data-page]'))b.onclick=()=>{document.querySelectorAll('[data-page]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));$('page-title').textContent=b.dataset.page;$('page-detail').textContent=b.dataset.page==='Assignments'?'Upcoming tests, daily practice and assignments share the same calm surface.':b.dataset.page==='Atlas'?'Each companion keeps its identity. This preview uses fictional data.':'A calm reading area. Background light is quieter here, and the interface stays still.';play({kind:'page',target:$('world-panel')});};
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));$('tab-title').textContent=b.dataset.tab;play({kind:'tab',target:$('secondary')});};
$('palette').onchange=()=>{document.body.dataset.preset=$('palette').value;play({kind:'scene',target:$('world-panel')});};
$('quality').onchange=()=>{document.body.dataset.effectQuality=$('quality').value;OrbiterScene.refresh();};
$('material').onchange=()=>{document.body.dataset.material=$('material').value;};
$('growth').onchange=mount;
$('motion').onclick=()=>{const resume=document.body.dataset.motionIntensity==='0';document.body.dataset.motionIntensity=resume?'70':'0';$('motion').setAttribute('aria-pressed',String(!resume));$('motion').textContent=resume?'Pause motion':'Resume motion';if(!resume)OrbiterLake.cancel('paused');OrbiterScene.refresh();};
$('focus').onclick=()=>{focus=!focus;$('focus').setAttribute('aria-pressed',String(focus));$('focus').textContent=focus?'Pause demo':'Demo focus';mount();};
$('reaction').onclick=()=>{cats.celebrate();play({kind:'crate',target:compact?$('buddy'):$('world-panel')});};
$('compare').textContent='Compare previous items';
$('compare').onclick=()=>{window.OrbiterStudyOriginal=!window.OrbiterStudyOriginal;$('compare').setAttribute('aria-pressed',String(window.OrbiterStudyOriginal));$('compare').textContent=window.OrbiterStudyOriginal?'Show refined items':'Compare previous items';mount();};
$('equip').onclick=()=>{saved={...equipment};$('preview-status').textContent='Kept for this preview only. Reloading restores the starting comparison.';};
$('cancel-preview').onclick=()=>{equipment={...saved};mount();$('preview-status').textContent='Restored the last kept preview.';play({kind:'tab',target:compact?$('buddy'):$('world-panel')});};
$('compact').onclick=()=>{OrbiterLake.cancel('mode');compact=!compact;document.body.classList.toggle('compact',compact);$('buddy').hidden=!compact;$(compact?'compact-home':'cat-home').append($('cat-host'));$('compact').setAttribute('aria-pressed',String(compact));$('compact').textContent=compact?'Planner view ↗':'Compact view ↘';mount();if(compact)$('buddy').scrollIntoView({block:'center',behavior:'instant'});};
let expansion=null;
function expandBuddy(open){const buddy=$('buddy');const from=buddy.getBoundingClientRect().height;expansion?.cancel();$('buddy-settings').hidden=!open;const to=buddy.getBoundingClientRect().height;play({kind:'tab',target:buddy});if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&Number(document.body.dataset.motionIntensity)>0){expansion=buddy.animate([{height:from+'px'},{height:to+'px'}],{duration:350,easing:'cubic-bezier(.2,.7,.2,1)'});expansion.onfinish=()=>{expansion=null;};}}
$('buddy-options').onclick=()=>expandBuddy(true);
$('buddy-done').onclick=()=>expandBuddy(false);
$('buddy-start').onclick=()=>{focus=!focus;$('buddy-start').textContent=focus?'Pause demo':'Start demo';mount();};
$('measure').onclick=async()=>{const button=$('measure');button.disabled=true;const before=cats.stats(),start=performance.now();$('measurements').textContent='Measuring this scene for 5 seconds…';await new Promise(resolve=>setTimeout(resolve,5000));const after=cats.stats();const result={durationMs:performance.now()-start,fps:(after.frames-before.frames)/5,cat:after,transition:stats(),jsHeapBytes:performance.memory?.usedJSHeapSize??null};window.OrbiterStudyLastMeasurement=result;$('measurements').textContent=`${result.fps.toFixed(1)} rendered FPS · last frame ${after.frameMs.toFixed(2)} ms · ${after.contexts} WebGL context · ${after.renderCalls} cat draw calls · ${after.triangles.toLocaleString()} cat + habitat triangles`;button.disabled=false;};
window.OrbiterStudy={catalog,mount,equipment:()=>({...equipment}),stats:()=>({cat:cats.stats(),transition:stats()})};
