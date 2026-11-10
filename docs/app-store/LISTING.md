# App Store Connect — listing copy

Use these fields in App Store Connect. Screenshots: `docs/app-store/screenshots/`.

## Identity

| Field | Value |
|-------|--------|
| App Name | 3I/ATLAS |
| Subtitle (30 chars) | Stealth comet campaign |
| Bundle ID | `com.youneek.atlas3i` |
| Primary Category | Games |
| Secondary Category | Strategy (or Simulation) |
| Content Rights | Does not use third-party content that requires special licenses beyond the MIT game itself |
| Age Rating | See questionnaire answers below |
| Price | Free (IAP optional for cosmetic skins) |

## Promotional text (170 chars, changeable anytime)

Keep the comet disguise intact while Earth watches the real 2025–2026 trajectory of 3I/ATLAS. Eight stealth stages. Touch controls. Play offline.

## Description

You are **3I/ATLAS** — discovered 1 July 2025 and filed as an interstellar comet. Keep that disguise intact while observatories and probes watch the real trajectory.

The public record is the timeline: ATLAS at Río Hurtado, Hubble and JWST, the Mars passage, solar conjunction, perihelion near 1.36 AU, the morning-sky fade, the Jupiter region, and the hyperbolic exit. The ship log is the game.

**Features**
• Eight stages along the 2025–2026 trajectory  
• Disguise meters: coma, ion/dust tail, trajectory anomaly, spectrum, A1 jet window, ephemeris  
• Briefings split into public record and classified ship log  
• Suspicion / detection that ends the run at 100%  
• Easy / Medium / Hard  
• On-screen joystick and action buttons (no keyboard needed)  
• Optional account for leaderboard, achievements, and cosmetic skins  

Core campaign plays offline. Optional online features (auth, leaderboard, store) use Supabase/Stripe when configured.

Support: https://3iatlasgame.xyz  
Privacy: https://3iatlasgame.xyz/privacy

## Keywords (100 chars max, comma-separated)

comet,stealth,space,atlas,strategy,interstellar,campaign,touch,offline,simulation

## What’s New (1.0.0)

Initial App Store release of 3I/ATLAS — the stealth comet campaign with full touch controls and offline play.

## URLs

| Field | URL |
|-------|-----|
| Support | https://3iatlasgame.xyz |
| Marketing | https://3iatlasgame.xyz |
| Privacy Policy | https://3iatlasgame.xyz/privacy |

## Screenshots required

Upload from `docs/app-store/screenshots/`:

- **iPhone 6.9"** — `iphone-6.9-*.png` (1320×2868)
- **iPhone 6.5"** — `iphone-6.5-*.png` (1284×2778)
- **iPad 13"** — `ipad-13-*.png` (2064×2752) — iPad is supported (`TARGETED_DEVICE_FAMILY = 1,2`)

Capture locally anytime with:

```bash
npm run screenshots:app-store
```

## Age rating questionnaire (suggested answers)

Answer for a sci-fi stealth game with abstract “detection” failure — no realistic violence, no gore, no gambling, no mature themes.

| Topic | Answer |
|-------|--------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | None |
| Horror/Fear Themes | None / Infrequent Mild (if asked: space tension only) |
| Medical/Treatment Information | None |
| Alcohol, Tobacco, or Drug Use or References | None |
| Simulated Gambling | None |
| Sexual Content or Nudity | None |
| Graphic Sexual Content and Nudity | None |
| Contests | None |
| Unrestricted Web Access | No (in-app WebView is the game itself; optional auth uses known endpoints) |
| Gambling and Contests | None |
| Made for Kids | No |

Expected rating band: **4+** or **9+** depending on Apple’s automation for “mild tension.” Prefer **4+** if offered.

## In-App Purchases note

If cosmetic skins via Stripe are enabled in the native build, declare them as consumable/non-consumable IAP **or** keep purchases web-only and disable the store pay flow in native until App Store IAP is wired. Current web Stripe Checkout is not App Store IAP — for v1 submit, either leave skins free/local or gate paid store behind “available on web.”
