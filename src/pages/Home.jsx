// 홈 대시보드
const HomePage = ({ onNav }) => {
  const [, force] = useState(0);
  useEffect(() => Store.subscribe(() => force(x => x + 1)), []);

  const incentive = Store.get('incentive') || [];
  const insurance = Store.get('insurance') || [];
  const uncompleted = Store.get('uncompleted') || [];

  const totalCenters = ALL_CENTERS.length;
  const uploadedCount = incentive.filter(r => r.완료).length;
  const uploadRate = U.pct(uploadedCount, totalCenters);

  const totalExpiring = insurance.reduce((a, r) => a + (r.만기1개월 || 0) + (r.만기2개월 || 0), 0);
  const totalExpired = insurance.reduce((a, r) => a + (r.만기 || 0), 0);

  const today = U.todayISO();
  const todayUncompleted = uncompleted.filter(r => r.날짜 === today);
  const wirelessSum = todayUncompleted.reduce((a, r) => a + (r.무선 || 0), 0);
  const wiredSum = todayUncompleted.reduce((a, r) => a + (r.유선전체 || 0), 0);

  const menus = [
    { key: 'incentive', icon: 'upload', title: '장려금투명화 업로드', desc: '센터별 업로드 현황' },
    { key: 'market', icon: 'trending', title: '시장동향보고', desc: '모델 단가 · 추가정책 · 3사 특이동향' },
    { key: 'uncompleted', icon: 'list', title: '유무선 미개동수량', desc: '무선/유선 미처리 건수' },
    { key: 'insurance', icon: 'shield', title: '보증보험증권 관리', desc: '등록/만기 임박/만기 현황' },
    { key: 'contactm', icon: 'users', title: '접점담당M 확인', desc: '판매점별 담당자 사번' },
    { key: 'realtime', icon: 'chart', title: '실시간 실적현황', desc: '본부/지사별 목표·실적·달성률' },
  ];

  return (
    <div className="stack-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">대시보드</h1>
          <p className="page-desc">도매채널 영업관리 현황 요약</p>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="kpi-card">
          <div className="kpi-label">장려금 업로드율</div>
          <div className="kpi-value">{uploadRate}%</div>
          <div className="kpi-sub">{uploadedCount} / {totalCenters} 센터</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">보증보험 만기 임박</div>
          <div className="kpi-value" style={{ color: totalExpiring > 0 ? 'var(--orange)' : undefined }}>{U.fmtNum(totalExpiring)}</div>
          <div className="kpi-sub">1-2개월 이내 만기</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">보증보험 만기 도래</div>
          <div className="kpi-value" style={{ color: totalExpired > 0 ? 'var(--red)' : undefined }}>{U.fmtNum(totalExpired)}</div>
          <div className="kpi-sub">즉시 조치 필요</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">오늘 미개동</div>
          <div className="kpi-value">{U.fmtNum(wirelessSum + wiredSum)}</div>
          <div className="kpi-sub">무선 {wirelessSum} · 유선 {wiredSum}</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        {menus.map(m => (
          <button
            key={m.key}
            className="card"
            onClick={() => onNav(m.key)}
            style={{ textAlign: 'left', cursor: 'pointer', transition: 'transform 0.15s', border: '1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-light)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={m.icon} size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{m.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

window.HomePage = HomePage;
