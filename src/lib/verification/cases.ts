/**
 * 공개 사례 기록표 — `/verification-policy/`
 *
 * `docs/03-검증기록.md`의 대조 사례를 사용자에게 공개하는 형태로 옮긴 것이다.
 * 이 파일이 화면의 단일 출처이며, 문서와 값이 어긋나면 문서를 기준으로 고친다.
 *
 * ## 왜 사례를 그대로 공개하는가
 *
 * 검증 "방법론"은 누구나 쓸 수 있다. 실제로 대조한 개별 사례의 입력값과 숫자를
 * 공개하는 것이 방법론과 다른 지점이다. 그래서 **일치한 사례만 고르지 않는다.**
 * 미확인 사례(`unverified`)도 같은 표에 남긴다.
 *
 * ## 대조 등급을 나눈 이유
 *
 * "검증 완료" 한 단어로 뭉치면 공단 모의계산과 직접 대조한 것과 법령 산식을
 * 스스로 재현한 것이 구분되지 않는다. 후자를 전자처럼 보이게 하는 것은
 * 이 서비스가 팔고 있는 신뢰를 갉아먹는다. 그래서 `VerificationTier`로 나눈다.
 *
 * 개인정보 원칙: 여기 있는 입력값은 전부 **합성 경계값**이다. 실제 이용자의
 * 입력이나 운영자 개인의 소득·재산 자료는 들어가지 않는다.
 */

/** 대조 강도. 위에서 아래로 갈수록 약하다. */
export type VerificationTier =
  /** 공단 모의계산기에 같은 값을 넣어 화면 결과와 직접 비교했다. 가장 강한 근거. */
  | 'nhis-simulator'
  /** 공단이 공개한 안내문의 조건을 같은 입력에 적용해 재현했다. 공단 화면 결과는 아니다. */
  | 'nhis-guidance'
  /** 법령·고시의 산식을 손으로 적용한 값과 코드 출력을 비교했다. 외부 대조가 아니다. */
  | 'statute'
  /** 대조를 시도했으나 확보하지 못했다. 숨기지 않고 남긴다. */
  | 'unverified';

export interface VerificationTierMeta {
  /** 배지에 쓰는 짧은 이름 */
  label: string;
  /** 이 등급이 보장하는 것과 보장하지 않는 것 */
  description: string;
  /** 배지 색 — 강도에 따라 시각적으로 구분한다 */
  tone: 'strong' | 'medium' | 'weak' | 'open';
}

export const VERIFICATION_TIERS: Record<VerificationTier, VerificationTierMeta> = {
  'nhis-simulator': {
    label: '공단 모의계산 직접 대조',
    description:
      '국민건강보험공단 모의계산기에 같은 값을 입력하고 화면에 표시된 금액과 비교했습니다. 공단의 실제 고지액이 아니라 공단 모의계산 결과와의 비교입니다.',
    tone: 'strong',
  },
  'nhis-guidance': {
    label: '공단 공개 안내 기준 재현',
    description:
      '공단이 공개한 자격 안내의 조건을 같은 입력에 적용해 결과를 재현했습니다. 공단 로그인 조회 화면의 결과나 실제 신고 처리 결과가 아닙니다.',
    tone: 'medium',
  },
  statute: {
    label: '법령·고시 산식 자체 재현',
    description:
      '법령과 보험료 고시의 산식을 같은 입력에 손으로 적용한 값과 코드 출력을 비교했습니다. 외부 기관 결과와의 대조가 아니므로, 산식 해석 자체가 틀렸다면 이 대조로는 걸러지지 않습니다.',
    tone: 'weak',
  },
  unverified: {
    label: '미확인',
    description:
      '대조를 시도했으나 결과를 확보하지 못한 사례입니다. 확인 경로를 찾으면 갱신합니다.',
    tone: 'open',
  },
};

export interface VerificationCase {
  /** 표에 표시하는 사례 번호 */
  id: string;
  /** 합성 입력값 요약 */
  input: string;
  /** 근거 쪽에서 나오는 값 */
  expected: string;
  /** 기준체크 코드의 출력 */
  actual: string;
  /** 두 값의 차이. 금액은 원 단위, 판정은 일치 여부 */
  diff: string;
  /** 일치 여부 — 색상과 스크린리더 문구에 함께 쓴다 */
  result: 'match' | 'mismatch' | 'unknown';
  /** 대조한 날 */
  checkedOn: string;
  /** 이 사례에서 무엇을 확인했는지, 또는 왜 확인하지 못했는지 */
  note: string;
}

