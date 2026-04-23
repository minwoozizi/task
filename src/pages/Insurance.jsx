// 보증보험증권 관리
const InsurancePage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [filter, setFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const data = Store.get('insurance') || [];
  const find = (branch, center) => data.find(r => r.지사 === branch && r.센터 === center);

  const update = (branch, center, field, value) => {
    const run = () => {
      const existing = find(branch, center);
      Store.upsertRow('insurance',
        { 지사: branch, 센터: center },
        {
          등록점수: existing?.등록점수 || 0,
          만기1개월: existing?.만기1개월 || 0,
          만기2개월: existing?.만기2개월 || 0,
          만기: existing?.만기 || 0,
          업데이트: U.todayISO(),
          [field]: Number(value) || 0,
        }
      );
    };
    const my = Session.get();
    if (Auth.isAdmin() || (my && my.branch === branch && my.center === center)) {
      run();
    } else {
      requireAdmin(run);
    }
  };

  const branches = filter ? BRANCHES.filter(b => b === filter) : BRANCHES;
  let rows = branches.flatMap(branch => ORG[branch].map(center => ({
    branch, center,
    data: find(branch, center) || { 등록점수: 0, 만기1개월: 0, 만기2개월: 0, 만기: 0, 업데이트: null }
  })));

  if (searchText) {
    rows = rows.filter(r => r.center.includes(searchText) || r.branch.includes(searchText));
  }

  const totals = rows.reduce((a, r) => ({
    등록: a.등록 + r.data.등록점수,
    만기1: a.만기1 + r.data.만기1개월,
    만기2: a.만기2 + r.data.만기2개월,
    만기: a.만기 + r.data.만기,
  }), { 등록: 0, 만기1: 0, 만기2: 0, 만기: 0 });

  return (
    <div className="stack-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">보증보험증권 관리</h1>
          <p className="page-desc">센터별 등록/만기 현황 관리</p>
        </div>
        <div className="toolbar">
          <input type="text" className="input" placeholder="센터명 검색" value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 150 }} />
          <select className="select" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 130 }}>
            <option value="">전체 지사</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="kpi-card"><div className="kpi-label">등록점수 합계</div><div className="kpi-value">{U.fmtNum(totals.등록)}</div></div>
        <div className="kpi-card"><div className="kpi-label">만기 1개월내</div><div className="kpi-value" style={{ color: totals.만기1 > 0 ? 'var(--orange)' : undefined }}>{U.fmtNum(totals.만기1)}</div></div>
        <div className="kpi-card"><div className="kpi-label">만기 2개월내</div><div className="kpi-value" style={{ color: totals.만기2 > 0 ? 'var(--orange)' : undefined }}>{U.fmtNum(totals.만기2)}</div></div>
        <div className="kpi-card"><div className="kpi-label">만기 도래</div><div className="kpi-value" style={{ color: totals.만기 > 0 ? 'var(--red)' : undefined }}>{U.fmtNum(totals.만기)}</div></div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>지사</th>
                <th>센터</th>
                <th>등록점수</th>
                <th>만기 1개월</th>
                <th>만기 2개월</th>
                <th>만기 도래</th>
                <th>업데이트</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ branch, center, data: r }) => {
                const state = r.만기 > 0 ? 'danger' : (r.만기1개월 > 0 || r.만기2개월 > 0 ? 'warn' : 'ok');
                return (
                  <tr key={branch + center}>
                    <td>{branch}</td>
                    <td>
                      <span className={`status-${state}`} style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 50, background: 'currentColor', marginRight: 6 }}></span>
                      {center}
                    </td>
                    <td><input type="number" className="input" value={r.등록점수 || ''} onChange={e => update(branch, center, '등록점수', e.target.value)} placeholder="0" style={{ textAlign: 'right', width: 100 }} /></td>
                    <td><input type="number" className="input" value={r.만기1개월 || ''} onChange={e => update(branch, center, '만기1개월', e.target.value)} placeholder="0" style={{ textAlign: 'right', width: 100 }} /></td>
                    <td><input type="number" className="input" value={r.만기2개월 || ''} onChange={e => update(branch, center, '만기2개월', e.target.value)} placeholder="0" style={{ textAlign: 'right', width: 100 }} /></td>
                    <td><input type="number" className="input" value={r.만기 || ''} onChange={e => update(branch, center, '만기', e.target.value)} placeholder="0" style={{ textAlign: 'right', width: 100 }} /></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 12 }}>{r.업데이트 ? U.fmtDate(r.업데이트) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

window.InsurancePage = InsurancePage;
