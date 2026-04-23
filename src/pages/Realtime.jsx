// 실시간 실적현황 - 원본 스타일 (본부/지사별 표 + 센터별 + KT내 비중)
const RealtimePage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [tab, setTab] = useState('realtime'); // realtime | closing
  const [editModal, setEditModal] = useState(null); // {branch, center}

  const data = Store.get('realtime') || [];

  // 집계
  const findCenter = (branch, center) => data.find(r => r.지사 === branch && r.센터 === center) || {};

  // 본부별 집계
  const byHq = HQS.map(hq => {
    const branches = HQ[hq];
    const centers = branches.flatMap(b => ORG[b].map(c => ({ branch: b, center: c })));
    const recs = centers.map(({ branch, center }) => findCenter(branch, center));
    return {
      name: hq.replace('본부', '본부'),
      목표: recs.reduce((a, r) => a + (r.목표 || 0), 0),
      실적: recs.reduce((a, r) => a + (r.실적 || 0), 0),
      월목표: recs.reduce((a, r) => a + (r.월목표 || 0), 0),
      월실적: recs.reduce((a, r) => a + (r.월실적 || 0), 0),
    };
  }).map(r => ({ ...r, 달성률: U.pct(r.실적, r.목표), 월달성률: U.pct(r.월실적, r.월목표) }));

  const 합계 = byHq.reduce((a, r) => ({
    목표: a.목표 + r.목표, 실적: a.실적 + r.실적,
    월목표: a.월목표 + r.월목표, 월실적: a.월실적 + r.월실적,
  }), { 목표: 0, 실적: 0, 월목표: 0, 월실적: 0 });

  // 순위 (월 달성률)
  const byHqRanked = [...byHq].sort((a, b) => b.월달성률 - a.월달성률);
  const hqRankMap = {};
  byHqRanked.forEach((r, i) => { hqRankMap[r.name] = i + 1; });

  // 지사별 집계
  const byBranch = BRANCHES.map(branch => {
    const recs = ORG[branch].map(c => findCenter(branch, c));
    return {
      name: branch.replace('지사', ''),
      branch,
      목표: recs.reduce((a, r) => a + (r.목표 || 0), 0),
      실적: recs.reduce((a, r) => a + (r.실적 || 0), 0),
      월목표: recs.reduce((a, r) => a + (r.월목표 || 0), 0),
      월실적: recs.reduce((a, r) => a + (r.월실적 || 0), 0),
    };
  }).map(r => ({ ...r, 달성률: U.pct(r.실적, r.목표), 월달성률: U.pct(r.월실적, r.월목표) }));

  const byBranchRanked = [...byBranch].sort((a, b) => b.월달성률 - a.월달성률);
  const brRankMap = {};
  byBranchRanked.forEach((r, i) => { brRankMap[r.name] = i + 1; });

  // 센터별 전체 (실적 순)
  const byCenter = ALL_CENTERS.map(({ branch, center }) => {
    const r = findCenter(branch, center);
    return {
      branch, center,
      목표: r.목표 || 0, 실적: r.실적 || 0,
      월목표: r.월목표 || 0, 월실적: r.월실적 || 0,
    };
  }).map(r => ({ ...r, 달성률: U.pct(r.실적, r.목표), 월달성률: U.pct(r.월실적, r.월목표) }));

  const byCenterRanked = [...byCenter].sort((a, b) => b.달성률 - a.달성률 || b.실적 - a.실적);
  const cRankMap = {};
  byCenterRanked.forEach((r, i) => { cRankMap[r.branch + r.center] = i + 1; });

  const 표준진척 = 76.9; // 실제 값은 업무일 기준으로 계산, 여기선 고정

  const submit = (row) => {
    const run = () => {
      const match = { 타입: 'center', 지사: row.branch, 센터: row.center, 날짜: U.todayISO() };
      Store.upsertRow('realtime', match, {
        목표: Number(row.목표) || 0,
        실적: Number(row.실적) || 0,
        월목표: Number(row.월목표) || 0,
        월실적: Number(row.월실적) || 0,
      });
      setEditModal(null);
      toast('저장 완료', 'success');
    };
    const my = Session.get();
    if (Auth.isAdmin() || (my && my.branch === row.branch && my.center === row.center)) run();
    else requireAdmin(run);
  };

  const sendAll = () => {
    requireAdmin(async () => {
      const ok = await confirmDialog({ title: '실시간 보내기', message: '모든 센터 실적을 본부로 전송하시겠습니까?' });
      if (ok) toast('전송 완료', 'success');
    });
  };

  const RankCell = ({ rank, total }) => {
    const isTop = rank <= Math.ceil(total / 2);
    return <span className={`rank ${isTop ? 'rank-top' : 'rank-bot'}`}>{rank}</span>;
  };

  const renderTable = (title, rankNote) => (
    <div className="card">
      <div className="card-head" style={{ justifyContent: 'center', background: 'var(--gray-700)' }}>
        {title}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginLeft: 'auto' }}>표준진척 {표준진척}%</span>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th rowSpan="2">구분</th>
              <th colSpan="4">{U.todayISO().slice(5).replace('-','월 ')}일 17시 기준</th>
              <th colSpan="4">월 누적</th>
            </tr>
            <tr>
              <th>목표</th><th>실적</th><th>달성률</th><th>순위</th>
              <th>목표</th><th>실적</th><th>달성률</th><th>순위</th>
            </tr>
          </thead>
          <tbody>
            {byHq.map(r => (
              <tr key={r.name}>
                <td className="branch-cell">{r.name}</td>
                <td className="num">{U.fmtNum(r.목표)}</td>
                <td className="num">{U.fmtNum(r.실적)}</td>
                <td className="num">{r.달성률}%</td>
                <td><RankCell rank={hqRankMap[r.name]} total={HQS.length} /></td>
                <td className="num">{U.fmtNum(r.월목표)}</td>
                <td className="num">{U.fmtNum(r.월실적)}</td>
                <td className="num">{r.월달성률}%</td>
                <td><RankCell rank={hqRankMap[r.name]} total={HQS.length} /></td>
              </tr>
            ))}
            <tr className="sum-row">
              <td>합계</td>
              <td className="num">{U.fmtNum(합계.목표)}</td>
              <td className="num">{U.fmtNum(합계.실적)}</td>
              <td className="num">{U.pct(합계.실적, 합계.목표)}%</td>
              <td>-</td>
              <td className="num">{U.fmtNum(합계.월목표)}</td>
              <td className="num">{U.fmtNum(합계.월실적)}</td>
              <td className="num">{U.pct(합계.월실적, 합계.월목표)}%</td>
              <td>-</td>
            </tr>
            {byBranch.map(r => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="num">{U.fmtNum(r.목표)}</td>
                <td className="num">{U.fmtNum(r.실적)}</td>
                <td className="num">{r.달성률}%</td>
                <td><RankCell rank={brRankMap[r.name]} total={BRANCHES.length} /></td>
                <td className="num">{U.fmtNum(r.월목표)}</td>
                <td className="num">{U.fmtNum(r.월실적)}</td>
                <td className="num">{r.월달성률}%</td>
                <td><RankCell rank={brRankMap[r.name]} total={BRANCHES.length} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-head">
        <div className="page-head-title">
          <h1>실시간 실적현황</h1>
          <div className="sub">{U.todayISO()}</div>
        </div>
        <button className="back-btn" onClick={() => window.navigate('home')}>← 메인</button>
      </div>

      {/* 관리자 파일 업로드 */}
      {Auth.isAdmin() && (
        <div className="card" style={{ margin: 10 }}>
          <div className="card-head">⚙ 관리자 설정</div>
          <div style={{ padding: 10, display: 'flex', gap: 6 }}>
            {['무선(KT)', '도매(M&S)', '유선', '전일마감', '목표'].map(label => (
              <div key={label} className="file-slot">
                <div className="file-slot-title">{label}</div>
                <button className="file-slot-btn">📁 파일선택</button>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 10px 10px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }}></span>
              실발송 모드
            </label>
          </div>
        </div>
      )}

      <div className="tabs" style={{ padding: '0 10px', background: '#fff' }}>
        <button className={`tab ${tab === 'realtime' ? 'active' : ''}`} onClick={() => setTab('realtime')}>📊 실시간 실적</button>
        <button className={`tab ${tab === 'closing' ? 'active' : ''}`} onClick={() => setTab('closing')}>📋 전일마감</button>
      </div>

      <div style={{ padding: 10, background: '#fef3c7', fontSize: 11, margin: 10, borderRadius: 6, color: '#92400e' }}>
        ⚠️ 기준 날짜/시간 확인 필수 — 목표·진척률과 연동됩니다
        <div style={{ marginTop: 4, fontWeight: 700 }}>
          {new Date().getMonth() + 1}월 {new Date().getDate()}일 {new Date().getHours()}시 기준
        </div>
      </div>

      <div className="action-bar" style={{ padding: 10 }}>
        <button className="btn btn-green" onClick={sendAll}>📤 실시간 보내기</button>
        <button className="btn btn-blue">📍 지사발송</button>
        <button className="btn btn-sm btn-ghost">⚙ 매핑</button>
      </div>

      <div className="content" style={{ padding: 10 }}>
        {renderTable('도매채널 무선 실시간 실적 현황')}
        {renderTable('도매채널 유선 순신규 실시간 실적 현황')}

        {/* 센터별 */}
        <div className="card">
          <div className="card-head" style={{ justifyContent: 'center', background: 'var(--gray-700)' }}>
            센터별 무선 실적 현황
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginLeft: 'auto' }}>무실적 센터 {byCenter.filter(r => r.실적 === 0).length}</span>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>지사</th><th>센터</th>
                  <th>일목표</th><th>실적</th><th>달성률</th><th>순위</th>
                </tr>
              </thead>
              <tbody>
                {BRANCHES.map(branch => {
                  const centers = ORG[branch];
                  return centers.map((center, i) => {
                    const r = findCenter(branch, center);
                    const 목표 = r.목표 || 0, 실적 = r.실적 || 0;
                    const 달성률 = U.pct(실적, 목표);
                    const rank = cRankMap[branch + center];
                    return (
                      <tr key={branch + center} onClick={() => setEditModal({ branch, center, ...r })} style={{ cursor: 'pointer' }}>
                        {i === 0 && <td className="branch-cell" rowSpan={centers.length}>{branch.replace('지사','')}</td>}
                        <td>{center}</td>
                        <td className="num">{U.fmtNum(목표)}</td>
                        <td className="num">{U.fmtNum(실적)}</td>
                        <td className="num">{달성률}%</td>
                        <td><RankCell rank={rank} total={ALL_CENTERS.length} /></td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
          {!Auth.isAdmin() && (
            <div style={{ padding: 8, fontSize: 11, color: 'var(--gray-500)', textAlign: 'center' }}>
              * 센터 행을 클릭하면 해당 센터 실적을 입력할 수 있습니다
            </div>
          )}
        </div>
      </div>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={editModal ? `${editModal.branch} · ${editModal.center}` : ''}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setEditModal(null)}>취소</button>
          <button className="btn btn-coral" onClick={() => submit(editModal)}>저장</button>
        </>}>
        {editModal && (
          <div className="stack-y">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>일 목표</label>
              <input type="number" className="input" value={editModal.목표 || ''} onChange={e => setEditModal({ ...editModal, 목표: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>일 실적</label>
              <input type="number" className="input" value={editModal.실적 || ''} onChange={e => setEditModal({ ...editModal, 실적: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>월 목표</label>
              <input type="number" className="input" value={editModal.월목표 || ''} onChange={e => setEditModal({ ...editModal, 월목표: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>월 실적</label>
              <input type="number" className="input" value={editModal.월실적 || ''} onChange={e => setEditModal({ ...editModal, 월실적: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

window.RealtimePage = RealtimePage;
