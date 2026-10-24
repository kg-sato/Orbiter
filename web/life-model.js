/* Separate, local life journal. Pure data operations; no study/native reward authority. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OrbiterLifeModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const H=typeof module==='object'&&module.exports?require('./health-data.js'):globalThis.OrbiterHealthData;
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 function fail(message){throw new Error('Life journal: '+message);}
 function number(v,label,max,nullable=false){if(nullable&&(v===null||v===undefined||v===''))return null;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max)fail(label+' is out of range.');return v;}
 function text(v,label,max,empty=false){if(typeof v!=='string')fail(label+' must be text.');const s=v.trim();if(s.length>max||(!empty&&!s))fail(label+' is invalid.');return s;}
 function validDate(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const [y,m,d]=v.split('-').map(Number),leap=y%4===0&&(y%100!==0||y%400===0);return y>=1&&m>=1&&m<=12&&d>=1&&d<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][m-1];}
 function date(v){if(!validDate(v))fail('Use a valid YYYY-MM-DD date.');return v;}
 function id(v){if(typeof v!=='string'||!/^[-A-Za-z0-9_]{1,100}$/.test(v))fail('Invalid record ID.');return v;}
 function list(v,label,max){if(!Array.isArray(v)||v.length>max)fail(label+' is invalid or too large.');return v;}
 function map(v,label,max,fn){if(!object(v)||Object.keys(v).length>max)fail(label+' is invalid or too large.');const result={};for(const k of Object.keys(v))result[date(k)]=fn(v[k]);return result;}
 function manual(v){if(v!==undefined&&v!=='manual')fail('Only manually entered journal records are supported.');return 'manual';}
 function meal(v){if(!object(v))fail('Invalid meal.');return{id:id(v.id),date:date(v.date),name:text(v.name,'Meal name',160),calories:number(v.calories,'Calories',20000,true),protein:number(v.protein,'Protein',2000,true),carbs:number(v.carbs,'Carbohydrates',5000,true),fat:number(v.fat,'Fat',2000,true),source:manual(v.source)};}
 function metric(v){if(!object(v))fail('Invalid metrics.');const steps=number(v.steps,'Steps',200000,true);if(steps!==null&&!Number.isInteger(steps))fail('Steps must be a whole number.');return{sleepHours:number(v.sleepHours,'Sleep hours',24,true),steps,source:manual(v.source)};}
 function habit(v){if(!object(v))fail('Invalid habit.');const completions=list(v.completions,'Habit completions',36500).map(date);if(new Set(completions).size!==completions.length)fail('Duplicate habit completion.');return{id:id(v.id),name:text(v.name,'Habit name',100),completions:completions.slice().sort()};}
 const questIds=['focus','plan','habit','reflect'];
 function remembered(v){const ids=list(v,'Remembered intentions',4);if(ids.some(k=>!questIds.includes(k))||new Set(ids).size!==ids.length)fail('Invalid remembered intentions.');return questIds.filter(k=>ids.includes(k));}
 function create(){return{schemaVersion:1,nextId:1,meals:[],metrics:{},habits:[],reflections:{},journey:{}};}
 function normalize(raw){
  if(!object(raw)||raw.schemaVersion!==1)fail('Unsupported journal schema.');
  if(!Number.isSafeInteger(raw.nextId)||raw.nextId<1||raw.nextId>Number.MAX_SAFE_INTEGER-1)fail('Invalid ID sequence.');
  const meals=list(raw.meals,'Meals',20000).map(meal),habits=list(raw.habits,'Habits',100).map(habit),ids=meals.concat(habits).map(v=>v.id);
  if(new Set(ids).size!==ids.length)fail('Duplicate record ID.');
  return{schemaVersion:1,nextId:raw.nextId,meals,metrics:map(raw.metrics,'Metrics',36500,metric),habits,reflections:map(raw.reflections,'Reflections',36500,v=>text(v,'Reflection',4000,true)),journey:map(raw.journey===undefined?{}:raw.journey,'Journey',36500,remembered),...(raw.health===undefined?{}:{health:H.normalize(raw.health)})};
 }
 function fresh(state,kind,requested){if(requested!==undefined){id(requested);if(state.meals.concat(state.habits).some(v=>v.id===requested))fail('Duplicate record ID.');return requested;}let value;do{if(state.nextId>=Number.MAX_SAFE_INTEGER-1)fail('ID sequence exhausted.');value='life-'+kind+'-'+state.nextId++;}while(state.meals.concat(state.habits).some(v=>v.id===value));return value;}
 function find(items,key){const n=items.findIndex(v=>v.id===id(key));if(n<0)fail('Record not found.');return n;}
 function addMeal(state,entry){const s=normalize(state);if(!object(entry))fail('Invalid meal.');s.meals.push(meal({...entry,id:fresh(s,'meal',entry.id)}));return normalize(s);}
 function updateMeal(state,key,patch){const s=normalize(state),n=find(s.meals,key);if(!object(patch)||own(patch,'id')&&patch.id!==key)fail('Cannot replace a record ID.');s.meals[n]=meal({...s.meals[n],...patch,id:key});return s;}
 function deleteMeal(state,key){const s=normalize(state);s.meals.splice(find(s.meals,key),1);return s;}
 function setMetrics(state,day,patch){const s=normalize(state);date(day);if(!object(patch))fail('Invalid metrics.');s.metrics[day]=metric({...s.metrics[day],...patch});return normalize(s);}
 function addHabit(state,entry){const s=normalize(state);if(!object(entry))fail('Invalid habit.');s.habits.push(habit({id:fresh(s,'habit',entry.id),name:entry.name,completions:[]}));return normalize(s);}
 function updateHabit(state,key,patch){const s=normalize(state),n=find(s.habits,key);if(!object(patch)||own(patch,'id')&&patch.id!==key)fail('Cannot replace a record ID.');s.habits[n].name=text(patch.name,'Habit name',100);return s;}
 function deleteHabit(state,key){const s=normalize(state);s.habits.splice(find(s.habits,key),1);return s;}
 function toggleHabit(state,key,day,done){const s=normalize(state),h=s.habits[find(s.habits,key)];date(day);if(done!==undefined&&typeof done!=='boolean')fail('Habit completion must be true or false.');const has=h.completions.includes(day),next=done===undefined?!has:done;h.completions=h.completions.filter(v=>v!==day);if(next)h.completions.push(day);h.completions.sort();return normalize(s);}
 function setReflection(state,day,value){const s=normalize(state);date(day);const reflection=text(value,'Reflection',4000,true);if(reflection)s.reflections[day]=reflection;else delete s.reflections[day];return normalize(s);}
 function stats(s,day,context={}){
  date(day);if(!object(context))fail('Invalid study summary.');const focusMinutes=number(context.focusMinutes??0,'Focus minutes',1440),plannedCount=number(context.plannedCount??0,'Planned items',10000);
  if(!Number.isInteger(plannedCount))fail('Planned items must be a whole number.');
  const entries=s.meals.filter(v=>v.date===day),nutrition={calories:0,protein:0,carbs:0,fat:0},nutritionKnown={calories:0,protein:0,carbs:0,fat:0};
  for(const v of entries)for(const k of Object.keys(nutrition))if(v[k]!==null){nutrition[k]+=v[k];nutritionKnown[k]++;}
  const done=s.habits.filter(v=>v.completions.includes(day)).length,reflection=s.reflections[day]||'';
  const quests=[{id:'focus',label:'Make room for focus',complete:focusMinutes>=5},{id:'plan',label:'Choose an intention',complete:plannedCount>=1},{id:'habit',label:'Care for a daily habit',complete:done>0},{id:'reflect',label:'Leave a reflection',complete:!!reflection}];
  const earned=quests.filter(v=>v.complete).length;
  return{date:day,mealCount:entries.length,nutrition,nutritionKnown,metrics:s.metrics[day]||{sleepHours:null,steps:null,source:'manual'},habits:{done,total:s.habits.length},reflection,focusMinutes,plannedCount,quests,constellation:{earned,total:4,complete:earned===4}};
 }
 function summary(state,day,context){return stats(normalize(state),day,context);}
 // The caller persists this immutable result only after a user save or trusted study event.
 // A date/quest pair can be remembered once; observations never create intentions.
 function rememberJourney(state,day,context){const s=normalize(state),achieved=stats(s,day,context).quests.filter(q=>q.complete).map(q=>q.id),previous=s.journey[day]||[];if(achieved.length)s.journey[day]=questIds.filter(k=>previous.includes(k)||achieved.includes(k));return normalize(s);}
 function journey(state){const s=normalize(state),entries=Object.values(s.journey).filter(v=>v.length),lights=entries.reduce((sum,v)=>sum+v.length,0),thresholds=[0,4,12,28,56],labels=['A quiet beginning','First moonlight','A growing garden','A little constellation','A garden of stars'];let stage=0;while(stage+1<thresholds.length&&lights>=thresholds[stage+1])stage++;return{lights,days:entries.length,stage,label:labels[stage],nextAt:thresholds[stage+1]??null};}
 function recent(state,endDate,contextByDate={}){const s=normalize(state);date(endDate);if(!object(contextByDate))fail('Invalid study history.');const result=[],cursor=new Date(endDate+'T12:00:00Z');for(let i=0;i<7;i++){const day=cursor.toISOString().slice(0,10);if(!validDate(day))break;result.unshift(stats(s,day,own(contextByDate,day)?contextByDate[day]:{}));cursor.setUTCDate(cursor.getUTCDate()-1);}return result;}
 function exportJSON(state){return JSON.stringify(normalize(state),null,2);}
 function importJSON(value){if(typeof value!=='string'||value.length>5*1024*1024)fail('Backup must be JSON text under 5 MB.');let raw;try{raw=JSON.parse(value);}catch{fail('Backup is not valid JSON.');}return normalize(raw);}
 return{create,normalize,validDate,addMeal,updateMeal,deleteMeal,setMetrics,addHabit,updateHabit,deleteHabit,toggleHabit,setReflection,summary,rememberJourney,journey,recent,exportJSON,importJSON};
});
