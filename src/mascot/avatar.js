import {styleAvatar} from './appearances.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import modelUrl from './assets/kitten.glb';

export const MODEL_VERSION='orbiter-kitten-stillwater-1';
let template=null,error=null;
// Skeleton clones share immutable geometry. Classify weights once per geometry,
// but retain attribute/version guards for a future edited or replaced buffer.
const rigidJoints=new WeakMap();
function rigidJoint(geometry){
 const index=geometry.attributes.skinIndex,weight=geometry.attributes.skinWeight;
 if(!index||!weight)return null;
 const cached=rigidJoints.get(geometry);
 if(cached&&cached.index===index&&cached.weight===weight&&cached.indexVersion===index.version&&cached.weightVersion===weight.version&&cached.count===index.count)return cached.joint;
 let joint=null,single=true;
 for(let i=0;i<index.count&&single;i++){if(weight.getX(i)<.999||weight.getY(i)>.001||weight.getZ(i)>.001||weight.getW(i)>.001){single=false;break;}const j=index.getX(i);if(joint===null)joint=j;else if(joint!==j)single=false;}
 if(!single)joint=null;
 rigidJoints.set(geometry,{index,weight,indexVersion:index.version,weightVersion:weight.version,count:index.count,joint});
 return joint;
}
// Decode the bundled asset in memory; native CSP needs no extra network/data permissions.
export const ready=new Promise((resolve,reject)=>{const bytes=Uint8Array.from(atob(modelUrl.split(',')[1]),c=>c.charCodeAt(0));new GLTFLoader().parse(bytes.buffer,'',resolve,reject);}).then(gltf=>{template=gltf.scene;return true;}).catch(e=>{error=e.message;console.warn('Kitten asset unavailable; using original fallback.',error);return false;});
export const assetStatus=()=>({loaded:!!template,error,version:MODEL_VERSION});
export function createAvatar(traits,colors,look,appearanceId){
 if(!template)return null;
 const model=clone(template),nodes={},owned=new Map(),paintedGeometry=[],paintedMaterials=[];
 // Every authored piece is rigidly weighted to one bone. Attach those pieces
 // directly to that bone: identical articulation without a GPU skinning shader
 // per facial/ear surface. Future blended-weight meshes retain normal skinning.
 model.updateMatrixWorld(true);const rigid=[];model.traverse(o=>{if(o.isSkinnedMesh)rigid.push(o);});
 for(const old of rigid){const joint=rigidJoint(old.geometry);
  if(joint===null||!old.skeleton.bones[joint])continue;
  const mesh=new THREE.Mesh(old.geometry,old.material);mesh.name=old.name;mesh.visible=old.visible;mesh.userData.orbiterAsset=true;if(old.morphTargetDictionary){mesh.morphTargetDictionary={...old.morphTargetDictionary};mesh.morphTargetInfluences=[...old.morphTargetInfluences];}mesh.applyMatrix4(old.matrixWorld);model.add(mesh);old.skeleton.bones[joint].attach(mesh);old.removeFromParent();
 }
 model.updateMatrixWorld(true);
 const coat=new THREE.Color(colors.coat),tint=look?new THREE.Color(look):coat;
 model.traverse(o=>{nodes[o.name]=o;if(!o.isMesh)return;
  const original=o.material;
  if(!owned.has(original)){const m=original.clone();
   if(original.name==='Coat')m.color.copy(coat).lerp(tint,look?.24:0);
   if(original.name==='Eyes'&&look)m.color.lerp(tint,.12);
   if(original.name==='Pattern')m.color.copy(coat).multiplyScalar(.72);
   owned.set(original,m);
  }o.material=owned.get(original);o.frustumCulled=false;o.userData.orbiterAsset=true;
  // Coat markings are painted into the surface, never extra cheek-shaped meshes.
  if(o.name==='HeadMesh'&&traits.coat!==0){
   const g=o.geometry.clone(),positions=g.attributes.position,paintCoordinates=[];
   const base=o.material.color.clone(),mark=traits.coat===2?new THREE.Color('#8e7aa8'):base.clone().multiplyScalar(.65),white=new THREE.Color('#fff1dc'),center=new THREE.Vector3().setFromMatrixPosition(model.getObjectByName('Head').matrixWorld),point=new THREE.Vector3();
   for(let i=0;i<positions.count;i++){
    point.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld).sub(center);paintCoordinates.push(point.x,point.y,point.z);
   }
   g.setAttribute('catPaintPosition',new THREE.Float32BufferAttribute(paintCoordinates,3));o.geometry=g;paintedGeometry.push(g);
   const m=o.material.clone();m.color.set('#fff');
   m.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{catBase:{value:base},catMark:{value:traits.coat===1?white:mark},catCoat:{value:traits.coat}});
    shader.vertexShader='attribute vec3 catPaintPosition; varying vec3 catPaint;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncatPaint=catPaintPosition;');
    shader.fragmentShader='varying vec3 catPaint;uniform vec3 catBase;uniform vec3 catMark;uniform float catCoat;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
     float catMask=0.;float px=catPaint.x;float py=catPaint.y;
     if(catCoat<1.5){float d=pow(px/.46,2.)+pow((py+.34)/.29,2.);catMask=1.-smoothstep(.85,1.08,d);}
     else if(catCoat<2.5){for(int j=-1;j<=1;j++){float c=float(j)*.23*(1.+(py-.45)*.4);float top=j==0?.67:.63;float mid=(top+.33)*.5;float d=length(vec2((px-c)/.058,max(abs(py-mid)-(top-.33)*.5+.058,0.)/.058));catMask=max(catMask,1.-smoothstep(.85,1.05,d));}}
     else {float d=pow((px+.40)/.26,2.)+pow((py-.10)/.36,2.);catMask=1.-smoothstep(.85,1.08,d);}
     catMask*=smoothstep(.08,.22,catPaint.z);diffuseColor.rgb=mix(catBase,catMark,catMask);`);
   };
   m.customProgramCacheKey=()=>`orbiter-painted-coat-${traits.coat}`;o.material=m;paintedMaterials.push(m);
  }
  const ear=o.name.match(/^(Ear|Inner)(L|R)(\d)$/);if(ear)o.visible=Number(ear[3])===traits.ears;
  if(o.name.startsWith('Tuft'))o.visible=traits.ears===3;
 });
 styleAvatar(model,appearanceId);
 // Facial identity is painted with shared geometry overlays by the companion layer.
 const morphs=[];model.traverse(o=>{if(o.morphTargetDictionary?.Blink!==undefined)morphs.push(o);});
 return {model,head:nodes.Head,body:nodes.BodyMesh,ears:[nodes.EarL,nodes.EarR],paws:[nodes.PawL,nodes.PawR],tail:nodes.Tail,morphs,
  blink(value){for(const m of morphs)m.morphTargetInfluences[m.morphTargetDictionary.Blink]=1-value;
   for(const s of ['L','R'])nodes['Glint'+s].visible=value>.5;},
  react(pet,celebrating){const smile=nodes.Smile;if(smile?.morphTargetDictionary?.Happy!==undefined)smile.morphTargetInfluences[smile.morphTargetDictionary.Happy]=pet?1:celebrating?.7:0;},
  dispose(){owned.forEach(m=>m.dispose());paintedGeometry.forEach(g=>g.dispose());paintedMaterials.forEach(m=>m.dispose());}
 };
}
