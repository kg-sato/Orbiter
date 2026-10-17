/* Original review models. No inventory writes, standalone rendering or timers. */
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

function kit(parent) {
  const root=new THREE.Group();parent.add(root);
  const geometry={stone:new THREE.SphereGeometry(1,16,10),crystal:new THREE.LatheGeometry([new THREE.Vector2(0,-.5),new THREE.Vector2(.72,-.5),new THREE.Vector2(1,-.36),new THREE.Vector2(1,.25),new THREE.Vector2(0,.55)],5),gem:new THREE.OctahedronGeometry(1),ring:new THREE.TorusGeometry(1,.018,5,48)};
  const materials={stone:new THREE.MeshStandardMaterial({color:'#799ca9',roughness:.84}),dark:new THREE.MeshStandardMaterial({color:'#324b68',roughness:.7}),silver:new THREE.MeshStandardMaterial({color:'#d9e8ee',metalness:.72,roughness:.28}),prism:new THREE.MeshStandardMaterial({color:'#a1bbeb',metalness:.22,roughness:.3,emissive:'#344b8c',emissiveIntensity:.35}),light:new THREE.MeshStandardMaterial({color:'#b2eff3',emissive:'#6dcced',emissiveIntensity:.7,roughness:.4}),cloth:new THREE.MeshStandardMaterial({color:'#92a5cf',side:THREE.DoubleSide,roughness:.92})};
  const batches=new Map(),dummy=new THREE.Object3D();
  function instance(shape,mat,pos,scale,rotation=[0,0,0]){const key=shape+':'+mat;if(!batches.has(key))batches.set(key,[]);batches.get(key).push({pos,scale,rotation});}
  function finish(){let triangles=0;for(const [key,items] of batches){const [g,m]=key.split(':'),mesh=new THREE.InstancedMesh(geometry[g],materials[m],items.length);items.forEach((item,i)=>{dummy.position.set(...item.pos);dummy.scale.set(...item.scale);dummy.rotation.set(...item.rotation);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});root.add(mesh);triangles+=(geometry[g].index?.count||geometry[g].attributes.position.count)/3*items.length;}
    // Merge static same-material detail paths; articulated pieces stay separate.
    const mergeBuckets=new Map();for(const mesh of [...root.children])if(mesh.isMesh&&!mesh.isInstancedMesh&&!mesh.userData.studyTick&&!mesh.children.length){if(!mergeBuckets.has(mesh.material))mergeBuckets.set(mesh.material,[]);mergeBuckets.get(mesh.material).push(mesh);}
    for(const [material,meshes] of mergeBuckets)if(meshes.length>1){const parts=meshes.map(mesh=>{mesh.updateMatrix();return mesh.geometry.clone().applyMatrix4(mesh.matrix);});const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(merged){for(const mesh of meshes){mesh.removeFromParent();mesh.geometry.dispose();}root.add(new THREE.Mesh(merged,material));}}
    // Budget records include every manually added surface below as well.
    let calls=0;triangles=0;root.traverse(o=>{if(o.isMesh){calls++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.count||1);}});
    root.userData.studyBudget={drawCalls:calls,triangles,particles:0};
    // Unused helper resources have no render owner; release them immediately.
    const usedG=new Set(),usedM=new Set();root.traverse(o=>{if(o.isMesh){usedG.add(o.geometry);usedM.add(o.material);}});
    Object.values(geometry).forEach(g=>{if(!usedG.has(g))g.dispose();});Object.values(materials).forEach(m=>{if(!usedM.has(m))m.dispose();});
    return root;
  }
  function curve(points,mat,radius=.025){const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),64,radius,5,false),materials[mat]);root.add(mesh);return mesh;}
  return {root,materials,instance,finish,curve};
}

