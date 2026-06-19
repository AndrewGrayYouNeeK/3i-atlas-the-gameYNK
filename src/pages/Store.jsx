import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, Zap, Eye, Trash2 } from 'lucide-react';
import { api } from '@/api/supabaseApi';
import { SKINS, POWERUPS } from '../game/constants.js';
import { useAuth } from '@/lib/AuthContext';
import SkinCard from '../components/store/SkinCard.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const POWERUP_META = {
  gravity_shield: { icon: Shield, color: '#34d399', desc: 'Nullifies one gravity pull' },
  probe_scrambler: { icon: Zap, color: '#fbbf24', desc: 'Disables all probes briefly' },
  stealth_cloak: { icon: Eye, color: '#c084fc', desc: 'Emergency stealth surge' },
};

export default function Store({ onBack }) {
  const { isAuthenticated, navigateToLogin, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);
  const [unlockedSkin, setUnlockedSkin] = useState(null); // skin id after successful purchase
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const pullDistance = useRef(0);

  useEffect(() => {
    if (isAuthenticated) loadProfile();
    // Check for Stripe success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      // reload profile to get newly unlocked skin; we'll show celebration after load
      setTimeout(() => loadProfile(true), 1500);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isAuthenticated]);

  const loadProfile = async (checkNewSkin = false) => {
    const me = await api.auth.me();
    if (!me) return;
    const profiles = await api.entities.PlayerProfile.filter({ user_email: me.email });
    if (profiles?.length) {
      const newProfile = profiles[0];
      if (checkNewSkin && profile) {
        const prev = profile.owned_skins || ['default'];
        const next = newProfile.owned_skins || ['default'];
        const newlyUnlocked = next.find(id => !prev.includes(id));
        if (newlyUnlocked) setUnlockedSkin(newlyUnlocked);
      }
      setProfile(newProfile);
    }
  };

  const ownedSkins = profile?.owned_skins || ['default'];

  const equipSkin = async (skinId) => {
    if (!profile) return;
    const prev = profile;
    setProfile({ ...profile, selected_skin: skinId });
    await api.entities.PlayerProfile.update(profile.id, { selected_skin: skinId });
  };

  const handleStripeBuy = async (skin) => {
    setCheckoutLoadingId(skin.id);
    const response = await api.functions.invoke('createStripeCheckout', { priceId: skin.priceId });
    const url = response?.data?.url;
    if (url) window.open(url, '_blank');
    setCheckoutLoadingId(null);
  };

  const buyPowerup = async (powerup) => {
    if (!profile) return;
    const totalGas = Object.values(profile.gas_charges || {}).reduce((s, n) => s + (n || 0), 0);
    if (totalGas < powerup.gasCost) return;
    const gas = { ...(profile.gas_charges || {}) };
    let remaining = powerup.gasCost;
    ['methane', 'ammonia', 'xenon'].forEach((key) => {
      const spend = Math.min(gas[key] || 0, remaining);
      gas[key] = (gas[key] || 0) - spend;
      remaining -= spend;
    });
    const owned = { ...(profile.owned_powerups || {}) };
    owned[powerup.id] = (owned[powerup.id] || 0) + 1;
    setProfile({ ...profile, gas_charges: gas, owned_powerups: owned });
    await api.entities.PlayerProfile.update(profile.id, { gas_charges: gas, owned_powerups: owned });
  };

  const handleDeleteAccount = async () => {
    const me = await api.auth.me();
    if (!me) return;
    const profiles = await api.entities.PlayerProfile.filter({ user_email: me.email });
    const scores = await api.entities.ScoreEntry.filter({ user_email: me.email });
    await Promise.all([
      ...profiles.map(p => api.entities.PlayerProfile.delete(p.id)),
      ...scores.map(s => api.entities.ScoreEntry.delete(s.id)),
    ]);
    logout(true);
  };

  const handleTouchStart = (e) => {
    if ((containerRef.current?.scrollTop || 0) > 0) return;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if ((containerRef.current?.scrollTop || 0) > 0 || touchStartY.current === 0) return;
    pullDistance.current = e.touches[0].clientY - touchStartY.current;
  };
  const handleTouchEnd = async () => {
    if (pullDistance.current > 70 && !refreshing && isAuthenticated) {
      setRefreshing(true);
      await loadProfile();
      setRefreshing(false);
    }
    touchStartY.current = 0;
    pullDistance.current = 0;
  };

  const totalGas = profile ? Object.values(profile.gas_charges || {}).reduce((s, n) => s + (n || 0), 0) : 0;
  const unlockedSkinDef = unlockedSkin ? SKINS.find(s => s.id === unlockedSkin) : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(60,10,120,0.4) 0%, rgba(1,1,12,1) 60%)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div>
          <h1 className="font-orbitron text-lg font-bold text-white tracking-wider">SKIN STORE</h1>
          <p className="text-[11px] text-white/30">Unlock comet skins with real-money purchases</p>
        </div>
      </div>

      <div className="px-4 pb-10 space-y-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)' }}>
        {refreshing && <div className="py-2 text-center font-orbitron text-[12px] text-violet-300">REFRESHING...</div>}

        {!isAuthenticated ? (
          <div className="rounded-2xl p-6 text-center mt-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="font-orbitron text-sm text-white mb-2">Sign in to purchase skins</div>
            <p className="text-xs text-white/45 mb-4">Your purchases are saved to your player profile.</p>
            <button onClick={navigateToLogin} className="px-5 py-2 rounded-xl font-orbitron text-[12px] text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
              SIGN IN
            </button>
          </div>
        ) : (
          <>
            {/* ── SKIN STORE ── */}
            <section>
              <div className="font-orbitron text-[10px] tracking-[0.3em] text-white/35 mb-4">COMET SKINS</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SKINS.map((skin) => (
                  <SkinCard
                    key={skin.id}
                    skin={skin}
                    owned={ownedSkins.includes(skin.id)}
                    selected={profile?.selected_skin === skin.id || (!profile?.selected_skin && skin.id === 'default')}
                    loading={checkoutLoadingId === skin.id}
                    onBuy={() => handleStripeBuy(skin)}
                    onEquip={() => equipSkin(skin.id)}
                  />
                ))}
              </div>
            </section>

            {/* ── GAS CURRENCY ── */}
            <section>
              <div className="font-orbitron text-[10px] tracking-[0.3em] text-white/35 mb-3">GAS CURRENCY (POWERUPS)</div>
              <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="font-orbitron text-[11px] text-white/45 mb-2">AVAILABLE GAS</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[['TOTAL', String(totalGas)], ['CH₄', String(profile?.gas_charges?.methane || 0)], ['NH₃', String(profile?.gas_charges?.ammonia || 0)], ['Xe', String(profile?.gas_charges?.xenon || 0)]].map(([label, value]) => (
                    <div key={label} className="rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="font-orbitron text-sm text-white">{value}</div>
                      <div className="font-orbitron text-[8px] text-white/35 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {POWERUPS.map((powerup) => {
                  const meta = POWERUP_META[powerup.id];
                  const Icon = meta.icon;
                  const count = profile?.owned_powerups?.[powerup.id] || 0;
                  return (
                    <div key={powerup.id} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}44` }}>
                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-orbitron text-[11px] text-white">{powerup.name}</div>
                        <div className="text-[11px] text-white/40 mt-0.5">{meta.desc} · Owned: {count}</div>
                      </div>
                      <button onClick={() => buyPowerup(powerup)} className="px-4 py-2 rounded-xl font-orbitron text-[11px] text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
                        {powerup.gasCost} GAS
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── ACCOUNT ── */}
            <section>
              <div className="font-orbitron text-[10px] tracking-[0.3em] text-white/35 mb-3">ACCOUNT</div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="font-orbitron text-xs text-white mb-2">Delete Account Data</div>
                <p className="text-[11px] text-white/45 mb-4">Removes your saved profile and leaderboard scores.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full sm:w-auto px-4 py-2 rounded-xl font-orbitron text-[10px] text-red-200 flex items-center justify-center gap-2" style={{ background: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.35)' }}>
                      <Trash2 className="w-4 h-4" />
                      DELETE ACCOUNT
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove your player profile and leaderboard entries.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </section>
          </>
        )}
      </div>

      {/* 🎉 Skin Unlocked celebration overlay */}
      <AnimatePresence>
        {unlockedSkinDef && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
            onClick={() => setUnlockedSkin(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="rounded-3xl p-8 text-center max-w-xs mx-4"
              style={{
                background: 'rgba(10,5,25,0.98)',
                border: `1px solid ${unlockedSkinDef.glowColor}88`,
                boxShadow: `0 0 60px ${unlockedSkinDef.glowColor}44`,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-4xl mb-3">🎉</div>
              <div className="font-orbitron text-base font-bold text-white mb-1">SKIN UNLOCKED!</div>
              <div className="font-orbitron text-sm mb-4" style={{ color: unlockedSkinDef.glowColor }}>
                {unlockedSkinDef.name}
              </div>
              <div className="flex justify-center mb-5">
                <div className="w-24 h-24 rounded-full overflow-hidden" style={{ border: `2px solid ${unlockedSkinDef.glowColor}66` }}>
                  {/* We can't render the canvas here easily so show a glow circle */}
                  <div className="w-full h-full rounded-full flex items-center justify-center"
                    style={{ background: `radial-gradient(circle, ${unlockedSkinDef.glowColor}44, ${unlockedSkinDef.coreColor}88)` }}>
                    <div className="font-orbitron text-2xl">✦</div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-white/50 mb-5">{unlockedSkinDef.desc}</p>
              <button
                onClick={() => { equipSkin(unlockedSkin); setUnlockedSkin(null); }}
                className="w-full py-3 rounded-2xl font-orbitron text-sm font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${unlockedSkinDef.glowColor}, ${unlockedSkinDef.coreColor})`,
                  boxShadow: `0 4px 20px ${unlockedSkinDef.glowColor}55`,
                }}
              >
                EQUIP NOW
              </button>
              <button onClick={() => setUnlockedSkin(null)} className="mt-3 w-full py-2 font-orbitron text-[11px] text-white/35 hover:text-white/60">
                LATER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}