-- A stable request key prevents retries from extending a suspension or
-- emitting duplicate audit and notification events.
create table public.community_chat_decision_requests (
  id uuid primary key,
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null,
  duration_hours integer,
  reason text not null,
  created_at timestamptz not null default now()
);
create index community_chat_decision_requests_community_idx
  on public.community_chat_decision_requests(community_id,user_id);
create index community_chat_decision_requests_user_idx
  on public.community_chat_decision_requests(user_id);
create index community_chat_decision_requests_actor_idx
  on public.community_chat_decision_requests(actor_id) where actor_id is not null;
alter table public.community_chat_decision_requests enable row level security;
revoke all on public.community_chat_decision_requests from anon,authenticated;
grant all on public.community_chat_decision_requests to service_role;

create or replace function public.set_community_chat_restriction(
  target_community uuid,target_user uuid,restriction_kind text,
  duration_hours integer,decision_reason text,decision_request_id uuid
) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); prior public.community_chat_decision_requests%rowtype;
  clean_reason text:=btrim(coalesce(decision_reason,''));
begin
  if actor is null or decision_request_id is null
    or not community_private.can_manage_profile(target_community,'moderation') then
    raise exception 'restriction_forbidden' using errcode='42501';
  end if;
  insert into public.community_chat_decision_requests
    (id,community_id,user_id,actor_id,kind,duration_hours,reason)
  values (decision_request_id,target_community,target_user,actor,restriction_kind,
    duration_hours,clean_reason)
  on conflict (id) do nothing;
  if not found then
    select * into prior from public.community_chat_decision_requests
      where id=decision_request_id;
    if prior.community_id=target_community and prior.user_id=target_user
      and prior.actor_id=actor and prior.kind=restriction_kind
      and prior.duration_hours is not distinct from duration_hours
      and prior.reason=clean_reason then
      return;
    end if;
    raise exception 'restriction_request_conflict' using errcode='23505';
  end if;
  perform public.set_community_chat_restriction(
    target_community,target_user,restriction_kind,duration_hours,clean_reason);
end;
$$;
revoke all on function public.set_community_chat_restriction(
  uuid,uuid,text,integer,text,uuid) from public,anon;
grant execute on function public.set_community_chat_restriction(
  uuid,uuid,text,integer,text,uuid) to authenticated;
