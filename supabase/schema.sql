-- ═══════════════════════════════════════════════════════════
--  3i-atlas-the-game — Supabase Database Schema
--  Run this in Supabase SQL Editor: Database → SQL Editor
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_email ON player_profiles(user_email);
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_score_entries_user_email ON score_entries(user_email);
CREATE INDEX IF NOT EXISTS idx_score_entries_score ON score_entries(score DESC);
CREATE INDEX IF NOT EXISTS idx_score_entries_level_id ON score_entries(level_id);

-- Enable Row Level Security
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_profiles
-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON player_profiles FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON player_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON player_profiles FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON player_profiles FOR DELETE
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

-- RLS Policies for score_entries
-- Anyone can view all scores (public leaderboard)
CREATE POLICY "Anyone can view scores"
  ON score_entries FOR SELECT
  USING (true);

-- Only authenticated users can insert scores
CREATE POLICY "Authenticated users can insert scores"
  ON score_entries FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can delete their own scores
CREATE POLICY "Users can delete their own scores"
  ON score_entries FOR DELETE
  USING (auth.jwt() ->> 'email' = user_email);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on player_profiles
CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
