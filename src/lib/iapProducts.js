/**
 * Apple IAP product catalog for cosmetic skins.
 * Single source of truth for product id ↔ skin id mapping.
 *
 * App Store Connect product IDs use:
 *   com.youneek.atlas3i.skin.<skinId>
 *
 * Prices below match the current Stripe catalog in src/game/constants.js (USD).
 * Always display StoreKit `priceString` at runtime when available.
 */

export const IAP_BUNDLE_ID = 'com.youneek.atlas3i';

export const IAP_PRODUCT_PREFIX = `${IAP_BUNDLE_ID}.skin.`;

/** @typedef {{ skinId: string, productId: string, referenceName: string, displayName: string, description: string, suggestedPriceUsd: number, applePriceTierHint: string }} IapSkinProduct */

/** @type {IapSkinProduct[]} */
export const IAP_SKIN_PRODUCTS = [
  {
    skinId: 'fire_comet',
    productId: 'com.youneek.atlas3i.skin.fire_comet',
    referenceName: 'Fire Comet Skin',
    displayName: 'FIRE COMET',
    description: 'Orange/red trail with ember particles',
    suggestedPriceUsd: 0.99,
    applePriceTierHint: 'Tier 1 ($0.99)',
  },
  {
    skinId: 'dark_matter',
    productId: 'com.youneek.atlas3i.skin.dark_matter',
    referenceName: 'Dark Matter Skin',
    displayName: 'DARK MATTER',
    description: 'Black body, purple glow, distortion effect',
    suggestedPriceUsd: 1.99,
    applePriceTierHint: 'Tier 2 ($1.99)',
  },
  {
    skinId: 'neon_ghost',
    productId: 'com.youneek.atlas3i.skin.neon_ghost',
    referenceName: 'Neon Ghost Skin',
    displayName: 'NEON GHOST',
    description: 'Transparent body, electric blue outline, ghost trail',
    suggestedPriceUsd: 2.99,
    applePriceTierHint: 'Tier 3 ($2.99)',
  },
  {
    skinId: 'golden_atlas',
    productId: 'com.youneek.atlas3i.skin.golden_atlas',
    referenceName: 'Golden Atlas Skin',
    displayName: 'GOLDEN ATLAS',
    description: 'Gold core, particle burst trail, glowing crown',
    suggestedPriceUsd: 4.99,
    applePriceTierHint: 'Tier 5 ($4.99)',
  },
  {
    skinId: 'void_reaper',
    productId: 'com.youneek.atlas3i.skin.void_reaper',
    referenceName: 'Void Reaper Skin',
    displayName: 'VOID REAPER',
    description: 'Black hole aesthetic, warping space trail, ultra rare',
    suggestedPriceUsd: 9.99,
    applePriceTierHint: 'Tier 10 ($9.99)',
  },
];

export const IAP_PRODUCT_IDS = IAP_SKIN_PRODUCTS.map((p) => p.productId);

const BY_SKIN_ID = Object.fromEntries(IAP_SKIN_PRODUCTS.map((p) => [p.skinId, p]));
const BY_PRODUCT_ID = Object.fromEntries(IAP_SKIN_PRODUCTS.map((p) => [p.productId, p]));

export function getIapProductForSkin(skinId) {
  return BY_SKIN_ID[skinId] || null;
}

export function getSkinIdForProductId(productId) {
  return BY_PRODUCT_ID[productId]?.skinId || null;
}

export function isKnownIapProductId(productId) {
  return Boolean(BY_PRODUCT_ID[productId]);
}
