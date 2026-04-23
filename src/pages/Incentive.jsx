// 장려금투명화 업로드
const IncentivePage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [filter, setFilter] = useState('');
  const data = Store.get('incentive') || [];

  const find = (branch, center) => data.find(r => r.지사 === branch && r.센터 === center);

  const toggle = (branch, center) => {
    const run = () => {
      const existing = find(branch, center);
      Store.upsertRow('incentive', { 지사: branch, 센터: center }, {
        업로드일: existing?.완료 ? null : U.todayISO(),
        완료: !existing?.완료,
      });
      toast(existing?.완료 ? '업로드 취소' : '업로드 완료', 'success');
    };
    // 누구나 (자기 센터) 가능
    const my = Session.get();
    if (Auth.isAdmin() || (my && my.branch === branch && my.center === center)) {
      run();
    } else {
      requireAdmin(run);
    }
  };

  const total = ALL_CENTERS.length;
  const done = data.filter(r => r.완료).length;

  const filteredBranches = filter
    ? BRANCHES.filter(b => b === filter)
    : BRANCHES;

  return (
    <div className="stack-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">장려금투명화 업로드</h1>
          <p className="page-desc">센터별 업로드 완료 여부를 체크합니다 · 완료: {done} / {total}</p>
        </div>
        <div className="toolbar">
          <select className="select" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 130 }}>
            <option value="">전체 지사</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="stack-y">
        {filteredBranches.map(branch => {
          const centers = ORG[branch];
          const branchDone = centers.filter(c => find(branch, c)?.완료).length;
          return (
            <div key={branch} className="card">
              <div className="card-title">
                <span>{branch}</span>
                <span className="card-sub">{branchDone} / {centers.length} 완료</span>
              </div>
              <div className="grid grid-4" style={{ gap: 10 }}>
                {centers.map(center => {
                  const r = find(branch, center);
                  const ok = r?.완료;
                  return (
                    <button
                      key={center}
                      onClick={() => toggle(branch, center)}
                      style={{
                        padding: '12px 10px',
                        border: `2px solid ${ok ? 'var(--green)' : 'var(--border)'}`,
                        background: ok ? '#dcfce7' : '#fff',
                        borderRadius: 10,
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{center}</span>
                        {ok && <Icon name="check" size={16} color="var(--green)" />}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                        {r?.업로드일 ? `업로드: ${U.fmtDate(r.업로드일)}` : '미업로드'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.IncentivePage = IncentivePage;
