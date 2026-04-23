// 설정 - Supabase 연결 + 내 센터 + CSV 가져오기/내보내기 + 데이터 관리
const SettingsPage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Session.subscribe(() => force(x => x + 1)), []);

  const cfg = SupabaseAdapter.getConfig();
  const [url, setUrl] = useState(cfg.url);
  const [key, setKey] = useState(cfg.key);
  const [syncing, setSyncing] = useState(false);
  const [myBranch, setMyBranch] = useState(Session.get()?.branch || BRANCHES[0]);
  const [myCenter, setMyCenter] = useState(Session.get()?.center || '');
  const fileInputRef = useRef();
  const [uploadKey, setUploadKey] = useState(null);

  const isAdmin = Auth.isAdmin();
  const my = Session.get();

  const refreshData = async () => {
    setSyncing(true);
    const ok = await Store.pullFromServer();
    setSyncing(false);
    toast(ok ? '동기화 완료' : '동기화 실패', ok ? 'success' : 'error');
  };

  const applyConfig = () => {
    requireAdmin(() => {
      SupabaseAdapter.setConfig(url, key);
      toast('연결 적용', 'success');
      setTimeout(() => Store.pullFromServer(), 500);
    });
  };

  const resetConfig = () => {
    requireAdmin(() => {
      SupabaseAdapter.resetToDefault();
      const c = SupabaseAdapter.getConfig();
      setUrl(c.url); setKey(c.key);
      toast('기본값 복원', 'success');
      setTimeout(() => Store.pullFromServer(), 500);
    });
  };

  const saveMyCenter = () => {
    if (!myCenter) { toast('센터를 선택하세요', 'error'); return; }
    Session.set(myBranch, myCenter);
    toast(`${myBranch} ${myCenter} 설정`, 'success');
  };

  const resetAll = () => {
    requireAdmin(async () => {
      const ok = await confirmDialog({
        title: '전체 데이터 초기화',
        message: '모든 데이터가 영구 삭제됩니다 (Supabase 포함).',
        danger: true, okText: '삭제',
      });
      if (ok) {
        await Store.resetAll();
        toast('초기화 완료', 'success');
      }
    });
  };

  // CSV 다운로드
  const KEY_INFO = {
    incentive: { label: '장려금 업로드', fields: ['지사', '센터', '업로드일', '완료'] },
    market: { label: '시장동향', fields: ['지사', '날짜', '모델단가', '추가정책', '완료'] },
    trend: { label: '3사 특이동향', fields: ['지사', '날짜', 'S사', 'L사', 'K사'] },
    uncompleted: { label: '미개동', fields: ['지사', '센터', '날짜', '무선', '유선전체', '유선신규'] },
    insurance: { label: '보증보험', fields: ['지사', '센터', '등록점수', '만기1개월', '만기2개월', '만기', '업데이트'] },
    contactM: { label: '접점담당M', fields: ['지사', '센터', '접점코드', '접점명', '사번'] },
    realtime: { label: '실시간 실적', fields: ['지사', '센터', '목표', '실적', '월목표', '월실적'] },
  };

  const downloadCSV = (key) => {
    const rows = Store.get(key) || [];
    const info = KEY_INFO[key];
    const fields = info.fields;
    const lines = [fields.join(',')];
    rows.forEach(r => {
      lines.push(fields.map(f => {
        let v = r[f];
        if (typeof v === 'object') v = JSON.stringify(v);
        const s = String(v ?? '').replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href; a.download = `${info.label}_${U.todayISO()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    toast(`${info.label} CSV 다운로드`, 'success');
  };

  const downloadAllCSV = () => {
    Object.keys(KEY_INFO).forEach((k, i) => {
      setTimeout(() => downloadCSV(k), i * 200);
    });
  };

  const startUpload = (key) => {
    requireAdmin(() => {
      setUploadKey(key);
      fileInputRef.current.click();
    });
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadKey) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const parsed = U.parseCSV(text);
      if (!parsed.length) {
        toast('빈 파일 또는 파싱 실패', 'error');
        return;
      }
      const confirm = await confirmDialog({
        title: `${KEY_INFO[uploadKey].label} CSV 업로드`,
        message: `${parsed.length}개 행을 업로드합니다. 기존 데이터에 병합됩니다.`,
      });
      if (!confirm) { setUploadKey(null); return; }

      // JSON 필드 파싱
      const jsonFields = { market: ['모델단가', '추가정책'], trend: ['S사', 'L사', 'K사'] };
      parsed.forEach(r => {
        (jsonFields[uploadKey] || []).forEach(f => {
          if (r[f] && typeof r[f] === 'string') {
            try { r[f] = JSON.parse(r[f]); } catch {}
          }
        });
        // 숫자 필드
        ['완료', '무선', '유선전체', '유선신규', '등록점수', '만기1개월', '만기2개월', '만기', '목표', '실적', '월목표', '월실적'].forEach(f => {
          if (r[f] !== undefined && r[f] !== '') {
            if (f === '완료') r[f] = r[f] === 'true' || r[f] === '1';
            else r[f] = Number(r[f]) || 0;
          }
        });
      });

      const current = Store.get(uploadKey) || [];
      const merged = [...current];
      const keyFields = TABLE_MAP_CONFLICT[uploadKey] || [];

      parsed.forEach(newR => {
        const idx = merged.findIndex(r => keyFields.every(f => r[f] === newR[f]));
        if (idx >= 0) merged[idx] = { ...merged[idx], ...newR };
        else merged.push(newR);
      });

      await Store.setKey(uploadKey, merged);
      toast(`${parsed.length}건 업로드 완료`, 'success');
      setUploadKey(null);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const TABLE_MAP_CONFLICT = {
    incentive: ['지사', '센터'],
    market: ['지사', '날짜'],
    trend: ['지사', '날짜'],
    uncompleted: ['지사', '센터', '날짜'],
    insurance: ['지사', '센터'],
    contactM: ['지사', '센터', '접점코드'],
    realtime: ['지사', '센터'],
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-head-title">
          <h1>설정</h1>
          <div className="sub">연결 · 내 센터 · 데이터 관리</div>
        </div>
        <button className="back-btn" onClick={() => window.navigate('home')}>← 메인</button>
      </div>

      <div className="content">
        {/* 내 센터 */}
        <div className="card">
          <div className="card-head">📍 내 센터 설정</div>
          <div className="card-body">
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 10 }}>
              내 센터로 설정하면 해당 센터 데이터는 관리자 인증 없이 바로 입력할 수 있습니다.
            </div>
            {my ? (
              <div className="stack-y">
                <div style={{ padding: 12, background: 'var(--blue-light)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>현재 설정</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>
                    {my.branch} · {my.center}
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => { Session.clear(); setMyCenter(''); toast('해제됨'); }}>해제</button>
              </div>
            ) : (
              <div className="stack-y">
                <select className="select" value={myBranch} onChange={e => { setMyBranch(e.target.value); setMyCenter(''); }}>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select className="select" value={myCenter} onChange={e => setMyCenter(e.target.value)}>
                  <option value="">센터 선택</option>
                  {(ORG[myBranch] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn btn-coral" onClick={saveMyCenter}>설정</button>
              </div>
            )}
          </div>
        </div>

        {/* Supabase */}
        <div className="card">
          <div className="card-head">
            ☁️ Supabase 연결
            <span className={`sync-badge ${SupabaseAdapter.enabled ? 'ok' : 'idle'}`}>
              <span className="dot"></span>
              {SupabaseAdapter.enabled ? '연결됨' : '미연결'}
            </span>
          </div>
          <div className="card-body stack-y">
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              팀 전체가 실시간으로 데이터를 공유합니다.
            </div>
            {isAdmin && (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Project URL</label>
                  <input type="text" className="input" value={url} onChange={e => setUrl(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Publishable Key</label>
                  <input type="text" className="input" value={key} onChange={e => setKey(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-coral" onClick={applyConfig}>적용</button>
                  <button className="btn btn-sm btn-ghost" onClick={resetConfig}>기본값</button>
                </div>
              </>
            )}
            <button className="btn btn-ghost" onClick={refreshData} disabled={syncing}>
              🔄 {syncing ? '동기화 중...' : '서버에서 새로고침'}
            </button>
          </div>
        </div>

        {/* CSV 관리 */}
        <div className="card">
          <div className="card-head">📁 CSV 가져오기 / 내보내기</div>
          <div className="card-body">
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 10 }}>
              Excel에서 열려면 <strong>UTF-8</strong>로 저장된 CSV를 사용하세요.
            </div>
            <div style={{ marginBottom: 10, display: 'flex', gap: 6 }}>
              <button className="btn btn-sm btn-coral" onClick={downloadAllCSV}>⬇ 전체 다운로드</button>
            </div>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>데이터</th>
                    <th style={{ width: 60 }}>건수</th>
                    <th style={{ width: 140 }}>동작</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(KEY_INFO).map(([k, info]) => (
                    <tr key={k}>
                      <td className="left font-bold">{info.label}</td>
                      <td className="num">{U.fmtNum((Store.get(k) || []).length)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-xs btn-ghost" onClick={() => downloadCSV(k)}>⬇</button>
                          <button className="btn btn-xs btn-blue" onClick={() => startUpload(k)}>📤</button>
                          <button className="btn btn-xs btn-danger" onClick={() => {
                            requireAdmin(async () => {
                              const ok = await confirmDialog({
                                title: `${info.label} 삭제`,
                                message: `${info.label} 데이터를 모두 삭제합니다.`,
                                danger: true, okText: '삭제',
                              });
                              if (ok) {
                                await Store.clearKey(k);
                                toast('삭제 완료', 'success');
                              }
                            });
                          }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
          </div>
        </div>

        {/* 전체 초기화 */}
        <div className="card">
          <div className="card-head" style={{ background: 'var(--red)' }}>⚠️ 위험한 작업</div>
          <div className="card-body">
            <button className="btn btn-danger w-full" onClick={resetAll}>🗑 모든 데이터 초기화</button>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 6 }}>
              Supabase 원격 DB 포함 전체 삭제됩니다 (복구 불가).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.SettingsPage = SettingsPage;
