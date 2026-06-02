begin;

alter table public.email_dashboard_rows
  add column if not exists creative_link text,
  add column if not exists headline text,
  add column if not exists link_url text,
  add column if not exists creative_ready boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'email_dashboard_rows'
      and column_name = 'art_link'
  ) then
    execute 'update public.email_dashboard_rows set creative_link = coalesce(creative_link, art_link)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'email_dashboard_rows'
      and column_name = 'subject'
  ) then
    execute 'update public.email_dashboard_rows set headline = coalesce(headline, subject)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'email_dashboard_rows'
      and column_name = 'art_ready'
  ) then
    execute 'update public.email_dashboard_rows set creative_ready = coalesce(art_ready, creative_ready, false)';
  end if;
end $$;

alter table public.email_dashboard_rows
  drop column if exists copy_link,
  drop column if exists art_link,
  drop column if exists subject,
  drop column if exists link_1,
  drop column if exists link_2,
  drop column if exists link_3,
  drop column if exists art_ready;

commit;
