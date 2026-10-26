import * as Chest from './chest.js';
import {habitatStudy,accessoryStudy} from './equipment.js';
import {styleScarf} from './appearances.js';
import {studyTrail} from './equipment-trails.js';
import {createAvatar,ready as avatarReady,assetStatus,MODEL_VERSION} from './avatar.js';
import {trail} from './cosmos.js';
import {createPondWorld} from '../pond/world.js';
import * as THREE from 'three';
import {growth,lookColor} from './rewards.js';
import {studyFallback as fallbackPortrait} from './fallback-art.js';

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
 const p=traits(code),root=new THREE.Group(),avatar=createAvatar(p,{coat:coats[p.coat]},equipment.appearance?lookColor(equipment.appearance):null,equipment.appearance),head=avatar?.head||new THREE.Group();
 const age=growth(growthMs).stage;
 if(avatar)root.add(avatar.model);else root.add(head);head.position.y=[1.36,1.46,1.58,1.67][age];
 head.scale.setScalar([1.12,1.07,1.02,1][age]);
 const fur=material(coats[p.coat]),scarf=material(scarves[p.scarf]).clone();
 const body=avatar?.body||ball(root,fur,[0,.60,0],[.51,.66,.40]);body.scale.y*=[.78,.86,.95,1][age];
 let ears=avatar?.ears||[],eyes=[];let mouth=new THREE.Group();head.add(mouth);
 if(!avatar){
 ball(root,ivory,[0,.62,.36],[.31,.33+.03*age,.05]);
 const skull=ball(head,fur,[0,0,0],[.85,.75,.61]);
 // Soft cheek volumes and a small muzzle give the face a tangible silhouette.
 for(const side of [-1,1])ball(head,fur,[side*.66,-.22,.40],[.21,.17,.105]);
 ball(head,ivory,[0,-.29,.566],[.24,.12,.035]);
 if(p.coat===1)ball(head,ivory,[0,-.18,.54],[.46,.32,.055]);
 if(p.coat===2){for(const x of [-.28,0,.28])line(head,[[x,.6,.34],[x*.8,.48,.49],[x*.6,.36,.56]],'#9383ae',.035);}
 if(p.coat===3)ball(head,material('#829e96'),[-.43,.10,.46],[.28,.36,.12]);
 ears=[];
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
 eyes=[];
 for(const side of [-1,1]){
  const eye=ball(head,eyesMaterial,[side*.30,-.06,.573],[.087,.118,.046]);eyes.push(eye);
  ball(eye,ivory,[-.23,.30,1],[.19,.18,.12]);
  ball(eye,material('#88aebb'),[.1,-.32,.85],[.40,.22,.15]);
  ball(eye,ivory,[.22,-.12,.97],[.065,.065,.065]);
  ball(head,blush,[side*.55,-.25,.49],[.15,.073,.025]);
 }
 ball(head,blush,[0,-.22,.62],[.055,.037,.025]);
 mouth=new THREE.Group();head.add(mouth);
 line(mouth,[[-.13,-.34,.606],[-.08,-.39,.64],[0,-.365,.64],[.08,-.39,.64],[.13,-.34,.606]],'#926b78',.018);
 for(const side of [-1,1])for(const dy of [-.22,-.32])line(head,[[side*.67,dy,.43],[side*.90,dy-.03,.40]],'#bea2a4',.012);
 }
 // Persistent coat identity remains readable beneath earned palettes.
 // The GLB avatar paints identity markings into its smooth head surface.
 const neckHeight=avatar?[.69,.73,.84,.95][age]:1.05;
 const neck=new THREE.Mesh(new THREE.TorusGeometry(avatar?.27:.37,.06,8,28),scarf);neck.rotation.x=Math.PI/2;neck.position.y=neckHeight;root.add(neck);
 const bow=new THREE.Group();bow.position.set(0,neckHeight-.03,.40);root.add(bow);
 if(p.scarf===0||p.scarf===3){for(const side of [-1,1])ball(bow,scarf,[side*.13,0,0],[.17,.11,.055]);ball(bow,material('#b3d6cb'),[0,0,.04],[.055,.065,.045]);}
 if(p.scarf===1)ball(bow,scarf,[0,-.13,0],[.22,.25,.04]);
 if(p.scarf===2){ball(bow,scarf,[.15,-.22,0],[.075,.34,.06]);line(bow,[[.09,-.4,.07],[.22,-.4,.07]],'#f0dcce',.02);}
 const paws=avatar?.paws||[];
 if(!avatar)for(const side of [-1,1]){const paw=new THREE.Group();paw.position.set(side*.47,.60,.13);root.add(paw);ball(paw,fur,[0,-.12,.17],[.17,.24,.18]);paws.push(paw);ball(root,fur,[side*.25,.06,.15],[.22,.13,.25]);}
 const tail=avatar?.tail||new THREE.Group();if(!avatar){root.add(tail);line(tail,[[.40,.40,-.10],[.95,.48,-.10],[1.07,.85,.05],[.87,1.0,.08]],coats[p.coat],.10);}
 const charm=new THREE.Group();charm.position.set(.32,.92,.38);root.add(charm);
 const gold=material(equipment.halo==='halo-runes'?'#c8b5eb':'#e8c293');
 if(p.charm===0){const star=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.055:.12;i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();charm.add(new THREE.Mesh(new THREE.ExtrudeGeometry(star,{depth:.035,bevelEnabled:false}),gold));}
 if(p.charm===1){const m=new THREE.Mesh(new THREE.TorusGeometry(.085,.025,6,20,Math.PI*1.4),gold);m.rotation.z=.8;charm.add(m);}
 if(p.charm===2){const leaf=ball(charm,material('#a7c4a3'),[0,0,0],[.06,.13,.025]);leaf.rotation.z=.4;}
 if(p.charm===3){for(const x of [-.06,.06])ball(charm,blush,[x,-.04,0],[.065,.065,.04]);line(charm,[[-.06,0,0],[0,.15,0],[.06,0,0]],'#99bda2',.014);}
 if(equipment.halo==='halo-double')ball(charm,gold,[.15,0,0],[.045,.045,.025]);
 if(true && ['halo-thin','halo-07','halo-10','halo-12'].includes(equipment.halo))accessoryStudy(root,head,bow,equipment.halo);
 else if(equipment.halo?.match(/^halo-\d/))addAccessory(root,head,bow,Number(equipment.halo.slice(-2)),gold,scarf);
 else if(equipment.halo){for(let i=0;i<(equipment.halo==='halo-double'?2:1);i++){const halo=new THREE.Mesh(new THREE.TorusGeometry(.73+i*.14,.025,6,48),gold);halo.position.set(0,2.55+i*.11,-.12);halo.rotation.x=1.15;root.add(halo);}if(equipment.halo==='halo-runes')for(let i=0;i<7;i++)ball(root,gold,[Math.cos(i*.9)*.95,2.5+Math.sin(i*.9)*.18,-.12],[.035,.07,.025]);}
 if(equipment.appearance && equipment.appearance!=='mint'){const colors={lilac:'#c8b5eb',opal:'#e6ddca',rose:'#e0b6c9',aurora:'#8ee4c8',eclipse:'#e9ba90',indigo:'#939ddd',singularity:'#aca0db',cultivation:'#ccd7a0'};scarf.color.set(colors[equipment.appearance]||scarves[p.scarf]);}
 if(equipment.appearance&&(false||!['mint','look-11','indigo'].includes(equipment.appearance))){const n=Number(equipment.appearance.slice(-2))||1,color=lookColor(equipment.appearance);scarf.color.set(color);for(const side of [-1,1]){line(head,[[side*.38,.19,.49],[side*.49,.26,.43],[side*.58,.19,.39]],color,.022+(n%3)*.006);if(n%2===0)ball(head,material(color),[side*.44,-.14,.51],[.065,.045,.018]);}if(n>6){const jewel=new THREE.Mesh(new THREE.OctahedronGeometry(.085),material(color));jewel.position.set(0,.39,.48);head.add(jewel);}}
 const habitat=new THREE.Group();root.add(habitat);habitat.position.y=-.02;
 ball(habitat,material('#59778e'),[0,-.13,-.05],[.95,.12,.56]);
 // A shared visual vocabulary: a soft resting stone, tidal pool, lantern, then garden.
 const stone=material('#859a9b'),pool=material('#7baead'),leaf=material('#9bbfa9');
 ball(habitat,stone,[0,-.025,-.05],[.65,.025,.40]);
 if(age>0){
   ball(habitat,pool,[.04,.02,-.08],[.82,.035,.52]);
   const rim=new THREE.Mesh(new THREE.TorusGeometry(.73,.018,6,48),material('#b2d9cc'));rim.rotation.x=Math.PI/2;rim.scale.y=.63;rim.position.set(.04,.04,-.08);habitat.add(rim);
   for(let i=0;i<3;i++)ball(habitat,stone,[-.78+i*.16,.02,-.26+i*.07],[.13,.08,.10]);
 }
 if(age>1){
   line(habitat,[[-.87,.04,-.24],[-.87,.65,-.24],[-.65,.65,-.24]],'#829ca2',.023);
   ball(habitat,material('#d5bba0'),[-.64,.45,-.24],[.11,.15,.10]);
   ball(habitat,material('#f4dfb2'),[-.64,.46,-.15],[.055,.09,.025]);
   for(const side of [-1,1]){line(habitat,[[side*.8,0,-.24],[side*.86,.30,-.24]],'#7c9e8d',.018);const frond=ball(habitat,leaf,[side*.85,.26,-.24],[.055,.16,.035]);frond.rotation.z=side*.35;}
 }
 if(age>2){
   for(let i=0;i<5;i++){const x=.45+i*.11,z=-.28+(i%2)*.08;line(habitat,[[x,.02,z],[x,.25+(i%3)*.08,z]],'#7c9e8d',.014);ball(habitat,material(i%2?'#d0bfdf':'#dbd3b5'),[x,.29+(i%3)*.08,z],[.065,.055,.045]);}
   const arch=new THREE.Mesh(new THREE.TorusGeometry(.66,.022,6,40,Math.PI),material('#b9b8d5'));arch.position.set(0,.55,-.48);arch.rotation.z=.2;habitat.add(arch);
   for(let i=0;i<4;i++)ball(habitat,gold,[Math.cos(i*.7)*.8,.34+i*.15,-.35],[.023,.023,.023]);
 }
 if(equipment.habitat){if(true && ['habitat-01','habitat-07','habitat-11','habitat-12'].includes(equipment.habitat))habitatStudy(habitat,equipment.habitat);else addHabitat(habitat,Number(equipment.habitat.slice(-2)),gold);}
 for(let i=0;i<Math.min(stars,12);i++)ball(habitat,gold,[Math.cos(i*2.4)*1.0,.12+(i%3)*.11,Math.sin(i*2.4)*.35],[.022,.022,.022]);
 styleScarf(scarf,equipment.appearance);
 const particles=equipment.trail?(false?trail(equipment.trail):studyTrail(equipment.trail)):new THREE.Group();root.add(particles);
 for(let i=0;i<(equipment.trail&&true?0:(equipment.trail==='trail-comet'?5:3));i++)ball(particles,material(i%2?'#c8b5eb':'#b4e6d5'),[Math.sin(i*2.4)*1.15,1.0+i*.36,-.1],[.027,.027,.027]);
 return {root,head,body,ears,eyes,paws,tail,bow,mouth,particles,code,age,avatar};
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
 const scenery=new THREE.Group();host.add(scenery);host=scenery;host.scale.setScalar(1.4);host.position.set(0,0,-.24);
 const mat=material(lookColor('look-'+String(n).padStart(2,'0')));
 if(n===1){for(let i=0;i<3;i++)ball(host,mat,[(i-1)*.54,.05,-.30],[.15,.08,.12]);}
 else if(n===2||n===5||n===11){for(let i=0;i<(n===11?7:3);i++){const x=Math.cos(i*2.5)*.8,h=n===5?.8:n===11?.6:.3;line(host,[[x,0,-.3],[x,h,-.3]],'#99b899',.02);ball(host,mat,[x,h,-.3],[.09,n===5?.25:.065,.06]);if(n===11){const star=new THREE.Mesh(new THREE.OctahedronGeometry(.09),gold);star.position.set(x,h+.08,-.3);host.add(star);}}}
 else if(n===3||n===8){ball(host,mat,[0,.0,-.1],[.82,.08,.43]);if(n===3){const moon=new THREE.Mesh(new THREE.TorusGeometry(.43,.065,6,40,Math.PI*1.4),mat);moon.position.set(-.65,.6,-.45);host.add(moon);}else{for(const side of [-1,1])line(host,[[side*.85,0,-.3],[side*.85,.9,-.3],[side*.45,.4,-.3]],'#d5c6e1',.025);line(host,[[-.75,.7,-.3],[0,.24,-.3],[.75,.7,-.3]],'#d5c6e1',.045);}}
 else if(n===4){line(host,[[-.83,0,-.2],[-.83,.64,-.2],[-.65,.64,-.2]],'#a0b4b0',.025);ball(host,gold,[-.64,.48,-.2],[.09,.14,.09]);}
 else if(n===6){for(let i=0;i<3;i++)ball(host,ivory,[(i-1)*.22,.10,-.30],[.23,.07,.15]);}
 else if(n===7){for(let i=0;i<3;i++){const crystal=new THREE.Mesh(new THREE.ConeGeometry(.09,.25+i*.06,5),mat);crystal.position.set(-.78+i*.12,.17,-.3);host.add(crystal);}}
 else if(n===9){ball(host,mat,[-.84,.18,-.25],[.16,.05,.16]);line(host,[[-.84,.0,-.25],[-.84,.30,-.25]],'#c8c5ad',.025);}
 else if(n===10||n===12){for(let i=0;i<(n===12?3:2);i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.78+i*.09,.025,6,40,n===12?Math.PI*2:Math.PI*1.5),mat);ring.rotation.x=n===12?Math.PI/2+i*.35:Math.PI/2;ring.position.set(0,.08+i*.14,-.15);host.add(ring);}}
}
function disposeModel(cat){cat?.avatar?.dispose();const geometries=new Set(),ownedMaterials=new Set(),skeletons=new Set();cat?.root.traverse(o=>{if(o.isMesh||o.isLine||o.isPoints){if(o.isInstancedMesh)o.dispose();if(o.isSkinnedMesh)skeletons.add(o.skeleton);if(o.geometry!==sphere&&(!o.userData.orbiterAsset||o.userData.studyGeometry))geometries.add(o.geometry);if(![eyesMaterial,ivory,blush,...materials.values()].includes(o.material))ownedMaterials.add(o.material);}});geometries.forEach(g=>g.dispose());const textures=new Set();ownedMaterials.forEach(m=>{if(m.map)textures.add(m.map);m.dispose();});textures.forEach(t=>t.dispose());skeletons.forEach(s=>s.dispose());}
let drawMs=0,gpuMs=null,gpuQuery=null,gpuExtension=null,slowFrames=0,autoLow=false;
function quality(){const q=document.body.dataset.effectQuality||'auto';return q;}
let pondWorld=null,portraitMode=false,requestedCode=0;
let renderer=null,scene=null,camera=null,keyLight=null,cat=null,target=null,currentCode=null,equipment={},growthMs=0,starCount=0,frame=0,last=0,phase=0,visible=true,focus=false,paused=false,celebrateUntil=0,pet=false,tx=0,ty=0,x=0,y=0,pawUntil=0,pawSide=0,viewWidth=0,viewHeight=0,frames=0,stretchUntil=0,lastPat=0;
const portraits=new Map();let mainCode;
// A shared canvas can be live in only one host. Park its actual rendered kitten
// in the previous visible host rather than exposing a different fallback cat.
const parkedSnapshots=new Map(),snapshotLimit=8;
function clearSnapshot(host){const image=parkedSnapshots.get(host);if(image){image.remove();image.removeAttribute('src');parkedSnapshots.delete(host);}host?.classList.remove('cat-snapshot-ready');}
function parkSnapshot(host){
 if(!host||!host.isConnected||portraitMode||!renderer||!cat||renderer.domElement.parentNode!==host||document.hidden)return;
 const bounds=host.getBoundingClientRect();if(bounds.width<=0||bounds.height<=0||renderer.getContext().isContextLost())return;
 let canvas;
 try{
  // preserveDrawingBuffer is false: redraw synchronously, then copy immediately.
  // Re-render after draw's adaptive resize too, which can clear the new buffer.
  resize();draw(performance.now());renderer.setRenderTarget(null);renderer.setViewport(0,0,renderer.domElement.width,renderer.domElement.height);renderer.render(scene,camera);
  const scale=Math.min(1,240/Math.max(bounds.width,bounds.height));
  canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bounds.width*scale));canvas.height=Math.max(1,Math.round(bounds.height*scale));
  const context=canvas.getContext('2d');if(!context)return;
  context.drawImage(renderer.domElement,0,0,canvas.width,canvas.height);
  const image=new Image();image.dataset.catSnapshot='true';image.alt='';image.setAttribute('aria-hidden','true');image.draggable=false;image.width=canvas.width;image.height=canvas.height;
  image.style.cssText='display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none';image.src=canvas.toDataURL('image/png');
  clearSnapshot(host);
  for(const [old,snapshot] of parkedSnapshots)if(!old.isConnected||snapshot.parentNode!==old)clearSnapshot(old);
  host.append(image);host.classList.add('cat-snapshot-ready');parkedSnapshots.set(host,image);
  while(parkedSnapshots.size>snapshotLimit)clearSnapshot(parkedSnapshots.keys().next().value);
 }catch(error){/* Capture failure leaves the established static fallback intact. */}
 finally{if(canvas)canvas.width=canvas.height=0;}
}
let previewState=null,previewTarget=null;
try{const old=Number(localStorage.getItem('orbiter.last-cat'));mainCode=(old+1+Math.floor(Math.random()*255))%256;localStorage.setItem('orbiter.last-cat',String(mainCode));}catch{mainCode=Math.floor(Math.random()*256);}
function calm(){return quality()==='low'||Number(document.body.dataset.motionIntensity??70)===0||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduced-motion')||document.body.classList.contains('calm')||document.body.classList.contains('quiet');}
function init(){
 if(renderer)return true;
 try{
  if(new URLSearchParams(location.search).has('noWebGL'))return false;
  // Portrait capture happens synchronously after render; retaining every GPU frame is unnecessary.
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.style.cssText='display:block;width:100%;height:100%;position:absolute;inset:0;pointer-events:none';
  gpuExtension=renderer.getContext().getExtension('EXT_disjoint_timer_query_webgl2');
  pondWorld=createPondWorld(renderer);scene=new THREE.Scene();scene.add(new THREE.HemisphereLight('#fff2df','#526985',1.8));keyLight=new THREE.DirectionalLight('#fff4df',2.2);keyLight.position.set(-3,5,5);scene.add(keyLight);const rim=new THREE.DirectionalLight('#b4c9eb',1.2);rim.position.set(3,3,-2);scene.add(rim);
  camera=new THREE.OrthographicCamera(-1.67,1.67,1.67,-1.67,.1,20);camera.position.set(0,2.8,7);camera.lookAt(0,1.22,0);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();chestLease?.cancel('context-lost');cancelAnimationFrame(frame);frame=0;gpuQuery=null;pondWorld?.reset();if(target){target.classList.remove('cat-3d-ready');target.dataset.catFallback='true';renderer.domElement.style.visibility='hidden';const img=new Image();img.dataset.contextFallback='true';img.src=fallbackPortrait(currentCode??mainCode,growth(growthMs).stage,equipment);img.style.cssText='width:100%;height:100%;object-fit:contain';target.append(img);}});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{target?.querySelector('[data-context-fallback]')?.remove();if(target)delete target.dataset.catFallback;renderer.domElement.style.visibility='';target?.classList.add('cat-3d-ready');gpuExtension=renderer.getContext().getExtension('EXT_disjoint_timer_query_webgl2');wake();});
  return true;
 }catch(e){renderer=null;console.warn('Cat uses static fallback:',e.message);return false;}
}
function setCat(code){if(cat && currentCode===code)return; if(cat){scene.remove(cat.root);disposeModel(cat);}cat=makeCat(code,equipment,growthMs,starCount);currentCode=code;scene.add(cat.root);}
function resize(){if(!target||!renderer)return;const r=target.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),size=pondWorld.place(target,autoLow&&quality()==='auto'?'balanced':quality());if(w===viewWidth&&h===viewHeight&&renderer.domElement.width===size.width&&renderer.domElement.height===size.height)return;viewWidth=w;viewHeight=h;renderer.setPixelRatio(1);renderer.setSize(size.width,size.height,false);const a=w/h;camera.left=-1.67*a;camera.right=1.67*a;camera.updateProjectionMatrix();}

