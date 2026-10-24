/* Typed Apple Health observations. No permissions, network, storage or rewards. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OrbiterHealthData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_BYTES=5*1024*1024,MAX_SAMPLES=12000;
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const units={energy:'kcal',protein:'g',carbohydrate:'g',fat:'g',sleep:'sleepCategory',steps:'count'};
 const asleep=new Set(['asleep','asleepUnspecified','asleepCore','asleepDeep','asleepREM']);
 function fail(message){throw Error('Health observations: '+message);}
 function text(v,label,max=256){if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u001f]/.test(v))fail('Invalid '+label+'.');return v;}
 function timestamp(v){text(v,'timestamp',40);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(v)||!Number.isFinite(Date.parse(v)))fail('Invalid timestamp.');date(v.slice(0,10));if(Number(v.slice(11,13))>23||Number(v.slice(14,16))>59||Number(v.slice(17,19))>59)fail('Invalid timestamp.');return new Date(v).toISOString();}
 function number(v,max){if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max)fail('Value is out of range.');return v;}
 function zone(v){text(v,'time zone',100);try{new Intl.DateTimeFormat('en',{timeZone:v});}catch{fail('Invalid time zone.');}return v;}
 function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||v<'0001-01-01'||v>'9998-12-31'||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)fail('Invalid calendar date.');return v;}
 function array(v,label,max=MAX_SAMPLES){if(!Array.isArray(v)||v.length>max)fail('Invalid or excessive '+label+'.');return v;}
 function budget(v){let raw;try{raw=JSON.stringify(v);}catch{fail('Invalid data.');}if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_BYTES)fail('Data exceeds 5 MB.');}
 function sample(v){
  if(!object(v)||!Object.prototype.hasOwnProperty.call(units,v.type)||v.unit!==units[v.type])fail('Unsupported sample or unit.');
  const result={id:text(v.id,'sample ID',100),type:v.type,start:timestamp(v.start),end:timestamp(v.end),value:null,unit:v.unit,sourceId:text(v.sourceId,'source ID'),sourceName:text(v.sourceName,'source name',160)};
  if(result.end<result.start)fail('Sample ends before it starts.');
  if(v.type==='sleep'){const category=v.sleepState??v.value;if(!asleep.has(category)&&!['inBed','awake','unknown'].includes(category))fail('Invalid sleep category.');result.value=typeof v.value==='number'?number(v.value,100):category;result.sleepState=category;if(v.sleepCategory!==undefined)result.sleepCategory=text(v.sleepCategory,'sleep stage',60);}
  else result.value=number(v.value,v.type==='steps'?10000000:1000000);
  return result;
 }
 function range(v){if(v===null||v===undefined)return null;if(!object(v))fail('Invalid range.');const r={start:timestamp(v.start),end:timestamp(v.end),timeZone:zone(v.timeZone)};if(r.end<=r.start)fail('Invalid range.');return r;}
 function aggregate(v){if(v===null||v===undefined)return null;if(!object(v)||!['available','unavailableOrNoReadableData'].includes(v.status))fail('Invalid steps statistics.');return{status:v.status,value:v.status==='available'?number(v.value,10000000):null,range:range(v.range),fetchedAt:timestamp(v.fetchedAt),source:'appleHealthStatistics',days:array(v.days??[],'daily steps',31).map(d=>{if(!object(d)||!['available','unavailableOrNoReadableData'].includes(d.status))fail('Invalid daily steps.');return{date:date(d.date),status:d.status,value:d.status==='available'?number(d.value,10000000):null};})};}
 function create(){return{version:1,provider:'appleHealth',samples:[],range:null,lastFetchedAt:null,selectedNutritionSourceId:null};}
 function normalize(raw){
  if(!object(raw)||raw.version!==1||raw.provider!=='appleHealth')fail('Unsupported observation schema.');budget(raw);
  const samples=array(raw.samples,'samples').map(sample),ids=new Set();for(const s of samples){if(ids.has(s.id))fail('Duplicate sample ID.');ids.add(s.id);}
  return{version:1,provider:'appleHealth',samples:samples.sort((a,b)=>a.id.localeCompare(b.id)),range:range(raw.range),lastFetchedAt:raw.lastFetchedAt==null?null:timestamp(raw.lastFetchedAt),selectedNutritionSourceId:raw.selectedNutritionSourceId==null?null:text(raw.selectedNutritionSourceId,'nutrition source ID'),stepsAggregate:aggregate(raw.stepsAggregate)};
 }
 function applyDelta(state,delta){
  const s=normalize(state);if(!object(delta))fail('Invalid delta.');budget(delta);
  const removed=array(delta.deletedIds,'deleted IDs').map(v=>text(v,'deleted sample ID',100)),incoming=array(delta.samples,'samples').map(sample),seen=new Set();
  for(const v of incoming){if(seen.has(v.id))fail('Duplicate delta sample ID.');seen.add(v.id);}
  const next=new Map(s.samples.map(v=>[v.id,v]));for(const v of incoming)next.set(v.id,v);for(const id of removed)next.delete(id);
  return normalize({...s,samples:[...next.values()],range:delta.range===undefined?s.range:range(delta.range),lastFetchedAt:delta.fetchedAt===undefined?s.lastFetchedAt:timestamp(delta.fetchedAt),stepsAggregate:delta.summary?.steps?{...delta.summary.steps,range:delta.range,fetchedAt:delta.fetchedAt}:s.stepsAggregate});
 }
 function localDay(ms,timeZone){const p=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(ms)),get=t=>p.find(x=>x.type===t).value;return`${get('year').padStart(4,'0')}-${get('month')}-${get('day')}`;}
 function dayBounds(day,timeZone){date(day);zone(timeZone);const middle=Date.parse(day+'T12:00:00Z'),next=new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString().slice(0,10);
  function start(target){let lo=middle-48*3600000,hi=middle+48*3600000;while(hi-lo>1){const m=Math.floor((lo+hi)/2);if(localDay(m,timeZone)<target)lo=m;else hi=m;}return hi;}
  return{start:start(day),end:start(next)};
 }
 function union(intervals){let total=0,end=-Infinity;for(const [a,b]of intervals.sort((x,y)=>x[0]-y[0])){if(b>end){total+=b-Math.max(a,end);end=b;}}return total;}
 function summary(state,day,timeZone,sourceSelection){
  const s=normalize(state),bounds=dayBounds(day,timeZone),sources=new Map(),nutrients={energy:'calories',protein:'protein',carbohydrate:'carbs',fat:'fat'},sleep=[];
  for(const v of s.samples){const start=Date.parse(v.start),end=Date.parse(v.end);
   if(v.type==='sleep'){if(asleep.has(v.sleepState??v.value)&&end>bounds.start&&start<bounds.end)sleep.push([Math.max(start,bounds.start),Math.min(end,bounds.end)]);continue;}
   if(!nutrients[v.type]||start<bounds.start||start>=bounds.end)continue;
   if(!sources.has(v.sourceId))sources.set(v.sourceId,{sourceId:v.sourceId,sourceName:v.sourceName,nutrition:{calories:null,protein:null,carbs:null,fat:null},sampleCount:0});
   const row=sources.get(v.sourceId),k=nutrients[v.type];row.nutrition[k]=(row.nutrition[k]??0)+v.value;row.sampleCount++;
  }
  const providers=[...sources.values()].sort((a,b)=>a.sourceId.localeCompare(b.sourceId)),requested=sourceSelection===undefined?s.selectedNutritionSourceId:sourceSelection;
  if(requested!==null&&requested!==undefined)text(requested,'nutrition source ID');
  const selected=requested?sources.get(requested):providers.length===1?providers[0]:null;
  return{date:day,timeZone,providers,selectedNutritionSourceId:selected?.sourceId||null,selectionRequired:providers.length>1&&!selected,nutrition:selected?{...selected.nutrition}:{calories:null,protein:null,carbs:null,fat:null},sleepHours:sleep.length?union(sleep)/3600000:null,steps:(s.stepsAggregate?.range?.timeZone===timeZone?s.stepsAggregate?.days?.find(d=>d.date===day&&d.status==='available')?.value:undefined)??(s.stepsAggregate?.status==='available'&&s.stepsAggregate.range?.start===new Date(bounds.start).toISOString()&&s.stepsAggregate.range?.end===new Date(bounds.end).toISOString()?s.stepsAggregate.value:null),stepsAggregate:s.stepsAggregate,stepsReason:'Awaiting native HealthKit statistics; raw step samples are never added across sources.',lastFetchedAt:s.lastFetchedAt};
 }
 return{create,normalize,applyDelta,summary,dayBounds,MAX_BYTES,MAX_SAMPLES};
});