export function habitatStudy(parent,id){
  const k=kit(parent),{root,instance,curve}=k;root.position.z=-.13;
  // Enlarge the environment independently: the kitten keeps its proportions.
  root.scale.set(1.08,1.35,1.20);
  // Wide shelf anchors the cat to the shore; scenery frames the sides, never the face.
  instance('stone','dark',[0,-.13,0],[1.16,.10,.64]);
  instance('stone','stone',[0,-.065,.03],[.84,.055,.46]);
  if(id==='habitat-01'){
    // Raised rear banks give the pool vertical depth without enclosing the cat.
    instance('stone','stone',[-1.02,.13,-.42],[.30,.24,.26]);
    instance('stone','stone',[1.04,.10,-.39],[.27,.20,.24]);
    const stones=[[-1.12,-.03,.22,.32],[-.98,0,-.4,.28],[.86,-.02,.36,.24],[1.12,-.04,-.14,.29],[-.50,-.07,.62,.19]];
    stones.forEach(([x,y,z,size],i)=>{instance('stone','stone',[x,y,z],[size,.10,size*.76],[0,i*.7,.1]);instance('stone','light',[x,y+.067,z],[size*.70,.008,size*.46]);});
    for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.28+i*.16,.006,4,48),k.materials.light);ring.rotation.x=Math.PI/2;ring.position.set(.85,.015,.10);root.add(ring);ring.userData.studyTick=({time,motion})=>{ring.scale.setScalar(1+Math.sin(time*.75-i*.8)*.10*motion);};}
  }else if(id==='habitat-07'){
    for(const side of [-1,1])for(let i=0;i<3;i++){const height=.54+i*.29,x=side*(.93+i*.14),z=-.23-i*.11;instance('crystal','prism',[x,height*.45-.02,z],[.18,height,.22],[0,i*.65,side*-.14]);instance('gem','light',[x,height-.03,z],[.055,.085,.055]);}
    for(let i=0;i<3;i++)curve([[-1.08+i*.04,-.005,.23],[0,.005,.5-i*.16],[1.02,.005,.19-i*.13]],i%2?'prism':'light',.009);
    root.userData.studyTick=({time,motion,x,celebrating})=>{k.materials.prism.emissiveIntensity=.35+Math.max(0,x)*.25+ (celebrating?.3:Math.sin(time*.6)*.06*motion);};
  }else if(id==='habitat-11'){
    // Tall open flower banks; petals and leaves share batches, not contexts.
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const x=side*(.87+i*.15),height=.45+i*.19,z=-.20-i*.13;
      instance('stone','dark',[x,height*.42,z],[.025,height*.48,.025]);
      for(const sign of [-1,1])instance('stone','stone',[x+sign*.09,height*.42,z],[.13,.035,.065],[0,0,sign*.45]);
      for(let p=0;p<5;p++){const angle=p/5*Math.PI*2;instance('stone','prism',[x+Math.cos(angle)*.12,height+Math.sin(angle)*.10,z],[.10,.075,.045],[0,0,angle]);}
      instance('gem','light',[x,height,z+.065],[.055,.055,.025]);
    }
    root.userData.studyTick=({time,motion,celebrating})=>{k.materials.prism.emissiveIntensity=.22+(celebrating?.6:Math.sin(time*.5)*.04*motion);};
  }else{
    // A true crossing current, with height separation at its intersection.
    for(let lane=0;lane<2;lane++){
      const points=Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2;return [Math.sin(a)*1.22,.02+.42*Math.pow(Math.sin(a),6)+lane*.025,Math.sin(a*2)*.43+lane*.04];});
      curve(points,lane?'prism':'light',lane?.013:.019);
    }
    instance('stone','prism',[-1.08,.12,-.3],[.24,.13,.21]);instance('stone','prism',[1.08,.12,-.3],[.24,.13,.21]);
    const motes=new THREE.InstancedMesh(new THREE.SphereGeometry(.025,8,5),k.materials.light,24),dummy=new THREE.Object3D();root.add(motes);
    root.userData.studyTick=({time,motion,x,focus,celebrating})=>{for(let i=0;i<24;i++){const a=i/24*Math.PI*2+time*(focus?.22:.13)*motion;dummy.position.set(Math.sin(a)*(1.22+Math.abs(x)*.025),.05+.42*Math.pow(Math.sin(a),6)+Math.max(0,celebrating?.06:0),Math.sin(a*2)*.43);dummy.scale.setScalar(.6+(i%3)*.2);dummy.updateMatrix();motes.setMatrixAt(i,dummy.matrix);}motes.instanceMatrix.needsUpdate=true;};
  }
  const result=k.finish();result.userData.studyBudget.item=id;if(id==='habitat-12')result.userData.studyBudget.particles=24;
  return result;
}