export interface VerificationCaseGroup {
  /** 앵커 id */
  id: string;
  title: string;
  tier: VerificationTier;
  /** 이 묶음이 무엇을 대조한 것인지 한 문단 */
  summary: string;
  /** `기대값` 열의 실제 헤더 — 묶음마다 근거가 다르므로 뭉뚱그리지 않는다 */
  expectedLabel: string;
  /** 대조에 사용한 출처 */
  source: { label: string; href: string };
  cases: readonly VerificationCase[];
}

const NHIS_REGIONAL_SIMULATOR = {
  label: '국민건강보험공단 지역보험료 모의계산',
  href: 'https://www.nhis.or.kr/nhis/minwon/retrieveLocalCalcView.do?toDt=',
};

const NHIS_DEPENDENT_GUIDE = {
  label: '국민건강보험공단 피부양자 자격취득 안내',
  href: 'https://www.nhis.or.kr/nhis/minwon/wbhapa01000m01.do?mode=view&articleNo=10946887',
};

const VOLUNTARY_LAW = {
  label: '국민건강보험법 제110조(임의계속가입자)',
  href: 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1031508663',
};

/**
 * 지역가입자 보험료 — 공단 모의계산 직접 대조.
 *
 * 공단 입력 화면이 만원 단위 정수만 받으므로 1원 경계는 여기 없다.
 * 그 경계는 `src/lib/premium/regional.test.ts`의 단위 테스트가 맡는다.
 */
const REGIONAL_CASES: readonly VerificationCase[] = [
  ['C01', '소득 0원 / 재산 0원', '22,800원', '하한 보험료 적용'],
  ['C02', '사업소득 300만원', '22,800원', '하한 구간 유지'],
  ['C03', '사업소득 500만원', '33,880원', '소득점수 반영 시작'],
  ['C04', '재산세 과세표준 1억원', '22,800원', '기본공제 1억원으로 재산점수 0점'],
  ['C05', '재산세 과세표준 1억 1만원', '28,070원', '공제 직후 첫 등급'],
  ['C06', '재산세 과세표준 1억 450만원', '28,070원', '같은 등급 상단'],
  ['C07', '재산세 과세표준 1억 451만원', '33,330원', '등급 경계에서 금액 변화'],
  ['C08', '근로소득 500만원 + 연금소득 500만원', '33,880원', '근로·연금 50% 반영'],
  ['C09', '사업소득 500만원 + 근로소득 500만원', '50,830원', '평가율이 다른 소득의 합산'],
  ['C10', '재산세 과세표준 3억 6,000만원', '180,490원', '중간 재산 구간'],
  ['C11', '사업소득 8억원', '5,195,110원', '고소득 구간'],
  ['C12', '전세보증금 4억원 + 월세 50만원', '57,730원', '전월세 평가금액 환산식'],
  [
    'C13',
    '‘사업소득 등’ 입력란 900만원',
    '61,000원',
    '공단 화면은 금융소득을 따로 받지 않고 사업소득 등에 합산한다. 지역보험료에 금융소득 1,000만원 문턱을 적용하지 않는 근거가 된 사례',
  ],
].map(([id, input, amount, note]) => ({
  id,
  input,
  expected: amount,
  actual: amount,
  diff: '0원',
  result: 'match' as const,
  checkedOn: '2026-08-05',
  note,
}));

