begin;
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.orbiter_devices (
 user_id uuid not null references auth.users(id) on delete cascade,
 device_id uuid primary key default gen_random_uuid(), secret_hash text not null
);
create table if not exists public.orbiter_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 focused_ms bigint not null default 0 check(focused_ms>=0), opened bigint not null default 0,
 owned text[] not null default array['mint','halo-thin','trail-waves'], stars bigint not null default 0,
 course_ms jsonb not null default '{}', equipment jsonb not null default '{"appearance":"mint","halo":"halo-thin","trail":"trail-waves","habitat":""}',
 migrated boolean not null default false
);
create table if not exists public.orbiter_focus_receipts (
 user_id uuid not null references auth.users(id) on delete cascade, event_id text not null, request jsonb not null,
 primary key(user_id,event_id)
);
create table if not exists public.orbiter_focus_intervals (
 user_id uuid not null references auth.users(id) on delete cascade, start_ms bigint not null, end_ms bigint not null,
 check(end_ms>start_ms), primary key(user_id,start_ms,end_ms)
);
create table if not exists public.orbiter_crate_receipts (
 user_id uuid not null references auth.users(id) on delete cascade, operation_id uuid not null, item jsonb not null,
 primary key(user_id,operation_id)
);
create table if not exists public.orbiter_catalog(id text primary key,name text not null,rarity text not null,slot text not null);
alter table public.orbiter_devices enable row level security;
alter table public.orbiter_progress enable row level security;
alter table public.orbiter_focus_receipts enable row level security;
alter table public.orbiter_focus_intervals enable row level security;
alter table public.orbiter_crate_receipts enable row level security;
alter table public.orbiter_catalog enable row level security;
revoke all on public.orbiter_devices,public.orbiter_progress,public.orbiter_focus_receipts,public.orbiter_focus_intervals,public.orbiter_crate_receipts,public.orbiter_catalog from anon,authenticated;
drop policy if exists orbiter_progress_read on public.orbiter_progress;
create policy orbiter_progress_read on public.orbiter_progress for select to authenticated using(user_id=auth.uid() and exists(select 1 from public.orbiter_beta_members where user_id=auth.uid()));
grant select on public.orbiter_progress to authenticated;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='orbiter_progress') then alter publication supabase_realtime add table public.orbiter_progress;end if;
end $$;

create or replace function public.orbiter_device() returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.orbiter_require_member(); d uuid; secret text:=encode(extensions.gen_random_bytes(32),'hex');
begin
 if (select count(*) from public.orbiter_devices where user_id=u)>=10 then raise exception 'Device limit reached';end if;
 insert into public.orbiter_devices(user_id,secret_hash) values(u,encode(extensions.digest(secret,'sha256'),'hex')) returning device_id into d;
 return jsonb_build_object('id',d,'secret',secret);
end $$;
create or replace function public.orbiter_require_device(p_device uuid,p_secret text) returns uuid
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.orbiter_require_member();
begin
 if not exists(select 1 from public.orbiter_devices where user_id=u and device_id=p_device and secret_hash=encode(extensions.digest(p_secret,'sha256'),'hex')) then raise exception 'Device credential rejected' using errcode='42501';end if;
 return u;
end $$;
create or replace function public.orbiter_rewards() returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.orbiter_require_member(); p public.orbiter_progress;
begin
 select * into p from public.orbiter_progress where user_id=u;
 if not found then return jsonb_build_object('focusedMs',0,'xp',0,'level',1,'chests',0,'owned',array['mint','halo-thin','trail-waves'],'courseMs','{}'::jsonb,'stars',0,'crateProgressMs',0);end if;
 return jsonb_build_object('focusedMs',p.focused_ms,'xp',p.focused_ms/60000,'level',p.focused_ms/6000000+1,'chests',greatest(0,p.focused_ms/1800000-p.opened),'owned',p.owned,'courseMs',p.course_ms,'stars',p.stars,'crateProgressMs',p.focused_ms%1800000,'equipment',p.equipment);
