const {load,nodePaths}=require('./node_dependencies.cjs'),esbuild=load('esbuild');
const fs=require('fs');
const result=esbuild.buildSync({entryPoints:['src/sync/browser.js'],bundle:true,format:'iife',minify:true,legalComments:'eof',outfile:'web/cloud-sync.js',target:'es2022',write:false,nodePaths});
// Avoid rewriting identical assets held open by Windows scanners or preview tools.
for(const file of result.outputFiles){const data=Buffer.from(file.contents);if(!fs.existsSync(file.path)||!fs.readFileSync(file.path).equals(data))fs.writeFileSync(file.path,data);}
