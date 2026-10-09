-- Inert R2 keys only. No remote calls; every fixture rolls back.
begin;
do $$
declare
  owner_id uuid;
  org uuid := gen_random_uuid();
  stale_id uuid := gen_random_uuid();
  fresh_id uuid := gen_random_uuid();
  final_id uuid := gen_random_uuid();
  stale_key text;
  fresh_key text;
  final_key text;
  queued integer;
begin
  select p.id into owner_id from public.profiles p join auth.users u on u.id = p.id order by p.id limit 1;
  if owner_id is null then raise exception 'Test needs an existing profile'; end if;
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(org,owner_id,'Abandoned document test','abandoned-documents-' || org,'PRIVATE');
  stale_key := owner_id || '/communities/' || org || '/' || stale_id || '.pdf';
  fresh_key := owner_id || '/communities/' || org || '/' || fresh_id || '.pdf';
  final_key := owner_id || '/communities/' || org || '/' || final_id || '.pdf';

  set local role anon;
  begin
    perform public.prepare_community_document_upload(org,owner_id,stale_id,stale_key,'application/pdf',1024,'stale.pdf');
    raise exception 'Anonymous prepared an upload';
  exception when insufficient_privilege then null; end;
  begin
    perform public.queue_abandoned_community_documents(1);
    raise exception 'Anonymous queued private files';
  exception when insufficient_privilege then null; end;
  reset role;

  set local role service_role;
  if not public.prepare_community_document_upload(org,owner_id,stale_id,stale_key,'application/pdf',1024,'stale.pdf')
    or not public.prepare_community_document_upload(org,owner_id,fresh_id,fresh_key,'application/pdf',1024,'fresh.pdf')
    or not public.prepare_community_document_upload(org,owner_id,final_id,final_key,'application/pdf',1024,'final.pdf')
    then raise exception 'Valid upload receipts were rejected'; end if;
  if public.prepare_community_document_upload(org,owner_id,stale_id,stale_key,'application/pdf',999,'stale.pdf') then
    raise exception 'An upload ID was reused with different byte size'; end if;
  update public.community_document_uploads set last_signed_at = '2000-01-01'
    where id in (stale_id, fresh_id, final_id);
  if not public.prepare_community_document_upload(org,owner_id,fresh_id,fresh_key,'application/pdf',1024,'fresh.pdf') then
    raise exception 'Re-signing the same upload failed'; end if;
  perform public.finalize_community_asset(org,owner_id,final_id,'document',final_key,
    'final.pdf','application/pdf','Final',1024);
  if not exists (select 1 from public.community_document_uploads
    where id = final_id and finalized_at is not null) then
    raise exception 'Finalization was not durably stamped'; end if;

  queued := public.queue_abandoned_community_documents(20);
  if queued <> 1 or not exists (select 1 from public.community_document_uploads
    where id = stale_id and retired_at is not null)
    or not exists (select 1 from public.community_asset_deletions
      where kind = 'document' and media_id = stale_key) then
    raise exception 'The stale receipt was not retired atomically'; end if;
  if exists (select 1 from public.community_asset_deletions
    where kind = 'document' and media_id in (fresh_key, final_key)) then
    raise exception 'Fresh or finalized document was retired'; end if;
  if public.prepare_community_document_upload(org,owner_id,stale_id,stale_key,'application/pdf',1024,'stale.pdf') then
    raise exception 'Retired key was signed again'; end if;

  delete from public.community_document_uploads where id = fresh_id;
  if not exists (select 1 from public.community_asset_deletions
    where kind = 'document' and media_id = fresh_key and available_at > clock_timestamp() + interval '9 minutes') then
    raise exception 'Cascade cleanup did not wait for the signed PUT to expire'; end if;
  reset role;
end;
$$;
rollback;
