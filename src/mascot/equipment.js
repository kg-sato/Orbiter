/* Original review models. No inventory writes, standalone rendering or timers. */
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

function kit(parent) {
  const root=new THREE.Group();parent.add(root);
  const rounded=new THREE.Shape();rounded.moveTo(-.38,-.5);rounded.lineTo(.38,-.5);rounded.quadraticCurveTo(.5,-.5,.5,-.38);rounded.lineTo(.5,.38);rounded.quadraticCurveTo(.5,.5,.38,.5);rounded.lineTo(-.38,.5);rounded.quadraticCurveTo(-.5,.5,-.5,.38);rounded.lineTo(-.5,-.38);rounded.quadraticCurveTo(-.5,-.5,-.38,-.5);
  const box=new THREE.ExtrudeGeometry(rounded,{depth:1,bevelEnabled:false,curveSegments:3});box.translate(0,0,-.5);
  const geometry={box,stone:new THREE.SphereGeometry(1,16,10),crystal:new THREE.LatheGeometry([new THREE.Vector2(0,-.5),new THREE.Vector2(.72,-.5),new THREE.Vector2(1,-.36),new THREE.Vector2(1,.25),new THREE.Vector2(0,.55)],5),gem:new THREE.OctahedronGeometry(1),ring:new THREE.TorusGeometry(1,.018,5,48)};
  const materials={stone:new THREE.MeshStandardMaterial({color:'#799ca9',roughness:.84}),dark:new THREE.MeshStandardMaterial({color:'#324b68',roughness:.7}),silver:new THREE.MeshStandardMaterial({color:'#d9e8ee',metalness:.72,roughness:.28}),prism:new THREE.MeshStandardMaterial({color:'#a1bbeb',metalness:.22,roughness:.3,emissive:'#344b8c',emissiveIntensity:.35}),light:new THREE.MeshStandardMaterial({color:'#b2eff3',emissive:'#6dcced',emissiveIntensity:.7,roughness:.4}),cloth:new THREE.MeshStandardMaterial({color:'#92a5cf',side:THREE.DoubleSide,roughness:.92})};
  const batches=new Map(),dummy=new THREE.Object3D();
  function instance(shape,mat,pos,scale,rotation=[0,0,0]){const key=shape+':'+mat;if(!batches.has(key))batches.set(key,[]);batches.get(key).push({pos,scale,rotation});}
  function finish(compact=false){let triangles=0;for(const [key,items] of batches){const [g,m]=key.split(':'),mesh=new THREE.InstancedMesh(geometry[g],materials[m],items.length);items.forEach((item,i)=>{dummy.position.set(...item.pos);dummy.scale.set(...item.scale);dummy.rotation.set(...item.rotation);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});root.add(mesh);triangles+=(geometry[g].index?.count||geometry[g].attributes.position.count)/3*items.length;}
    // These small static props can combine unlike shapes into one call/material.
    // Keep the established articulated/instanced studies on their existing path.
    if(compact){
      const buckets=new Map(),matrix=new THREE.Matrix4();
      for(const mesh of [...root.children])if(mesh.isMesh&&!mesh.userData.studyTick&&!mesh.children.length){
        if(!buckets.has(mesh.material))buckets.set(mesh.material,{parts:[],meshes:[]});const bucket=buckets.get(mesh.material);bucket.meshes.push(mesh);mesh.updateMatrix();
        for(let i=0;i<(mesh.isInstancedMesh?mesh.count:1);i++){if(mesh.isInstancedMesh)mesh.getMatrixAt(i,matrix);else matrix.identity();const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();bucket.parts.push(g.applyMatrix4(matrix).applyMatrix4(mesh.matrix));}
      }
      for(const [material,{parts,meshes}]of buckets){const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(merged){for(const mesh of meshes){mesh.removeFromParent();if(mesh.isInstancedMesh)mesh.dispose();else mesh.geometry.dispose();}root.add(new THREE.Mesh(merged,material));}}
    }
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
  function curve(points,mat,radius=.025,segments=64){const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,radius,5,false),materials[mat]);root.add(mesh);return mesh;}
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
  }else if(id==='habitat-04'){
    // A ribbed paper shade, hanging cap and tassel read separately at buddy scale.
    k.materials.prism.color.set('#ead5ad');k.materials.prism.emissive.set('#a9793f');k.materials.prism.emissiveIntensity=.16;
    k.materials.silver.color.set('#9ea99c');k.materials.silver.metalness=.28;
    instance('stone','stone',[-1.15,.015,-.20],[.22,.075,.18]);
    curve([[-1.20,.02,-.28],[-1.20,1.23,-.28],[-1.07,1.23,-.28]],'dark',.025,20);
    curve([[-1.08,1.23,-.28],[-1.08,1.12,-.28]],'silver',.012,8);
    instance('stone','prism',[-1.08,.88,-.28],[.205,.25,.18]);
    for(const y of [.67,.77,.88,.99,1.09]){const r=Math.sqrt(Math.max(.1,1-((y-.88)/.25)**2));instance('ring','silver',[-1.08,y,-.28],[.205*r,.18*r,.65],[Math.PI/2,0,0]);}
    for(const side of [-1,1])curve([[-1.08+side*.08,1.10,-.22],[-1.08+side*.15,.88,-.12],[-1.08+side*.08,.66,-.22]],'silver',.008,16);
    instance('box','dark',[-1.08,1.10,-.28],[.15,.035,.13]);instance('box','dark',[-1.08,.66,-.28],[.13,.035,.12]);
    curve([[-1.08,.64,-.28],[-1.08,.52,-.28]],'silver',.010,8);instance('gem','prism',[-1.08,.50,-.28],[.045,.08,.02]);
    // Grounded light pool, no particle loop or independent light/renderer.
    instance('stone','prism',[-1.10,-.008,-.12],[.28,.008,.20]);
  }else if(id==='habitat-09'){
    // Small open shrine on a floating stone deck, offset behind the right shore.
    k.materials.prism.color.set('#91aab7');k.materials.prism.emissiveIntensity=0;
    k.materials.silver.color.set('#c9c7b1');k.materials.silver.metalness=.20;
    const x=1.02,z=-.38;
    instance('stone','dark',[x,.10,z],[.39,.13,.31]);instance('box','stone',[x,.21,z],[.65,.10,.48]);
    for(const dx of [-.22,.22])for(const dz of [-.16,.16])instance('box','silver',[x+dx,.49,z+dz],[.040,.51,.040]);
    instance('box','silver',[x,.73,z],[.52,.045,.38]);
    const roofShape=new THREE.Shape();roofShape.moveTo(-.40,0);roofShape.quadraticCurveTo(-.22,.025,0,.22);roofShape.quadraticCurveTo(.22,.025,.40,0);roofShape.lineTo(.34,-.07);roofShape.quadraticCurveTo(0,.03,-.34,-.07);roofShape.closePath();
    const roofGeo=new THREE.ExtrudeGeometry(roofShape,{depth:.51,bevelEnabled:false,curveSegments:8});roofGeo.translate(x,.78,z-.255);root.add(new THREE.Mesh(roofGeo,k.materials.prism));
    curve([[x-.40,.78,z+.26],[x,.99,z+.26],[x+.40,.78,z+.26]],'silver',.014,16);
    instance('gem','light',[x,.48,z],[.075,.11,.065]);instance('box','dark',[x,.34,z],[.21,.04,.18]);
    for(let i=0;i<2;i++)instance('stone','stone',[.55+i*.24,.025,.15-i*.07],[.16,.045,.11]);
    for(const r of [.32,.43])instance('ring','silver',[x,-.02,z],[r,r*.66,.45],[Math.PI/2,0,0]);
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
  const result=k.finish(['habitat-04','habitat-09'].includes(id));result.userData.studyBudget.item=id;if(id==='habitat-12')result.userData.studyBudget.particles=24;
  return result;
}

