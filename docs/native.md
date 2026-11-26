# Native apps (Capacitor)

The Vite/React game is wrapped with **Capacitor 8**. Web deploy (Cloudflare Worker) is unchanged.

| | |
|--|--|
| App ID / package | `com.youneek.atlas3i` |
| Display name (iOS) | `3I/ATLAS` |
| Display name (Android / Play) | `3iAtlas: The Game` |
| Version | `1.0.0` (build `1`) |
| Orientations | Portrait + landscape |
| Config | `capacitor.config.json` |
| CI (TestFlight) | `.github/workflows/ios-testflight.yml` on `macos-26` / Xcode 26 — see `RELEASE.md` |
| CI (Play AAB) | `.github/workflows/android-release.yml` — `workflow_dispatch` only — see `docs/play-store/SETUP.md` |

## Scripts

```bash
npm run build            # web only (Cloudflare)
npm run icons:native     # rebuild icons/splash from public/logo.webp (+ Android full-bleed patch)
npm run sync:native      # vite build + npx cap sync + Android branding patch
npm run build:ios        # build + sync ios
npm run build:android    # build + sync android + Play display name / adaptive icon patch
npm run bundle:android   # build:android + gradle bundleRelease (AAB)
npm run keystore:android # generate upload keystore + base64 (never commit)
npm run screenshots:app-store
```

## Offline

`npm run build` emits static assets into `dist/`; `cap sync` copies them into the native projects. Google Fonts were replaced with bundled `@fontsource/*` so typefaces work without network. Missing Supabase env uses a placeholder client (`src/lib/supabaseClient.js`) so the app does not white-screen.

## Touch controls

`CampaignControls` always shows the joystick + action buttons on native (not only below the `md` breakpoint). Actions map to keyboard keys: Dim (Q), Vent (E), Align tail (R), Burn (Shift), spectrum 1/2/3, Outburst (F).

## Changing the bundle ID

1. Edit `appId` in `capacitor.config.json`
2. Update Xcode `PRODUCT_BUNDLE_IDENTIFIER` (or re-add ios)
3. Update Android `applicationId` / `namespace` in `android/app/build.gradle`
4. `npm run sync:native`

## Native In-App Purchases (cosmetic skins)

- Plugin: `@capgo/native-purchases` — StoreKit 2 on iOS, Google Play Billing on Android
- Product map: `src/lib/iapProducts.js` → `com.youneek.atlas3i.skin.<skinId>` (same IDs both stores)
- Catalog / ASC checklist: `docs/app-store/IAP_PRODUCTS.md`
- Play Console checklist: `docs/play-store/SETUP.md`
- Native Store: purchase + **Restore**; web Store keeps Stripe (never shown in native apps)
- Ownership: local unlock on device + Supabase `verifyApplePurchase` / `verifyGooglePurchase` when signed in
- After `npm ci`, run `npx cap sync` so native projects pick up the plugin

## Android system back

`src/lib/androidBackButton.js` (wired from `initNativeShell`): closes How to Play / Store / Leaderboard overlays, pauses an active run, otherwise minimizes the app.
