import * as THREE from 'three';
const profiles={
 mint:{base:'#b4e6d5',mark:'#619cae',kind:1,rough:.78},
 'look-11':{base:'#d8c7ed',mark:'#8b91c5',kind:2,rough:.48},
 indigo:{base:'#939ddd',mark:'#c9dfee',kind:3,rough:.82}
};
// Add authored markings after persistent identity paint, never replace that paint.
export function styleAvatar(model,id){
 const profile=profiles[id];if(!profile||window.OrbiterStudyOriginal)return;
 model.updateMatrixWorld(true);
 model.traverse(o=>{
  if(!o.isMesh||!['HeadMesh','BodyMesh'].includes(o.name))return;
  const prior=o.material,material=prior.clone(),previous=prior.onBeforeCompile.bind(prior),oldKey=prior.customProgramCacheKey.bind(prior);o.material=material;
  const anchor=model.getObjectByName(o.name==='HeadMesh'?'Head':'Body');
  const g=o.geometry.clone(),positions=g.attributes.position,paint=[],center=new THREE.Vector3().setFromMatrixPosition(anchor?.matrixWorld||o.matrixWorld),v=new THREE.Vector3();
  for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld).sub(center);paint.push(v.x,v.y,v.z);}
  g.setAttribute('pondPaintPosition',new THREE.Float32BufferAttribute(paint,3));o.geometry=g;o.userData.studyGeometry=true;
  material.roughness=profile.rough;
  material.onBeforeCompile=shader=>{previous(shader);Object.assign(shader.uniforms,{pondStyle:{value:profile.kind},pondInk:{value:new THREE.Color(profile.mark)}});
   shader.vertexShader='attribute vec3 pondPaintPosition;varying vec3 pondPaint;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npondPaint=pondPaintPosition;');
   shader.fragmentShader='varying vec3 pondPaint;uniform float pondStyle;uniform vec3 pondInk;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    vec3 pp=pondPaint;float pigment=0.;
    if(pondStyle<1.5){pigment=smoothstep(.65,.85,sin(pp.y*20.+sin(pp.x*7.)*.8));}
    else if(pondStyle<2.5){vec2 cell=fract(vec2(pp.x+pp.y,pp.y-pp.x)*6.);pigment=step(.85,cell.x+cell.y)*.8;}
    else{vec2 grid=fract(pp.xy*11.)-.5;float dotStar=1.-smoothstep(.025,.09,length(grid));pigment=dotStar;}
    // Cover the whole coat continuously. Eyes, nose and smile are separate meshes;
    // excluding the centre of the head created an unintended bare forehead/face.
    pigment*=.45;diffuseColor.rgb=mix(diffuseColor.rgb,pondInk,pigment);`);
  };
  material.customProgramCacheKey=()=>oldKey()+'pond-review-'+id;
 });
}
export function styleScarf(material,id){
 if(!profiles[id]||window.OrbiterStudyOriginal)return;
 material.color.set(profiles[id].base);
 material.roughness=profiles[id].rough;
 material.onBeforeCompile=shader=>{shader.vertexShader='varying vec2 scarfUv;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nscarfUv=uv;');shader.fragmentShader='varying vec2 scarfUv;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float stitch=step(.89,fract(scarfUv.x*18.))*step(.6,fract(scarfUv.y*8.));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.88,.94),stitch*.5);`);};
 material.customProgramCacheKey=()=> 'pond-scarf-'+id;
}