/** 피부양자 자격 판정 — 공단 공개 안내 기준 재현. */
const DEPENDENT_CASES: readonly VerificationCase[] = [
  {
    id: 'A01',
    input: '직계존속 / 동거 / 소득 0원 / 과세표준 0원',
    expected: '가능 — 관계·부양·소득·재산 기준 충족',
    actual: '가능',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-03',
    note: '기본 통과 경로',
  },
  {
    id: 'A02',
    input: '배우자 / 합산소득 2,000만원 / 과세표준 0원',
    expected: '가능 — 연간 합산소득 2,000만원 이하',
    actual: '가능',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-03',
    note: '기준값과 같을 때 통과하는지 확인 (초과가 아니라 이하)',
  },
  {
    id: 'A03',
    input: '배우자 / 사업자등록 있음 / 사업소득 1원 / 과세표준 0원',
    expected: '불가 — 사업자등록자는 사업소득이 없어야 함',
    actual: '소득요건 탈락',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-03',
    note: '사업자등록이 있으면 500만원 예외가 적용되지 않는다',
  },
  {
    id: 'A04',
    input: '배우자 / 과세표준 5억 4,000만원 + 1원 / 소득 1,000만원',
    expected: '가능 — 과표 5.4억 초과~9억 이하이고 소득 1,000만원 이하',
    actual: '가능',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-03',
    note: '재산 중간 구간은 소득 조건이 함께 걸린다',
  },
  {
    id: 'A05',
    input: '배우자 / 과세표준 9억원 + 1원 / 소득 0원',
    expected: '불가 — 과표 9억원 초과',
    actual: '재산요건 탈락',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-03',
    note: '소득이 0원이어도 재산 상한에서 탈락',
  },
  {
    id: 'A06',
    input: '형제자매 / 미혼·동거·만 29세 / 과세표준 1억 8,000만원 + 1원',
    expected: '불가 — 형제자매 과표 1.8억원 초과',
    actual: '재산요건 탈락',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-03',
    note: '부양요건은 통과하고 재산요건에서만 탈락하는지 확인',
  },
  {
    id: 'A07',
    input: '형제자매 / 미혼·동거·만 30세 / 과세표준 0원',
    expected: '불가 — 30세 미만·65세 이상 등 한정 요건 미충족',
    actual: '부양요건 탈락',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-03',
    note: '만 29세(A06)와 만 30세에서 탈락 단계가 달라지는지 확인',
  },
  {
    id: 'A08',
    input: '직계비속 / 비동거·기혼 / 소득 0원 / 과세표준 0원',
    expected: '불가 — 비동거 직계비속의 혼인 요건 미충족',
    actual: '부양요건 탈락',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-03',
    note: '소득·재산을 보기 전에 관계 단계에서 걸러진다',
  },
  {
    id: 'A09',
    input: '기혼 동거 자녀 / 대상자 소득 0원 / 배우자 소득 2,000만원 / 각 과세표준 0원',
    expected: '가능 — 대상자와 배우자가 각각 2,000만원 이하',
    actual: '가능',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-05',
    note: '두 사람의 소득을 하나로 더하지 않는다. 각자 기준을 넘는지 본다',
  },
  {
    id: 'A10',
    input: '기혼 동거 자녀 / 대상자 소득 0원 / 배우자 소득 2,000만원 + 1원',
    expected: '불가 — 배우자 소득요건 초과',
    actual: '소득요건 탈락',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-05',
    note: '대상자 본인이 무소득이어도 배우자 쪽에서 탈락',
  },
  {
    id: 'A11',
    input: '기혼 동거 자녀 / 대상자 과세표준 0원 / 배우자 과세표준 9억원 + 1원',
    expected: '불가 — 배우자 재산요건 초과',
    actual: '재산요건 탈락',
    diff: '일치',
    result: 'match',
    checkedOn: '2026-08-05',
    note: '배우자 재산도 별도 확인 대상',
  },
];

/** 임의계속가입 — 법령·고시 산식 자체 재현. */
const VOLUNTARY_CASES: readonly VerificationCase[] = [
  ['V01', '평균 보수월액 400만원 / 보수 외 소득 0원', '143,800원', '7.19%에 50% 경감 적용'],
  ['V02', '평균 보수월액 400만원 / 사업소득 2,000만원', '143,800원', '기준선 이하라 추가 보험료 없음'],
  ['V03', '평균 보수월액 400만원 / 사업소득 3,000만원', '203,710원', '초과 1,000만원을 100% 반영'],
  [
    'V04',
    '평균 보수월액 400만원 / 사업소득 3,000만원 + 연금소득 1,000만원',
    '248,650원',
    '초과분 중 연금은 50%만 반영',
  ],
  ['V05', '평균 보수월액 10만원 / 보수 외 소득 0원', '20,160원', '고시 하한 적용'],
  ['V06', '평균 보수월액 250만원 / 보수 외 소득 0원', '89,870원', '재산을 반영하지 않는다'],
  ['V07', '평균 보수월액 400만원 / 사업소득 10억원', '4,735,540원', '보수·보수 외 상한을 각각 적용'],
  ['V08', '직장가입 통산 11개월', '비교 불가', '18개월 중 12개월 미만이면 자격 없음'],
  ['V09', '직장가입 통산 12개월', '비교 가능', '최소 자격 충족 경계'],
].map(([id, input, value, note]) => ({
  id,
  input,
  expected: value,
  actual: value,
  diff: '일치',
  result: 'match' as const,
  checkedOn: '2026-08-03',
  note,
}));

/**
 * 미확인 사례.
 *
 * 이 표를 만든 이유의 절반이 이 묶음이다. 공단 로그인 화면은 이용자 본인의
 * 현재 자료를 불러오는 방식이라 합성 금액을 넣을 수 없었다. 그래서 아래 두
 * 사례는 단위 테스트로만 확인된 상태이고, 그 사실을 표에 그대로 둔다.
 */
