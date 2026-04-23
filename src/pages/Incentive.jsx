// 장려금투명화 - 원본 스타일 (테이블 + 전 센터 완료 토글)
const IncentivePage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const data = Store.get('incentive') || [];
  const find = (branch, center) => data.find(r => r.지사 === branch && r.센터 === center);

  const totalCenters = ALL_CENTERS.length;
  const doneCount = data.filter(r => r.완료).length;
  const allDone = doneCount === totalCenters;

  const toggle = (branch, center) => {
    const run = () => {
      const existing = find(branch, center);
      Store.upsertRow('incentive', { 지사: branch, 센터: center }, {
        업로드일: existing?.완료 ? null : U.todayISO(),
        완료: !existing?.완료,
      });
    };
    const my = Session.get();
    if (Auth.isAdmin() || (my && my.branch === branch && my.center === center)) {
      run();
    } else {
      requireAdmin(run);
    }
  };

  const toggleAll = () => {
    requireAdmin(async () => {
      const target = !allDone;
      const ok = await confirmDialog({
        title: target ? '전 센터 완료 처리' : '전 센터 완료 취소',
        message: `${totalCenters}개 센터를 모두 ${target ? '완료' : '미완료'} 처리하시겠습니까?`,
      });
      if (!ok) return;
      ALL_CENTERS.forEach(({ branch, center }) => {
        Store.upsertRow('incentive', { 지사: branch, 센터: center }, {
          업로드일: target ? U.todayISO() : null,
          완료: target,
        });
      });
      toast('전체 처리 완료', 'success');
    });
  };

  const reset = () => {
    requireAdmin(async () => {
      const ok = await confirmDialog({
        title: '초기화',
        message: '장려금 업로드 데이터를 모두 초기화하시겠습니까?',
        danger: true, okText: '초기화',
      });
      if (!ok) return;
      await Store.clearKey('incentive');
      toast('초기화 완료', 'success');
    });
  };

  const refresh = async () => {
    await Store.pullFromServer();
    toast('새로고침 완료', 'success');
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-head-title">
          <h1>장려금투명화 업로드</h1>
          <div className="sub">{U.todayISO()} · {doneCount}/{totalCenters} 완료</div>
        </div>
        <button className="back-btn" onClick={() => window.navigate('home')}>← 메인</button>
      </div>

      <div className="action-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-ghost" onClick={refresh}>🔄 새로고침</button>
          <button className="btn btn-sm btn-danger" onClick={reset}>🗑 초기화</button>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
          <input type="checkbox" checked={allDone} onChange={toggleAll} style={{ width: 18, height: 18, accentColor: 'var(--green)' }} />
          전 센터 완료
        </label>
      </div>

      <div className="content" style={{ padding: 10 }}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 50 }}>지사</th>
                <th>센터</th>
                <th style={{ width: 70 }}>업로드<br/>여부</th>
                <th style={{ width: 50 }}>상태</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {BRANCHES.map(branch => {
                const centers = ORG[branch];
                return centers.map((center, i) => {
                  const r = find(branch, center);
                  const ok = r?.완료;
                  return (
                    <tr key={branch + center}>
                      {i === 0 && (
                        <td className="branch-cell" rowSpan={centers.length}>
                          {branch.replace('지사', '')}
                        </td>
                      )}
                      <td>{center}</td>
                      <td>
                        <button onClick={() => toggle(branch, center)} style={{ fontSize: 20, lineHeight: 1 }}>
                          {ok ? '✅' : '⬜'}
                        </button>
                      </td>
                      <td>
                        <span className={`status-dot ${ok ? 'green' : 'gray'}`}></span>
                      </td>
                      <td>
                        <button
                          onClick={() => toggle(branch, center)}
                          style={{
                            padding: '4px 10px',
                            background: ok ? 'var(--green)' : 'var(--gray-200)',
                            borderRadius: 6,
                            fontSize: 11, fontWeight: 700,
                            color: ok ? '#fff' : 'var(--gray-500)',
                          }}
                        >
                          {ok ? '✓' : '—'}
                        </button>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

window.IncentivePage = IncentivePage;
