-- Identity-only rollback fixtures; no Cloudflare media is uploaded or deleted.
begin;
do $$
declare users uuid[]; org uuid:=gen_random_uuid(); owner_id uuid; stranger_id uuid; affected int; rev int;
begin
  select array_agg(id) into users from (select p.id from public.profiles p join auth.users u on u.id=p.id order by p.id limit 2) x;
  if cardinality(users)<2 then raise exception 'Two profiles required'; end if;
  owner_id:=users[1]; stranger_id:=users[2];
  insert into public.community_header_image_receipts(image_id,uploaded_by) values
    ('11111111-1111-4111-8111-111111111111',owner_id),
    ('22222222-2222-4222-8222-222222222222',owner_id),
    ('header-test-aaaaaaaaaaaaaaaa',stranger_id),
    ('header-test-bbbbbbbbbbbbbbbb',stranger_id);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  insert into public.communities(id,owner_id,name,slug,privacy,cover_image)
    values(org,owner_id,'Framing rollback','framing-rollback-'||org,'PRIVATE','11111111-1111-4111-8111-111111111111');
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  if (select header_image_version from public.communities where id=org)<>1 then raise exception 'Bad default version'; end if;
  begin
    insert into public.communities(id,owner_id,name,slug,privacy,cover_image)
      values(gen_random_uuid(),owner_id,'Unverified cover','unverified-cover-'||org,
        'PUBLIC','header-test-unverifiedimage');
    raise exception 'Direct creation accepted an unverified cover';
  exception when insufficient_privilege then null; end;
  update public.communities set cover_framing='{"x":20,"y":80,"zoom":2}' where id=org and header_image_version=1;
  if (select header_image_version from public.communities where id=org)<>2 then raise exception 'Missing version increment'; end if;
  if (select cover_framing from public.communities where id=org)<>'{"x":20,"y":80,"zoom":2}'::jsonb then raise exception 'Framing not stored'; end if;
  begin
    update public.communities set cover_image='header-test-unverifiedimage' where id=org;
    raise exception 'Unverified direct cover assignment succeeded';
  exception when insufficient_privilege then null; end;
  if (select cover_image from public.communities where id=org)<>'11111111-1111-4111-8111-111111111111' then
    raise exception 'Rejected cover assignment changed the image';
  end if;
  update public.communities set cover_framing='{"x":0,"y":0,"zoom":1}' where id=org and header_image_version=1;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Stale version overwrote framing'; end if;
  update public.communities set cover_framing='{"x":20,"y":80,"zoom":2}',header_image_version=99 where id=org;
  if (select header_image_version from public.communities where id=org)<>2 then raise exception 'Noop or version spoof accepted'; end if;
  begin
    update public.communities set cover_framing='{"x":101,"y":50,"zoom":1}' where id=org;
    raise exception 'Invalid position accepted';
  exception when check_violation then null; end;
  begin
    update public.communities set cover_framing='{"x":50,"y":50,"zoom":0.5}' where id=org;
    raise exception 'Invalid zoom accepted';
  exception when check_violation then null; end;
  begin
    update public.communities set cover_framing='{}' where id=org;
    raise exception 'Missing fields accepted';
  exception when check_violation then null; end;
  begin
    update public.communities set cover_framing='{"x":50,"y":50,"zoom":1,"other":1}' where id=org;
    raise exception 'Extra field accepted';
  exception when check_violation then null; end;
  update public.communities set profile_image='22222222-2222-4222-8222-222222222222',profile_framing='{"x":10,"y":90,"zoom":3}' where id=org and header_image_version=2;
  if (select header_image_version from public.communities where id=org)<>3 then raise exception 'Profile snapshot failed'; end if;
  perform set_config('request.jwt.claim.sub',stranger_id::text,true);
  if exists(select 1 from public.communities where id=org) then raise exception 'Private image leaked'; end if;
  update public.communities set cover_image=null where id=org;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Stranger wrote'; end if;
  reset role;
  insert into public.community_members(community_id,user_id,role,status) values(org,stranger_id,'ADMIN','active');
  set local role authenticated;
  update public.communities set cover_image=null where id=org;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Non-owner bypassed owner gate'; end if;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  update public.communities set cover_image=null where id=org and header_image_version=3;
  if (select cover_framing from public.communities where id=org)<>'{"x":50,"y":50,"zoom":1}'::jsonb then raise exception 'Removal retained stale framing'; end if;
  if (select profile_image from public.communities where id=org) is null then raise exception 'Removal affected other slot'; end if;
  reset role;
  if (select count(*) from public.community_profile_revisions where community_id=org and entity_table='community_header_images')<>3 then raise exception 'Audit count mismatch'; end if;
  if exists(select 1 from public.community_profile_revisions where community_id=org and actor_id is distinct from owner_id) then raise exception 'Wrong audit actor'; end if;
  if has_function_privilege('anon','public.save_community_header_image(uuid,uuid,text,text,jsonb,integer)','EXECUTE')
    or has_function_privilege('authenticated','public.save_community_header_image(uuid,uuid,text,text,jsonb,integer)','EXECUTE')
  then raise exception 'Client can call privileged header RPC'; end if;
  if has_table_privilege('authenticated','public.community_header_image_receipts','INSERT')
    or has_table_privilege('authenticated','public.community_header_image_receipts','SELECT') then
    raise exception 'Clients can forge image receipts';
  end if;
  rev:=(select header_image_version from public.communities where id=org);
  set local role service_role;
  begin
    perform public.save_community_header_image(org,stranger_id,'cover','header-test-aaaaaaaaaaaaaaaa',
      '{"x":50,"y":50,"zoom":1}',rev);
    raise exception 'Ungranted member changed identity image';
  exception when insufficient_privilege then null; end;
  reset role;
  insert into public.community_profile_roles(community_id,user_id,role)
    values(org,stranger_id,'admin');
  set local role service_role;
  if public.save_community_header_image(org,stranger_id,'cover','header-test-aaaaaaaaaaaaaaaa',
      '{"x":50,"y":50,"zoom":1}',rev)<>rev+1 then raise exception 'Admin save failed'; end if;
  if public.save_community_header_image(org,stranger_id,'cover','header-test-aaaaaaaaaaaaaaaa',
      '{"x":50,"y":50,"zoom":1}',rev)<>rev+1 then raise exception 'Admin retry failed'; end if;
  reset role;
  insert into public.community_asset_deletions(kind,media_id)
    values('image','header-test-bbbbbbbbbbbbbbbb');
  set local role service_role;
  begin
    perform public.save_community_header_image(org,stranger_id,'cover','header-test-bbbbbbbbbbbbbbbb',
      '{"x":50,"y":50,"zoom":1}',rev+1);
    raise exception 'Retired image became a new header';
  exception when check_violation then null; end;
  if (select cover_image from public.communities where id=org)<>'header-test-aaaaaaaaaaaaaaaa' then
    raise exception 'Rejected header replacement changed the stored image';
  end if;
  begin
    perform public.save_community_header_image(org,stranger_id,'cover','header-test-aaaaaaaaaaaaaaaa',
      '{"x":60,"y":50,"zoom":1}',rev);
    raise exception 'Stale admin edit succeeded';
  exception when sqlstate '40001' then null; end;
  reset role;
  if (select count(*) from public.community_profile_revisions where community_id=org and entity_table='community_header_images')<>4
    or not exists(select 1 from public.community_profile_revisions where community_id=org
      and entity_table='community_header_images' and actor_id=stranger_id)
  then raise exception 'Admin audit/retry mismatch'; end if;
  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if exists(select 1 from public.communities where id=org) then raise exception 'Anonymous private read'; end if;
  update public.communities set cover_image=null where id=org;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Anonymous write'; end if;
  reset role;
end;
$$;
rollback;
