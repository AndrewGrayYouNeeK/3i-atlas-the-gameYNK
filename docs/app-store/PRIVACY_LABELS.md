# App Store Privacy “Nutrition Labels”

Answer these in App Store Connect → App Privacy. Matches `ios/App/App/PrivacyInfo.xcprivacy` and the public policy at `/privacy`.

## Tracking

- **Do you or your third-party partners use data for tracking?** → **No**

## Data collection

Collect data only when the player opts into an **optional account** (leaderboard / profile / store). Guests playing offline: **no data collected**.

### Contact Info

| Data type | Collected? | Linked to identity? | Used for tracking? | Purposes |
|-----------|------------|---------------------|--------------------|----------|
| Email Address | Yes (optional account) | Yes | No | App Functionality |
| Name (display name) | Yes (optional) | Yes | No | App Functionality |

### User Content / Gameplay

| Data type | Collected? | Linked? | Tracking? | Purposes |
|-----------|------------|---------|-----------|----------|
| Gameplay Content (scores, achievements, missions completed) | Yes (optional account) | Yes | No | App Functionality |
| Customer Support | No (email support outside the app) | — | — | — |

### Purchases

| Data type | Collected? | Linked? | Tracking? | Purposes |
|-----------|------------|---------|-----------|----------|
| Purchase History (cosmetic skins) | Yes if store used | Yes | No | App Functionality |

Payment card data is handled by Stripe (web) — not stored by the app. Until native StoreKit IAP is added, treat paid skins as web-only.

### Identifiers / Usage / Diagnostics

| Data type | Collected? |
|-----------|------------|
| Device ID | No |
| Advertising Data | No |
| Product Interaction analytics SDKs | No |
| Crash Data (third-party) | No (unless you later add a crash reporter) |
| Performance Data | No |

### On-device only

Local storage / UserDefaults for session UI preferences — **not** declared as collected data leaving the device. PrivacyInfo lists UserDefaults API access reason **CA92.1** (app functionality).

## Privacy Policy URL

`https://3iatlasgame.xyz/privacy`
