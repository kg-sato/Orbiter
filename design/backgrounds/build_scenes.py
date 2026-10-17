"""Original vector observatory environments. No downloaded art or runtime filters."""
from pathlib import Path
import random

root=Path(__file__).resolve().parents[2]
rng=random.Random(7341)
stars=''.join(f'<circle cx="{rng.randrange(20,1580)}" cy="{rng.randrange(15,985)}" r="{rng.choice([.55,.7,.9,1.2,1.6])}" opacity="{rng.uniform(.18,.72):.2f}"/>' for _ in range(155))
svg='''<svg id="liquid-landscape" class="celestial-landscape" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
<defs>
 <radialGradient id="cosmic-teal"><stop stop-color="#70b7b5" stop-opacity=".62"/><stop offset=".42" stop-color="#3e7c92" stop-opacity=".25"/><stop offset="1" stop-color="#112033" stop-opacity="0"/></radialGradient>
 <radialGradient id="cosmic-violet"><stop stop-color="#a28acb" stop-opacity=".56"/><stop offset=".42" stop-color="#695b9b" stop-opacity=".26"/><stop offset="1" stop-color="#10192b" stop-opacity="0"/></radialGradient>
 <radialGradient id="cosmic-rose"><stop stop-color="#e6ac9d" stop-opacity=".6"/><stop offset=".48" stop-color="#b779a0" stop-opacity=".19"/><stop offset="1" stop-color="#182235" stop-opacity="0"/></radialGradient>
 <radialGradient id="cosmic-silver"><stop stop-color="#c9d9e8" stop-opacity=".5"/><stop offset=".5" stop-color="#8da1c5" stop-opacity=".13"/><stop offset="1" stop-color="#161d32" stop-opacity="0"/></radialGradient>
 <radialGradient id="tidal-planet" cx=".28" cy=".23" r=".78"><stop stop-color="#d0e1dc"/><stop offset=".16" stop-color="#87b6b8"/><stop offset=".47" stop-color="#416b83"/><stop offset=".78" stop-color="#1a2947"/><stop offset="1" stop-color="#0a1428"/></radialGradient>
 <radialGradient id="lunar-planet" cx=".25" cy=".19" r=".82"><stop stop-color="#f2eadf"/><stop offset=".24" stop-color="#bcc7db"/><stop offset=".58" stop-color="#7184a5"/><stop offset=".86" stop-color="#354360"/><stop offset="1" stop-color="#18233b"/></radialGradient>
 <radialGradient id="opal-planet" cx=".28" cy=".22" r=".8"><stop stop-color="#fff0d8"/><stop offset=".23" stop-color="#e5b8ae"/><stop offset=".56" stop-color="#af809c"/><stop offset=".83" stop-color="#5f547b"/><stop offset="1" stop-color="#242944"/></radialGradient>
 <linearGradient id="tidal-ring"><stop stop-color="#9db2c3" stop-opacity="0"/><stop offset=".27" stop-color="#b2ccdb" stop-opacity=".35"/><stop offset=".52" stop-color="#e1e4df" stop-opacity=".72"/><stop offset=".76" stop-color="#8f83b9" stop-opacity=".38"/><stop offset="1" stop-color="#c6accb" stop-opacity="0"/></linearGradient>
 <linearGradient id="cosmic-vein" x1="0" y1="0" x2="1" y2="1"><stop class="scene-accent-stop" stop-color="#b4e6d5" stop-opacity="0"/><stop offset=".5" class="scene-lilac-stop" stop-color="#c9b6e3" stop-opacity=".23"/><stop offset="1" stop-color="#d0c7e9" stop-opacity="0"/></linearGradient>
 <linearGradient id="lunar-fog" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#bdcddd" stop-opacity="0"/><stop offset=".55" stop-color="#9baccb" stop-opacity=".16"/><stop offset="1" stop-color="#778ba8" stop-opacity="0"/></linearGradient>
 <linearGradient id="opal-floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d6a49b" stop-opacity="0"/><stop offset=".48" stop-color="#a97997" stop-opacity=".22"/><stop offset="1" stop-color="#344257" stop-opacity=".1"/></linearGradient>
 <radialGradient id="cosmic-vignette"><stop offset=".35" stop-color="#050b18" stop-opacity="0"/><stop offset="1" stop-color="#050b18" stop-opacity=".64"/></radialGradient>
 <clipPath id="lunar-disc"><circle cx="1330" cy="225" r="255"/></clipPath>
</defs>
<rect class="celestial-sky" width="1600" height="1000" fill="#0c1728"/>
<g class="cosmic-preset cosmic-tidal" data-world="tidal-night">
 <g class="cosmic-atmosphere">
  <ellipse cx="1280" cy="120" rx="760" ry="560" fill="url(#cosmic-teal)"/>
  <ellipse cx="530" cy="660" rx="740" ry="520" fill="url(#cosmic-violet)" transform="rotate(-24 530 660)"/>
  <ellipse cx="180" cy="1000" rx="640" ry="290" fill="url(#cosmic-teal)"/>
  <path d="M-180 1020C180 720 190 400 640 440S1100 290 1570-130" stroke="url(#cosmic-vein)" stroke-width="140" opacity=".22"/>
  <path d="M-180 1020C180 720 190 400 640 440S1100 290 1570-130" stroke="url(#cosmic-vein)" stroke-width="40" opacity=".3"/>
 </g>
 <g class="cosmic-primary" transform="rotate(-26 1305 220)">
  <ellipse cx="1305" cy="220" rx="375" ry="104" stroke="url(#tidal-ring)" stroke-width="30" opacity=".28"/>
  <circle cx="1305" cy="220" r="208" fill="url(#tidal-planet)"/>
  <path d="M1119 131Q1270 175 1489 150M1100 228Q1320 265 1500 222M1140 329Q1320 350 1465 307" stroke="#b8d1d4" stroke-opacity=".065" stroke-width="18"/>
  <path d="M930 220A375 104 0 0 0 1680 220" stroke="url(#tidal-ring)" stroke-width="20"/>
  <path d="M930 220A375 104 0 0 0 1680 220" stroke="#cee3e2" stroke-opacity=".25" stroke-width="1.2"/>
 </g>
 <circle cx="274" cy="784" r="46" fill="url(#lunar-planet)" opacity=".32"/>
 <ellipse cx="274" cy="848" rx="100" ry="11" fill="url(#cosmic-violet)"/>
</g>
<g class="cosmic-preset cosmic-lunar" data-world="lunar-mist">
 <g class="cosmic-atmosphere">
  <ellipse cx="1270" cy="230" rx="710" ry="570" fill="url(#cosmic-silver)"/>
  <ellipse cx="260" cy="580" rx="700" ry="580" fill="url(#cosmic-violet)" opacity=".65"/>
  <ellipse cx="1010" cy="970" rx="1000" ry="340" fill="url(#cosmic-silver)"/>
 </g>
 <g class="cosmic-primary">
  <circle cx="1330" cy="225" r="255" fill="url(#lunar-planet)"/>
  <g clip-path="url(#lunar-disc)" fill="none" stroke="#526587" opacity=".12">
   <ellipse cx="1210" cy="190" rx="43" ry="54" stroke-width="11"/><ellipse cx="1318" cy="90" rx="30" ry="29" stroke-width="7"/>
   <ellipse cx="1445" cy="251" rx="55" ry="68" stroke-width="13"/><ellipse cx="1300" cy="354" rx="30" ry="23" stroke-width="8"/>
  </g>
  <circle cx="1330" cy="225" r="256" stroke="#dbe4ed" stroke-opacity=".11"/>
 </g>
 <path d="M-200 840Q280 530 770 760T1830 630L1830 1040H-200Z" fill="url(#lunar-fog)"/>
 <path d="M-100 980Q640 740 1150 850T1780 780L1780 1170H-100Z" fill="url(#lunar-fog)" opacity=".6"/>
 <circle cx="312" cy="170" r="23" fill="url(#lunar-planet)" opacity=".42"/>
</g>
<g class="cosmic-preset cosmic-opal" data-world="opal-dawn">
 <g class="cosmic-atmosphere">
  <ellipse cx="1400" cy="140" rx="850" ry="640" fill="url(#cosmic-rose)"/>
  <ellipse cx="910" cy="200" rx="560" ry="530" fill="url(#cosmic-silver)" opacity=".6"/>
  <ellipse cx="120" cy="850" rx="720" ry="410" fill="url(#cosmic-violet)"/>
 </g>
 <g class="cosmic-primary">
  <circle cx="1360" cy="195" r="224" fill="url(#opal-planet)"/>
  <circle cx="1360" cy="195" r="225" stroke="#f2dacb" stroke-opacity=".14"/>
 </g>
 <path d="M-120 890Q330 700 780 825Q1110 690 1740 810L1740 1120H-120Z" fill="url(#opal-floor)"/>
 <ellipse cx="1380" cy="830" rx="250" ry="38" fill="#161d34" opacity=".2"/>
 <ellipse cx="1380" cy="790" rx="126" ry="55" fill="url(#opal-planet)" opacity=".5" transform="rotate(-12 1380 790)"/>
 <circle cx="308" cy="780" r="55" fill="url(#opal-planet)" opacity=".4"/>
 <circle cx="940" cy="104" r="22" fill="url(#lunar-planet)" opacity=".65"/>
</g>
<g class="cosmic-starfield" fill="#e7e7ef">STARS</g>
<g class="cosmic-constellations" fill="none" stroke="#b8d5d9" stroke-opacity=".16" stroke-width=".7"><path d="M1170 660L1250 605L1344 645L1422 570M128 310L220 260L276 341"/><path d="M1500 128h10m-5-5v10M1000 720h8m-4-4v8" stroke-opacity=".5"/></g>
<rect width="1600" height="1000" fill="url(#cosmic-vignette)"/>
</svg>'''.replace('STARS',stars)
# Broad translucent folds replace literal planets. Fine contour lines describe
# the same fabric, keeping the composition original and inexpensive to render.
import re
defs='''<linearGradient id="ethereal-fold" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#d0fff0" stop-opacity="0"/><stop offset=".32" stop-color="#8bd9d4" stop-opacity=".05"/><stop offset=".58" stop-color="#c9b6ef" stop-opacity=".26"/><stop offset=".63" stop-color="#e9fff8" stop-opacity=".55"/><stop offset=".68" stop-color="#8ccbcf" stop-opacity=".08"/><stop offset="1" stop-color="#9889d4" stop-opacity="0"/></linearGradient><linearGradient id="ethereal-edge"><stop stop-color="#c7f9e8" stop-opacity="0"/><stop offset=".55" stop-color="#deccff" stop-opacity=".48"/><stop offset="1" stop-color="#b3e5e7" stop-opacity="0"/></linearGradient>'''
svg=svg.replace('</defs>',defs+'</defs>')
worlds=[('tidal','tidal-night','#73c6c4','#9380ca',0),('lunar','lunar-mist','#bec9ed','#8e9cbf',-22),('opal','opal-dawn','#efbbac','#bc9dd7',18)]
for short,name,a,b,angle in worlds:
    contours=''.join(f'<path d="M-240 {920+i*5}C240 {880+i*4} 170 {220+i*3} 740 {330+i*4}S1260 {660+i*3} 1820 {-240+i*5}" stroke="url(#ethereal-edge)" stroke-width=".65" opacity="{.16+(.22 if i%7==0 else 0)}"/>' for i in range(31))
    group=f'''<g class="cosmic-preset cosmic-{short}" data-world="{name}"><g class="cosmic-atmosphere"><ellipse cx="1230" cy="210" rx="820" ry="570" fill="url(#cosmic-{'rose' if short=='opal' else 'silver' if short=='lunar' else 'teal'})"/><ellipse cx="170" cy="900" rx="790" ry="640" fill="url(#cosmic-violet)"/></g><g class="ethereal-far" transform="rotate({angle} 800 500)"><path d="M-220 1000C230 910 100 120 740 300S1230 720 1820-300L1800 1200Z" fill="url(#ethereal-fold)"/><path d="M-200 1100C270 580 800 1190 1130 380S1570-170 1800 100" fill="none" stroke="{a}" stroke-opacity=".045" stroke-width="180"/></g><g class="ethereal-near"><g transform="rotate({angle} 800 500)">{contours}</g><ellipse cx="1300" cy="270" rx="330" ry="420" fill="none" stroke="{b}" stroke-opacity=".15" stroke-width="1" transform="rotate(38 1300 270)"/><path d="M930-100Q700 320 1190 430T1600 1100" stroke="url(#ethereal-edge)" stroke-width="2" opacity=".5"/></g></g>'''
    svg=re.sub(r'<g class="cosmic-preset cosmic-'+short+r'".*?(?=<g class="cosmic-preset|<g class="cosmic-starfield)',lambda _:group+'\n',svg,flags=re.S)
