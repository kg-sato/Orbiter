import * as THREE from 'three';
import {growth,lookColor} from './rewards.js';

// One context, shared geometry, and a reusable original procedural character.
const coats=['#f5e4cd','#343e54','#c6b5d8','#b4c9b4'];
const scarves=['#80a8c4','#cf9ba9','#a6cbb9','#a89acb'];
const sphere=new THREE.SphereGeometry(1,20,14);
const eyesMaterial=new THREE.MeshStandardMaterial({color:'#3a5160',roughness:.6});
const ivory=new THREE.MeshStandardMaterial({color:'#fff5de',roughness:.9});
const blush=new THREE.MeshStandardMaterial({color:'#e4aba5',roughness:.9});
// Share immutable materials. Each character owns its separately mutable scarf.
const materials=new Map();
const material=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.72}));return materials.get(color);};
function ball(parent,mat,pos,scale){const m=new THREE.Mesh(sphere,mat);m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m;}
function line(parent,points,color,radius=.018){const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,6,false);const m=new THREE.Mesh(g,material(color));parent.add(m);return m;}
export function traits(code){return {coat:code&3,ears:(code>>2)&3,scarf:(code>>4)&3,charm:(code>>6)&3};}
export function ensureProfiles(workspace){
 if(!workspace.study)return workspace;
 const names=new Set((workspace.study.courses||[]).map(c=>c.name));
 for(const t of workspace.study.tasks||[])if(t.course)names.add(t.course);
 for(const list of [workspace.template||[],...Object.values(workspace.weeks||{})])for(const e of list)if(e.course)names.add(e.course);
 const old=workspace.study.catProfiles||{};const profiles=Object.fromEntries(Object.entries(old));const used=new Set(Object.values(profiles));
 for(const name of [...names].sort())if(!Object.hasOwn(profiles,name)){
  let code=[...name].reduce((v,c)=>(v*31+c.codePointAt(0))>>>0,7)%256;
  while(used.has(code))code=(code+1)%65536;
  Object.defineProperty(profiles,name,{value:code,enumerable:true,writable:true,configurable:true});used.add(code);
 }
 workspace.study.catProfiles=profiles;return workspace;
}
function makeCat(code,equipment={},growthMs=0,stars=0){
 const p=traits(code),root=new THREE.Group(),head=new THREE.Group();
 const age=growth(growthMs).stage;
 root.add(head);head.position.y=[1.36,1.46,1.58,1.67][age];
 head.scale.setScalar([1.12,1.07,1.02,1][age]);
 const fur=material(coats[p.coat]),scarf=material(scarves[p.scarf]).clone();
 const body=ball(root,fur,[0,.60,0],[.51,.66,.40]);body.scale.y*=[.78,.86,.95,1][age];
 ball(root,ivory,[0,.62,.36],[.31,.33+.03*age,.05]);
 const skull=ball(head,fur,[0,0,0],[.85,.75,.61]);
 // Soft cheek volumes and a small muzzle give the face a tangible silhouette.
 for(const side of [-1,1])ball(head,fur,[side*.66,-.22,.40],[.21,.17,.105]);
 ball(head,ivory,[0,-.29,.566],[.24,.12,.035]);
 if(p.coat===1)ball(head,ivory,[0,-.18,.54],[.46,.32,.055]);
 if(p.coat===2){for(const x of [-.28,0,.28])line(head,[[x,.6,.34],[x*.8,.48,.49],[x*.6,.36,.56]],'#9383ae',.035);}
 if(p.coat===3)ball(head,material('#829e96'),[-.43,.10,.46],[.28,.36,.12]);
 const ears=[];
 for(const side of [-1,1]){
  const ear=new THREE.Group();ear.position.set(side*.60,.56,0);head.add(ear);ears.push(ear);
  if(p.ears===2){ball(ear,fur,[0,.17,0],[.26,.32,.20]);ball(ear,blush,[0,.18,.18],[.14,.20,.03]);}
  else {
   const shape=new THREE.Shape();shape.moveTo(-.27,0);shape.quadraticCurveTo(-.18,.52,0,.62);shape.quadraticCurveTo(.17,.47,.27,0);shape.closePath();
   const g=new THREE.ExtrudeGeometry(shape,{depth:.20,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.045,bevelThickness:.045});
   const mesh=new THREE.Mesh(g,fur);mesh.position.z=-.08;ear.add(mesh);
   const inner=new THREE.Mesh(g,blush);inner.scale.set(.55,.65,.12);inner.position.set(0,.06,.17);ear.add(inner);
   if(p.ears===1)ear.rotation.x=.7;
   if(p.ears===3)ball(ear,ivory,[side*.06,.60,.06],[.075,.15,.05]);
  }
 }
 const eyes=[];
 for(const side of [-1,1]){
  const eye=ball(head,eyesMaterial,[side*.30,-.06,.573],[.087,.118,.046]);eyes.push(eye);
  ball(eye,ivory,[-.23,.30,1],[.19,.18,.12]);
  ball(eye,material('#88aebb'),[.1,-.32,.85],[.40,.22,.15]);
  ball(eye,ivory,[.22,-.12,.97],[.065,.065,.065]);
  ball(head,blush,[side*.55,-.25,.49],[.15,.073,.025]);
 }
 ball(head,blush,[0,-.22,.62],[.055,.037,.025]);
 const mouth=new THREE.Group();head.add(mouth);
 line(mouth,[[-.13,-.34,.606],[-.08,-.39,.64],[0,-.365,.64],[.08,-.39,.64],[.13,-.34,.606]],'#926b78',.018);
 for(const side of [-1,1])for(const dy of [-.22,-.32])line(head,[[side*.67,dy,.43],[side*.90,dy-.03,.40]],'#bea2a4',.012);
 const neck=new THREE.Mesh(new THREE.TorusGeometry(.37,.075,8,28),scarf);neck.rotation.x=Math.PI/2;neck.position.y=1.05;root.add(neck);
 const bow=new THREE.Group();bow.position.set(0,1.02,.40);root.add(bow);
 if(p.scarf===0||p.scarf===3){for(const side of [-1,1])ball(bow,scarf,[side*.13,0,0],[.17,.11,.055]);ball(bow,material('#b3d6cb'),[0,0,.04],[.055,.065,.045]);}
 if(p.scarf===1)ball(bow,scarf,[0,-.13,0],[.22,.25,.04]);
 if(p.scarf===2){ball(bow,scarf,[.15,-.22,0],[.075,.34,.06]);line(bow,[[.09,-.4,.07],[.22,-.4,.07]],'#f0dcce',.02);}
 const paws=[];
 for(const side of [-1,1]){const paw=new THREE.Group();paw.position.set(side*.47,.60,.13);root.add(paw);ball(paw,fur,[0,-.12,.17],[.17,.24,.18]);paws.push(paw);ball(root,fur,[side*.25,.06,.15],[.22,.13,.25]);}
 const tail=new THREE.Group();root.add(tail);line(tail,[[.40,.40,-.10],[.95,.48,-.10],[1.07,.85,.05],[.87,1.0,.08]],coats[p.coat],.10);
 const charm=new THREE.Group();charm.position.set(.32,.92,.38);root.add(charm);
 const gold=material(equipment.halo==='halo-runes'?'#c8b5eb':'#e8c293');
 if(p.charm===0){const star=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.055:.12;i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();charm.add(new THREE.Mesh(new THREE.ExtrudeGeometry(star,{depth:.035,bevelEnabled:false}),gold));}
 if(p.charm===1){const m=new THREE.Mesh(new THREE.TorusGeometry(.085,.025,6,20,Math.PI*1.4),gold);m.rotation.z=.8;charm.add(m);}
 if(p.charm===2){const leaf=ball(charm,material('#a7c4a3'),[0,0,0],[.06,.13,.025]);leaf.rotation.z=.4;}
 if(p.charm===3){for(const x of [-.06,.06])ball(charm,blush,[x,-.04,0],[.065,.065,.04]);line(charm,[[-.06,0,0],[0,.15,0],[.06,0,0]],'#99bda2',.014);}
 if(equipment.halo==='halo-double')ball(charm,gold,[.15,0,0],[.045,.045,.025]);
 if(equipment.halo?.match(/^halo-\d/))addAccessory(root,head,bow,Number(equipment.halo.slice(-2)),gold,scarf);
 if(equipment.appearance && equipment.appearance!=='mint'){const colors={lilac:'#c8b5eb',opal:'#e6ddca',rose:'#e0b6c9',aurora:'#8ee4c8',eclipse:'#e9ba90',indigo:'#939ddd',singularity:'#aca0db',cultivation:'#ccd7a0'};scarf.color.set(colors[equipment.appearance]||scarves[p.scarf]);}
 if(equipment.appearance?.startsWith('look-')){scarf.color.set(lookColor(equipment.appearance));ball(head,material(lookColor(equipment.appearance)),[0,.45,.47],[.045,.075,.018]);}
 const habitat=new THREE.Group();root.add(habitat);habitat.position.y=-.02;
 // Growth adds a resting moon pool, then reeds and lanterns; earned scenes add unique props.
 if(age>0)ball(habitat,material('#799b9c'),[0,0,-.05],[.76,.045,.44]);
 if(age>1)for(const side of [-1,1])line(habitat,[[side*.8,0,-.2],[side*.87,.28,-.24],[side*.78,.42,-.22]],'#91b9a1',.018);
 if(age>2)ball(habitat,gold,[-.92,.38,-.24],[.08,.12,.08]);
 if(equipment.habitat)addHabitat(habitat,Number(equipment.habitat.slice(-2)),gold);
 for(let i=0;i<Math.min(stars,12);i++)ball(habitat,gold,[Math.cos(i*2.4)*1.0,.12+(i%3)*.11,Math.sin(i*2.4)*.35],[.022,.022,.022]);
 const particles=new THREE.Group();root.add(particles);
 for(let i=0;i<(equipment.trail==='trail-comet'?5:3);i++)ball(particles,material(i%2?'#c8b5eb':'#b4e6d5'),[Math.sin(i*2.4)*1.15,1.0+i*.36,-.1],[.027,.027,.027]);
 return {root,head,body,ears,eyes,paws,tail,bow,mouth,particles,code,age};
}
function addAccessory(root,head,bow,n,gold,scarf){
 const tint=material(lookColor('look-'+String(n).padStart(2,'0')));
 if(n===1){for(const side of [-1,1])ball(head,tint,[side*.13,.57,.48],[.15,.09,.045]);}
 else if(n===2){ball(bow,gold,[0,-.13,.10],[.07,.085,.06]);}
 else if(n===3){const moon=new THREE.Mesh(new THREE.TorusGeometry(.09,.022,6,18,Math.PI*1.5),gold);moon.position.set(-.52,.35,.49);head.add(moon);}
 else if(n===4){for(let i=0;i<4;i++)ball(bow,ivory,[(i-1.5)*.11,0,.04],[.08,.08,.05]);}
 else if(n===5){ball(root,tint,[-.42,.47,.41],[.17,.18,.07]);line(root,[[-.35,.6,.42],[.25,1,.4]],'#c9bcb4',.025);}
 else if(n===6){line(bow,[[-.06,.1,.1],[.16,-.12,.12],[.26,-.1,.1]],'#cdd8ed',.028);}
 else if(n===7){ball(root,tint,[0,.78,-.30],[.60,.42,.08]);}
 else if(n===8){for(let i=0;i<5;i++)ball(head,gold,[(i-2)*.14,.71,.24],[.055,.12-(i%2)*.04,.04]);}
 else if(n===9){ball(bow,gold,[0,-.14,.09],[.09,.13,.06]);ball(bow,ivory,[0,-.13,.15],[.025,.04,.015]);}
 else if(n===10){const compass=new THREE.Mesh(new THREE.TorusGeometry(.1,.016,6,20),gold);compass.position.set(0,-.12,.08);bow.add(compass);line(bow,[[-.07,-.2,.1],[.07,-.04,.1]],'#dcebe9',.016);}
 else if(n===11){for(const side of [-1,1])for(let i=0;i<3;i++)ball(bow,tint,[side*(.08+i*.08),-.10+i*.055,.08],[.055,.025,.025]);}
 else if(n===12){for(const side of [-1,1])for(let i=0;i<3;i++){const feather=ball(root,tint,[side*(.55+i*.09),.92-i*.10,-.04],[.13,.24,.045]);feather.rotation.z=side*.7;}}
}
function addHabitat(host,n,gold){
 const mat=material(lookColor('look-'+String(n).padStart(2,'0')));
 if(n===1){for(let i=0;i<3;i++)ball(host,mat,[(i-1)*.54,.05,-.30],[.15,.08,.12]);}
 else if(n===2||n===5||n===11){for(let i=0;i<(n===11?5:3);i++){const x=Math.cos(i*2.5)*.8;line(host,[[x,0,-.3],[x,.22,-.3]],'#99b899',.02);ball(host,mat,[x,.24,-.3],[.09,.035,.06]);}}
 else if(n===3||n===8){ball(host,mat,[0,.0,-.1],[.82,.08,.43]);}
 else if(n===4){line(host,[[-.83,0,-.2],[-.83,.64,-.2],[-.65,.64,-.2]],'#a0b4b0',.025);ball(host,gold,[-.64,.48,-.2],[.09,.14,.09]);}
 else if(n===6){for(let i=0;i<3;i++)ball(host,ivory,[(i-1)*.22,.10,-.30],[.23,.07,.15]);}
 else if(n===7){for(let i=0;i<3;i++){const crystal=new THREE.Mesh(new THREE.ConeGeometry(.09,.25+i*.06,5),mat);crystal.position.set(-.78+i*.12,.17,-.3);host.add(crystal);}}
 else if(n===9){ball(host,mat,[-.84,.18,-.25],[.16,.05,.16]);line(host,[[-.84,.0,-.25],[-.84,.30,-.25]],'#c8c5ad',.025);}
 else if(n===10||n===12){const ring=new THREE.Mesh(new THREE.TorusGeometry(.78,.025,6,40,n===12?Math.PI*2:Math.PI*1.5),mat);ring.rotation.x=Math.PI/2;ring.position.y=.08;host.add(ring);}
}
function disposeModel(cat){const geometries=new Set(),ownedMaterials=new Set();cat?.root.traverse(o=>{if(o.isMesh){if(o.geometry!==sphere)geometries.add(o.geometry);if(![eyesMaterial,ivory,blush,...materials.values()].includes(o.material))ownedMaterials.add(o.material);}});geometries.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());}
let renderer=null,scene=null,camera=null,cat=null,target=null,currentCode=null,equipment={},growthMs=0,starCount=0,frame=0,last=0,phase=0,visible=true,focus=false,paused=false,celebrateUntil=0,pet=false,tx=0,ty=0,x=0,y=0,pawUntil=0,pawSide=0,viewWidth=0,viewHeight=0,frames=0;
const portraits=new Map();let mainCode;
try{const old=Number(localStorage.getItem('orbiter.last-cat'));mainCode=(old+1+Math.floor(Math.random()*255))%256;localStorage.setItem('orbiter.last-cat',String(mainCode));}catch{mainCode=Math.floor(Math.random()*256);}
function calm(){return matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduced-motion')||document.body.classList.contains('calm')||document.body.classList.contains('quiet');}
function init(){
 if(renderer)return true;
 try{
  if(new URLSearchParams(location.search).has('noWebGL'))return false;
  // Portrait capture happens synchronously after render; retaining every GPU frame is unnecessary.
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.style.cssText='display:block;width:100%;height:100%;position:absolute;inset:0;pointer-events:none';
  scene=new THREE.Scene();scene.add(new THREE.HemisphereLight('#fff2df','#526985',1.8));const key=new THREE.DirectionalLight('#fff4df',2.2);key.position.set(-3,5,5);scene.add(key);const rim=new THREE.DirectionalLight('#b4c9eb',1.2);rim.position.set(3,3,-2);scene.add(rim);
  camera=new THREE.OrthographicCamera(-1.8,1.8,1.8,-1.8,.1,20);camera.position.set(0,1.55,7);camera.lookAt(0,1.35,0);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;target?.classList.remove('cat-3d-ready');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{target?.classList.add('cat-3d-ready');wake();});
  return true;
 }catch(e){renderer=null;console.warn('Cat uses static fallback:',e.message);return false;}
}
function setCat(code){if(cat && currentCode===code)return; if(cat){scene.remove(cat.root);disposeModel(cat);}cat=makeCat(code,equipment,growthMs,starCount);currentCode=code;scene.add(cat.root);}
function resize(){if(!target||!renderer)return;const r=target.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);if(w===viewWidth&&h===viewHeight)return;viewWidth=w;viewHeight=h;renderer.setSize(w,h,false);const a=w/h;camera.left=-1.8*a;camera.right=1.8*a;camera.updateProjectionMatrix();}
function draw(t){
 if(!renderer||!cat)return;
 const quiet=calm();const dt=Math.min(.08,Math.max(0,(t-last)/1000));last=t;
 const development=growth(growthMs),age=development.stage,next=Math.min(age+1,3),mix=development.progress;
 const blend=values=>values[age]+(values[next]-values[age])*mix;
 cat.head.position.y=blend([1.36,1.46,1.58,1.67]);cat.head.scale.setScalar(blend([1.12,1.07,1.02,1]));cat.body.scale.y=.66*blend([.78,.86,.95,1]);
 if(!quiet)phase+=dt;
 x+=(tx-x)*.15;y+=(ty-y)*.15;
 // Independent pose channels: attention never overwrites breathing or typing.
 const celebrating=!quiet && celebrateUntil>t;
 cat.body.scale.y*=quiet?1:1+Math.sin(phase*1.8)*.012;
 cat.root.position.y=quiet?0:Math.sin(phase*1.5)*(paused?.014:.028);
 cat.root.rotation.y=quiet?0:x*.075;
 cat.head.rotation.y=quiet?0:x*.25;
 cat.head.rotation.x=quiet?0:y*.12+(focus?-.035:0);
 cat.head.rotation.z=quiet?0:(paused?.085:pet?Math.sin(phase*7)*.045:Math.sin(phase)*.02);
 const blinkPhase=phase%6.3;
 const blink=quiet?1:pet?.18:blinkPhase>6.03?Math.max(.12,Math.abs((blinkPhase-6.165)/.135)):1;
 cat.eyes.forEach(e=>e.scale.y=.118*(celebrating?.65:blink));
 cat.mouth.scale.x=pet?1.16:celebrating?1.12:1;
 cat.ears.forEach((ear,i)=>{ear.rotation.z=quiet?0:(pet?(i?-.14:.14):x*.05+Math.sin(phase*1.4+i)*.025);});
 cat.tail.rotation.z=quiet?0:Math.sin(phase*(focus?2.2:paused?.65:1.3))*(pet?.12:.085);
 cat.tail.rotation.y=quiet?0:Math.sin(phase*.8)*.06;
 cat.paws.forEach((paw,i)=>{const stroke=!quiet&&i===pawSide&&t<pawUntil?Math.sin((1-(pawUntil-t)/320)*Math.PI):0;paw.position.y=.60+stroke*.23;paw.rotation.z=(i?1:-1)*(celebrating?.16:stroke*.13);});
 cat.bow.rotation.z=quiet?0:Math.sin(phase*1.8)*(pet?.05:.03);
 cat.particles.rotation.y=quiet?0:phase*(focus?.34:.11);cat.particles.visible=focus||celebrating||pet;
 if(celebrating)cat.root.position.y+=Math.abs(Math.sin((celebrateUntil-t)*.01))*.14;
 frames++;renderer.render(scene,camera);
}
function loop(t){frame=0;if(!target||document.hidden||!visible)return;if(t-last>=1000/30){resize();draw(t);}if(!calm())frame=requestAnimationFrame(loop);}
function wake(){if(!target||document.hidden||!visible)return;if(!frame)frame=requestAnimationFrame(loop);}
export function mount(host,code=mainCode,options={}){
 if(target!==host){target?.classList.remove('cat-3d-ready');target=host;}
 if(!host){cancelAnimationFrame(frame);frame=0;return;}
 focus=!!options.focus;paused=!!options.paused;equipment=options.equipment||{};growthMs=options.growthMs||0;starCount=options.stars||0;
 const key=JSON.stringify([equipment.appearance,equipment.halo,equipment.trail,equipment.habitat,growth(growthMs).stage,Math.min(starCount,12)]);if(cat?.equipmentKey!==key){currentCode=null;}
 if(!init()){host.dataset.catFallback='true';return;}
 if(getComputedStyle(host).position==='static')host.style.position='relative';host.append(renderer.domElement);host.classList.add('cat-3d-ready');setCat(code);cat.equipmentKey=key;resize();draw(performance.now());visible=true;wake();
}
export function portrait(code,ms=0){
 const cacheKey=code+":"+growth(ms).stage;
 if(portraits.has(cacheKey))return portraits.get(cacheKey);
 if(!init())return null;
 const saved=currentCode,savedEquipment=equipment,savedGrowth=growthMs,savedStars=starCount;equipment={};growthMs=ms;starCount=0;currentCode=null;setCat(code);renderer.setSize(180,180,false);camera.left=-1.8;camera.right=1.8;camera.updateProjectionMatrix();draw(performance.now());
 const url=renderer.domElement.toDataURL('image/png');if(portraits.size>=64)portraits.delete(portraits.keys().next().value);portraits.set(cacheKey,url);equipment=savedEquipment;growthMs=savedGrowth;starCount=savedStars;currentCode=null;if(saved!==null)setCat(saved);viewWidth=viewHeight=0;resize();return url;
}
export function main(){return mainCode;}
export function celebrate(){celebrateUntil=performance.now()+1000;wake();}
export function setVisible(v){visible=v;if(v)wake();else{cancelAnimationFrame(frame);frame=0;}}
export function stats(){return {frames,contexts:renderer?1:0,profile:currentCode,age:cat?.age??0,renderCalls:renderer?.info.render.calls||0,geometries:renderer?.info.memory.geometries||0};}
document.addEventListener('pointermove',e=>{if(!target||calm()||!visible)return;const r=target.getBoundingClientRect();tx=THREE.MathUtils.clamp((e.clientX-r.left-r.width/2)/Math.max(100,r.width),-1,1);ty=THREE.MathUtils.clamp((e.clientY-r.top-r.height/2)/Math.max(100,r.height),-1,1);pet=e.clientX>r.left+r.width*.22&&e.clientX<r.right-r.width*.22&&e.clientY>r.top&&e.clientY<r.top+r.height*.46;wake();},{passive:true});
document.addEventListener('keydown',e=>{if(!target||calm()||!visible||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.key.length!==1)return;const now=performance.now();if(now<pawUntil-140)return;pawSide=1-pawSide;pawUntil=now+320;wake();});
window.addEventListener('blur',()=>{tx=ty=0;pet=false;});document.documentElement.addEventListener('pointerleave',()=>{tx=ty=0;pet=false;});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;wake();});
window.addEventListener('resize',wake);
window.OrbiterCats={ensureProfiles,traits,mount,portrait,main,celebrate,setVisible,stats};
