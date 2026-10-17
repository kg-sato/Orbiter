import * as THREE from 'three';
import {pondBed,koi,lilies} from './botanics.js';
const palettes={
 'tidal-night':{deep:'#0c1935',light:'#87b8d5',mist:'#c4d6f4',sun:'#c4bce8'},
 'lunar-mist':{deep:'#17213d',light:'#a3b6e2',mist:'#d2d7f2',sun:'#c8c7ec'},
 'opal-dawn':{deep:'#1a2946',light:'#a3ced8',mist:'#d0dff3',sun:'#d3c6e4'}
};
export function createPondWorld(renderer){
 let w=1,h=1,ping=0,time=0,pending=false,previous=null,lastDraw=-100,ready=false,frameCount=0,frameMs=0,lastQuiet=true,gusts=0,transitionDisturbances=0;
 const pointer=new THREE.Vector2(-10,-10),velocity=new THREE.Vector2(),ripples=Array.from({length:8},()=>new THREE.Vector4(-10,-10,-100,0));let rippleIndex=0;
 const simulation=new THREE.Scene(),screen=new THREE.Scene(),bedScene=new THREE.Scene(),surfaceScene=new THREE.Scene();
 surfaceScene.add(new THREE.AmbientLight('#cadcf2',1.4));const leafLight=new THREE.DirectionalLight('#d9e7ff',2);leafLight.position.set(-2,3,5);surfaceScene.add(leafLight);const botanics=lilies(surfaceScene);
 bedScene.add(new THREE.AmbientLight('#b5c9ea',1.7));const bedLight=new THREE.DirectionalLight('#cbdaf4',2);bedLight.position.set(-2,3,5);bedScene.add(bedLight);
 const ortho=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);ortho.position.z=3;
const quad=new THREE.PlaneGeometry(2,2),vertex='varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}';
const targets=[0,1].map(()=>new THREE.WebGLRenderTarget(128,128,{type:THREE.UnsignedByteType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,stencilBuffer:false}));
const field={previous:{value:null},reset:{value:1},time:{value:0},dt:{value:1/30},pointer:{value:pointer},wind:{value:velocity},impulse:{value:0}};
const fluid=new THREE.ShaderMaterial({uniforms:field,vertexShader:vertex,fragmentShader:`precision highp float;varying vec2 uv0;uniform sampler2D previous;uniform float reset,time,dt,impulse;uniform vec2 pointer,wind;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){if(reset>.5){gl_FragColor=vec4(.5,.5,.10+.05*noise(uv0*6.),1.);return;}vec4 old=texture2D(previous,uv0);vec2 v=(old.rg-.5)*.5;vec2 back=uv0-v*dt;vec4 adv=texture2D(previous,clamp(back,.004,.996));v=(adv.rg-.5)*.5;float density=adv.b;
 vec2 curl=vec2(cos(uv0.y*19.+time*.13),sin(uv0.x*17.-time*.09));v=v*exp(-dt*.8)+curl*.009*dt+vec2(0.,.006+.06*density)*dt;
 float near=exp(-dot(uv0-pointer,uv0-pointer)/.006);v+=wind*near*impulse*.035;
 // Distributed emission keeps a thin veil across the whole pond, not two clouds.
 float pools=exp(-dot(uv0-vec2(.82,.30),uv0-vec2(.82,.30))/.065)+exp(-dot(uv0-vec2(.16,.38),uv0-vec2(.16,.38))/.06);
 float source=.045+.025*noise(uv0*5.+vec2(time*.035,-time*.025))+pools*.035;
 density=density*exp(-dt*.48)+source*dt;
 // A sweep disperses local density as well as carrying it; it then replenishes.
 density*=1.-near*min(length(wind)*impulse*.065,.16);
 gl_FragColor=vec4(clamp(v,-.22,.22)*2.+.5,clamp(density,0.,.8),1.);}`});
