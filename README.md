# Atlas — The Game

A stealth comet infiltration game set across the solar system.

## About

You are Atlas — an ancient intelligence disguised as a comet, on a mission to infiltrate the solar system undetected. Navigate through 7 levels, from the outer Kuiper Belt to Mercury's Sunline, avoiding probes, satellites, and hunters while completing your ancient mission.

## Features

- 7 unique levels across the solar system
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

1. **Outer Kuiper Belt** — Easy intro, learn the controls
2. **Jupiter Ring Passage** — Networked probes that alert each other
3. **Mars Flyby** — Coordinated hunter patrols
4. **Earth Orbit** — The ISS Gauntlet, hunter trios
5. **Venus Veil** — Thermal chaos and sulfur storms
6. **Neptune Blue Dark** — Long-range relay networks
7. **Mercury Sunline** — Final burn, brutal detection

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

The domain **[3iatlasgame.xyz](https://3iatlasgame.xyz)** is already on Cloudflare, but it currently still points at the old Base44 app (unavailable / HTTP 402). Host this Vite build on **Cloudflare Pages** and attach that domain so it replaces Base44.

### 1. Create a Cloudflare Pages project

1. Open [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
2. **Create** → **Pages** → **Connect to Git** → this GitHub repo
3. Build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `20`
4. Environment variables (Production):

```
VITE_SUPABASE_URL=https://exnifhwhlbbunjewzpng.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from .env.example>
```

5. Save and deploy. You will get a `*.pages.dev` URL first — confirm the game loads there.

### 2. Attach 3iatlasgame.xyz

1. In the Pages project: **Custom domains** → **Set up a custom domain**
2. Add `3iatlasgame.xyz` and `www.3iatlasgame.xyz`
3. Cloudflare will offer to **replace the existing DNS records** that currently send traffic to Base44. Accept that.
4. Wait for SSL to become Active (usually a few minutes).

Leave the orange-cloud proxy on. Do not point the domain at GitHub Pages or Vercel while it is on this Cloudflare zone unless you change those records yourself.

### 3. Allow the domain in Supabase Auth

In [Authentication → URL Configuration](https://supabase.com/dashboard/project/exnifhwhlbbunjewzpng/auth/url-configuration):

- Site URL: `https://3iatlasgame.xyz`
- Redirect URLs: `https://3iatlasgame.xyz/**` and `https://www.3iatlasgame.xyz/**`

Without this, email confirmation and OAuth return links stay on localhost.

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
