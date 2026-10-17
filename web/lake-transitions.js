/* Pond-to-glass presentation only. Never reads form content or delays an action. */
(() => {
  const timings = {button:220, tab:350, popup:900, close:500, page:1000, scene:1000, crate:600};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let layer, canvas, context, reflection, reflectionContext, active=null, frame=0;
  let lastTrigger=null, pendingButton=null, serial=0, blockedUntil=0, booted=false;
  let frames=0, totalMs=0, maxMs=0, completed=0, cancelled=0, captures=0, lastKind=null, lastError=null;
  const images=new Map(), dialogs=new WeakMap();
  const box = r => ({x:r.x??r.left,y:r.y??r.top,width:r.width,height:r.height});
  const center = r => ({x:r.x+r.width/2,y:r.y+r.height/2});
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const mix = (a,b,t) => a+(b-a)*t;
  const ease = t => 1-Math.pow(1-clamp(t,0,1),3);
  function calm() {
    return document.hidden || reduced.matches || Number(document.body?.dataset.motionIntensity??70)===0 ||
      ['reduced-motion','calm','quiet'].some(c=>document.body?.classList.contains(c));
  }
  function stop(reason='interrupted') {
    if(frame)cancelAnimationFrame(frame);frame=0;
    if(active){active.fallback?.classList.remove('lake-edge-fallback');cancelled+=reason!=='finished';completed+=reason==='finished';}
    active=null;
    if(layer){try{if(layer.matches(':popover-open'))layer.hidePopover();}catch{}layer.remove();}
    if(context&&canvas)context.clearRect(0,0,canvas.width,canvas.height);
  }
  function cancel(reason){pendingButton=null;stop(reason);}
  function ensure() {
    if(layer)return !!context;
    layer=document.createElement('div');layer.id='orbiter-lake-transition';layer.setAttribute('aria-hidden','true');
    canvas=document.createElement('canvas');layer.append(canvas);context=canvas.getContext('2d',{alpha:true});
    reflection=document.createElement('canvas');reflectionContext=reflection.getContext('2d',{alpha:false});
    return !!context;
  }
  function pondSurface(target) {
    const shadow=target?.getRootNode?.();
    const buddy=shadow instanceof ShadowRoot?shadow:document.querySelector('orbiter-buddy:not([hidden])')?.shadowRoot;
    if(document.body.dataset.nativeMode==='buddy'&&buddy)return buddy.querySelector('.island-water');
    return document.getElementById('pond-background');
  }
  function capture(surface) {
    const scale=Math.min(1,1024/innerWidth,720/innerHeight);
    reflection.width=Math.max(1,Math.round(innerWidth*scale));reflection.height=Math.max(1,Math.round(innerHeight*scale));
    reflectionContext.fillStyle='#18344c';reflectionContext.fillRect(0,0,reflection.width,reflection.height);
    const source=surface?.querySelector('canvas');
    try{if(source?.width&&source?.height){reflectionContext.drawImage(source,0,0,reflection.width,reflection.height);captures++;return;}}catch{}
    const background=surface&&getComputedStyle(surface).backgroundImage;
    const url=background?.match(/url\(["']?(.*?)["']?\)/)?.[1];
    if(url){let image=images.get(url);if(!image){image=new Image();image.onload=()=>{if(active?.surface===surface)capture(surface);};image.src=url;images.set(url,image);}if(image.complete&&image.naturalWidth){const ratio=Math.max(reflection.width/image.width,reflection.height/image.height);reflectionContext.drawImage(image,(reflection.width-image.width*ratio)/2,(reflection.height-image.height*ratio)/2,image.width*ratio,image.height*ratio);}}
  }
  function roundPath(r,radius) {
    const p=new Path2D();p.roundRect(r.x,r.y,Math.max(1,r.width),Math.max(1,r.height),Math.min(radius,r.width/2,r.height/2));return p;
  }
  function rings(a,t,alpha) {
    const c=context,o=a.origin,b=a.rect;
    for(let i=0;i<2;i++){
      const u=clamp((t-i*.12)/(1-i*.12),0,1),rx=mix(8,Math.max(24,b.width*.7),ease(u)),ry=mix(5,Math.max(15,b.height*.8),ease(u));
      c.beginPath();c.ellipse(o.x,o.y,rx,ry,0,0,Math.PI*2);c.strokeStyle=`rgba(${a.light},${alpha*(1-u)*.85})`;c.lineWidth=i?1:1.7;c.stroke();
    }
  }
  function draw(a,t) {
    const c=context,ratio=canvas.width/innerWidth;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,innerWidth,innerHeight);
    const amount=clamp(Number(document.body.dataset.motionIntensity??70)/70,.2,1.2);
    const envelope=Math.pow(Math.sin(Math.PI*t),.7)*amount;
    if(a.kind==='button'){rings(a,t,Math.min(1,envelope));return;}
    const r=a.rect,to=center(r),closing=a.kind==='close';
    const grow=closing?1-ease(t):ease(t/.63),spread=a.kind==='tab'?15:32;
    const shape={x:mix(a.origin.x-24,r.x-spread,grow),y:mix(a.origin.y-16,r.y-spread*.6,grow),width:mix(48,r.width+spread*2,grow),height:mix(32,r.height+spread*1.2,grow)};
    c.save();c.clip(roundPath(shape,mix(25,34,grow)));
    // Punch out the destination's interior: water never refracts or hides form text.
    const safe=new Path2D();safe.rect(0,0,innerWidth,innerHeight);
    safe.roundRect(r.x,r.y,Math.max(1,r.width),Math.max(1,r.height),28);
    c.clip(safe,'evenodd');
    c.globalAlpha=envelope*.38;c.drawImage(reflection,0,0,innerWidth,innerHeight);c.globalAlpha=1;
    const glow=c.createRadialGradient(a.origin.x,a.origin.y,0,to.x,to.y,Math.max(r.width,r.height)*.9);
    glow.addColorStop(0,`rgba(${a.light},${envelope*.30})`);glow.addColorStop(.65,`rgba(${a.mist},${envelope*.12})`);glow.addColorStop(1,'transparent');
    c.fillStyle=glow;c.fillRect(0,0,innerWidth,innerHeight);
    c.strokeStyle=`rgba(${a.light},${envelope*.34})`;c.lineWidth=1;c.stroke(roundPath(shape,34));
    c.restore();
    // Continuous soft mist curls along the outside edge, parting away from the glass.
    c.save();const edgeClip=new Path2D();edgeClip.rect(0,0,innerWidth,innerHeight);edgeClip.roundRect(r.x+4,r.y+4,Math.max(1,r.width-8),Math.max(1,r.height-8),25);c.clip(edgeClip,'evenodd');
    const radius=clamp(Math.min(r.width,r.height)*.34,38,135);
    for(let i=0;i<8;i++){
      const side=i%4,along=(Math.floor(i/4)+.35)/2,drift=Math.sin(t*3.4+i*1.3)*12;
      const x=side===0?r.x-10-ease(t)*28:side===1?r.x+r.width+10+ease(t)*28:r.x+r.width*along+drift;
      const y=side===2?r.y-8-ease(t)*24:side===3?r.y+r.height+8+ease(t)*24:r.y+r.height*along+drift;
      const fog=c.createRadialGradient(x,y,0,x,y,radius);fog.addColorStop(0,`rgba(${a.mist},${envelope*.26})`);fog.addColorStop(.4,`rgba(${a.mist},${envelope*.12})`);fog.addColorStop(1,'transparent');
      c.fillStyle=fog;c.fillRect(x-radius,y-radius,radius*2,radius*2);
    }
    rings(a,t,envelope*.42);c.restore();
  }
  function tick(now) {
    if(!active||calm()){stop('hidden-or-calm');return;}
    const a=active,elapsed=now-a.started;
    if(elapsed>=a.duration){stop('finished');return;}
    if(now-a.lastFrame>=1000/30-.5){const began=performance.now();try{draw(a,Math.max(.001,elapsed/a.duration));}catch(error){lastError=String(error);stop('graphics-failure');return;}a.lastFrame=now;frames++;const cost=performance.now()-began;totalMs+=cost;maxMs=Math.max(maxMs,cost);}
    frame=requestAnimationFrame(tick);
  }
  function play({kind='popup',target,rect,origin,duration}={}) {
    pendingButton=null;stop('replaced');
    if(calm()||performance.now()<blockedUntil||!ensure())return false;
    const r=box(rect||target?.getBoundingClientRect?.()||{x:24,y:80,width:innerWidth-48,height:innerHeight-110});
    if(!r.width||!r.height||r.y>innerHeight||r.y+r.height<0)return false;
    const captured=lastTrigger&&performance.now()-lastTrigger.time<1300?lastTrigger.origin:null;
    const source=origin||captured||center(r);
    const p={x:clamp(source.x,0,innerWidth),y:clamp(source.y,0,innerHeight)};
    const preset=document.body.dataset.preset||'tidal-night';
    const colors=preset==='opal-dawn'?['174,224,235','216,219,242']:preset==='lunar-mist'?['184,203,244','213,219,244']:['151,217,235','193,217,241'];
    const scale=Math.min(1,1280/innerWidth,900/innerHeight);canvas.width=Math.max(1,Math.round(innerWidth*scale));canvas.height=Math.max(1,Math.round(innerHeight*scale));
    const surface=pondSurface(target);capture(surface);
    document.body.append(layer);
    let fallback=null;
    if(typeof layer.showPopover==='function'){layer.setAttribute('popover','manual');try{layer.showPopover();}catch{}}
    else if(target?.closest?.('dialog[open]')){fallback=target;target.classList.add('lake-edge-fallback');}
    active={kind,rect:r,origin:p,duration:duration??timings[kind]??900,started:performance.now(),lastFrame:-Infinity,light:colors[0],mist:colors[1],fallback,surface};lastKind=kind;
    if(document.body.dataset.effectQuality!=='low')window.OrbiterScene?.disturb?.({x:p.x,y:p.y,strength:kind==='button'?.25:.65});
    frame=requestAnimationFrame(tick);return true;
  }
  function bindDialog(dialog) {
    if(dialogs.has(dialog))return;
    const state={open:dialog.open,rect:dialog.open?box(dialog.getBoundingClientRect()):null};dialogs.set(dialog,state);
    new MutationObserver(()=>{
      if(state.open===dialog.open)return;state.open=dialog.open;
      if(dialog.open){state.rect=box(dialog.getBoundingClientRect());play({kind:'popup',target:dialog});}
      else if(state.rect&&!window.OrbiterSuspendedDialogs?.has(dialog)){play({kind:'close',rect:state.rect});state.rect=null;}
      else cancel('dialog-suspended');
    }).observe(dialog,{attributes:true,attributeFilter:['open']});
    if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(dialog.open)state.rect=box(dialog.getBoundingClientRect());}).observe(dialog);
  }
  function start() {
    if(booted)return;booted=true;
    document.querySelectorAll('dialog').forEach(bindDialog);
    new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1||node===layer)continue;if(node.matches('dialog'))bindDialog(node);node.querySelectorAll('dialog').forEach(bindDialog);}}).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',event=>{
      const button=event.composedPath().find(node=>node?.matches?.('button'));
      if(!button||button.disabled)return;
      blockedUntil=0; // A fresh activation supersedes an earlier Escape or mode interruption.
      const r=box(button.getBoundingClientRect()),origin=event.detail?{x:event.clientX,y:event.clientY}:center(r);
      lastTrigger={origin,time:performance.now(),serial:++serial};
      const shadow=button.getRootNode();
      if(shadow instanceof ShadowRoot&&shadow.host.tagName==='ORBITER-BUDDY'&&['settings','back','reward-back','planner','maximize','cat','close','minimize','discoveries'].includes(button.id)){pendingButton=null;return;}
      const request={serial,origin,rect:r};pendingButton=request;
      requestAnimationFrame(()=>{if(pendingButton===request){pendingButton=null;play({kind:'button',origin,rect:r});}});
    },true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){blockedUntil=performance.now()+120;cancel('escape');}},true);
    window.addEventListener('resize',()=>cancel('resize'));
    window.addEventListener('scroll',()=>cancel('scroll'),{passive:true});
    window.addEventListener('orbiter-mode-change',()=>cancel('mode'));
    window.addEventListener('blur',()=>cancel('blur'));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel('hidden');});
    reduced.addEventListener('change',()=>cancel('accessibility'));
    new MutationObserver(()=>{if(calm())cancel('preference');}).observe(document.body,{attributes:true,attributeFilter:['class','data-motion-intensity']});
  }
  window.OrbiterLake={play,cancel,start,stats:()=>({active:!!active,kind:active?.kind||lastKind,duration:active?.duration||0,frames,completed,cancelled,pondCaptures:captures,meanDrawMs:frames?totalMs/frames:0,maxDrawMs:maxMs,lastError,overlayCount:layer?.isConnected?1:0,bufferBytes:canvas?4*(canvas.width*canvas.height+reflection.width*reflection.height):0,webglContexts:0,timings:{...timings}})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