export function accessoryStudy(parent,head,bow,id){
  const k=kit(parent),{root,instance,curve}=k;
  root.position.y=bow.position.y-.73;
  if(id==='halo-thin'){
    // A visible engraved pendant replaces the old floating generic halo.
    curve([[-.21,.93,.41],[0,.71,.47],[.21,.93,.41]],'silver',.012);
    instance('gem','silver',[0,.64,.49],[.13,.16,.045]);
    instance('gem','dark',[0,.64,.531],[.073,.10,.009]);
    instance('gem','light',[0,.65,.545],[.022,.058,.008]);
    root.userData.studyTick=({time,motion,pet})=>{root.rotation.z=Math.sin(time*1.7)*.025*motion;k.materials.light.emissiveIntensity=pet?1.4:.55;};
  }else if(id==='halo-07'){
    // Shoulder cape drapes to the sides; curved geometry, not a flattened ball.
    const vertices=[],indices=[],rows=12,cols=24;
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols,v=j/rows,a=-Math.PI*.1+u*Math.PI*1.2,r=.33+v*.64;vertices.push(Math.cos(a)*r, .96-v*.70, -.08-Math.sin(a)*(.32+v*.13)+v*.25);}
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const cape=new THREE.Mesh(g,k.materials.cloth);root.add(cape);
    for(const side of [-1,1]){curve([[side*.23,.92,.11],[side*.57,.59,.20],[side*.88,.29,.23]],'silver',.012);for(let i=0;i<4;i++)instance('gem','light',[side*(.35+i*.15),.78-i*.14,.24],[.032,.045,.012]);}
    root.userData.studyTick=({time,motion,celebrating})=>{cape.rotation.y=Math.sin(time*.9)*.035*motion;cape.rotation.x=celebrating?-.035:0;k.materials.light.emissiveIntensity=.6+(celebrating?.7:0);};
  }else if(id==='halo-10'){
    root.position.copy(bow.position);root.position.y-=.20;root.position.z+=.11;
    // Pocket-watch-like compass: thick rim, dial, needle and cardinal engraving.
    instance('stone','dark',[0,0,0],[.16,.16,.035]);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.16,.022,6,32),k.materials.silver);root.add(rim);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;instance('gem','silver',[Math.sin(a)*.125,Math.cos(a)*.125,.04],[.015,.025,.009],[0,0,-a]);}
    const needle=new THREE.Group();root.add(needle);
    const north=new THREE.Mesh(new THREE.ConeGeometry(.032,.14,3),k.materials.light);north.position.set(0,.045,.055);north.scale.z=.25;needle.add(north);
    root.userData.studyTick=({x,motion,focus})=>{needle.rotation.z=focus?0:x*.5*motion;};
  }else{
    // Broad layered lunar feathers remain identifiable at 120 pixels.
    const wings=[];
    for(const side of [-1,1]){
      const wing=new THREE.Group();wing.position.set(side*.36,.8,-.18);root.add(wing);wings.push(wing);
      const geo=new THREE.SphereGeometry(1,12,8),mesh=new THREE.InstancedMesh(geo,k.materials.prism,5),d=new THREE.Object3D();
      for(let i=0;i<5;i++){d.position.set(side*(.22+i*.105),.29-i*.16,0);d.scale.set(.13,.35-i*.015,.045);d.rotation.z=-side*(.75-i*.07);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);}wing.add(mesh);
      const moon=new THREE.Mesh(new THREE.TorusGeometry(.14,.025,5,28,Math.PI*1.45),k.materials.silver);moon.position.set(side*.22,.18,.055);moon.rotation.z=side*.3;wing.add(moon);
    }
    root.userData.studyTick=({time,motion,celebrating})=>wings.forEach((wing,i)=>{wing.rotation.y=(i?1:-1)*(Math.sin(time*.75)*.025*motion+(celebrating?.24:0));});
  }
  const result=k.finish();result.userData.studyBudget.item=id;return result;
}
