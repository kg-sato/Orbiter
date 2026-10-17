/* Build ONLY the isolated study. Production sources are read, never rewritten. */
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
function replaceOnce(source, from, to) {
  if (!source.includes(from)) throw new Error('Preview adapter no longer matches production: ' + from.slice(0, 80));
  return source.replace(from, to);
}
esbuild.build({
  absWorkingDir: root, entryPoints: ['design/living-pond/entry.js'], bundle: true,
  outfile: 'design/living-pond/bundle.js', format: 'iife', loader: {'.glb':'dataurl'},
  plugins: [{name:'isolated-collectible-adapter', setup(build) {
    build.onLoad({filter:/[\\/]src[\\/]mascot[\\/]cat\.js$/}, ({path: filename}) => {
      let source=fs.readFileSync(filename,'utf8');
      source="import {habitatStudy,accessoryStudy} from '../../design/living-pond/models.js';\nimport {styleScarf} from '../../design/living-pond/appearances.js';\nimport {studyTrail} from '../../design/living-pond/trails.js';\n"+source;
      source=replaceOnce(source,"import {fallbackPortrait} from './fallback.js';", "import {studyFallback as fallbackPortrait} from '../../design/living-pond/fallback.js';");
      source=replaceOnce(source,'let pondWorld=null,portraitMode=false;', 'let pondWorld=null,portraitMode=false,reviewRequestedCode=0;');
      source=replaceOnce(source,'export function mount(host,code=mainCode,options={}){', 'export function mount(host,code=mainCode,options={}){\n reviewRequestedCode=code;');
      source=replaceOnce(source,'if(assetStatus().error||!init()){host.dataset.catFallback', "if(assetStatus().loaded){host.querySelectorAll('[data-study-loading]').forEach(n=>n.remove());delete host.dataset.catFallback;}\n if(!assetStatus().loaded||assetStatus().error||!init()){host.dataset.catFallback");
      source=replaceOnce(source,'const img=new Image();img.src=fallbackPortrait(code,growth(growthMs).stage,equipment);', "const img=new Image();img.dataset.studyLoading='true';img.src=fallbackPortrait(code,growth(growthMs).stage,equipment);");
      source=replaceOnce(source,'mount(target,cat?.code??mainCode,', 'mount(target,reviewRequestedCode,');
      source=replaceOnce(source,"if(equipment.halo?.match(/^halo-\\d/))", "if(!window.OrbiterStudyOriginal && ['halo-thin','halo-07','halo-10','halo-12'].includes(equipment.halo))accessoryStudy(root,head,bow,equipment.halo);\n else if(equipment.halo?.match(/^halo-\\d/))");
      source=replaceOnce(source,'if(equipment.habitat)addHabitat(habitat,Number(equipment.habitat.slice(-2)),gold);',"if(equipment.habitat){if(!window.OrbiterStudyOriginal && ['habitat-01','habitat-07','habitat-11','habitat-12'].includes(equipment.habitat))habitatStudy(habitat,equipment.habitat);else addHabitat(habitat,Number(equipment.habitat.slice(-2)),gold);}");
      source=replaceOnce(source,'cat.particles.rotation.y=quiet?',"cat.root.traverse(o=>o.userData.studyTick?.({time:phase,motion:quiet?0:1,x,y,focus,paused,pet,celebrating}));\n cat.particles.rotation.y=quiet?");
      source=replaceOnce(source,'const particles=equipment.trail?trail(equipment.trail):', 'styleScarf(scarf,equipment.appearance);\n const particles=equipment.trail?(window.OrbiterStudyOriginal?trail(equipment.trail):studyTrail(equipment.trail)):');
      source=replaceOnce(source,"for(let i=0;i<(equipment.trail==='trail-comet'?5:3);i++)ball(particles,", "for(let i=0;i<(equipment.trail&&!window.OrbiterStudyOriginal?0:(equipment.trail==='trail-comet'?5:3));i++)ball(particles,");
      source=replaceOnce(source,'if(equipment.appearance){const n=', "if(equipment.appearance&&(window.OrbiterStudyOriginal||!['mint','look-11','indigo'].includes(equipment.appearance))){const n=");
      source=replaceOnce(source,'cat.root.rotation.y=quiet?0:x*.075;', 'cat.root.rotation.y=(Number(window.OrbiterStudyYaw)||0)+(quiet?0:x*.075);');
      source=replaceOnce(source,'if(cat?.equipmentKey!==key)', 'if(cat?.equipmentKey!==key+String(window.OrbiterStudyOriginal))');
      source=replaceOnce(source,'cat.equipmentKey=key;', 'cat.equipmentKey=key+String(window.OrbiterStudyOriginal);');
      source=replaceOnce(source,'if(o.isSkinnedMesh)skeletons.add(o.skeleton);', 'if(o.isInstancedMesh)o.dispose();if(o.isSkinnedMesh)skeletons.add(o.skeleton);');
      source=replaceOnce(source,"o.geometry!==sphere&&!o.userData.orbiterAsset", "o.geometry!==sphere&&(!o.userData.orbiterAsset||o.userData.studyGeometry)");
      source=replaceOnce(source,'renderCalls:renderer?.info.render.calls||0,', "renderCalls:renderer?.info.render.calls||0,study:cat?.root.children.flatMap(o=>o.userData.studyBudget?[o.userData.studyBudget]:o.children.filter(c=>c.userData.studyBudget).map(c=>c.userData.studyBudget))||[],");
      return {contents:source,loader:'js',resolveDir:path.dirname(filename)};
    });
    build.onLoad({filter:/[\\/]src[\\/]pond[\\/]botanics\.js$/},({path:filename})=>{
      let source=fs.readFileSync(filename,'utf8');
      source=replaceOnce(source,"map:koiSkin(index),roughness:.38,metalness:.03", "map:koiSkin(index),color:'#9daec1',roughness:.65,metalness:.03");
      source=replaceOnce(source,'opacity:.66,roughness:.65', 'opacity:.38,roughness:.75');
      source=replaceOnce(source,'const pads=[];', `material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\\nfloat wetRim=smoothstep(.43,.50,length(vMapUv-.5));float dew=exp(-dot(vMapUv-vec2(.32,.60),vMapUv-vec2(.32,.60))*1600.);diffuseColor.rgb+=vec3(.22,.40,.48)*wetRim*.18+vec3(.6,.8,.9)*dew*.14;');};
 const pads=[];`);
      return {contents:source,loader:'js',resolveDir:path.dirname(filename)};
    });
    build.onLoad({filter:/[\\/]src[\\/]mascot[\\/]avatar\.js$/},({path:filename})=>{
      let source=fs.readFileSync(filename,'utf8');
      source="import {styleAvatar} from '../../design/living-pond/appearances.js';\n"+source;
      source=replaceOnce(source,"import modelUrl from './assets/kitten.glb';", "import modelUrl from '../../design/living-pond/avatar/kitten.glb';");
      source=replaceOnce(source,"MODEL_VERSION='orbiter-kitten-2'", "MODEL_VERSION='orbiter-kitten-pond-review-3'");
      source=replaceOnce(source,'// Facial identity is painted', 'styleAvatar(model,window.OrbiterStudyAppearance);\n // Facial identity is painted');
      return {contents:source,loader:'js',resolveDir:path.dirname(filename)};
    });
    build.onLoad({filter:/[\\/]src[\\/]pond[\\/]world\.js$/}, ({path:filename}) => {
      let source=fs.readFileSync(filename,'utf8');
      source="import {POND_FRAGMENT,MIST_FRAGMENT} from '../../design/living-pond/pond-shaders.js';\n"+source;
      source=replaceOnce(source,'showUI:{value:1},motion:{value:1}', 'showUI:{value:1},habitatKind:{value:0},motion:{value:1}');
      source=replaceOnce(source,"if(options.habitat)uniforms.light.value.lerp(new THREE.Color('#b5a6dd'),.12);", "uniforms.habitatKind.value=window.OrbiterStudyOriginal?0:({'habitat-01':1,'habitat-07':2,'habitat-12':3,'habitat-11':4}[options.habitat]||0);");
      const fluidStart=source.indexOf('const fluid=new THREE.ShaderMaterial('),fluidEnd=source.indexOf('simulation.add(new THREE.Mesh(quad,fluid));');
      if(fluidStart<0||fluidEnd<0)throw new Error('Missing pond simulation boundary');
      source=source.slice(0,fluidStart)+'const fluid=new THREE.ShaderMaterial({uniforms:field,vertexShader:vertex,fragmentShader:MIST_FRAGMENT});\n'+source.slice(fluidEnd);
      const waterStart=source.indexOf('const water=new THREE.ShaderMaterial('),waterEnd=source.indexOf('screen.add(new THREE.Mesh(quad,water));');
      if(waterStart<0||waterEnd<0)throw new Error('Missing pond presentation boundary');
      source=source.slice(0,waterStart)+'const water=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms,vertexShader:vertex,fragmentShader:POND_FRAGMENT});\n'+source.slice(waterEnd);
      source=replaceOnce(source,'uniforms.time.value=time;', "leafLight.position.x=-2+(pointer.x<0?0:THREE.MathUtils.clamp(pointer.x-.5,-.5,.5))*.3;\n uniforms.time.value=time;");
      return {contents:source,loader:'js',resolveDir:path.dirname(filename)};
    });
  }}]
}).catch(error=>{console.error(error);process.exitCode=1;});
