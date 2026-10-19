(()=>{
/* Review implementation: a filled, continuous water lens becomes the glass background.
 * Incoming tab content shares the water boundary; it never scales or refracts.
 * Popup forms remain immediate. Only pond imagery is sampled. */
const durations={button:220,tab:350,popup:900,close:500,page:1000,scene:1000,crate:600};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let active=null,frame=0,lastTrigger=null,pending=null,booted=false,suppressedUntil=0;
const overlay=document.createElement('div'),edge=document.createElement('canvas'),water=document.createElement('canvas'),snapshot=document.createElement('canvas');
overlay.id='pond-morph-edge';overlay.setAttribute('aria-hidden','true');overlay.append(edge);
water.className='pond-surface';water.setAttribute('aria-hidden','true');
// Buddy's direct-child grid rules must never turn decoration into a layout row.
water.style.cssText='position:absolute!important;pointer-events:none!important;z-index:0!important';
edge.style.cssText='position:absolute;inset:0;z-index:1;pointer-events:none';
const ec=edge.getContext('2d'),wc=water.getContext('2d'),sc=snapshot.getContext('2d');
const metrics={frames:0,completed:0,cancelled:0,meanDrawMs:0,maxDrawMs:0,captures:0,surfaceFrames:0,lastError:null};
let cost=0;
const stills=new Map();
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>1-(1-clamp(t))**3;
const box=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
function quiet(){return document.hidden||reduced.matches||Number(document.body.dataset.motionIntensity??70)===0||['calm','quiet','reduced-motion'].some(c=>document.body.classList.contains(c));}
function settle(reason='finished'){
  cancelAnimationFrame(frame);frame=0;pending=null;
  if(active){active.target?.classList.remove('pond-forming','pond-settled');active.target?.style.removeProperty('--orbiter-morph-resting');active.target?.style.removeProperty('--orbiter-morph-border');active.ghost?.remove();metrics[reason==='finished'?'completed':'cancelled']++;}
  for(const entry of active?.reveal||[]){if(entry.clip)entry.node.style.setProperty('clip-path',entry.clip,entry.priority);else entry.node.style.removeProperty('clip-path');}
  water.style.opacity='';
  water.remove();overlay.remove();try{if(overlay.matches(':popover-open'))overlay.hidePopover();}catch{}
  active=null;
}
function capture(target){
  snapshot.width=Math.min(1024,innerWidth);snapshot.height=Math.round(snapshot.width*innerHeight/innerWidth);
  sc.fillStyle='#18334c';sc.fillRect(0,0,snapshot.width,snapshot.height);
  const shadow=target?.getRootNode?.();const buddy=shadow instanceof ShadowRoot?shadow:document.querySelector('orbiter-buddy:not([hidden])')?.shadowRoot;
  const surface=document.body.dataset.nativeMode==='buddy'&&buddy?buddy.querySelector('.island-water'):document.getElementById('pond-background');
  const pond=surface?.querySelector('canvas');
  try{if(pond?.width){sc.drawImage(pond,0,0,snapshot.width,snapshot.height);metrics.captures++;return;}}catch{}
  const url=(surface?getComputedStyle(surface).backgroundImage:'').match(/url\(["']?(.*?)["']?\)/)?.[1];
  if(url){let image=stills.get(url);if(!image){image=new Image();image.onload=()=>{if(active)capture(active.target);};image.src=url;stills.set(url,image);}if(image.complete&&image.naturalWidth){const ratio=Math.max(snapshot.width/image.width,snapshot.height/image.height);sc.drawImage(image,(snapshot.width-image.width*ratio)/2,(snapshot.height-image.height*ratio)/2,image.width*ratio,image.height*ratio);}}
}
function pathAt(a,t,vertices){
  const r=a.rect,u=clamp(t/.69),progress=a.kind==='close'?1-ease(t):u*u*(3-2*u),radius=mix(Math.min(r.width,r.height)*.48,Math.min(30,r.width/2,r.height/2),progress),p=new Path2D();
  const ox=clamp(a.origin.x-r.x,24,r.width-24),oy=clamp(a.origin.y-r.y,24,r.height-24);
  // Corresponding perimeter vertices preserve identity from lens to rounded glass.
  for(let corner=0;corner<4;corner++)for(let i=0;i<=16;i++){
    // Traverse top-right, bottom-right, bottom-left, top-left clockwise.
    const start=-Math.PI/2+corner*Math.PI/2,theta=start+i/16*Math.PI/2;
    const centers=[[r.width-radius,radius],[r.width-radius,r.height-radius],[radius,r.height-radius],[radius,radius]];
    const [px,py]=centers[corner];
    const sx=ox+Math.cos(theta)*26,sy=oy+Math.sin(theta)*16;
    const wave=Math.sin(theta*3-t*10)*Math.sin(Math.PI*progress)*9;
    const x=mix(sx,px+Math.cos(theta)*radius,progress)+Math.cos(theta)*wave;
    const y=mix(sy,py+Math.sin(theta)*radius,progress)+Math.sin(theta)*wave;
    vertices?.push([x,y]);
    corner===0&&i===0?p.moveTo(x,y):p.lineTo(x,y);
  }
  p.closePath();return p;
}
function ripple(a,t){
  const {x,y}=a.origin;
  for(let i=0;i<2;i++){const u=clamp((t-i*.14)/(1-i*.14));ec.beginPath();ec.ellipse(x,y,mix(6,Math.max(28,a.rect.width*.45),ease(u)),mix(4,Math.max(15,a.rect.height*.3),ease(u)),0,0,Math.PI*2);ec.strokeStyle=`rgba(178,227,242,${(1-u)*.5})`;ec.lineWidth=1.2;ec.stroke();}
}
function render(a,t){
  const r=a.rect,ratio=edge.width/innerWidth;ec.setTransform(ratio,0,0,ratio,0,0);ec.clearRect(0,0,innerWidth,innerHeight);
  if(a.kind==='button'){ripple(a,t);return;}
  const low=document.body.dataset.effectQuality==='low';
  const vertices=[],shape=pathAt(a,t,vertices),settling=ease((t-.48)/.52),closing=a.kind==='close';
  // Exactly the same perimeter drives the real HTML reveal and the water fill.
  // Clip each child in its own coordinates so navigation can remain visible.
  for(const entry of a.reveal){const b=entry.node.getBoundingClientRect(),dx=b.x-r.x,dy=b.y-r.y;entry.node.style.clipPath='polygon('+vertices.map(([x,y])=>`${(x-dx).toFixed(2)}px ${(y-dy).toFixed(2)}px`).join(',')+')';}
  wc.setTransform(water.width/r.width,0,0,water.height/r.height,0,0);wc.clearRect(0,0,r.width,r.height);wc.save();wc.clip(shape);
  const light=document.body.dataset.preset==='opal-dawn'?'190,221,239':document.body.dataset.preset==='lunar-mist'?'186,199,242':'143,214,235';
  wc.fillStyle='#214461';wc.fillRect(0,0,r.width,r.height);
  // A few refracted strips create a moving filled wave, with no DOM screenshot.
  const waveStrength=closing?ease(t):1-settling;
  for(let y=0;y<r.height;y+=4){const dy=Math.sin(y*.024-t*8)*7*waveStrength;wc.globalAlpha=(low?.16:.52)*waveStrength;wc.drawImage(snapshot,(r.x+dy)/innerWidth*snapshot.width,(r.y+y)/innerHeight*snapshot.height,r.width/innerWidth*snapshot.width,4/innerHeight*snapshot.height,0,y,r.width,4);}
  wc.globalAlpha=1;
  const fill=wc.createLinearGradient(0,r.height,0,0);fill.addColorStop(0,`rgba(29,67,91,${.64*waveStrength})`);fill.addColorStop(.68,`rgba(${light},${.20*waveStrength})`);fill.addColorStop(1,'rgba(183,225,240,.04)');wc.fillStyle=fill;wc.fillRect(0,0,r.width,r.height);
  wc.globalAlpha=closing?1-ease(t):settling;wc.fillStyle=a.background;wc.fillRect(0,0,r.width,r.height);wc.globalAlpha=1;
  // Moving reflection follows the newly formed surface boundary, not the text.
  wc.strokeStyle=`rgba(${light},${.6*(1-settling)})`;wc.lineWidth=3;wc.stroke(shape);wc.restore();metrics.surfaceFrames++;
  // Restore the final CSS surface underneath the already full lens, then crossfade.
  const visibility=closing?1:['page','tab','scene'].includes(a.kind)?.58:.22;
  water.style.opacity=String(visibility*(closing?1:1-ease((t-.48)/.52)));
  if(!closing&&t>.78)a.target?.classList.add('pond-settled');
  const envelope=Math.sin(Math.PI*t),margin=Math.min(48,Math.min(r.width,r.height)*.18);
  ec.save();ec.beginPath();ec.roundRect(r.x-margin,r.y-margin,r.width+margin*2,r.height+margin*2,40);ec.clip();
  const outside=new Path2D();outside.rect(0,0,innerWidth,innerHeight);outside.roundRect(r.x+1,r.y+1,r.width-2,r.height-2,28);ec.clip(outside,'evenodd');
  // Soft perimeter mist stays within a 48 px band and never washes over fields.
  for(let i=0;i<12;i++){const side=i%4,along=(Math.floor(i/4)+.5)/3,drift=Math.sin(t*4+i)*6;
    const x=side===0?r.x-6:side===1?r.x+r.width+6:r.x+r.width*along+drift;
    const y=side===2?r.y-6:side===3?r.y+r.height+6:r.y+r.height*along+drift;
    const fog=ec.createRadialGradient(x,y,0,x,y,margin*1.8);fog.addColorStop(0,`rgba(${light},${envelope*.28})`);fog.addColorStop(1,'transparent');ec.fillStyle=fog;ec.fillRect(x-margin*2,y-margin*2,margin*4,margin*4);
  }
  ripple(a,t);ec.restore();
  ec.save();ec.beginPath();ec.roundRect(r.x,r.y,r.width,r.height,30);ec.strokeStyle=`rgba(${light},${ease((t-.55)/.25)*(1-ease((t-.9)/.1))*.32})`;ec.lineWidth=1;ec.stroke();ec.restore();
}
function tick(now){
  if(!active)return;if(active.target&&!active.target.isConnected){settle('removed');return;}if(quiet()){settle('quiet');return;}
  const a=active,t=(now-a.started)/a.duration;if(t>=1){settle();return;}
  if(now-a.last>=1000/30-.5){const start=performance.now();try{render(a,t);}catch(error){metrics.lastError=String(error);settle('graphics-error');return;}const ms=performance.now()-start;metrics.frames++;cost+=ms;metrics.meanDrawMs=cost/metrics.frames;metrics.maxDrawMs=Math.max(metrics.maxDrawMs,ms);a.last=now;}
  frame=requestAnimationFrame(tick);
}
function revealSurfaces(target){
  const entries=[];
  function visit(node){
    if(node.matches('.pond-surface,[data-pond-stationary]'))return;
    const style=getComputedStyle(node);
    if(style.display==='none')return;
    // Grid layout wrappers intentionally use display:contents in the real app.
    // They have no painted box, so clipping them does not clip their cards.
    if(style.display==='contents'){for(const child of node.children)visit(child);return;}
    const rect=node.getBoundingClientRect();if(!rect.width||!rect.height)return;
    entries.push({node,clip:node.style.getPropertyValue('clip-path'),priority:node.style.getPropertyPriority('clip-path')});
  }
  for(const node of target.children)visit(node);
  return entries;
}
function play({kind='popup',target,rect,origin,duration}={}){
  settle('replaced');
  if(target?.tagName==='ORBITER-BUDDY')target=target.shadowRoot?.getElementById('island')||target;
  const scope=target?.getRootNode?.();if(scope instanceof ShadowRoot&&!scope.querySelector('[data-pond-motion]')){const style=document.createElement('style');style.dataset.pondMotion='';style.textContent="/* Tab content is revealed by the water boundary; text never scales or refracts.\n * Navigation stays visible. Popup forms remain immediately usable. */\n.pond-forming{isolation:isolate;background:transparent!important;border-color:transparent!important;box-shadow:none!important}\n.pond-forming.pond-settled{background:var(--orbiter-morph-resting)!important;border-color:var(--orbiter-morph-border)!important}\n.pond-forming>:not(.pond-surface):not(.island-water){position:relative;z-index:1}\n.pond-forming>.pond-surface{position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;pointer-events:none;z-index:0}\n.pond-forming{position:relative}\ndialog.pond-forming{position:fixed}\n#pond-morph-edge,#pond-morph-edge:popover-open{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;padding:0!important;border:0!important;margin:0!important;max-width:none!important;max-height:none!important;background:transparent!important;pointer-events:none!important;overflow:hidden!important;z-index:2147483646!important}\n#pond-morph-edge::backdrop{background:transparent;pointer-events:none}\n#pond-morph-edge canvas{width:100%;height:100%;display:block}\n.pond-evaporating{position:fixed;pointer-events:none;border:1px solid #bdddeb44;border-radius:30px;z-index:1000;overflow:hidden}\n.pond-evaporating canvas{width:100%;height:100%;display:block}\n@media(prefers-reduced-motion:reduce){#pond-morph-edge{display:none!important}}\n";scope.append(style);}
  if(!target&&!rect)return false;
  if(quiet()||performance.now()<suppressedUntil||!wc||!ec)return false;
  const r=box(rect||target.getBoundingClientRect());if(r.width<2||r.height<2)return false;
  const point=origin||(lastTrigger&&performance.now()-lastTrigger.time<1000?lastTrigger.point:{x:r.x+r.width*.5,y:r.y+r.height});
  let ghost=null,background=target?getComputedStyle(target).backgroundColor:'rgba(26,48,70,.94)';
  if(kind!=='button'&&kind!=='close'){target.style.setProperty('--orbiter-morph-resting',getComputedStyle(target).background);target.style.setProperty('--orbiter-morph-border',getComputedStyle(target).borderColor);target.classList.add('pond-forming');}
  // Paint above nested opaque panels and native stacking contexts. The same
  // perimeter still clips incoming HTML; this layer never handles input.
  if(kind!=='button'){
    Object.assign(water.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});
    overlay.prepend(water);
  }
  const scale=Math.min(devicePixelRatio||1,1.25,1024/r.width);water.width=Math.max(1,Math.round(r.width*scale));water.height=Math.max(1,Math.round(r.height*scale));
  edge.width=Math.round(innerWidth*Math.min(1,1280/innerWidth));edge.height=Math.round(edge.width*innerHeight/innerWidth);capture(target);document.body.append(overlay);
  if(overlay.showPopover){overlay.setAttribute('popover','manual');overlay.showPopover();}
  const reveal=['page','tab'].includes(kind)&&target?revealSurfaces(target):[];
  const low=document.body.dataset.effectQuality==='low';active={kind,target,ghost,background,reveal,rect:r,origin:point,duration:duration??(low&&kind!=='button'?180:durations[kind]),started:performance.now(),last:-Infinity};
  window.OrbiterScene?.disturb?.({x:point.x,y:point.y,strength:kind==='button'?.25:.65});render(active,.001);frame=requestAnimationFrame(tick);return true;
}
function start(){
  if(booted)return;booted=true;
  document.addEventListener('click',event=>{const button=event.composedPath().find(n=>n?.matches?.('button'));if(!button||button.disabled)return;const scope=button.getRootNode();if(scope instanceof ShadowRoot&&scope.host.tagName==='ORBITER-BUDDY'&&['settings','back','reward-back','planner','maximize','cat','close','minimize','discoveries'].includes(button.id)){pending=null;return;}suppressedUntil=0;const r=button.getBoundingClientRect();lastTrigger={time:performance.now(),point:event.detail?{x:event.clientX,y:event.clientY}:{x:r.x+r.width/2,y:r.y+r.height/2}};const token={};pending=token;requestAnimationFrame(()=>{if(pending===token)play({kind:'button',rect:r,origin:lastTrigger.point});});},true);
  const bound=new WeakSet();
  function bindDialog(dialog){if(bound.has(dialog))return;bound.add(dialog);let open=dialog.open,rect=null;
    new MutationObserver(()=>{if(open===dialog.open)return;open=dialog.open;if(open){rect=box(dialog.getBoundingClientRect());play({kind:'popup',target:dialog});}else if(rect&&!window.OrbiterSuspendedDialogs?.has(dialog)){play({kind:'close',rect});rect=null;}else settle('dialog-suspended');}).observe(dialog,{attributes:true,attributeFilter:['open']});
  }
  document.querySelectorAll('dialog').forEach(bindDialog);
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1||node===overlay||node===water)continue;if(node.matches('dialog'))bindDialog(node);node.querySelectorAll('dialog').forEach(bindDialog);}}).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){suppressedUntil=performance.now()+120;settle('escape');}},true);
  for(const event of ['resize','blur','orbiter-mode-change'])addEventListener(event,()=>settle(event));
  // Focus/scrollIntoView and navigation's scrollTo can dispatch a queued scroll
  // after the effect starts. Cancel only if its actual destination has moved.
  addEventListener('scroll',()=>{if(!active)return;const r=active.target?.getBoundingClientRect();if(!r||Math.abs(r.x-active.rect.x)>1||Math.abs(r.y-active.rect.y)>1)settle('scroll');},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle('hidden');});reduced.addEventListener('change',()=>settle('reduced'));
  document.addEventListener('focusin',event=>{if(active?.reveal.some(entry=>entry.node.contains(event.target)))settle('focus');});
}
const stats=()=>({...metrics,pondCaptures:metrics.captures,timings:{...durations},active:!!active,kind:active?.kind,duration:active?.duration,overlayCount:overlay.isConnected?1:0,temporarySurfaces:document.querySelectorAll('.pond-forming,.pond-evaporating').length,webglContexts:0,bufferBytes:4*(edge.width*edge.height+water.width*water.height+snapshot.width*snapshot.height)});
window.OrbiterLake={play,cancel:settle,start,stats};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

})();

