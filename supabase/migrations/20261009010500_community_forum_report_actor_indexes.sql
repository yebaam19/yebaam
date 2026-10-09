-- Account deletion and reviewer anonymization should locate affected reports cheaply.
create index if not exists community_forum_reports_reporter_idx
  on public.community_forum_reports(reporter_id) where reporter_id is not null;
create index if not exists community_forum_reports_reviewer_idx
  on public.community_forum_reports(reviewer_id) where reviewer_id is not null;
