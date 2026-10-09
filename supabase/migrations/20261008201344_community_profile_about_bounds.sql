alter table public.community_about drop constraint if exists community_about_links_size;
alter table public.community_about add constraint community_about_links_size check (octet_length(social_links::text)<=24000);
alter table public.community_about drop constraint if exists community_about_founding_date;
alter table public.community_about add constraint community_about_founding_date
  check (founded_on is null or founded_on between date '0001-01-01' and date '9999-12-31');
