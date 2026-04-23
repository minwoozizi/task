// 메인 App - 원본 스타일 (홈→상세 이동)
const PAGES = {
  home: HomePage,
  incentive: IncentivePage,
  market: MarketReportPage,
  uncompleted: UncompletedPage,
  insurance: InsurancePage,
  contactm: ContactMPage,
  realtime: RealtimePage,
  settings: SettingsPage,
};

const App = () => {
  const [page, setPage] = useState(() => localStorage.getItem('mapri_page') || 'home');
  const [, force] = useState(0);

  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Session.subscribe(() => force(x => x + 1)), []);
  useEffect(() => { localStorage.setItem('mapri_page', page); }, [page]);

  const nav = (key) => setPage(key);
  window.navigate = nav;

  const isAdmin = Auth.isAdmin();
  const syncStatus = Store.syncStatus;
  const my = Session.get();
  const PageComp = PAGES[page] || HomePage;

  return (
    <div className="app">
      {/* 관리자 상태바 (상시 표시) */}
      {isAdmin && (
        <div className="admin-bar">
          <span>🛡 관리자 모드</span>
          <button onClick={() => { Auth.logout(); toast('관리자 모드 해제'); }} style={{ color: '#fff', textDecoration: 'underline', fontSize: 11 }}>
            해제
          </button>
        </div>
      )}

      {/* 상단 유틸바 */}
      <div style={{ padding: '6px 10px', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {page !== 'home' && (
            <button className="btn btn-xs btn-ghost" onClick={() => nav('home')}>🏠 홈</button>
          )}
          {my && (
            <span className="badge badge-blue">📍 {my.center}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className={`sync-badge ${syncStatus === 'ok' ? 'ok' : syncStatus === 'syncing' ? 'syncing' : syncStatus === 'error' ? 'error' : 'idle'}`}>
            <span className="dot"></span>
            {syncStatus === 'ok' ? '실시간' : syncStatus === 'syncing' ? '동기화' : syncStatus === 'error' ? '오류' : '대기'}
          </span>
          {isAdmin ? (
            <span className="admin-badge">
              <span className="dot"></span>관리자
            </span>
          ) : (
            <button className="btn btn-xs btn-ghost" onClick={() => requireAdmin(() => {})}>
              🔒 관리자
            </button>
          )}
          <button className="btn btn-xs btn-ghost" onClick={() => nav('settings')}>⚙</button>
        </div>
      </div>

      <main>
        <PageComp onNav={nav} />
      </main>

      <ToastWrap />
      <AdminGateModal />
      <ConfirmModal />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
