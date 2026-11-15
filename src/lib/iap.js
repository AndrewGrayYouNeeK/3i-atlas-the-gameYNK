import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { api } from '@/api/supabaseApi';
import {
  IAP_PRODUCT_IDS,
  getIapProductForSkin,
  getSkinIdForProductId,
  isKnownIapProductId,
} from './iapProducts.js';
import { addLocalIapOwnedSkin, addLocalIapOwnedSkins } from './iapLocalOwnership.js';
import { isNativeApp } from './native.js';

function isUserCancel(error) {
  const message = String(error?.message || error || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  return (
    code.includes('cancel') ||
    message.includes('cancel') ||
    message.includes('user cancelled') ||
    message.includes('user canceled')
  );
}

function nativePlatform() {
  return Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
}

/**
 * Load StoreKit / Play Billing product metadata (localized prices). Safe no-op on web.
 * @returns {Promise<Record<string, { priceString?: string, title?: string, description?: string }>>}
 */
export async function loadIapStoreProducts() {
  if (!isNativeApp()) return {};
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) return {};

    const { products } = await NativePurchases.getProducts({
      productIdentifiers: IAP_PRODUCT_IDS,
      productType: PURCHASE_TYPE.INAPP,
    });

    const bySkinId = {};
    for (const product of products || []) {
      const skinId = getSkinIdForProductId(product.identifier);
      if (!skinId) continue;
      bySkinId[skinId] = {
        priceString: product.priceString,
        title: product.title,
        description: product.description,
      };
    }
    return bySkinId;
  } catch (error) {
    console.warn('IAP getProducts failed:', error);
    return {};
  }
}

async function recordOwnershipOnServer(transaction) {
  const platform = nativePlatform();
  const me = await api.auth.me();
  if (!me) {
    return { ok: false, deferred: true, error: 'Not signed in' };
  }

  if (platform === 'android') {
    const purchaseToken = transaction?.purchaseToken || transaction?.transactionId || null;
    const productId = transaction?.productIdentifier || transaction?.productId || null;
    if (!purchaseToken || !productId) {
      return { ok: false, error: 'Missing Google Play purchase token' };
    }

    const { data, error } = await api.functions.invoke('verifyGooglePurchase', {
      purchaseToken,
      productId,
      packageName: 'com.youneek.atlas3i',
      orderId: transaction?.orderId || null,
    });

    if (error || data?.error) {
      return { ok: false, error: error?.message || data?.error || 'Server verification failed' };
    }
    return { ok: true, data };
  }

  // iOS (StoreKit 2)
  if (!transaction?.jwsRepresentation && !transaction?.transactionId) {
    return { ok: false, error: 'Missing transaction proof' };
  }

  const { data, error } = await api.functions.invoke('verifyApplePurchase', {
    jwsRepresentation: transaction.jwsRepresentation || null,
    transactionId: transaction.transactionId || null,
    productId: transaction.productIdentifier || null,
  });

  if (error || data?.error) {
    return { ok: false, error: error?.message || data?.error || 'Server verification failed' };
  }
  return { ok: true, data };
}

/**
 * Purchase a non-consumable skin via Apple IAP or Google Play Billing.
 * Always unlocks locally on success; syncs to Supabase when signed in.
 * Web builds must use Stripe — never call this on web.
 */
export async function purchaseSkinIap(skinId) {
  if (!isNativeApp()) {
    throw new Error('Native in-app purchases are only available in the iOS/Android app');
  }

  const catalog = getIapProductForSkin(skinId);
  if (!catalog) {
    throw new Error(`No IAP product mapped for skin: ${skinId}`);
  }

  const { isBillingSupported } = await NativePurchases.isBillingSupported();
  if (!isBillingSupported) {
    throw new Error('In-app purchases are not available on this device');
  }

  let transaction;
  try {
    transaction = await NativePurchases.purchaseProduct({
      productIdentifier: catalog.productId,
      productType: PURCHASE_TYPE.INAPP,
    });
  } catch (error) {
    if (isUserCancel(error)) {
      return { cancelled: true, skinId: null };
    }
    throw error;
  }

  const unlockedSkinId = getSkinIdForProductId(transaction?.productIdentifier) || skinId;
  addLocalIapOwnedSkin(unlockedSkinId);

  const server = await recordOwnershipOnServer(transaction);
  return {
    cancelled: false,
    skinId: unlockedSkinId,
    transaction,
    serverSynced: Boolean(server.ok),
    serverDeferred: Boolean(server.deferred),
    serverError: server.error || null,
    platform: nativePlatform(),
  };
}

/**
 * Sync current StoreKit / Play entitlements to local storage + Supabase.
 * Safe to call when a signed-in player opens the native Store.
 */
export async function syncOwnedSkinsFromStoreKit() {
  return syncOwnedSkinsFromNativeStore();
}

/** Platform-agnostic alias for entitlement sync. */
export async function syncOwnedSkinsFromNativeStore() {
  if (!isNativeApp()) {
    return { restoredSkinIds: [], serverSyncedCount: 0 };
  }

  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      return { restoredSkinIds: [], serverSyncedCount: 0 };
    }

    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.INAPP,
      onlyCurrentEntitlements: true,
    });

    const restoredSkinIds = [];
    let serverSyncedCount = 0;

    for (const purchase of purchases || []) {
      if (!isKnownIapProductId(purchase.productIdentifier)) continue;
      if (purchase.revocationDate) continue;
      if (purchase.isActive === false) continue;
      const skinId = getSkinIdForProductId(purchase.productIdentifier);
      if (!skinId) continue;
      addLocalIapOwnedSkin(skinId);
      restoredSkinIds.push(skinId);
      const server = await recordOwnershipOnServer(purchase);
      if (server.ok) serverSyncedCount += 1;
    }

    return {
      restoredSkinIds: Array.from(new Set(restoredSkinIds)),
      serverSyncedCount,
      platform: nativePlatform(),
    };
  } catch (error) {
    console.warn('IAP entitlement sync failed:', error);
    return { restoredSkinIds: [], serverSyncedCount: 0 };
  }
}

/**
 * Restore non-consumable purchases (required by Apple; also used on Play).
 * Unlocks matching skins locally and syncs to Supabase when signed in.
 */
export async function restoreSkinPurchases() {
  if (!isNativeApp()) {
    return { restoredSkinIds: [], serverSyncedCount: 0 };
  }

  const { isBillingSupported } = await NativePurchases.isBillingSupported();
  if (!isBillingSupported) {
    throw new Error('In-app purchases are not available on this device');
  }

  await NativePurchases.restorePurchases();

  const { purchases } = await NativePurchases.getPurchases({
    productType: PURCHASE_TYPE.INAPP,
    onlyCurrentEntitlements: true,
  });

  const restoredSkinIds = [];
  let serverSyncedCount = 0;

  for (const purchase of purchases || []) {
    if (!isKnownIapProductId(purchase.productIdentifier)) continue;
    if (purchase.revocationDate) continue;
    if (purchase.isActive === false) continue;

    const skinId = getSkinIdForProductId(purchase.productIdentifier);
    if (!skinId) continue;

    addLocalIapOwnedSkin(skinId);
    restoredSkinIds.push(skinId);

    const server = await recordOwnershipOnServer(purchase);
    if (server.ok) serverSyncedCount += 1;
  }

  addLocalIapOwnedSkins(restoredSkinIds);

  return {
    restoredSkinIds: Array.from(new Set(restoredSkinIds)),
    serverSyncedCount,
    platform: nativePlatform(),
  };
}