simulation.add(new THREE.Mesh(quad,fluid));
const substrate=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
const uniforms={bed:{value:substrate.texture},mist:{value:targets[0].texture},time:{value:0},aspect:{value:1},strength:{value:.6},deep:{value:new THREE.Color()},light:{value:new THREE.Color()},fogColor:{value:new THREE.Color()},sun:{value:new THREE.Color()},ripples:{value:ripples},rects:{value:Array.from({length:5},()=>new THREE.Vector4(-10,-10,0,0))},showUI:{value:1},motion:{value:1}};
const water=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms,vertexShader:vertex,fragmentShader:`precision highp float;varying vec2 uv0;uniform sampler2D bed,mist;uniform float time,aspect,strength,showUI,motion;uniform vec3 deep,light,fogColor,sun;uniform vec4 ripples[8],rects[5];
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float quiet(vec2 p){float m=0.;for(int i=0;i<5;i++){vec4 r=rects[i];vec2 q=abs(p-r.xy)-r.zw+vec2(.018);float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.018;m=max(m,1.-smoothstep(-.025,.025,d));}return m;}
 void main(){vec2 p=uv0*vec2(aspect,1.);float t=time*.22;float nx=sin(p.x*12.+cos(p.y*9.+t)+t)*.45+cos(p.y*19.-t)*.23;float ny=cos(p.y*13.+sin(p.x*8.-t))*.45+sin(p.x*17.+t)*.23;
 vec2 normal=vec2(nx,ny)*.006;for(int i=0;i<8;i++){vec4 r=ripples[i];float age=time-r.z;float dist=length((uv0-r.xy)*vec2(aspect,1.));if(age>=0.&&age<4.){float wave=exp(-pow((dist-age*.15)/.025,2.))*exp(-age*1.3)*r.w;normal+=normalize((uv0-r.xy)+.0001)*sin(dist*140.-age*23.)*wave*.004;}}
 float reading=quiet(uv0)*showUI;normal*=1.-reading*.9;vec3 bottom=texture2D(bed,clamp(uv0+normal,.002,.998)).rgb;
 float depth=.30+.40*exp(-dot((uv0-vec2(.47,.55))*vec2(1.,1.2),(uv0-vec2(.47,.55))*vec2(1.,1.2))*4.);vec3 color=mix(bottom,deep,depth*.85);
 float c=sin((p.x+normal.x)*43.+sin(p.y*29.+t))+sin((p.y+normal.y)*38.+cos(p.x*26.-t));float caustic=pow(max(0.,1.-abs(c)*2.7),4.);color+=light*caustic*.035*(1.-reading*.95);
 float reflection=exp(-pow((uv0.x*.65+uv0.y-.98+nx*.025)*5.,2.));color=mix(color,sun,reflection*.035*(1.-reading));color+=light*max(0.,nx+ny-.5)*.035;
 vec2 flow=(texture2D(mist,uv0).rg-.5)*.5;vec2 mistUV=uv0+flow*.20+(vec2(noise(uv0*9.+time*.025),noise(uv0*9.+vec2(7.,-time*.018)))-.5)*.026;
 vec4 fog=texture2D(mist,mistUV);float smoothDensity=fog.b*.4;vec2 texel=vec2(1.5/128.);
 smoothDensity+=(texture2D(mist,mistUV+vec2(texel.x,0.)).b+texture2D(mist,mistUV-vec2(texel.x,0.)).b+texture2D(mist,mistUV+vec2(0.,texel.y)).b+texture2D(mist,mistUV-vec2(0.,texel.y)).b)*.15;
 float detail=.58+.24*noise(uv0*14.+vec2(time*.12,-time*.09)+flow*2.)+.18*noise(uv0*42.+vec2(-time*.18,time*.13)+flow*4.);float opacity=(.035+pow(smoothDensity,.78)*.30)*strength*detail*(1.-reading*.75);color=mix(color,fogColor,clamp(opacity,0.,.15));
 float vignette=smoothstep(.75,.18,length((uv0-.5)*vec2(.8,1.)));color*=.68+vignette*.32;gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
screen.add(new THREE.Mesh(quad,water));

// Original seeded substrate texture: no downloaded photography or repeated tiles.
let seed=1741;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const bedTexture=pondBed();
const floor=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshStandardMaterial({map:bedTexture,roughness:1}));floor.position.z=-.3;bedScene.add(floor);
const rockGeometry=new THREE.SphereGeometry(1,20,12),rocks=[];
for(let i=0;i<10;i++){const side=i%2?-1:1,x=side*(.87+rand()*.2),y=rand()*2-1,s=.035+rand()*.055;const rock=new THREE.Mesh(rockGeometry,new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.58+rand()*.04,.16,.16+rand()*.10),roughness:.95}));rock.userData.x=x;rock.position.set(x,y,-.1);rock.scale.set(s*(1+rand()),s,.04+rand()*.04);rock.rotation.z=rand()*6;bedScene.add(rock);rock.userData.baseScale=rock.scale.clone();rocks.push(rock);}
const fishes=Array.from({length:3},(_,i)=>{const f=koi(i);f.root.position.z=-.04;bedScene.add(f.root);return f;});

 if(renderer.getContext().getExtension('EXT_color_buffer_float'))targets.forEach(t=>{t.texture.type=THREE.HalfFloatType;t.texture.needsUpdate=true;});
 let backing=null,ctx=null,container=null,layout='',bufferW=1,bufferH=1;
 function place(host,quality){
  const tree=host?.getRootNode(),buddy=tree instanceof ShadowRoot&&tree.host?.tagName==='ORBITER-BUDDY';
  const parent=buddy?tree.querySelector('.island-water'):document.getElementById('pond-background');
  if(!parent)return {width:Math.max(1,host?.clientWidth||240),height:Math.max(1,host?.clientHeight||240)};
  if(parent!==container){container=parent;backing=parent.querySelector('canvas');if(!backing){backing=document.createElement('canvas');backing.setAttribute('aria-hidden','true');backing.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';if(buddy)parent.replaceChildren(backing);else parent.append(backing);}ctx=backing.getContext('2d',{alpha:false});lastDraw=-100;}
  const b=buddy?tree.host.getBoundingClientRect():{width:innerWidth,height:innerHeight};w=Math.max(1,b.width);h=Math.max(1,b.height);
  const factor=quality==='high'?.85:quality==='low'||quality==='balanced'?.45:.60;
  bufferW=Math.max(1,Math.round(Math.min(1100,w*factor)));bufferH=Math.max(1,Math.round(bufferW*h/w));
  const key=[w,h,bufferW,bufferH,buddy].join(':');if(key!==layout){layout=key;backing.width=bufferW;backing.height=bufferH;substrate.setSize(bufferW,bufferH);uniforms.aspect.value=w/h;floor.scale.x=w/h;ortho.left=-w/h;ortho.right=w/h;ortho.updateProjectionMatrix();rocks.forEach(r=>{r.position.x=r.userData.x*w/h;r.scale.copy(r.userData.baseScale).multiplyScalar(Math.min(1,w/h/.9));});for(const pad of botanics.pads){const d=pad.userData,s=d.size*Math.min(1,w/h/.8);pad.position.set(d.x*w/h,d.y,.10);pad.scale.set(s,s*.84,1);}botanics.flower.position.set(botanics.flower.userData.x*w/h,botanics.flower.userData.y,.14);botanics.flower.scale.setScalar(.70*Math.min(1,w/h/.8));lastDraw=-100;}
  return {width:bufferW,height:bufferH};
 }
 function advance(dt){field.previous.value=targets[ping].texture;field.time.value=time;field.dt.value=dt;field.impulse.value=pending?1:0;field.wind.value.copy(velocity);renderer.setRenderTarget(targets[1-ping]);renderer.clear();renderer.render(simulation,ortho);ping=1-ping;uniforms.mist.value=targets[ping].texture;pending=false;velocity.multiplyScalar(.70);}
 function render(host,options){
  lastQuiet=options.quiet;place(host,options.quality);if(!ctx||document.hidden)return;
  const preset=document.body.dataset.preset||'tidal-night',p=palettes[preset]||palettes['tidal-night'];
  const stamp=[layout,preset,options.strength,options.quality,options.habitat].join(':');
  if(options.quiet&&render.stamp===stamp)return;
  if(!options.quiet&&options.clock-lastDraw<1/20)return;
  const started=performance.now(),elapsed=Math.max(0,Math.min(.10,options.clock-lastDraw));lastDraw=options.clock;render.stamp=stamp;
  if(!ready){for(let i=0;i<2;i++)advance(1/30);field.reset.value=0;for(let i=0;i<40;i++){time+=1/30;advance(1/30);}ready=true;}
  if(!options.quiet){const steps=Math.max(1,Math.min(3,Math.round(elapsed*30)));for(let i=0;i<steps;i++){time+=1/30;advance(1/30);}}
  uniforms.time.value=time;uniforms.strength.value=options.strength;uniforms.deep.value.set(p.deep);uniforms.light.value.set(p.light);uniforms.fogColor.value.set(p.mist);uniforms.sun.value.set(p.sun);
  if(options.habitat)uniforms.light.value.lerp(new THREE.Color('#b5a6dd'),.12);
  const nodes=container.id==='pond-background'?[document.querySelector('.masthead'),document.querySelector('.sidebar'),document.querySelector('.hero > div:not(.orbit-art)'),document.querySelector('.focus-card'),document.querySelector('dialog[open]')]:[];
  uniforms.rects.value.forEach((r,i)=>{const b=nodes[i]?.getBoundingClientRect();if(!b||b.bottom<0||b.top>h)r.set(-10,-10,0,0);else r.set((b.left+b.width/2)/w,1-(b.top+b.height/2)/h,b.width/2/w,b.height/2/h);});
  for(let i=0;i<3;i++){const {root,tail}=fishes[i],a=time*(.07+i*.012)+i*2.2;root.scale.setScalar(.70*Math.min(1,w/h/.9));root.position.x=(i===1?-.77:.76)*w/h+Math.cos(a)*.16*w/h;root.position.y=Math.sin(a)*.67;root.rotation.z=-Math.atan2(Math.cos(a)*.67,-Math.sin(a)*.16*w/h)+Math.PI/2;tail.rotation.z=Math.sin(time*3+i)*.28;}
  renderer.setScissorTest(false);renderer.setRenderTarget(substrate);renderer.clear();renderer.render(bedScene,ortho);
  renderer.setRenderTarget(null);renderer.setViewport(0,0,bufferW,bufferH);renderer.clear();renderer.render(screen,ortho);renderer.clearDepth();const auto=renderer.autoClear;renderer.autoClear=false;renderer.render(surfaceScene,ortho);renderer.autoClear=auto;ctx.drawImage(renderer.domElement,0,0,bufferW,bufferH);renderer.clear();frameCount++;frameMs=performance.now()-started;
 }
 function interact(e){if(document.hidden||document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion:reduce)').matches||Number(document.body.dataset.motionIntensity??70)===0||document.body.dataset.effectQuality==='low')return;
  const path=e.composedPath();if(path.some(n=>n.matches?.('input,textarea,select,a,button:not(#cat):not(.orbit-art),[contenteditable=true]')))return;
  const bounds=container?.getBoundingClientRect();if(!bounds)return;const px=(e.clientX-bounds.left)/bounds.width,py=1-(e.clientY-bounds.top)/bounds.height,now=performance.now();if(previous&&e.type==='pointermove'){const dt=Math.max(.016,(now-previous.t)/1000);velocity.set(THREE.MathUtils.clamp((px-previous.x)/dt,-2,2),THREE.MathUtils.clamp((py-previous.y)/dt,-2,2));pending=true;gusts++;}pointer.set(px,py);if(e.type==='pointerdown'||previous&&now-previous.ripple>130&&velocity.length()>.18){ripples[rippleIndex++%8].set(px,py,time,e.type==='pointerdown'?.8:.3);previous={x:px,y:py,t:now,ripple:now};}else previous={x:px,y:py,t:now,ripple:previous?.ripple||now};}
 document.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')interact(e);},{passive:true});document.addEventListener('pointerdown',interact,{passive:true});window.addEventListener('blur',()=>{previous=null;pending=false;velocity.set(0,0);});document.addEventListener('visibilitychange',()=>{previous=null;pending=false;lastDraw=-100;});
 // Deliberate UI transitions may disturb exposed water even when their origin is a control.
 window.addEventListener('orbiter-pond-disturb',event=>{
  if(lastQuiet||document.hidden||document.body.classList.contains('calm')||document.body.classList.contains('quiet')||document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion:reduce)').matches||Number(document.body.dataset.motionIntensity??70)===0||document.body.dataset.effectQuality==='low')return;
  const b=container?.getBoundingClientRect(),d=event.detail;if(!b?.width||!b?.height||!Number.isFinite(d?.x)||!Number.isFinite(d?.y))return;
  const px=THREE.MathUtils.clamp((d.x-b.left)/b.width,0,1),py=THREE.MathUtils.clamp(1-(d.y-b.top)/b.height,0,1),strength=THREE.MathUtils.clamp(Number(d.strength)||0,0,1);
  pointer.set(px,py);velocity.set(.18*strength,.8*strength);pending=true;ripples[rippleIndex++%8].set(px,py,time,strength);transitionDisturbances++;
 });
 return {place,render,reset(){ready=false;field.reset.value=1;lastDraw=-100;render.stamp='';},stats:()=>({frames:frameCount,frameMs,resolution:[bufferW,bufferH],mistMoving:!document.hidden&&!lastQuiet,mistTime:time,gusts,transitionDisturbances,simulation:128})};
}
