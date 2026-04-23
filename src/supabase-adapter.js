// Supabase 어댑터 — 테이블과 로컬 데이터 구조 매핑
const SB_URL_KEY = 'mapri_sb_url';
const SB_KEY_KEY = 'mapri_sb_key';

// 기본 팀 DB
const DEFAULT_SB_URL = 'https://ckhkryiofmthldzqujrm.supabase.co';
const DEFAULT_SB_KEY = 'sb_publishable_2faLK1yCtrcWr37aecfz4g_UjsUuncL';

const SupabaseAdapter = {
  client: null,
  enabled: false,

  getConfig() {
    const url = localStorage.getItem(SB_URL_KEY) || DEFAULT_SB_URL;
    const key = localStorage.getItem(SB_KEY_KEY) || DEFAULT_SB_KEY;
    return { url, key };
  },

  setConfig(url, key) {
    if (url) localStorage.setItem(SB_URL_KEY, url);
    else localStorage.removeItem(SB_URL_KEY);
    if (key) localStorage.setItem(SB_KEY_KEY, key);
    else localStorage.removeItem(SB_KEY_KEY);
    this.init();
  },

  resetToDefault() {
    localStorage.removeItem(SB_URL_KEY);
    localStorage.removeItem(SB_KEY_KEY);
    this.init();
  },

  init() {
    const { url, key } = this.getConfig();
    if (url && key && window.supabase) {
      try {
        this.client = window.supabase.createClient(url, key);
        this.enabled = true;
        console.log('[Supabase] connected:', url);
      } catch (e) {
        console.error('[Supabase] init failed:', e);
        this.client = null;
        this.enabled = false;
      }
    } else {
      this.client = null;
      this.enabled = false;
    }
  },

  // 테이블 전체 조회
  async fetchAll(table) {
    if (!this.enabled) return null;
    try {
      const { data, error } = await this.client.from(table).select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error(`[Supabase] fetchAll(${table}):`, e.message);
      return null;
    }
  },

  // upsert (단일/배열)
  async upsert(table, rows, onConflict) {
    if (!this.enabled) return false;
    try {
      const arr = Array.isArray(rows) ? rows : [rows];
      if (!arr.length) return true;
      let q = this.client.from(table).upsert(arr);
      if (onConflict) q = this.client.from(table).upsert(arr, { onConflict });
      const { error } = await q;
      if (error) throw error;
      return true;
    } catch (e) {
      console.error(`[Supabase] upsert(${table}):`, e.message);
      return false;
    }
  },

  // 조건부 삭제
  async deleteWhere(table, match) {
    if (!this.enabled) return false;
    try {
      let q = this.client.from(table).delete();
      Object.entries(match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      if (error) throw error;
      return true;
    } catch (e) {
      console.error(`[Supabase] delete(${table}):`, e.message);
      return false;
    }
  },

  // 전체 삭제 (RLS 우회 불가 — policy 허용 필요)
  async deleteAll(table) {
    if (!this.enabled) return false;
    try {
      const { error } = await this.client.from(table).delete().neq('id', -1);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error(`[Supabase] deleteAll(${table}):`, e.message);
      return false;
    }
  },
};

window.SupabaseAdapter = SupabaseAdapter;
