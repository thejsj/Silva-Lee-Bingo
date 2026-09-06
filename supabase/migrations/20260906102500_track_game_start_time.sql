alter table public.game_state
  add column started_at timestamptz;

update public.game_state
set started_at = coalesce(
  (select min(created_at) from public.photo_submissions),
  now()
)
where id = 0
  and state in ('active', 'finished');

create or replace function public.set_game_started_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id = 0 and new.state = 'active' and old.state is distinct from 'active' then
    new.started_at = now();
  elsif new.id = 0 and new.state = 'pending' then
    new.started_at = null;
  end if;

  return new;
end;
$$;

create trigger set_game_started_at_before_update
before update on public.game_state
for each row
execute function public.set_game_started_at();
