// 설정 (Supabase 연결 + 데이터 관리)
const SettingsPage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const cfg = SupabaseAdapter.getConfig();
  const [url, setUrl] = useState(cfg.url);
  const [key, setKey] = useState(cfg.key);
  const [syncing, setSyncing] = useState(false);

  const isAdmin = Auth.isAdmin();

  const applyConfig = () => {
    requireAdmin(() => {
      SupabaseAdapter.setConfig(url, key);
      toast('연결 설정 적용', 'success');
      setTimeout(() => Store.pullFromServer(), 500);
    });
  };

  const resetConfig = () => {
    requireAdmin(() => {
      SupabaseAdapter.resetToDefault();
      const c = SupabaseAdapter.getConfig();
      setUrl(c.url);
      setKey(c.key);
      toast('기본 연결로 복원', 'success');
      setTimeout(() => Store.pullFromServer(), 500);
    });
  };

  const refreshData = async () => {
    setSyncing(true);
    const ok = await Store.pullFromServer();
    setSyncing(false);
    toast(ok ? '동기화 완료' : '동기화 실패', ok ? 'success' : 'error');
  };

  const exportJSON = () => {
    const data = {
      incentive: Store.get('incentive'),
      market: Store.get('market'),
      trend: Store.get('trend'),
      uncompleted: Store.get('uncompleted'),
      insurance: Store.get('insurance'),
      contactM: Store.get('contactM'),
      realtime: Store.get('realtime'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapri-backup-${U.todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('백업 완료', 'success');
  };

  const resetAll = () => {
    requireAdmin(async () => {
      const ok = await confirmDialog({
        title: '전체 데이터 초기화',
        message: '모든 데이터가 영구 삭제됩니다. 계속하시겠습니까? (Supabase 포함)',
        danger: true, okText: '삭제',
      });
      if (ok) {
        await Store.resetAll();
        toast('초기화 완료', 'success');
      }
    });
  };

  const clearCenter = (key, label) => {
    requireAdmin(async () => {
      const ok = await confirmDialog({
        title: `${label} 전체 삭제`,
        message: `${label} 데이터를 모두 삭제하시겠습니까?`,
        danger: true, okText: '삭제',
      });
      if (ok) {
        Store.set(key, []);
        // 서버도
        const map = { incentive: 'incentive_upload', market: 'market_report', trend: 'trend_3sa', uncompleted: 'uncompleted', insurance: 'insurance', contactM: 'contact_m', realtime: 'realtime_result' }[key];
        if (map && SupabaseAdapter.enabled) await SupabaseAdapter.deleteAll(map);
        toast(`${label} 삭제 완료`, 'success');
      }
    });
  };

  const dataStats = [
    { key: 'incentive', label: '장려금 업로드' },
    { key: 'market', label: '시장동향' },
    { key: 'trend', label: '3사 특이동향' },
    { key: 'uncompleted', label: '미개동' },
    { key: 'insurance', label: '보증보험' },
    { key: 'contactM', label: '접점담당M' },
    { key: 'realtime', label: '실시간 실적' },
  ];

  const my = Session.get();

  return (
    <div className="stack-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">설정</h1>
          <p className="page-desc">Supabase 연결 · 데이터 백업 · 초기화</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span>내 센터 설정</span>
          {my && <button className="btn btn-sm btn-ghost" onClick={() => { Session.clear(); force(x => x + 1); toast('내 센터 해제', 'success'); }}>해제</button>}
        </div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 10px' }}>
          내 센터로 설정하면 해당 센터 데이터는 관리자 인증 없이 바로 입력할 수 있습니다.
        </p>
        {my ? (
          <div className="my-center-badge">
            <Icon name="building" size={14}/> {my.branch} · {my.center}
          </div>
        ) : (
          <div className="grid grid-2">
            <select className="select" id="sess-branch">
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="select" id="sess-center" style={{ flex: 1 }}>
                <option value="">센터 선택</option>
                {ORG[BRANCHES[0]].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-coral" onClick={() => {
                const b = document.getElementById('sess-branch').value;
                const c = document.getElementById('sess-center').value;
                if (!c) { toast('센터를 선택하세요', 'error'); return; }
                Session.set(b, c);
                toast(`${b} ${c} 설정`, 'success');
              }}>설정</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <span>☁️ Supabase 연결</span>
          <span className={`sync-indicator ${SupabaseAdapter.enabled ? 'ok' : 'idle'}`}>
            <span className="dot"></span>
            {SupabaseAdapter.enabled ? '연결됨' : '미연결'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 12px' }}>
          Supabase 원격 DB로 팀 전체가 데이터를 실시간 공유합니다. 기본 팀 DB가 이미 연결되어 있습니다.
        </p>
        {!isAdmin && (
          <div style={{ padding: 10, background: 'var(--gray-50)', borderRadius: 8, fontSize: 12, color: 'var(--gray-700)', marginBottom: 12 }}>
            🔒 연결 설정 변경은 <button onClick={() => requireAdmin(() => {})} style={{ color: 'var(--blue)', textDecoration: 'underline', padding: 0, background: 'none' }}>관리자 인증</button> 후 가능합니다.
          </div>
        )}
        <div className="form-row">
          <label className="form-label">Project URL</label>
          <input type="text" className="input" value={url} onChange={e => setUrl(e.target.value)} disabled={!isAdmin} placeholder="https://xxxxx.supabase.co" />
        </div>
        <div className="form-row">
          <label className="form-label">Anon / Publishable Key</label>
          <input type="text" className="input" value={key} onChange={e => setKey(e.target.value)} disabled={!isAdmin} placeholder="sb_publishable_..." />
        </div>
        <div className="toolbar">
          <button className="btn btn-coral" onClick={applyConfig} disabled={!isAdmin}>연결 적용</button>
          <button className="btn btn-ghost" onClick={resetConfig} disabled={!isAdmin}>기본값으로 복원</button>
          <button className="btn btn-ghost" onClick={refreshData} disabled={syncing}>
            <Icon name="refresh" size={14}/> {syncing ? '동기화 중...' : '서버에서 새로고침'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">데이터 현황</div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>데이터</th><th style={{ width: 100 }} className="num">건수</th><th style={{ width: 100 }}></th></tr></thead>
            <tbody>
              {dataStats.map(({ key, label }) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td className="num">{U.fmtNum((Store.get(key) || []).length)}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => clearCenter(key, label)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">백업 / 초기화</div>
        <div className="toolbar">
          <button className="btn btn-ghost" onClick={exportJSON}><Icon name="download" size={14}/> JSON 백업</button>
          <button className="btn btn-danger" onClick={resetAll}><Icon name="trash" size={14}/> 전체 초기화</button>
        </div>
      </div>
    </div>
  );
};

window.SettingsPage = SettingsPage;
