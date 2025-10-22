create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type room_status as enum ('draft', 'live', 'ended');
create type round_type as enum ('hot_take', 'callout', 'dare');

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  phone text unique,
  display_name text not null,
  age_verified boolean default false,
  borough text,
  is_guest boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.crews (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create type if not exists member_role as enum ('host', 'player');

create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  host uuid references profiles(id),
  status room_status default 'draft',
  borough text,
  created_at timestamptz default now()
);

create table if not exists public.room_members (
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  nickname text not null,
  role member_role default 'player',
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade,
  started_at timestamptz default now(),
  ended_at timestamptz,
  is_practice boolean default false
);

create table if not exists public.prompts (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  type round_type not null,
  tags text[] default '{}',
  risk int default 0,
  locale text default 'en-US',
  active boolean default true
);

create table if not exists public.rounds (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  index int not null,
  type round_type not null,
  prompt_id uuid references prompts(id),
  started_at timestamptz default now(),
  ended_at timestamptz
);

create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references rounds(id) on delete cascade,
  voter uuid references profiles(id),
  target uuid references profiles(id),
  text_answer text,
  created_at timestamptz default now()
);

create table if not exists public.recap_cards (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  storage_path text not null,
  highlights jsonb default '[]',
  created_at timestamptz default now()
);

create index if not exists idx_room_members_room on public.room_members(room_id);
create index if not exists idx_sessions_room on public.sessions(room_id);

create table if not exists public.invite_tokens (
  id uuid primary key default uuid_generate_v4(),
  owner uuid references profiles(id) on delete cascade,
  balance int default 0,
  updated_at timestamptz default now()
);

create table if not exists public.content_flags (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  reason text,
  risk int,
  created_at timestamptz default now()
);

create policy "Profiles: read self or crew" on public.profiles
  for select using (
    auth.uid() = id
    or exists (
      select 1
      from public.room_members rm_self
      join public.room_members rm_other on rm_other.room_id = rm_self.room_id
      where rm_self.user_id = auth.uid() and rm_other.user_id = profiles.id
    )
  );
create policy "Profiles: update own" on public.profiles for update using (auth.uid() = id);

create policy "Rooms: members only" on public.rooms
  for select using (
    exists (
      select 1 from room_members rm where rm.room_id = rooms.id and rm.user_id = auth.uid()
    )
  );

create policy "Room members: manage self" on public.room_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Room members: crew visibility" on public.room_members
  for select using (
    exists (
      select 1
      from public.room_members rm
      where rm.room_id = room_members.room_id and rm.user_id = auth.uid()
    )
  );

create policy "Sessions: members" on public.sessions
  for select using (
    exists (
      select 1 from room_members rm where rm.room_id = sessions.room_id and rm.user_id = auth.uid()
    )
  );

create policy "Rounds: members" on public.rounds
  for select using (
    exists (
      select 1 from sessions s join room_members rm on rm.room_id = s.room_id where s.id = rounds.session_id and rm.user_id = auth.uid()
    )
  );

create policy "Votes: members" on public.votes
  for all using (
    exists (
      select 1 from rounds r join sessions s on s.id = r.session_id join room_members rm on rm.room_id = s.room_id
      where r.id = votes.round_id and rm.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from rounds r join sessions s on s.id = r.session_id join room_members rm on rm.room_id = s.room_id
      where r.id = votes.round_id and rm.user_id = auth.uid()
    )
  );

create policy "Prompts: read" on public.prompts for select using (active);

create policy "Recap cards: members" on public.recap_cards
  for select using (
    exists (
      select 1 from sessions s join room_members rm on rm.room_id = s.room_id
      where s.id = recap_cards.session_id and rm.user_id = auth.uid()
    )
  );

create or replace function public.start_session(p_room uuid, p_is_practice boolean default false)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  is_host boolean;
  new_session uuid;
begin
  if p_is_practice then
    is_host := true;
  else
    select rm.role = 'host'
      into is_host
    from room_members rm
    where rm.room_id = p_room and rm.user_id = auth.uid();
  end if;

  if not coalesce(is_host, false) then
    raise exception 'only hosts can start sessions';
  end if;

  insert into sessions (room_id, is_practice, started_at)
    values (p_room, p_is_practice, now())
    returning id into new_session;

  return new_session;
end;
$$;

create or replace function public.end_session(p_session uuid)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  is_host boolean;
  session_record sessions;
begin
  select * into session_record from sessions where id = p_session;
  if not found then
    raise exception 'session not found';
  end if;

  if session_record.is_practice then
    is_host := true;
  else
    select rm.role = 'host'
      into is_host
    from room_members rm
    where rm.room_id = session_record.room_id and rm.user_id = auth.uid();
  end if;

  if not coalesce(is_host, false) then
    raise exception 'only hosts can end sessions';
  end if;

  update sessions set ended_at = now() where id = p_session;
  return p_session;
end;
$$;

create or replace function public.next_round(p_session uuid, p_type round_type, p_prompt uuid)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  next_index int;
  session_record sessions;
  is_host boolean;
  round_id uuid;
begin
  select * into session_record from sessions where id = p_session;
  if not found then
    raise exception 'session not found';
  end if;

  if session_record.is_practice then
    is_host := true;
  else
    select rm.role = 'host'
      into is_host
    from room_members rm
    where rm.room_id = session_record.room_id and rm.user_id = auth.uid();
  end if;

  if not coalesce(is_host, false) then
    raise exception 'only hosts can advance rounds';
  end if;

  select coalesce(max(index), -1) + 1 into next_index from rounds where session_id = p_session;

  insert into rounds (session_id, index, type, prompt_id, started_at)
    values (p_session, next_index, p_type, p_prompt, now())
    returning id into round_id;

  return round_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.sessions enable row level security;
alter table public.rounds enable row level security;
alter table public.votes enable row level security;
alter table public.prompts enable row level security;
alter table public.recap_cards enable row level security;
alter table public.invite_tokens enable row level security;
alter table public.content_flags enable row level security;
