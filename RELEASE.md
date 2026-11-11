# 3I/ATLAS — App Store / Play release checklist

Native shells live in `ios/` and `android/` (Capacitor). The web game at
[https://3iatlasgame.xyz](https://3iatlasgame.xyz) stays the single source of truth;
`npm run build` + Cloudflare deploy are unchanged.

**Bundle ID (change if needed):** `com.youneek.atlas3i`  
Set in `capacitor.config.json`, Xcode `PRODUCT_BUNDLE_IDENTIFIER`, and Android
`applicationId`. After changing it, run `npm run sync:native`.

**Display name:** `3I/ATLAS` · **Version:** `1.0.0` · **Build:** `1`

---

## Andrew — human-only steps (Apple)

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/yr).
2. In [App Store Connect](https://appstoreconnect.apple.com): **My Apps → + → New App**
   - Platforms: iOS
   - Name: `3I/ATLAS`
   - Bundle ID: register `com.youneek.atlas3i` (or your new id) in Certificates, Identifiers & Profiles first
   - SKU: e.g. `atlas3i-ios`
   - User Access: Full Access
3. Signing: Xcode → open `ios/App/App.xcworkspace` or `App.xcodeproj` → Signing & Capabilities → Team = your Apple ID / org. Automatic signing is fine for the first upload.
4. Privacy Policy URL in App Store Connect: `https://3iatlasgame.xyz/privacy`
5. Support URL: `https://3iatlasgame.xyz`
6. Fill App Privacy (“nutrition labels”) using `docs/app-store/PRIVACY_LABELS.md`.
7. Paste listing copy from `docs/app-store/LISTING.md`; upload screenshots from `docs/app-store/screenshots/`.
8. Age rating questionnaire answers: see `docs/app-store/LISTING.md`.
9. Build locally or via CI, then upload to TestFlight and submit for review.

### Local iOS build (Mac with Xcode)

```bash
npm ci
npm run build:ios          # vite build + cap sync ios
npx cap open ios           # opens Xcode
# Product → Archive → Distribute App → App Store Connect
```

### CI → TestFlight (optional)

GitHub Actions workflow: `.github/workflows/ios-testflight.yml`

- Runner: **`macos-26`** (Xcode 26 / iOS 26 SDK — required for new App Store uploads)
- Bundle ID stays **`com.youneek.atlas3i`** (do not use `com.youneekproradar.andrewgray`)
- PRs / pushes without secrets: unsigned compile only
- With secrets: signed App Store IPA via fastlane, then `pilot` upload to TestFlight

#### Required repository secrets

| Secret | Purpose |
|--------|---------|
| `APP_STORE_CONNECT_API_KEY_ID` | ASC API Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | ASC Issuer ID |
| `APP_STORE_CONNECT_API_KEY_P8` | Full contents of the `.p8` private key (PEM text; `\n` escapes OK) |
| `APPLE_TEAM_ID` | 10-character Apple Team ID |

Create an App Store Connect **Team** API key (Users and Access → Integrations → App Store Connect API). Use **Admin** if you want Xcode automatic signing to create/manage distribution certificates on CI; **App Manager** is enough for TestFlight upload once a certificate already exists.

#### Recommended extra secrets (GitHub-hosted runners)

The ASC `.p8` authenticates App Store Connect (profiles + upload) but **does not contain** the iOS Distribution certificate private key. On ephemeral GitHub-hosted runners that key is lost when the job ends, so durable signed builds need a `.p12`:

| Secret | Purpose |
|--------|---------|
| `IOS_DISTRIBUTION_CERTIFICATE_P12` | Base64-encoded Apple Distribution `.p12` (`base64 -i dist.p12 \| pbcopy` on macOS) |
| `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD` | Password for that `.p12` (empty string secret if the p12 has no password) |

Create the Distribution certificate once in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/certificates/list) (or via Xcode on a Mac), export the private key as `.p12`, and store it only in GitHub secrets — never commit it.

Without the `.p12` secrets, the workflow falls back to Xcode automatic signing with `-allowProvisioningUpdates` and the ASC authentication key. That can work for a first upload with an **Admin** API key, but is fragile on hosted runners.

#### Run the workflow

1. Add the required secrets (and the recommended `.p12` pair).
2. Ensure App Store Connect has an iOS app whose Bundle ID is exactly `com.youneek.atlas3i`.
3. Actions → **iOS build / TestFlight** → **Run workflow**, or push to `main` under the watched paths.

---

## Google Play (optional, low extra effort)

1. Create a [Play Console](https://play.google.com/console) app: **3I/ATLAS**, package `com.youneek.atlas3i`.
2. On a machine with Android SDK:

```bash
npm run build:android
cd android && ./gradlew bundleRelease
```

3. Sign the AAB with your Play upload keystore (create once; store outside git).
4. Privacy policy: `https://3iatlasgame.xyz/privacy`
5. See `docs/play-store/README.md`.

---

## Verify before submit

- [ ] Cold launch shows splash then main menu (no browser chrome)
- [ ] Airplane mode: campaign still plays (bundled assets)
- [ ] Touch: joystick + Dim / Vent / Align / Burn / spectrum / Outburst
- [ ] Notch / home indicator: HUD and controls clear of safe areas
- [ ] `/privacy` loads on web and in the app
- [ ] `npm run build` still succeeds (Cloudflare path untouched)
