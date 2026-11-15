# Google Play — quick notes

Android project: `android/` (Capacitor). Application ID: `com.youneek.atlas3i`.  
Display name on launcher / Play: **3iAtlas: The Game**.

Full owner checklist: **[SETUP.md](./SETUP.md)**.

## Release build

```bash
npm ci
npm run bundle:android   # vite build + cap sync + patch branding + gradle bundleRelease
```

Output AAB: `android/app/build/outputs/bundle/release/app-release.aab`

Sign via `android/keystore.properties` (gitignored) or CI secrets — see SETUP.md.  
**Never commit** `.jks` / `.keystore` / service-account JSON.

## CI

`.github/workflows/android-release.yml` — `workflow_dispatch` only. Builds a release AAB artifact; uploads to Play **internal** testing when `PLAY_SERVICE_ACCOUNT_JSON` + keystore secrets are set.

## In-app products

Same IDs as Apple (`src/lib/iapProducts.js`). Billing via `@capgo/native-purchases` (Play Billing). Optional server verify: `supabase/functions/verifyGooglePurchase`.

## Icons / splash

```bash
npm run icons:native
```

Regenerates full-bleed adaptive icons + splash (`#01010c`) and strips the default 16.7% adaptive inset so the medallion is not tiny on the launcher.
