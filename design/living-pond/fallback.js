import {fallbackPortrait as base} from '../../src/mascot/fallback.js';
export function studyFallback(code,stage,equipment){
  if(window.OrbiterStudyOriginal)return base(code,stage,equipment);
  // Preserve the actual identity illustration, replace only the generic decorations.
  let svg=decodeURIComponent(base(code,stage,{...equipment,halo:null,habitat:null,trail:null}).split(',').slice(1).join(','));
  if(equipment.appearance==='mint')svg=svg.replaceAll('#ecc0ad','#b4e6d5');
  if(equipment.appearance==='indigo')svg=svg.replaceAll('#ecc0ad','#939ddd');
  const habitat={
    'habitat-01':'<g fill="#8eafb9" stroke="#b8e5e9" stroke-width="1"><ellipse cx="22" cy="157" rx="16" ry="7"/><ellipse cx="135" cy="152" rx="19" ry="8"/><ellipse cx="33" cy="143" rx="10" ry="5"/></g><g stroke="#9de1e5" fill="none" opacity=".6"><ellipse cx="125" cy="164" rx="24" ry="4"/><ellipse cx="125" cy="164" rx="15" ry="2"/></g>',
    'habitat-07':'<g stroke="#cfddff" fill="#8b9dd1"><path d="M3 155L9 102L21 84L29 153ZM22 155L30 111L38 104L44 156ZM121 157L128 101L140 80L149 154ZM142 158L148 117L157 107L160 157Z"/></g><path d="M11 104L21 153L31 114M130 102L140 152L149 119" fill="none" stroke="#d2e9ff"/>',
    'habitat-12':'<path d="M9 157C9 134 84 136 80 157S151 179 151 157S76 134 80 157S9 180 9 157Z" fill="none" stroke="#a6ecec" stroke-width="2"/><circle cx="19" cy="147" r="2" fill="#e0ffff"/><circle cx="140" cy="168" r="2" fill="#e0ffff"/>',
    'habitat-11':'<g stroke="#739aab" fill="none" stroke-width="2"><path d="M14 155V112M28 154V133M143 155V112M131 155V135"/></g><g fill="#c7b7ed" stroke="#e1dbff" stroke-width="2"><path d="M14 98L18 108L28 112L18 116L14 126L10 116L1 112L10 108ZM143 98L147 108L157 112L147 116L143 126L139 116L130 112L139 108Z"/><circle cx="28" cy="133" r="6"/><circle cx="131" cy="135" r="6"/></g>'
  }[equipment.habitat]||'';
  // Wings/cape are behind the body; pendant sits in front of the scarf.
  const behind=equipment.halo==='halo-12'?'<g fill="#b1bce4" stroke="#d4e1ff"><path d="M51 140Q4 130 4 91Q14 107 34 109L12 93Q15 122 40 124L13 115Q26 141 51 145ZM108 140Q156 130 156 91Q146 107 126 109L148 93Q145 122 120 124L147 115Q134 141 108 145Z"/></g>':equipment.halo==='halo-07'?'<path d="M51 110Q80 101 108 110L130 153Q80 169 31 153Z" fill="#50638e" stroke="#c0d6f0"/><g fill="#c9f4ff"><circle cx="39" cy="147" r="2"/><circle cx="45" cy="135" r="2"/><circle cx="118" cy="143" r="2"/><circle cx="114" cy="128" r="2"/></g>':'';
  const pendant=equipment.halo==='halo-thin'?'<path d="M68 114L80 132L92 114" fill="none" stroke="#d7e7ef" stroke-width="1.5"/><path d="M80 128L86 138L80 146L74 138Z" fill="#dcebf2" stroke="#708da1"/><path d="M80 132V142" stroke="#78bfd9"/>':equipment.halo==='halo-10'?'<circle cx="80" cy="135" r="12" fill="#294359" stroke="#d1e3ed" stroke-width="2"/><path d="M80 125L84 140L76 138Z" fill="#b2e8ef"/><path d="M69 135H72M88 135H91M80 145V143" stroke="#d1e3ed"/>':'';
  const trail=equipment.trail==='trail-waves'?'<path d="M4 164Q40 151 80 164T156 164M8 170Q40 157 80 170T152 170" fill="none" stroke="#a1dce4" opacity=".65"/>':equipment.trail==='trail-sparks'?'<path d="M3 136L8 91L23 81M138 83L152 103L155 140" fill="none" stroke="#cfdbf5"/><g fill="#cfdbf5"><circle cx="8" cy="91" r="2"/><circle cx="23" cy="81" r="2"/><circle cx="152" cy="103" r="2"/></g>':equipment.trail==='trail-comet'?'<path d="M8 153Q-8 80 30 48" fill="none" stroke="#edc7b5" stroke-width="2"/><circle cx="30" cy="48" r="4" fill="#edc7b5"/>':'';
  const marks=equipment.appearance==='mint'?'<path d="M38 64Q80 81 121 64M34 99Q80 113 125 99" fill="none" stroke="#619cae" stroke-width="3" opacity=".65"/>':equipment.appearance==='look-11'?'<path d="M40 62L49 55L56 65L48 73ZM105 57L115 65L108 75L99 65Z" fill="#8b91c5" opacity=".75"/>':equipment.appearance==='indigo'?'<g fill="#c9dfee"><path d="M47 55L49 61L55 63L49 65L47 71L45 65L39 63L45 61ZM114 86L116 91L121 93L116 95L114 100L112 95L107 93L112 91Z"/></g>':'';
  svg=svg.replace('<ellipse cx="80" cy="163"',habitat+behind+trail+'<ellipse cx="80" cy="163"').replace('</svg>',marks+pendant+'</svg>');
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
