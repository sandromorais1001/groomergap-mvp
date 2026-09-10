create type public.access_status as enum ('trial', 'active', 'expired');

create table public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_status public.access_status not null default 'trial',
  trial_started_at timestamptz,
  trial_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trial_dates_together check (
    (trial_started_at is null and trial_expires_at is null) or
    (trial_started_at is not null and trial_expires_at = trial_started_at + interval '24 hours')
  )
);

alter table public.user_access enable row level security;
create policy "Users can read only their own access" on public.user_access for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.create_user_access()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_access (user_id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_user_access();

create or replace function public.claim_trial_access()
returns table (access_status public.access_status, trial_started_at timestamptz, trial_expires_at timestamptz, server_time timestamptz)
language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  insert into public.user_access (user_id) values (current_user_id) on conflict (user_id) do nothing;
  update public.user_access ua set
    trial_started_at = case when ua.access_status = 'trial' and ua.trial_started_at is null then statement_timestamp() else ua.trial_started_at end,
    trial_expires_at = case when ua.access_status = 'trial' and ua.trial_expires_at is null then statement_timestamp() + interval '24 hours' else ua.trial_expires_at end,
    access_status = case
      when ua.access_status = 'active' then 'active'::public.access_status
      when coalesce(ua.trial_expires_at, statement_timestamp() + interval '24 hours') > statement_timestamp() then 'trial'::public.access_status
      else 'expired'::public.access_status end,
    updated_at = statement_timestamp()
  where ua.user_id = current_user_id;
  return query select ua.access_status, ua.trial_started_at, ua.trial_expires_at, statement_timestamp()
    from public.user_access ua where ua.user_id = current_user_id;
end;
$$;
revoke all on function public.claim_trial_access() from public;
grant execute on function public.claim_trial_access() to authenticated;

-- Manual activation after a confirmed US$29 payment:
-- update public.user_access set access_status = 'active', updated_at = now()
-- where user_id = (select id from auth.users where email = 'customer@example.com');
