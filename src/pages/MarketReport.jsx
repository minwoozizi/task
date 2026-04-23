// 시장동향보고 - 원본 스타일 (본부탭 + MNP/기기변경 × S/L/K + 3사특이동향)
const MarketReportPage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [activeHq, setActiveHq] = useState('종합');
  const [date, setDate] = useState(U.todayISO());

  const market = Store.get('market') || [];
  const trend = Store.get('trend') || [];

  const mRec = market.find(r => r.지사 === activeHq && r.날짜 === date) || { 모델단가: {}, 추가정책: {} };
  const tRec = trend.find(r => r.지사 === activeHq && r.날짜 === date) || { S사: [], L사: [], K사: [] };

  const CARRIERS = ['S', 'L', 'K'];
  const CHANNELS = ['MNP', '기기변경'];

  const updatePrice = (model, channel, carrier, value) => {
    const run = () => {
      const key = `${channel}_${carrier}`;
      const prices = { ...(mRec.모델단가 || {}) };
      if (!prices[model]) prices[model] = {};
      prices[model][key] = Number(value) || 0;
      Store.upsertRow('market', { 지사: activeHq, 날짜: date }, {
        모델단가: prices,
        추가정책: mRec.추가정책 || {},
        완료: mRec.완료 || false,
      });
    };
    requireAdmin(run);
  };

  const updatePolicy = (item, carrier, value) => {
    const run = () => {
      const policy = { ...(mRec.추가정책 || {}) };
      if (!policy[item]) policy[item] = {};
      policy[item][carrier] = value;
      Store.upsertRow('market', { 지사: activeHq, 날짜: date }, {
        모델단가: mRec.모델단가 || {},
        추가정책: policy,
        완료: mRec.완료 || false,
      });
    };
    requireAdmin(run);
  };

  const addTrend = (branch, carrier) => {
    const run = () => {
      const text = prompt(`[${branch}] ${carrier} 특이동향 내용:`);
      if (!text) return;
      const existing = trend.find(r => r.지사 === branch && r.날짜 === date) || { S사: [], L사: [], K사: [] };
      const carrierKey = carrier + '사';
      const list = [...(existing[carrierKey] || []), { id: Date.now(), text }];
      Store.upsertRow('trend', { 지사: branch, 날짜: date }, {
        ...existing,
        [carrierKey]: list,
      });
    };
    requireAdmin(run);
  };

  const removeTrend = (branch, carrier, id) => {
    const run = () => {
      const existing = trend.find(r => r.지사 === branch && r.날짜 === date);
      if (!existing) return;
      const carrierKey = carrier + '사';
      const list = (existing[carrierKey] || []).filter(t => t.id !== id);
      Store.upsertRow('trend', { 지사: branch, 날짜: date }, {
        ...existing,
        [carrierKey]: list,
      });
    };
    requireAdmin(run);
  };

  const toggleComplete = () => {
    requireAdmin(() => {
      Store.upsertRow('market', { 지사: activeHq, 날짜: date }, {
        모델단가: mRec.모델단가 || {},
        추가정책: mRec.추가정책 || {},
        완료: !mRec.완료,
      });
      toast(mRec.완료 ? '보고 취소' : '보고 완료', 'success');
    });
  };

  const TABS = ['종합', ...BRANCHES.map(b => b.replace('지사', ''))];
  const branchForTab = (tab) => tab === '종합' ? null : tab + '지사';

  // 최근 5개 날짜
  const recentDates = [0, 2, 13, 16, 20, 27].map(d => {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    return dt.toISOString().slice(0, 10);
  });

  const totalComplete = market.filter(m => m.완료 && m.날짜 === date).length;
  const totalTrendCount = trend.filter(t => t.날짜 === date)
    .reduce((a, r) => a + (r.S사?.length || 0) + (r.L사?.length || 0) + (r.K사?.length || 0), 0);

  return (
    <div>
      {/* 본부탭 */}
      <div className="hq-tabbar">
        {TABS.map(tab => (
          <button key={tab} className={`hq-tab ${activeHq === tab || (activeHq === '종합' && tab === '종합') ? 'active' : ''}`} onClick={() => setActiveHq(tab === '종합' ? '종합' : tab + '지사')}>
            {tab}
          </button>
        ))}
      </div>

      <div className="page-head">
        <div className="page-head-title">
          <h1>시장동향보고</h1>
          <div className="sub">{date}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm ${mRec.완료 ? 'btn-green' : 'btn-blue'}`} onClick={toggleComplete}>
            {mRec.완료 ? '↓ PNG\n보고완료' : '↓ PNG\n보고완료'}
          </button>
          <button className="back-btn" onClick={() => window.navigate('home')}>← 메인</button>
        </div>
      </div>

      <div style={{ padding: '8px 10px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="text-xs text-gray mb-2">
          센터 {totalComplete}/{HQS.length} · 동향 {totalTrendCount}/{BRANCHES.length}
        </div>
        <div className="filter-chips">
          <button className={`filter-chip ${date === U.todayISO() ? 'active' : ''}`} onClick={() => setDate(U.todayISO())}>오늘</button>
          {recentDates.slice(1).map(d => (
            <button key={d} className={`filter-chip ${date === d ? 'active' : ''}`} onClick={() => setDate(d)}>
              {d.slice(2).replace(/-/g, '.')}
              <span className="x">✕</span>
            </button>
          ))}
          <input type="date" className="input" style={{ width: 130, padding: '4px 8px' }} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      <div className="content" style={{ padding: 10 }}>
        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>
          {totalComplete}/{HQS.length} 완료
        </div>

        {/* 모델별 단가 */}
        <div className="card">
          <div className="card-head">
            <span><span className="card-num">1</span>모델별 단가</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>단위: 만원</span>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th rowSpan="2" style={{ width: 60 }}>모델</th>
                  <th colSpan="3">MNP</th>
                  <th colSpan="3">기기변경</th>
                </tr>
                <tr>
                  {CHANNELS.flatMap(ch => CARRIERS.map(c => (
                    <th key={ch+c} style={{ background: 'var(--navy-dark)' }}>{c}</th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {MODELS.map(model => (
                  <tr key={model}>
                    <td className="left font-bold">{model}</td>
                    {CHANNELS.map(channel => CARRIERS.map(carrier => {
                      const key = `${channel}_${carrier}`;
                      const val = mRec.모델단가?.[model]?.[key];
                      return (
                        <td key={key}>
                          <input
                            type="number"
                            className="input-inline"
                            value={val || ''}
                            placeholder="—"
                            onChange={e => updatePrice(model, channel, carrier, e.target.value)}
                            style={{ width: 50 }}
                          />
                        </td>
                      );
                    }))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 추가정책 */}
        <div className="card">
          <div className="card-head">
            <span><span className="card-num">2</span>추가정책</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>센터 평균</span>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>항목</th>
                  {CARRIERS.map(c => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {POLICY_ITEMS.map(item => (
                  <tr key={item}>
                    <td className="left font-bold">{item}</td>
                    {CARRIERS.map(c => (
                      <td key={c}>
                        <input
                          type="text"
                          className="input-inline"
                          value={mRec.추가정책?.[item]?.[c] || ''}
                          placeholder="—"
                          onChange={e => updatePolicy(item, c, e.target.value)}
                          style={{ width: 60 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3사 특이동향 */}
        <div className="card">
          <div className="card-head">
            <span><span className="card-num">3</span>3사 특이동향</span>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>지사</th>
                  <th style={{ width: 40 }}>구분</th>
                  <th>내용</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {BRANCHES.map(branch => {
                  const br = trend.find(r => r.지사 === branch && r.날짜 === date) || {};
                  return CARRIERS.map((carrier, i) => {
                    const list = br[carrier + '사'] || [];
                    const carrierColor = { S: '#3b82f6', L: '#ef4444', K: '#10b981' }[carrier];
                    return (
                      <tr key={branch + carrier}>
                        {i === 0 && (
                          <td className="branch-cell" rowSpan="3">{branch.replace('지사', '')}</td>
                        )}
                        <td style={{ color: carrierColor, fontWeight: 700 }}>{carrier}사</td>
                        <td className="left" style={{ color: list.length === 0 ? 'var(--gray-400)' : 'inherit' }}>
                          {list.length === 0 ? (
                            <span>미입력</span>
                          ) : (
                            list.map(t => (
                              <div key={t.id} style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 12, margin: 2, fontSize: 11 }}>
                                {t.text}
                                <button onClick={() => removeTrend(branch, carrier, t.id)} style={{ marginLeft: 4, color: 'var(--gray-500)' }}>✕</button>
                              </div>
                            ))
                          )}
                        </td>
                        <td>
                          <button onClick={() => addTrend(branch, carrier)} className="btn-xs btn-coral" style={{ background: 'var(--coral)', color: '#fff' }}>+</button>
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
    </div>
  );
};

window.MarketReportPage = MarketReportPage;
