import { base44 } from '@/api/base44Client';

/**
 * API wrapper using Base44 SDK — drop-in replacement for the old Supabase API.
 * All pages (Game, MainMenu, Store, Leaderboard) import { api } from '@/api/supabaseApi'
 * and use api.entities.PlayerProfile / api.entities.ScoreEntry / api.auth / api.functions.
 */

const PlayerProfile = {
  async filter(query) {
    return await base44.entities.PlayerProfile.filter(query);
  },
  async create(profileData) {
    return await base44.entities.PlayerProfile.create(profileData);
  },
  async update(id, updates) {
    return await base44.entities.PlayerProfile.update(id, updates);
  },
  async delete(id) {
    return await base44.entities.PlayerProfile.delete(id);
  },
};

const ScoreEntry = {
  async list(orderBy = '-score', limit = 100) {
    return await base44.entities.ScoreEntry.list(orderBy, limit);
  },
  async filter(query) {
    return await base44.entities.ScoreEntry.filter(query);
  },
  async create(scoreData) {
    return await base44.entities.ScoreEntry.create(scoreData);
  },
  async delete(id) {
    return await base44.entities.ScoreEntry.delete(id);
  },
};

const auth = {
  async me() {
    try {
      return await base44.auth.me();
    } catch {
      return null;
    }
  },
  async logout(redirectUrl) {
    base44.auth.logout(redirectUrl || '/');
  },
  async redirectToLogin(returnUrl) {
    base44.auth.redirectToLogin(returnUrl);
  },
};

const functions = {
  async invoke(functionName, params) {
    try {
      const response = await base44.functions.invoke(functionName, params);
      return { data: response.data, error: null };
    } catch (error) {
      console.error(`Error invoking function ${functionName}:`, error);
      return { data: null, error };
    }
  },
};

export const api = {
  entities: { PlayerProfile, ScoreEntry },
  auth,
  functions,
};