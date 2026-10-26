/* Isolated visual/performance study; no application storage or preference writes. */
(() => {
 const mode=new URLSearchParams(location.search).get('mode')==='live'?'live':'lite';
 let contexts=0,ready=false,asset=null,error=null;const canvases=new WeakSet();
 const original=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,...args){const value=original.call(this,type,...args);if(value&&(type==='webgl'||type==='webgl2')&&!canvases.has(this)){canvases.add(this);contexts++;}return value;};
 document.getElementById(mode+'-link').setAttribute('aria-current','page');
 const sprite=document.getElementById('sprite');
 const updatePaused=()=>{sprite.dataset.paused=String(document.hidden||!inView);};
 let inView=true;
 document.addEventListener('visibilitychange',updatePaused);
 new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;updatePaused();}).observe(document.getElementById('kitten-host'));
 window.trialStats=()=>({mode,ready,error,webglContexts:contexts,asset,cat:mode==='live'?window.OrbiterCats?.stats():null});
 document.getElementById('respond').onclick=()=>{document.getElementById('interaction-status').textContent='Hello, little study companion.';};
 async function start(){try{
 if(mode==='lite'){
   asset=await(await fetch('assets/manifest.json')).json();
   const image=new Image();image.src='assets/kitten-idle.webp';await image.decode();
   if(image.naturalWidth!==asset.frame_width*asset.frames||image.naturalHeight!==asset.frame_height)throw Error('Sprite dimensions do not match its manifest.');
   sprite.style.backgroundImage='url("assets/kitten-idle.webp")';sprite.hidden=false;
   document.getElementById('mode-label').textContent='Pre-rendered kitten · still pond';
   document.getElementById('mode-detail').textContent='Blender renders the frames once. The browser plays the image strip without a WebGL scene.';
 }else{
   const script=document.createElement('script');script.src='../../build/companion-lite/live-cat.js';await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.append(script);});
   await window.OrbiterCats.ready;
   window.OrbiterCats.mount(document.getElementById('kitten-host'),0,{growthMs:7200000,equipment:{}});
   if(window.OrbiterCats.stats().error)throw Error(window.OrbiterCats.stats().error);
   document.getElementById('mode-label').textContent='Current live 3D kitten · animated pond';
   document.getElementById('mode-detail').textContent='The production kitten and pond controller, at their existing quality and frame limits.';
 }
 ready=true;
 }catch(e){error=e.message||String(e);document.getElementById('mode-detail').textContent='Trial unavailable: '+error;}}
 start();
})();
