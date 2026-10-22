# Atlas — The Game

A strategic stealth campaign. You are **3I/ATLAS** — discovered 1 July 2025 and filed as an interstellar comet. Keep that disguise intact while observatories and probes watch the real trajectory.

## About

The public record is the timeline: ATLAS at Río Hurtado, Hubble and JWST, the Mars passage, solar conjunction, perihelion near 1.36 AU, the post-perihelion fade, the Jupiter region, and the hyperbolic exit. The ship log is the game. Coma, tail, brightness, and non-gravitational acceleration each have a band a comet is allowed to occupy. Leave it while someone is looking and suspicion climbs.

## Features

- Eight stages along the 2025–2026 trajectory, each with its own watchers and objective
- Disguise meters: coma, ion/dust tail, trajectory anomaly, spectrum, A1 jet window, ephemeris
- Briefings split into public record and classified ship log
- Suspicion / detection that ends the run at 100%
- 3 difficulty modes: Easy, Medium, Hard
- Mouse, keyboard, and touch controls
- Leaderboard, achievements, and comet skins (optional accounts)

## Controls

| Action | Key |
|--------|-----|
| Steer | WASD / Arrow Keys / joystick |
| Dim coma | Q |
| Vent coma brighter | E |
| Align tail / tumble ion tail | R |
| Burn (raises anomaly, can leak radio) | Shift |
| Spectrum mix (follow-up stage) | 1 CO₂, 2 H₂O, 3 Dust |
| One allowed outburst (morning-sky stage) | F |
| Pause | ESC |

## Stages

1. **Río Hurtado** — 1 July 2025. Be catalogued by the ATLAS survey as a comet.
2. **The Follow-Up** — Hubble, JWST, and the ground. Hide the hull. Feed JWST a CO₂-rich spectrum.
3. **Mars Passage** — early October 2025. Ride the corridor. Do not maneuver while orbiters image.
4. **Solar Conjunction** — late October 2025. Earth is blind. Coronagraphs are not. Keep the ephemeris clean.
5. **Perihelion** — around 29 October 2025, about 1.36 AU. Hold non-gravitational A1 in the natural jet window.
6. **Morning Sky** — fade on the published brightness curve. One outburst, not two.
7. **Jupiter Passage** — around March 2026. Ragged ion tail, radio silence, stay in the flyby band.
8. **Departure** — go quiet and cross the line.

Placeholder Supabase values are enough to play offline. Auth, leaderboard, and the store need a real project.

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion
- **Graphics**: Canvas 2D — parallax starfields, particle coma and tails, bloom. Three.js is still installed for older scene code.
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Payments**: Stripe (optional, for in-app purchases)

## Running Locally

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier works fine)

### Installation

```bash
git clone https://github.com/AndrewGrayYouNeeK/3i-atlas-the-gameYNK.git
cd 3i-atlas-the-gameYNK
npm install
```

### Database Setup

This repo is wired to the **3i-atlas-the-game** project in the YouNeeK Supabase org
(`https://exnifhwhlbbunjewzpng.supabase.co`). Tables `player_profiles` and `score_entries`
are already provisioned with RLS.

To use your own project instead:

1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to SQL Editor and run the script in `supabase/schema.sql`
3. Copy your project URL and anon key from Project Settings > API

### Environment Variables

Copy `.env.example` to `.env.local` (values for the YouNeeK project are included):

```bash
cp .env.example .env.local
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Deploying to Production

**Canonical domain:** [`https://3iatlasgame.xyz`](https://3iatlasgame.xyz)

The game is a static SPA on **Cloudflare Workers**. `3iatlasgame.xyz` is already a Cloudflare zone; attaching it as a Worker Custom Domain is what actually puts the game on that hostname.

### Cloudflare Workers (recommended)

```bash
export CLOUDFLARE_ACCOUNT_ID=your_account_id
export CLOUDFLARE_API_TOKEN=your_api_token   # Workers Scripts Write + Zone DNS Edit + Zone Read
npm run deploy:cloudflare
```

This will:
1. Build `dist/`
2. Deploy Worker `3i-atlas-the-game` (SPA fallback via `wrangler.jsonc`)
3. Delete the looping apex A records that currently cause Cloudflare **Error 1000** (“DNS points to prohibited IP”)
4. Attach custom domains `3iatlasgame.xyz` and `www.3iatlasgame.xyz`

CI: add repo secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, then push to `main` (workflow `Deploy Cloudflare Workers`). Re-run the workflow after adding secrets.

**If the apex still fails:** Cloudflare dashboard → `3iatlasgame.xyz` → **Security** → **Settings** → Security Level **Medium** (not “I’m Under Attack”), and turn off Bot Fight Mode if needed.

### GitHub Pages (optional fallback)

`.github/workflows/deploy-github-pages.yml` builds on `main`, but GitHub Pages must be enabled once in the repo:

1. GitHub → **Settings** → **Pages** → Source **GitHub Actions**
2. Custom domain: `3iatlasgame.xyz` (`public/CNAME` is already set)

Prefer the Cloudflare Worker path above so DNS stays on Cloudflare.

### Supabase Auth

[URL configuration](https://supabase.com/dashboard/project/exnifhwhlbbunjewzpng/auth/url-configuration):

- Site URL: `https://3iatlasgame.xyz`
- Redirect URLs: `https://3iatlasgame.xyz/**`

### Edge Functions Deployment

If you're using Stripe payments, deploy the Edge Functions to Supabase:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy createStripeCheckout
supabase functions deploy stripeWebhook

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Project Structure

```
3i-atlas-the-game/
├── src/
│   ├── api/              # API client and helpers
│   ├── components/       # React components
│   │   ├── game/        # Game UI components
│   │   ├── menu/        # Menu components
│   │   ├── store/       # Store/shop components
│   │   └── ui/          # Reusable UI components
│   ├── game/            # Game engine and logic
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and context providers
│   └── pages/           # Page components
├── supabase/
│   ├── functions/       # Edge Functions for Stripe
│   └── schema.sql       # Database schema
└── public/              # Static assets
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details

## Built By

Andrew Gray — YouNeeK
