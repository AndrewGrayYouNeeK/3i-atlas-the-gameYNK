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

Add repository secrets (skipped gracefully if missing):

| Secret | Purpose |
|--------|---------|
| `APP_STORE_CONNECT_API_KEY_ID` | ASC API Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | ASC Issuer ID |
| `APP_STORE_CONNECT_API_KEY_P8` | Contents of the `.p8` private key |
| `APPLE_TEAM_ID` | 10-character Team ID |
| `MATCH_GIT_BASIC_AUTHORIZATION` or cert secrets | Only if you switch from automatic Xcode Cloud/manual signing to match — current workflow uses `xcodebuild` + `fastlane pilot` with an ASC API key when present |

Create an App Store Connect API key (Developer → Users and Access → Integrations → App Store Connect API) with **App Manager** or **Admin**.

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
