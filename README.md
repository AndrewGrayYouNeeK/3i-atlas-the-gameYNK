# Atlas — The Game

A stealth campaign: recon Earth as 1I/'Oumuamua, leave the solar system, then send 3I/ATLAS and stay undetected while Earth watches from the background.

## About

You start as **'Oumuamua** — a tumbling scout hull sent to scope Earth. After the recon, you exit the system and dispatch **3I/ATLAS**. The second visitor has to ghost Earth's sensors. Earth stays painted in the sky for the Atlas run.

## Features

- Two-act campaign: 1I/'Oumuamua recon, then 3I/ATLAS infiltration
- Earth backdrop on Atlas missions (they are watching)
- 3 difficulty modes: Easy, Medium, Hard
- Gas release mechanics: Methane (optical cloak), Ammonia (radar jam), Xenon (heat mask)
- Three Eyes system: Night Vision, Heat Scan, Myth Mode (slow time)
- Detection system — stay below 5% to earn stealth bonus
- Leaderboard & achievements
- Unlockable comet skins
- Fully playable on mobile with on-screen joystick

## Controls

| Action | Key |
|--------|-----|
| Move | WASD / Arrow Keys |
| Burst Speed | Hold SHIFT |
| Slow Down | Hold CTRL |
| Methane Gas | Q |
| Ammonia Gas | E |
| Xenon Gas | R |
| Night Vision | 1 |
| Heat Scan | 2 |
| Myth Mode | 3 |
| Pause | ESC |

## Levels

**Act I — 1I/'Oumuamua**
1. **Interstellar Approach** — Enter from the dark, line up on Earth
2. **Scope Earth** — Fly close, map the watchers, do not linger
3. **Leave the System** — Coast out past the heliopause

**Act II — 3I/ATLAS**
4. **The Dispatch** — The second hull arrives. Earth is watching.
5. **Jupiter Blind** — Hide behind the giant
6. **Mars Dark** — No thrust, dishes and Earth both listening
7. **Inner Watch** — Venus veil, thermal chaos
8. **Ghost the Watchers** — Final stealth with Earth still in the background

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion
- **3D Graphics**: Three.js
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Payments**: Stripe (optional, for in-app purchases)

## Running Locally

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier works fine)

### Installation

```bash
git clone https://github.com/AndrewGrayYouNeeK/3i-atlas-the-game.git
cd 3i-atlas-the-game
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

**Current status (checked 29 Aug 2026):** `https://3iatlasgame.xyz` is on Cloudflare, but it is **not serving this game yet**.

- There is **no** `*.pages.dev` site for this repo (Cloudflare Pages was never created).
- The apex hostname returns a Cloudflare **managed challenge** (`403`, “Just a moment…” / `cf-mitigated: challenge`) — Security Level is likely **I’m Under Attack** or Bot Fight is on.
- `www.3iatlasgame.xyz` **does not exist** in DNS.

The game will not appear on that domain until a host is actually deployed **and** the zone’s DNS/custom-domain record points at it.

### Option A — Cloudflare Pages (best, domain already on Cloudflare)

1. Cloudflare dashboard → **Security** → **Settings** → set Security Level to **Medium** (not “I’m Under Attack”). Save.
2. [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages) → **Create** → **Pages** → **Connect to Git** → `AndrewGrayYouNeeK/3i-atlas-the-gameYNK`.
3. Build: command `npm run build`, output `dist`, Node `20`.
4. Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.example`.
5. Deploy and open the `*.pages.dev` URL first. If that URL does not load the game, the custom domain cannot work either.
6. **Custom domains** → add `3iatlasgame.xyz`. When Cloudflare asks to **replace existing DNS** (the old Base44 target), confirm.
7. Add `www.3iatlasgame.xyz` the same way (this record does not exist today).

If “add custom domain” fails because a CNAME/A record is already used: **DNS** → delete the old A/CNAME/Base44 records for `@` and `www`, then attach the domain again.

### Option B — GitHub Pages (this repo)

Merging to `main` runs `.github/workflows/deploy-github-pages.yml`. Then:

1. GitHub repo → **Settings** → **Pages** → Source **GitHub Actions**.
2. Custom domain: `3iatlasgame.xyz` (the `CNAME` file is in `public/`).
3. In Cloudflare **DNS**, replace the apex records with GitHub Pages IPs, **DNS only** (grey cloud, not proxied):

```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   AndrewGrayYouNeeK.github.io
```

Do not orange-cloud GitHub Pages unless SSL mode is Full and “I’m Under Attack” is off.

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
