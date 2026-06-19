import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const PRODUCT_UNLOCKS = {
  // New skin store skins
  'price_skin_fire_comet':   { type: 'skin', skinId: 'fire_comet' },
  'price_skin_dark_matter':  { type: 'skin', skinId: 'dark_matter' },
  'price_skin_neon_ghost':   { type: 'skin', skinId: 'neon_ghost' },
  'price_skin_golden_atlas': { type: 'skin', skinId: 'golden_atlas' },
  'price_skin_void_reaper':  { type: 'skin', skinId: 'void_reaper' },
  // Legacy products
  'price_1TFOBNBLkDedke6Gi5v3wOvT': { type: 'skin', skinId: 'oumuamua_ghost' },
  'price_1TFOBOBLkDedke6GqHjnryP7': { type: 'skin', skinId: 'halleys_echo' },
  'price_1TFOBOBLkDedke6GIUjqNx1G': { type: 'skin', skinId: 'dark_matter_cloak' },
  'price_1TFOBPBLkDedke6GHA8rk4l4': { type: 'skin', skinId: 'solar_phantom' },
  'price_1TFOBQBLkDedke6GpiB81YRc': { type: 'trail', trailId: 'fire_trail' },
  'price_1TFOBRBLkDedke6GHJo3MQTs': { type: 'trail', trailId: 'ice_crystal_trail' },
  'price_1TFOBRBLkDedke6G0qsbsX35': { type: 'trail', trailId: 'plasma_trail' },
  'price_1TFOBSBLkDedke6Ghsj9MmUd': { type: 'powerup', powerupId: 'stealth_cloak', quantity: 10 },
  'price_1TFOBTBLkDedke6GbCLUk0UB': { type: 'powerup', powerupId: 'probe_scrambler', quantity: 10 },
  'price_1TFOBUBLkDedke6GxxLO5EsR': { type: 'bundle', powerups: { gravity_shield: 5, probe_scrambler: 5, stealth_cloak: 5 } },
  'price_1TFOBUBLkDedke6GqsJSX6YS': { type: 'mission_pack', unlocks_levels: [4, 5, 6] },
};

const ensureArray = (value: any, fallback: any[] = []): any[] =>
  Array.isArray(value) ? value : fallback;

const ensureObject = (value: any, fallback: Record<string, any> = {}): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || '',
    );

    // Use service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = event.data?.object as any;
    const userEmail = session?.metadata?.user_email;
    const priceId = session?.metadata?.price_id;

    if (!userEmail || !priceId) {
      return new Response(JSON.stringify({ error: 'Missing purchase metadata' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const unlock = PRODUCT_UNLOCKS[priceId as keyof typeof PRODUCT_UNLOCKS];
    if (!unlock) {
      return new Response(JSON.stringify({ error: 'Unknown price ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('player_profiles')
      .select('*')
      .eq('user_email', userEmail);

    if (fetchError || !profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: 'Player profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const profile = profiles[0];
    const updates: any = {};

    if (unlock.type === 'skin') {
      const ownedSkins = ensureArray(profile.owned_skins, ['default']);
      updates.owned_skins = ownedSkins.includes(unlock.skinId)
        ? ownedSkins
        : [...ownedSkins, unlock.skinId];
    }

    if (unlock.type === 'trail') {
      const ownedTrails = ensureArray(profile.owned_trails, []);
      updates.owned_trails = ownedTrails.includes(unlock.trailId)
        ? ownedTrails
        : [...ownedTrails, unlock.trailId];
    }

    if (unlock.type === 'powerup') {
      const ownedPowerups = ensureObject(profile.owned_powerups, {
        gravity_shield: 0,
        probe_scrambler: 0,
        stealth_cloak: 0,
      });
      updates.owned_powerups = {
        ...ownedPowerups,
        [unlock.powerupId]: (ownedPowerups[unlock.powerupId] || 0) + unlock.quantity,
      };
    }

    if (unlock.type === 'bundle') {
      const ownedPowerups = ensureObject(profile.owned_powerups, {
        gravity_shield: 0,
        probe_scrambler: 0,
        stealth_cloak: 0,
      });
      updates.owned_powerups = {
        ...ownedPowerups,
        gravity_shield: (ownedPowerups.gravity_shield || 0) + (unlock.powerups.gravity_shield || 0),
        probe_scrambler: (ownedPowerups.probe_scrambler || 0) + (unlock.powerups.probe_scrambler || 0),
        stealth_cloak: (ownedPowerups.stealth_cloak || 0) + (unlock.powerups.stealth_cloak || 0),
      };
    }

    if (unlock.type === 'mission_pack') {
      const unlockedLevels = ensureArray(profile.unlocked_levels, [0, 1, 2, 3]);
      updates.unlocked_levels = Array.from(
        new Set([...unlockedLevels, ...unlock.unlocks_levels])
      ).sort((a, b) => a - b);
    }

    const { error: updateError } = await supabaseAdmin
      .from('player_profiles')
      .update(updates)
      .eq('id', profile.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ received: true, unlocked: true, priceId, userEmail }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
