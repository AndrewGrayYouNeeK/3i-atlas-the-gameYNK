# AGENTS.md

## Cursor Cloud specific instructions

Atlas — The Game is a single-product Vite + React 18 SPA (`3i-atlas-the-game`). The
game engine runs entirely client-side (`src/game/`, `src/components/game/`). Supabase
(Auth, Postgres, Edge Functions) and Stripe are optional, hosted external services used
only for auth, player profiles, leaderboard, and the store — they are not required to
play the game.

### Running / building (standard commands, see `package.json`)

- Dev server: `npm run dev` → http://localhost:5173
- Build: `npm run build` · Preview a build: `npm run preview`
- Lint: `npm run lint` (ESLint flat config; passes clean)

### Non-obvious caveats

- The app hard-crashes to a blank white screen if `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` are missing, because `@supabase/supabase-js`'s `createClient`
  throws `supabaseUrl is required` on an empty URL. A `.env.local` with these two vars is
  required just to boot. Placeholder values (e.g. `https://placeholder.supabase.co` and any
  non-empty key) are enough to run the full single-player game offline — auth calls fail
  gracefully and return `null`. Use real Supabase project values to exercise auth,
  leaderboard, and store persistence. The startup update script creates a placeholder
  `.env.local` if one does not already exist.
- Vite only reads `.env.local` at startup — restart `npm run dev` after editing it.
- `npm run typecheck` currently reports pre-existing errors (mostly in `src/pages/*.jsx`)
  and is intentionally not part of `lint` or `build`; a clean build does not require it.
- There is no test runner configured (`npm test` does not exist) and no local Supabase
  stack (`supabase/schema.sql` + hosted Edge Functions are for a cloud Supabase project).
