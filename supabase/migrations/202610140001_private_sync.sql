-- Run once in the Supabase SQL editor. No browser holds an administrator key.
begin;
create table if not exists public.orbiter_beta_members (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.orbiter_beta_members enable row level security;
create table if not exists public.orbiter_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check(length(key) between 3 and 1024),
  value jsonb,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  primary key(user_id,key)
);
alter table public.orbiter_records enable row level security;
drop policy if exists orbiter_read_own on public.orbiter_records;
create policy orbiter_read_own on public.orbiter_records for select to authenticated
  using(user_id=auth.uid() and exists(select 1 from public.orbiter_beta_members where user_id=auth.uid()));
drop policy if exists orbiter_member_read on public.orbiter_beta_members;
create policy orbiter_member_read on public.orbiter_beta_members for select to authenticated using(user_id=auth.uid());
create table if not exists public.orbiter_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  request jsonb not null,
  result jsonb not null,
  primary key(user_id,operation_id)
);
alter table public.orbiter_operations enable row level security;
revoke all on public.orbiter_records,public.orbiter_operations,public.orbiter_beta_members from anon,authenticated;
grant select on public.orbiter_records,public.orbiter_beta_members to authenticated;

create or replace function public.orbiter_require_member() returns uuid
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null or not exists(select 1 from public.orbiter_beta_members where user_id=u) then raise exception 'Private beta access is not enabled for this account' using errcode='42501';end if;
 return u;
end $$;

create or replace function public.orbiter_pull() returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.orbiter_require_member(); result jsonb;
begin
 select coalesce(jsonb_object_agg(key,jsonb_build_object('value',value,'version',version)),'{}'::jsonb)
 into result from public.orbiter_records where user_id=u;
 return result;
end $$;

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

create or replace function public.orbiter_write(p_id uuid,p_key text,p_expected bigint,p_value jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.orbiter_require_member(); old public.orbiter_records; receipt public.orbiter_operations; result jsonb; request jsonb;
begin
 if length(p_key)>1024 or length(p_key)<3 or p_expected<0 or octet_length(coalesce(p_value,'null'::jsonb)::text)>131072 then raise exception 'Invalid record';end if;
 if not (p_key::jsonb->>0=any(array['template','week','event','task','course','reflection','profile','preference','session','session-legacy'])) then raise exception 'Unsupported record type';end if;
 if public.orbiter_validate_record(p_key,p_value) is not true then raise exception 'Malformed workspace record';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 request:=jsonb_build_object('key',p_key,'expected',p_expected,'value',p_value);
 select * into receipt from public.orbiter_operations where user_id=u and operation_id=p_id;
 if found then
   if receipt.request<>request then raise exception 'Operation identifier reused';end if;
   return receipt.result;
 end if;
 select * into old from public.orbiter_records where user_id=u and key=p_key;
 if coalesce(old.version,0)<>p_expected then
   return jsonb_build_object('conflict',true,'value',old.value,'version',coalesce(old.version,0));
 end if;
 if p_expected=0 and (select count(*) from public.orbiter_records where user_id=u)>50000 then raise exception 'Workspace record limit reached';end if;
 insert into public.orbiter_records(user_id,key,value,version) values(u,p_key,p_value,p_expected+1)
 on conflict(user_id,key) do update set value=excluded.value,version=excluded.version,updated_at=now();
 result:=jsonb_build_object('value',p_value,'version',p_expected+1);
 insert into public.orbiter_operations values(u,p_id,request,result);
 return result;
end $$;
revoke all on function public.orbiter_require_member(),public.orbiter_validate_record(text,jsonb),public.orbiter_pull(),public.orbiter_write(uuid,text,bigint,jsonb) from public,anon;
grant execute on function public.orbiter_pull(),public.orbiter_write(uuid,text,bigint,jsonb) to authenticated;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='orbiter_records') then
   alter publication supabase_realtime add table public.orbiter_records;
 end if;
end $$;
commit;
