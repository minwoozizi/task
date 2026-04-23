// 조직 데이터 - 원본 사이트 기준
// 본부 4개 / 지사 7개 / 센터 42개

const HQ = {
  "강북본부": ["강북지사", "강남지사"],
  "서부본부": ["강서지사", "충청지사"],
  "동부본부": ["대구지사", "부산지사"],
  "호남본부": ["호남지사"],
};

const ORG = {
  "강북지사": ["고양", "서대문", "광진", "구리", "노원", "의정부", "강릉", "원주", "춘천"],
  "강남지사": ["강남", "송파", "분당", "수원", "용인", "평택"],
  "강서지사": ["강서", "구로", "부천", "서인천", "안산", "인천"],
  "부산지사": ["동부산", "북부산", "서부산", "울산", "진주", "창원"],
  "대구지사": ["동대구", "서대구", "구미", "안동", "포항"],
  "충청지사": ["동대전", "서대전", "서산", "천안", "충북"],
  "호남지사": ["목포", "광주", "순천", "전북", "제주"],
};

const BRANCHES = Object.keys(ORG);
const HQS = Object.keys(HQ);
const ALL_CENTERS = Object.entries(ORG).flatMap(([b, cs]) => cs.map(c => ({ branch: b, center: c, hq: branchToHq(b) })));

function branchToHq(branch) {
  for (const [hq, branches] of Object.entries(HQ)) {
    if (branches.includes(branch)) return hq;
  }
  return null;
}

// 지사별 색상 (원본 매칭)
const BRANCH_COLOR = {
  "강북지사": "#3b82f6",
  "강남지사": "#ec4899",
  "강서지사": "#10b981",
  "부산지사": "#f59e0b",
  "대구지사": "#8b5cf6",
  "충청지사": "#06b6d4",
  "호남지사": "#ef4444",
};

// 모델 리스트 (원본)
const MODELS = ["아이폰17", "폴드7", "플립7", "S26", "A17", "전용"];
const POLICY_ITEMS = ["부가서비스", "단말보험", "추가지원금"];

window.HQ = HQ;
window.HQS = HQS;
window.ORG = ORG;
window.BRANCHES = BRANCHES;
window.ALL_CENTERS = ALL_CENTERS;
window.BRANCH_COLOR = BRANCH_COLOR;
window.MODELS = MODELS;
window.POLICY_ITEMS = POLICY_ITEMS;
window.branchToHq = branchToHq;
