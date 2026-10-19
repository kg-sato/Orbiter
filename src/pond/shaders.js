// Original review shaders. Same renderer, same 128-square advected field.
export const MIST_FRAGMENT=`precision highp float;
varying vec2 uv0;uniform sampler2D previous;uniform float reset,time,dt,impulse;uniform vec2 pointer,wind;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
void main(){
 if(reset>.5){gl_FragColor=vec4(.5,.5,.12+.03*noise(uv0*5.),1.);return;}
 vec4 old=texture2D(previous,uv0);vec2 v=(old.rg-.5)*.5;
 vec4 adv=texture2D(previous,clamp(uv0-v*dt,.004,.996));v=(adv.rg-.5)*.5;
 // Coherent slow currents carry density; local velocity changes only nearby cells.
 vec2 curl=vec2(cos(uv0.y*9.+time*.16+sin(uv0.x*6.)),sin(uv0.x*8.-time*.12));
 v=v*exp(-dt*.65)+curl*.014*dt+vec2(.004,.010)*dt;
 vec2 d=uv0-pointer;float near=exp(-dot(d,d)/.012);
 v+=wind*near*impulse*.075;
 float emission=.035+.022*noise(uv0*3.+vec2(time*.018,-time*.025));
 float shore=exp(-pow((uv0.y-.25)/.23,2.));
 float density=adv.b*exp(-dt*.38)+(emission+shore*.024)*dt;
 density*=1.-near*min(length(wind)*impulse*.18,.30);
 gl_FragColor=vec4(clamp(v,-.22,.22)*2.+.5,clamp(density,0.,.65),1.);
}`;

export const POND_FRAGMENT=`precision highp float;
varying vec2 uv0;uniform sampler2D bed,mist;uniform float time,aspect,strength,habitatKind;
uniform vec3 deep,light,fogColor,sun;uniform vec4 ripples[8];
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=noise(p)*a;p=mat2(.8,-.6,.6,.8)*p*2.03+7.3;a*=.5;}return n;}
void main(){
 vec2 p=uv0*vec2(aspect,1.);float t=time*.12;
 vec2 warp=vec2(fbm(p*3.+vec2(t,-t*.6)),fbm(p*3.+vec2(7.,t*.8)))-.5;
 vec2 normal=vec2(sin(p.x*8.+warp.y*3.+t),cos(p.y*9.+warp.x*3.-t))*.003;
 for(int i=0;i<8;i++){vec4 r=ripples[i];float age=time-r.z;vec2 d=(uv0-r.xy)*vec2(aspect,1.);float dist=length(d);if(age>=0.&&age<4.){float wave=exp(-pow((dist-age*.15)/.026,2.))*exp(-age*1.3)*r.w;normal+=normalize(d+.0001)*sin(dist*110.-age*20.)*wave*.004;}}
 vec3 bottom=texture2D(bed,clamp(uv0+normal,.002,.998)).rgb;
 // An asymmetrical moonlit opening and a continuous basin, independent of UI bounds.
 float basin=exp(-dot((uv0-vec2(.46,.46))*vec2(1.,1.3),(uv0-vec2(.46,.46))*vec2(1.,1.3))*3.);
 vec3 color=mix(bottom,deep,.32+basin*.40);
 vec2 opening=(uv0-vec2(.77,.77))*vec2(aspect*.65,1.);
 float moon=exp(-dot(opening,opening)*8.);
 color+=light*moon*.10;
 // Larger, smoother caustic cells fade with depth instead of regular thin scribbles.
 vec2 q=p*9.+warp*2.;float cell=sin(q.x+sin(q.y*.8+t))+cos(q.y+cos(q.x*.75-t));
 float caustic=pow(max(0.,1.-abs(cell)*2.3),3.);
 color+=light*caustic*(.038+.028*(1.-basin));
 float lane=exp(-pow((uv0.x-.74+sin(uv0.y*5.+t)*.04)/.12,2.));
 color=mix(color,sun,lane*(.018+.026*moon));
 // Habitat effects stay on the exposed right-hand shore, away from the main copy.
 vec2 local=(uv0-vec2(.77,.42))*vec2(aspect,1.);float falloff=exp(-dot(local,local)*5.);
 if(habitatKind>.5&&habitatKind<1.5)color+=vec3(.10,.25,.28)*caustic*.15*falloff;
 if(habitatKind>1.5&&habitatKind<2.5){float facet=pow(max(0.,sin(p.x*7.+p.y*4.+t)),14.);vec3 prism=.5+.5*cos(vec3(0.,2.1,4.2)+p.y*7.);color+=prism*facet*.10*falloff;}
 if(habitatKind>2.5&&habitatKind<3.5){float angle=atan(local.y,local.x),orbit=.24+.07*cos(angle*2.);float stream=exp(-pow((length(local)-orbit)/.016,2.));color+=vec3(.15,.40,.45)*stream*(.4+.3*sin(angle*3.-time*.5))*.35*falloff;}
 if(habitatKind>3.5){float bloom=pow(max(0.,sin(local.x*18.+sin(local.y*12.))),9.);color+=vec3(.18,.24,.26)*bloom*.12*falloff;}
 // Two visual scales from one advected field: a veil and fine curling density.
 vec4 field=texture2D(mist,uv0);vec2 velocity=(field.rg-.5)*.5;
 vec2 fogUV=clamp(uv0+velocity*.28+warp*.018,.003,.997);
 float density=texture2D(mist,fogUV).b;
 float veil=fbm(p*3.+vec2(time*.018,-time*.024)+velocity*2.);
 float curl=fbm(p*14.+vec2(-time*.05,time*.035)+velocity*5.);
 float fog=(.010+density*(.45*veil+.30*curl))*strength;
 color=mix(color,fogColor,clamp(fog,0.,.11));
 // Sparse glints and directional opal edges, not a uniform star wallpaper.
 vec2 grid=p*15.,id=floor(grid),f=fract(grid)-.5;float eligible=step(.985,hash(id));
 float mote=exp(-dot(f,f)*700.)*eligible*(.4+.4*sin(time*.6+hash(id)*6.));
 float edges=smoothstep(.002,.005,abs(normal.x+normal.y))*moon;
 color+=light*mote*.16*strength;
 color+=mix(light,sun,.4)*edges*.025;
 float vignette=smoothstep(.8,.10,length((uv0-.5)*vec2(.7,1.)));
 color*=.88+vignette*.12;gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
