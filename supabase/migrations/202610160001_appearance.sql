-- Backward-compatible appearance preferences. Apply after the first two migrations.
create or replace function public.orbiter_validate_record(p_key text,p_value jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare k jsonb:=p_key::jsonb;kind text:=k->>0; v jsonb:=p_value; n numeric;
begin
 if jsonb_typeof(k)<>'array' or jsonb_array_length(k)<2 then return false;end if;
 if v is null or v='null'::jsonb then return true;end if;
 if kind='week' then return jsonb_array_length(k)=2 and (k->>1)::date::text=k->>1 and v='true'::jsonb;end if;
 if kind='profile' then return jsonb_typeof(v)='number' and (v::text)::numeric between 0 and 65535 and trunc((v::text)::numeric)=(v::text)::numeric;end if;
 if kind='preference' then
  case k->>1
   when 'name' then return jsonb_typeof(v)='string' and length(v#>>'{}')<=40;
   when 'goal' then return jsonb_typeof(v)='number' and (v::text)::numeric between 1 and 80;
   when 'scenePreset' then return jsonb_typeof(v)='string' and v#>>'{}'=any(array['tidal-night','lunar-mist','opal-dawn']);
   when 'motionIntensity' then return jsonb_typeof(v)='number' and (v::text)::numeric between 0 and 100 and trunc((v::text)::numeric)=(v::text)::numeric;
   when 'effectQuality' then return jsonb_typeof(v)='string' and v#>>'{}' in ('auto','low','high');
   when 'atmosphereStrength' then return jsonb_typeof(v)='number' and (v::text)::numeric between 0 and 100 and trunc((v::text)::numeric)=(v::text)::numeric;
   when 'accent' then return v#>>'{}'=any(array['mint','lilac','apricot']);
   when 'material' then return v#>>'{}'=any(array['sculpted','glass','quiet']);
   when 'motion','solid','haptics','reminders' then return jsonb_typeof(v)='boolean';
   when 'studyStart','studyEnd' then return jsonb_typeof(v)='number' and (v::text)::numeric between 360 and 1380 and mod((v::text)::numeric,30)=0;
   when 'dailyTarget' then return jsonb_typeof(v)='number' and (v::text)::numeric between 30 and 720 and mod((v::text)::numeric,30)=0;
   else return false;
  end case;
 end if;
 if jsonb_typeof(v)<>'object' then return false;end if;
 if kind in ('event','template') then
  return length(coalesce(v->>'id','')) between 1 and 128 and length(coalesce(v->>'title','')) between 1 and 160
  and length(coalesce(v->>'notes',''))<=5000 and (v->>'day')::int between 0 and 6
  and v->>'start'~'^(0[6-9]|1[0-9]|2[0-2]):(00|30)$' and v->>'end'~'^(0[6-9]|1[0-9]|2[0-2]):(00|30)$|^23:00$'
  and v->>'start'<v->>'end' and v->>'color'~'^#[0-9a-fA-F]{6}$';
 end if;
 if kind='task' then
  return length(coalesce(v->>'id','')) between 1 and 128 and length(coalesce(v->>'title','')) between 1 and 160
  and length(coalesce(v->>'course',''))<=60 and (v->>'due')::date::text=v->>'due'
  and (v->>'estimate')::int=any(array[30,60,90,120]) and jsonb_typeof(v->'done')='boolean'
  and (not(v?'steps') or (jsonb_typeof(v->'steps')='array' and jsonb_array_length(v->'steps')<=20));
 end if;
 if kind='course' then return v->>'name'=k->>1 and length(coalesce(v->>'name','')) between 1 and 60 and length(coalesce(v->>'notes',''))<=5000 and (v->>'confidence')::int between 1 and 5;end if;
 if kind='reflection' then return (v->>'week')::date::text=v->>'week' and length(coalesce(v->>'win',''))<=1000 and length(coalesce(v->>'next',''))<=1000;end if;
 if kind in ('session','session-legacy') then return (v->>'date')::date::text=v->>'date' and (v->>'minutes')::numeric>0 and (v->>'minutes')::numeric<=1440 and length(coalesce(v->>'title',''))<=160;end if;
 return false;
exception when others then return false;
end $$;
