-- Crew'd Up practice mode + guest flow migration

-- Drop play windows from rooms
ALTER TABLE rooms DROP COLUMN IF EXISTS play_window_start;
ALTER TABLE rooms DROP COLUMN IF EXISTS play_window_end;

-- Host vs guest on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_guest boolean DEFAULT false;
ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;

-- Member roles
DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('host','player');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE room_members ADD COLUMN IF NOT EXISTS role member_role DEFAULT 'player';

-- Practice sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_practice boolean DEFAULT false;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_sessions_room ON sessions(room_id);

-- Update RLS policies to reflect guest visibility and recap protections
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Profiles: users read own" ON profiles';
EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Profiles: read self or crew" ON profiles';
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "Profiles: read self or crew" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1
      FROM room_members rm_self
      JOIN room_members rm_other ON rm_other.room_id = rm_self.room_id
      WHERE rm_self.user_id = auth.uid() AND rm_other.user_id = profiles.id
    )
  );

DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Room members: manage self" ON room_members';
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "Room members: manage self" ON room_members
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Room members: crew visibility" ON room_members';
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "Room members: crew visibility" ON room_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_members rm WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid()
    )
  );

DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Recap cards: members" ON recap_cards';
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "Recap cards: members" ON recap_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s JOIN room_members rm ON rm.room_id = s.room_id
      WHERE s.id = recap_cards.session_id AND rm.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.start_session(p_room uuid, p_is_practice boolean DEFAULT false)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  is_host boolean;
  new_session uuid;
BEGIN
  IF p_is_practice THEN
    is_host := true;
  ELSE
    SELECT rm.role = 'host'
      INTO is_host
    FROM room_members rm
    WHERE rm.room_id = p_room AND rm.user_id = auth.uid();
  END IF;

  IF NOT coalesce(is_host, false) THEN
    RAISE EXCEPTION 'only hosts can start sessions';
  END IF;

  INSERT INTO sessions (room_id, is_practice, started_at)
    VALUES (p_room, p_is_practice, now())
    RETURNING id INTO new_session;

  RETURN new_session;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_session(p_session uuid)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  is_host boolean;
  session_record sessions;
BEGIN
  SELECT * INTO session_record FROM sessions WHERE id = p_session;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'session not found';
  END IF;

  IF session_record.is_practice THEN
    is_host := true;
  ELSE
    SELECT rm.role = 'host'
      INTO is_host
    FROM room_members rm
    WHERE rm.room_id = session_record.room_id AND rm.user_id = auth.uid();
  END IF;

  IF NOT coalesce(is_host, false) THEN
    RAISE EXCEPTION 'only hosts can end sessions';
  END IF;

  UPDATE sessions SET ended_at = now() WHERE id = p_session;
  RETURN p_session;
END;
$$;

CREATE OR REPLACE FUNCTION public.next_round(p_session uuid, p_type round_type, p_prompt uuid)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  next_index int;
  session_record sessions;
  is_host boolean;
  round_id uuid;
BEGIN
  SELECT * INTO session_record FROM sessions WHERE id = p_session;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'session not found';
  END IF;

  IF session_record.is_practice THEN
    is_host := true;
  ELSE
    SELECT rm.role = 'host'
      INTO is_host
    FROM room_members rm
    WHERE rm.room_id = session_record.room_id AND rm.user_id = auth.uid();
  END IF;

  IF NOT coalesce(is_host, false) THEN
    RAISE EXCEPTION 'only hosts can advance rounds';
  END IF;

  SELECT coalesce(max(index), -1) + 1 INTO next_index FROM rounds WHERE session_id = p_session;

  INSERT INTO rounds (session_id, index, type, prompt_id, started_at)
    VALUES (p_session, next_index, p_type, p_prompt, now())
    RETURNING id INTO round_id;

  RETURN round_id;
END;
$$;
