# App Store Connect — In-App Purchase products

Create these **Non-Consumable** In-App Purchases for bundle ID `com.youneek.atlas3i`.

Source of truth in code: `src/lib/iapProducts.js` (scheme `com.youneek.atlas3i.skin.<skinId>`).

Suggested USD prices match the current Stripe / in-game catalog in `src/game/constants.js`.

## Products

| Product ID | Reference Name | Display Name | Description | Type | Suggested price |
|---|---|---|---|---|---|
| `com.youneek.atlas3i.skin.fire_comet` | Fire Comet Skin | FIRE COMET | Orange/red trail with ember particles | Non-Consumable | Tier 1 — $0.99 |
| `com.youneek.atlas3i.skin.dark_matter` | Dark Matter Skin | DARK MATTER | Black body, purple glow, distortion effect | Non-Consumable | Tier 2 — $1.99 |
| `com.youneek.atlas3i.skin.neon_ghost` | Neon Ghost Skin | NEON GHOST | Transparent body, electric blue outline, ghost trail | Non-Consumable | Tier 3 — $2.99 |
| `com.youneek.atlas3i.skin.golden_atlas` | Golden Atlas Skin | GOLDEN ATLAS | Gold core, particle burst trail, glowing crown | Non-Consumable | Tier 5 — $4.99 |
| `com.youneek.atlas3i.skin.void_reaper` | Void Reaper Skin | VOID REAPER | Black hole aesthetic, warping space trail, ultra rare | Non-Consumable | Tier 10 — $9.99 |

## App Store Connect steps

1. Open the **3I/ATLAS** app → **Monetization** → **In-App Purchases** → **+**.
2. Choose **Non-Consumable** for each row above.
3. Set **Product ID** exactly as listed (cannot change later).
4. Add localization (English): Display Name + Description from the table.
5. Set a price tier matching the suggested USD column.
6. Submit each product for review with the app binary (or Cleared for Sale after approval).

## Xcode / signing

1. Open `ios/App/App.xcodeproj` (or workspace).
2. Target **App** → **Signing & Capabilities** → **+ Capability** → **In-App Purchase**.
3. Ensure the App ID `com.youneek.atlas3i` has In-App Purchase enabled in the Apple Developer portal.

## Client plugin

Native billing uses `@capgo/native-purchases` (StoreKit 2). Web builds keep Stripe Checkout via `createStripeCheckout` and never call StoreKit.

## Server verification (Supabase)

Deploy the Edge Function:

```bash
supabase functions deploy verifyApplePurchase
```

### Secrets Andrew must set (Supabase project)

| Secret | Required? | Purpose |
|--------|-----------|---------|
| `APPLE_IAP_ISSUER_ID` | Recommended | App Store Connect API Issuer ID (Users and Access → Integrations → In-App Purchase / App Store Connect API) |
| `APPLE_IAP_KEY_ID` | Recommended | Key ID for the `.p8` In-App Purchase key |
| `APPLE_IAP_PRIVATE_KEY` | Recommended | Full PEM text of `AuthKey_XXXXXX.p8` (use `\n` for newlines if needed) |
| `APPLE_IAP_BUNDLE_ID` | Optional | Defaults to `com.youneek.atlas3i` |
| `APPLE_IAP_ENVIRONMENT` | Optional | `Production` (default) or `Sandbox` for TestFlight / sandbox testers |

JWS signature + Apple Root CA - G3 chain verification works without those secrets. Configure the App Store Server API secrets for an extra confirmation lookup of `transactionId`.

Never commit `.p8` keys or paste them into the repo.

### Paid Agreements

In App Store Connect → **Agreements, Tax, and Banking**, accept the **Paid Applications** agreement before IAP products become purchasable.
