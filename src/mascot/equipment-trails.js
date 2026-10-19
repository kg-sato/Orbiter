import * as THREE from 'three';
export function studyTrail(id){
 const root=new THREE.Group(),color=id==='trail-comet'?'#edc7b5':id==='trail-waves'?'#a1dce4':'#cfdcf5';
 const material=new THREE.LineBasicMaterial({color,transparent:true,opacity:.32});
 if(id==='trail-sparks'){
  const points=[[-1,.48,-.3],[-1.12,1.02,-.3],[-.91,1.30,-.3],[.96,1.38,-.4],[1.13,.97,-.2],[.98,.53,-.25]];
  for(const segment of [points.slice(0,3),points.slice(3)])root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(segment.map(p=>new THREE.Vector3(...p))),material));
  const stars=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.036),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.4}),points.length),dummy=new THREE.Object3D();
  points.forEach((p,i)=>{dummy.position.set(...p);dummy.scale.setScalar(i%2?.65:1);dummy.updateMatrix();stars.setMatrixAt(i,dummy.matrix);});root.add(stars);
 }else if(id==='trail-waves'){
  for(let j=0;j<2;j++){const points=Array.from({length:48},(_,i)=>{const t=i/47;return new THREE.Vector3(-1.12+t*2.24,.20+Math.sin(t*8+j)*.05,-.12+j*.10);});const ribbon=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);root.add(ribbon);ribbon.userData.studyTick=({time,motion,focus})=>{ribbon.position.z=Math.sin(time*(focus?.8:.35)+j)*.045*motion;};}
 }else{
  const points=Array.from({length:48},(_,i)=>{const t=i/47*Math.PI*1.25;return new THREE.Vector3(Math.cos(t)*1.13,1.02+Math.sin(t)*.7,-.32);});
  const colors=[];points.forEach((p,i)=>{const c=new THREE.Color(color).multiplyScalar(.18+.82*i/47);colors.push(c.r,c.g,c.b);});
  const g=new THREE.BufferGeometry().setFromPoints(points);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));root.add(new THREE.Line(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.65})));
  const leader=new THREE.Mesh(new THREE.SphereGeometry(.048,10,7),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.6}));leader.position.copy(points.at(-1));root.add(leader);
 }
 let calls=0,triangles=0;root.traverse(o=>{if(o.isMesh||o.isLine)calls++;if(o.isMesh)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.count||1);});root.userData.studyBudget={item:id,drawCalls:calls,triangles,particles:id==='trail-sparks'?6:id==='trail-comet'?1:0};
 return root;
}
