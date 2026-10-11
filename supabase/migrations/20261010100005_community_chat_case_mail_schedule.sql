-- Reuse the protected dispatcher destination and bearer secret for this
-- internal route. The job remains inactive until deployment is configured.
create function community_private.dispatch_chat_case_mail()
returns bigint language plpgsql security invoker set search_path='' as $$
declare endpoint text; secret text;
begin
  if not exists (select 1 from community_private.community_chat_case_mail m
    join public.community_chat_cases c on c.id=m.case_id
    where m.delivered_at is null and m.halted_at is null
      and m.available_at<=clock_timestamp() and c.status='pending_notice') then
    return null;
  end if;
  select decrypted_secret into endpoint from vault.decrypted_secrets
    where name='community_cleanup_url';
  select decrypted_secret into secret from vault.decrypted_secrets
    where name='community_cleanup_secret';
  if endpoint is null or endpoint !~ '^https://[^/?#]+/api/internal/community-asset-cleanup$'
    or secret is null or length(secret)<32 then
    raise exception 'Community case mail scheduler is not configured';
  end if;
  endpoint:=replace(endpoint,'/community-asset-cleanup','/community-chat-case-mail');
  return net.http_post(url:=endpoint,
    headers:=jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer '||secret),
    body:='{}'::jsonb,timeout_milliseconds:=60000);
end;
$$;
revoke all on function community_private.dispatch_chat_case_mail()
  from public,anon,authenticated,service_role;

do $$
declare job_id bigint;
begin
  if not exists(select 1 from cron.job where jobname='community-chat-case-mail') then
    select cron.schedule('community-chat-case-mail','*/5 * * * *',
      'select community_private.dispatch_chat_case_mail();') into job_id;
    perform cron.alter_job(job_id,active:=false);
  end if;
end;
$$;
