-- Provider acceptance and the beginning of the defense window commit together.
-- An uncertain delivery older than Resend's 24-hour idempotency window halts
-- for manual reconciliation instead of risking a duplicate late notice.
alter table community_private.community_chat_case_mail
  add column halted_at timestamptz;
drop index community_private.community_chat_case_mail_ready_idx;
create index community_chat_case_mail_ready_idx
  on community_private.community_chat_case_mail(available_at,case_id)
  where delivered_at is null and halted_at is null;

create or replace function public.claim_community_chat_case_mail(batch_size integer default 3)
returns jsonb language sql security invoker set search_path='' as $$
  with ready as (
    select m.case_id from community_private.community_chat_case_mail m
    join public.community_chat_cases c on c.id=m.case_id
    where m.delivered_at is null and m.halted_at is null
      and m.available_at<=clock_timestamp() and c.status='pending_notice'
    order by m.available_at,m.case_id
    limit greatest(1,least(coalesce(batch_size,3),5))
    for update of m skip locked
  ), claimed as (
    update community_private.community_chat_case_mail m set
      lease_token=gen_random_uuid(),available_at=clock_timestamp()+interval '5 minutes',
      attempts=least(m.attempts,2147483646)+1,
      first_attempt_at=coalesce(m.first_attempt_at,clock_timestamp())
    from ready where m.case_id=ready.case_id returning m.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'case_id',m.case_id,'recipient_email',m.recipient_email,
    'reason',c.reason,'lease_token',m.lease_token,
    'first_attempt_at',m.first_attempt_at)), '[]'::jsonb)
  from claimed m join public.community_chat_cases c on c.id=m.case_id;
$$;
revoke all on function public.claim_community_chat_case_mail(integer)
  from public,anon,authenticated;
grant execute on function public.claim_community_chat_case_mail(integer) to service_role;

create or replace function public.finish_community_chat_case_mail(
  target_case uuid,claimed_lease uuid,succeeded boolean,failure_code text default null
) returns boolean language plpgsql security invoker set search_path='' as $$
declare first_attempt timestamptz; sent_at timestamptz; affected integer;
begin
  select first_attempt_at into first_attempt
    from community_private.community_chat_case_mail
    where case_id=target_case and lease_token=claimed_lease
      and delivered_at is null and halted_at is null for update;
  if not found then return false; end if;
  if succeeded then
    sent_at:=clock_timestamp();
    update public.community_chat_cases set
      status='open',notified_at=sent_at,
      defense_deadline=sent_at+interval '48 hours'
      where id=target_case and status='pending_notice';
    get diagnostics affected=row_count;
    if affected<>1 then raise exception 'case_notice_stale' using errcode='P0002'; end if;
    update community_private.community_chat_case_mail set
      delivered_at=sent_at,lease_token=null,last_error=null
      where case_id=target_case;
  else
    update community_private.community_chat_case_mail set
      lease_token=null,
      available_at=clock_timestamp()+make_interval(secs=>
        least(3600,30*power(2,least(attempts,7)))::integer),
      halted_at=case when first_attempt<clock_timestamp()-interval '23 hours'
        or failure_code='permanent_failure' then clock_timestamp() else null end,
      last_error=left(coalesce(failure_code,'mail_failed'),100)
      where case_id=target_case;
  end if;
  return true;
end;
$$;
revoke all on function public.finish_community_chat_case_mail(uuid,uuid,boolean,text)
  from public,anon,authenticated;
grant execute on function public.finish_community_chat_case_mail(uuid,uuid,boolean,text)
  to service_role;
