begin;
do $$
declare users uuid[]; owner_id uuid; editor_id uuid; asker_id uuid;
  org uuid:=gen_random_uuid(); other_org uuid:=gen_random_uuid(); cat uuid:=gen_random_uuid(); qid uuid:=gen_random_uuid(); aid uuid:=gen_random_uuid();
  result jsonb; v int; av int; original_count int;
begin
  select array_agg(id) into users from (select p.id from public.profiles p join auth.users u on u.id=p.id order by p.id limit 3) x;
  if cardinality(users)<3 then raise exception 'Three profiles required'; end if;
  owner_id:=users[1]; editor_id:=users[2]; asker_id:=users[3];
  -- Roll back existing relations too, so fixtures do not depend on real block edges.
  delete from public.friendships where requester_id=any(users) and recipient_id=any(users);
  insert into public.communities(id,owner_id,name,slug,privacy) values
    (org,owner_id,'Q&A rollback','qa-rollback-'||org,'PUBLIC'),
    (other_org,owner_id,'Private Q&A','qa-rollback-'||other_org,'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status) values(org,editor_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role) values(org,editor_id,'editor');
  perform set_config('request.jwt.claim.sub',editor_id::text,true); set local role authenticated;
  result:=public.save_community_question_category(org,cat,0,'Orientación',0,false);
  if (result->>'version')::int<>1 then raise exception 'Category version failed'; end if;
  perform set_config('request.jwt.claim.sub',asker_id::text,true);
  if exists(select 1 from public.community_question_categories where id=cat) then raise exception 'Private category leaked'; end if;
  begin
    perform public.save_community_question(org,qid,0,'Pregunta','Texto',cat,false);
    raise exception 'Private category selectable';
  exception when check_violation then null; end;
  result:=public.save_community_question(org,qid,0,'¿Cómo participar?','Busco información de inscripción',null,false);
  if (select is_published from public.community_questions where id=qid) then raise exception 'Question public by default'; end if;
  perform public.save_community_question(org,qid,0,'¿Cómo participar?','Busco información de inscripción',null,false);
  if (select version from public.community_questions where id=qid)<>1 then raise exception 'Retry rewrote question'; end if;
  begin
    perform public.save_community_question(other_org,gen_random_uuid(),0,'Intrusión','Texto',null,true);
    raise exception 'Private community question accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.community_questions(id,community_id,author_id,title,body,is_faq) values(gen_random_uuid(),org,owner_id,'Spoof','Spoof',true);
    raise exception 'Direct forged question allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_community_question_answer(org,qid,aid,0,'Fake official',true);
    raise exception 'Ordinary user answered officially';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub','',true); set local role anon;
  if exists(select 1 from public.community_questions where id=qid) then raise exception 'Private question leaked'; end if;
  begin
    perform public.save_community_question(org,gen_random_uuid(),0,'Anonymous','Text',null,true);
    raise exception 'Anonymous write allowed';
  exception when insufficient_privilege then null; end;
  set local role authenticated; perform set_config('request.jwt.claim.sub',editor_id::text,true);
  if not exists(select 1 from public.community_questions where id=qid) then raise exception 'Representative cannot read private correspondence'; end if;
  begin
    perform public.save_community_question_answer(other_org,qid,gen_random_uuid(),0,'Wrong community',true);
    raise exception 'Cross-community answer allowed';
  exception when insufficient_privilege or check_violation then null; end;
  result:=public.save_community_question_answer(org,qid,aid,0,'Respuesta de la organización',false);
  perform public.save_community_question_answer(org,qid,aid,0,'Respuesta de la organización',false);
  if (select version from public.community_question_answers where id=aid)<>1 then raise exception 'Answer retry rewrote'; end if;
  perform set_config('request.jwt.claim.sub',asker_id::text,true);
  if exists(select 1 from public.community_question_answers where id=aid) then raise exception 'Answer draft leaked'; end if;
  result:=public.save_community_question(org,qid,1,'¿Cómo participar?','Busco información de inscripción',null,true);
  begin
    perform public.save_community_question(org,qid,1,'Stale','Stale',null,true);
    raise exception 'Stale question overwritten';
  exception when serialization_failure then null; end;
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  begin
    perform public.change_community_question(org,qid,2,'faq'); raise exception 'FAQ without official answer accepted';
  exception when check_violation then null; end;
  result:=public.save_community_question_answer(org,qid,aid,1,'Respuesta de la organización',true);
  result:=public.change_community_question(org,qid,2,'faq');
  if not (select is_faq from public.community_questions where id=qid) then raise exception 'FAQ did not update'; end if;
  begin
    perform public.save_community_question(org,qid,3,'Changed by staff','Text',null,true);
    raise exception 'Staff changed user question';
  exception when insufficient_privilege then null; end;
  begin
    perform public.change_community_question(org,qid,3,'hide','Reason',null,true);
    raise exception 'Editor moderated without delegation';
  exception when insufficient_privilege then null; end;
  set local role anon; perform set_config('request.jwt.claim.sub','',true);
  if not exists(select 1 from public.community_questions where id=qid and search_vector @@ websearch_to_tsquery('spanish','inscripción')) then raise exception 'Published question not searchable'; end if;
  if not exists(select 1 from public.community_question_answers where id=aid) then raise exception 'Official answer not readable'; end if;
  reset role;
  insert into public.friendships(requester_id,recipient_id,status) values(asker_id,editor_id,'blocked');
  set local role authenticated; perform set_config('request.jwt.claim.sub',asker_id::text,true);
  if exists(select 1 from public.community_question_answers where id=aid) then raise exception 'Blocked author answer leaked'; end if;
  reset role;
  delete from public.community_profile_roles where community_id=org and user_id=editor_id;
  set local role authenticated; perform set_config('request.jwt.claim.sub',editor_id::text,true);
  if exists(select 1 from public.community_questions where id=qid) then raise exception 'Blocked question author leaked to ordinary reader'; end if;
  if exists(select 1 from public.community_question_answers where id=aid) then raise exception 'Answer exposed through blocked parent'; end if;
  reset role;
  insert into public.community_profile_roles(community_id,user_id,role) values(org,editor_id,'editor');
  perform set_config('request.jwt.claim.sub',asker_id::text,true);
  reset role; delete from public.friendships where requester_id=asker_id and recipient_id=editor_id;
  insert into public.community_members(community_id,user_id,role,status) values(org,asker_id,'MEMBER','banned');
  set local role authenticated;
  if exists(select 1 from public.community_questions where id=qid) then raise exception 'Banned author reads questions'; end if;
  begin
    perform public.save_community_question(org,gen_random_uuid(),0,'Banned','Text',null,true);
    raise exception 'Banned user asked';
  exception when insufficient_privilege then null; end;
  reset role; delete from public.community_members where community_id=org and user_id=asker_id;
  perform set_config('request.jwt.claim.sub',owner_id::text,true); set local role authenticated;
  select version into v from public.community_questions where id=qid;
  begin
    perform public.change_community_question(org,qid,v,'hide','',null,true); raise exception 'Reasonless hide';
  exception when check_violation then null; end;
  begin
    perform public.change_community_question(org,qid,v,'hide','Phishing'); raise exception 'Unconfirmed hide';
  exception when check_violation then null; end;
  result:=public.change_community_question(org,qid,v,'close'); v:=(result->>'version')::int;
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  begin
    perform public.save_community_question_answer(org,qid,gen_random_uuid(),0,'Closed',true); raise exception 'Closed answered';
  exception when check_violation then null; end;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  result:=public.change_community_question(org,qid,v,'reopen'); v:=(result->>'version')::int;
  result:=public.change_community_question_answer(org,qid,aid,2,'hide','Phishing',true);
  if (select is_faq from public.community_questions where id=qid) then raise exception 'FAQ retained without visible answer'; end if;
  av:=(result->>'version')::int;
  set local role anon; perform set_config('request.jwt.claim.sub','',true);
  if exists(select 1 from public.community_question_answers where id=aid) then raise exception 'Moderated answer leaked'; end if;
  set local role authenticated; perform set_config('request.jwt.claim.sub',owner_id::text,true);
  perform public.change_community_question_answer(org,qid,aid,av,'restore');
  select version into v from public.community_questions where id=qid;
  result:=public.change_community_question(org,qid,v,'hide','Phishing',null,true); v:=(result->>'version')::int;
  set local role anon; perform set_config('request.jwt.claim.sub','',true);
  if exists(select 1 from public.community_questions where id=qid) or exists(select 1 from public.community_question_answers where id=aid) then raise exception 'Hidden thread leaked'; end if;
  set local role authenticated; perform set_config('request.jwt.claim.sub',owner_id::text,true);
  result:=public.change_community_question(org,qid,v,'restore'); v:=(result->>'version')::int;
  result:=public.save_community_question_category(org,cat,1,'Orientación',0,true);
  result:=public.change_community_question(org,qid,v,'categorize','',cat); v:=(result->>'version')::int;
  begin
    perform public.save_community_question_category(org,cat,2,'Orientación',0,true,true); raise exception 'Nonempty category removed';
  exception when foreign_key_violation then null; end;
  perform public.save_community_question_category(org,cat,2,'Orientación',0,false);
  set local role anon; perform set_config('request.jwt.claim.sub','',true);
  if exists(select 1 from public.community_questions where id=qid) then raise exception 'Hidden category leaked question'; end if;
  reset role; update public.community_profile_roles set role='moderator' where community_id=org and user_id=editor_id;
  set local role authenticated; perform set_config('request.jwt.claim.sub',editor_id::text,true);
  begin
    perform public.save_community_question_answer(org,qid,gen_random_uuid(),0,'Revoked',true); raise exception 'Moderator answered as representative';
  exception when insufficient_privilege then null; end;
  result:=public.change_community_question(org,qid,v,'hide','Moderation by delegate',null,true); v:=(result->>'version')::int;
  reset role; update public.community_members set status='banned' where community_id=org and user_id=editor_id;
  set local role authenticated;
  begin
    perform public.change_community_question(org,qid,v,'restore'); raise exception 'Banned moderator restored';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub',asker_id::text,true);
  begin
    perform public.change_community_question(org,qid,v,'restore'); raise exception 'Author undid moderation';
  exception when insufficient_privilege then null; end;
  result:=public.change_community_question(org,qid,v,'archive','',null,true);
  perform public.change_community_question(org,qid,v,'archive','',null,true);
  if exists(select 1 from public.community_questions where id=qid) then raise exception 'Archived question remained visible to author'; end if;
  reset role;
  if not exists(select 1 from public.community_profile_revisions where entity_id=qid and actor_id=editor_id and after_data->>'moderation_reason'='Moderation by delegate') then raise exception 'Moderation audit missing'; end if;
  if has_table_privilege('authenticated','public.community_question_answers','INSERT') then raise exception 'Direct answer writes allowed'; end if;
  select count(*) into original_count from public.community_questions where author_id=asker_id and created_at>now()-interval '1 hour';
  for i in original_count..29 loop
    insert into public.community_questions(community_id,author_id,title,body) values(org,asker_id,'Rate fixture','Text');
  end loop;
  set local role authenticated;
  begin
    perform public.save_community_question(org,gen_random_uuid(),0,'Rate limit','Text',null,false); raise exception 'Rate limit bypass';
  exception when program_limit_exceeded then null; end;
  reset role;
end $$;
rollback;
