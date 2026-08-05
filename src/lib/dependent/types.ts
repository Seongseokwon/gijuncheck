/** 피부양자 판정 입출력 타입 */

/** 가입자와의 관계 */
export type Relation =
  /** 배우자 */
  | 'spouse'
  /** 직계존속 — 부모, 조부모 */
  | 'linealAscendant'
  /** 직계비속 — 현재 공개 모델은 자녀만 지원 */
  | 'linealDescendant'
  /** 배우자의 직계존속 — 시부모, 장인장모 */
  | 'spouseAscendant'
  /** 배우자의 직계비속 — 배우자의 자녀 */
  | 'spouseDescendant'
  /** 형제자매 */
  | 'sibling';

export const RELATION_LABEL: Record<Relation, string> = {
  spouse: '배우자',
  linealAscendant: '직계존속 (부모·조부모)',
  linealDescendant: '직계비속 (자녀)',
  spouseAscendant: '배우자의 직계존속 (시부모·장인장모)',
  spouseDescendant: '배우자의 직계비속',
  sibling: '형제자매',
};

/** 연간 소득 (원) */
export interface Income {
  /** 사업소득 */
  business: number;
  /** 근로소득 */
  wage: number;
  /** 공적연금소득 — 사적연금은 합산 대상이 아님 */
  pension: number;
  /** 금융소득 — 이자 + 배당 */
  financial: number;
  /** 기타소득 */
  other: number;
}

/** 기혼 피부양자의 배우자 확인에 사용하는 연간 소득·재산 정보 */
export interface SpouseDetails {
  income: Income;
  /** 배우자의 사업자등록 보유 여부 */
  businessRegistered: boolean;
  /** 배우자의 장애인·국가유공상이자 등 특례 여부 */
  disabled: boolean;
  /** 배우자의 재산세 과세표준 (원) */
  propertyTaxBase: number;
}

export type MaritalStatus = 'single' | 'married' | 'divorcedOrWidowed';

export interface DependentInput {
  relation: Relation;
  /** 가입자와 동거 여부 */
  cohabiting: boolean;
  /** 만 나이 */
  age: number;
  /** 혼인 여부 */
  married: boolean;
  /** 현재 혼인 상태. 기존 boolean 입력과의 호환을 위해 married도 함께 유지한다. */
  maritalStatus?: MaritalStatus;
  /** 장애인 · 국가유공상이자 · 보훈보상대상자 */
  disabled: boolean;
  income: Income;
  /** 사업자등록 보유 여부 */
  businessRegistered: boolean;
  /** 재산세 과세표준 (원) — 실거래가·공시가격 아님 */
  propertyTaxBase: number;
  /**
   * 비동거 직계존속 판정용.
   * 대상자와 동거하는 다른 형제자매가 있고 그 형제자매에게 소득이 있으면 true.
   * 이 경우 그 형제자매가 부양하는 것으로 보아 신청인의 피부양자가 될 수 없다.
   */
  cohabitingSiblingHasIncome?: boolean;
  /** 기혼 피부양자(가입자의 배우자가 아닌 경우)의 배우자 자료 */
  spouse?: SpouseDetails;
}

export type JudgeStep = 'support' | 'income' | 'property';

export const STEP_LABEL: Record<JudgeStep, string> = {
  support: '부양요건',
  income: '소득요건',
  property: '재산요건',
};

export interface StepResult {
  step: JudgeStep;
  passed: boolean;
  /** 사용자에게 보여줄 설명 */
  message: string;
  /** 근거 조항 */
  basis: string;
}

export interface JudgeResult {
  /** 최종 판정 */
  eligible: boolean;
  /** 합산소득 (원) */
  totalIncome: number;
  /** 기혼 피부양자 동반 확인에 사용한 배우자의 합산소득 (원) */
  spouseTotalIncome?: number;
  /** 단계별 결과 — 탈락 시 그 단계까지만 채워진다 */
  steps: StepResult[];
  /** 탈락한 단계 */
  failedAt?: JudgeStep;
  /** 기준 연도 */
  year: number;
}
