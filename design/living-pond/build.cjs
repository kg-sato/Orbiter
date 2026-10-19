const esbuild=require('esbuild');
require('fs').copyFileSync('web/lake-transitions.css','design/living-pond/transitions.css');
esbuild.build({entryPoints:['design/living-pond/entry.js'],bundle:true,outfile:'design/living-pond/bundle.js',format:'iife',loader:{'.glb':'dataurl'}}).catch(error=>{console.error(error);process.exitCode=1;});
