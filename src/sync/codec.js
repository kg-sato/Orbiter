/* A record represents one independently editable entity; timers never leave their device. */
export const clone = value => structuredClone(value);
export function stable(value) {
  if (Array.isArray(value)) return '['+value.map(stable).join(',')+']';
  if (value && typeof value==='object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
export const equal = (a,b) => stable(a)===stable(b);
export function encode(workspace) {
  const records={};
  const put=(key,value)=>{records[JSON.stringify(key)]=clone(value);};
  for(const item of workspace.template||[]) put(['template',item.id],item);
  for(const [week,items] of Object.entries(workspace.weeks||{})) {
    put(['week',week],true);
    for(const item of items)put(['event',week,item.id],item);
  }
  const s=workspace.study||{};
  for(const item of s.tasks||[])put(['task',item.id],item);
  for(const item of s.courses||[])put(['course',item.name],item);
  for(const item of s.reflections||[])put(['reflection',item.week],item);
  for(const [name,code] of Object.entries(s.catProfiles||{}))put(['profile',name],code);
  for(const [key,value] of Object.entries(s.preferences||{}))put(['preference',key],value);
  (s.sessions||[]).forEach((item,index)=>put(item.orbitSession?['session',item.orbitSession,item.date]:item.id?['session',item.id]:['session-legacy',item.date,item.minutes,item.title,item.taskId??null,index],item));
  return records;
}
export function decode(records,local) {
  const out={template:[],weeks:{},study:{tasks:[],courses:[],reflections:[],catProfiles:{},preferences:{name:'',goal:10,motion:false,solid:false},sessions:[],timer:clone(local?.study?.timer||{duration:25,remaining:1500,endAt:null,title:''})}};
  // Null values are durable tombstones. Avoid prototype-sensitive property assignment.
  const set=(object,key,value)=>Object.defineProperty(object,key,{value:clone(value),enumerable:true,writable:true,configurable:true});
  for(const [raw,value] of Object.entries(records)){
    if(value===null)continue;const [kind,id,extra]=JSON.parse(raw);
    if(kind==='template')out.template.push(clone(value));
    if(kind==='week'&&!Object.hasOwn(out.weeks,id))set(out.weeks,id,[]);
    if(kind==='event'){if(!Object.hasOwn(out.weeks,id))set(out.weeks,id,[]);out.weeks[id].push(clone(value));}
    if(kind==='task')out.study.tasks.push(clone(value));
    if(kind==='course')out.study.courses.push(clone(value));
    if(kind==='reflection')out.study.reflections.push(clone(value));
    if(kind==='profile')set(out.study.catProfiles,id,value);
    if(kind==='preference')set(out.study.preferences,id,value);
    if(kind==='session'||kind==='session-legacy')out.study.sessions.push(clone(value));
  }
  out.study.sessions.sort((a,b)=>a.date.localeCompare(b.date));
  return out;
}
/* Merge edits to different object fields. Arrays and deletions are deliberately atomic. */
export function merge(base,local,remote) {
  if(equal(local,base))return {value:clone(remote)};
  if(equal(remote,base)||equal(local,remote))return {value:clone(local)};
  if(base&&local&&remote&&!Array.isArray(base)&&!Array.isArray(local)&&!Array.isArray(remote)&&[base,local,remote].every(v=>typeof v==='object')){
    const result={};
    for(const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
      const r=merge(base[key]??null,local[key]??null,remote[key]??null);if(r.conflict)return {conflict:true};
      if(r.value!==null)Object.defineProperty(result,key,{value:r.value,enumerable:true});
    }
    return {value:result};
  }
  return {conflict:true};
}
