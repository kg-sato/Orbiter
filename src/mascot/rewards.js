// Shared presentation only. Rust remains the authority for credits and item grants.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const calm = () => matchMedia('(prefers-reduced-motion:reduce)').matches || ['reduced-motion','calm','quiet'].some(c=>document.body.classList.contains(c));
const swatches = ['#ecc0ad','#e7dfcb','#99bad0','#dfc391','#acc7b5','#c5b4df','#dda6bd','#cbdfe0','#9b94c0','#91d8c1','#d8c7ed','#aaa7dc'];
export const lookColor = id => ({mint:'#b4e6d5',lilac:'#c8b5eb',opal:'#e6ddca',rose:'#e0b6c9',aurora:'#8ee4c8',eclipse:'#e9ba90',indigo:'#939ddd',singularity:'#aca0db',cultivation:'#ccd7a0'}[id]||swatches[Math.max(0,(Number(id?.slice(-2))||1)-1)%12]);
export function growth(ms = 0) {
  const hours = ms / 3600000, thresholds = [0,2,8,20];
  const stage = Math.max(0, thresholds.findLastIndex(h => hours >= h));
  return {stage,label:['Baby','Kitten','Young cat','Adult'][stage],focusedMs:ms,progress:stage===3?1:(hours-thresholds[stage])/(thresholds[stage+1]-thresholds[stage]),nextAtMs:stage===3?null:thresholds[stage+1]*3600000};
}
export function crateArt() {
  return '<span class="orb-crate-art" aria-hidden="true"><i class="orb-crate-body"></i><i class="orb-crate-lid"></i><i class="orb-crate-star">✦</i></span>';
}
export function preview(item = {}) {
  const n = Number(item.id?.slice(-2)) || 1, color = swatches[(n-1)%12];
  const slot = item.slot || (item.id?.startsWith('halo-')?'halo':item.id?.startsWith('trail-')?'trail':item.id?.startsWith('habitat-')?'habitat':'appearance');
  const accessories=[
    '<path d="M31 31Q12 13 13 32Q14 46 31 35M33 31Q51 13 52 32Q50 46 33 35"/><circle cx="32" cy="33" r="5"/>',
    '<path d="M27 20Q32 14 37 20L42 41H22Z"/><circle cx="32" cy="44" r="4"/>',
    '<path d="M43 13A21 21 0 1 0 47 47Q21 46 43 13Z"/>',
    '<path d="M13 35Q8 24 20 23Q20 12 32 18Q42 10 47 24Q58 23 52 35Z"/>',
    '<rect x="17" y="23" width="31" height="27" rx="8"/><path d="M23 23V15H41V23M17 33H48M29 32V38H36"/>',
    '<path d="M12 40L30 20L46 36L28 49ZM29 18L45 10M36 27L54 21"/>',
    '<path d="M23 18H41L52 48Q31 54 12 48ZM26 18Q32 27 38 18"/>',
    '<path d="M14 45L10 22L23 30L32 13L41 30L54 22L50 45Z"/>',
    '<path d="M20 21H44L48 45H16ZM25 21V14H39V21M18 28H46M32 23V44"/>',
    '<circle cx="32" cy="32" r="21"/><path d="M24 40L30 22L40 25L34 42ZM32 8V13M32 51V56"/>',
    '<path d="M32 36Q12 42 12 21Q24 34 29 28L32 10L36 28Q44 34 53 19Q54 43 33 36L27 52L32 46L38 52Z"/>',
    '<path d="M30 40Q8 35 10 12Q18 24 29 24M34 40Q56 35 54 12Q46 24 35 24M14 23L24 33M50 23L40 33"/>'
  ];
  const habitats=[
    '<ellipse cx="32" cy="44" rx="25" ry="9"/><ellipse cx="18" cy="36" rx="7" ry="5"/><ellipse cx="38" cy="30" rx="9" ry="6"/>',
    '<ellipse cx="32" cy="48" rx="25" ry="5"/><path d="M19 45V25Q9 19 10 14Q25 14 19 25M41 46V30Q54 20 54 16Q38 16 41 30"/>',
    '<ellipse cx="32" cy="40" rx="25" ry="10"/><path d="M21 29Q29 13 42 26Q31 22 27 32"/>',
    '<path d="M16 50V13H44V21M37 20H51L54 42H34ZM43 23V39M34 26H52"/>',
    '<ellipse cx="32" cy="49" rx="25" ry="4"/><path d="M18 47L15 12M30 49L35 19M43 46L51 10M16 23L24 18M37 31L46 27"/>',
    '<path d="M9 37Q7 23 23 26Q26 11 38 25Q55 15 55 34Q61 46 12 45ZM12 48H53"/>',
    '<path d="M10 47L15 21L24 15L28 46M27 48L31 10L43 24L40 48M41 48L48 30L56 45Z"/>',
    '<path d="M10 48V16M54 48V16M12 21Q32 55 52 21M15 48H49"/>',
    '<path d="M13 40H51L45 29H19ZM22 29V18H42V29M18 18L32 9L47 18M23 40V49M41 40V49"/>',
    '<ellipse cx="32" cy="46" rx="25" ry="8"/><path d="M9 28Q20 11 30 29T55 24M13 18Q21 6 32 19T51 14"/>',
    '<ellipse cx="32" cy="49" rx="26" ry="5"/><path d="M15 47V27M32 46V16M49 47V27"/><path d="M15 18L19 25L25 27L19 31L15 37L11 31L5 27L11 25ZM32 6L37 14L44 16L37 21L32 29L27 21L20 16L27 14"/>',
    '<path d="M9 32C9 8 35 8 32 32S55 55 55 32S31 9 32 32S9 56 9 32Z"/>'
  ];
  const art=slot==='appearance'?'<path d="M12 27L15 10L27 21H38L49 10L52 28Q58 52 32 53Q7 51 12 27Z"/><circle cx="24" cy="33" r="2"/><circle cx="41" cy="33" r="2"/><path d="M28 42Q32 46 36 42"/>':slot==='trail'?'<path d="M8 22Q22 10 34 22T56 22M8 33Q22 21 34 33T56 33M8 44Q22 32 34 44T56 44"/>':slot==='halo'?accessories[(n-1)%12]:habitats[(n-1)%12];
  return `<span class="orb-item-preview" data-slot="${slot}" data-design="${n}" style="--item-color:${color}"><svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${art}</svg></span>`;
}
export function strip(v, compact=false) {
  const r=v?.rewards;
  if(!r)return `<div class="orb-reward-offline"><span>Grow your companion</span><small>Open Orbiter or pair this website to earn discoveries.</small></div>`;
  const g=r.growth||growth(r.focusedMs||0), minutes=Math.ceil((1800000-(r.crateProgressMs||0))/60000);
  return `<button class="orb-crate-button ${r.chests?'is-ready':''}" data-reward-open aria-label="${r.chests?`Open ${r.chests} earned crates`:`Next crate in ${minutes} focus minutes`}">${crateArt()}<span>${r.chests?`${r.chests} ready`: `${minutes}m to crate`}</span></button><div class="orb-level"><div><strong>Lv. ${r.level}</strong><span>${r.xp%100}/100 XP</span></div><progress max="100" value="${r.xp%100}" aria-label="Progress to next level"></progress>${compact?'':`<small>${g.label} · ${g.nextAtMs?Math.ceil((g.nextAtMs-g.focusedMs)/60000)+'m to grow':'Your journey continues'}</small>`}</div><button class="orb-collection-button" data-reward-collection aria-label="Open discoveries collection">✧${compact?'':' Discoveries'}</button>`;
}
export function collection(v, slot='appearance') {
  return `<div class="orb-equipped-summary" aria-label="Equipped collection">${['appearance','halo','trail','habitat'].map(s=>`<span>${escape(v.catalog.find(c=>c.id===v.settings[s])?.name||'No '+s)}</span>`).join('')}</div><nav class="orb-collection-tabs" aria-label="Reward categories">${[['appearance','Looks'],['halo','Accessories'],['trail','Trails'],['habitat','Habitat']].map(([s,n])=>`<button data-slot-filter="${s}" aria-pressed="${slot===s}">${n}</button>`).join('')}</nav><div class="orb-collection-grid">${v.catalog.filter(c=>(c.slot||'appearance')===slot).map(c=>{const owned=v.rewards.owned.includes(c.id),equipped=v.settings[slot]===c.id;return `<button class="orb-collection-item" data-equip="${escape(c.id)}" data-slot="${slot}" data-owned="${owned}" data-rarity="${c.rarity}" aria-pressed="${equipped}">${preview(c)}<strong>${escape(c.name)}</strong><small>${equipped?'Equipped':owned?'Owned · preview':c.rarity+' · locked'}</small></button>`;}).join('')}</div>`;
}
export function equipmentPreview(v,item){const owned=v.rewards.owned.includes(item.id);return `<section class="orb-equipment-preview"><small>${owned?'TRY IT ON':'LOCKED · PREVIEW ONLY'}</small><h3>${escape(item.name)}</h3><div class="orb-preview-model" aria-label="Companion equipment preview"></div><p>${escape(item.rarity)} · ${owned?'Your discovery':'Earn crates through focus to discover this item.'}</p><div class="orb-preview-actions"><button data-preview-cancel>Cancel preview</button><button data-preview-equip ${owned?'':'disabled'}>Equip</button></div><p data-preview-status role="status"></p></section>`;}
export function recap(v) {
  const r=v?.latestRecap;if(!r)return '';
  const ms=Math.max(0,r.focusedMs||0),seconds=Math.floor(ms/1000),minutes=Math.floor(seconds/60);
  const duration=seconds<60?seconds+'s':minutes<60?minutes+'m':Math.floor(minutes/60)+'h'+(minutes%60?' '+minutes%60+'m':'');
  const g=r.growth||growth(0),next=r.rewardStatus==='pending'?'Growth updates after sync':g.nextAtMs?Math.max(0,Math.ceil((g.nextAtMs-g.focusedMs)/60000))+'m to grow':'Your journey continues';
  const rewards=r.rewardStatus==='pending'?'Rewards awaiting account confirmation':r.accountTotals?`${r.accountTotals.xp||0} total XP · ${r.accountTotals.crates||0} crates ready`:`+${r.xp||0} XP · ${r.crates||0} new crates`;
  return `<small>A LITTLE PROGRESS, RECORDED</small><h3>${escape(r.title||'Open focus')}</h3><div class="recap-metrics"><div><strong>${escape(duration)}</strong><small>actual focus</small></div><div><strong>${escape(g.label)}</strong><small>${escape(next)}</small></div></div><p>${escape(rewards)}</p>${r.examReductionMs!=null?`<p>${Math.floor(r.examReductionMs/1000)<60?Math.floor(r.examReductionMs/1000)+'s':Math.floor(r.examReductionMs/60000)+'m'} off your preparation budget</p>`:''}<div class="recap-actions"><button type="button" data-recap-done>Done</button>${r.taskId?'<button type="button" data-recap-task>Open task</button>':''}${v.rewards?.chests?'<button type="button" data-recap-crate>Open crate</button>':''}</div><p data-recap-status role="status"></p>`;
}
let recapCard=null,expandedRecap='',recapPage='desk';
function renderRecap() {
  if(!recapCard)return;
  recapCard.hidden=recapPage!=='desk'||!current?.latestRecap;if(!current?.latestRecap)return;
  const r=current.latestRecap;
  if(current.settings?.recapAck===r.sessionId&&expandedRecap!==r.sessionId){recapCard.innerHTML='<small>LATEST SESSION</small><h3></h3><button type="button" data-recap-review>View session</button>';recapCard.querySelector('h3').textContent=r.title||'Open focus';recapCard.querySelector('[data-recap-review]').onclick=()=>{expandedRecap=r.sessionId;renderRecap();};return;}
  recapCard.innerHTML=recap(current);
  recapCard.querySelector('[data-recap-done]')?.addEventListener('click',async()=>{try{if(window.OrbitDesktop)await action('ack-recap',{sessionId:current.latestRecap.sessionId});expandedRecap='';renderRecap();}catch(e){recapCard.querySelector('[data-recap-status]').textContent=String(e);}});
  recapCard.querySelector('[data-recap-task]')?.addEventListener('click',()=>window.OrbiterUI?.openTaskById(current.latestRecap.taskId));
  recapCard.querySelector('[data-recap-crate]')?.addEventListener('click',()=>open(false));
}
let current = null, card = null, dialog = null, busy = false, slot = 'appearance';
function render() {
  if(!card)return;
  if(!current&&dialog?.open){window.OrbiterCats?.cancelPreview();dialog.close();}
  card.innerHTML=strip(current);
  renderRecap();
  card.querySelector('[data-reward-open]')?.addEventListener('click',()=>open(false));
  card.querySelector('[data-reward-collection]')?.addEventListener('click',()=>open(true));
  if(dialog?.open&&dialog.dataset.view==='collection')renderCollection();
}
async function action(type,args={}) {
  if(!window.OrbitDesktop)return window.OrbiterCloud.rewardAction(type,args);
  return window.OrbitDesktop.actionResult(type,args);
}
function renderCollection() {
  window.OrbiterCats?.cancelPreview();
  dialog.dataset.view='collection';
  dialog.querySelector('.orb-reward-content').innerHTML=collection(current,slot);
  const portrait=new Image();portrait.className='orb-equipped-portrait';portrait.alt='Your equipped collection';portrait.src=window.OrbiterCats?.portrait(window.OrbiterCats.main(),current.rewards.focusedMs,current.settings)||'';dialog.querySelector('.orb-equipped-summary').prepend(portrait);
  bindCollection(dialog.querySelector('.orb-reward-content'));
}
function bindCollection(host) {
  host.querySelectorAll('[data-slot-filter]').forEach(b=>b.onclick=()=>{slot=b.dataset.slotFilter;renderCollection();});
  host.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{const item=current.catalog.find(c=>c.id===b.dataset.equip);dialog.dataset.view='preview';host.innerHTML=equipmentPreview(current,item);window.OrbiterCats?.previewEquipment(host.querySelector('.orb-preview-model'),{[item.slot]:item.id});host.querySelector('[data-preview-cancel]').onclick=renderCollection;host.querySelector('[data-preview-equip]').onclick=async()=>{try{await action('settings',{[item.slot]:item.id});renderCollection();}catch(e){message(e);}};});
}
function message(text) {dialog.querySelector('.orb-reward-status').textContent=String(text);}
async function open(collectionOnly) {
  if(!current){return;}
  dialog.showModal();message('');
  if(collectionOnly){renderCollection();return;}
  dialog.dataset.view='reveal';
  const host=dialog.querySelector('.orb-reward-content');host.innerHTML=crateArt();
  if(!current.rewards.chests){host.innerHTML=`${crateArt()}<h3>A little more momentum.</h3><p>${Math.ceil((1800000-current.rewards.crateProgressMs)/60000)} focused minutes to your next crate.</p>`;return;}
  if(busy)return;busy=true;
  try {
    host.classList.add('orb-opening');
    const result=await action('chest');
    const reward=result?.reward;

    if(!dialog.open)return;
    host.classList.remove('orb-opening');
    host.innerHTML=reward?`${preview(reward)}<small class="orb-rarity">${escape(reward.rarity)}</small><h3>${escape(reward.name)}</h3>${reward.id?'<button class="primary" data-reveal-equip>Equip discovery</button>':'<p>A new light in your constellation.</p>'}`:'<p>Your discovery is saved in the collection.</p>';
    host.querySelector('[data-reveal-equip]')?.addEventListener('click',async()=>{try{await action('settings',{[reward.slot]:reward.id});message('Equipped');}catch(e){message(e);}});
    window.OrbiterCats?.celebrate();
  }catch(e){message(e);}finally{busy=false;host.classList.remove('orb-opening');}
}
function init() {
  const hero=document.getElementById('now-card');if(!hero)return;
  card=document.createElement('section');card.className='orb-reward-dashboard';card.hidden=hero.hidden;card.setAttribute('aria-label','Companion progress');hero.append(card);
  dialog=document.createElement('dialog');dialog.className='orb-reward-dialog';dialog.innerHTML='<header><div><small>YOUR LITTLE UNIVERSE</small><h2>Discoveries</h2></div><button aria-label="Close discoveries">×</button></header><div class="orb-reward-content"></div><p class="orb-reward-status" role="status"></p><details><summary>How discoveries work</summary><p>Every 30 focused minutes earns a crate. Common 70% · Rare 25% · Mythic 5%. Only unowned items; unavailable tiers redistribute. Complete collections earn constellation stars.</p></details>';
  (document.getElementById('native-planner')||document.body).append(dialog);dialog.querySelector('header button').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>window.OrbiterCats?.cancelPreview());
  recapCard=document.createElement('section');recapCard.className='orb-session-recap';recapCard.setAttribute('aria-label','Latest focus session');recapCard.hidden=true;hero.after(recapCard);
  render();
}
window.addEventListener('orbiter-native-state',e=>{current=e.detail;render();if(!window.__TAURI__)window.OrbiterUI?.refreshCat();});
window.addEventListener('orbiter-workspace-rendered',e=>{recapPage=e.detail.page;if(card)card.hidden=e.detail.page!=='desk';renderRecap();});
document.addEventListener('DOMContentLoaded',()=>{current=window.OrbiterNativeState||null;init();});
window.OrbiterRewards={growth,strip,preview,collection,crateArt,recap,equipmentPreview};