export function accessoryStudy(parent,head,bow,id,stage=0){
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
  }else if(id==='halo-05'){
    k.materials.cloth.color.set('#ad8e79');k.materials.silver.color.set('#dfccb0');k.materials.silver.metalness=.15;
    // Explicit body-side anchors for Baby / Kitten / Young Cat / Adult.
    // The bag sits outside the left paw; the strap ends below the muzzle.
    const anchors=[[-.49,.42,.48,.86],[-.50,.45,.48,.91],[-.51,.49,.48,.96],[-.52,.53,.48,1]];
    const [x,y,z,s]=anchors[stage];root.position.set(x,y,z);root.scale.setScalar(s);
    instance('box','dark',[0,0,0],[.34,.32,.13]);instance('box','cloth',[0,0,.025],[.32,.30,.13]);
    instance('box','cloth',[0,.105,.105],[.35,.16,.045]);
    curve([[-.16,.12,.135],[0,.09,.14],[.16,.12,.135]],'silver',.012,12);
    instance('box','silver',[.015,.025,.14],[.055,.085,.025]);instance('box','dark',[.015,.032,.157],[.025,.032,.008]);
    // Stitched lower corners and a folded leaf tucked into the side seam.
    for(const side of [-1,1])for(let i=0;i<3;i++)instance('box','silver',[side*.13,-.04-i*.036,.10],[.020,.010,.009]);
    instance('gem','stone',[-.13,.23,.025],[.045,.10,.015],[0,0,-.35]);
    const shoulder=(bow.position.y-y)/s;
    curve([[-.14,.16,0],[.20,shoulder*.55+.04,.02],[.64,shoulder,.015]],'cloth',.029,20);
    curve([[-.14,.16,.035],[.20,shoulder*.55+.04,.055],[.64,shoulder,.05]],'silver',.007,20);
  }else if(id==='halo-09'){
    k.materials.silver.color.set('#c5ad80');k.materials.silver.metalness=.35;k.materials.light.color.set('#f3dfb4');k.materials.light.emissive.set('#d9b77e');k.materials.light.emissiveIntensity=.28;
    // A miniature framed lantern, scaled from the scarf anchor in every stage.
    const sizes=[.82,.88,.95,1];root.position.copy(bow.position);root.position.y-=.22*sizes[stage];root.position.z+=.16;root.scale.setScalar(sizes[stage]);
    curve([[-.16,.23,-.05],[0,.16,0],[.16,.23,-.05]],'silver',.012,16);
    instance('ring','silver',[0,.125,0],[.052,.052,.6]);
    instance('box','light',[0,-.015,0],[.13,.17,.08]);
    instance('box','dark',[0,.09,0],[.20,.045,.13]);instance('box','dark',[0,-.12,0],[.19,.040,.13]);
    for(const side of [-1,1])instance('box','silver',[side*.08,-.015,.055],[.018,.19,.025]);
    instance('box','silver',[0,-.015,.055],[.012,.18,.02]);
    instance('gem','silver',[0,-.175,0],[.025,.04,.015]);
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
  const result=k.finish(['halo-05','halo-09'].includes(id));result.userData.studyBudget.item=id;return result;
}
