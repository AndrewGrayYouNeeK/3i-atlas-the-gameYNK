# Google Play — quick notes

Android project: `android/` (Capacitor). Application ID: `com.youneek.atlas3i`.

## Release build

```bash
npm ci
npm run build:android
cd android
./gradlew bundleRelease
```

Output AAB: `android/app/build/outputs/bundle/release/app-release.aab`

Sign with a Play upload keystore (create once; **do not commit** `.jks` / `.keystore`):

```bash
# example — adjust paths/aliases
jarsigner -keystore /path/to/upload.keystore \
  -signedjar app-release-signed.aab \
  app/build/outputs/bundle/release/app-release.aab upload
```

Or configure `signingConfigs` in `android/app/build.gradle` via `keystore.properties` (gitignored).

## Play Console

- App name: **3I/ATLAS**
- Category: Games
- Privacy policy: https://3iatlasgame.xyz/privacy
- Icons: generated under `android/app/src/main/res/mipmap-*`
- Feature graphic / store screenshots: reuse `docs/app-store/screenshots/` cropped as needed

## Permissions

`INTERNET` is declared for optional Supabase auth/leaderboard/store. The campaign itself runs from bundled assets offline.