const UNVERIFIED_CASES: readonly VerificationCase[] = [
  {
    id: 'D03',
    input: '배우자 / 사업자등록 있음 / 사업소득 1원 / 과세표준 0원',
    expected: '미확보',
    actual: '소득요건 탈락',
    diff: '대조 불가',
    result: 'unknown',
    checkedOn: '2026-08-03',
    note: '공단 로그인 조회 화면이 사업소득을 임의 입력받지 않아 합성 경계값을 넣을 수 없었습니다. 현재는 단위 테스트와 공개 안내 재현(A03)까지만 확인된 상태입니다.',
  },
  {
    id: 'D04',
    input: '배우자 / 소득 0원 / 과세표준 9억원 + 1원',
    expected: '미확보',
    actual: '재산요건 탈락',
    diff: '대조 불가',
    result: 'unknown',
    checkedOn: '2026-08-03',
    note: '같은 이유로 과세표준을 임의 입력할 수 없었습니다. 단위 테스트와 공개 안내 재현(A05)까지만 확인된 상태입니다.',
  },
];

export const VERIFICATION_CASE_GROUPS: readonly VerificationCaseGroup[] = [
  {
    id: 'cases-regional',
    title: '지역가입자 보험료',
    tier: 'nhis-simulator',
    summary:
      '공단 모의계산기에 같은 값을 입력하고 화면 금액과 비교했습니다. 공단 입력란이 만원 단위 정수만 받으므로 1원 단위 경계는 이 표가 아니라 코드 단위 테스트에서 확인합니다.',
    expectedLabel: '공단 모의계산 결과',
    source: NHIS_REGIONAL_SIMULATOR,
    cases: REGIONAL_CASES,
  },
  {
    id: 'cases-dependent',
    title: '피부양자 자격 판정',
    tier: 'nhis-guidance',
    summary:
      '공단이 공개한 자격 안내의 조건을 같은 입력에 적용해 결과를 재현했습니다. 공단 로그인 조회 화면의 결과가 아니므로, 아래 「확인하지 못한 사례」를 함께 봐 주세요.',
    expectedLabel: '공단 공개 안내 기준',
    source: NHIS_DEPENDENT_GUIDE,
    cases: DEPENDENT_CASES,
  },
  {
    id: 'cases-voluntary',
    title: '임의계속가입 비교',
    tier: 'statute',
    summary:
      '법령과 보험료 고시의 산식을 같은 입력에 적용한 값과 코드 출력을 비교했습니다. 외부 기관 결과와의 대조가 아니라 자체 재현이며, 실제 고지액은 공단이 확인한 보수 외 소득 자료에 따라 달라집니다.',
    expectedLabel: '법령·고시 산식 적용값',
    source: VOLUNTARY_LAW,
    cases: VOLUNTARY_CASES,
  },
  {
    id: 'cases-unverified',
    title: '확인하지 못한 사례',
    tier: 'unverified',
    summary:
      '대조를 시도했지만 결과를 확보하지 못한 사례입니다. 표에서 빼지 않고 사유와 함께 남깁니다.',
    expectedLabel: '공단 결과',
    source: NHIS_DEPENDENT_GUIDE,
    cases: UNVERIFIED_CASES,
  },
];

export interface VerificationCaseSummary {
  /** 전체 사례 수 (미확인 포함) */
  total: number;
  /** 근거와 일치한 사례 수 */
  matched: number;
  /** 근거와 다른 결과가 나온 사례 수 */
  mismatched: number;
  /** 확인하지 못한 사례 수 */
  unknown: number;
  /** 가장 최근 대조일 */
  lastCheckedOn: string;
}

/**
 * 표 상단 요약. 하드코딩하지 않고 계산한다.
 *
 * 사례를 추가하고 요약 숫자를 같이 고치는 것을 잊으면, 검증을 자랑하는
 * 페이지에서 숫자가 틀리는 최악의 형태가 된다.
 */
export function summarizeVerificationCases(
  groups: readonly VerificationCaseGroup[] = VERIFICATION_CASE_GROUPS,
): VerificationCaseSummary {
  const cases = groups.flatMap((group) => group.cases);

  return {
    total: cases.length,
    matched: cases.filter((c) => c.result === 'match').length,
    mismatched: cases.filter((c) => c.result === 'mismatch').length,
    unknown: cases.filter((c) => c.result === 'unknown').length,
    lastCheckedOn: cases.reduce(
      (latest, c) => (c.checkedOn > latest ? c.checkedOn : latest),
      '',
    ),
  };
}
