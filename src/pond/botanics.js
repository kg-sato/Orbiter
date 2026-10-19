import * as THREE from 'three';
let seed=829;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function art(size){const c=document.createElement('canvas');c.width=c.height=size;return [c,c.getContext('2d')];}
export function pondBed(){
 const [c,g]=art(2048);g.fillStyle='#172437';g.fillRect(0,0,2048,2048);
 // Fine mineral detail instead of the former oversized outlined cobblestones.
 for(let i=0;i<24000;i++){const x=random()*2048,y=random()*2048,r=.7+random()*6,v=34+Math.floor(random()*25);g.fillStyle=`rgba(${v+2},${v+10},${v+24},.45)`;g.beginPath();g.ellipse(x,y,r,r*.65,random()*6.28,0,6.28);g.fill();}
 for(let i=0;i<110;i++){const x=random()*2048,y=random()*2048,r=9+random()*28;const glow=g.createRadialGradient(x-r*.25,y-r*.3,0,x,y,r);glow.addColorStop(0,'#5a6f8a');glow.addColorStop(.65,'#344963');glow.addColorStop(1,'#203449');g.fillStyle=glow;g.beginPath();g.ellipse(x,y,r,r*.72,random()*6.28,0,6.28);g.fill();}
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
function koiSkin(index){
 const [c,g]=art(1024);g.fillStyle=index===2?'#edba61':'#edead9';g.fillRect(0,0,1024,1024);
 // Original irregular pigment patches; the texture follows the body surface.
 for(let j=0;j<9;j++){const x=random()*1024,y=90+random()*780;g.fillStyle=index===2?(j%3?'#252f2b':'#c65b22'):(index===1&&j%3===0?'#27332e':'#d94d21');g.beginPath();g.moveTo(x,y);for(let k=0;k<12;k++){const a=k/12*Math.PI*2,r=45+random()*85;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.85);}g.closePath();g.fill();}
 g.lineWidth=1.3;g.strokeStyle='#f9f4de24';for(let row=0;row<45;row++)for(let col=0;col<24;col++){const x=col*45+(row%2)*22,y=row*24;g.beginPath();g.arc(x,y,19,.1,Math.PI-.1);g.stroke();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
export function koi(index){
 const root=new THREE.Group(),skin=new THREE.MeshStandardMaterial({map:koiSkin(index),color:'#9daec1',roughness:.65,metalness:.03});
 const shape=new THREE.SphereGeometry(1,40,28),p=shape.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),t=(y+1)/2;const taper=.55+.45*Math.sin(t*Math.PI*.80);p.setXYZ(i,p.getX(i)*taper,p.getY(i),p.getZ(i));}shape.computeVertexNormals();
 const body=new THREE.Mesh(shape,skin);body.scale.set(.071,.23,.037);root.add(body);
 const finMat=new THREE.MeshStandardMaterial({color:'#e1dbc6',transparent:true,opacity:.38,roughness:.75,side:THREE.DoubleSide});
 const tailShape=new THREE.Shape();tailShape.moveTo(0,.035);tailShape.bezierCurveTo(-.025,-.035,-.085,-.07,-.105,-.17);tailShape.quadraticCurveTo(0,-.11,.105,-.17);tailShape.bezierCurveTo(.085,-.07,.025,-.035,0,.035);
 const tail=new THREE.Group();tail.position.y=-.20;tail.add(new THREE.Mesh(new THREE.ShapeGeometry(tailShape,20),finMat));
 for(let i=-3;i<=3;i++){const points=[new THREE.Vector3(0,0,.002),new THREE.Vector3(i*.025,-.13,.002)];tail.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#a7ad9b',transparent:true,opacity:.35})));}root.add(tail);
 for(const side of [-1,1]){const fin=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),finMat);fin.scale.set(.063,.075,.005);fin.position.set(side*.067,-.035,0);fin.rotation.z=side*.65;root.add(fin);const eye=new THREE.Mesh(new THREE.SphereGeometry(.006,12,8),new THREE.MeshStandardMaterial({color:'#141e1a',roughness:.12}));eye.position.set(side*.041,.13,.025);root.add(eye);}
 const mouth=new THREE.Mesh(new THREE.TorusGeometry(.010,.003,6,16),new THREE.MeshStandardMaterial({color:'#b9a68e'}));mouth.position.set(0,.225,.004);root.add(mouth);
 return {root,tail};
}
export function lilies(scene){
 const [c,g]=art(1024),gradient=g.createRadialGradient(490,525,10,512,512,520);gradient.addColorStop(0,'#8db6bc');gradient.addColorStop(.6,'#527e98');gradient.addColorStop(1,'#314a70');g.fillStyle=gradient;g.fillRect(0,0,1024,1024);
 for(let i=0;i<34;i++){const a=i/34*Math.PI*2;g.strokeStyle=i%2?'#bddfe74d':'#223f6b45';g.lineWidth=2;g.beginPath();g.moveTo(512,512);g.quadraticCurveTo(512+Math.cos(a+.08)*260,512+Math.sin(a+.08)*260,512+Math.cos(a)*510,512+Math.sin(a)*510);g.stroke();for(let j=1;j<5;j++){const r=j*90;g.lineWidth=.6;g.beginPath();g.moveTo(512+Math.cos(a)*r,512+Math.sin(a)*r);g.lineTo(512+Math.cos(a+.09)*(r+65),512+Math.sin(a+.09)*(r+65));g.stroke();}}
 for(let i=0;i<6000;i++){const x=random()*1024,y=random()*1024;g.fillStyle=i%2?'#d1e2f018':'#1b31551f';g.fillRect(x,y,1+random()*2,1+random()*2);}
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const outline=new THREE.Shape();outline.moveTo(0,0);for(let i=0;i<=100;i++){const a=.16+i/100*(Math.PI*2-.32),r=1+.018*Math.sin(a*9)+.012*Math.cos(a*15);outline.lineTo(Math.cos(a)*r,Math.sin(a)*r);}outline.closePath();
 const geometry=new THREE.ShapeGeometry(outline,60);const pos=geometry.attributes.position,uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+1)/2,(pos.getY(i)+1)/2);
 const material=new THREE.MeshStandardMaterial({map,roughness:.48,metalness:.02,side:THREE.DoubleSide});
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat wetRim=smoothstep(.43,.50,length(vMapUv-.5));float dew=exp(-dot(vMapUv-vec2(.32,.60),vMapUv-vec2(.32,.60))*1600.);diffuseColor.rgb+=vec3(.22,.40,.48)*wetRim*.18+vec3(.6,.8,.9)*dew*.14;');};
 const pads=[];for(const [x,y,s,a] of [[-.83,.88,.19,.5],[-.96,.46,.16,2.2],[.80,.82,.23,3.4],[.96,-.50,.27,1.1],[-.88,-.75,.24,-.7],[.65,-.91,.18,2.5],[.97,.18,.16,-1]]){const pad=new THREE.Mesh(geometry,material);pad.userData={x,y,size:s,angle:a};pad.position.set(x,y,.10);pad.scale.set(s,s*.84,1);pad.rotation.z=a;scene.add(pad);pads.push(pad);}
 const flower=new THREE.Group();flower.userData={x:-.92,y:.12,size:.11};
 const petalMat=new THREE.MeshStandardMaterial({color:'#eee8f8',roughness:.65}),petalGeo=new THREE.SphereGeometry(1,20,12);
 for(let ring=0;ring<2;ring++)for(let i=0;i<10;i++){const a=i/10*Math.PI*2+ring*.31,petal=new THREE.Mesh(petalGeo,petalMat);petal.scale.set(.025,.095-ring*.02,.011);petal.position.set(Math.sin(a)*(.065-ring*.025),Math.cos(a)*(.065-ring*.025),.025+ring*.025);petal.rotation.z=-a;flower.add(petal);}
 const heart=new THREE.Mesh(petalGeo,new THREE.MeshStandardMaterial({color:'#eacb4e',roughness:.7}));heart.scale.set(.038,.038,.02);heart.position.z=.07;flower.add(heart);scene.add(flower);
 return {pads,flower};
}
