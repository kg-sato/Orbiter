const esbuild=require('esbuild');
esbuild.buildSync({entryPoints:['src/sync/browser.js'],bundle:true,format:'iife',minify:true,legalComments:'eof',outfile:'web/cloud-sync.js',target:'es2022'});