end $$;
create or replace function public.orbiter_bootstrap(p_device uuid,p_secret text,p_focus bigint,p_opened bigint,p_owned text[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.orbiter_require_device(p_device,p_secret);
begin
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 if p_focus<0 or p_focus>31536000000 or p_opened<0 or p_opened>p_focus/1800000 or cardinality(p_owned)>51 or exists(select 1 from unnest(p_owned) i where not exists(select 1 from public.orbiter_catalog where id=i)) then raise exception 'Invalid companion migration';end if;
 insert into public.orbiter_progress(user_id,focused_ms,opened,owned,migrated) values(u,p_focus,p_opened,array(select distinct unnest(p_owned||array['mint','halo-thin','trail-waves'])),true) on conflict(user_id) do nothing;
 return public.orbiter_rewards();
end $$;
create or replace function public.orbiter_focus(p_device uuid,p_secret text,p_id text,p_start bigint,p_end bigint,p_course text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.orbiter_require_device(p_device,p_secret); previous jsonb; request jsonb; cursor_ms bigint:=p_start; total bigint:=0; part_end bigint; i record; now_ms bigint:=(extract(epoch from now())*1000)::bigint;
begin
 if p_start<now_ms-31536000000 or p_end>now_ms+300000 or p_start>=p_end or p_end-p_start>86400000 or length(p_id)>200 or length(coalesce(p_course,''))>16 then raise exception 'Invalid focus interval';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 request:=jsonb_build_object('start',p_start,'end',p_end,'course',p_course);
 select r.request into previous from public.orbiter_focus_receipts r where user_id=u and event_id=p_id;
 if found then if previous<>request then raise exception 'Focus identifier reused';end if;return public.orbiter_rewards();end if;
 for i in select * from public.orbiter_focus_intervals where user_id=u and start_ms<p_end and end_ms>p_start order by start_ms loop
   part_end:=least(i.start_ms,p_end);
   if part_end>cursor_ms then insert into public.orbiter_focus_intervals values(u,cursor_ms,part_end);total:=total+part_end-cursor_ms;end if;
   cursor_ms:=greatest(cursor_ms,i.end_ms);
 end loop;
 if cursor_ms<p_end then insert into public.orbiter_focus_intervals values(u,cursor_ms,p_end);total:=total+p_end-cursor_ms;end if;
 insert into public.orbiter_progress(user_id) values(u) on conflict do nothing;
 update public.orbiter_progress set focused_ms=focused_ms+total,course_ms=case when p_course is null then course_ms else jsonb_set(course_ms,array[p_course],to_jsonb(coalesce((course_ms->>p_course)::bigint,0)+total)) end where user_id=u;
 insert into public.orbiter_focus_receipts values(u,p_id,request);
 return public.orbiter_rewards();
end $$;
create or replace function public.orbiter_open_crate(p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.orbiter_require_member(); p public.orbiter_progress; item jsonb; tier text; c int; r int; m int; weight float8; roll float8;
begin
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select t.item into item from public.orbiter_crate_receipts t where user_id=u and operation_id=p_id;
 if found then return jsonb_build_object('reward',item,'rewards',public.orbiter_rewards());end if;
 select * into p from public.orbiter_progress where user_id=u for update;
 if not found or p.opened>=p.focused_ms/1800000 then raise exception 'No earned crate is ready';end if;
 select count(*) filter(where rarity='common'),count(*) filter(where rarity='rare'),count(*) filter(where rarity='mythic') into c,r,m from public.orbiter_catalog where not(id=any(p.owned));
 if c+r+m=0 then item:=jsonb_build_object('name','Constellation star','rarity','mythic');update public.orbiter_progress set stars=stars+1 where user_id=u;
 else
  weight:=(case when c>0 then 70 else 0 end)+(case when r>0 then 25 else 0 end)+(case when m>0 then 5 else 0 end);
  roll:=random()*weight;tier:=case when c>0 and roll<70 then 'common' when r>0 and roll<(case when c>0 then 70 else 0 end)+25 then 'rare' else 'mythic' end;
  select jsonb_build_object('id',id,'name',name,'rarity',rarity,'slot',slot) into item from public.orbiter_catalog where rarity=tier and not(id=any(p.owned)) order by random() limit 1;
  update public.orbiter_progress set owned=array_append(owned,item->>'id') where user_id=u;
 end if;
 update public.orbiter_progress set opened=opened+1 where user_id=u;
 insert into public.orbiter_crate_receipts values(u,p_id,item);
 return jsonb_build_object('reward',item,'rewards',public.orbiter_rewards());
end $$;
create or replace function public.orbiter_equip(p_slot text,p_item text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.orbiter_require_member();
begin
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 if not exists(select 1 from public.orbiter_catalog c join public.orbiter_progress p on p.user_id=u where c.id=p_item and c.slot=p_slot and c.id=any(p.owned)) then raise exception 'Choose an owned item for this slot';end if;
 update public.orbiter_progress set equipment=jsonb_set(equipment,array[p_slot],to_jsonb(p_item)) where user_id=u;
 return public.orbiter_rewards();
end $$;
revoke all on function public.orbiter_device(),public.orbiter_require_device(uuid,text),public.orbiter_rewards(),public.orbiter_bootstrap(uuid,text,bigint,bigint,text[]),public.orbiter_focus(uuid,text,text,bigint,bigint,text),public.orbiter_open_crate(uuid),public.orbiter_equip(text,text) from public,anon;
grant execute on function public.orbiter_device(),public.orbiter_rewards(),public.orbiter_bootstrap(uuid,text,bigint,bigint,text[]),public.orbiter_focus(uuid,text,text,bigint,bigint,text),public.orbiter_open_crate(uuid),public.orbiter_equip(text,text) to authenticated;
insert into public.orbiter_catalog(id,name,rarity,slot) values
('mint','Tidal mint','common','appearance'),
('lilac','Moon mist','common','appearance'),
('opal','Opal dawn','common','appearance'),
('rose','Rose nebula','common','appearance'),
('halo-thin','Silver charm','common','halo'),
('halo-double','Twin charms','common','halo'),
('trail-sparks','Starlight','common','trail'),
('trail-waves','Quiet tide','common','trail'),
('aurora','Aurora veil','rare','appearance'),
('eclipse','Solar eclipse','rare','appearance'),
('halo-runes','Rune pendant','rare','halo'),
('trail-comet','Comet wake','rare','trail'),
('indigo','Deep cosmos','rare','appearance'),
('singularity','Living singularity','mythic','appearance'),
('cultivation','Celestial bloom','mythic','appearance'),
('look-01','Dawn peach','common','appearance'),
('look-02','Pearl cloud','common','appearance'),
('look-03','Blue hour','common','appearance'),
('look-04','Honey glow','common','appearance'),
('look-05','Sage whisper','common','appearance'),
('look-06','Lavender milk','common','appearance'),
('look-07','Rose quartz','rare','appearance'),
('look-08','Polar opal','rare','appearance'),
('look-09','Velvet dusk','rare','appearance'),
('look-10','Aurora silk','rare','appearance'),
('look-11','Lunar prism','mythic','appearance'),
('look-12','Nebula dream','mythic','appearance'),
('halo-01','Petal bow','common','halo'),
('halo-02','Bell ribbon','common','halo'),
('halo-03','Moon pin','common','halo'),
('halo-04','Cloud collar','common','halo'),
('halo-05','Tiny satchel','common','halo'),
('halo-06','Comet badge','common','halo'),
('halo-07','Stargazer cape','rare','halo'),
('halo-08','Tide crown','rare','halo'),
('halo-09','Lantern pendant','rare','halo'),
('halo-10','Astral compass','rare','halo'),
('halo-11','Phoenix charm','mythic','halo'),
('halo-12','Moonkeeper wings','mythic','halo'),
('habitat-01','Pebble pool','common','habitat'),
('habitat-02','Dew garden','common','habitat'),
('habitat-03','Moon cushion','common','habitat'),
('habitat-04','Paper lantern','common','habitat'),
('habitat-05','Reed shore','common','habitat'),
('habitat-06','Cloud shelf','common','habitat'),
('habitat-07','Crystal grotto','rare','habitat'),
('habitat-08','Star hammock','rare','habitat'),
('habitat-09','Floating shrine','rare','habitat'),
('habitat-10','Aurora pond','rare','habitat'),
('habitat-11','Celestial garden','mythic','habitat'),
('habitat-12','Infinity tide','mythic','habitat')
on conflict(id) do update set name=excluded.name,rarity=excluded.rarity,slot=excluded.slot;
commit;
