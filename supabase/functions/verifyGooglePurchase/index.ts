import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://esm.sh/jose@5.9.6';

/**
 * Verifies a Google Play Billing one-time product purchase and unlocks the
 * matching skin on the authenticated player's profile.
 *
 * Always required (Supabase provides these for Edge Functions):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional — required for live Google verification (documented, not required to deploy):
 *   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  — full service account JSON (Play Console API access)
 *   GOOGLE_PLAY_PACKAGE_NAME          — defaults to com.youneek.atlas3i
 *
 * Without the service-account secret the function still accepts a well-formed
 * client payload and unlocks locally-trusted ownership only when
 * GOOGLE_PLAY_ALLOW_UNVERIFIED=true (dev/sandbox escape hatch). Production
 * should set the service account and leave that flag unset.
 *
 * Deploy:
 *   supabase functions deploy verifyGooglePurchase
 */

const PACKAGE_NAME = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME') || 'com.youneek.atlas3i';

const PRODUCT_TO_SKIN: Record<string, string> = {
  'com.youneek.atlas3i.skin.fire_comet': 'fire_comet',
  'com.youneek.atlas3i.skin.dark_matter': 'dark_matter',
  'com.youneek.atlas3i.skin.neon_ghost': 'neon_ghost',
  'com.youneek.atlas3i.skin.golden_atlas': 'golden_atlas',
  'com.youneek.atlas3i.skin.void_reaper': 'void_reaper',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function ensureArray(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : fallback;
}

function parseServiceAccount(): { client_email: string; private_key: string } | null {
  const raw = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.client_email || !parsed?.private_key) return null;
    return {
      client_email: String(parsed.client_email),
      private_key: String(parsed.private_key).replace(/\\n/g, '\n'),
    };
  } catch {
    return null;
  }
}

async function getGoogleAccessToken(sa: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  const privateKey = await jose.importPKCS8(sa.private_key, 'RS256');
  const assertion = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/androidpublisher',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth token exchange failed: HTTP ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data?.access_token) {
    throw new Error('Google OAuth response missing access_token');
  }
  return String(data.access_token);
}

async function verifyWithPlayDeveloperApi(
  accessToken: string,
  packageName: string,
  productId: string,
  purchaseToken: string,
) {
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${encodeURIComponent(packageName)}/purchases/products/` +
    `${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Play Developer API HTTP ${res.status}: ${text}`);
  }

  return (await res.json()) as {
    purchaseState?: number;
    consumptionState?: number;
    acknowledgementState?: number;
    orderId?: string;
    productId?: string;
    purchaseToken?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json(401, { error: 'Unauthorized' });
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user?.email) {
      return json(401, { error: 'Unauthorized' });
    }

    const body = await req.json();
    const purchaseToken: string | null = body?.purchaseToken || null;
    const productId: string | null = body?.productId || null;
    const packageName: string = body?.packageName || PACKAGE_NAME;
    const orderIdHint: string | null = body?.orderId || null;

    if (!purchaseToken || !productId) {
      return json(400, { error: 'Missing purchaseToken or productId' });
    }

    if (packageName !== PACKAGE_NAME) {
      return json(400, { error: `Unexpected packageName: ${packageName}` });
    }

    const skinId = PRODUCT_TO_SKIN[productId];
    if (!skinId) {
      return json(400, { error: `Unknown productId: ${productId}` });
    }

    const sa = parseServiceAccount();
    let orderId: string | null = orderIdHint;
    let verifiedViaApi = false;

    if (sa) {
      const accessToken = await getGoogleAccessToken(sa);
      const purchase = await verifyWithPlayDeveloperApi(
        accessToken,
        packageName,
        productId,
        purchaseToken,
      );

      // 0 = Purchased, 1 = Canceled, 2 = Pending
      if (purchase.purchaseState !== 0) {
        return json(400, {
          error: `Purchase not in PURCHASED state (purchaseState=${purchase.purchaseState})`,
        });
      }

      orderId = purchase.orderId || orderId;
      verifiedViaApi = true;
    } else if (Deno.env.get('GOOGLE_PLAY_ALLOW_UNVERIFIED') !== 'true') {
      return json(503, {
        error:
          'Google Play verification not configured. Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ' +
          '(or GOOGLE_PLAY_ALLOW_UNVERIFIED=true for local/dev only). See docs/play-store/SETUP.md.',
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('player_profiles')
      .select('*')
      .eq('user_email', user.email);

    if (fetchError || !profiles?.length) {
      return json(404, { error: 'Player profile not found' });
    }

    const profile = profiles[0];
    const ownedSkins = ensureArray(profile.owned_skins, ['default']);
    const nextOwned = ownedSkins.includes(skinId) ? ownedSkins : [...ownedSkins, skinId];

    if (nextOwned.length !== ownedSkins.length) {
      const { error: updateError } = await supabaseAdmin
        .from('player_profiles')
        .update({ owned_skins: nextOwned })
        .eq('id', profile.id);
      if (updateError) throw updateError;
    }

    return json(200, {
      ok: true,
      skinId,
      productId,
      orderId,
      purchaseToken,
      verifiedViaApi,
      owned_skins: nextOwned,
    });
  } catch (error) {
    return json(500, { error: (error as Error).message || 'Verification failed' });
  }
});