function draw(t){
 if(!renderer||!cat)return;
 const started=performance.now();const quiet=calm()||Number(document.body.dataset.motionIntensity??70)===0;const dt=Math.min(.08,Math.max(0,(t-last)/1000));last=t;
 const development=growth(growthMs),age=development.stage,next=Math.min(age+1,3),mix=development.progress;
 const blend=values=>values[age]+(values[next]-values[age])*mix;
 cat.head.position.y=blend([1.36,1.46,1.58,1.67]);cat.head.scale.setScalar(blend([1.12,1.07,1.02,1]));cat.body.scale.y=(cat.avatar?1:.66)*blend([.78,.86,.95,1]);
 if(!quiet)phase+=dt*Number(document.body.dataset.motionIntensity??70)/70;
 x+=(tx-x)*.15;y+=(ty-y)*.15;
 // Independent pose channels: attention never overwrites breathing or typing.
 const celebrating=!quiet && celebrateUntil>t;
 const stretch=!quiet&&stretchUntil>t?Math.sin((1-(stretchUntil-t)/900)*Math.PI):0;
 cat.body.scale.y*=quiet?1:1+Math.sin(phase*1.8)*.012+stretch*.08;
 cat.head.position.y+=stretch*.04;
 cat.root.position.y=quiet?0:Math.sin(phase*1.5)*(paused?.014:.028);
 cat.root.rotation.y=(quiet?0:x*.075);
 cat.head.rotation.y=quiet?0:x*.25;
 cat.head.rotation.x=quiet?0:y*.12+(focus?-.035:0);
 cat.head.rotation.z=quiet?0:(paused?.085:pet?Math.sin(phase*7)*.045:Math.sin(phase)*.02);
 const blinkPhase=phase%6.3;
 const blink=quiet?1:pet?.18:blinkPhase>6.03?Math.max(.12,Math.abs((blinkPhase-6.165)/.135)):1;
 cat.avatar?.blink(celebrating?.65:blink);
 cat.avatar?.react(pet,celebrating);
 cat.eyes.forEach(e=>e.scale.y=.118*(celebrating?.65:blink));
 cat.mouth.scale.x=pet?1.16:celebrating?1.12:1;
 cat.ears.forEach((ear,i)=>{ear.rotation.z=quiet?0:(pet?(i?-.14:.14):x*.05+Math.sin(phase*1.4+i)*.025);});
 cat.tail.rotation.z=quiet?0:Math.sin(phase*(focus?2.2:paused?.65:1.3))*(pet?.12:.085);
 cat.tail.rotation.y=quiet?0:Math.sin(phase*.8)*.06;
 cat.paws.forEach((paw,i)=>{const stroke=!quiet&&i===pawSide&&t<pawUntil?Math.sin((1-(pawUntil-t)/320)*Math.PI):0;paw.position.y=.60+stroke*.23;paw.rotation.z=(i?1:-1)*(celebrating?.16:stroke*.13);});
 cat.bow.rotation.z=quiet?0:Math.sin(phase*1.8)*(pet?.05:.03);
 keyLight.position.set(-3+(quiet?0:x*.8),5+(quiet?0:y*.4),5);
 const atmosphere=document.body.style.getPropertyValue('--atmosphere');cat.root.userData.world?.userData.tick(phase,quiet?0:1,atmosphere===''?.5:Number(atmosphere),x,y);
 cat.root.userData.island?.userData.tick(x,y,quiet?0:1,phase,atmosphere===''?.5:Number(atmosphere));
 cat.root.traverse(o=>o.userData.studyTick?.({time:phase,motion:quiet?0:1,x,y,focus,paused,pet,celebrating}));
 cat.particles.rotation.y=quiet?0:Math.sin(phase*.4)*.25;cat.particles.rotation.z=quiet?0:Math.sin(phase*.25)*.1;cat.particles.visible=!!equipment.trail||focus||celebrating||pet;
 if(celebrating)cat.root.position.y+=Math.abs(Math.sin((celebrateUntil-t)*.01))*.14;
 const gl=renderer.getContext();if(gpuQuery&&gl.getQueryParameter(gpuQuery,gl.QUERY_RESULT_AVAILABLE)){if(!gl.getParameter(gpuExtension.GPU_DISJOINT_EXT))gpuMs=gl.getQueryParameter(gpuQuery,gl.QUERY_RESULT)/1000000;gl.deleteQuery(gpuQuery);gpuQuery=null;}
 const sample=gpuExtension&&!gpuQuery&&frames%30===0;if(sample){gpuQuery=gl.createQuery();gl.beginQuery(gpuExtension.TIME_ELAPSED_EXT,gpuQuery);}
 if(!portraitMode&&target)pondWorld.render(target,{quality:autoLow&&quality()==='auto'?'balanced':quality(),quiet,clock:t/1000,strength:atmosphere===''?.5:Number(atmosphere),habitat:equipment.habitat});renderer.setRenderTarget(null);renderer.setViewport(0,0,renderer.domElement.width,renderer.domElement.height);frames++;renderer.render(scene,camera);if(sample)gl.endQuery(gpuExtension.TIME_ELAPSED_EXT);drawMs=performance.now()-started;if(quality()==='auto'){slowFrames=Math.max(drawMs,gpuMs||0)>22?slowFrames+1:Math.max(0,slowFrames-1);if(slowFrames>45){autoLow=true;viewWidth=0;resize();}}
}
function loop(t){frame=0;if(chestLease)return;if(!target||document.hidden||!visible)return;if(t-last>=1000/30){resize();draw(t);}if(!calm())frame=requestAnimationFrame(loop);}
function wake(){if(chestLease)return;if(!target||document.hidden||!visible)return;if(!frame)frame=requestAnimationFrame(loop);}
export function mount(host,code=mainCode,options={}){
 if(chestLease){chestLease.restore={host,code,options};return;}
 requestedCode=code;
 if(previewState&&host!==previewTarget){previewState={host,code,options};return;}
 if(target!==host){if(host&&target)parkSnapshot(target);target?.classList.remove('cat-3d-ready');target=host;}
 if(!host){cancelAnimationFrame(frame);frame=0;return;}
 clearSnapshot(host);
 focus=!!options.focus;paused=!!options.paused;equipment=options.equipment||{};growthMs=options.growthMs||0;starCount=options.stars||0;
 const key=JSON.stringify([equipment.appearance,equipment.halo,equipment.trail,equipment.habitat,document.body.dataset.preset,growth(growthMs).stage,Math.min(starCount,12)]);if(cat?.equipmentKey!==key){currentCode=null;}
 if(assetStatus().loaded){host.querySelectorAll('[data-avatar-loading]').forEach(n=>n.remove());delete host.dataset.catFallback;}
 if(!assetStatus().loaded||assetStatus().error||!init()){host.dataset.catFallback='true';host.dataset.habitatStage=String(growth(growthMs).stage);const img=new Image();img.dataset.avatarLoading='true';img.src=fallbackPortrait(code,growth(growthMs).stage,equipment);img.alt='';img.style.cssText='width:100%;height:100%;object-fit:contain';host.replaceChildren(img);return;}
 if(getComputedStyle(host).position==='static')host.style.position='relative';host.append(renderer.domElement);host.classList.add('cat-3d-ready');host.dataset.habitatStage=String(growth(growthMs).stage);setCat(code);cat.equipmentKey=key;resize();draw(performance.now());visible=true;wake();
}
export function portrait(code,ms=0,items={},angle=0){
 const cacheKey=MODEL_VERSION+":pond-051:"+document.body.dataset.preset+":"+code+":"+growth(ms).stage+":"+JSON.stringify(items)+":"+angle;
 if(portraits.has(cacheKey))return portraits.get(cacheKey);
 if(chestLease)return fallbackPortrait(code,growth(ms).stage,items);
 if(assetStatus().error||!init())return fallbackPortrait(code,growth(ms).stage,items);
 portraitMode=true;const saved=currentCode,savedEquipment=equipment,savedGrowth=growthMs,savedStars=starCount;equipment=items;growthMs=ms;starCount=0;currentCode=null;setCat(code);cat.root.userData.island?.userData.plumes?.forEach(p=>p.visible=false);renderer.setSize(240,240,false);camera.left=-1.67;camera.right=1.67;camera.updateProjectionMatrix();draw(performance.now());cat.root.rotation.y=angle;renderer.render(scene,camera);
 const url=renderer.domElement.toDataURL('image/png');if(portraits.size>=64)portraits.delete(portraits.keys().next().value);portraits.set(cacheKey,url);portraitMode=false;equipment=savedEquipment;growthMs=savedGrowth;starCount=savedStars;currentCode=null;if(saved!==null)setCat(saved);viewWidth=viewHeight=0;resize();return url;
}
export function main(){return mainCode;}
export function previewEquipment(host,patch){
 if(!previewState)previewState={host:target,code:currentCode??mainCode,options:{focus,paused,equipment:{...equipment},growthMs,stars:starCount}};
 previewTarget=host;const s=previewState;mount(host,s.code,{...s.options,equipment:{...s.options.equipment,...patch}});
 window.dispatchEvent(new CustomEvent('orbiter-equipment-preview',{detail:{...s.options.equipment,...patch,previewing:true}}));
}
export function cancelPreview(){if(!previewState)return;const s=previewState;previewState=previewTarget=null;mount(s.host,s.code,s.options);window.dispatchEvent(new CustomEvent('orbiter-equipment-preview',{detail:{...s.options.equipment,previewing:false}}));}
export function celebrate(){celebrateUntil=performance.now()+1000;wake();}
export function setVisible(v){visible=v;if(v)wake();else{cancelAnimationFrame(frame);frame=0;}}
export function stats(){return {...assetStatus(),pond:pondWorld?.stats(),triangles:renderer?.info.render.triangles||0,frameMs:drawMs,gpuMs,quality:quality(),frames,contexts:renderer?1:0,profile:currentCode,age:cat?.age??0,renderCalls:renderer?.info.render.calls||0,study:cat?.root.children.flatMap(o=>o.userData.studyBudget?[o.userData.studyBudget]:o.children.filter(c=>c.userData.studyBudget).map(c=>c.userData.studyBudget))||[],geometries:renderer?.info.memory.geometries||0};}
document.addEventListener('pointermove',e=>{if(!target||calm()||!visible)return;const r=target.getBoundingClientRect();tx=THREE.MathUtils.clamp((e.clientX-r.left-r.width/2)/Math.max(100,r.width),-1,1);ty=THREE.MathUtils.clamp((e.clientY-r.top-r.height/2)/Math.max(100,r.height),-1,1);pet=e.clientX>r.left+r.width*.22&&e.clientX<r.right-r.width*.22&&e.clientY>r.top&&e.clientY<r.top+r.height*.46;wake();},{passive:true});
document.addEventListener('pointerdown',e=>{if(!target||!pet||calm()||!target.contains(e.target)||performance.now()-lastPat<5000)return;lastPat=performance.now();stretchUntil=lastPat+900;wake();},{passive:true});
document.addEventListener('keydown',e=>{if(!target||calm()||!visible||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.key.length!==1)return;const now=performance.now();if(now<pawUntil-140)return;pawSide=1-pawSide;pawUntil=now+320;wake();});
window.addEventListener('blur',()=>{tx=ty=0;pet=false;});document.documentElement.addEventListener('pointerleave',()=>{tx=ty=0;pet=false;});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(calm())chestLease?.skip();cancelAnimationFrame(frame);frame=0;wake();});
window.addEventListener('resize',wake);
new MutationObserver(()=>{if(calm())chestLease?.skip();viewWidth=0;wake();}).observe(document.body,{attributes:true,attributeFilter:['data-motion-intensity','data-effect-quality','data-preset','class']});
avatarReady.then(()=>{portraits.clear();currentCode=null;if(target)mount(target,requestedCode,{focus,paused,equipment,growthMs,stars:starCount});window.dispatchEvent(new CustomEvent('orbiter-avatar-ready'));});
window.OrbiterCats={ready:avatarReady,ensureProfiles,traits,mount,portrait,main,celebrate,setVisible,stats,previewEquipment,cancelPreview};
window.addEventListener('orbiter-mode-change',cancelPreview);

