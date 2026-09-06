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

### Cloudflare Pages (recommended)

The repo deploys with Wrangler + the Cloudflare API via:

```bash
export CLOUDFLARE_ACCOUNT_ID=your_account_id
export CLOUDFLARE_API_TOKEN=your_api_token   # Pages Edit + Zone DNS Edit
npm run deploy:cloudflare
```

This will:
1. Build `dist/`
2. Create/update the Pages project `3i-atlas-the-game`
3. Attach custom domains `3iatlasgame.xyz` and `www.3iatlasgame.xyz`
4. Point zone DNS (proxied CNAMEs) at the Pages subdomain

CI: add repo secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, then push to `main` (workflow `Deploy Cloudflare Pages`).

**Security:** if the apex still shows “Just a moment…” / `cf-mitigated: challenge`, set Cloudflare **Security Level → Medium** and turn off Bot Fight / Under Attack mode for the zone.

### GitHub Pages (optional fallback)

`.github/workflows/deploy-github-pages.yml` builds on `main`, but GitHub Pages must be enabled once in the repo:

1. GitHub → **Settings** → **Pages** → Source **GitHub Actions**
2. Custom domain: `3iatlasgame.xyz` (`public/CNAME` is already set)

If DNS stays on Cloudflare for Pages, prefer the Cloudflare deploy path above.

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
