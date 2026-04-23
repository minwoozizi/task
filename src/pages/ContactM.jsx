// 접점담당M 확인 - 원본 스타일 (3필터 + 테이블)
const ContactMPage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [fBranch, setFBranch] = useState('');
  const [fCenter, setFCenter] = useState('');
  const [fSearch, setFSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [newRow, setNewRow] = useState({ 지사: BRANCHES[0], 센터: '', 접점코드: '', 접점명: '', 사번: '' });
  const [drafts, setDrafts] = useState({});

  const data = Store.get('contactM') || [];

  const getDraft = (row) => {
    const k = `${row.지사}|${row.센터}|${row.접점코드}`;
    return drafts[k] !== undefined ? drafts[k] : (row.사번 || '');
  };

  const setDraft = (row, value) => {
    setDrafts(d => ({ ...d, [`${row.지사}|${row.센터}|${row.접점코드}`]: value }));
  };

  const save = (row) => {
    const run = () => {
      const k = `${row.지사}|${row.센터}|${row.접점코드}`;
      const value = drafts[k] !== undefined ? drafts[k] : (row.사번 || '');
      Store.upsertRow('contactM',
        { 지사: row.지사, 센터: row.센터, 접점코드: row.접점코드 },
        { 접점명: row.접점명, 사번: value }
      );
      setDrafts(d => { const nd = { ...d }; delete nd[k]; return nd; });
      toast('저장됨', 'success');
    };
    const my = Session.get();
    if (Auth.isAdmin() || (my && my.branch === row.지사 && my.center === row.센터)) run();
    else requireAdmin(run);
  };

  const remove = (row) => {
    requireAdmin(async () => {
      const ok = await confirmDialog({
        title: '삭제',
        message: `${row.접점명} (${row.접점코드}) 삭제?`,
        danger: true, okText: '삭제',
      });
      if (ok) {
        Store.deleteRow('contactM', { 지사: row.지사, 센터: row.센터, 접점코드: row.접점코드 });
        toast('삭제됨', 'success');
      }
    });
  };

  const addNew = () => {
    requireAdmin(() => {
      setNewRow({ 지사: BRANCHES[0], 센터: '', 접점코드: '', 접점명: '', 사번: '' });
      setAddModal(true);
    });
  };

  const submitNew = () => {
    if (!newRow.센터 || !newRow.접점코드 || !newRow.접점명) {
      toast('필수 항목 입력', 'error');
      return;
    }
    Store.upsertRow('contactM',
      { 지사: newRow.지사, 센터: newRow.센터, 접점코드: newRow.접점코드 },
      { 접점명: newRow.접점명, 사번: newRow.사번 || '' }
    );
    setAddModal(false);
    toast('추가됨', 'success');
  };

  const clearFilters = () => { setFBranch(''); setFCenter(''); setFSearch(''); };

  let rows = [...data];
  if (fBranch) rows = rows.filter(r => r.지사 === fBranch);
  if (fCenter) rows = rows.filter(r => r.센터 === fCenter);
  if (fSearch) rows = rows.filter(r =>
    (r.접점명 || '').includes(fSearch) ||
    (r.접점코드 || '').includes(fSearch) ||
    (r.사번 || '').includes(fSearch)
  );

  const total = data.length;
  const done = data.filter(r => r.사번).length;

  const centersOfBranch = fBranch ? (ORG[fBranch] || []) : [];

  // CSV 다운로드
  const downloadCSV = () => {
    const csv = [
      ['지사', '센터', '접점코드', '접점명', '사번'].join(','),
      ...rows.map(r => [r.지사, r.센터, r.접점코드, `"${r.접점명}"`, r.사번 || ''].join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `접점담당M_${U.todayISO()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('CSV 다운로드', 'success');
  };

  // CSV 업로드
  const fileInputRef = useRef();
  const uploadCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    requireAdmin(() => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const text = ev.target.result;
        const parsed = U.parseCSV(text);
        if (!parsed.length) {
          toast('빈 파일이거나 파싱 실패', 'error');
          return;
        }
        const confirm = await confirmDialog({
          title: 'CSV 업로드',
          message: `${parsed.length}개 행을 업로드합니다. 기존 데이터에 덮어쓰기됩니다.`,
        });
        if (!confirm) return;
        parsed.forEach(r => {
          if (!r.지사 || !r.센터 || !r.접점코드) return;
          Store.upsertRow('contactM',
            { 지사: r.지사, 센터: r.센터, 접점코드: r.접점코드 },
            { 접점명: r.접점명 || '', 사번: r.사번 || '' }
          );
        });
        toast(`${parsed.length}건 업로드`, 'success');
      };
      reader.readAsText(file, 'utf-8');
    });
    e.target.value = '';
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-head-title">
          <h1>접점담당M 확인</h1>
          <div className="sub">{U.todayISO()} · {done}/{total} 완료</div>
        </div>
        <button className="back-btn" onClick={() => window.navigate('home')}>← 메인</button>
      </div>

      <div style={{ padding: 10, background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2 }}>지사</div>
            <select className="select" value={fBranch} onChange={e => { setFBranch(e.target.value); setFCenter(''); }} style={{ padding: '6px 8px', fontSize: 12 }}>
              <option value="">전체</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b.replace('지사','')}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2 }}>센터</div>
            <select className="select" value={fCenter} onChange={e => setFCenter(e.target.value)} style={{ padding: '6px 8px', fontSize: 12 }}>
              <option value="">전체</option>
              {centersOfBranch.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2 }}>코드/명</div>
            <input type="text" className="input" value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="검색" style={{ padding: '6px 8px', fontSize: 12 }} />
          </div>
          <button onClick={clearFilters} style={{ padding: 6, color: 'var(--gray-500)', fontSize: 18 }}>✕</button>
        </div>
      </div>

      <div className="action-bar">
        <button className="btn btn-sm btn-coral" onClick={addNew}>👤 관리자</button>
        <button className="btn btn-sm btn-ghost" onClick={() => Store.pullFromServer().then(() => toast('새로고침', 'success'))}>🔄</button>
        <button className="btn btn-sm btn-ghost" onClick={downloadCSV}>⬇ CSV</button>
        <button className="btn btn-sm btn-ghost" onClick={() => fileInputRef.current.click()}>📤 CSV 업로드</button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={uploadCSV} style={{ display: 'none' }} />
      </div>

      <div className="content" style={{ padding: 10 }}>
        {rows.length === 0 ? (
          <div className="empty">
            접점담당M 데이터가 없습니다.<br/>
            "관리자" 버튼 또는 CSV 업로드로 데이터를 추가하세요.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>지사</th>
                  <th style={{ width: 60 }}>센터</th>
                  <th style={{ width: 100 }}>접점코드</th>
                  <th>접점명</th>
                  <th style={{ width: 80 }}>사번</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.지사 + r.센터 + r.접점코드 + i}>
                    <td className="branch-cell">{r.지사?.replace('지사', '')}</td>
                    <td>{r.센터}</td>
                    <td className="left" style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.접점코드}</td>
                    <td className="left">{r.접점명}</td>
                    <td>
                      <input
                        type="text" className="input-inline" style={{ width: 70 }}
                        value={getDraft(r)} placeholder="사번"
                        onChange={e => setDraft(r, e.target.value)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn btn-xs btn-blue" onClick={() => save(r)}>저장</button>
                        <button onClick={() => remove(r)} style={{ color: 'var(--red)' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="접점 추가"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setAddModal(false)}>취소</button>
          <button className="btn btn-coral" onClick={submitNew}>추가</button>
        </>}>
        <div className="stack-y">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>지사</label>
            <select className="select" value={newRow.지사} onChange={e => setNewRow({ ...newRow, 지사: e.target.value, 센터: '' })}>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>센터</label>
            <select className="select" value={newRow.센터} onChange={e => setNewRow({ ...newRow, 센터: e.target.value })}>
              <option value="">선택</option>
              {(ORG[newRow.지사] || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>접점코드 *</label>
            <input type="text" className="input" value={newRow.접점코드} onChange={e => setNewRow({ ...newRow, 접점코드: e.target.value })} placeholder="예: 1100022712" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>접점명 *</label>
            <input type="text" className="input" value={newRow.접점명} onChange={e => setNewRow({ ...newRow, 접점명: e.target.value })} placeholder="예: 월드전자랜드" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>사번</label>
            <input type="text" className="input" value={newRow.사번} onChange={e => setNewRow({ ...newRow, 사번: e.target.value })} placeholder="(선택)" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

window.ContactMPage = ContactMPage;