// The chest temporarily borrows the cat renderer; it never creates a second context.
let chestPortrait=null,chestLease=null,chestLast={progress:0,phase:'idle',triangles:0};
const chestFallback='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200"><defs><linearGradient id="c" x2="0" y2="1"><stop stop-color="#718ba6"/><stop offset="1" stop-color="#284b60"/></linearGradient></defs><ellipse cx="120" cy="172" rx="76" ry="12" fill="#122c40" opacity=".3"/><path d="M44 91Q44 43 120 43T196 91V150Q196 164 180 164H60Q44 164 44 150Z" fill="url(#c)" stroke="#c9c3df" stroke-width="5"/><path d="M45 100H195M73 57V161M167 57V161" fill="none" stroke="#c9c3df" stroke-width="8"/><path d="m120 87 6 12 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2Z" fill="#b4e6d5"/></svg>');
function playChest(host,{quiet=false,duration=Chest.OPEN_DURATION,onPhase}={}){
 chestLease?.cancel('replaced');
 let resolve,raf=0,settled=false,released=false,model=null,start=0,lastDraw=0;
 const finished=new Promise(r=>resolve=r),restore={host:target,code:requestedCode,options:{focus,paused,equipment:{...equipment},growthMs,stars:starCount}};
 const stage=document.createElement('div');stage.className='orb-chest-stage';stage.dataset.chestRender='fallback';stage.dataset.phase='anticipation';stage.style.cssText='position:relative;width:100%;height:100%;min-height:130px;isolation:isolate';
 const fallback=new Image();fallback.src=chestFallback;fallback.alt='Moonlit discovery chest';fallback.style.cssText='width:100%;height:100%;object-fit:contain';stage.append(fallback);host.replaceChildren(stage);
 function finish(reason){if(settled)return;settled=true;cancelAnimationFrame(raf);resolve(reason);}
 const lease={restore,finished,get progress(){return chestLast.progress;},cancel(reason='cancelled'){if(released)return;released=true;finish(reason);model?.dispose();if(chestLease===lease){chestLease=null;const r=lease.restore;if(r.host?.isConnected)mount(r.host,r.code,r.options);else renderer?.domElement.remove();}},skip(){if(model){const r=stage.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);model.setAspect(r.width/Math.max(1,r.height));model.animate(1,{reducedMotion:true});renderer.setRenderTarget(null);renderer.setViewport(0,0,renderer.domElement.width,renderer.domElement.height);renderer.render(model.scene,model.camera);}chestLast={...chestLast,progress:1,phase:'complete'};stage.dataset.phase='complete';onPhase?.('complete');finish('complete');}};
 chestLease=lease;cancelAnimationFrame(frame);frame=0;
 const phase=p=>p<.35?'anticipation':p<.73?'unlock':p<1?'open':'complete';
 function tick(t){if(released)return;if(document.hidden||!stage.isConnected){lease.cancel('cancelled');return;}if(!start)start=t;const p=Math.min(1,(t-start)/Math.max(1,duration));if(t-lastDraw>=1000/30||p===1){lastDraw=t;const r=stage.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);model.setAspect(r.width/Math.max(1,r.height));model.animate(p);renderer.setRenderTarget(null);renderer.setViewport(0,0,renderer.domElement.width,renderer.domElement.height);renderer.render(model.scene,model.camera);chestLast={progress:p,phase:phase(p),triangles:model.stats().triangles};if(stage.dataset.phase!==phase(p)){stage.dataset.phase=phase(p);onPhase?.(phase(p));}}if(p<1)raf=requestAnimationFrame(tick);else finish('complete');}
 Chest.ready.then(ok=>{if(released)return;if(!ok||!init()||renderer.getContext().isContextLost()){finish('fallback');return;}model=Chest.createChest();if(!model){finish('fallback');return;}stage.replaceChildren(renderer.domElement);stage.dataset.chestRender='webgl';renderer.domElement.style.visibility='';if(quiet||calm()){lease.skip();return;}raf=requestAnimationFrame(tick);}).catch(()=>finish('fallback'));
 return lease;
}
function chestStill(){
 if(chestPortrait)return chestPortrait;if(chestLease||!Chest.assetStatus().loaded||!init())return chestFallback;
 const model=Chest.createChest();if(!model)return chestFallback;
 try{renderer.setSize(240,200,false);model.setAspect(1.2);model.animate(0,{reducedMotion:true});renderer.setRenderTarget(null);renderer.setViewport(0,0,renderer.domElement.width,renderer.domElement.height);renderer.render(model.scene,model.camera);chestPortrait=renderer.domElement.toDataURL('image/png');}
 catch{return chestFallback;}finally{model.dispose();viewWidth=viewHeight=0;if(target?.isConnected){resize();draw(performance.now());}}
 return chestPortrait;
}
window.OrbiterChests={play:playChest,cancel:reason=>chestLease?.cancel(reason),portrait:chestStill,stats:()=>({...Chest.assetStatus(),...chestLast,active:!!chestLease,contexts:renderer?1:0})};
window.addEventListener('orbiter-mode-change',()=>chestLease?.cancel('mode-change'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)chestLease?.cancel('hidden');});

Chest.ready.then(()=>{window.dispatchEvent(new CustomEvent('orbiter-chest-ready'));});
