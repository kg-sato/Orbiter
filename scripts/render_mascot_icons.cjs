const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
(async () => {
 const root=path.resolve(__dirname,'..');
 const edge=path.join(process.env['ProgramFiles(x86)'],'Microsoft','Edge','Application','msedge.exe');
 const browser=await chromium.launch({executablePath:edge,headless:true});
 try {
  const page=await browser.newPage({deviceScaleFactor:1});
  const svg=fs.readFileSync(path.join(root,'web/icons/eclipse.svg'),'utf8');
  for(const size of [180,192,512,1024]) {
   await page.setViewportSize({width:size,height:size});
   await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:#192338;display:grid;place-items:center}svg{width:94%;height:94%}.cat-content-eyes,.cat-pat-spark{opacity:0}</style>${svg}`);
   const target=size===1024?'Scheduler/Assets.xcassets/AppIcon.appiconset/AppIcon.png':`web/icons/orbit-${size}.png`;
   await page.screenshot({path:path.join(root,target)});
   process.stdout.write(`Rendered ${target}\n`);
  }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
