/* PostgreSQL in memory only. Cryptography/realtime are stubbed, not certified here. */
const fs=require('fs'),assert=require('assert'),{PGlite}=require('@electric-sql/pglite');
(async()=>{const db=new PGlite();await db.exec(`
create role anon;create role authenticated;
create schema auth;create schema extensions;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function extensions.gen_random_bytes(n int) returns bytea language sql as $$select decode(repeat(md5(random()::text),greatest(1,n/16)),'hex')$$;
create function extensions.digest(s text,algorithm text) returns bytea language sql immutable as $$select decode(md5(s),'hex')$$;
grant usage on schema public,auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
insert into auth.users values('11111111-1111-4111-a111-111111111111','owner@test.invalid'),('22222222-2222-4222-a222-222222222222','other@test.invalid');`);
for(const name of fs.readdirSync('supabase/migrations').sort()){
 let sql=fs.readFileSync('supabase/migrations/'+name,'utf8').replace(/create extension if not exists pgcrypto with schema extensions;/,'');
 sql=sql.replace(/do \$\$ begin\s*if not exists\(select 1 from pg_publication_tables[\s\S]*?end \$\$;/g,'');await db.exec(sql);
}
await db.exec(`insert into public.orbiter_beta_members values('11111111-1111-4111-a111-111111111111');set role authenticated;set request.jwt.claim.sub='11111111-1111-4111-a111-111111111111';`);
const call=async(name,args=[])=>{if(name==='orbiter_write'&&typeof args[3]==='string')args[3]=JSON.stringify(args[3]);const rows=await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args);return rows.rows[0].result;};
await db.exec('reset role'); // Validate the private helper as this disposable database's owner.
for(const scene of ['tidal-night','lunar-mist','opal-dawn'])assert.equal(await call('orbiter_validate_record',[JSON.stringify(['preference','scenePreset']),JSON.stringify(scene)]),true);
assert.equal(await call('orbiter_validate_record',[JSON.stringify(['preference','scenePreset']),JSON.stringify('unknown')]),false);
for(const strength of [0,50,100])assert.equal(await call('orbiter_validate_record',[JSON.stringify(['preference','atmosphereStrength']),JSON.stringify(strength)]),true);
for(const strength of [-1,101,0.5])assert.equal(await call('orbiter_validate_record',[JSON.stringify(['preference','atmosphereStrength']),JSON.stringify(strength)]),false);
for(const strength of [0,70,100])assert.equal(await call('orbiter_validate_record',[JSON.stringify(['preference','motionIntensity']),JSON.stringify(strength)]),true);
for(const strength of [-1,101,0.5])assert.equal(await call('orbiter_validate_record',[JSON.stringify(['preference','motionIntensity']),JSON.stringify(strength)]),false);
for(const quality of ['auto','low','high'])assert.equal(await call('orbiter_validate_record',[JSON.stringify(['preference','effectQuality']),JSON.stringify(quality)]),true);
assert.equal(await call('orbiter_validate_record',[JSON.stringify(['preference','effectQuality']),JSON.stringify('ultra')]),false);
await db.exec('set role authenticated');
const k=JSON.stringify(['preference','name']),op='33333333-3333-4333-a333-333333333333';
const first=await call('orbiter_write',[op,k,0,'First']);assert.equal(first.version,1);
assert.deepEqual(await call('orbiter_write',[op,k,0,'First']),first);
await assert.rejects(call('orbiter_write',[op,k,0,'Different']));
assert.equal((await call('orbiter_write',['44444444-4444-4444-a444-444444444444',k,0,'Stale'])).conflict,true);
assert.equal(Object.keys(await call('orbiter_pull')).length,1);
await assert.rejects(db.query('update public.orbiter_records set version=100'));
await db.exec(`set request.jwt.claim.sub='22222222-2222-4222-a222-222222222222'`);
await assert.rejects(call('orbiter_pull'));assert.equal((await db.query('select * from public.orbiter_records')).rows.length,0);
await db.exec(`set request.jwt.claim.sub='11111111-1111-4111-a111-111111111111'`);
const device=await call('orbiter_device');const progress=await call('orbiter_bootstrap',[device.id,device.secret,0,0,['mint','halo-thin','trail-waves']]);assert.equal(progress.xp,0);
const now=Date.now();let r=await call('orbiter_focus',[device.id,device.secret,'focus-one',now-120000,now-60000,'42']);assert.equal(r.xp,1);
r=await call('orbiter_focus',[device.id,device.secret,'focus-one',now-120000,now-60000,'42']);assert.equal(r.xp,1);
r=await call('orbiter_focus',[device.id,device.secret,'focus-two',now-90000,now-30000,'42']);assert.equal(r.focusedMs,90000);assert.equal(r.courseMs['42'],90000);
await assert.rejects(call('orbiter_focus',[device.id,'wrong','invalid',now-60000,now,null]));
await assert.rejects(call('orbiter_open_crate',['55555555-5555-4555-a555-555555555555']));
await db.exec(`reset role;update public.orbiter_progress set focused_ms=90000000;set role authenticated;`);
const ids=[];for(let i=0;i<49;i++){const uuid=`66666666-6666-4666-a666-${String(i).padStart(12,'0')}`;const result=await call('orbiter_open_crate',[uuid]);if(i===0)assert.deepEqual(await call('orbiter_open_crate',[uuid]),result);if(result.reward.id)ids.push(result.reward.id);}
assert.equal(ids.length,48);assert.equal(new Set(ids).size,48);r=await call('orbiter_rewards');assert.equal(r.owned.length,51);assert.equal(r.stars,1);
await assert.rejects(call('orbiter_equip',['halo','not-owned']));
const owned=ids.find(v=>v.startsWith('halo-'));r=await call('orbiter_equip',['halo',owned]);assert.equal(r.equipment.halo,owned);
await db.close();console.log('Cloud PostgreSQL: membership/RLS, stale writes, idempotency, overlapping focus, ownership and crate recovery passed.');
})().catch(e=>{console.error(e);process.exit(1);});
