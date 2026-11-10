# Native apps (Capacitor)

The Vite/React game is wrapped with **Capacitor 8**. Web deploy (Cloudflare Worker) is unchanged.

| | |
|--|--|
| App ID / package | `com.youneek.atlas3i` |
| Display name | `3I/ATLAS` |
| Version | `1.0.0` (build `1`) |
| Orientations | Portrait + landscape (iPhone & iPad) |
| Config | `capacitor.config.json` |

## Scripts

```bash
npm run build            # web only (Cloudflare)
npm run icons:native     # rebuild icons/splash from public/logo.webp
npm run sync:native      # vite build + npx cap sync
npm run build:ios        # build + sync ios
npm run build:android    # build + sync android
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
