/* Original Orbiter chest, authored from geometry. No downloaded model or textures.
   NODE_PATH=<existing Scheduler/node_modules> node design/chest/build_chest.cjs */
const fs=require('node:fs'),path=require('node:path');
const THREE=require('three');
const rootDir=path.resolve(__dirname,'../..');
global.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();}).catch(e=>this.onerror?.(e));}};
function material(name,color,metalness=.1,roughness=.4,emissive){return new THREE.MeshStandardMaterial({name,color,metalness,roughness,...(emissive?{emissive,emissiveIntensity:1.2}:{} )});}
const caseMat=material('Tidal enamel','#416c83',.25,.32),panelMat=material('Deep blue inset','#29475e',.22,.45),trimMat=material('Pearl lilac alloy','#b5b1d1',.65,.32),edgeMat=material('Sea glass edging','#94c8c4',.45,.33),darkMat=material('Velvet cavity','#122734',.02,.88),sealMat=material('Moonlit seal','#d4eee2',.35,.28,'#8bd9cf');
const root=new THREE.Group();root.name='ChestRoot';root.userData={artwork:'Original Orbiter chest',version:'orbiter-chest-1',license:'Original Orbiter artwork'};
function mesh(name,geometry,mat,parent=root){const o=new THREE.Mesh(geometry,mat);o.name=name;parent.add(o);return o;}
// Six analytic bevelled faces: 108 triangles, continuous rounded normals, no modifier/runtime cost.
function roundedBox(w,h,d,r){const half=[w/2,h/2,d/2],positions=[],normals=[],indices=[];for(let axis=0;axis<3;axis++)for(const side of [-1,1]){const u=(axis+1)%3,v=(axis+2)%3,vals=a=>[-half[a],-half[a]+r,half[a]-r,half[a]],us=vals(u),vs=vals(v),start=positions.length/3;for(let j=0;j<4;j++)for(let i=0;i<4;i++){const p=[0,0,0];p[axis]=half[axis]*side;p[u]=us[i];p[v]=vs[j];const core=p.map((value,k)=>Math.max(-half[k]+r,Math.min(half[k]-r,value))),delta=new THREE.Vector3(...p.map((value,k)=>value-core[k])).normalize();positions.push(...core.map((value,k)=>value+delta.getComponent(k)*r));normals.push(delta.x,delta.y,delta.z);}for(let j=0;j<3;j++)for(let i=0;i<3;i++){const a=start+j*4+i,b=a+1,c=a+4,e=c+1;if(side>0)indices.push(a,b,c,b,e,c);else indices.push(a,c,b,b,c,e);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(indices);return g;}
function box(name,p,size,mat,r=.06,parent=root){const o=mesh(name,roundedBox(...size,Math.min(r,...size.map(v=>v*.43))),mat,parent);o.position.set(...p);return o;}
// An actual hollow body: separate wall shells and a low dark floor, no solid block in its cavity.
box('CaseFront',[0,.66,.59],[2,.76,.18],caseMat);
box('CaseRear',[0,.66,-.59],[2,.76,.18],caseMat);
box('CaseLeft',[-.92,.66,0],[.18,.76,1.05],caseMat);
box('CaseRight',[.92,.66,0],[.18,.76,1.05],caseMat);
box('CavityFloor',[0,.34,0],[1.76,.13,1.08],darkMat);
box('FrontInset',[0,.67,.688],[1.60,.43,.04],panelMat,.015);
for(const x of [-.67,.67])box('FrontBand'+(x<0?'L':'R'),[x,.66,.706],[.105,.78,.075],trimMat,.025);
box('UpperFrontRim',[0,1.035,.59],[2.04,.08,.18],edgeMat,.025);
box('UpperRearRim',[0,1.035,-.59],[2.04,.08,.18],edgeMat,.025);
for(const x of [-.95,.95])box('UpperSideRim'+(x<0?'L':'R'),[x,1.035,0],[.13,.08,1.07],edgeMat,.025);
box('LowerPlinth',[0,.29,0],[2.04,.15,1.37],panelMat,.05);
for(const x of [-.77,.77])for(const z of [-.43,.43])box('Foot'+(x<0?'L':'R')+(z<0?'Rear':'Front'),[x,.16,z],[.32,.28,.33],trimMat,.07);
const hinge=new THREE.Group();hinge.name='LidHinge';hinge.position.set(0,1.075,-.60);root.add(hinge);
// Vaulted lid with separate inner surface and end caps; rear pivot stays rigid.
const steps=16,outer=[],inner=[];for(let i=0;i<=steps;i++){const t=i/steps*Math.PI;outer.push([1.075+.47*Math.sin(t),.64*Math.cos(t)]);inner.push([1.075+.40*Math.sin(t),.575*Math.cos(t)]);}
function archSurface(name,profile,x1,x2,mat,flip=false){const pos=[],idx=[];for(const x of [x1,x2])for(const [y,z]of profile)pos.push(x,y-1.075,z+.60);for(let i=0;i<steps;i++){const a=i,b=i+1,c=i+steps+1,e=c+1;idx.push(...(flip?[a,c,b,b,c,e]:[a,b,c,b,e,c]));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return mesh(name,g,mat,hinge);}
archSurface('Lid',outer,-1.0,1.0,caseMat,true);
archSurface('LidInner',inner,-.93,.93,darkMat);
for(const x of [-1,1]){const points=outer.map(([y,z])=>new THREE.Vector3(x,y-1.075,z+.60));points.push(new THREE.Vector3(x,0,0));const g=new THREE.BufferGeometry().setFromPoints(points),idx=[];for(let i=0;i<steps;i++)idx.push(...(x<0?[steps+1,i,i+1]:[steps+1,i+1,i]));g.setIndex(idx);g.computeVertexNormals();mesh('LidEnd'+(x<0?'L':'R'),g,caseMat,hinge);}
for(const x of [-.67,.67])archSurface('LidBand'+(x<0?'L':'R'),outer.map(([y,z])=>[y+.018,z*1.018]),x-.055,x+.055,trimMat,true);
for(const x of [-1.005,1.005])archSurface('LidEdge'+(x<0?'L':'R'),outer.map(([y,z])=>[y+.012,z*1.015]),x-.022,x+.022,edgeMat,true);
// Rear hinge barrels and a front clasp on the moving lid.
for(const x of [-.66,.66]){const o=mesh('HingeBarrel'+(x<0?'L':'R'),new THREE.CylinderGeometry(.075,.075,.25,12),trimMat);o.rotation.z=Math.PI/2;o.position.set(x,1.04,-.66);}
box('LidClasp',[0,-.035,1.28],[.27,.26,.075],trimMat,.05,hinge);
const seal=new THREE.Group();seal.name='Seal';seal.position.set(0,-.025,1.335);hinge.add(seal);
const disc=mesh('MoonSealDisc',new THREE.CylinderGeometry(.145,.145,.045,24),panelMat,seal);disc.rotation.x=Math.PI/2;
const star=new THREE.Shape();for(let i=0;i<8;i++){const angle=Math.PI/2+i*Math.PI/4,r=i%2?.052:.12,x=Math.cos(angle)*r,y=Math.sin(angle)*r;if(i===0)star.moveTo(x,y);else star.lineTo(x,y);}star.closePath();
const sealStar=mesh('MoonStar',new THREE.ExtrudeGeometry(star,{depth:.018,bevelEnabled:false,steps:1}),sealMat,seal);sealStar.position.z=.024;
const opening=new THREE.Group();opening.name='OpeningAnchor';opening.position.set(0,1.04,0);root.add(opening);
const reward=new THREE.Group();reward.name='RewardAnchor';reward.position.set(0,1.08,0);root.add(reward);
const rewardLight=mesh('RewardLight',new THREE.ExtrudeGeometry(star,{depth:.06,bevelEnabled:false,steps:1}),sealMat,reward);
// Export all authored nodes, including anchors; animation belongs to the shared presentation controller.
(async()=>{const {GLTFExporter}=await import(require('node:url').pathToFileURL(require.resolve('three/addons/exporters/GLTFExporter.js')).href);const exporter=new GLTFExporter(),bytes=await exporter.parseAsync(root,{binary:true,onlyVisible:false,trs:true});const target=path.join(rootDir,'src/mascot/assets/chest.glb');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,Buffer.from(bytes));let triangles=0,meshes=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});console.log(JSON.stringify({target,bytes:bytes.byteLength,triangles,meshes}));})().catch(e=>{console.error(e);process.exitCode=1});
