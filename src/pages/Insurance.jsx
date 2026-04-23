// 보증보험증권 관리 - 원본 스타일 (색상 범례 + 칩 그리드)
const InsurancePage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [selected, setSelected] = useState(null); // {branch, center}
  const data = Store.get('insurance') || [];
  const find = (branch, center) => data.find(r => r.지사 === branch && r.센터 === center);

  // 상태 계산 — 색상 범례에 따라
  const getStatus = (r) => {
    if (!r || !r.등록점수) return 'gray';        // 미등록
    if ((r.만기 || 0) > 0) return 'black';        // 만기 도래
    if ((r.만기1개월 || 0) > 0) return 'red';     // 만기 1개월 이내
    if ((r.만기2개월 || 0) > 0) return 'yellow';  // 만기 2개월 이내
    return 'green';                               // 정상
  };

  const statusChipClass = (status) => ({
    gray: 'chip-gray',
    black: 'chip', // 만기 도래는 검은색 텍스트
    red: 'chip-red',
    yellow: 'chip-yellow',
    green: 'chip-done',
  }[status] || '');

  const update = (branch, center, patch) => {
    const run = () => {
      const existing = find(branch, center) || { 등록점수: 0, 만기1개월: 0, 만기2개월: 0, 만기: 0 };
      Store.upsertRow('insurance', { 지사: branch, 센터: center }, {
        ...existing,
        ...patch,
        업데이트: U.todayISO(),
      });
    };
    const my = Session.get();
    if (Auth.isAdmin() || (my && my.branch === branch && my.center === center)) run();
    else requireAdmin(run);
  };

  if (selected) {
    const r = find(selected.branch, selected.center) || { 등록점수: 0, 만기1개월: 0, 만기2개월: 0, 만기: 0 };
    return (
      <div>
        <div className="page-head">
          <div className="page-head-title">
            <h1>{selected.branch} · {selected.center}</h1>
            <div className="sub">보증보험증권 관리</div>
          </div>
          <button className="back-btn" onClick={() => setSelected(null)}>← 뒤로</button>
        </div>

        <div className="content">
          <div className="card">
            <div className="card-head">등록 및 만기 현황</div>
            <div className="card-body stack-y">
              {[
                { key: '등록점수', label: '등록점수', color: '#10b981' },
                { key: '만기2개월', label: '만기 2개월 이내', color: '#f59e0b' },
                { key: '만기1개월', label: '만기 1개월 이내', color: '#ef4444' },
                { key: '만기', label: '만기 도래', color: '#1a2332' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: f.color }}>{f.label}</label>
                  <input
                    type="number" className="input" value={r[f.key] || ''} placeholder="0"
                    onChange={e => update(selected.branch, selected.center, { [f.key]: Number(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </div>
          </div>

          {r.업데이트 && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--gray-500)', marginTop: 8 }}>
              마지막 업데이트: {r.업데이트}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div className="page-head-title">
          <h1>보증보험증권 관리</h1>
          <div className="sub">센터를 선택하세요</div>
        </div>
        <button className="back-btn" onClick={() => window.navigate('home')}>← 메인</button>
      </div>

      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--red)' }}></span>만기 1개월 이내</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--yellow)' }}></span>만기 2개월 이내</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--green)' }}></span>정상</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--navy)' }}></span>만기</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--gray-200)', border: '1px solid var(--gray-300)' }}></span>미등록</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>· 버튼 숫자: 등록점수 / 만기도래점수</div>
      </div>

      <div className="content">
        {BRANCHES.map(branch => (
          <div key={branch} className="center-group">
            <div className="center-group-title">{branch.replace('지사', '')}</div>
            <div className="chip-grid">
              {ORG[branch].map(center => {
                const r = find(branch, center);
                const status = getStatus(r);
                return (
                  <button
                    key={center}
                    className={`chip ${statusChipClass(status)}`}
                    onClick={() => setSelected({ branch, center })}
                  >
                    <div className="chip-name">{center}</div>
                    <div className="chip-sub">
                      {r?.등록점수 ? `${r.등록점수} / ${r.만기 || 0}` : '미등록 / 0'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.InsurancePage = InsurancePage;
