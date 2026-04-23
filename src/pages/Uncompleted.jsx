// 유무선 미개동수량
const UncompletedPage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [date, setDate] = useState(U.todayISO());
  const [filter, setFilter] = useState('');

  const data = Store.get('uncompleted') || [];
  const find = (branch, center) => data.find(r => r.지사 === branch && r.센터 === center && r.날짜 === date);

  const update = (branch, center, field, value) => {
    const run = () => {
      const existing = find(branch, center);
      Store.upsertRow('uncompleted',
        { 지사: branch, 센터: center, 날짜: date },
        {
          무선: existing?.무선 || 0,
          유선전체: existing?.유선전체 || 0,
          유선신규: existing?.유선신규 || 0,
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

  let totalWireless = 0, totalWired = 0, totalNew = 0;
  data.filter(r => r.날짜 === date).forEach(r => {
    totalWireless += r.무선 || 0;
    totalWired += r.유선전체 || 0;
    totalNew += r.유선신규 || 0;
  });

  return (
    <div className="stack-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">유무선 미개동수량</h1>
          <p className="page-desc">센터별 무선/유선 미처리 건수 입력</p>
        </div>
        <div className="toolbar">
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} style={{ width: 160 }} />
          <select className="select" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 130 }}>
            <option value="">전체 지사</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="kpi-card"><div className="kpi-label">무선 합계</div><div className="kpi-value">{U.fmtNum(totalWireless)}</div></div>
        <div className="kpi-card"><div className="kpi-label">유선전체 합계</div><div className="kpi-value">{U.fmtNum(totalWired)}</div></div>
        <div className="kpi-card"><div className="kpi-label">유선신규 합계</div><div className="kpi-value">{U.fmtNum(totalNew)}</div></div>
      </div>

      {branches.map(branch => {
        const centers = ORG[branch];
        return (
          <div key={branch} className="card">
            <div className="card-title">{branch}</div>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ minWidth: 120 }}>센터</th>
                    <th style={{ width: 120 }}>무선</th>
                    <th style={{ width: 120 }}>유선전체</th>
                    <th style={{ width: 120 }}>유선신규</th>
                    <th style={{ width: 100 }}>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {centers.map(center => {
                    const r = find(branch, center) || {};
                    const sum = (r.무선 || 0) + (r.유선전체 || 0) + (r.유선신규 || 0);
                    return (
                      <tr key={center}>
                        <td>{center}</td>
                        <td><input type="number" className="input" value={r.무선 || ''} onChange={e => update(branch, center, '무선', e.target.value)} placeholder="0" style={{ textAlign: 'right' }} /></td>
                        <td><input type="number" className="input" value={r.유선전체 || ''} onChange={e => update(branch, center, '유선전체', e.target.value)} placeholder="0" style={{ textAlign: 'right' }} /></td>
                        <td><input type="number" className="input" value={r.유선신규 || ''} onChange={e => update(branch, center, '유선신규', e.target.value)} placeholder="0" style={{ textAlign: 'right' }} /></td>
                        <td className="num" style={{ fontWeight: 600 }}>{U.fmtNum(sum)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

window.UncompletedPage = UncompletedPage;
