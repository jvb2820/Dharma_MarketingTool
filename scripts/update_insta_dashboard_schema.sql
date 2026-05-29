begin;

alter table public.insta_dashboard_rows
  add column if not exists feed text,
  add column if not exists stories text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'insta_dashboard_rows'
      and column_name = 'feed_1'
  ) then
    execute $sql$
      update public.insta_dashboard_rows
      set feed = coalesce(
        feed,
        nullif(
          concat_ws(E'\n',
            nullif(feed_1, ''),
            nullif(feed_2, ''),
            nullif(feed_3, ''),
            nullif(feed_4, ''),
            nullif(feed_5, '')
          ),
          ''
        )
      )
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'insta_dashboard_rows'
      and column_name = 'story_1'
  ) then
    execute $sql$
      update public.insta_dashboard_rows
      set stories = coalesce(
        stories,
        nullif(
          concat_ws(E'\n',
            nullif(story_1, ''),
            nullif(story_2, ''),
            nullif(story_3, '')
          ),
          ''
        )
      )
    $sql$;
  end if;
end $$;

alter table public.insta_dashboard_rows
  drop column if exists copy_link,
  drop column if exists feed_1,
  drop column if exists feed_2,
  drop column if exists feed_3,
  drop column if exists feed_4,
  drop column if exists feed_5,
  drop column if exists correction,
  drop column if exists story_1,
  drop column if exists story_2,
  drop column if exists story_3;

commit;
