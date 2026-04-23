// 접점담당M 확인
const ContactMPage = () => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);

  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [newRow, setNewRow] = useState({ 지사: BRANCHES[0], 센터: '', 접점코드: '', 접점명: '', 사번: '' });

  const data = Store.get('contactM') || [];

  const updateField = (row, field, value) => {
    const run = () => {
      Store.upsertRow('contactM',
        { 지사: row.지사, 센터: row.센터, 접점코드: row.접점코드 },
        { 접점명: row.접점명, 사번: row.사번, [field]: value }
      );
    };
    const my = Session.get();
    if (Auth.isAdmin() || (my && my.branch === row.지사 && my.center === row.센터)) {
      run();
    } else {
      requireAdmin(run);
    }
  };

  const remove = (row) => {
    requireAdmin(async () => {
      const ok = await confirmDialog({
        title: '삭제 확인',
        message: `${row.접점명}(${row.접점코드})를 삭제하시겠습니까?`,
        danger: true, okText: '삭제',
      });
      if (ok) {
        Store.deleteRow('contactM', { 지사: row.지사, 센터: row.센터, 접점코드: row.접점코드 });
        toast('삭제 완료', 'success');
      }
    });
  };

  const addNew = () => {
    requireAdmin(() => setAddModal(true));
  };

  const submitNew = () => {
    if (!newRow.센터 || !newRow.접점코드 || !newRow.접점명) {
      toast('센터/접점코드/접점명 모두 입력', 'error');
      return;
    }
    Store.upsertRow('contactM',
      { 지사: newRow.지사, 센터: newRow.센터, 접점코드: newRow.접점코드 },
      { 접점명: newRow.접점명, 사번: newRow.사번 || '' }
    );
    setAddModal(false);
    setNewRow({ 지사: BRANCHES[0], 센터: '', 접점코드: '', 접점명: '', 사번: '' });
    toast('추가 완료', 'success');
  };

  let rows = [...data];
  if (filter) rows = rows.filter(r => r.지사 === filter);
  if (search) rows = rows.filter(r =>
    (r.접점명 || '').includes(search) ||
    (r.접점코드 || '').includes(search) ||
    (r.사번 || '').includes(search) ||
    (r.센터 || '').includes(search)
  );

  const missingCount = data.filter(r => !r.사번).length;

  return (
    <div className="stack-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">접점담당M 확인</h1>
          <p className="page-desc">판매점별 담당자 사번 관리 · 총 {data.length}개 · 사번 미입력 {missingCount}</p>
        </div>
        <div className="toolbar">
          <input type="text" className="input" placeholder="검색" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 150 }} />
          <select className="select" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 130 }}>
            <option value="">전체 지사</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <button className="btn btn-coral" onClick={addNew}><Icon name="plus" size={14}/> 추가</button>
        </div>
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">데이터가 없습니다. 우측 상단 "추가" 버튼으로 등록하세요.</div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>지사</th><th>센터</th><th>접점코드</th><th>접점명</th><th>사번</th><th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.지사 + r.센터 + r.접점코드 + i}>
                    <td>{r.지사}</td>
                    <td>{r.센터}</td>
                    <td>{r.접점코드}</td>
                    <td>{r.접점명}</td>
                    <td>
                      <input
                        type="text"
                        className="input"
                        value={r.사번 || ''}
                        onChange={e => updateField(r, '사번', e.target.value)}
                        placeholder="사번 입력"
                        style={{ width: 140, background: r.사번 ? '#fff' : '#fff5f5' }}
                      />
                    </td>
                    <td>
                      <button onClick={() => remove(r)} style={{ color: 'var(--red)' }}><Icon name="trash" size={14}/></button>
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
        <div className="form-row">
          <label className="form-label">지사</label>
          <select className="select" value={newRow.지사} onChange={e => setNewRow({ ...newRow, 지사: e.target.value, 센터: '' })}>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">센터</label>
          <select className="select" value={newRow.센터} onChange={e => setNewRow({ ...newRow, 센터: e.target.value })}>
            <option value="">선택</option>
            {(ORG[newRow.지사] || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">접점코드</label>
          <input type="text" className="input" value={newRow.접점코드} onChange={e => setNewRow({ ...newRow, 접점코드: e.target.value })} placeholder="예: KT-001" />
        </div>
        <div className="form-row">
          <label className="form-label">접점명(판매점명)</label>
          <input type="text" className="input" value={newRow.접점명} onChange={e => setNewRow({ ...newRow, 접점명: e.target.value })} />
        </div>
        <div className="form-row">
          <label className="form-label">사번</label>
          <input type="text" className="input" value={newRow.사번} onChange={e => setNewRow({ ...newRow, 사번: e.target.value })} placeholder="(선택)" />
        </div>
      </Modal>
    </div>
  );
};

window.ContactMPage = ContactMPage;
