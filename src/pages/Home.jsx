// 홈 - 원본 스타일 카드 리스트
const HomePage = ({ onNav }) => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);

  const incentive = Store.get('incentive') || [];
  const insurance = Store.get('insurance') || [];
  const contactM = Store.get('contactM') || [];
  const market = Store.get('market') || [];

  const totalCenters = ALL_CENTERS.length;
  const uploadedCount = incentive.filter(r => r.완료).length;

  // 접점담당M 미확인 (사번 없는 것)
  const contactMissing = contactM.filter(r => !r.사번).length;
  const contactTotal = contactM.length;

  // 센터별 미확인 접점 수 집계
  const missingByCenter = {};
  contactM.filter(r => !r.사번).forEach(r => {
    const k = r.센터;
    missingByCenter[k] = (missingByCenter[k] || 0) + 1;
  });

  const menus = [
    {
      key: 'incentive', icon: '✅', iconBg: '#dcfce7',
      title: '장려금투명화 업로드',
      desc: '센터별 업로드 이행 여부 확인',
      stat: `${uploadedCount}/${totalCenters}`,
    },
    {
      key: 'market', icon: '📊', iconBg: '#eff6ff',
      title: '시장동향보고',
      desc: '매주 화/금요일 · 14시 까지',
      stat: `${market.filter(m => m.완료).length}/${HQS.length}`,
    },
    {
      key: 'uncompleted', icon: '〰️', iconBg: '#fef3c7',
      title: '유무선 미개동수량',
      desc: '무선 개통 & 유선 신규 접수 대기건 취합',
    },
    {
      key: 'insurance', icon: '📄', iconBg: '#f0fdf4',
      title: '보증보험증권 관리',
      desc: '판매점 보증보험증권 관리',
    },
    {
      key: 'contactm', icon: '👤', iconBg: '#fef2f2',
      title: '접점담당M 확인',
      desc: `미확인: ${contactMissing}개`,
      special: 'contactm',
    },
    {
      key: 'realtime', icon: '📈', iconBg: '#fef3c7',
      title: '실시간 실적현황 (도강팀)',
      desc: '무선/유선 실적 장표',
    },
  ];

  return (
    <div>
      <div className="home-title">
        <h1>도매 영업관리 포털</h1>
        <div className="date">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-').replace(/ /g, '').replace(/-$/, '')}</div>
        <div className="divider"></div>
      </div>

      <div style={{ padding: '0 10px' }}>
        {menus.map(m => (
          <button key={m.key} className="menu-card" onClick={() => onNav(m.key)}>
            <div className="menu-card-icon" style={{ background: m.iconBg }}>{m.icon}</div>
            <div className="menu-card-body">
              <div className="menu-card-title">{m.title}</div>
              <div className="menu-card-desc">{m.desc}</div>
              {m.special === 'contactm' && Object.keys(missingByCenter).length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(missingByCenter).slice(0, 10).map(([center, n]) => (
                    <span key={center} className="badge badge-coral" style={{ fontSize: 10 }}>
                      {center} {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="menu-card-chev">›</div>
          </button>
        ))}
      </div>

      <div style={{ padding: '4px 10px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-sm btn-outline-coral" onClick={() => {
          if (confirm('토스트 메시지를 모두 삭제하시겠습니까?')) toast('메시지 삭제됨', 'success');
        }}>🗑 메시지삭제</button>
        <button className="btn btn-sm btn-coral" onClick={() => onNav('realtime')}>📊 입력현황</button>
      </div>
    </div>
  );
};

window.HomePage = HomePage;
