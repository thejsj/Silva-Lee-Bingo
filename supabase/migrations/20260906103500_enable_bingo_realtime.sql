do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bingo_submissions'
  ) then
    alter publication supabase_realtime
      add table public.bingo_submissions;
  end if;
end;
$$;
