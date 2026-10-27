/* Verify a locally staged Windows package. Reads only public signing data;
   never installs, launches Orbiter, publishes or reads the private key. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process'),zlib=require('zlib');
const config=JSON.parse(fs.readFileSync('desktop/src-tauri/tauri.conf.json'));
const base=path.resolve('build/release'),name=`Orbiter_${config.version}_x64-setup.exe`,data=fs.readFileSync(path.join(base,name));
const publicText=Buffer.from(config.plugins.updater.pubkey,'base64').toString().trim().split(/\r?\n/),pub=Buffer.from(publicText.at(-1),'base64');
const original=JSON.parse(cp.execFileSync('git',['show','HEAD:desktop/src-tauri/tauri.conf.json'],{encoding:'utf8'}));
assert.equal(config.plugins.updater.pubkey,original.plugins.updater.pubkey);assert.equal(config.identifier,'com.kgsato.orbit');
const rawSignature=fs.readFileSync(path.join(base,name+'.sig'),'utf8').trim();
const lines=(rawSignature.startsWith('untrusted comment:')?rawSignature:Buffer.from(rawSignature,'base64').toString()).trim().split(/\r?\n/);
const sig=Buffer.from(lines[1],'base64'),comment=lines[2].replace(/^trusted comment: /,''),global=Buffer.from(lines[3],'base64');
assert.equal(pub.length,42);assert.equal(sig.length,74);assert(pub.subarray(2,10).equals(sig.subarray(2,10)));
const key=crypto.createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),pub.subarray(10)]),format:'der',type:'spki'});
assert(['Ed','ED'].includes(sig.subarray(0,2).toString()),'supported signature algorithm');
const signature=sig.subarray(10),prehash=sig.subarray(0,2).toString()==='ED';
const verify=bytes=>crypto.verify(null,prehash?crypto.createHash('blake2b512').update(bytes).digest():bytes,key,signature);
assert(verify(data),'updater signature');assert(crypto.verify(null,Buffer.concat([signature,Buffer.from(comment)]),key,global),'trusted comment');
const tampered=Buffer.from(data);tampered[tampered.length-1]^=1;assert(!verify(tampered),'tamper rejection');
const manifest=JSON.parse(fs.readFileSync(path.join(base,'latest.json')));assert.equal(manifest.version,config.version);assert.equal(manifest.platforms['windows-x86_64'].signature,rawSignature);
for(const line of fs.readFileSync(path.join(base,'SHA256SUMS.txt'),'utf8').trim().split('\n')){const [hash,file]=line.trim().split(/\s+/);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex'),hash);}
assert(data.equals(fs.readFileSync(path.join(base,'Orbiter Setup.exe'))));
assert(data.equals(fs.readFileSync(path.join('build/desktop-target-040/release/bundle/nsis',name))),'staged installer matches the build output');
for(const name of ['native-shell.js','buddy.css','native-adapter.js','updater.js'])assert(fs.readFileSync('desktop/ui/'+name).equals(fs.readFileSync('build/native/'+name)));
assert(fs.readFileSync('web/rewards.css').equals(fs.readFileSync('build/native/web/rewards.css')));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const binary=fs.readFileSync('build/desktop-target-040/release/orbit-companion.exe');
const compressed=files('build/desktop-target-040/release/build').filter(p=>p.includes('orbit-companion-')&&p.includes(path.sep+'out'+path.sep));
const assets={};for(const target of ['native-shell.js','buddy.css','web/rewards.css']){const expected=fs.readFileSync('build/native/'+target);let found=false;for(const file of compressed){const bytes=fs.readFileSync(file);let expanded;try{expanded=zlib.brotliDecompressSync(bytes);}catch{continue;}if(expanded.equals(expected)&&binary.includes(bytes)){found=true;break;}}assets[target]=found;assert(found,'embedded final asset: '+target);}
// Tauri serializes HTML markup. Inline scripts/styles must remain byte exact.
const html=fs.readFileSync('build/native/Application.html','utf8');
const blocks=s=>[...s.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>m[2]);
let htmlFound=false;for(const file of compressed.filter(f=>f.endsWith('.html'))){const bytes=fs.readFileSync(file);if(!binary.includes(bytes))continue;const decoded=zlib.brotliDecompressSync(bytes).toString();assert.deepEqual(blocks(decoded),blocks(html));assert(binary.includes(bytes));htmlFound=true;}assert(htmlFound);assets.htmlInlineBlocks=true;
const psQuote=value=>"'"+value.replaceAll("'","''")+"'";
// Windows PowerShell must discover its own modules when called from pwsh 7.
// An inherited pwsh module path can select an incompatible Security module.
const psEnvironment={...process.env};delete psEnvironment.PSModulePath;
const versionInfo=JSON.parse(cp.execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
  `$ErrorActionPreference='Stop'; $binary=Get-Item -LiteralPath ${psQuote(path.resolve('build/desktop-target-040/release/orbit-companion.exe'))}; $installer=Get-Item -LiteralPath ${psQuote(path.join(base,name))}; $signature=Get-AuthenticodeSignature -LiteralPath $installer.FullName; [pscustomobject]@{binaryProductVersion=$binary.VersionInfo.ProductVersion; binaryFileVersion=$binary.VersionInfo.FileVersion; installerFileVersion=$installer.VersionInfo.FileVersion; authenticode=$signature.Status.ToString()} | ConvertTo-Json -Compress`
],{encoding:'utf8',env:psEnvironment}));
assert.equal(versionInfo.binaryProductVersion,config.version,'actual binary product version');
assert.equal(versionInfo.installerFileVersion.split('.').slice(0,3).join('.'),config.version,'actual installer file version');
const report={version:config.version,identifier:config.identifier,installer:name,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex'),signatureVerified:true,trustedCommentVerified:true,tamperRejected:true,originalPublicKeyPreserved:true,checksumsVerified:true,embeddedAssets:assets,...versionInfo,published:false,installed:false};
fs.writeFileSync(path.join(base,`verification-${config.version}.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
