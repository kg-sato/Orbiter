const {load,nodePaths}=require('./node_dependencies.cjs'),esbuild=load('esbuild');
esbuild.buildSync({entryPoints:['src/mascot/cat.js'],bundle:true,format:'iife',minify:true,legalComments:'eof',outfile:'build/orbiter-cat.js',target:'es2022',loader:{'.glb':'dataurl'},nodePaths});
