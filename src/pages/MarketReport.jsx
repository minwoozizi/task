// 시장동향보고 (모델 단가, 추가정책, 3사 특이동향)
const MarketReportPage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [selectedBranch, setSelectedBranch] = useState(Session.get()?.branch || BRANCHES[0]);
  const [date, setDate] = useState(U.todayISO());

  const market = Store.get('market') || [];
  const trend = Store.get('trend') || [];

  const mRec = market.find(r => r.지사 === selectedBranch && r.날짜 === date) || {};
  const tRec = trend.find(r => r.지사 === selectedBranch && r.날짜 === date) || { 'S사': [], 'L사': [], 'K사': [] };

  const MODELS = ['갤럭시 S24', '갤럭시 S24+', '갤럭시 S24 Ultra', '갤럭시 Z Fold6', '갤럭시 Z Flip6', 'iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max'];

  const updatePrice = (model, value) => {
    const run = () => {
      const prices = { ...(mRec.모델단가 || {}), [model]: value };
      Store.upsertRow('market', { 지사: selectedBranch, 날짜: date }, { 모델단가: prices, 추가정책: mRec.추가정책 || {}, 완료: mRec.완료 || false });
    };
    requireAdmin(run);
  };

  const updatePolicy = (key, value) => {
    const run = () => {
      const policy = { ...(mRec.추가정책 || {}), [key]: value };
      Store.upsertRow('market', { 지사: selectedBranch, 날짜: date }, { 모델단가: mRec.모델단가 || {}, 추가정책: policy, 완료: mRec.완료 || false });
    };
    requireAdmin(run);
  };

  const toggleComplete = () => {
    const run = () => {
      Store.upsertRow('market', { 지사: selectedBranch, 날짜: date }, {
        모델단가: mRec.모델단가 || {},
        추가정책: mRec.추가정책 || {},
        완료: !mRec.완료,
      });
      toast(mRec.완료 ? '보고 취소' : '보고 완료', 'success');
    };
    requireAdmin(run);
  };

  const addTrend = (carrier) => {
    const run = () => {
      const text = prompt(`${carrier} 특이동향 내용:`);
      if (!text) return;
      const list = [...(tRec[carrier] || []), { id: Date.now(), text, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }];
      Store.upsertRow('trend', { 지사: selectedBranch, 날짜: date }, { 'S사': tRec['S사'] || [], 'L사': tRec['L사'] || [], 'K사': tRec['K사'] || [], [carrier]: list });
    };
    requireAdmin(run);
  };

  const removeTrend = (carrier, id) => {
    const run = () => {
      const list = (tRec[carrier] || []).filter(t => t.id !== id);
      Store.upsertRow('trend', { 지사: selectedBranch, 날짜: date }, { 'S사': tRec['S사'] || [], 'L사': tRec['L사'] || [], 'K사': tRec['K사'] || [], [carrier]: list });
    };
    requireAdmin(run);
  };

  return (
    <div className="stack-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">시장동향보고</h1>
          <p className="page-desc">지사별 일자별 시장동향 보고</p>
        </div>
        <div className="toolbar">
          <select className="select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ width: 130 }}>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} style={{ width: 160 }} />
          <button className={`btn ${mRec.완료 ? 'btn-ok' : 'btn-coral'}`} onClick={toggleComplete}>
            {mRec.완료 ? '✓ 보고완료' : '보고완료'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">모델별 단가</div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>모델</th><th style={{ width: 180 }}>단가 (원)</th></tr></thead>
            <tbody>
              {MODELS.map(m => (
                <tr key={m}>
                  <td>{m}</td>
                  <td>
                    <input
                      type="number"
                      className="input"
                      value={mRec.모델단가?.[m] || ''}
                      onChange={e => updatePrice(m, Number(e.target.value) || 0)}
                      placeholder="0"
                      style={{ textAlign: 'right' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">추가정책</div>
        <div className="grid grid-2">
          <div className="form-row">
            <label className="form-label">상향정책</label>
            <textarea className="textarea" value={mRec.추가정책?.상향 || ''} onChange={e => updatePolicy('상향', e.target.value)} placeholder="상향 정책 내용" />
          </div>
          <div className="form-row">
            <label className="form-label">기타정책</label>
            <textarea className="textarea" value={mRec.추가정책?.기타 || ''} onChange={e => updatePolicy('기타', e.target.value)} placeholder="기타 정책 내용" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">3사 특이동향</div>
        <div className="grid grid-3">
          {['S사', 'L사', 'K사'].map(carrier => (
            <div key={carrier}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 13 }}>{carrier}</strong>
                <button className="btn btn-sm btn-ghost" onClick={() => addTrend(carrier)}>+ 추가</button>
              </div>
              <div className="stack-y" style={{ fontSize: 12 }}>
                {(tRec[carrier] || []).length === 0 && <div className="empty" style={{ padding: 20 }}>없음</div>}
                {(tRec[carrier] || []).map(t => (
                  <div key={t.id} style={{ padding: 10, background: 'var(--gray-50)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div>{t.text}</div>
                      <div style={{ color: 'var(--gray-500)', fontSize: 11, marginTop: 2 }}>{t.time}</div>
                    </div>
                    <button onClick={() => removeTrend(carrier, t.id)} style={{ color: 'var(--red)' }}><Icon name="x" size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

window.MarketReportPage = MarketReportPage;
