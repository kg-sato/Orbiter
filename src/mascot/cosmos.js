import * as THREE from 'three';

const palettes=['#95cfc2','#c6b0e4','#e8bca6','#9bbee0','#a5cbb1','#d8b8cf','#b9a5e4','#a6d8da','#e4d39a','#99b6e4','#dbb8e8','#9bd4c5'];
// An open tidal habitat: no vertical frame, enclosure or backdrop wall.
export function island(id,scenePreset='tidal-night'){
 const root=new THREE.Group(),n=Math.max(0,(Number(id?.slice(-2))||1)-1);
 const tint=new THREE.Color(id?palettes[n%12]:scenePreset==='opal-dawn'?'#d4b1bf':scenePreset==='lunar-mist'?'#b6bbdc':'#9bc9c3');
 const rock=new THREE.MeshStandardMaterial({color:tint.clone().multiplyScalar(.48),roughness:.9});
 const pebbleGeo=new THREE.SphereGeometry(1,20,12);
 function pebble(x,y,z,sx,sy,sz){const m=new THREE.Mesh(pebbleGeo,rock);m.position.set(x,y,z);m.scale.set(sx,sy,sz);root.add(m);return m;}
 pebble(0,-.25,-.02,1.26,.23,.77);pebble(-.26,-.025,.20,.70,.07,.43);
 for(let i=0;i<7;i++){const a=i*.74+.25;pebble(Math.cos(a)*1.08,-.045,Math.sin(a)*.58-.07,.18+(i%2)*.06,.07+(i%3)*.02,.14);}
 const uniforms={time:{value:0},tint:{value:tint},attention:{value:new THREE.Vector2()},strength:{value:.5}};
 const water=new THREE.Mesh(new THREE.CircleGeometry(1.10,64),new THREE.ShaderMaterial({transparent:false,uniforms,vertexShader:'varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 p;uniform float time;uniform vec3 tint;uniform vec2 attention;uniform float strength;
 void main(){vec2 q=p*8.;float a=sin(q.x+sin(q.y+time*.35))+sin(q.y*1.3-time*.3);float caustic=pow(max(0.,1.-abs(a)*2.3),3.);float r=length(p-attention*.32);float ripple=pow(.5+.5*sin(r*25.-time*1.5),12.)*.08;float edge=1.-smoothstep(.93,1.16,length(p));vec3 c=mix(vec3(.055,.15,.19),tint,.20+caustic*.23+ripple);if(edge<.05)discard;gl_FragColor=vec4(c*.55,1.);}` }));
 water.rotation.x=-Math.PI/2;water.scale.y=.63;water.position.set(0,.008,-.04);root.add(water);
 // Small original fish silhouettes beneath the water, outside the resting rock.
 const fish=[];for(let i=0;i<2;i++){
  const f=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:i?'#d8b9b0':'#d8e7cb',roughness:.75});
  const body=new THREE.Mesh(pebbleGeo,mat);body.scale.set(.055,.025,.15);f.add(body);
  const tail=new THREE.Mesh(new THREE.ConeGeometry(.065,.12,3),mat);tail.rotation.x=Math.PI/2;tail.position.z=-.15;f.add(tail);
  f.position.set(i?-.90:.84,-.01,-.22);root.add(f);fish.push(f);
 }
 // A low mist veil uses a small local shader, not a full-window blur/filter.
 const mistPixels=new Uint8Array(128*64*4);for(let y=0;y<64;y++)for(let x=0;x<128;x++){const k=(y*128+x)*4,edge=Math.sin(x/127*Math.PI)*Math.sin(y/63*Math.PI);mistPixels[k]=mistPixels[k+1]=mistPixels[k+2]=255;mistPixels[k+3]=Math.round(255*edge*edge*(.45+.3*Math.sin(x*.13+Math.sin(y*.19))));}
 const mistTexture=new THREE.DataTexture(mistPixels,128,64);mistTexture.needsUpdate=true;
 const plumes=[];for(let i=0;i<4;i++){const fog=new THREE.Mesh(new THREE.PlaneGeometry(.90,1.25),new THREE.MeshBasicMaterial({color:tint.clone().lerp(new THREE.Color('#e4e0e9'),.35),map:mistTexture,transparent:true,opacity:.10,depthWrite:false}));fog.position.set((i-1.5)*.48,.25,-.30);root.add(fog);plumes.push(fog);}
 root.userData.plumes=plumes;
 let wind=0,lastX=0,lastTime=null;
 // A restrained abstract grass arc keeps the silhouette open.
 const points=Array.from({length:25},(_,i)=>{const a=i/24*Math.PI;return new THREE.Vector3(-.88+Math.sin(a)*.16,.02+Math.sin(a)*.40,-.28+Math.cos(a)*.14);});
 root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:tint,transparent:true,opacity:.4})));
 root.userData.tick=(x,y,motion,time=0,strength=.5)=>{uniforms.time.value=time;uniforms.strength.value=strength;uniforms.attention.value.set(x*motion,y*motion);const dt=lastTime===null?0:Math.max(0,Math.min(.10,time-lastTime));
 if(motion&&dt>0)wind=THREE.MathUtils.clamp(wind*Math.exp(-dt*3)+(x-lastX)*2,-.55,.55);else if(!motion)wind=0;
 lastX=x;lastTime=time;
 plumes.forEach((fog,i)=>{const lift=motion?((time*.11+i*.25)%1):.27;const envelope=motion?Math.sin(lift*Math.PI):.45;fog.position.set((i-1.5)*.48+wind*(.5+lift)+Math.sin(time*.23+i)*.06*motion,.08+lift*1.20,-.30);fog.scale.set( .65+lift*.65+Math.abs(wind)*.4,.65+lift*.45,1);fog.rotation.z=-wind*.35;fog.material.opacity=envelope*(.08+strength*.12);});fish.forEach((f,i)=>{const a=time*.25+i*Math.PI;f.position.set(Math.cos(a)*.91,.018,Math.sin(a)*.40-.12);f.rotation.y=-a+Math.PI/2;f.children[1].rotation.z=Math.sin(time*3+i)*.18*motion;});};
 return root;
}
export function environment(id,scenePreset='tidal-night'){
 const root=new THREE.Group(),n=Math.max(0,(Number(id?.slice(-2))||1)-1),color=new THREE.Color(palettes[n%12]);
 color.lerp(new THREE.Color(scenePreset==='opal-dawn'?'#edc3ae':scenePreset==='lunar-mist'?'#c4c5ed':'#9dccd0'),.18);
 const sky=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},tint:{value:color},strength:{value:.5},attention:{value:new THREE.Vector2()}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float time;uniform vec3 tint;uniform float strength;uniform vec2 attention;
 void main(){vec2 p=vUv-.5-attention*.06;float r=length(p);float wave=sin(p.x*9.+sin(p.y*7.+time*.12)+time*.10)*.5+.5;float cloud=exp(-r*r*6.)*(.3+wave*.7);float edge=1.-smoothstep(.30,.52,r);vec3 c=mix(vec3(.12,.13,.25),tint,wave*.62);gl_FragColor=vec4(c,edge*cloud*strength*.65);}`});
 const haze=new THREE.Mesh(new THREE.PlaneGeometry(1.85,1.5),sky);haze.position.set(0,.87,-.52);root.add(haze);
 const planetMat=new THREE.MeshStandardMaterial({color,roughness:.86});
 const planet=new THREE.Mesh(new THREE.SphereGeometry(.19+(n%3)*.025,24,16),planetMat);planet.position.set(n%2?-.70:.70,1.29,-.36);root.add(planet);
 const ringMat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5,side:THREE.DoubleSide});
 const ring=new THREE.Mesh(new THREE.RingGeometry(.27,.30,40),ringMat);ring.position.copy(planet.position);ring.rotation.set(.85,.4,.25+n*.2);root.add(ring);
 const points=[];for(let i=0;i<16;i++)points.push(Math.sin(i*17.31)*.9,.25+((i*13)%23)/18,-.50);
 const stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3)),new THREE.PointsMaterial({color:'#eee4ce',size:.025,transparent:true,opacity:.7,sizeAttenuation:false}));root.add(stars);
 root.userData.tick=(time,motion,strength,x=0,y=0)=>{sky.uniforms.time.value=time;sky.uniforms.strength.value=strength;sky.uniforms.attention.value.set(x*motion,y*motion);ring.rotation.z=.25+n*.2+time*.025*motion;stars.material.opacity=.5+Math.sin(time*.5)*.15*motion;};
 return root;
}
export function trail(id){
 const root=new THREE.Group(),color=id==='trail-comet'?'#e9c3aa':id==='trail-sparks'?'#d9d2f1':'#acdcd1';
 for(let i=0;i<(id==='trail-sparks'?1:3);i++){
  const curve=new THREE.EllipseCurve(0,0,1.08+i*.08,.47+i*.08,0,Math.PI*(id==='trail-comet'?1.25:1.85),false,i*.8);
  const points=curve.getPoints(40).map(p=>new THREE.Vector3(p.x,p.y+1.12,-.25));
  const path=id==='trail-sparks'?Array.from({length:8},(_,j)=>new THREE.Vector3(Math.sin(j*2.4)*1.13,1.05+Math.cos(j*2.4)*.8,-.1)):points;
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path),new THREE.LineBasicMaterial({color,transparent:true,opacity:.25+i*.13}));line.rotation.z=(i-1)*.24;root.add(line);
 }
 for(let i=0;i<7;i++){const star=new THREE.Mesh(new THREE.OctahedronGeometry(i%3===0?.048:.024),new THREE.MeshBasicMaterial({color}));star.position.set(Math.sin(i*2.4)*1.13,1.05+Math.cos(i*2.4)*.8,-.1);root.add(star);}
 return root;
}
