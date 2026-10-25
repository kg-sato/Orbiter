import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import modelUrl from './assets/chest.glb';

export const CHEST_VERSION='orbiter-chest-1';
export const OPEN_DURATION=1800;
let template=null,error=null;
// Asset embedded by the existing GLB data-url loader: no network or renderer is created.
export const ready=new Promise((resolve,reject)=>{const bytes=Uint8Array.from(atob(modelUrl.split(',')[1]),c=>c.charCodeAt(0));new GLTFLoader().parse(bytes.buffer,'',resolve,reject);}).then(gltf=>{template=gltf.scene;return true;}).catch(e=>{error=e.message;return false;});
export const assetStatus=()=>({loaded:!!template,error,version:CHEST_VERSION});
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};

/** Original chest presentation. Caller owns timing, accepted reward and its one shared renderer. */
export function createChest(){
 if(!template)return null;
 const scene=new THREE.Scene(),root=template.clone(true),materials=new Map();scene.add(root);
 root.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=false;o.userData.orbiterChest=true;const copies=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{if(!materials.has(m))materials.set(m,m.clone());return materials.get(m);});o.material=Array.isArray(o.material)?copies:copies[0];});
 const hinge=root.getObjectByName('LidHinge'),seal=root.getObjectByName('Seal'),opening=root.getObjectByName('OpeningAnchor'),reward=root.getObjectByName('RewardAnchor'),rewardLight=root.getObjectByName('RewardLight');
 if(!hinge||!seal||!opening||!reward||!rewardLight){materials.forEach(m=>m.dispose());error='Chest articulation anchors are missing.';return null;}
 const camera=new THREE.OrthographicCamera(-1.8,1.8,1.8,-1.8,.1,30);camera.position.set(3.4,2.8,4.8);camera.lookAt(0,.92,0);
 scene.add(new THREE.HemisphereLight('#dceff6','#1c3047',2.3));const key=new THREE.DirectionalLight('#f0e5ff',3.0);key.position.set(-3,5,4);scene.add(key);const rim=new THREE.DirectionalLight('#9be0d1',1.6);rim.position.set(3,3,-3);scene.add(rim);
 const glowMaterial=new THREE.MeshBasicMaterial({color:'#b4ead8',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const glow=new THREE.Mesh(new THREE.CircleGeometry(.72,32),glowMaterial);glow.name='ContainedGlow';glow.rotation.x=-Math.PI/2;glow.scale.set(1,.65,1);glow.position.set(0,.43,0);root.add(glow);
 const inside=new THREE.PointLight('#b4ead8',0,2,2);inside.position.set(0,.98,0);root.add(inside);
 const pulseMaterial=new THREE.MeshBasicMaterial({color:'#cddaf0',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const pulse=new THREE.Mesh(new THREE.RingGeometry(.25,.265,32),pulseMaterial);pulse.name='SealPulse';pulse.position.set(0,-.025,1.375);hinge.add(pulse);
 const generated=[glow.geometry,pulse.geometry],rest={position:root.position.clone(),rotation:root.rotation.clone(),scale:root.scale.clone(),reward:reward.position.clone()},sealMaterials=[];
 seal.traverse(o=>{if(o.isMesh&&(o.material.emissive||o.material.name==='Moonlit seal'))sealMaterials.push(o.material);});
 let disposed=false,current=0,viewAspect=1,viewOpen=0;
 function frame(){const half=1.8+.22*viewOpen,h=viewAspect<1?half/viewAspect:half;camera.left=-h*viewAspect;camera.right=h*viewAspect;camera.top=h;camera.bottom=-h;camera.lookAt(0,.92+.4*viewOpen,0);camera.updateProjectionMatrix();}
 function animate(progress,{reducedMotion=false}={}){
  if(disposed)return;current=clamp(progress);const p=reducedMotion?(current>=1?1:0):current,anticipation=p<=.35?Math.sin(p/.35*Math.PI):0,unseal=smooth((p-.35)/.45),reveal=smooth((p-.73)/.24);
  root.position.copy(rest.position);root.rotation.copy(rest.rotation);root.scale.copy(rest.scale);
  if(!reducedMotion){root.position.y+=.085*anticipation;root.rotation.z=Math.sin(p/.35*Math.PI*7)*.035*anticipation;root.scale.set(1+.02*anticipation,1-.025*anticipation,1+.02*anticipation);}
  hinge.rotation.x=unseal?-1.93*unseal:0;
  viewOpen=unseal;frame();
  for(const m of sealMaterials)if(m.emissive)m.emissiveIntensity=1.05+anticipation*.9;
  glowMaterial.opacity=.22*unseal*(1-reveal*.45);inside.intensity=.75*unseal;
  pulse.visible=!reducedMotion&&p>0&&p<.6;pulseMaterial.opacity=(1-smooth((p-.25)/.35))*.40*anticipation;pulse.scale.setScalar(1+p*2.0);
  reward.position.copy(rest.reward);reward.position.y+=.65*reveal;rewardLight.visible=p>=.73;rewardLight.scale.setScalar(reducedMotion?1:Math.max(.001,reveal*(1+.16*Math.sin(reveal*Math.PI))));rewardLight.rotation.y=.6*reveal;
  root.updateMatrixWorld(true);
 }
 function setAspect(aspect=1){viewAspect=Number.isFinite(aspect)&&aspect>0?aspect:1;frame();}
 function stats(){let triangles=0,meshes=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});return{version:CHEST_VERSION,triangles,meshes,progress:current,disposed};}
 function dispose(){if(disposed)return;disposed=true;materials.forEach(m=>m.dispose());generated.forEach(g=>g.dispose());glowMaterial.dispose();pulseMaterial.dispose();scene.clear();}
 animate(0);return{scene,camera,root,hinge,anchors:{seal,opening,reward},animate,setAspect,stats,dispose};
}
