-- ═══════════════════════════════════════════════════════════
--  3i-atlas-the-game — Supabase Database Schema
--  Run this in Supabase SQL Editor: Database → SQL Editor
--  Project: https://exnifhwhlbbunjewzpng.supabase.co
-- ═══════════════════════════════════════════════════════════

-- Player Profiles Table
CREATE TABLE IF NOT EXISTS player_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text UNIQUE NOT NULL,
  display_name text,
  total_score integer DEFAULT 0,
  best_score integer DEFAULT 0,
  missions_completed integer DEFAULT 0,
  perfect_stealth_count integer DEFAULT 0,
  selected_skin text DEFAULT 'default',
  owned_skins text[] DEFAULT ARRAY['default'],
  gas_charges jsonb DEFAULT '{"methane": 3, "ammonia": 3, "xenon": 3}'::jsonb,
  owned_powerups jsonb DEFAULT '{"gravity_shield": 0, "probe_scrambler": 0, "stealth_cloak": 0}'::jsonb,
  achievements text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Score Entries Table (Leaderboard)
CREATE TABLE IF NOT EXISTS score_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  display_name text,
  score integer NOT NULL,
  level_id integer,
  detection_pct numeric,
  perfect_stealth boolean DEFAULT false,
  run_type text DEFAULT 'single_level' CHECK (run_type IN ('single_level', 'full_run')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_user_email ON player_profiles(user_email);
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_score_entries_user_email ON score_entries(user_email);
CREATE INDEX IF NOT EXISTS idx_score_entries_score ON score_entries(score DESC);
CREATE INDEX IF NOT EXISTS idx_score_entries_level_id ON score_entries(level_id);

ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON player_profiles;
CREATE POLICY "Users can view their own profile"
  ON player_profiles FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "Users can insert their own profile" ON player_profiles;
CREATE POLICY "Users can insert their own profile"
  ON player_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "Users can update their own profile" ON player_profiles;
CREATE POLICY "Users can update their own profile"
  ON player_profiles FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "Users can delete their own profile" ON player_profiles;
CREATE POLICY "Users can delete their own profile"
  ON player_profiles FOR DELETE
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "Anyone can view scores" ON score_entries;
CREATE POLICY "Anyone can view scores"
  ON score_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert scores" ON score_entries;
CREATE POLICY "Authenticated users can insert scores"
  ON score_entries FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "Users can delete their own scores" ON score_entries;
CREATE POLICY "Users can delete their own scores"
  ON score_entries FOR DELETE
  USING (auth.jwt() ->> 'email' = user_email);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_player_profiles_updated_at ON player_profiles;
CREATE TRIGGER set_player_profiles_updated_at
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.player_profiles (user_id, user_email, display_name)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1))
  ON CONFLICT (user_email) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
