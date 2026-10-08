create or replace function community_private.save_article(target_community uuid,target_id uuid,expected_version integer,payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare old_row public.community_articles; saved public.community_articles; asset public.community_library_assets;
  heading text:=btrim(payload->>'title'); subheading text:=btrim(coalesce(payload->>'subtitle',''));
  body text:=payload->>'content'; abstract text:=btrim(coalesce(payload->>'summary',''));
  topic text:=btrim(coalesce(payload->>'category','')); published boolean:=(payload->>'isPublished')::boolean;
  cover uuid:=(payload->>'coverAssetId')::uuid; keep_cover boolean:=coalesce((payload->>'keepLegacyCover')::boolean,true);
  labels text[]; attachments uuid[]; embedded uuid[]; all_assets uuid[]; asset_id uuid; old_cover text; permalink text;
begin
  if auth.uid() is null or not community_private.can_manage_profile(target_community,'content') then
    raise exception 'Not allowed' using errcode='42501'; end if;
  if target_id is null or expected_version is null or expected_version<0 or jsonb_typeof(payload)<>'object'
    or heading is null or char_length(heading) not between 1 and 160 or char_length(subheading)>240
    or body is null or octet_length(body)>200000 or char_length(abstract)>500 or char_length(topic)>120 or published is null then
    raise exception 'Invalid article' using errcode='23514'; end if;
  if published and char_length(btrim(regexp_replace(body,'<[^>]*>',' ','g')))<20 then
    raise exception 'Published article needs content' using errcode='23514'; end if;
  -- Raw media URLs are never stored. HTML is sanitized by the writer and again by every reader.
  if body ~* '<(img|iframe|video|audio|script|object|embed)([[:space:]>])'
    or body ~* 'https?://(imagedelivery\.net|[^/]*cloudflarestream\.com|videodelivery\.net)/' then
    raise exception 'Use library media references' using errcode='23514'; end if;
  select coalesce(array_agg(value),'{}') into labels from jsonb_array_elements_text(coalesce(payload->'tags','[]'));
  select coalesce(array_agg(value::uuid),'{}') into attachments from jsonb_array_elements_text(coalesce(payload->'attachmentIds','[]'));
  select coalesce(array_agg(m[1]::uuid),'{}') into embedded from regexp_matches(body,'data-community-asset-id="([a-f0-9-]{36})"','g') m;
  if cardinality(labels)>12 or exists(select 1 from unnest(labels) tag where char_length(btrim(tag)) not between 1 and 60)
    or cardinality(attachments)>20 or cardinality(embedded)>20
    or regexp_count(body,'data-community-asset-id',1,'i')<>cardinality(embedded)
    or cardinality(attachments)<>(select count(distinct id) from unnest(attachments) id) then
    raise exception 'Invalid article references or tags' using errcode='23514'; end if;
  perform pg_advisory_xact_lock(hashtextextended('community-article:'||target_id::text,0));
  select * into old_row from public.community_articles where id=target_id for update;
  if found and (old_row.community_id<>target_community or old_row.deleted_at is not null or old_row.hidden_at is not null) then
    raise exception 'Article unavailable' using errcode='42501'; end if;
  all_assets:=array_remove(attachments||embedded||array[cover],null);
  -- Sorted row locks give deterministic ordering when several articles reuse library assets.
  for asset_id in select distinct id from unnest(all_assets) id order by id loop
    select * into asset from public.community_library_assets where id=asset_id and community_id=target_community and deleted_at is null for share;
    if not found or (published and (not asset.is_published or asset.visibility<>'public'))
      or (asset_id=cover and asset.kind<>'image')
      or (asset_id=any(embedded) and asset.kind not in ('image','video'))
      or (asset_id=any(attachments) and asset.kind<>'document') then
      raise exception 'Library asset unavailable or wrong kind' using errcode='23514'; end if;
  end loop;
  old_cover:=case when cover is null and keep_cover then old_row.cf_image_id else null end;
  if old_row.id is not null and (old_row.title,coalesce(old_row.subtitle,''),old_row.content,coalesce(old_row.summary,''),old_row.category,
    old_row.tags,old_row.cover_asset_id,old_row.cf_image_id,old_row.attachment_ids,old_row.is_published)
    is not distinct from (heading,subheading,body,abstract,topic,labels,cover,old_cover,attachments,published) then
    return jsonb_build_object('id',old_row.id,'slug',old_row.slug,'version',old_row.version); end if;
  if (old_row.id is null and expected_version<>0) or (old_row.id is not null and old_row.version<>expected_version) then
    raise exception 'Version conflict' using errcode='40001'; end if;
  if old_row.id is null then
    -- UUID suffix makes creation idempotent and avoids lookup races without a privileged slug scan.
    permalink:=coalesce(nullif(btrim(regexp_replace(lower(heading),'[^a-z0-9]+','-','g'),'-'),''),'articulo')||'-'||target_id::text;
    insert into public.community_articles(id,community_id,author_id,slug,title,subtitle,content,summary,category,tags,
      cover_asset_id,attachment_ids,is_published,published_at,read_time)
    values(target_id,target_community,auth.uid(),permalink,heading,nullif(subheading,''),body,nullif(abstract,''),topic,labels,
      cover,attachments,published,case when published then now() else null end,
      greatest(1,ceil(cardinality(regexp_split_to_array(regexp_replace(body,'<[^>]*>',' ','g'),'\s+'))/200.0)::int)) returning * into saved;
  else
    update public.community_articles set title=heading,subtitle=nullif(subheading,''),content=body,summary=nullif(abstract,''),category=topic,tags=labels,
      cover_asset_id=cover,cf_image_id=old_cover,attachment_ids=attachments,is_published=published,
      published_at=case when published then coalesce(old_row.published_at,now()) else old_row.published_at end,
      read_time=greatest(1,ceil(cardinality(regexp_split_to_array(regexp_replace(body,'<[^>]*>',' ','g'),'\s+'))/200.0)::int)
      where id=target_id returning * into saved;
  end if;
  return jsonb_build_object('id',saved.id,'slug',saved.slug,'version',saved.version);
end;
$$;
revoke all on function community_private.save_article(uuid,uuid,integer,jsonb) from public,anon;
grant execute on function community_private.save_article(uuid,uuid,integer,jsonb) to authenticated;
create or replace function public.save_community_article(target_community uuid,target_id uuid,expected_version integer,payload jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select community_private.save_article(target_community,target_id,expected_version,payload);
$$;
revoke all on function public.save_community_article(uuid,uuid,integer,jsonb) from public,anon;
grant execute on function public.save_community_article(uuid,uuid,integer,jsonb) to authenticated;
