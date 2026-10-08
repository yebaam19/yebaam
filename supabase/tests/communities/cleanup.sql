-- Inert identifiers only. No HTTP or remote deletions. All fixtures roll back.
begin;
do $$
declare
  remote_id uuid := gen_random_uuid();
  owner_id uuid;
  org uuid := gen_random_uuid();
  job bigint;
  first_claim jsonb;
  second_claim jsonb;
  acknowledged boolean;
begin
  if exists(select 1 from public.community_asset_deletions where completed_at is null) then
    raise exception 'Run queue fixture test only when the pending queue is empty';
  end if;
  select p.id into owner_id from public.profiles p join auth.users u on u.id=p.id order by p.id limit 1;
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(org,owner_id,'Cleanup test','cleanup-test-' || org,'PRIVATE');
  insert into public.community_asset_deletions(kind,media_id,available_at)
    values('image',remote_id::text,'2000-01-01') returning id into job;
  set local role anon;
  begin
    perform public.claim_community_asset_deletions(1);
    raise exception 'Anonymous claimed privileged jobs';
  exception when insufficient_privilege then null; end;
  reset role;
  set local role authenticated;
  begin
    perform public.finish_community_asset_deletion(job,gen_random_uuid(),true);
    raise exception 'Authenticated user acknowledged jobs';
  exception when insufficient_privilege then null; end;
  reset role;
  set local role service_role;
  first_claim := public.claim_community_asset_deletions(1)->0;
  if (first_claim->>'id')::bigint <> job or (first_claim->>'attempts')::integer <> 1 then
    raise exception 'Claim did not return expected lease and attempt';
  end if;
  if jsonb_array_length(public.claim_community_asset_deletions(1)) <> 0 then
    raise exception 'Active lease claimed twice';
  end if;
  if public.finish_community_asset_deletion(job,gen_random_uuid(),true) then
    raise exception 'Wrong lease acknowledged';
  end if;
  -- Simulate worker termination, then another worker reclaiming the job.
  update public.community_asset_deletions set available_at='2000-01-01' where id=job;
  second_claim := public.claim_community_asset_deletions(1)->0;
  if second_claim->>'lease_token' = first_claim->>'lease_token' then raise exception 'Lease was reused'; end if;
  if public.finish_community_asset_deletion(job,(first_claim->>'lease_token')::uuid,true) then
    raise exception 'Stale worker acknowledged new lease';
  end if;
  acknowledged := public.finish_community_asset_deletion(job,(second_claim->>'lease_token')::uuid,false,'provider_failed');
  if not acknowledged or not exists(select 1 from public.community_asset_deletions
    where id=job and completed_at is null and available_at>now() and attempts=2 and last_error='provider_failed') then
    raise exception 'Failure did not preserve job with backoff';
  end if;
  update public.community_asset_deletions set available_at='2000-01-01' where id=job;
  second_claim := public.claim_community_asset_deletions(1)->0;
  perform public.finish_community_asset_deletion(job,(second_claim->>'lease_token')::uuid,true);
  if not exists(select 1 from public.community_asset_deletions where id=job and completed_at is not null and last_error is null) then
    raise exception 'Completed tombstone was lost';
  end if;
  if jsonb_array_length(public.claim_community_asset_deletions(1)) <> 0 then raise exception 'Completed job reclaimed'; end if;
  begin
    perform public.finalize_community_asset(org,owner_id,gen_random_uuid(),'image',remote_id::text,'a.png','image/png','Retired');
    raise exception 'Delayed finalization resurrected deleted remote object';
  exception when check_violation then null; end;
  begin
    insert into public.community_library_assets(id,community_id,kind,title,media_id,original_name,content_type)
      values(gen_random_uuid(),org,'image','Retired',remote_id::text,'a.png','image/png');
    raise exception 'Direct privileged insert bypassed tombstone';
  exception when check_violation then null; end;
  reset role;
end;
$$;
rollback;
