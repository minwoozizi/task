// 메인 App
const NAV = [
  { key: 'home', label: '대시보드', icon: 'home' },
  { key: 'incentive', label: '장려금투명화', icon: 'upload' },
  { key: 'market', label: '시장동향보고', icon: 'trending' },
  { key: 'uncompleted', label: '유무선 미개동', icon: 'list' },
  { key: 'insurance', label: '보증보험증권', icon: 'shield' },
  { key: 'contactm', label: '접점담당M', icon: 'users' },
  { key: 'realtime', label: '실시간 실적', icon: 'chart' },
  { key: 'settings', label: '설정', icon: 'settings' },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, force] = useState(0);

  useEffect(() => Auth.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);
  useEffect(() => Session.subscribe(() => force(x => x + 1)), []);

  useEffect(() => { localStorage.setItem('mapri_page', page); }, [page]);

  const nav = (key) => {
    setPage(key);
    setSidebarOpen(false);
  };

  const isAdmin = Auth.isAdmin();
  const syncStatus = Store.syncStatus;
  const my = Session.get();
  const PageComp = PAGES[page] || HomePage;

  const currentTitle = NAV.find(n => n.key === page)?.label || '대시보드';

  return (
    <div className="app">
      <div className={`backdrop-mobile ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">도매채널 영업관리</div>
          <div className="sidebar-sub">KT 도매 M&S 포털</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button key={n.key} className={`nav-item ${page === n.key ? 'active' : ''}`} onClick={() => nav(n.key)}>
              <span className="nav-item-icon"><Icon name={n.icon} size={18} /></span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          v2.0 · Supabase 연동
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="header-left">
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              <Icon name="menu" size={20} />
            </button>
            <h2 className="header-title">{currentTitle}</h2>
          </div>
          <div className="header-right">
            {my && (
              <span className="badge badge-blue" style={{ fontSize: 11 }}>
                <Icon name="building" size={12} style={{ marginRight: 4 }} /> {my.center}
              </span>
            )}
            <span className={`sync-indicator ${syncStatus === 'ok' ? 'ok' : syncStatus === 'syncing' ? 'syncing' : syncStatus === 'error' ? 'error' : 'idle'}`}>
              <span className="dot"></span>
              {syncStatus === 'ok' ? '실시간' : syncStatus === 'syncing' ? '동기화' : syncStatus === 'error' ? '오류' : '대기'}
            </span>
            {isAdmin ? (
              <span className="admin-badge">
                <span className="dot"></span>관리자
                <button onClick={() => { Auth.logout(); toast('관리자 모드 해제'); }} style={{ color: '#fff', marginLeft: 4, padding: 0 }}>
                  <Icon name="x" size={12} />
                </button>
              </span>
            ) : (
              <button className="btn btn-sm btn-ghost" onClick={() => requireAdmin(() => {})}>
                <Icon name="lock" size={12} /> 관리자 인증
              </button>
            )}
          </div>
        </header>

        <main className="content">
          <PageComp onNav={nav} />
        </main>
      </div>

      <ToastWrap />
      <AdminGateModal />
      <ConfirmModal />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