svg=re.sub(r'<g class="cosmic-constellations".*?</g>','',svg,flags=re.S)
(root/'web/celestial.svg').write_text(svg,encoding='utf-8')
gallery='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Orbiter · observatory scenes</title>
<link rel="stylesheet" href="../../web/celestial.css"><link rel="stylesheet" href="../../web/cosmic.css"><style>
body{margin:0;min-height:100dvh;--atmosphere:.8} .gallery-deck{position:fixed;bottom:28px;left:32px;right:32px;max-width:700px;padding:22px 26px;border:1px solid #d9e7eb30;border-radius:24px;background:#142033c9;color:#eef4f7;font:14px/1.5 system-ui} .gallery-deck small{font-size:9px;letter-spacing:2px;color:#b3d4d1} .gallery-deck h1{font-size:28px;letter-spacing:-1px;margin:6px 0 14px} .gallery-deck nav{display:flex;flex-wrap:wrap;gap:8px} .gallery-deck button{background:#d1e3e517;border:1px solid #d7e5e645;border-radius:12px;color:inherit;padding:10px 16px;cursor:pointer;font:inherit} .gallery-deck button[aria-pressed=true]{background:#b4e6d536} .gallery-deck label{display:flex;gap:15px;align-items:center;margin-top:16px} .gallery-deck p{font-size:12px;color:#b4c7d2;margin-bottom:0} @media(max-width:600px){.gallery-deck{left:16px;right:16px;bottom:16px;padding:18px}.gallery-deck h1{font-size:24px}}</style>
<body data-preset="tidal-night"><div class="orbital-backdrop">ART</div><section class="gallery-deck"><small>ORBITER · ORIGINAL ENVIRONMENT ART</small><h1 id="scene-title">Tidal Night</h1><nav><button data-choice="tidal-night" aria-pressed="true">Tidal Night</button><button data-choice="lunar-mist" aria-pressed="false">Lunar Mist</button><button data-choice="opal-dawn" aria-pressed="false">Opal Dawn</button></nav><label>Atmosphere <input id="strength" type="range" min="0" max="100" value="80"></label><p>Move to bend the light · click open space for a ripple · no extra WebGL. The planner keeps the selected scene and earned habitat lighting.</p></section><script src="../../web/celestial.js"></script><script>
OrbiterScene.start();document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{document.body.dataset.preset=b.dataset.choice;document.getElementById('scene-title').textContent=b.textContent;document.querySelectorAll('[data-choice]').forEach(x=>x.setAttribute('aria-pressed',x===b));});document.getElementById('strength').oninput=e=>document.body.style.setProperty('--atmosphere',e.target.value/100);
</script></body></html>'''.replace('>ART</div>','>'+svg+'</div>')
(root/'design/backgrounds/index.html').write_text(gallery,encoding='utf-8')
print('Built three original observatory environments.')
