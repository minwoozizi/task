// 통합 스토어 — localStorage + Supabase 동기화
const STORE_KEY = 'mapri_store_v3';

const defaultState = () => ({
  incentive: [],
  market: [],
  trend: [],
  uncompleted: [],
  insurance: [],
  contactM: [],
  realtime: [],
  realtimeConfig: { manager_files: {}, send_mode: true, last_update: null },
});

const TABLE_MAP = {
  incentive: { table: 'incentive_upload', conflict: '지사,센터' },
  market: { table: 'market_report', conflict: '지사,날짜' },
  trend: { table: 'trend_3sa', conflict: '지사,날짜' },
  uncompleted: { table: 'uncompleted', conflict: '지사,센터,날짜' },
  insurance: { table: 'insurance', conflict: '지사,센터' },
  contactM: { table: 'contact_m', conflict: '지사,센터,접점코드' },
  realtime: { table: 'realtime_result', conflict: null },
};

const Store = {
  state: null,
  listeners: new Set(),
  syncStatus: 'idle',

  load() {
    try {
      this.state = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || defaultState();
    } catch {
      this.state = defaultState();
    }
    const def = defaultState();
    Object.keys(def).forEach(k => {
      if (this.state[k] === undefined) this.state[k] = def[k];
    });
  },

  save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    this.notify();
  },

  get(key) {
    if (!this.state) this.load();
    return this.state[key];
  },

  set(key, value) {
    if (!this.state) this.load();
    this.state[key] = value;
    this.save();
    this._syncKeyToServer(key);
  },

  async setKey(key, value) {
    this.state[key] = value;
    this.save();
    const map = TABLE_MAP[key];
    if (map && window.SupabaseAdapter?.enabled) {
      await window.SupabaseAdapter.deleteAll(map.table);
      if (value.length) await window.SupabaseAdapter.upsert(map.table, value.map(r => {
        const { id, created_at, updated_at, ...rest } = r;
        return rest;
      }), map.conflict);
    }
  },

  async clearKey(key) {
    this.state[key] = [];
    this.save();
    const map = TABLE_MAP[key];
    if (map && window.SupabaseAdapter?.enabled) {
      await window.SupabaseAdapter.deleteAll(map.table);
    }
  },

  async _syncKeyToServer(key) {
    const map = TABLE_MAP[key];
    if (!map || !window.SupabaseAdapter?.enabled) return;
    const rows = this.state[key] || [];
    if (!rows.length) return;
    this.setSyncStatus('syncing');
    const rowsForServer = rows.map(r => {
      const { id, created_at, updated_at, ...rest } = r;
      return rest;
    });
    const ok = await window.SupabaseAdapter.upsert(map.table, rowsForServer, map.conflict);
    this.setSyncStatus(ok ? 'ok' : 'error');
  },

  async pullFromServer() {
    if (!window.SupabaseAdapter?.enabled) return false;
    this.setSyncStatus('syncing');
    let success = true;
    for (const [key, map] of Object.entries(TABLE_MAP)) {
      const data = await window.SupabaseAdapter.fetchAll(map.table);
      if (data !== null) {
        this.state[key] = data;
      } else {
        success = false;
      }
    }
    this.save();
    this.setSyncStatus(success ? 'ok' : 'error');
    console.log('[Store] synced');
    return success;
  },

  setSyncStatus(s) { this.syncStatus = s; this.notify(); },
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  notify() { this.listeners.forEach(fn => fn()); },

  async resetAll() {
    this.state = defaultState();
    this.save();
    if (window.SupabaseAdapter?.enabled) {
      for (const map of Object.values(TABLE_MAP)) {
        await window.SupabaseAdapter.deleteAll(map.table);
      }
    }
  },

  async deleteRow(key, match) {
    if (!this.state[key]) return;
    this.state[key] = this.state[key].filter(r => {
      return !Object.entries(match).every(([k, v]) => r[k] === v);
    });
    this.save();
    const map = TABLE_MAP[key];
    if (map && window.SupabaseAdapter?.enabled) {
      await window.SupabaseAdapter.deleteWhere(map.table, match);
    }
  },

  upsertRow(key, match, patch) {
    if (!this.state[key]) this.state[key] = [];
    const idx = this.state[key].findIndex(r =>
      Object.entries(match).every(([k, v]) => r[k] === v)
    );
    if (idx >= 0) {
      this.state[key][idx] = { ...this.state[key][idx], ...match, ...patch };
    } else {
      this.state[key].push({ ...match, ...patch });
    }
    this.save();
    this._syncKeyToServer(key);
  },
};

Store.load();

window.addEventListener('load', async () => {
  if (window.SupabaseAdapter) {
    SupabaseAdapter.init();
    if (SupabaseAdapter.enabled) {
      await Store.pullFromServer();
    }
  }
});

window.Store = Store;
