import { supabase } from '@/lib/supabaseClient';

function applyFilters(query, filters = {}) {
  let q = query;
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    q = q.eq(key, value);
  }
  return q;
}

function parseOrderBy(orderBy = '-score') {
  const descending = orderBy.startsWith('-');
  const column = descending ? orderBy.slice(1) : orderBy;
  return { column, ascending: !descending };
}

const PlayerProfile = {
  async filter(query = {}) {
    const { data, error } = await applyFilters(
      supabase.from('player_profiles').select('*'),
      query
    );
    if (error) {
      console.warn('PlayerProfile.filter failed:', error.message);
      return [];
    }
    return data || [];
  },

  async create(profileData) {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      ...profileData,
      user_id: user?.id ?? profileData.user_id,
    };
    const { data, error } = await supabase
      .from('player_profiles')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('player_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('player_profiles').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

const ScoreEntry = {
  async list(orderBy = '-score', limit = 100) {
    const { column, ascending } = parseOrderBy(orderBy);
    const { data, error } = await supabase
      .from('score_entries')
      .select('*')
      .order(column, { ascending })
      .limit(limit);
    if (error) {
      console.warn('ScoreEntry.list failed:', error.message);
      return [];
    }
    return data || [];
  },

  async filter(query = {}) {
    const { data, error } = await applyFilters(
      supabase.from('score_entries').select('*'),
      query
    );
    if (error) {
      console.warn('ScoreEntry.filter failed:', error.message);
      return [];
    }
    return data || [];
  },

  async create(scoreData) {
    const { data, error } = await supabase
      .from('score_entries')
      .insert(scoreData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('score_entries').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  },

  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
  },

  redirectToLogin(returnUrl) {
    const path = returnUrl || window.location.pathname;
    window.location.href = `/login?return=${encodeURIComponent(path)}`;
  },
};

const functions = {
  async invoke(functionName, params = {}) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: params,
      });
      if (error) {
        console.error(`Error invoking function ${functionName}:`, error);
        return { data: null, error };
      }
      return { data, error: null };
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
