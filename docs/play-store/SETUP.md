# Google Play — owner setup (3iAtlas: The Game)

Application ID / package: **`com.youneek.atlas3i`**  
Play listing name: **`3iAtlas: The Game`**  
Privacy policy: https://3iatlasgame.xyz/privacy  
Support URL: https://3iatlasgame.xyz

Native shell: Capacitor `android/`. Billing: `@capgo/native-purchases` → Google Play Billing (same product IDs as Apple). Web Stripe Checkout is **never** shown in the Android app.

---

## 1. Create the app in Play Console

1. Open [Google Play Console](https://play.google.com/console) with your developer account.
2. **Create app** → name `3iAtlas: The Game`, default language English, type **App**, category **Game**, free.
3. Accept declarations (ads / COVID / etc. as appropriate — this game has no ads).
4. Complete **Dashboard** tasks that block testing (Privacy policy URL, app access, ads declaration, content rating, target audience, news app = No, Data safety — see notes below).
5. Under **Test → Internal testing**, create a release once you have an AAB (first upload is manual — step 6).

### Data safety (short)

- Collects: email / account (optional auth), gameplay scores (leaderboard), purchase history for cosmetic skins.
- Payments handled by Google Play for in-app products.
- Privacy policy: `https://3iatlasgame.xyz/privacy`.

---

## 2. Create the five one-time in-app products

Play Console → your app → **Monetize → Products → In-app products → Create product**.

Use **Managed product** (one-time / non-consumable). Product IDs must match Apple / code exactly:

| Product ID | Name | Description | Price (USD) |
|---|---|---|---|
| `com.youneek.atlas3i.skin.fire_comet` | FIRE COMET | Orange/red trail with ember particles | $0.99 |
| `com.youneek.atlas3i.skin.dark_matter` | DARK MATTER | Black body, purple glow, distortion effect | $1.99 |
| `com.youneek.atlas3i.skin.neon_ghost` | NEON GHOST | Transparent body, electric blue outline, ghost trail | $2.99 |
| `com.youneek.atlas3i.skin.golden_atlas` | GOLDEN ATLAS | Gold core, particle burst trail, glowing crown | $4.99 |
| `com.youneek.atlas3i.skin.void_reaper` | VOID REAPER | Black hole aesthetic, warping space trail, ultra rare | $9.99 |

Source of truth in code: `src/lib/iapProducts.js`.

Activate each product (status **Active**). Products only become purchasable after the app is published to at least an internal testing track with a billing-enabled build.

Also accept the **Payments profile / merchant** requirements in Play Console if prompted.

---

## 3. Generate an upload keystore (do this once, on your machine)

**Never commit** `.jks` / `.keystore` / base64 dumps.

```bash
npm run keystore:android
# or: bash scripts/generate-android-upload-keystore.sh
```

The script:

1. Creates `secrets/atlas3i-upload.jks` (gitignored).
2. Writes `secrets/atlas3i-upload.jks.base64.txt` (gitignored) for GitHub secrets.
3. Uses alias `atlas3i` by default (`ANDROID_KEY_ALIAS` to override).

Keep a secure offline backup of the keystore + passwords. Losing the upload key complicates Play updates (Play App Signing can still recover with Google’s help if you enrolled correctly).

### Local signed AAB (optional)

```bash
cp android/keystore.properties.example android/keystore.properties
# edit paths + passwords
npm run bundle:android
# → android/app/build/outputs/bundle/release/app-release.aab
```

---

## 4. First AAB upload (manual)

Google requires the **first** App Bundle to be uploaded in the Play Console UI (or via API after the app exists and Play App Signing is enrolled). CI cannot create the app for you.

1. Build a signed AAB locally (`npm run bundle:android` with `keystore.properties`) **or** run the GitHub Action once secrets are set and download the artifact.
2. Play Console → **Test → Internal testing → Create new release**.
3. Upload `app-release.aab`.
4. Enroll in **Play App Signing** when prompted (recommended).
5. Add at least one license tester / internal tester email.
6. Roll out the internal release.

After this first manual upload, CI can push later builds to the same **internal** track.

---

## 5. Play Developer API service account (for CI upload)

1. In Google Cloud Console, open (or create) a project linked to Play Console.
2. Enable **Google Play Android Developer API**.
3. **IAM → Service accounts → Create** (e.g. `atlas3i-play-upload`).
4. Create a JSON key for that service account; download it. **Do not commit it.**
5. In Play Console → **Users and permissions → Invite new users**, invite the service account email.
6. Grant **Admin** (or at least Release to testing tracks + View app information + Manage store presence as needed). For `fastlane supply` internal uploads, “Release apps to testing tracks” is the critical permission.
7. Accept the invite / ensure the account shows as Active (can take a few minutes to hours after first linking).

Optional server verification of purchases uses the **same** (or another) service account JSON as Supabase secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` — see §7.

---

## 6. GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**.

| Secret | Required for | Purpose |
|--------|--------------|---------|
| `ANDROID_KEYSTORE_BASE64` | Signed CI AAB | Full base64 of the upload `.jks` (from `secrets/*.base64.txt`) |
| `ANDROID_KEYSTORE_PASSWORD` | Signed CI AAB | Keystore password |
| `ANDROID_KEY_ALIAS` | Signed CI AAB | Usually `atlas3i` |
| `ANDROID_KEY_PASSWORD` | Signed CI AAB | Key password |
| `PLAY_SERVICE_ACCOUNT_JSON` | Play upload | Entire service-account JSON document (string) |

Workflow: `.github/workflows/android-release.yml` — **workflow_dispatch only** (does not run on push to `main`).

Behavior:

1. Always builds a release AAB and uploads it as artifact `atlas3i-release-aab`.
2. If keystore secrets are set → AAB is signed with your upload key.
3. If `PLAY_SERVICE_ACCOUNT_JSON` is also set → `fastlane android internal` uploads to the **internal testing** track (draft). Skip-friendly if unset.

Run: **Actions → Android release AAB / Play internal → Run workflow**.

---

## 7. Server verification (optional, documented)

Client unlocks skins locally via Play Billing immediately. When the player is signed in, the app calls Supabase Edge Function `verifyGooglePurchase` with `purchaseToken` + `productId`.

```bash
supabase functions deploy verifyGooglePurchase
```

| Supabase secret | Required? | Purpose |
|-----------------|-----------|---------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Recommended | Same Play API service account JSON |
| `GOOGLE_PLAY_PACKAGE_NAME` | Optional | Defaults to `com.youneek.atlas3i` |
| `GOOGLE_PLAY_ALLOW_UNVERIFIED` | Dev only | Set `true` to allow unlocks without API verify (never in production) |

Not required to ship the Android build; local entitlements + Restore still work offline on device.

Apple path remains `verifyApplePurchase` (unchanged).

---

## 8. Smoke checklist

- [ ] Cold launch: splash → main menu (no browser chrome)
- [ ] Airplane mode: campaign still plays
- [ ] Touch: joystick + Dim / Vent / Align / Burn; no keyboard key hints
- [ ] System back: closes Store / How to Play / pauses game; from home minimizes
- [ ] Store: Restore button present; Stripe checkout **not** offered
- [ ] `npm run build` (web) and `npm run build:ios` still succeed

See also `docs/play-store/README.md` and `RELEASE.md`.
