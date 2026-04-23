// 실시간 실적현황 (도강팀)
const RealtimePage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [view, setView] = useState('branch'); // branch | center
  const [addModal, setAddModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const data = Store.get('realtime') || [];

  // 집계: 지사별
  const byBranch = BRANCHES.map(b => {
    const recs = data.filter(r => r.지사 === b);
    const 목표 = recs.reduce((a, r) => a + (r.목표 || 0), 0);
    const 실적 = recs.reduce((a, r) => a + (r.실적 || 0), 0);
    const 월목표 = recs.reduce((a, r) => a + (r.월목표 || 0), 0);
    const 월실적 = recs.reduce((a, r) => a + (r.월실적 || 0), 0);
    return { 지사: b, 목표, 실적, 달성률: U.pct(실적, 목표), 월목표, 월실적, 월달성률: U.pct(월실적, 월목표) };
  }).sort((a, b) => b.달성률 - a.달성률);

  // 센터별
  const byCenter = ALL_CENTERS.map(({ branch, center }) => {
    const r = data.find(x => x.지사 === branch && x.센터 === center) || {};
    return {
      지사: branch, 센터: center,
      목표: r.목표 || 0, 실적: r.실적 || 0,
      월목표: r.월목표 || 0, 월실적: r.월실적 || 0,
      달성률: U.pct(r.실적 || 0, r.목표 || 0),
      월달성률: U.pct(r.월실적 || 0, r.월목표 || 0),
    };
  }).sort((a, b) => b.달성률 - a.달성률);

  const submit = (row) => {
    const run = () => {
      const match = { 타입: row.타입 || 'center', 지사: row.지사, 센터: row.센터 || null, 날짜: row.날짜 || U.todayISO() };
      Store.upsertRow('realtime', match, {
        목표: Number(row.목표) || 0,
        실적: Number(row.실적) || 0,
        월목표: Number(row.월목표) || 0,
        월실적: Number(row.월실적) || 0,
      });
      setAddModal(false);
      setEditing(null);
      toast('저장 완료', 'success');
    };
    const my = Session.get();
    if (Auth.isAdmin() || (my && my.branch === row.지사 && my.center === row.센터)) {
      run();
    } else {
      requireAdmin(run);
    }
  };

  const openEdit = (record) => {
    setEditing({
      타입: 'center',
      지사: record.지사,
      센터: record.센터,
      날짜: U.todayISO(),
      목표: record.목표,
      실적: record.실적,
      월목표: record.월목표,
      월실적: record.월실적,
    });
    setAddModal(true);
  };

  const openNew = () => {
    const my = Session.get();
    setEditing({
      타입: 'center',
      지사: my?.branch || BRANCHES[0],
      센터: my?.center || '',
      날짜: U.todayISO(),
      목표: 0, 실적: 0, 월목표: 0, 월실적: 0,
    });
    setAddModal(true);
  };

  // 전체 합계
  const totalBranch = byBranch.reduce((a, r) => ({
    목표: a.목표 + r.목표, 실적: a.실적 + r.실적,
    월목표: a.월목표 + r.월목표, 월실적: a.월실적 + r.월실적,
  }), { 목표: 0, 실적: 0, 월목표: 0, 월실적: 0 });

  return (
    <div className="stack-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">실시간 실적현황</h1>
          <p className="page-desc">도강팀 · 본부/지사별 목표 대비 실적 및 달성률</p>
        </div>
        <div className="toolbar">
          <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <button className={`btn-sm ${view === 'branch' ? 'btn btn-coral' : 'btn btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }} onClick={() => setView('branch')}>지사별</button>
            <button className={`btn-sm ${view === 'center' ? 'btn btn-coral' : 'btn btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }} onClick={() => setView('center')}>센터별</button>
          </div>
          <button className="btn btn-coral" onClick={openNew}><Icon name="plus" size={14}/> 실적등록</button>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="kpi-card"><div className="kpi-label">일 목표</div><div className="kpi-value">{U.fmtNum(totalBranch.목표)}</div></div>
        <div className="kpi-card"><div className="kpi-label">일 실적</div><div className="kpi-value" style={{ color: 'var(--blue)' }}>{U.fmtNum(totalBranch.실적)}</div></div>
        <div className="kpi-card"><div className="kpi-label">일 달성률</div><div className="kpi-value" style={{ color: U.pct(totalBranch.실적, totalBranch.목표) >= 100 ? 'var(--green)' : 'var(--coral)' }}>{U.pct(totalBranch.실적, totalBranch.목표)}%</div></div>
        <div className="kpi-card"><div className="kpi-label">월 달성률</div><div className="kpi-value">{U.pct(totalBranch.월실적, totalBranch.월목표)}%</div></div>
      </div>

      <div className="card">
        <div className="card-title">
          <span>{view === 'branch' ? '지사별' : '센터별'} 실적 (달성률 순)</span>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 50 }}>순위</th>
                {view === 'center' && <th>지사</th>}
                <th>{view === 'branch' ? '지사' : '센터'}</th>
                <th>일 목표</th>
                <th>일 실적</th>
                <th>달성률</th>
                <th>월 목표</th>
                <th>월 실적</th>
                <th>월 달성률</th>
                {view === 'center' && <th style={{ width: 60 }}></th>}
              </tr>
            </thead>
            <tbody>
              {(view === 'branch' ? byBranch : byCenter).map((r, i) => (
                <tr key={view === 'branch' ? r.지사 : (r.지사 + r.센터)}>
                  <td style={{ fontWeight: 700, color: i < 3 ? 'var(--coral)' : 'var(--gray-500)' }}>{i + 1}</td>
                  {view === 'center' && <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{r.지사}</td>}
                  <td style={{ fontWeight: 600 }}>{view === 'branch' ? r.지사 : r.센터}</td>
                  <td className="num">{U.fmtNum(r.목표)}</td>
                  <td className="num">{U.fmtNum(r.실적)}</td>
                  <td className="num">
                    <span className={r.달성률 >= 100 ? 'status-ok' : (r.달성률 >= 80 ? 'status-warn' : 'status-danger')}>
                      {r.달성률}%
                    </span>
                  </td>
                  <td className="num">{U.fmtNum(r.월목표)}</td>
                  <td className="num">{U.fmtNum(r.월실적)}</td>
                  <td className="num">
                    <span className={r.월달성률 >= 100 ? 'status-ok' : (r.월달성률 >= 80 ? 'status-warn' : 'status-danger')}>
                      {r.월달성률}%
                    </span>
                  </td>
                  {view === 'center' && (
                    <td>
                      <button onClick={() => openEdit(r)} style={{ color: 'var(--blue)' }}><Icon name="edit" size={14}/></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={addModal} onClose={() => { setAddModal(false); setEditing(null); }} title="실적 등록/수정" size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={() => { setAddModal(false); setEditing(null); }}>취소</button>
          <button className="btn btn-coral" onClick={() => submit(editing)}>저장</button>
        </>}>
        {editing && (
          <div className="grid grid-2">
            <div className="form-row">
              <label className="form-label">지사</label>
              <select className="select" value={editing.지사} onChange={e => setEditing({ ...editing, 지사: e.target.value, 센터: '' })}>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">센터</label>
              <select className="select" value={editing.센터 || ''} onChange={e => setEditing({ ...editing, 센터: e.target.value })}>
                <option value="">선택</option>
                {(ORG[editing.지사] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">일 목표</label>
              <input type="number" className="input" value={editing.목표} onChange={e => setEditing({ ...editing, 목표: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">일 실적</label>
              <input type="number" className="input" value={editing.실적} onChange={e => setEditing({ ...editing, 실적: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">월 목표</label>
              <input type="number" className="input" value={editing.월목표} onChange={e => setEditing({ ...editing, 월목표: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">월 실적</label>
              <input type="number" className="input" value={editing.월실적} onChange={e => setEditing({ ...editing, 월실적: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

window.RealtimePage = RealtimePage;
