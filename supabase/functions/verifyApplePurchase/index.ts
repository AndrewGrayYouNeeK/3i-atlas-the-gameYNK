import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://esm.sh/jose@5.9.6';
import * as x509 from 'https://esm.sh/@peculiar/x509@1.12.3';

/**
 * Verifies an Apple StoreKit 2 transaction JWS and unlocks the matching skin
 * on the authenticated player's profile (same ownership path as stripeWebhook).
 *
 * Always required (Supabase provides these for Edge Functions):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional but recommended — App Store Server API confirmation:
 *   APPLE_IAP_ISSUER_ID      — App Store Connect API Issuer ID
 *   APPLE_IAP_KEY_ID         — Key ID for In-App Purchase key (.p8)
 *   APPLE_IAP_PRIVATE_KEY    — Full PEM contents of AuthKey_XXXXXX.p8
 *   APPLE_IAP_BUNDLE_ID      — defaults to com.youneek.atlas3i
 *   APPLE_IAP_ENVIRONMENT    — "Production" (default) or "Sandbox"
 *
 * JWS path verifies the signature + x5c chain against the embedded
 * Apple Root CA - G3. No Apple secret is required for that path.
 */

const BUNDLE_ID = Deno.env.get('APPLE_IAP_BUNDLE_ID') || 'com.youneek.atlas3i';

const PRODUCT_TO_SKIN: Record<string, string> = {
  'com.youneek.atlas3i.skin.fire_comet': 'fire_comet',
  'com.youneek.atlas3i.skin.dark_matter': 'dark_matter',
  'com.youneek.atlas3i.skin.neon_ghost': 'neon_ghost',
  'com.youneek.atlas3i.skin.golden_atlas': 'golden_atlas',
  'com.youneek.atlas3i.skin.void_reaper': 'void_reaper',
};

// Official Apple Root CA - G3 (https://www.apple.com/certificateauthority/AppleRootCA-G3.cer)
const APPLE_ROOT_CA_G3_PEM = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----`;

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

function derToPem(derB64: string): string {
  const lines = derB64.match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

function ensureArray(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : fallback;
}

async function verifyAppleCertChain(x5c: string[]) {
  const appleRoot = new x509.X509Certificate(APPLE_ROOT_CA_G3_PEM);
  const certs = x5c.map((derB64) => new x509.X509Certificate(derToPem(derB64)));

  // Leaf → intermediates → Apple Root CA - G3
  const chain = [...certs];
  if (chain[chain.length - 1].serialNumber !== appleRoot.serialNumber) {
    chain.push(appleRoot);
  }

  const now = new Date();
  for (let i = 0; i < chain.length - 1; i++) {
    const cert = chain[i];
    const issuer = chain[i + 1];
    if (cert.notBefore > now || cert.notAfter < now) {
      throw new Error(`Certificate expired or not yet valid: ${cert.subject}`);
    }
    const ok = await cert.verify({ publicKey: issuer.publicKey, signatureOnly: true });
    if (!ok) {
      throw new Error(`Certificate chain verification failed at ${cert.subject}`);
    }
  }

  if (chain[chain.length - 1].serialNumber !== appleRoot.serialNumber) {
    throw new Error('Certificate chain is not rooted at Apple Root CA - G3');
  }
}

async function verifyAndDecodeTransactionJWS(jws: string) {
  const parts = jws.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWS format');
  }

  const header = JSON.parse(new TextDecoder().decode(jose.base64url.decode(parts[0])));
  const x5c: string[] = header.x5c;
  if (!Array.isArray(x5c) || x5c.length === 0) {
    throw new Error('JWS missing x5c certificate chain');
  }

  await verifyAppleCertChain(x5c);

  const leafPem = derToPem(x5c[0]);
  const leafKey = await jose.importX509(leafPem, header.alg || 'ES256');
  const { payload } = await jose.compactVerify(jws, leafKey);
  return JSON.parse(new TextDecoder().decode(payload)) as Record<string, unknown>;
}

async function createAppleApiToken(): Promise<string | null> {
  const issuerId = Deno.env.get('APPLE_IAP_ISSUER_ID');
  const keyId = Deno.env.get('APPLE_IAP_KEY_ID');
  let privateKeyPem = Deno.env.get('APPLE_IAP_PRIVATE_KEY') || '';
  if (!issuerId || !keyId || !privateKeyPem) return null;

  privateKeyPem = privateKeyPem.replace(/\\n/g, '\n');
  const privateKey = await jose.importPKCS8(privateKeyPem, 'ES256');
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(issuerId)
    .setIssuedAt()
    .setExpirationTime('20m')
    .setAudience('appstoreconnect-v1')
    .setSubject(BUNDLE_ID)
    .sign(privateKey);
}

async function fetchTransactionFromApple(transactionId: string) {
  const token = await createAppleApiToken();
  if (!token) return null;

  const preferred = Deno.env.get('APPLE_IAP_ENVIRONMENT') || 'Production';
  const environments = Array.from(new Set([preferred, 'Sandbox', 'Production']));

  let lastError = 'Unknown Apple API error';
  for (const env of environments) {
    const host =
      env === 'Sandbox'
        ? 'https://api.storekit-sandbox.itunes.apple.com'
        : 'https://api.storekit.itunes.apple.com';
    const res = await fetch(`${host}/inApps/v1/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) {
      lastError = `Transaction not found in ${env}`;
      continue;
    }
    if (!res.ok) {
      lastError = `Apple API ${env} HTTP ${res.status}`;
      continue;
    }
    const body = await res.json();
    if (body?.signedTransactionInfo) {
      return verifyAndDecodeTransactionJWS(body.signedTransactionInfo);
    }
  }
  throw new Error(lastError);
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
    const jwsRepresentation: string | null = body?.jwsRepresentation || null;
    const productIdHint: string | null = body?.productId || null;
    const transactionIdHint: string | null = body?.transactionId || null;

    if (!jwsRepresentation && !transactionIdHint) {
      return json(400, { error: 'Missing jwsRepresentation or transactionId' });
    }

    let transaction: Record<string, unknown> | null = null;

    if (jwsRepresentation) {
      transaction = await verifyAndDecodeTransactionJWS(jwsRepresentation);
    }

    const txId = String(transaction?.transactionId || transactionIdHint || '');
    if (txId) {
      try {
        const remote = await fetchTransactionFromApple(txId);
        if (remote) transaction = remote;
      } catch (apiError) {
        if (!transaction) throw apiError;
        console.warn('App Store Server API confirmation skipped:', (apiError as Error).message);
      }
    }

    if (!transaction) {
      return json(400, { error: 'Unable to verify Apple transaction' });
    }

    const bundleId = String(transaction.bundleId || '');
    const productId = String(transaction.productId || productIdHint || '');
    const type = String(transaction.type || '');
    const revocationDate = transaction.revocationDate;

    if (bundleId !== BUNDLE_ID) {
      return json(400, { error: `Unexpected bundleId: ${bundleId}` });
    }

    const skinId = PRODUCT_TO_SKIN[productId];
    if (!skinId) {
      return json(400, { error: `Unknown productId: ${productId}` });
    }

    if (type && type !== 'Non-Consumable') {
      return json(400, { error: `Unsupported product type: ${type}` });
    }

    if (revocationDate) {
      return json(400, { error: 'Transaction was revoked' });
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
      transactionId: transaction.transactionId,
      owned_skins: nextOwned,
    });
  } catch (error) {
    return json(500, { error: (error as Error).message || 'Verification failed' });
  }
});
