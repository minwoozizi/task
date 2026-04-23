// 유무선 미개동수량 - 원본 스타일 (센터별 저장버튼 + 실적보내기)
const UncompletedPage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [date, setDate] = useState(U.todayISO());
  const [drafts, setDrafts] = useState({});  // 저장 전 임시값

  const data = Store.get('uncompleted') || [];
  const find = (branch, center) => data.find(r => r.지사 === branch && r.센터 === center && r.날짜 === date);

  const getDraft = (branch, center, field) => {
    const k = `${branch}|${center}|${field}`;
    if (k in drafts) return drafts[k];
    const r = find(branch, center);
    return r?.[field] ?? '';
  };

  const setDraft = (branch, center, field, value) => {
    setDrafts(d => ({ ...d, [`${branch}|${center}|${field}`]: value }));
  };

  const save = (branch, center) => {
    const run = () => {
      const existing = find(branch, center);
      const get = (field) => {
        const k = `${branch}|${center}|${field}`;
        return drafts[k] !== undefined ? (Number(drafts[k]) || 0) : (existing?.[field] || 0);
      };
      Store.upsertRow('uncompleted', { 지사: branch, 센터: center, 날짜: date }, {
        무선: get('무선'),
        유선전체: get('유선전체'),
        유선신규: get('유선신규'),
      });
      // 저장한 필드만 draft 제거
      setDrafts(d => {
        const nd = { ...d };
        delete nd[`${branch}|${center}|무선`];
        delete nd[`${branch}|${center}|유선전체`];
        delete nd[`${branch}|${center}|유선신규`];
        return nd;
      });
      toast(`${center} 저장`, 'success');
    };
    const my = Session.get();
    if (Auth.isAdmin() || (my && my.branch === branch && my.center === center)) run();
    else requireAdmin(run);
  };

  const sendAll = () => {
    requireAdmin(async () => {
      const ok = await confirmDialog({
        title: '실적 보내기',
        message: '모든 센터의 미개동 실적을 본부로 전송합니다. 진행하시겠습니까?',
      });
      if (!ok) return;
      toast('실적 전송 완료', 'success');
    });
  };

  const reset = () => {
    requireAdmin(async () => {
      const ok = await confirmDialog({
        title: '초기화',
        message: `${date} 날짜의 미개동 데이터를 초기화합니다.`,
        danger: true, okText: '초기화',
      });
      if (!ok) return;
      const remaining = data.filter(r => r.날짜 !== date);
      await Store.setKey('uncompleted', remaining);
      setDrafts({});
      toast('초기화 완료', 'success');
    });
  };

  const refresh = async () => {
    await Store.pullFromServer();
    setDrafts({});
    toast('새로고침 완료', 'success');
  };

  const totalDone = data.filter(r => r.날짜 === date && (r.무선 || r.유선전체 || r.유선신규)).length;

  return (
    <div>
      <div className="page-head">
        <div className="page-head-title">
          <h1>유무선 미개동수량</h1>
          <div className="sub">{date} · {totalDone}/{ALL_CENTERS.length} 완료</div>
        </div>
        <button className="back-btn" onClick={() => window.navigate('home')}>← 메인</button>
      </div>

      <div className="action-bar">
        <button className="btn btn-green" onClick={sendAll}>📤 실적 보내기</button>
        <button className="btn btn-sm btn-danger" onClick={reset}>🗑 초기화</button>
        <button className="btn btn-sm btn-ghost" onClick={refresh}>🔄 새로고침</button>
        <input type="date" className="input" style={{ width: 130, marginLeft: 'auto' }} value={date} onChange={e => { setDate(e.target.value); setDrafts({}); }} />
      </div>

      <div className="content" style={{ padding: 10 }}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 50 }}>지사</th>
                <th style={{ width: 70 }}>센터</th>
                <th style={{ width: 70 }}>무선</th>
                <th style={{ width: 70 }}>유선전체</th>
                <th style={{ width: 70 }}>유선신규</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {BRANCHES.map(branch => {
                const centers = ORG[branch];
                return centers.map((center, i) => (
                  <tr key={branch + center}>
                    {i === 0 && <td className="branch-cell" rowSpan={centers.length}>{branch.replace('지사', '')}</td>}
                    <td>{center}</td>
                    {['무선', '유선전체', '유선신규'].map(field => (
                      <td key={field}>
                        <input
                          type="number"
                          className="input-inline"
                          style={{ width: 55 }}
                          value={getDraft(branch, center, field)}
                          placeholder="0"
                          onChange={e => setDraft(branch, center, field, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <button className="btn btn-xs btn-blue" onClick={() => save(branch, center)}>저장</button>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

window.UncompletedPage = UncompletedPage;
